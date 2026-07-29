import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          state: ['@reduxjs/toolkit', 'react-redux'],
          antd: ['antd', '@ant-design/icons'],
          transport: ['axios', 'socket.io-client']
        }
      }
    }
  },
  server: {
    host: true,
    port: 5173
  }
});
