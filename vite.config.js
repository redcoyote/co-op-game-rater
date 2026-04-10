import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Заміни 'game-rater' на назву свого GitHub репозиторію
const REPO_NAME = 'co-op-game-rater'

export default defineConfig({
  plugins: [react()],
  // base потрібен для коректного деплою на GitHub Pages
  // Формат: /назва-репозиторію/
  base: `/${REPO_NAME}/`,
})
