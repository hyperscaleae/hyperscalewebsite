import express from "express";
import { createServer } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { enquiryRouter, isAtLeast13 } from "./enquiries";

describe("enquiry age gate", () => {
  it("accepts a neutral numeric age of 13 or older", () => {
    expect(isAtLeast13(13)).toBe(true);
    expect(isAtLeast13(12)).toBe(false);
    expect(isAtLeast13("13")).toBe(false);
  });

  let server: ReturnType<typeof createServer>;
  let baseUrl: string;
  beforeAll(async () => {
    const app = express();
    app.use("/api/enquiries", enquiryRouter);
    server = createServer(app);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("No test port");
    baseUrl = `http://127.0.0.1:${address.port}`;
  });
  afterAll(async () => { await new Promise<void>((resolve) => server.close(() => resolve())); });

  it("rejects an under-13 request before delivery even when it includes personal data", async () => {
    const response = await fetch(`${baseUrl}/api/enquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ age: 12, name: "Minor", email: "minor@example.invalid", contactConsent: true }),
    });
    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("does not claim delivery when SMTP has not been configured", async () => {
    const response = await fetch(`${baseUrl}/api/enquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ age: 25, name: "Adult", email: "adult@example.invalid", contactConsent: true, kind: "hero" }),
    });
    expect(response.status).toBe(503);
  });
});
