/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // React and the Supabase client make up most of the main bundle (~160 kB gzipped).
  build: { chunkSizeWarningLimit: 650 },
  test: { globals: true, environment: 'node' },
});
