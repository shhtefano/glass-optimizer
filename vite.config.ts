import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['chrome >= 49', 'android >= 4.4', 'safari >= 10', 'not IE 11'],
      renderModernChunks: false,
    }),
  ],
})
