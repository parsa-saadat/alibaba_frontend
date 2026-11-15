import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  /*
   * آدرس API در کد نسبی است (`/api`). این پروکسی همان درخواست‌ها را به بک‌اند
   * لوکال (پورت ۳۰۰۰) می‌رساند؛ بنابراین مرورگرِ کاربر لازم نیست به localhost
   * دسترسی داشته باشد و پیش‌نمایش/تانل هم بدون خطای CORS کار می‌کند.
   */
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    // اجازه‌ی دسترسی از دامنه‌های پیش‌نمایش/تانل (بدون محدودیت روی محیط لوکال)
    allowedHosts: true,
    /*
     * در حالت توسعه هیچ فایلی در مرورگر کش نشود؛ وگرنه بعد از تغییر خروجی‌های یک
     * ماژول، مرورگر نسخه‌ی قدیمی را نگه می‌دارد و خطایی مثل
     * «does not provide an export named ...» می‌دهد.
     */
    headers: { 'Cache-Control': 'no-store' },
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET || 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  preview: {
    host: true,
    port: 4173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET || 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  /*
   * همه‌ی وابستگی‌های پایه از ابتدا پیش‌باندل می‌شوند تا ویت وسط کار آن‌ها را
   * دوباره بهینه نکند؛ تغییر هشِ پکیج‌ها وسط سشن باعث می‌شد مرورگر دو نسخه از
   * React بگیرد و خطای «Invalid hook call / useState of null» بدهد.
   */
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-router-dom',
      'axios',
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    /* فقط یک نسخه از React در کل اپ (بدون کپی تکراری) */
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
});
