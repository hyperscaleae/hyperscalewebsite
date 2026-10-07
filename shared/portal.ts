import { z } from "zod";
import { clientSchema, settingsSchema } from "../client/src/lib/studio";

export const label = z.string().trim().min(1).max(300);
export const body = z.string().trim().min(1).max(12000);
export const credentials = z.object({
  email: z
    .string()
    .email()
    .max(254)
    .transform(s => s.toLowerCase()),
  password: z.string().min(12).max(200),
});
export const publicUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(["admin", "client"]),
  clientId: z.string().nullable(),
  disabled: z.boolean(),
});
export type PortalUser = z.infer<typeof publicUserSchema>;
export const messageSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  authorId: z.string(),
  author: z.string(),
  role: z.enum(["admin", "client"]),
  text: z.string(),
  created: z.string(),
});
export const requestSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  title: label,
  description: z.string().max(12000),
  status: z.enum(["New", "In progress", "Done"]),
  created: z.string(),
  author: z.string(),
});
export const fileSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  name: z.string(),
  size: z.number(),
  uploadedBy: z.string(),
  created: z.string(),
  shared: z.boolean(),
});
export const docSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  title: z.string(),
  kind: z.enum(["Proposal", "Agreement", "Invoice", "Welcome"]),
  html: z.string(),
  created: z.string(),
  published: z.boolean(),
  approval: z
    .object({
      name: z.string(),
      userId: z.string(),
      at: z.string(),
      digest: z.string(),
    })
    .nullable(),
});
export const timeSchema = z.object({
  id: label,
  clientId: label,
  description: label,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  minutes: z.number().int().min(1).max(1440),
  rate: z.number().min(0).max(100000),
  billable: z.boolean(),
});
export const expenseSchema = z.object({
  id: label,
  clientId: label,
  description: label,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().min(0).max(100000000),
});
export const templateSchema = z.object({
  id: z.string(),
  name: label,
  scope: z.string().max(12000),
  exclusions: z.string().max(12000),
  timeline: z.string().max(12000),
  revisions: z.string().max(500),
  tasks: z.array(z.string().max(300)).max(50),
});
export const projectSchema = z.object({
  client: clientSchema,
  revision: z.number().int(),
  messages: z.array(messageSchema),
  requests: z.array(requestSchema),
  files: z.array(fileSchema),
  documents: z.array(docSchema),
});
export type Project = z.infer<typeof projectSchema>;
export type ProjectRequest = z.infer<typeof requestSchema>;
export type ProjectDocument = z.infer<typeof docSchema>;
export type TimeEntry = z.infer<typeof timeSchema>;
export type Expense = z.infer<typeof expenseSchema>;
export type ProjectTemplate = z.infer<typeof templateSchema>;
export type AgencyData = {
  projects: Project[];
  settings: z.infer<typeof settingsSchema>;
  users: PortalUser[];
  time: TimeEntry[];
  expenses: Expense[];
  templates: ProjectTemplate[];
  paymentLink: string;
};
export type ClientData = {
  project: {
    id: string;
    brand: string;
    project: string;
    stage: string;
    scope: string;
    timeline: string;
    portalMessage: string;
    tasks: z.infer<typeof clientSchema>["tasks"];
    sharedLinks: z.infer<typeof clientSchema>["sharedLinks"];
  };
  messages: z.infer<typeof messageSchema>[];
  requests: ProjectRequest[];
  files: z.infer<typeof fileSchema>[];
  documents: ProjectDocument[];
  paymentLink: string;
};
