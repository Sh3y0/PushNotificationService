import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // ngrok (and similar tunnels) send a public Host header; Vite blocks unknown hosts by default.
    allowedHosts: true,
  },
});
