import express from "express";
import path from "node:path";
import { createPortalRouter } from "./portal";

const app = express();
app.disable("x-powered-by");
const port = Number(process.env.PORT || 4590);
const site = path.resolve(
  process.env.STUDIO_SITE_DIR || path.join(process.cwd(), "site")
);
app.use(
  "/api/portal",
  createPortalRouter({ origin: `http://127.0.0.1:${port}`, production: false })
);
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));
app.get("/__studio_health", (_req, res) =>
  res.send("HyperScale-private-studio-v2")
);
app.use(express.static(site));
app.get("*", (_req, res) => res.sendFile(path.join(site, "index.html")));
app.listen(port, "127.0.0.1", () =>
  console.log(`HyperScale workspace: http://127.0.0.1:${port}/dashboard`)
);
