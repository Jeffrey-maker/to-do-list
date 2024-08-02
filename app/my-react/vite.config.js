import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  // Load env file based on `mode` in the current working directory.
  // The third parameter is empty to load all env variables regardless of the `VITE_` prefix.
    plugins: [react()],
    server: {
      host: true,
      port: 3000,
    }
});
