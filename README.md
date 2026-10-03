# HyperScale website

React/Vite marketing site with an Express enquiry endpoint. There are no accounts, checkout, subscriptions, newsletters, visitor uploads, analytics, or replay in the active app.

## Local setup

Use Node.js 24 and the pnpm version pinned in `package.json`:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm check
corepack pnpm exec vitest run --root . server/enquiries.test.ts
corepack pnpm build
corepack pnpm dev
```

The dev site starts on port 3000 (or the next free port). For a production build, run `corepack pnpm start` after `build`. A Node.js host needs the built `dist/` and production dependencies. Static hosting can show the site and contact links, but cannot deliver the website enquiry form. See [DEPLOYMENT.md](DEPLOYMENT.md) for a preview upload and the later full deployment path.

## Enquiry mail configuration

Set these **server-only** environment variables in the host, never in a `VITE_` variable or client file:

| Variable | Purpose |
| --- | --- |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP server port, usually 465 or 587 |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password or app credential |
| `SMTP_FROM` | Verified sender address |
| `ENQUIRY_TO` | Business inbox for enquiries |

Until all values are set, `/api/enquiries/available` returns `{ "available": false }`. The site hides the website form and shows WhatsApp and email links after the age check. Once configured, submit a real adult test enquiry and confirm it arrives, then test a mail failure. Only the operational enquiry notification is sent; no marketing list exists.

## Legal publication checklist

- Confirm the legal business name, postal address, governing jurisdiction, web host, SMTP provider, privacy contact email, and enquiry retention period. Insert the verified details in the visible `/privacy` and `/terms` pages in `client/src/pages/Home.tsx`.
- Confirm the current `hello@hyperscale.marketing` address receives privacy and copyright notices. If not, update all occurrences in `client/src/pages/Home.tsx`.
- If visitor uploads or publishing are ever enabled, implement the repeat-infringer process and register a designated DMCA agent before launch. Publish the agent details on `/copyright` in `client/src/pages/Home.tsx`.
- If newsletters or other commercial email are added, implement opt-in, a suppression list checked before every send, a one-click unsubscribe endpoint, postal footer, and List-Unsubscribe headers. The current enquiry email must remain operational only.
- If accounts, subscriptions, analytics, or replay are added, revisit the associated age, renewal, and consent controls before enabling them.

The historical `hyperscalewebsite-source.tar.gz` is a recovery snapshot and is not used by the build. It contains older development files, so assess it before sharing the archive or making the repository public. The former local debug collector and `.manus-logs` were moved to a sibling backup folder, `HyperScale-retired-collectors-2026-09-29`, outside this repository.

## Existing site content

The recovered source and archives contain no original `/manus-storage/...` images. The pages display labeled text treatments instead of broken image icons or invented client marks. [ASSETS_REQUIRED.md](ASSETS_REQUIRED.md) lists every missing filename. Replace those paths with approved local assets and verify the built URLs before publication.

The Work page now links only to its implemented website portfolio. Other service categories are marked pending review rather than linking to missing pages. Insights teasers were withdrawn because no articles existed. Unknown production routes return HTTP 404 and show a useful page. Page titles and descriptions update for each implemented route.

Verify portfolio attribution, client names, advertised results, service markets, and contact destinations with their rights holders or owners before publication. The Al Khalil and Habboba figures in particular still need dated evidence and approval; do not treat their presence in source as verification.
