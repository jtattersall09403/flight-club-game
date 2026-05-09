import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 8081,
    strictPort: true,
    proxy: {
      "/api": "http://127.0.0.1:8765",
    },
    allowedHosts: [
      "jtattersall09403-vscode-tunnel.tools.analytical-platform.service.justice.gov.uk"
    ],
  },
});
