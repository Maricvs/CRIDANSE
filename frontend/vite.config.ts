import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
	build: {
	    outDir: 'dist',
	    assetsDir: 'assets',
	    emptyOutDir: true,
        },
   base: '/',
   server: {
    port: 3000,
    strictPort: true,
    host: true,
  },
   define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('https://www.unlimcode.com/api'),
  },
})
