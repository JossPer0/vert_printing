# Vert Shop Architecture Audit

**Project:** Vert Printing  
**Phase:** Phase 0 - Repository & Architecture Audit  
**Date:** 18 August 2026  
**Source brief:** `md files/VERT_SHOP_BUILD.md`

---

## 1. Current Repository Summary

The current site is a small static Cloudflare Pages website with one Cloudflare Pages Function for quote form submissions.

It is not currently a framework application. There is no package manager setup, build pipeline, component system, router, local test runner, database client, or generated asset pipeline in the repository.

Current public site files:

```text
index.html
styles.css
script.js
assets/
robots.txt
sitemap.xml
_redirects
wrangler.toml
functions/api/quote.js
```

The new ecommerce brief is present at:

```text
md files/VERT_SHOP_BUILD.md
```

---

## 2. Current Framework And Runtime

### Frontend

Current frontend type:

```text
Vanilla HTML, CSS and JavaScript
```

There is no React, Vue, Svelte, Astro, Next.js, Vite or other frontend framework installed.

### Backend

Current backend execution is limited to Cloudflare Pages Functions:

```text
functions/api/quote.js
```

This is the safest existing server-side place to keep secrets and call external APIs.

### Build

There is no build command. Cloudflare Pages serves the repository root as the output directory.

Current Cloudflare config:

```toml
name = "vert-printing"
pages_build_output_dir = "."
compatibility_date = "2026-08-02"

[vars]
POSTMARK_FROM_EMAIL = "info@vertprinting.co.za"
QUOTE_TO_EMAIL = "info@vertprinting.co.za"
POSTMARK_MESSAGE_STREAM = "outbound"
```

---

## 3. Routing Structure

The public website is currently a one-page site with hash-based navigation:

```text
/#top
/#services
/#work
/#story
/#quote
```

There are no separate HTML pages for services, shop, product details, checkout, admin or policies yet.

Cloudflare Pages redirects are configured in `_redirects` for common legacy paths:

```text
/home -> /
/about-us -> /#story
/contact-us -> /#quote
/services -> /#services
/gallery -> /#work
/shop -> /#quote
/cart -> /#quote
/checkout -> /#quote
/my-account -> /#quote
/product/* -> /#quote
```

These redirects are useful during the brochure-site phase, but they will conflict with ecommerce routes later. Before implementing public shop routes, remove or change at least:

```text
/shop
/cart
/checkout
/my-account
/product/*
```

---

## 4. Styling And Design System

Styling is a single stylesheet:

```text
styles.css
```

The design is custom CSS using CSS variables. Current brand variables include:

```css
--ink: #1f2426;
--paper: #fbfaf7;
--teal: #007c7a;
--teal-dark: #005c5a;
--coral: #e8694f;
--hot-pink: #ec168c;
```

The visual language is:

- dark translucent fixed header,
- wide photographic hero,
- hot-pink primary actions and accents,
- teal secondary accents,
- simple 8px cards,
- dense service grids,
- responsive CSS media queries at 860px and 620px.

The shop and admin should preserve the public brand language, but admin screens should be more utilitarian and table/form-focused.

Technical note: the stylesheet has grown organically. Before large shop work, consider reorganising it into sections or moving to a small build setup with modular CSS, but this is not required for Phase 1 if scope is kept narrow.

---

## 5. Image Handling

Images are static assets in:

```text
assets/
```

Current assets include:

```text
vert-studio-hero.png
vert_logo.png
vert_logo_header.png
vert_branding.png
```

There is no image optimisation pipeline. The hero image is large and served directly as PNG.

For the shop, product images should not be committed to Git. They should live in Supabase Storage and be referenced through database records.

Recommended future buckets:

```text
product-images     public
customer-artwork   private
```

Product images should be transformed/resized for display where practical. Customer artwork must remain private.

---

## 6. Forms And Existing APIs

### Quote form

The quote form lives in `index.html` and is enhanced by `script.js`.

It currently collects:

- name,
- business or organisation,
- email,
- phone or WhatsApp number,
- service required,
- product or item,
- quantity,
- required date,
- preferred contact method,
- artwork upload field,
- project details.

Important limitation:

The browser-side script deletes the `artwork` field before submission. Artwork uploads are not currently sent or stored.

### Spam protection

The form uses:

- Cloudflare Turnstile widget,
- server-side Turnstile siteverify,
- hidden honeypot field.

Turnstile public site key is embedded in `index.html`. The secret must be configured as a Cloudflare Pages secret:

```text
TURNSTILE_SECRET
```

### Quote API

Current endpoint:

```text
POST /api/quote
GET  /api/quote -> 405
```

Implementation:

```text
functions/api/quote.js
```

The function:

1. parses JSON,
2. rejects missing required fields,
3. ignores honeypot spam,
4. verifies Turnstile using `https://challenges.cloudflare.com/turnstile/v0/siteverify`,
5. sends email through Postmark.

Current required secrets / variables:

```text
TURNSTILE_SECRET          secret
POSTMARK_SERVER_TOKEN     secret
POSTMARK_FROM_EMAIL       wrangler.toml var
QUOTE_TO_EMAIL            wrangler.toml var
POSTMARK_MESSAGE_STREAM   wrangler.toml var
```

This endpoint can either remain as the general brochure quote email endpoint or later be replaced/extended to store quote requests in Supabase.

---

## 7. SEO Implementation

Current SEO is static and homepage-only.

Implemented:

- title tag,
- meta description,
- robots directive,
- canonical URL,
- Open Graph metadata,
- Twitter card metadata,
- LocalBusiness JSON-LD,
- `robots.txt`,
- `sitemap.xml`,
- legacy redirects.

Current canonical domain:

```text
https://www.vertprinting.co.za/
```

Current sitemap only includes the homepage:

```text
https://www.vertprinting.co.za/
```

Shop implementation must update sitemap generation or maintain a generated/static sitemap containing real shop, category and product URLs.

Product/category SEO should come from Supabase fields such as:

```text
seo_title
seo_description
slug
```

---

## 8. Deployment

Deployment target:

```text
Cloudflare Pages
```

Repository root is the Pages output directory. The project has no separate build output folder.

Current deployment model is simple and should be preserved initially:

```text
git push -> Cloudflare Pages deploy
```

Server-side code should continue to use Cloudflare Pages Functions unless a future framework migration creates a better native route system.

---

## 9. Supabase Integration Recommendation

The existing site can technically integrate Supabase from vanilla JS plus Pages Functions, but building a full shop and admin system directly in raw `index.html`, `styles.css` and `script.js` will become hard to maintain quickly.

### Recommended path

Introduce a small frontend application structure before Phase 1 admin work.

Best-fit option:

```text
Vite + React + TypeScript
```

Reasoning:

- still deploys cleanly to Cloudflare Pages,
- supports an `/admin` app without hand-rolling large DOM code,
- keeps UI state manageable for product editors, image upload, options and pricing tiers,
- has straightforward Supabase client support,
- avoids the heavier assumptions of Next.js for this project,
- can preserve the existing visual design by porting the current HTML/CSS into components.

Alternative:

```text
Astro + islands
```

This would be good for public content and SEO, but the admin/product editor will still need substantial client-side interactivity. React/Vite is simpler for the admin-heavy workload.

Not recommended for this project right now:

- Shopify/WooCommerce, because the brief explicitly excludes them.
- A separate Node/Express server, because Cloudflare Pages Functions already provide secure server-side execution.
- Continuing with only static HTML for the full shop/admin, because admin CRUD, auth, image uploads and configurable products will become fragile.

### Migration strategy

Do not rewrite the visual design. Convert the existing homepage into the first route/component, preserving:

- copy,
- styling tokens,
- responsive behaviour,
- quote form behaviour,
- SEO metadata,
- Cloudflare deployment.

Suggested future route structure after app migration:

```text
/
/shop
/shop/:categorySlug
/product/:productSlug
/quote
/contact
/admin
/admin/login
/admin/products
/admin/products/new
/admin/products/:id
/admin/categories
/admin/orders
/admin/quotes
```

---

## 10. Secure Server-Side Functionality

Use Cloudflare Pages Functions for operations requiring secrets or privileged access.

Future secure endpoints may include:

```text
/api/admin/*
/api/products/*
/api/categories/*
/api/orders/*
/api/quotes/*
/api/upload-artwork
/api/checkout
/api/payment-webhook
```

Browser-safe Supabase anon key may be exposed only for public read operations protected by RLS.

Never expose:

```text
SUPABASE_SERVICE_ROLE_KEY
POSTMARK_SERVER_TOKEN
TURNSTILE_SECRET
PAYMENT_* secrets
```

For admin mutations, prefer server-side Pages Functions using service role after verifying Supabase Auth JWT and role/profile permissions.

For simple public catalogue reads, direct browser-to-Supabase using anon key and RLS is acceptable.

---

## 11. Supabase Data And Security Approach

Phase 1 should create SQL migrations rather than manual Supabase Studio edits.

Recommended folder:

```text
supabase/migrations/
```

Recommended additional docs:

```text
docs/SUPABASE_SETUP.md
docs/SHOP_MANAGER_GUIDE.md
```

Phase 1 should implement the data model from the brief incrementally, starting with:

- profiles,
- categories,
- products,
- product_categories,
- product_images,
- option_groups,
- option_values,
- product_variants where needed,
- product_price_tiers,
- product_charges,
- shop_settings,
- storage buckets and policies.

RLS should be enabled from the start.

Suggested policy direction:

- public can read only active/published products and active categories,
- public cannot read cost prices,
- public cannot read private artwork,
- admin/staff can read/write according to role,
- service-role functions handle privileged mutations where needed.

---

## 12. Current Technical Debt Relevant To Shop Build

The following are not blockers for the current brochure site, but they matter before ecommerce work:

1. **No build system**  
   A full admin/shop will be difficult to maintain as plain HTML/JS.

2. **No tests**  
   There is no existing automated test setup. Pricing and order validation will need tests once implemented.

3. **Static redirects conflict with future shop routes**  
   `_redirects` currently sends `/shop`, `/cart`, `/checkout`, `/my-account` and `/product/*` to `/#quote`.

4. **Artwork upload is visual only**  
   The quote form includes a file input, but the current function does not receive or store files.

5. **No local Cloudflare Function runner documented**  
   The README only describes static preview. Function testing should use Wrangler/Pages local dev once shop APIs are added.

6. **SEO is homepage-only**  
   Future product/category pages need dynamic or generated metadata and sitemap entries.

7. **CSS is single-file and order-dependent**  
   Later responsive/admin styles may become harder to reason about without structure.

8. **No privacy/terms pages**  
   Ecommerce will require privacy, terms, returns/refunds, delivery/collection and custom artwork policies.

---

## 13. Phase 1 Readiness

The repository is ready for Phase 1 planning, but Phase 1 should begin with a small stack decision.

Recommended Phase 1 start sequence:

1. Confirm Supabase project exists or create it manually.
2. Decide whether to introduce Vite + React + TypeScript before admin build.
3. Add `.env.example` with names only.
4. Add Supabase migration folder and first schema migration.
5. Add Supabase setup documentation.
6. Build `/admin/login` and protected admin shell.
7. Build categories/products CRUD from Supabase.
8. Keep the existing public homepage working throughout.

---

## 14. Required Environment Variables For Future Shop Work

Names only; do not commit real values.

```env
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SITE_URL=
ADMIN_EMAIL=
TURNSTILE_SECRET=
POSTMARK_SERVER_TOKEN=
POSTMARK_FROM_EMAIL=
QUOTE_TO_EMAIL=
POSTMARK_MESSAGE_STREAM=
PAYMENT_PROVIDER=
PAYMENT_MERCHANT_ID=
PAYMENT_MERCHANT_KEY=
PAYMENT_PASSPHRASE=
PAYMENT_WEBHOOK_SECRET=
```

Existing committed non-secret Cloudflare vars:

```text
POSTMARK_FROM_EMAIL
QUOTE_TO_EMAIL
POSTMARK_MESSAGE_STREAM
```

Existing Cloudflare secrets expected:

```text
TURNSTILE_SECRET
POSTMARK_SERVER_TOKEN
```

---

## 15. Adjustments To The Build Brief Based On Actual Repo

The brief says to use the existing frontend unless there is a compelling reason not to. The current static frontend is appropriate for the brochure site, but the admin/shop requirements are large enough that a small app framework is justified before Phase 1 implementation.

Recommended adjustment:

> Preserve the existing public design and Cloudflare Pages deployment, but migrate the codebase to a small Vite + React + TypeScript app before or at the beginning of Phase 1 admin implementation.

This is not a redesign. It is a maintainability step for admin CRUD, authentication state, product editing, image upload, options, price tiers and future cart/checkout.

If the user wants to avoid a framework for now, Phase 1 can still begin with Supabase migrations and a very small `/admin` static prototype, but that path will become increasingly expensive as product management grows.

---

## 16. Phase 0 Acceptance Status

- Existing site inspected: yes.
- Current framework documented: yes.
- Current routes documented: yes.
- Current CSS/design system documented: yes.
- Deployment documented: yes.
- Forms and APIs documented: yes.
- SEO implementation documented: yes.
- Safe server-side execution option identified: yes, Cloudflare Pages Functions.
- Supabase integration approach recommended: yes.
- Technical debt relevant to shop implementation documented: yes.
- Shop implementation started: no.

Phase 0 is complete when this document is reviewed and accepted.