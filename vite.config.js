import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        auth: fileURLToPath(new URL('./src/auth.html', import.meta.url)),
        // Các trang trong public/project/ (danh sách sân, quản trị) là HTML
        // tĩnh: Vite copy nguyên vẹn từ public/ sang dist/, không cần khai báo.
        // public/project/index.html chỉ là trang chuyển hướng về /index.html.
      },
    },
  },
})

