import { z } from "zod";

export const documentKinds = ["Inquiry", "Proposal", "Agreement", "Invoice", "Welcome", "Client portal", "Feedback"] as const;
export type DocumentKind = typeof documentKinds[number];
export const stages = ["Enquiry", "Proposal", "Agreement", "In progress", "Complete"] as const;
const short = z.string().max(500);
const text = z.string().max(12000);
const amount = z.number().finite().min(0).max(100000000);
export const lineSchema = z.object({ description: short, quantity: z.number().finite().min(0).max(100000), rate: amount });
export const taskSchema = z.object({ id: short, title: short, due: short, done: z.boolean(), shared: z.boolean() });
export const clientSchema = z.object({
  id: short, brand: short, contact: short, email: short, phone: short, address: text,
  website: short, instagram: short, brief: text, goals: text, budget: short,
  project: short, stage: z.enum(stages), scope: text, exclusions: text, timeline: text,
  revisions: short, paymentTerms: text, agreementTerms: text, welcome: text,
  invoiceNumber: short, issueDate: short, supplyDate: short, dueDate: short, clientTrn: short,
  lines: z.array(lineSchema).max(100), paid: amount, discount: amount,
  vatRate: z.number().finite().min(0).max(100), tasks: z.array(taskSchema).max(500),
  portalMessage: text, sharedLinks: z.array(z.object({ title: short, url: short })).max(100),
  feedback: text, rating: z.number().int().min(0).max(5), notes: text,
});
export type Client = z.infer<typeof clientSchema>;
export const settingsSchema = z.object({
  legalName: short, email: short, address: text, phone: short, trn: short,
  bank: text, vatRegistered: z.boolean(), website: short,
});
export type StudioSettings = z.infer<typeof settingsSchema>;
export const storeSchema = z.object({ version: z.literal(1), settings: settingsSchema, clients: z.array(clientSchema).max(2000) });
export type StudioStore = z.infer<typeof storeSchema>;
export const STORAGE_KEY = "hyperscale-studio-v1";
export const inquirySchema = z.object({ kind: z.literal("hyperscale-inquiry"), brand: short, brief: text, website: short, instagram: short, goals: text, service: short, budget: short, timeline: short, contact: short, email: short, phone: short });
export const feedbackSchema = z.object({ kind: z.literal("hyperscale-feedback"), brand: short, why: text, valuable: text, improve: text, rating: z.number().int().min(1).max(5) });
export const defaultSettings: StudioSettings = { legalName: "", email: "", address: "", phone: "", trn: "", bank: "", vatRegistered: false, website: "https://mediumslateblue-badger-114133.hostingersite.com/" };
export function newClient(): Client {
  return { id: crypto.randomUUID(), brand: "New client", contact: "", email: "", phone: "", address: "", website: "", instagram: "", brief: "", goals: "", budget: "", project: "", stage: "Enquiry", scope: "", exclusions: "", timeline: "", revisions: "", paymentTerms: "", agreementTerms: "", welcome: "", invoiceNumber: "", issueDate: new Date().toISOString().slice(0, 10), supplyDate: "", dueDate: "", clientTrn: "", lines: [{ description: "", quantity: 1, rate: 0 }], paid: 0, discount: 0, vatRate: 0, tasks: [], portalMessage: "", sharedLinks: [], feedback: "", rating: 0, notes: "" };
}
export function parseBackup(raw: string): StudioStore {
  if (raw.length > 10000000) throw new Error("The backup is too large.");
  const data = storeSchema.parse(JSON.parse(raw));
  if (new Set(data.clients.map(client => client.id)).size !== data.clients.length) throw new Error("Duplicate client IDs in backup.");
  return data;
}
export function totals(client: Client, settings: StudioSettings) {
  const subtotal = client.lines.reduce((sum, line) => sum + Math.round(line.quantity * Math.round(line.rate * 100)), 0);
  const discount = Math.min(subtotal, Math.round(client.discount * 100));
  const net = subtotal - discount;
  const vat = settings.vatRegistered ? Math.round(net * client.vatRate / 100) : 0;
  const total = net + vat;
  const paid = Math.round(client.paid * 100);
  return { subtotal, discount, vat, total, paid, balance: total - paid };
}
export const money = (cents: number) => new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED" }).format(cents / 100);
export function safeUrl(value: string) {
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.href : ""; } catch { return ""; }
}
export function downloadFile(name: string, content: string, type = "text/html") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a"); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function fileName(value: string) { return value.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 80) || "HyperScale"; }
