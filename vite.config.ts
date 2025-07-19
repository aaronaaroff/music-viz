import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import generouted from '@generouted/react-router/plugin'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), generouted()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    }
  }
})
