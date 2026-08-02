# Vert Printing Website

Static brochure website for Vert Printing, ready for Cloudflare Pages.

## Local Preview

Open `index.html` directly in a browser, or run any static file server from this folder.

## Cloudflare Pages

Use these settings:

- Framework preset: `None`
- Build command: leave blank
- Build output directory: `/`
- Root directory: `/`

## Future Upgrade Path

- Add Cloudflare Pages Functions for a real quote form endpoint.
- Add Turnstile spam protection before accepting public form submissions.
- Move services/gallery content into a CMS or structured JSON.
- Add ecommerce only for fixed-price products or event packages.

## Quote Form Email

The quote form submits to a Cloudflare Pages Function at `/api/quote` and sends email through Postmark.

Set these Cloudflare Pages environment variables and secrets:

- `POSTMARK_SERVER_TOKEN` secret: Postmark server API token.
- `POSTMARK_FROM_EMAIL` variable: verified sender address in Postmark, for example `info@vertprinting.co.za`.
- `QUOTE_TO_EMAIL` variable: destination inbox for quote requests, for example `info@vertprinting.co.za`.
- `POSTMARK_MESSAGE_STREAM` variable: optional, defaults to `outbound`.
- `TURNSTILE_SECRET` secret: Cloudflare Turnstile secret key.

The Turnstile site key is embedded in `index.html`; keep `TURNSTILE_SECRET` configured as a Cloudflare Pages secret.

Artwork uploads are not emailed yet. The form collects the request details, and customers can send artwork by reply/WhatsApp until file storage is added.