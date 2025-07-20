// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // Or vue(), sveltekit(), etc.
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})