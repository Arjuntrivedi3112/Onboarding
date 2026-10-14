/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: [
      // `npm run dev:demo` swaps Supabase for an in-memory backend seeded with
      // demo learners, so the whole app (admin console included) can be
      // explored without an account or network. Never used in builds.
      ...(mode === "demo"
        ? [
            {
              find: /^@\/integrations\/supabase\/client$/,
              replacement: path.resolve(__dirname, "./src/demo/client.ts"),
            },
          ]
        : []),
      { find: "@", replacement: path.resolve(__dirname, "./src") },
    ],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // Lesson chunks are lazily imported; give the render sweep room.
    testTimeout: 30000,
  },
}));
