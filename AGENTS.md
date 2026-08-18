# AGENTS.md — Vert Printing Repository Rules

These instructions apply to the entire Vert Printing repository.

Codex must read and follow this file before making changes.

---

## 1. Project Principle

Vert Printing is a real customer-facing business website and shop.

Do not treat UI work as a developer scaffold.

A page is not complete merely because:
- data loads,
- a Supabase query works,
- a form submits,
- a route renders,
- a build passes.

For any customer-facing or Shop Manager UI, **visual quality, layout, responsiveness and understandable language are part of the acceptance criteria**.

Never knowingly ship an ugly or obviously unfinished interface as a completed task.

---

## 2. Existing Project Documents

Before working on the relevant area, locate and read these files if they exist:

- `VERT_SHOP_BUILD.md`
- `VERT_SHOP_ARCHITECTURE.md`
- `VERT_SHOP_ARCHITECTURE_AMENDED.md`
- `VERT_ADMIN_UI.md`
- `VERT_SHOP_UI.md`

They may be in the repo root, `docs/`, `md files/`, or another documentation folder.

Treat these documents as project requirements.

If two project documents conflict:
1. prefer the most recently amended/specific document,
2. preserve working functionality,
3. state the conflict before making an irreversible architectural change.

---

## 3. Preserve The Vert Brand

The public site must feel like Vert Printing, not a generic ecommerce template.

Core colours:

```css
--vert-ink: #1f2426;
--vert-paper: #fbfaf7;
--vert-teal: #007c7a;
--vert-teal-dark: #005c5a;
--vert-coral: #e8694f;
--vert-pink: #ec168c;
```

Design direction:

- warm off-white backgrounds,
- charcoal typography,
- hot pink for primary calls to action,
- teal used as a restrained secondary accent,
- clean white surfaces/cards,
- subtle borders,
- restrained shadows,
- generous intentional spacing,
- strong readable hierarchy.

Avoid:

- default browser styling,
- generic Bootstrap-looking layouts,
- giant gradients,
- glassmorphism,
- neon styling,
- excessive animation,
- huge empty spaces caused by broken sizing,
- decorative effects that fight with product imagery.

Priority:

```text
clarity > usability > brand consistency > decoration
```

---

## 4. UI Work Must Be Visually Verified

For every material UI change:

1. Run the application.
2. Open the changed page in a real browser or browser automation tool if available.
3. Inspect the actual rendered result.
4. Check at least:
   - desktop,
   - tablet or intermediate width,
   - mobile.
5. Fix obvious layout/design defects before reporting the task complete.

Recommended viewport checks:

```text
1440 × 900
1024 × 768
390 × 844
```

If screenshot/browser tooling is available, use it.

If visual/browser inspection is not possible in the environment, explicitly state that visual QA could not be completed.

**Do not claim a UI task is complete without either visual verification or a clear statement that it could not be performed.**

---

## 5. Visual Quality Gate

Before finishing any UI task, ask:

- Is anything clipped?
- Is anything underneath the fixed header?
- Is any image absurdly large?
- Is there accidental horizontal overflow?
- Are controls aligned?
- Is spacing consistent?
- Does the page have a clear hierarchy?
- Are buttons obviously primary/secondary?
- Does the page look designed rather than merely rendered?
- Would a normal customer understand what to do next?
- Would Fran understand this screen without developer knowledge?
- Is the mobile layout genuinely usable?

If any answer is no, continue working.

---

## 6. Fixed Header Rule

The public Vert header is fixed.

No page content may appear beneath or behind it.

This must be solved at the shared layout/shell level.

Do not apply random per-page margin hacks.

Routes including the following must have correct header clearance:

```text
/
/shop
/shop/*
/product/*
/quote
/cart
/checkout
```

---

## 7. Product Image Rule — Non-Negotiable

Never allow the original dimensions of a product image to control page/card dimensions.

All product imagery must live inside a constrained media container.

Product cards should use a consistent aspect ratio, normally:

```css
aspect-ratio: 1 / 1;
```

or another project-wide approved ratio.

Typical behaviour:

```css
.product-media {
  overflow: hidden;
  display: grid;
  place-items: center;
}

.product-media img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
```

Use `cover` only when deliberate cropping is appropriate.

Mandatory:

- oversized images cannot expand a card,
- transparent logos cannot become page-sized artwork,
- product image dimensions cannot create giant blank spaces,
- missing images have a clean fallback,
- all cards in one grid have consistent image geometry.

Whenever adding/changing product UI, test with:
- very wide image,
- very tall image,
- transparent PNG/logo,
- normal product photo,
- missing image.

---

## 8. Public Product Language

Never expose database/internal implementation terminology to customers.

Do not display values such as:

```text
standard
configurable
quote_only
fixed
from_price
made_to_order
UUID
JSON
```

Translate business logic into customer language.

Examples:

```text
standard + fixed
-> normal price and View Product / Add to Cart

configurable
-> From Rxxx.xx and Configure

quote_only
-> Custom pricing / Request a Quote

made_to_order
-> Made to order
```

Internal product type does not need to be displayed simply because the field exists.

---

## 9. Pricing Rules

Use one shared ZAR formatter across the storefront.

Preferred customer formatting:

```text
R150.00
R1,250.00
From R195.00
```

Do not manually concatenate currency strings in individual components.

Do not show:

```text
R0.00
```

for quote-only items.

Do not show contradictory purchase behaviour such as:

```text
R150.00 + Request Quote
```

for a normal fixed-price item.

CTA and displayed pricing must agree with product behaviour.

---

## 10. Product Behaviour

### Standard fixed product

Customer sees:

```text
R150.00
```

CTA:

```text
View Product
```

or:

```text
Add to Cart
```

when direct add is genuinely supported.

### Configurable product

Customer sees:

```text
From R195.00
```

CTA:

```text
Configure
```

### Quote-only product

Customer sees:

```text
Custom pricing
```

CTA:

```text
Request a Quote
```

No cart controls.

---

## 11. Shop Grid Rule

The public shop must look like an intentional catalogue.

Use a reusable product grid and reusable product card.

Typical responsive structure:

```text
desktop: 3–4 columns
tablet: 2 columns
mobile: 1–2 columns depending on readability
```

Product card structure should remain consistent:

```text
Product image
Customer-facing badge/category if useful
Product name
Optional short description
Price / from price / custom pricing
Appropriate CTA
```

Never dump a product object vertically onto the page and call it a shop.

---

## 11A. Public Page Alignment Rule — Non-Negotiable

Unless a section is intentionally full-bleed imagery or background treatment, all primary sections on the same public route must share the same outer content container, maximum width and responsive gutters.

For shop-related pages, use one shared responsive container for:

```text
shop hero outer container
category navigation
search/sort toolbar
product grid
empty states
product-detail main content
related products
cart/checkout content where appropriate
```

Recommended pattern:

```css
:root {
  --site-content-max: 1200px;
  --site-gutter: clamp(20px, 4vw, 48px);
}

.site-container {
  width: min(
    calc(100% - (var(--site-gutter) * 2)),
    var(--site-content-max)
  );
  margin-inline: auto;
}
```

The exact implementation may use existing project tokens/components, but the visual result must follow this rule.

### Important distinction

A hero's **text measure** may be narrower for readability, for example:

```css
.hero-copy {
  max-width: 760px;
}
```

However, the hero's **outer section container** must still align with the same left/right rails as the catalogue below it.

Correct:

```text
|--------------------------------------------------|
| HERO OUTER CONTAINER                             |
| [narrower readable text inside]                  |
|--------------------------------------------------|

|--------------------------------------------------|
| CATEGORY / TOOLBAR                               |
|--------------------------------------------------|

|--------------------------------------------------|
| PRODUCT GRID                                     |
|--------------------------------------------------|
```

Incorrect:

```text
        |----------------------|
        | HERO                 |
        |----------------------|

|--------------------------------------------------|
| PRODUCT GRID                                     |
|--------------------------------------------------|
```

Do not allow:
- the product grid to extend wider than the hero outer container,
- search/sort controls to use different horizontal rails from the product grid,
- category pills to float on unrelated widths,
- each public section to invent its own `max-width`,
- arbitrary one-off margins to visually force alignment.

### Full-bleed exception

A background colour, hero image, banner or decorative section may run full viewport width.

Its **inner content** should still normally use the shared site container.

### Visual QA requirement

Whenever changing a public page, visually check that the left and right edges of the major sections align at:

```text
1440 × 900
1024 × 768
390 × 844
```

If the hero, toolbar and product grid visually sit on different rails without an intentional documented reason, the page is not complete.

## 12. Product Detail Page Rule

A product detail page should have an intentional composition.

Desktop:

```text
Breadcrumbs

Product gallery        Product information
                       Product name
                       Price
                       Options
                       Quantity
                       Artwork
                       Primary action

Description / pricing / artwork / lead time below
```

Mobile:

```text
Gallery
Product name
Price
Options
Quantity
Artwork
Primary action
Details
```

Do not allow one image or logo to consume most of the viewport.

---

## 13. Storefront Controls

Do not render controls that do nothing.

Examples:

- no fake Cart button before cart works,
- no Search control if search is not implemented,
- no Sort dropdown with unsupported values,
- no dead categories,
- no unfinished navigation links.

It is better to hide an unavailable feature than present a broken one.

---

## 14. Shop Manager Design Rules

`/admin` is business software for Fran.

It must not look like:
- Supabase Studio,
- a test harness,
- raw HTML form controls,
- a developer diagnostic page.

Use:
- proper sidebar,
- readable top bar,
- page headers,
- cards,
- tables,
- deliberate forms,
- responsive behaviour,
- clear success/error feedback.

Product creation belongs on a dedicated product editor page.

Category creation belongs in a proper modal/drawer/page.

Do not cram product/category inputs into horizontal developer rows.

---

## 15. Technical Errors Must Not Reach Users

Never render raw errors to normal users.

Examples that must not appear:

```text
JWT issued at future
StorageError 403
PostgREST error
SQL error
stack trace
```

Do not simply hide them.

1. diagnose the underlying issue,
2. log technical detail appropriately,
3. show a normal user-facing message.

Example:

```text
Your session has expired. Please sign in again.
```

---

## 16. Empty States

No bare empty-table text floating in space.

Use a proper empty state.

Example:

```text
You haven't added any products yet.

Add your first product to start building the Vert catalogue.

[ Add Product ]
```

Public shop empty state:

```text
Our online catalogue is being updated.

Need something now? Request a quote.
```

---

## 17. Responsive Rules

Desktop correctness is not enough.

At mobile widths:
- navigation works,
- fixed header does not cover content,
- no horizontal overflow,
- forms stack cleanly,
- buttons remain comfortably tappable,
- product images remain constrained,
- product cards remain readable,
- tables have a mobile strategy.

Never finish a new screen after checking only one viewport.

---

## 18. Form Rules

Forms must have:

- visible labels,
- consistent control height,
- clear focus states,
- sensible grouping,
- validation beside the relevant field,
- responsive layout,
- clear primary action.

Do not use placeholders as a replacement for labels.

Do not put an entire complex form in one horizontal row.

---

## 19. Buttons

Primary:
- Vert pink,
- reserved for the main action.

Secondary:
- restrained border/surface style.

Destructive:
- red,
- never visually dominant until destructive intent is clear.

Do not make every action pink.

Do not make Cancel or Log Out the primary visual action.

---

## 20. SEO Is Part Of Public UI Work

SEO-critical public pages must remain crawlable.

For:

```text
/
/shop
/shop/category/*
/product/*
```

provide appropriate:
- HTML content,
- title,
- meta description,
- canonical,
- Open Graph metadata,
- structured data where relevant.

Do not turn these routes into client-only pages that depend on JavaScript for basic SEO content.

Never emit misleading Offer data for quote-only products.

---

## 21. Supabase / Security

UI changes must never weaken backend security.

Preserve:
- RLS,
- public/private storage separation,
- private customer artwork,
- protected admin routes,
- server-only service-role secrets,
- published/active product visibility rules.

Do not solve a frontend problem by making private data publicly readable.

---

## 22. Do Not Rewrite Working Logic For Styling

When fixing a visual problem:

1. understand the current component/data flow,
2. preserve working logic where possible,
3. refactor the presentation layer,
4. retest functionality.

Do not rebuild Supabase/auth/CRUD simply because the page needs CSS.

---

## 23. No “Style Later” Workflow

For Vert, functionality and design are developed together.

Not acceptable:

```text
Phase A: ugly but functional
Phase B someday: make it usable
```

Acceptable:

```text
Implement feature
-> render it
-> visually inspect it
-> correct layout/UX
-> test responsive behaviour
-> call it complete
```

A developer scaffold may exist temporarily during implementation, but it must never be reported as a finished customer/admin UI.

---

## 24. Page Completion Checklist

Before reporting any new/changed page complete, verify:

### Structure
- [ ] Correct shared header/sidebar layout.
- [ ] Page title not clipped.
- [ ] Sensible max-width/container.
- [ ] Clear visual hierarchy.

### Imagery
- [ ] Images constrained.
- [ ] Aspect ratio preserved.
- [ ] Extreme source dimensions tested.
- [ ] Missing-image fallback works.

### Content
- [ ] No raw internal enums.
- [ ] No developer terminology.
- [ ] No raw errors.
- [ ] CTA matches business logic.

### Styling
- [ ] Vert brand applied.
- [ ] Buttons have hierarchy.
- [ ] Spacing consistent.
- [ ] No huge accidental blank regions.
- [ ] No default browser controls where styled UI is expected.

### Responsive
- [ ] Desktop checked.
- [ ] Tablet/intermediate checked.
- [ ] Mobile checked.
- [ ] No horizontal overflow.

### Functional
- [ ] Data still loads.
- [ ] Relevant actions work.
- [ ] Auth/security unchanged.
- [ ] Build/tests pass.

---

## 25. Screenshot Review Rule

When browser/screenshot tooling is available, inspect screenshots yourself before declaring completion.

Do not merely generate screenshots as evidence.

Actually assess:
- alignment,
- clipping,
- whitespace,
- scale,
- image treatment,
- typography,
- CTA prominence,
- visual balance.

If it looks visibly bad, continue iterating without waiting for the user to complain.

---

## 26. Reference Standard

The standard is not:

> “Technically valid HTML.”

The standard is:

> “A competent designer/developer could show this to the business owner without apologising for it.”

For public pages:

> “A customer should immediately understand what Vert sells and what action to take.”

For admin:

> “Fran should be able to operate it without understanding the software stack.”

---

## 27. Required Work Report

For material UI tasks, the final Codex report must include:

1. routes/screens changed,
2. reusable components changed/created,
3. functionality preserved,
4. desktop visual QA result,
5. mobile visual QA result,
6. any visual issue still known,
7. build/test result.

Do not say “done” while knowingly leaving obvious visual defects.

---

## 28. Final Rule

If there is a choice between:

```text
technically complete but ugly
```

and:

```text
one more iteration to make it coherent and usable
```

take the extra iteration.

Vert is a design/printing business.

Its own website cannot look careless.
