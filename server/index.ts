import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { enquiryRouter } from "./enquiries";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.disable("x-powered-by");
  const server = createServer(app);
  app.use("/api/enquiries", enquiryRouter);
  app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  const pageRoutes = new Set(["/", "/work", "/work/websites", "/services", "/about", "/insights", "/contact", "/inquiry", "/feedback", "/dashboard", "/privacy", "/terms", "/copyright"]);
  app.get("*", (req, res) => {
    if (!pageRoutes.has(req.path)) res.status(404);
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
