// Isolated local UI fixture. Never deploy this test entry point.
import express from "express";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createPortalRouter } from "../server/portal";
import { newClient } from "../client/src/lib/studio";
const directory = fs.mkdtempSync(
  path.join(os.tmpdir(), "hyperscale-ui-fixture-")
);
const app = express();
const origin = "http://127.0.0.1:4591";
app.use(
  "/api/portal",
  createPortalRouter({ directory, origin, production: false })
);
app.use(express.static(path.resolve("dist/public")));
app.get("*", (_req, res) =>
  res.sendFile(path.resolve("dist/public/index.html"))
);
app.listen(4591, "127.0.0.1", async () => {
  const response = await fetch(origin + "/api/portal/setup", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "HyperScale demo",
      email: "studio@example.test",
      password: "local-fixture-password",
    }),
  });
  const auth = await response.json();
  const headers = {
    Origin: origin,
    "Content-Type": "application/json",
    Cookie: response.headers.get("set-cookie")!.split(";")[0],
    "X-CSRF-Token": auth.csrf,
  };
  const client = {
    ...newClient(),
    brand: "Demo client",
    project: "Website launch",
    stage: "In progress",
    scope:
      "Website design and development. Four pages, responsive layouts and launch preparation.",
    timeline: "Design review · Build · Final review · Launch",
    portalMessage:
      "The first designs are ready for review. Share your feedback in Messages.",
    tasks: [
      {
        id: "brief",
        title: "Project brief",
        done: true,
        shared: true,
        due: "",
      },
      {
        id: "design",
        title: "Design review",
        done: false,
        shared: true,
        due: "2026-10-12",
      },
      {
        id: "build",
        title: "Website build",
        done: false,
        shared: true,
        due: "2026-10-19",
      },
      {
        id: "launch",
        title: "Launch",
        done: false,
        shared: true,
        due: "2026-10-26",
      },
    ],
  };
  for (const [url, data] of [
    ["/clients", client],
    [
      "/users",
      {
        name: "Demo client",
        email: "client@example.test",
        password: "local-fixture-password",
        clientId: client.id,
      },
    ],
    [
      `/clients/${client.id}/requests`,
      {
        title: "Homepage photos",
        description: "We will share our updated brand images this week.",
      },
    ],
    [
      `/clients/${client.id}/messages`,
      { text: "Welcome to your project workspace." },
    ],
  ] as const)
    await fetch(origin + "/api/portal" + url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
  console.log(
    "Isolated UI fixture ready on port 4591. Test accounts only; no real client records."
  );
});
