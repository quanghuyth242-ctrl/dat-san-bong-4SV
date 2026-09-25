import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: fileURLToPath(new URL('index.html', import.meta.url)),
        about: fileURLToPath(new URL('gioi-thieu.html', import.meta.url)),
        auth: fileURLToPath(new URL('dang-nhap.html', import.meta.url)),
      },
    },
  },
})