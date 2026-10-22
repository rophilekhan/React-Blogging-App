import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import postcss from 'postcss'
import autoprefixer from 'autoprefixer'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      'lucide-react': path.resolve(__dirname, './src/components/ui/Icons.jsx')
    }
  },
  plugins: [
    react(),
    postcss({
      plugins: [
        autoprefixer()
      ]
    })
  ]
})