# Vert Shop Architecture Audit

**Project:** Vert Printing  
**Phase:** Phase 0 - Repository & Architecture Audit (Reviewed & Accepted)  
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

### Approved architecture direction

Introduce a small application structure before Phase 1 admin work, while preserving the existing public Vert design and Cloudflare Pages deployment.

React + TypeScript is approved for:

- `/admin`,
- product/category management,
- authentication state,
- image uploads,
- configurable product editors,
- cart interactions,
- checkout interactions,
- other state-heavy shop functionality.

However, **SEO-critical public pages must not become a client-only SPA**.

The following routes must remain crawlable with useful HTML, route-specific metadata and structured data available without relying on client-side rendering alone:

```text
/
/shop
/shop/:categorySlug
/product/:productSlug
```

Suitable implementation approaches include:

### Option A — Astro + React islands

```text
Astro
├── public brochure pages
├── shop/category/product pages
└── React islands
    ├── product configurator
    ├── cart
    ├── checkout
    └── admin application
```

This is a strong fit for SEO-critical public pages plus a highly interactive admin area.

### Option B — Vite + React + TypeScript with an SEO-safe public rendering strategy

Vite + React + TypeScript remains acceptable **only if** the implementation provides pre-rendered, statically generated, server-rendered, or otherwise crawlable public shop/category/product HTML with correct per-route metadata.

Do not ship the public shop as a client-only SPA and assume that JavaScript-rendered metadata is sufficient.

### Framework decision rule

Codex may choose the cleanest implementation after inspecting the repo and Cloudflare Pages constraints, but the outcome must satisfy:

- existing public design preserved,
- Cloudflare Pages deployment remains simple,
- public SEO is not degraded,
- admin complexity is manageable,
- no unnecessary separate Node/Express backend,
- secure server-side work continues through Cloudflare Pages Functions or an equally appropriate framework-native Cloudflare-compatible mechanism.

Not recommended:

- Shopify/WooCommerce, because the brief explicitly excludes them.
- A separate Node/Express server without a documented technical need.
- Continuing with only static HTML/DOM scripting for the full shop/admin.
- Turning the entire public Vert website into a client-only React SPA.

### Migration strategy

Do not redesign the public site. Preserve:

- existing copy,
- styling tokens,
- responsive behaviour,
- quote form behaviour,
- SEO metadata,
- Cloudflare deployment.

Suggested future route structure:

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

The migration may happen incrementally. Keep the existing homepage operational throughout Phase 1.

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

### Database source of truth

The Git repository is the source of truth for the Supabase schema.

Create and commit SQL migrations **before** relying on manual Supabase Studio configuration.

Recommended flow:

```text
Git repository
   ↓
supabase/migrations/
   ↓
Supabase project
```

Avoid:

```text
Manual Supabase Studio changes
   ↓
undocumented production state
   ↓
attempt to reconstruct schema later
```

Any unavoidable manual Supabase step must be documented in `docs/SUPABASE_SETUP.md`.

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

Phase 0 has been reviewed and accepted.

The repository is ready to proceed to Phase 1 subject to the architecture constraints in this amended document.

Recommended Phase 1 start sequence:

1. Introduce the chosen maintainable application structure while keeping the existing homepage working.
2. Add `.env.example` with variable names only.
3. Create `supabase/migrations/`.
4. Generate and commit the initial Supabase schema, RLS and storage-policy migrations.
5. Create/configure the Supabase project if not already present.
6. Apply the committed migrations to Supabase.
7. Document any unavoidable manual Supabase setup in `docs/SUPABASE_SETUP.md`.
8. Build `/admin/login` and the protected admin shell.
9. Build categories/products CRUD.
10. Build product image management, options and quantity pricing required by Phase 1.
11. Confirm that published product data is available for the later public catalogue phase.
12. Keep the existing public homepage, quote form and Cloudflare Pages deployment working throughout.

### Phase 1 constraint

Implement **Phase 1 only** and stop at its acceptance criteria.

Do not begin the public catalogue/cart/checkout phases merely because the new framework makes them convenient to start.

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

The build brief says to use the existing frontend unless there is a compelling reason not to. The repository audit confirms that the current vanilla frontend is appropriate for the brochure site but is too limited for the planned Shop Manager and interactive ecommerce workflows.

The following adjustments are approved:

### 15.1 Introduce a maintainable application structure

React + TypeScript is approved for the admin and state-heavy ecommerce interfaces.

Codex may use Astro + React islands, or Vite + React + TypeScript with a proper public pre-rendering/server-rendering strategy, depending on which is cleaner for the actual Cloudflare Pages repository.

### 15.2 Protect public SEO

Do **not** convert SEO-critical public pages into a client-only SPA.

Homepage, shop, category and product routes must provide crawlable HTML plus correct route-specific:

- title,
- meta description,
- canonical URL,
- Open Graph data,
- structured data,
- sitemap inclusion where appropriate.

This is an architectural requirement, not a later SEO polish item.

### 15.3 Supabase migrations are authoritative

The database schema and security policies must be represented in committed migration files.

Supabase Studio may be used for inspection and unavoidable operational setup, but it must not become the undocumented source of truth for schema design.

### 15.4 Preserve the existing site

This is a maintainability migration, not a redesign.

Preserve the existing Vert public:

- branding,
- copy,
- layout intent,
- styling tokens,
- responsive behaviour,
- quote functionality,
- Cloudflare Pages deployment.

Any visible redesign should be treated as a separate decision.

### 15.5 Avoid unnecessary infrastructure

Continue using Cloudflare-compatible server-side functions for secrets and privileged operations.

Do not add a standalone Node/Express server, microservice layer or paid infrastructure without a concrete requirement.

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
- Public SEO architecture constraint added: yes.
- Git-managed Supabase migration source-of-truth requirement added: yes.
- Shop implementation started: no.

**Phase 0 is reviewed and accepted.**

Codex may proceed to **Phase 1 only**, using this amended architecture document together with `VERT_SHOP_BUILD.md`.

At the end of Phase 1, Codex must stop and report:

1. files changed,
2. framework/application structure selected and why,
3. schema/migrations added,
4. RLS/storage policies added,
5. environment variables required,
6. unavoidable manual Supabase steps,
7. build/test results,
8. Phase 1 acceptance criteria status,
9. anything requiring review before Phase 2.

Do not begin Phase 2 until Phase 1 has been reviewed.
