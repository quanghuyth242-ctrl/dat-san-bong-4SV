import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        auth: fileURLToPath(new URL('./src/auth.html', import.meta.url)),
        // Bản trùc này không ai trỏ tới nhưng vẫn còn trong repo. Đưa vào input
        // để Vite xử lý /src/style.css và /src/main.js thành đường dẫn trong
        // dist/assets, thay vì để nguyên đường dẫn gốc không tồn tại khi deploy.
        projectIndex: fileURLToPath(new URL('./project/index.html', import.meta.url)),
      },
    },
  },
})

