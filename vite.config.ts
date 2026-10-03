import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";
import { enquiryRouter } from "./server/enquiries";
import express from "express";

export default defineConfig({
  plugins: [react(), tailwindcss(), {
    name: "local-enquiry-api",
    configureServer(server) {
      const api = express();
      api.disable("x-powered-by");
      api.use(enquiryRouter);
      server.middlewares.use("/api/enquiries", api);
    },
  }],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    host: "127.0.0.1",
  },
});
