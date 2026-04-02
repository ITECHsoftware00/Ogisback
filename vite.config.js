import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Dev server — SPA fallback so all routes serve index.html
  server: {
    port: 5173,
    open: true,
    historyApiFallback: true,
  },

  // Preview server — same fallback for `vite preview`
  preview: {
    port: 4173,
    historyApiFallback: true,
  },

  build: {
    // Warn at 600kb, raise the soft limit to avoid noise for chart/motion bundles
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Split vendor deps into a separate chunk for better caching
        manualChunks(id) {
          if (id.includes('node_modules/recharts')) return 'charts';
          if (id.includes('node_modules/framer-motion')) return 'motion';
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router-dom/')
          ) return 'vendor';
        },
      },
    },
  },
})
