import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env variables (including those without VITE_ prefix)
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env for client-side usage
      'process.env': {
        API_KEY: env.API_KEY,
        FIREBASE_API_KEY: env.FIREBASE_API_KEY,
        FIREBASE_AUTH_DOMAIN: env.FIREBASE_AUTH_DOMAIN,
        FIREBASE_PROJECT_ID: env.FIREBASE_PROJECT_ID,
        FIREBASE_STORAGE_BUCKET: env.FIREBASE_STORAGE_BUCKET,
        FIREBASE_MESSAGING_SENDER_ID: env.FIREBASE_MESSAGING_SENDER_ID,
        FIREBASE_APP_ID: env.FIREBASE_APP_ID
      }
    }
  };
});