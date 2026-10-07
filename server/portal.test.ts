import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import express from "express";
import { Server } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { createPortalRouter, seal, unseal } from "./portal";
import { newClient } from "../client/src/lib/studio";

describe("private shared workspace", () => {
  let server: Server, origin: string, directory: string;
  let owner = { cookie: "", csrf: "" },
    client = { cookie: "", csrf: "" },
    clientB = { cookie: "", csrf: "" };
  const a = {
    ...newClient(),
    brand: "Client A",
    notes: "Agency-only secret",
    tasks: [
      {
        id: "shared",
        title: "Design",
        due: "2026-11-01",
        done: false,
        shared: true,
      },
      {
        id: "private",
        title: "Internal pricing",
        due: "",
        done: false,
        shared: false,
      },
    ],
  };
  const b = { ...newClient(), brand: "Client B" };
  let privateFile: string, sharedFile: string, documentId: string;
  async function start() {
    const app = express();
    app.use(
      "/api/portal",
      createPortalRouter({ directory, production: false })
    );
    server = await new Promise<Server>(resolve => {
      const s = app.listen(0, "127.0.0.1", () => resolve(s));
    });
    origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  }
  async function call(
    url: string,
    method = "GET",
    data?: unknown,
    auth = owner,
    extra: Record<string, string> = {}
  ) {
    return fetch(origin + "/api/portal" + url, {
      method,
      headers: {
        Origin: origin,
        ...(data !== undefined ? { "Content-Type": "application/json" } : {}),
        Cookie: auth.cookie,
        "X-CSRF-Token": auth.csrf,
        ...extra,
      },
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }
  async function login(email: string, password: string) {
    const response = await call("/login", "POST", { email, password });
    expect(response.status).toBe(200);
    const body = await response.json();
    return {
      cookie: response.headers.get("set-cookie")!.split(";")[0],
      csrf: body.csrf,
    };
  }
  beforeAll(async () => {
    directory = fs.mkdtempSync(
      path.join(os.tmpdir(), "hyperscale-portal-test-")
    );
    await start();
  });
  afterAll(async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
    if (
      path
        .resolve(directory)
        .startsWith(path.resolve(os.tmpdir()) + path.sep) &&
      path.basename(directory).startsWith("hyperscale-portal-test-")
    )
      fs.rmSync(directory, { recursive: true, force: true });
  });
  it("rejects unauthenticated access and cross-origin setup", async () => {
    expect((await call("/agency")).status).toBe(401);
    expect(
      (
        await call(
          "/setup",
          "POST",
          {
            name: "Owner",
            email: "owner@example.test",
            password: "test-owner-password",
          },
          owner,
          { Origin: "https://evil.test" }
        )
      ).status
    ).toBe(403);
  });
  it("creates the local owner once with an HTTP-only session", async () => {
    const r = await call("/setup", "POST", {
      name: "Owner",
      email: "owner@example.test",
      password: "test-owner-password",
    });
    expect(r.status).toBe(200);
    expect(r.headers.get("set-cookie")).toContain("HttpOnly");
    const data = await r.json();
    owner = {
      cookie: r.headers.get("set-cookie")!.split(";")[0],
      csrf: data.csrf,
    };
    expect(
      (
        await call("/setup", "POST", {
          name: "Other",
          email: "other@example.test",
          password: "test-other-password",
        })
      ).status
    ).toBe(403);
  });
  it("requires CSRF and saves versioned projects", async () => {
    expect(
      (await call("/clients", "POST", a, { ...owner, csrf: "wrong" })).status
    ).toBe(403);
    expect((await call("/clients", "POST", a)).status).toBe(200);
    expect((await call("/clients", "POST", b)).status).toBe(200);
    expect(
      (await call(`/clients/${a.id}`, "PUT", { client: a, revision: 99 }))
        .status
    ).toBe(409);
    expect(
      (
        await call(`/clients/${a.id}`, "PUT", {
          client: { ...a, project: "Website" },
          revision: 1,
        })
      ).status
    ).toBe(200);
  });
  it("creates scoped accounts without exposing password hashes", async () => {
    for (const [email, clientId] of [
      ["a@example.test", a.id],
      ["b@example.test", b.id],
    ])
      expect(
        (
          await call("/users", "POST", {
            name: email,
            email,
            password: "test-client-password",
            clientId,
          })
        ).status
      ).toBe(200);
    client = await login("a@example.test", "test-client-password");
    clientB = await login("b@example.test", "test-client-password");
    const r = await call("/agency");
    const data = await r.json();
    expect(
      data.users.every((u: object) => !("hash" in u) && !("salt" in u))
    ).toBe(true);
    expect(data.sessions).toBeUndefined();
  });
  it("hides private fields and prevents client cross-project access", async () => {
    const data = await (await call("/client", "GET", undefined, client)).json();
    expect(data.project.brand).toBe("Client A");
    expect(data.project.notes).toBeUndefined();
    expect(data.project.tasks.map((t: { id: string }) => t.id)).toEqual([
      "shared",
    ]);
    expect((await call("/agency", "GET", undefined, client)).status).toBe(403);
    expect(
      (
        await call(
          `/clients/${b.id}/messages`,
          "POST",
          { text: "Intrusion" },
          client
        )
      ).status
    ).toBe(404);
  });
  it("shares messages and requests and lets the agency update request progress", async () => {
    expect(
      (
        await call(
          `/clients/${a.id}/messages`,
          "POST",
          { text: "Here are our requirements" },
          client
        )
      ).status
    ).toBe(200);
    expect(
      (
        await call(
          `/clients/${a.id}/requests`,
          "POST",
          { title: "Add a page", description: "A new landing page" },
          client
        )
      ).status
    ).toBe(200);
    const data = await (await call("/client", "GET", undefined, client)).json();
    expect(data.messages[0].author).toBe("a@example.test");
    const requestId = data.requests[0].id;
    expect(
      (
        await call(
          `/clients/${a.id}/requests/${requestId}`,
          "PUT",
          { status: "Done" },
          client
        )
      ).status
    ).toBe(403);
    expect(
      (
        await call(`/clients/${a.id}/requests/${requestId}`, "PUT", {
          status: "In progress",
        })
      ).status
    ).toBe(200);
  });
  it("encrypts files, checks visibility and round-trips authorized downloads", async () => {
    for (const shared of [false, true]) {
      const r = await fetch(origin + `/api/portal/clients/${a.id}/files`, {
        method: "POST",
        headers: {
          Origin: origin,
          Cookie: owner.cookie,
          "X-CSRF-Token": owner.csrf,
          "Content-Type": "application/octet-stream",
          "X-File-Name": "brief.txt",
          "X-Shared": String(shared),
        },
        body: "Confidential client brief",
      });
      expect(r.status).toBe(200);
    }
    const agency = await (await call("/agency")).json();
    const files = agency.projects.find(
      (p: { client: { id: string } }) => p.client.id === a.id
    ).files;
    privateFile = files[0].id;
    sharedFile = files[1].id;
    expect(
      (
        await call(
          `/clients/${a.id}/files/${privateFile}`,
          "GET",
          undefined,
          client
        )
      ).status
    ).toBe(404);
    expect(
      (
        await call(
          `/clients/${a.id}/files/${sharedFile}`,
          "GET",
          undefined,
          clientB
        )
      ).status
    ).toBe(404);
    const download = await call(
      `/clients/${a.id}/files/${sharedFile}`,
      "GET",
      undefined,
      client
    );
    expect(await download.text()).toBe("Confidential client brief");
    expect(download.headers.get("content-disposition")).toContain("attachment");
    expect(
      fs
        .readFileSync(path.join(directory, "files", sharedFile + ".enc"))
        .includes(Buffer.from("Confidential client brief"))
    ).toBe(false);
  });
  it("records approval of an immutable published document", async () => {
    await call(`/clients/${a.id}/documents`, "POST", {
      title: "Website proposal",
      kind: "Proposal",
      html: "<h1>Version one</h1>",
      published: true,
    });
    const data = await (await call("/client", "GET", undefined, client)).json();
    documentId = data.documents[0].id;
    expect(
      (
        await call(
          `/clients/${a.id}/documents/${documentId}/approve`,
          "POST",
          { name: "Client A" },
          clientB
        )
      ).status
    ).toBe(404);
    expect(
      (
        await call(
          `/clients/${a.id}/documents/${documentId}/approve`,
          "POST",
          { name: "Client A" },
          client
        )
      ).status
    ).toBe(200);
    const doc = (await (await call("/client", "GET", undefined, client)).json())
      .documents[0];
    expect(doc.approval.digest).toMatch(/^[a-f0-9]{64}$/);
    expect(doc.approval.userId).toBeTruthy();
    expect(
      (
        await call(
          `/clients/${a.id}/documents/${documentId}/approve`,
          "POST",
          { name: "Repeat" },
          client
        )
      ).status
    ).toBe(409);
  });
  it("persists encrypted records and sessions across a restart", async () => {
    const bytes = fs.readFileSync(path.join(directory, "workspace.enc"));
    expect(bytes.includes(Buffer.from("Agency-only secret"))).toBe(false);
    expect(bytes.includes(Buffer.from("test-owner-password"))).toBe(false);
    await new Promise<void>(resolve => server.close(() => resolve()));
    await start();
    expect((await call("/session")).status).toBe(200);
    const d = await (await call("/client", "GET", undefined, client)).json();
    expect(d.documents[0].approval.name).toBe("Client A");
    expect(
      await (
        await call(
          `/clients/${a.id}/files/${sharedFile}`,
          "GET",
          undefined,
          client
        )
      ).text()
    ).toBe("Confidential client brief");
  });
  it("saves and corrects time and expenses without accepting nonexistent projects", async () => {
    const time = {
      id: "time-test",
      clientId: a.id,
      description: "Design",
      date: "2026-10-07",
      minutes: 45,
      rate: 120,
      billable: true,
    };
    expect(
      (await call("/time", "POST", { ...time, clientId: "missing" })).status
    ).toBe(404);
    expect((await call("/time", "POST", time)).status).toBe(200);
    expect(
      (await call("/time/time-test", "PUT", { ...time, minutes: 60 })).status
    ).toBe(200);
    const expense = {
      id: "expense-test",
      clientId: a.id,
      description: "Stock image",
      date: "2026-10-07",
      amount: 50,
    };
    expect((await call("/expenses", "POST", expense)).status).toBe(200);
    expect(
      (await call("/expenses/expense-test", "PUT", { ...expense, amount: 40 }))
        .status
    ).toBe(200);
    expect((await call("/time/time-test", "PUT", time, clientB)).status).toBe(
      403
    );
    const data = await (await call("/agency")).json();
    expect(data.time[0].minutes).toBe(60);
    expect(data.expenses[0].amount).toBe(40);
  });
  it("revokes sessions when client access is disabled", async () => {
    const d = await (await call("/agency")).json();
    const u = d.users.find(
      (u: { email: string }) => u.email === "a@example.test"
    );
    await call(`/users/${u.id}`, "PUT", { disabled: true });
    expect((await call("/client", "GET", undefined, client)).status).toBe(401);
  });
  it("rejects modified encrypted records", () => {
    const key = randomBytes(32);
    const data = seal(Buffer.from("private"), key);
    data[data.length - 1] ^= 1;
    expect(() => unseal(data, key)).toThrow();
  });
  it("bootstraps the hosted administrator from private environment configuration with secure cookies",async()=>{
    const prodOrigin="https://portal.example.test";
    vi.stubEnv("PORTAL_ENCRYPTION_KEY",randomBytes(32).toString("hex"));vi.stubEnv("PORTAL_ADMIN_EMAIL","hosted-owner@example.test");vi.stubEnv("PORTAL_ADMIN_PASSWORD","hosted-test-password");
    const app=express();app.use("/api/portal",createPortalRouter({directory:path.join(directory,"production"),origin:prodOrigin,production:true}));
    const hosted=await new Promise<Server>(resolve=>{const s=app.listen(0,"127.0.0.1",()=>resolve(s));});
    const hostUrl=`http://127.0.0.1:${(hosted.address() as {port:number}).port}`;
    try{
      const status=await(await fetch(hostUrl+"/api/portal/status")).json();expect(status).toEqual({available:true,setup:false});
      const result=await fetch(hostUrl+"/api/portal/login",{method:"POST",headers:{Origin:prodOrigin,"Content-Type":"application/json"},body:JSON.stringify({email:"hosted-owner@example.test",password:"hosted-test-password"})});
      expect(result.status).toBe(200);expect(result.headers.get("set-cookie")).toContain("Secure");expect((await result.json()).user.role).toBe("admin");
      expect((await fetch(hostUrl+"/api/portal/setup",{method:"POST",headers:{Origin:prodOrigin,"Content-Type":"application/json"},body:JSON.stringify({name:"Intruder",email:"wrong@example.test",password:"intruder-test-password"})})).status).toBe(403);
    }finally{await new Promise<void>(resolve=>hosted.close(()=>resolve()));vi.unstubAllEnvs();}
  });
});
