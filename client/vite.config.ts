import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: process.env.VITE_E2E === 'true' ? {
      '@clerk/clerk-react': path.resolve(__dirname, './src/mocks/clerk-react.tsx'),
    } : {},
  },
  server: {
    port: 5173,
    strictPort: false, // Allow fallback to next port if needed
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'zustand', 'framer-motion'],
          clerk: ['@clerk/clerk-react'],
          utils: ['exceljs', 'jspdf', 'jspdf-autotable', 'jszip']
        }
      }
    }
  }
})
