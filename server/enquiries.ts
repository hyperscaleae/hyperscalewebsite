import express from "express";
import nodemailer from "nodemailer";
import { z } from "zod";

export const enquiryRouter = express.Router();
enquiryRouter.use(express.json({ limit: "12kb" }));
enquiryRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

const enquirySchema = z.object({
  kind: z.enum(["hero", "detailed"]),
  age: z.number().int().min(13).max(120),
  name: z.string().trim().min(1).max(100),
  email: z.email().max(254),
  phone: z.string().trim().max(40).optional(),
  company: z.string().trim().max(120).optional(),
  budget: z.string().trim().max(60).optional(),
  help: z.string().trim().max(80).optional(),
  services: z.array(z.string().trim().max(80)).max(10).optional(),
  objectives: z.string().trim().max(3000).optional(),
  contactConsent: z.literal(true),
  website: z.string().max(0).optional(), // Honeypot: humans leave this blank.
});

export function isAtLeast13(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 13 && value <= 120;
}

function smtpSettings() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, ENQUIRY_TO } = process.env;
  const port = Number(SMTP_PORT);
  if (!SMTP_HOST || !Number.isInteger(port) || port < 1 || port > 65535 || !SMTP_USER || !SMTP_PASS || !SMTP_FROM || !ENQUIRY_TO) return null;
  return { host: SMTP_HOST, port, user: SMTP_USER, pass: SMTP_PASS, from: SMTP_FROM, to: ENQUIRY_TO };
}

enquiryRouter.get("/available", (_req, res) => {
  res.json({ available: Boolean(smtpSettings()) });
});

enquiryRouter.post("/", async (req, res) => {
  // Check age before parsing, storing, logging, or sending any other submitted field.
  const age = req.body?.age;
  if (typeof age !== "number" || !Number.isInteger(age) || age < 0 || age > 120) {
    res.status(400).json({ error: "Enter a valid age." });
    return;
  }
  if (!isAtLeast13(age)) {
    res.status(403).json({ error: "This enquiry cannot be accepted." });
    return;
  }

  const settings = smtpSettings();
  if (!settings) {
    res.status(503).json({ error: "The enquiry form is temporarily unavailable. Please contact us directly." });
    return;
  }

  const result = enquirySchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Check the required fields and try again." });
    return;
  }

  const { kind, name, email, phone, company, budget, help, services, objectives } = result.data;
  const lines = [
    `Enquiry type: ${kind}`,
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || "Not supplied"}`,
    `Company: ${company || "Not supplied"}`,
    `Budget: ${budget || "Not supplied"}`,
    `Help requested: ${help || "Not supplied"}`,
    `Services: ${services?.join(", ") || "Not supplied"}`,
    `Objectives: ${objectives || "Not supplied"}`,
  ];

  try {
    const transport = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.port === 465,
      requireTLS: settings.port !== 465,
      auth: { user: settings.user, pass: settings.pass },
    });
    // Operational enquiry notification only. Never add marketing content here.
    await transport.sendMail({
      from: settings.from,
      to: settings.to,
      replyTo: email,
      subject: `HyperScale website enquiry (${kind})`,
      text: lines.join("\n"),
    });
    res.status(200).json({ received: true });
  } catch {
    // No names, addresses, message content, or SMTP credentials in logs.
    res.status(502).json({ error: "We could not deliver your enquiry. Please contact us directly." });
  }
});
