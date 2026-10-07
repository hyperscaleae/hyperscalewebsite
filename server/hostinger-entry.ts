import express from "express";
import path from "node:path";
import { createPortalRouter } from "./portal";
import { enquiryRouter } from "./enquiries";

// This entry is bundled to CommonJS for Hostinger's project ZIP upload.
const app = express();
app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});
app.use("/api/portal", createPortalRouter({ production: true }));
app.use("/api/enquiries", enquiryRouter);
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));
app.use(express.static(path.join(__dirname, "public")));
app.get("*", (_req, res) =>
  res.sendFile(path.join(__dirname, "public/index.html"))
);
app.listen(Number(process.env.PORT) || 3000, "0.0.0.0", () =>
  console.log("HyperScale Node portal started")
);
