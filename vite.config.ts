import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    host: "0.0.0.0", // Allow connections from any IP
    port: 5173, // Explicit port (default for Vite)
  },
});
