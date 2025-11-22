import { defineConfig } from "vite";

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      // Keep native modules out of the bundle so they load at runtime.
      external: ["pg"],
    },
    target: "node18",
  },
});
