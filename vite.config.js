import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      port: 3000,
      open: true
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      // Minimal minify configuration untuk Vercel
      minify: 'esbuild', // Ganti dari 'terser' ke 'esbuild' yang lebih reliable
      target: 'esnext',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            firebase: ['firebase']
          }
        }
      }
    },
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
    },
  }
})