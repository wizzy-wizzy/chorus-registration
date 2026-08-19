import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),

        register: resolve(
          __dirname,
          'src/register/register.html'
        ),

        success: resolve(
          __dirname,
          'src/register/success.html'
        ),

        admin: resolve(
          __dirname,
          'src/admin/admin.html'
        ),

        dashboard: resolve(
          __dirname,
          'src/admin/dashboard.html'
        )
      }
    }
  }
});