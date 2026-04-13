import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

// 计算 ESM 环境下的 __dirname
const __dirname = dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    host: 'localhost',
    open: false, // 关闭自动打开，使用 Laragon 的域名
    cors: true,
    strictPort: true, // 如果 3001 被占用则报错，不自动改端口
    hmr: {
      overlay: true,
      host: 'localhost',
      port: 3001,
      protocol: 'ws'
    },
    proxy: {
      // Sitemap proxy to backend
      '/sitemap.xml': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      // 将前端 /api 请求代理到后端 3000，避免开发期 CORS/404
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        // Preserve original response headers for PDF viewing
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            // Remove headers that might interfere with PDF display
            delete proxyRes.headers['x-download-options'];
          });
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // 确保资源路径正确
    assetsDir: 'assets',
    // 压缩：gzip/brotli 在后端处理，此处生成优质 sourcemap
    minify: 'esbuild',
    rollupOptions: {
      // 排除未使用的 PrimeReact 可选依赖（Chart、Editor 等组件）
      external: ['chart.js/auto', 'quill'],
      output: {
        // 手工稳定分包：提升浏览器缓存命中，不改变业务逻辑
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          i18n: ['react-i18next', 'i18next'],
          // PrimeReact 单独分包，减少主包体积
          primereact: ['primereact'],
          // 大型依赖单独分包
          motion: ['framer-motion'],
          query: ['@tanstack/react-query'],
          // 图表类
          charts: ['recharts', 'd3'],
          // 地图类
          maps: ['leaflet'],
        }
      }
    },
    // 降低警告阈值到 500 KB（更好的可见性）
    chunkSizeWarningLimit: 500
  },
  // 开发环境优化
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  },
  // 基础路径配置（生产环境可能需要）
  base: process.env.NODE_ENV === 'production' ? '/' : '/'
})