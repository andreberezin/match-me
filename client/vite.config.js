import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    plugins: [react()],
    define: {
      global: "window",  // To make global available
      // eslint-disable-next-line no-undef
      'process.env.VITE_BACKEND_URL': JSON.stringify(process.env.VITE_BACKEND_URL),
      // eslint-disable-next-line no-undef
      'process.env.VITE_GOOGLE_API': JSON.stringify(process.env.VITE_GOOGLE_API),
      // eslint-disable-next-line no-undef
      'process.env.VITE_GOOGLE_API_KEY': JSON.stringify(process.env.VITE_GOOGLE_API_KEY),
    },
    server: {
      proxy: {
        // Proxy for API requests
        '/api': {
          // eslint-disable-next-line no-undef
          target: process.env.VITE_BACKEND_URL || 'http://localhost:8080',  // Default to localhost if not set
          changeOrigin: true,  // Ensures the Host header matches the target
        },
        // Proxy for WebSocket connections
        '/ws': {
          // eslint-disable-next-line no-undef
          target: process.env.VITE_BACKEND_URL || 'http://localhost:8080',  // Default to localhost if not set
          ws: true,  // Enable WebSocket proxying
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});