import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const apiPort = env.PORT || '3001'
  const configuredHost = env.SERVER_HOST || env.HOST || '127.0.0.1'
  const proxyHost = configuredHost === '0.0.0.0' ? '127.0.0.1' : configuredHost
  const apiTarget = env.VITE_API_TARGET || `http://${proxyHost}:${apiPort}`

  return {
    plugins: [
      // The React and Tailwind plugins are both required for Make, even if
      // Tailwind is not being actively used - do not remove them
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        // Alias @ to the src directory
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api': apiTarget,
        '/uploads': apiTarget,
      },
    },

    // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
    assetsInclude: ['**/*.svg', '**/*.csv'],
  }
})
