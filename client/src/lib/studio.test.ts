import { describe, expect, it } from "vitest";
import { defaultSettings, newClient, parseBackup, safeUrl, totals } from "./studio";
import { buildDocument } from "./studio-documents";

describe("Studio client records and documents", () => {
  it("calculates invoice cents, discount, VAT and overpayment credit", () => {
    const c = newClient(); c.lines = [{ description: "Build", quantity: 3, rate: 19.99 }]; c.discount = 10; c.vatRate = 5; c.paid = 60;
    expect(totals(c, { ...defaultSettings, vatRegistered: true })).toEqual({ subtotal: 5997, discount: 1000, vat: 250, total: 5247, paid: 6000, balance: -753 });
    expect(totals(c, defaultSettings).vat).toBe(0);
  });
  it("rejects malformed backups and duplicate IDs before replacing records", () => {
    expect(() => parseBackup('{"version":2}')).toThrow();
    const c = newClient();
    expect(() => parseBackup(JSON.stringify({ version: 1, settings: defaultSettings, clients: [c, c] }))).toThrow();
    expect(parseBackup(JSON.stringify({ version: 1, settings: defaultSettings, clients: [c] })).clients).toHaveLength(1);
  });
  it("exports a portal snapshot without internal notes, financial data or unsafe links", () => {
    const c = newClient(); c.notes = "SECRET-TEAM-NOTE"; c.email = "private-contact@example.com"; c.paid = 123456; c.scope = "Approved scope";
    c.tasks = [{ id: "1", title: "PRIVATE TASK", due: "", done: false, shared: false }, { id: "2", title: "Shared review", due: "", done: false, shared: true }];
    c.sharedLinks = [{ title: "unsafe", url: "javascript:alert(1)" }, { title: "Preview", url: "https://example.com/" }];
    const html = buildDocument("Client portal", c, defaultSettings, "", false);
    expect(html).toContain("Shared review"); expect(html).toContain("Approved scope");
    for (const privateValue of ["SECRET-TEAM-NOTE", "private-contact@example.com", "PRIVATE TASK", "javascript:alert", "123456"]) expect(html).not.toContain(privateValue);
    expect(html).not.toContain('contenteditable="true"');
  });
  it("escapes client HTML in every exported document", () => {
    const c = newClient(); c.brand = '<img src=x onerror="alert(1)">'; c.scope = '<script>alert(1)</script>';
    const html = buildDocument("Proposal", c, defaultSettings);
    expect(html).toContain("&lt;script&gt;"); expect(html).not.toContain('<img src=x');
    expect(safeUrl("data:text/html,evil")).toBe("");
  });
});
