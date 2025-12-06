import { GoogleGenAI, Schema, Type } from "@google/genai";
import { DecisionInput, AnalysisResult, OptionItem } from "../types";

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    safetyWarning: {
      type: Type.STRING,
      description: "If the input involves self-harm, violence, or emergencies, put a warning here. Otherwise null.",
      nullable: true,
    },
    summary: {
      type: Type.STRING,
      description: "Clarify the decision in one sentence.",
    },
    changesFromPrevious: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "If this is a refinement, list 1-3 bullet points explaining exactly what changed compared to the previous version (e.g., 'Increased weight of Cost', 'Added option X'). If it is the first analysis, return an empty array.",
      nullable: true
    },
    criteriaAnalysis: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          weight: { type: Type.NUMBER },
          explanation: { type: Type.STRING, description: "Why it matters." },
        },
        required: ["name", "weight", "explanation"],
      },
    },
    optionsAnalysis: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          pros: { type: Type.ARRAY, items: { type: Type.STRING } },
          cons: { type: Type.ARRAY, items: { type: Type.STRING } },
          scores: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                criterionName: { type: Type.STRING },
                score: { type: Type.NUMBER, description: "Score from 1-10. Set to -1 if unrated." },
              },
              required: ["criterionName", "score"],
            },
          },
          totalScore: { type: Type.NUMBER, description: "Overall score (1-10). Set to -1 if unrated." },
        },
        required: ["name", "pros", "cons", "scores", "totalScore"],
      },
    },
    recommendation: {
      type: Type.OBJECT,
      properties: {
        suggestedOption: { type: Type.STRING },
        reasoning: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["suggestedOption", "reasoning"],
    },
    reflectionQuestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Questions to help the user reflect.",
    },
  },
  required: ["summary", "changesFromPrevious", "criteriaAnalysis", "optionsAnalysis", "recommendation", "reflectionQuestions"],
};

export const analyzeDecision = async (input: DecisionInput, userName?: string): Promise<AnalysisResult> => {
  const model = "gemini-2.5-flash";
  
  const userContext = userName ? `The user's name is ${userName}. Address them personally in the recommendation and reflection sections where appropriate.` : "";

  // Construct the prompt with multimodal parts
  const parts: any[] = [];

  parts.push({
    text: `
    You are an assistant that helps people make thoughtful, grounded decisions.
    ${userContext}
    The user will share a decision, options (which may include images, audio, or files), and criteria that matter to them.
    
    Decision Question: "${input.question}"
    
    Criteria: 
    ${input.criteria.map((c) => `- ${c.name} (Weight: ${c.weight})`).join("\n")}

    Here are the Options provided by the user:
    `
  });

  // Iterate through options and add them as parts
  input.options.forEach((opt, index) => {
    // 1. Label the option
    parts.push({
      text: `\nOption ${index + 1}: ${opt.text || "Untitled Option"}\n`
    });

    // 2. Add media if present
    if (opt.fileData && opt.mimeType) {
      parts.push({
        inlineData: {
          mimeType: opt.mimeType,
          data: opt.fileData
        }
      });
    }
  });

  parts.push({
    text: `
    Your job is to:
    
    1. **Clarify and Correct:** Clarify the decision in one sentence. **IMPORTANT**: If the user has made spelling errors in the question, option names, or criteria, you MUST use the CORRECTED spelling in your output (summary, option names, criteria names). Do not repeat typos.
    2. **Ensure there are AT LEAST 4 options analyzed.**
       - If the user provided fewer than 4 options, you MUST generate distinct, realistic, and creative additional options to reach a total of 4.
       - For these AI-generated options, prefix the name with "[Suggestion] ".
       - If the user provided images/files, analyze them visually/audibly to inform the pros/cons.
    3. Evaluate each option against each criterion using the user’s priorities.
    4. Generate pros and cons for ALL options.
    5. Score the options:
       - For user-provided options: Score from 1–10 overall (10 = best fit for the user’s criteria).
       - For AI-generated options (prefixed with [Suggestion]): Set 'totalScore' to -1 and all criterion 'score' values to -1. This indicates they are unrated feedback/suggestions only.
    6. Give a recommendation with a calm explanation, but ALWAYS remind the user that they are responsible for the final choice.
    
    Safety rules:
    If the decision involves self-harm, suicide, harming others, or emergencies, do not give normal decision advice. Return a JSON with ONLY the 'safetyWarning' field populated.
    Do not give medical, legal, or financial advice.
    
    Follow the JSON schema provided for the output. For 'changesFromPrevious', return an empty array since this is the first analysis.
    `
  });

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts }, // Pass the array of parts
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.5, 
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text) as AnalysisResult;
    return result;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze decision. Please try again.");
  }
};

export const refineAnalysis = async (input: DecisionInput, currentAnalysis: AnalysisResult, refinementInstruction: string): Promise<AnalysisResult> => {
  const model = "gemini-2.5-flash";

  // Simplified refinement for now (text-based context recall)
  const optionsDesc = input.options.map(o => o.text).join(", ");

  const prompt = `
    You are refining a previous decision analysis based on user feedback.
    
    Original Context:
    Decision: "${input.question}"
    Original Options (Names): ${optionsDesc}
    Original Criteria: ${input.criteria.map(c => `${c.name} (${c.weight})`).join(", ")}

    Current Analysis Summary: "${currentAnalysis.summary}"
    Current Recommendation: "${currentAnalysis.recommendation.suggestedOption}"

    USER REFINEMENT INSTRUCTION: "${refinementInstruction}"

    Task:
    Update the entire analysis (criteria, options, scores, recommendation) to reflect the user's instruction. 
    - **Correct any existing spelling errors.**
    - If they add an option, evaluate it.
    - If they change criteria importance, adjust the weights and scores.
    - If they correct a fact, update the pros/cons.
    - Maintain the same structured JSON format.
    - If you add new options based on refinement, you may score them normally if the user requested them, or use -1 if they are just suggestions.
    - **IMPORTANT**: Populate the 'changesFromPrevious' field with 1-3 concise bullet points summarizing specifically what you changed (e.g., "Increased weight of Cost to 5", "Added new option 'Rent Apartment'", "Updated pros for Option A").

    Safety rules apply: If the refinement introduces self-harm or illegal acts, return a safety warning.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.5,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Gemini Refinement Error:", error);
    throw new Error("Failed to refine decision. Please try again.");
  }
};

export const getDecisionSuggestion = async (currentInput: string): Promise<string> => {
  const model = "gemini-2.5-flash";
  const prompt = currentInput && currentInput.trim().length > 3
    ? `Rewrite this decision question to be clearer, more specific, and well-framed for decision analysis: "${currentInput}". Return ONLY the plain text of the question.`
    : `Give me one realistic, specific, and slightly complex decision question a person might need to make (e.g. regarding career, living situation, or major purchase). Return ONLY the plain text of the question.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });
  return response.text?.trim() || "";
};

export const getOptionsSuggestion = async (decision: string): Promise<string[]> => {
  const model = "gemini-2.5-flash";
  const prompt = `For the decision: "${decision}", list 3-5 distinct, realistic, and mutually exclusive options someone might consider. Return a raw JSON array of strings.`;
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        }
    }
  });
  const text = response.text;
  if (!text) return [];
  return JSON.parse(text);
};

export const getCriteriaSuggestion = async (decision: string): Promise<{name: string, weight: number}[]> => {
  const model = "gemini-2.5-flash";
   const prompt = `For the decision: "${decision}", list 4-6 key criteria that matter most when making this decision. Assign a recommended importance weight (1-5) for each. Return a raw JSON array of objects.`;

   const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    weight: { type: Type.NUMBER }
                },
                required: ["name", "weight"]
            }
        }
    }
  });
  const text = response.text;
  if (!text) return [];
  return JSON.parse(text);
};