import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "./src/recipe.js",
      name: "Recipe",
      fileName: (format) => (format === "umd" ? "recipe.umd.js" : "recipe.js"),
      formats: ["es", "umd"],
    },
    rollupOptions: {
      external: [],
    },
  },
});
