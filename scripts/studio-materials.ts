import fs from "node:fs";
import path from "node:path";
import { buildDocument } from "../client/src/lib/studio-documents";
import { defaultSettings, documentKinds, newClient } from "../client/src/lib/studio";

const directory = path.resolve("studio-materials/Editable Templates");
fs.mkdirSync(directory, { recursive: true });
const logo = `data:image/png;base64,${fs.readFileSync("client/public/brand/hyperscale-h.png").toString("base64")}`;
const blank = { ...newClient(), brand: "", issueDate: "" };
for (const kind of documentKinds) {
  const html = buildDocument(kind, blank, defaultSettings, logo, true);
  fs.writeFileSync(path.join(directory, `HyperScale-${kind.replace(/ /g, "-")}.html`), html);
}
fs.writeFileSync("studio-materials/blank-workspace.json", JSON.stringify({ version: 1, settings: defaultSettings, clients: [] }, null, 2));
console.log("Generated seven editable/printable templates.");
const profileDir = path.resolve("studio-materials/Company Profile");
fs.mkdirSync(profileDir, { recursive: true });
const base = buildDocument("Welcome", blank, defaultSettings, logo);
const style = base.match(/<style>([\s\S]*?)<\/style>/)![1];
const services = [
  ["Websites and conversion", "Website planning, design and development, landing pages and conversion review."],
  ["Performance marketing", "Campaign structure, creative testing, landing pages and reporting."],
  ["Growth strategy", "Research, positioning, customer journeys and priorities for testing."],
  ["E-commerce growth", "Storefront improvements, product discovery, promotions and retention journeys."],
  ["Creative systems", "Campaign concepts, content direction and creative testing."],
  ["AI and automation", "Workflow mapping, reporting automation and internal tools."],
];
fs.writeFileSync(path.join(profileDir, "HyperScale-Company-Profile.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HyperScale company profile</title><style>${style}</style></head><body><header><b>HYPERSCALE</b><button onclick="window.print()">Print / Save PDF</button><button onclick="saveCopy()">Save edited copy</button></header><article contenteditable="true"><div class="brand"><strong>HYPERSCALE</strong><img src="${logo}" alt="HyperScale"></div><h1>Company profile</h1><p class="intro">Websites, marketing and systems for growing businesses.</p><p>We help businesses clarify their offer, improve their digital experience and connect marketing with practical business goals. Each project starts with a conversation about the audience, scope and priorities.</p><h2>Our services</h2>${services.map(([name,description])=>`<section><h2>${name}</h2><p>${description}</p></section>`).join("")}<section><h2>How we work</h2><p>Enquiry and discovery. Proposal and agreement. Kickoff and delivery. Reviews, handover and feedback. Deliverables, timelines and fees are agreed for each project.</p></section><section><h2>Contact</h2><p>[Legal business name]<br>[Business email]<br>[Phone]<br>[Address]</p><p><a href="${defaultSettings.website}">View our website preview</a></p></section><footer>HyperScale · Editable company profile</footer></article><script>function saveCopy(){const url=URL.createObjectURL(new Blob(['<!doctype html>'+document.documentElement.outerHTML],{type:'text/html'}));const a=document.createElement('a');a.href=url;a.download='HyperScale-Company-Profile-edited.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}</script></body></html>`);
