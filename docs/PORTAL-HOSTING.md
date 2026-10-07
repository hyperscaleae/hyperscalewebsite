# HyperScale shared workspace

## Desktop

Open **Desktop / HyperScale Studio / Open HyperScale Dashboard.cmd**. Create your agency account with your own email and a password of at least 12 characters. The local app runs at http://127.0.0.1:4590/dashboard. It listens only on this computer. Client accounts work locally for testing; clients on other computers need the hosted server below.

Projects save on the server. Previous browser records stay intact; import them from Settings in the same browser that held the old workspace. Inquiry stays at the public website `/inquiry`.

The complete local data folder is `%USERPROFILE%\.hyperscale-portal`. It contains encrypted records, encrypted uploads and a local encryption key. Protect access to this Windows account. To back up the complete workspace, stop the server and copy this entire folder to a private encrypted backup location. Restore the folder with its matching key while the server is stopped. Never place it inside `site`, `public`, a Git repository or a publicly shared folder. The dashboard record export excludes passwords and file contents.

## Internet hosting

### Hostinger (selected provider)

The public preview is currently a static site. Hostinger now supports Node web apps on Business and Cloud plans; confirm the account's plan in hPanel. Use a **new Node web app** for the portal, so the existing preview remains available.

Two deployment options are prepared:

- Git repository: `hyperscaleae/hyperscalewebsite`, branch `codex/recover-source`. Choose Express or Other, Node 24, build with `corepack enable && pnpm install --frozen-lockfile && pnpm build`, start with `node dist/index.js` (entry `dist/index.js`).
- Project ZIP: Desktop / HyperScale Studio / Dashboard / HyperScale-Hostinger-Node-portal.zip. This contains a prebuilt Express server and public assets, with no accounts or private records. Choose Express or Other, Node 24, project root `.`, output `.`, entry `index.cjs`, build `npm run build`, start `npm start`. The supplied build command only checks the prebuilt server. Do not upload the private workspace folder.

In hPanel configure `NODE_ENV=production`, `PORTAL_ORIGIN` to the exact HTTPS app URL without a trailing slash, the private encryption key, and first administrator email/password as described below. `PORTAL_DATA_DIR` must be an absolute private directory **outside** `public_html`, `nodejs`, and `hbuilds`. Those deployment folders are replaced across builds. Confirm the persistent directory with Hostinger and verify records/uploads survive both restart and redeploy before inviting clients. Keep one server process. Do not deploy this file store on an ephemeral filesystem.

The hosting plan, private directory and final portal URL are not yet verified in your account. No subscription or upgrade has been purchased.

Official Hostinger guide: https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/

### Optional alternative

The Hostinger static preview cannot run this private server. `render.yaml` is an optional prepared configuration for a **paid** Node web service with a persistent disk; it has not purchased or created hosting. Use one process and one instance. A persistent disk is essential for this implementation; ephemeral hosting would lose saved records and uploads on redeployment.

1. In your hosting account connect `hyperscaleae/hyperscalewebsite`, branch `codex/recover-source`, as a Node web service. On Render, the blueprint supplies the build/start commands and disk. Review the plan and cost before creating it.
2. Set `NODE_ENV=production`, `PORTAL_DATA_DIR=/var/data/hyperscale`, and `PORTAL_ORIGIN` to the exact HTTPS service URL, without a trailing slash. Add a persistent disk mounted at `/var/data` and keep one instance.
3. In the provider's private environment settings, set `PORTAL_ENCRYPTION_KEY` to 64 random hexadecimal characters, `PORTAL_ADMIN_EMAIL` to your email and `PORTAL_ADMIN_PASSWORD` to your chosen password (12+ characters). Generate the encryption key privately with Node's `crypto.randomBytes(32).toString('hex')`. Do not paste passwords or the key into chat, source files or screenshots.
4. Deploy. Open `/dashboard`, sign in, fill Settings and create a project. Use Client access to create the client's account. Give the client the `/portal` URL and their temporary credentials through a private channel. They can change their password in Account. No invitations are emailed automatically.
5. Verify with two separate client accounts that files, messages and requests cannot cross projects. Publish a document, approve it through the intended client, upload/download a file and confirm data survives a restart before inviting real clients. Remove bootstrap password/email environment variables after the first admin exists; retain the encryption key.

## Included

- Agency project editor, shared milestones, file uploads/downloads, client requests and messages.
- Proposal, agreement, invoice and welcome document previews, printable HTML copies, immutable published document versions and client approvals with name, time, account and content hash.
- Time logging/timer, CSV export, expenses, reusable project templates, client account management and record export.
- Password hashing, HTTP-only session cookies, CSRF/origin checks, encrypted storage, project access checks and login throttling. HTTPS is required in production.

## Operational boundaries

Document approval records a review acknowledgment. It is not a third-party verified electronic signature service. Invoice payments open your configured provider link; payment reconciliation, automated email, antivirus scanning, multi-factor authentication and email password recovery are not implemented. Password resets are administered in Settings. The initial server is suitable for one small agency instance; move to a transactional database and object storage before scaling to multiple instances. Shared updates refresh every 15 seconds.

Business name, address, bank and tax fields remain editable and blank until provided. Agreements need your legal review before use. Configure a retention policy and encrypted backups before storing real client documents. No production security audit has been performed.

Official deployment references: [Node Express on Render](https://render.com/docs/deploy-node-express-app), [persistent disks and backups](https://render.com/docs/disks), [Express security guidance](https://expressjs.com/en/advanced/best-practice-security/).
