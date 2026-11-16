import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Rutes relatives: l'app funciona igual a localhost que a GitHub Pages (/estudi-app/).
  base: './',
})
