# Putting HyperScale online

## Temporary Hostinger upload

There is **no database file** for this version of HyperScale. The code has no SQL schema, migrations, or database connection. Enquiries are sent by the Node server through SMTP when the owner configures a sending account; the site does not store them in a database.

For a temporary website on Hostinger, use `HyperScale-Hostinger-static-preview-2026-10-03-branded.zip`. This package contains the built website and an Apache `.htaccess` file so direct visits to `/contact`, `/work`, and other React routes open correctly. It includes a `noindex` header for a review site, which does not make the link private.

1. In Hostinger, create or select a **new empty temporary website or subdomain**. Do not extract this package over an existing site's files or `.htaccess`.
2. Open that website's **File Manager → public_html**. Upload the ZIP, then extract it **inside `public_html`**. `index.html`, `.htaccess`, `assets/`, and `fonts/` should sit directly in that folder, with no extra enclosing directory.
3. Open the temporary URL, then refresh `/contact` and `/work` directly to check routing. Test on a phone as well.

This is a **static preview**. The Express enquiry endpoint is not in the ZIP, so the website form remains unavailable and the age-gated WhatsApp/email links are shown instead. Confirm those contact destinations are monitored before inviting visitors. To enable the form later, deploy the Node app through Hostinger's supported Node.js hosting flow and configure the server-only SMTP values in `README.md`; uploading an SQL file will not enable it. Hostinger documents [File Manager uploads](https://www.hostinger.com/tutorials/how-to-upload-your-website/) and its separate [Node.js web app deployment](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/).

## Fast preview: Cloudflare Pages Direct Upload

The prepared `HyperScale-preview-2026-10-03-branded.zip` contains the latest built public website, including the restored layouts and supplied HyperScale logo. It includes a `noindex` response header for this review version. The preview URL is still public to anyone who has the link; `noindex` is not password protection.

1. Sign in to [Cloudflare](https://dash.cloudflare.com/) with an account you control.
2. Open **Workers & Pages**, then **Create application → Get started → Drag and drop your files**.
3. Choose a project name such as `hyperscale-preview` and upload `HyperScale-preview-2026-10-03-branded.zip` from this folder. Select **Deploy site**.
4. Open the resulting `*.pages.dev` URL. Check the home, contact, work, privacy, terms, and copyright pages on phone and desktop. Share the link only with reviewers until the launch items below are settled.

This upload does not include the Node server. The website enquiry form therefore stays hidden. After an adult age entry, visitors can use the WhatsApp and email links, but their destination ownership and monitoring still need confirmation. Cloudflare's [Direct Upload guide](https://developers.cloudflare.com/pages/get-started/direct-upload/) supports a ZIP of built assets and provides a `pages.dev` address. A Direct Upload project cannot later switch to Git integration; make a new Pages project if automatic Git deployments become desirable.

To make an updated preview, run `corepack pnpm build` and create a fresh ZIP from `dist/public` with a preview-only `_headers` file containing `/*` followed by `X-Robots-Tag: noindex`. Do not upload the repository or the historical source archive as website assets.

## Full launch

Before attaching the business domain or inviting customers:

- Confirm the business name, postal address, privacy contact, governing jurisdiction, hosting and email processors, and retention period in the privacy and terms pages.
- Confirm the WhatsApp number and `hello@hyperscale.marketing` inbox are controlled and monitored. Choose the inbox and sending provider for website enquiries, then set the six server-only SMTP variables listed in `README.md` on a Node host. Send a real test enquiry and verify delivery before showing the form.
- Approve the client names, portfolio attribution, campaign figures, service markets, and missing images listed in `ASSETS_REQUIRED.md`.
- Decide who controls the domain's DNS. Connect the approved domain to the chosen host, enable HTTPS, and test all routes and enquiry delivery on that public domain.

For the existing Node server, use a host that runs `node dist/index.js`, sets `PORT`, and permits outbound mail to the chosen provider. The app builds with `corepack pnpm build`; deploy the built `dist/`, production dependencies, and environment variables. A static Pages upload alone cannot run this Express endpoint. [Render's Node service guide](https://render.com/docs/web-services/) describes one possible Node host; its [free tier blocks outbound SMTP ports](https://render.com/docs/free/), so it cannot run this app's current mail transport without a different delivery design or suitable paid host.

