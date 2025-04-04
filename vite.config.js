import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "./src/recipe.js",
      name: "Recipe",
      fileName: "recipe",
      formats: ["es", "umd"],
    },
    rollupOptions: {
      external: [],
    },
  },
});
