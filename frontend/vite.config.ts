import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const defaultAllowedHosts = ["boucherie.oeilvert.org"];
const envAllowedHosts = (process.env.TAGEDITOR_ALLOWED_HOSTS ?? "")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: envAllowedHosts.length ? envAllowedHosts : defaultAllowedHosts,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
