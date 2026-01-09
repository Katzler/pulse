/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// Bundle analyzer - only load in analyze mode
// Usage: ANALYZE=true npm run build
const isAnalyze = process.env.ANALYZE === 'true';

// https://vite.dev/config/
export default defineConfig({
  // Base path for GitHub Pages - uses repo name from env or defaults to '/'
  // Set VITE_BASE_PATH environment variable in GitHub Actions
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  build: {
    // Enable source maps for better debugging
    sourcemap: isAnalyze,
    // Report compressed file sizes
    reportCompressedSize: true,
    // Rollup options for bundle analysis
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-charts': ['recharts'],
          'vendor-state': ['zustand', '@tanstack/react-query'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@domain': path.resolve(__dirname, './src/domain'),
      '@application': path.resolve(__dirname, './src/application'),
      '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@presentation': path.resolve(__dirname, './src/presentation'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@components': path.resolve(__dirname, './src/presentation/components'),
      '@hooks': path.resolve(__dirname, './src/presentation/hooks'),
      '@pages': path.resolve(__dirname, './src/presentation/pages'),
      '@stores': path.resolve(__dirname, './src/presentation/stores'),
      '@tests': path.resolve(__dirname, './src/__tests__'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});
