import express, { Request, Response, NextFunction } from "express";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { z } from "zod";
import {
  clientSchema,
  defaultSettings,
  settingsSchema,
  safeUrl,
  storeSchema,
} from "../client/src/lib/studio";
import {
  AgencyData,
  PortalUser,
  Project,
  credentials,
  docSchema,
  expenseSchema,
  label,
  body,
  publicUserSchema,
  templateSchema,
  timeSchema,
} from "../shared/portal";

type User = PortalUser & { salt: string; hash: string };
type Session = {
  tokenHash: string;
  userId: string;
  csrf: string;
  expires: number;
};
type Database = Omit<AgencyData, "users"> & {
  users: User[];
  sessions: Session[];
};
export function seal(data: Buffer, key: Buffer): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const result = Buffer.concat([cipher.update(data), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), result]);
}
export function unseal(data: Buffer, key: Buffer): Buffer {
  const decipher = createDecipheriv("aes-256-gcm", key, data.subarray(0, 12));
  decipher.setAuthTag(data.subarray(12, 28));
  return Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]);
}
const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
const publicUser = (user: User) => publicUserSchema.parse(user);
const blankProject = (client: z.infer<typeof clientSchema>): Project => ({
  client,
  revision: 1,
  messages: [],
  requests: [],
  files: [],
  documents: [],
});
export function clientView(project: Project, paymentLink: string) {
  const c = project.client;
  return {
    project: {
      id: c.id,
      brand: c.brand,
      project: c.project,
      stage: c.stage,
      scope: c.scope,
      timeline: c.timeline,
      portalMessage: c.portalMessage,
      tasks: c.tasks.filter(t => t.shared),
      sharedLinks: c.sharedLinks.filter(l => safeUrl(l.url)),
    },
    messages: project.messages,
    requests: project.requests,
    files: project.files.filter(f => f.shared),
    documents: project.documents.filter(d => d.published),
    paymentLink: safeUrl(paymentLink),
  };
}
export function createPortalRouter(
  options: { directory?: string; origin?: string; production?: boolean } = {}
) {
  const router = express.Router();
  const production =
    options.production ?? process.env.NODE_ENV === "production";
  const directory = path.resolve(
    options.directory ||
      process.env.PORTAL_DATA_DIR ||
      path.join(os.homedir(), ".hyperscale-portal")
  );
  const origin = options.origin || process.env.PORTAL_ORIGIN || "";
  const dataConfigured = Boolean(
    options.directory || process.env.PORTAL_DATA_DIR
  );
  const publicDataDirectory =
    /(?:^|[\\/])(public|public_html|hbuilds)(?:[\\/]|$)/i.test(directory);
  let db: Database | null = null;
  let key: Buffer;
  const filePath = path.join(directory, "workspace.enc");
  const keyPath = path.join(directory, "encryption.key");
  function load() {
    if (db) return db;
    fs.mkdirSync(path.join(directory, "files"), {
      recursive: true,
      mode: 0o700,
    });
    if (process.env.PORTAL_ENCRYPTION_KEY) {
      if (!/^[a-f0-9]{64}$/i.test(process.env.PORTAL_ENCRYPTION_KEY))
        throw new Error("Invalid encryption key configuration");
      key = Buffer.from(process.env.PORTAL_ENCRYPTION_KEY, "hex");
    } else {
      if (production)
        throw new Error("Production encryption key is not configured");
      if (!fs.existsSync(keyPath))
        fs.writeFileSync(keyPath, randomBytes(32), { mode: 0o600, flag: "wx" });
      key = fs.readFileSync(keyPath);
    }
    db = fs.existsSync(filePath)
      ? JSON.parse(unseal(fs.readFileSync(filePath), key).toString())
      : {
          projects: [],
          settings: defaultSettings,
          users: [],
          sessions: [],
          time: [],
          expenses: [],
          templates: [],
          paymentLink: "",
        };
    if (
      production &&
      db!.users.length === 0 &&
      process.env.PORTAL_ADMIN_EMAIL &&
      process.env.PORTAL_ADMIN_PASSWORD
    ) {
      const input = credentials.parse({
        email: process.env.PORTAL_ADMIN_EMAIL,
        password: process.env.PORTAL_ADMIN_PASSWORD,
      });
      db!.users.push(
        makeUser("HyperScale", input.email, input.password, "admin", null)
      );
      save();
    }
    return db!;
  }
  function save() {
    const data = seal(Buffer.from(JSON.stringify(load())), key);
    const temporary = filePath + ".tmp";
    fs.writeFileSync(temporary, data, { mode: 0o600 });
    fs.renameSync(temporary, filePath);
  }
  function sameOrigin(req: Request) {
    const expected = origin || `http://${req.headers.host}`;
    return (
      req.headers.origin === expected &&
      (!production || expected.startsWith("https://"))
    );
  }
  const attempts = new Map<string, { count: number; until: number }>();
  function rate(req: Request, res: Response, next: NextFunction) {
    const id =
      (req.socket.remoteAddress || "unknown") +
      ":" +
      hashToken(String(req.body?.email || "unknown").toLowerCase()).slice(
        0,
        16
      );
    const now = Date.now();
    attempts.forEach((value, key) => {
      if (value.until < now) attempts.delete(key);
    });
    const entry = attempts.get(id) || { count: 0, until: now + 15 * 60000 };
    if (entry.count >= 8 || attempts.size >= 2000)
      return res
        .status(429)
        .json({ error: "Too many attempts. Please try again later." });
    entry.count++;
    attempts.set(id, entry);
    next();
  }
  router.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    if (
      publicDataDirectory ||
      (production &&
        (!dataConfigured ||
          !origin.startsWith("https://") ||
          !process.env.PORTAL_ENCRYPTION_KEY))
    )
      return res
        .status(503)
        .json({ error: "Portal hosting configuration is incomplete." });
    if (
      !production &&
      !origin &&
      !/^(127\.0\.0\.1|localhost):\d+$/.test(req.headers.host || "")
    )
      return res.status(403).json({ error: "Invalid host." });
    if (!["GET", "HEAD"].includes(req.method) && !sameOrigin(req))
      return res.status(403).json({ error: "Request origin not allowed." });
    try {
      const records = load();
      if (production && !records.users.length)
        return res
          .status(503)
          .json({
            error:
              "The first administrator must be configured in the private hosting environment.",
          });
      next();
    } catch {
      res.status(503).json({
        error:
          "Private workspace storage is unavailable. Check server configuration.",
      });
    }
  });
  router.use(express.json({ limit: "12mb" }));
  const sessionFor = (req: Request) => {
    const token = /(?:^|;\s*)hs_session=([a-f0-9]{64})(?:;|$)/.exec(
      req.headers.cookie || ""
    )?.[1];
    if (!token) return undefined;
    return load().sessions.find(
      s => s.tokenHash === hashToken(token) && s.expires > Date.now()
    );
  };
  const userFor = (req: Request) => {
    const session = sessionFor(req);
    return session
      ? load().users.find(u => u.id === session.userId && !u.disabled)
      : undefined;
  };
  function signed(req: Request, res: Response, next: NextFunction) {
    const user = userFor(req);
    if (!user) return res.status(401).json({ error: "Please sign in." });
    if (
      !["GET", "HEAD"].includes(req.method) &&
      req.headers["x-csrf-token"] !== sessionFor(req)?.csrf
    )
      return res
        .status(403)
        .json({ error: "Session verification failed. Refresh and try again." });
    next();
  }
  function admin(req: Request, res: Response, next: NextFunction) {
    if (userFor(req)?.role !== "admin")
      return res.status(403).json({ error: "Agency access required." });
    next();
  }
  function scoped(req: Request) {
    const user = userFor(req)!;
    const id = req.params.id || req.params.clientId;
    return load().projects.find(
      p => p.client.id === id && (user.role === "admin" || user.clientId === id)
    );
  }
  function respondSession(user: User, res: Response) {
    const token = randomBytes(32).toString("hex");
    const session = {
      tokenHash: hashToken(token),
      userId: user.id,
      csrf: randomBytes(24).toString("hex"),
      expires: Date.now() + 12 * 3600000,
    };
    load().sessions = load()
      .sessions.filter(s => s.expires > Date.now())
      .slice(-500);
    load().sessions.push(session);
    save();
    res.cookie("hs_session", token, {
      httpOnly: true,
      secure: production,
      sameSite: "strict",
      path: "/api/portal",
      maxAge: 12 * 3600000,
    });
    res.json({ user: publicUser(user), csrf: session.csrf });
  }
  const makeUser = (
    name: string,
    email: string,
    password: string,
    role: "admin" | "client",
    clientId: string | null
  ): User => {
    const salt = randomBytes(16).toString("hex");
    return {
      id: randomBytes(16).toString("hex"),
      name,
      email,
      role,
      clientId,
      disabled: false,
      salt,
      hash: scryptSync(password, salt, 64, {
        N: 32768,
        maxmem: 64 * 1024 * 1024,
      }).toString("hex"),
    };
  };
  router.get("/status", (_req, res) =>
    res.json({ available: true, setup: load().users.length === 0 })
  );
  router.post("/setup", rate, (req, res) => {
    const local = ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(
      req.socket.remoteAddress || ""
    );
    if (production || !local || load().users.length)
      return res
        .status(403)
        .json({ error: "First setup is available only on the local server." });
    const input = credentials.extend({ name: label }).parse(req.body);
    const user = makeUser(
      input.name,
      input.email,
      input.password,
      "admin",
      null
    );
    load().users.push(user);
    respondSession(user, res);
  });
  router.post("/login", rate, (req, res) => {
    const input = credentials.parse(req.body);
    const user = load().users.find(u => u.email === input.email && !u.disabled);
    const salt = user?.salt || "missing-user";
    const result = scryptSync(input.password, salt, 64, {
      N: 32768,
      maxmem: 64 * 1024 * 1024,
    });
    if (!user || !timingSafeEqual(result, Buffer.from(user.hash, "hex")))
      return res.status(401).json({ error: "Email or password is incorrect." });
    respondSession(user, res);
  });
  router.get("/session", signed, (req, res) =>
    res.json({ user: publicUser(userFor(req)!), csrf: sessionFor(req)!.csrf })
  );
  router.post("/logout", signed, (req, res) => {
    const session = sessionFor(req);
    load().sessions = load().sessions.filter(s => s !== session);
    save();
    res.clearCookie("hs_session", {
      path: "/api/portal",
      secure: production,
      httpOnly: true,
      sameSite: "strict",
    });
    res.json({ ok: true });
  });
  router.get("/agency", signed, admin, (_req, res) => {
    const { sessions: _sessions, users, ...data } = load();
    res.json({ ...data, users: users.map(publicUser) });
  });
  router.get("/client", signed, (req, res) => {
    const user = userFor(req)!;
    const project = load().projects.find(p => p.client.id === user.clientId);
    if (!project)
      return res
        .status(404)
        .json({ error: "No project has been assigned to this account." });
    res.json(clientView(project, load().paymentLink));
  });
  router.post("/clients", signed, admin, (req, res) => {
    const client = clientSchema.parse(req.body);
    if (load().projects.some(p => p.client.id === client.id))
      return res.status(409).json({ error: "Client already exists." });
    load().projects.push(blankProject(client));
    save();
    res.json({ ok: true });
  });
  router.put("/clients/:id", signed, admin, (req, res) => {
    const project = scoped(req);
    if (!project) return res.sendStatus(404);
    const input = z
      .object({ client: clientSchema, revision: z.number().int() })
      .parse(req.body);
    if (input.client.id !== req.params.id) return res.sendStatus(400);
    if (input.revision !== project.revision)
      return res.status(409).json({
        error:
          "This project changed in another session. Refresh before saving.",
      });
    project.client = input.client;
    project.revision++;
    save();
    res.json({ ok: true });
  });
  router.post("/users", signed, admin, (req, res) => {
    const input = credentials
      .extend({ name: label, clientId: z.string() })
      .parse(req.body);
    if (!load().projects.some(p => p.client.id === input.clientId))
      return res.sendStatus(404);
    if (load().users.some(u => u.email === input.email))
      return res
        .status(409)
        .json({ error: "This email already has an account." });
    load().users.push(
      makeUser(
        input.name,
        input.email,
        input.password,
        "client",
        input.clientId
      )
    );
    save();
    res.json({ ok: true });
  });
  router.put("/users/:id", signed, admin, (req, res) => {
    const user = load().users.find(
      u => u.id === req.params.id && u.role === "client"
    );
    if (!user) return res.sendStatus(404);
    const input = z
      .object({
        disabled: z.boolean(),
        password: z.string().min(12).max(200).optional(),
      })
      .parse(req.body);
    user.disabled = input.disabled;
    if (input.password) {
      const replacement = makeUser(
        user.name,
        user.email,
        input.password,
        user.role,
        user.clientId
      );
      user.salt = replacement.salt;
      user.hash = replacement.hash;
    }
    load().sessions = load().sessions.filter(s => s.userId !== user.id);
    save();
    res.json({ ok: true });
  });
  router.post("/password", signed, (req, res) => {
    const input = z
      .object({ current: z.string(), password: z.string().min(12).max(200) })
      .parse(req.body);
    const user = userFor(req)!;
    if (
      !timingSafeEqual(
        scryptSync(input.current, user.salt, 64, {
          N: 32768,
          maxmem: 64 * 1024 * 1024,
        }),
        Buffer.from(user.hash, "hex")
      )
    )
      return res.status(400).json({ error: "Current password is incorrect." });
    const next = makeUser(
      user.name,
      user.email,
      input.password,
      user.role,
      user.clientId
    );
    user.salt = next.salt;
    user.hash = next.hash;
    load().sessions = load().sessions.filter(s => s.userId !== user.id);
    respondSession(user, res);
  });
  router.put("/settings", signed, admin, (req, res) => {
    const input = z
      .object({ settings: settingsSchema, paymentLink: z.string().max(500) })
      .parse(req.body);
    if (input.paymentLink && !safeUrl(input.paymentLink))
      return res.status(400).json({ error: "Enter a valid payment link." });
    load().settings = input.settings;
    load().paymentLink = input.paymentLink;
    save();
    res.json({ ok: true });
  });
  router.post("/clients/:id/messages", signed, (req, res) => {
    const p = scoped(req);
    if (!p) return res.sendStatus(404);
    const input = z.object({ text: body }).parse(req.body);
    if (p.messages.length >= 2000)
      return res.status(400).json({
        error:
          "Project message limit reached. Export and archive this project.",
      });
    const u = userFor(req)!;
    p.messages.push({
      id: randomBytes(16).toString("hex"),
      clientId: p.client.id,
      authorId: u.id,
      author: u.name,
      role: u.role,
      text: input.text,
      created: new Date().toISOString(),
    });
    save();
    res.json({ ok: true });
  });
  router.post("/clients/:id/requests", signed, (req, res) => {
    const p = scoped(req);
    if (!p) return res.sendStatus(404);
    const input = z
      .object({ title: label, description: z.string().max(12000) })
      .parse(req.body);
    if (p.requests.length >= 1000)
      return res.status(400).json({ error: "Project request limit reached." });
    p.requests.push({
      ...input,
      id: randomBytes(16).toString("hex"),
      clientId: p.client.id,
      status: "New",
      created: new Date().toISOString(),
      author: userFor(req)!.name,
    });
    save();
    res.json({ ok: true });
  });
  router.put("/clients/:id/requests/:requestId", signed, admin, (req, res) => {
    const p = scoped(req);
    const request = p?.requests.find(r => r.id === req.params.requestId);
    if (!request) return res.sendStatus(404);
    request.status = z
      .enum(["New", "In progress", "Done"])
      .parse(req.body.status);
    save();
    res.json({ ok: true });
  });
  router.post(
    "/clients/:id/files",
    signed,
    express.raw({ type: "application/octet-stream", limit: "20mb" }),
    (req, res) => {
      const p = scoped(req);
      if (!p) return res.sendStatus(404);
      if (!Buffer.isBuffer(req.body) || !req.body.length)
        return res.status(400).json({ error: "Choose a non-empty file." });
      if (p.files.length >= 1000)
        return res.status(400).json({ error: "File limit reached." });
      const stored = load().projects.reduce(
        (total, p) => total + p.files.reduce((n, f) => n + f.size, 0),
        0
      );
      const maxBytes =
        Math.max(
          20,
          Math.min(100000, Number(process.env.PORTAL_MAX_STORAGE_MB) || 500)
        ) *
        1024 *
        1024;
      if (stored + req.body.length > maxBytes)
        return res.status(413).json({
          error: "Workspace upload storage is full. Contact HyperScale.",
        });
      let name;
      try {
        name = decodeURIComponent(String(req.headers["x-file-name"] || ""));
      } catch {
        return res.sendStatus(400);
      }
      name = label.parse(name).replace(/[\r\n\\/]/g, "_");
      const id = randomBytes(16).toString("hex");
      fs.writeFileSync(
        path.join(directory, "files", id + ".enc"),
        seal(req.body, key),
        { flag: "wx", mode: 0o600 }
      );
      p.files.push({
        id,
        clientId: p.client.id,
        name,
        size: req.body.length,
        uploadedBy: userFor(req)!.name,
        created: new Date().toISOString(),
        shared:
          userFor(req)!.role === "client" || req.headers["x-shared"] === "true",
      });
      save();
      res.json({ ok: true });
    }
  );
  router.get("/clients/:id/files/:fileId", signed, (req, res) => {
    const p = scoped(req);
    const f = p?.files.find(
      f =>
        f.id === req.params.fileId &&
        (f.shared || userFor(req)!.role === "admin")
    );
    if (!f) return res.sendStatus(404);
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(f.name)}`
    );
    res.send(
      unseal(fs.readFileSync(path.join(directory, "files", f.id + ".enc")), key)
    );
  });
  router.put("/clients/:id/files/:fileId", signed, admin, (req, res) => {
    const f = scoped(req)?.files.find(f => f.id === req.params.fileId);
    if (!f) return res.sendStatus(404);
    f.shared = z.boolean().parse(req.body.shared);
    save();
    res.json({ ok: true });
  });
  router.post("/clients/:id/documents", signed, admin, (req, res) => {
    const p = scoped(req);
    if (!p) return res.sendStatus(404);
    const input = docSchema
      .pick({ title: true, kind: true, html: true, published: true })
      .extend({ html: z.string().max(500000) })
      .parse(req.body);
    p.documents.push({
      ...input,
      id: randomBytes(16).toString("hex"),
      clientId: p.client.id,
      created: new Date().toISOString(),
      approval: null,
    });
    save();
    res.json({ ok: true });
  });
  router.post("/clients/:id/documents/:docId/approve", signed, (req, res) => {
    const p = scoped(req);
    const doc = p?.documents.find(
      d => d.id === req.params.docId && d.published
    );
    if (!doc || userFor(req)!.role !== "client") return res.sendStatus(404);
    const input = z.object({ name: label }).parse(req.body);
    if (doc.approval)
      return res
        .status(409)
        .json({ error: "This document is already approved." });
    doc.approval = {
      name: input.name,
      userId: userFor(req)!.id,
      at: new Date().toISOString(),
      digest: createHash("sha256").update(doc.html).digest("hex"),
    };
    save();
    res.json({ ok: true });
  });
  router.put("/clients/:id/documents/:docId", signed, admin, (req, res) => {
    const doc = scoped(req)?.documents.find(d => d.id === req.params.docId);
    if (!doc) return res.sendStatus(404);
    doc.published = z.boolean().parse(req.body.published);
    save();
    res.json({ ok: true });
  });
  router.post("/time", signed, admin, (req, res) => {
    const item = timeSchema.parse(req.body);
    if (!load().projects.some(p => p.client.id === item.clientId))
      return res.sendStatus(404);
    if (load().time.some(t => t.id === item.id)) return res.sendStatus(409);
    load().time.push(item);
    save();
    res.json({ ok: true });
  });
  router.post("/expenses", signed, admin, (req, res) => {
    const item = expenseSchema.parse(req.body);
    if (!load().projects.some(p => p.client.id === item.clientId))
      return res.sendStatus(404);
    if (load().expenses.some(t => t.id === item.id)) return res.sendStatus(409);
    load().expenses.push(item);
    save();
    res.json({ ok: true });
  });
  router.post("/templates", signed, admin, (req, res) => {
    const template = templateSchema.parse(req.body);
    const index = load().templates.findIndex(t => t.id === template.id);
    if (index >= 0) load().templates[index] = template;
    else load().templates.push(template);
    save();
    res.json({ ok: true });
  });
  router.put("/time/:itemId", signed, admin, (req, res) => {
    const input = timeSchema.parse(req.body);
    const index = load().time.findIndex(t => t.id === req.params.itemId);
    if (index < 0 || !load().projects.some(p => p.client.id === input.clientId))
      return res.sendStatus(404);
    if (input.id !== req.params.itemId) return res.sendStatus(400);
    load().time[index] = input;
    save();
    res.json({ ok: true });
  });
  router.put("/expenses/:itemId", signed, admin, (req, res) => {
    const input = expenseSchema.parse(req.body);
    const index = load().expenses.findIndex(t => t.id === req.params.itemId);
    if (index < 0 || !load().projects.some(p => p.client.id === input.clientId))
      return res.sendStatus(404);
    if (input.id !== req.params.itemId) return res.sendStatus(400);
    load().expenses[index] = input;
    save();
    res.json({ ok: true });
  });
  router.get("/backup", signed, admin, (_req, res) => {
    const { users: _users, sessions: _sessions, ...records } = load();
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=HyperScale-records.json"
    );
    res.json({ version: 2, ...records });
  });
  router.post("/import-legacy", signed, admin, (req, res) => {
    const data = storeSchema.parse(req.body);
    for (const client of data.clients)
      if (!load().projects.some(p => p.client.id === client.id))
        load().projects.push(blankProject(client));
    save();
    res.json({ ok: true });
  });
  router.use(
    (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      if (error instanceof z.ZodError)
        return res
          .status(400)
          .json({ error: "Check the required fields and their length." });
      if ((error as { type?: string })?.type === "entity.too.large")
        return res.status(413).json({
          error: "File or request is too large. Maximum upload size is 20 MB.",
        });
      res
        .status(500)
        .json({ error: "The change could not be saved. Please try again." });
    }
  );
  return router;
}
