# Vert Printing — Public Shop UI & UX Brief

**Project:** Vert Printing  
**Document:** Public Shop / Storefront UI Correction Brief  
**Purpose:** Replace the current developer-style public shop scaffold with a polished, production-ready Vert Printing storefront while preserving working Supabase/product data logic and the existing Vert brand.

---

# 1. Primary Instruction To Codex

The current `/shop/` implementation proves that public product data is being rendered, but the visual and UX implementation is not acceptable for production.

The current page has serious presentation problems including:

- the page heading being clipped beneath the fixed header,
- unconstrained product imagery,
- a product image/logo dominating most of the viewport,
- weak catalogue hierarchy,
- raw internal values such as `standard` being shown to customers,
- contradictory pricing and quote actions,
- no proper product-card grid,
- no useful category/search/sort structure,
- weak spacing and responsive composition,
- product data appearing as a developer data dump rather than a shop.

## Critical rule

**Do not rewrite working Supabase/product retrieval logic merely to improve the UI.**

Preserve:
- existing Supabase integration,
- public product queries,
- route/data loading,
- RLS/security,
- published-product visibility logic,
- working category/product data relationships,
- existing Cloudflare deployment,
- existing public homepage design,
- existing quote form functionality.

Refactor rendering, components and styling as necessary.

Do not start cart/checkout implementation on top of the current storefront layout.

The storefront foundation must first be correct.

---

# 2. Storefront Goal

The public shop should feel like a natural extension of Vert Printing.

It should communicate:

> Browse, personalise and order Vert products online.  
> For genuinely custom jobs, request a quote.

The site must support three customer journeys:

### 1. Standard product

Customer sees a clear price.

Action:

```text
Add to Cart
```

or:

```text
View Product
```

if options/detail should be reviewed first.

### 2. Configurable product

Customer sees:

```text
From R195.00
```

Action:

```text
Configure
```

or:

```text
View Options
```

### 3. Quote-only product

Customer sees:

```text
Request a Quote
```

No fake R0.00 price.

Do not display internal database values such as:

```text
standard
configurable
quote_only
fixed
from_price
```

to customers.

---

# 3. Design Direction

Use the existing Vert public-site branding.

Existing colours:

```css
--vert-ink: #1f2426;
--vert-paper: #fbfaf7;
--vert-teal: #007c7a;
--vert-teal-dark: #005c5a;
--vert-coral: #e8694f;
--vert-pink: #ec168c;
```

Storefront visual direction:

- warm off-white background,
- strong charcoal typography,
- hot pink primary actions,
- teal used sparingly for secondary accents,
- white product cards,
- subtle borders,
- restrained shadow,
- clear spacing,
- product photography given prominence,
- no generic WooCommerce/template appearance.

Priority:

```text
product clarity > usability > brand consistency > decoration
```

Do not use:
- giant gradients,
- overdone animation,
- glassmorphism,
- neon UI,
- heavy card shadows,
- decorative effects that compete with product imagery.

---

# 4. Header / Fixed Navigation

The existing Vert header is fixed.

The public shop must account for its height correctly.

## Required fix

No page content may render underneath or behind the fixed header.

All routes must include appropriate top offset/padding.

Examples:

```text
/shop
/shop/category/*
/product/*
/cart
/checkout
/quote
```

The current clipped heading is a layout bug and must be fixed at the shell level, not patched page-by-page.

---

# 5. Shop Page Structure

Route:

```text
/shop
```

Recommended page composition:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ FIXED VERT HEADER                                                    │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ SHOP                                                                 │
│ Print, personalise and order online.                                 │
│ Need something more unusual? Request a custom quote.                 │
│                                                                      │
│ [ All ] [ Clothing ] [ Mugs ] [ Gifts ] [ Stickers ] [ Laser ]     │
│                                                                      │
│ [ Search products... ]                           [ Sort by ▼ ]        │
│                                                                      │
│ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐              │
│ │ PRODUCT IMAGE  │ │ PRODUCT IMAGE  │ │ PRODUCT IMAGE  │              │
│ │                │ │                │ │                │              │
│ ├────────────────┤ ├────────────────┤ ├────────────────┤              │
│ │ Product Name   │ │ Product Name   │ │ Product Name   │              │
│ │ R150.00        │ │ From R195.00   │ │ Request Quote  │              │
│ │                │ │                │ │                │              │
│ │ [View Product] │ │ [Configure]    │ │ [Request Quote]│              │
│ └────────────────┘ └────────────────┘ └────────────────┘              │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 6. Shop Hero / Intro

Do not use an oversized marketing hero on `/shop`.

The shop should begin with a compact, clean intro block.

Recommended:

```text
Shop

Print, personalise and order online.
Need something custom? Request a quote.
```

Optional secondary action:

```text
[ Request a Custom Quote ]
```

Do not use copy that implies the entire shop is enquiry-only unless that is actually true.

Avoid wording such as:

```text
These products are available for enquiry.
Pricing and production details are confirmed before anything goes ahead.
```

for the entire store.

That language may be appropriate only for quote-only products or a dedicated custom quote section.

---

# 7. Category Navigation

Categories should help browsing but not dominate the page.

Desktop options:

### Preferred

Horizontal pill/tab navigation:

```text
[ All ] [ Clothing ] [ Mugs ] [ Gifts ] [ Stickers ] [ Laser ]
```

or a compact category grid if there are only a few high-level categories.

Mobile:

- horizontally scrollable pills,
- or a compact category select/dropdown.

Active category must be clearly visible.

Do not expose empty/inactive categories.

---

# 8. Search

Public product search should be clearly visible but compact.

Example:

```text
[ Search products... ]
```

Search should match supported fields such as:

- name,
- SKU,
- description,
- category.

Do not add advanced search services.

If there are only a handful of products during initial rollout, search may be visually present only once the backend supports it cleanly.

Do not create fake/non-working controls.

---

# 9. Sorting

Initial sort options:

```text
Featured
Newest
Name A–Z
Price Low to High
Price High to Low
```

Only include options backed by actual product data.

Default may be:

```text
Featured
```

or admin `sort_order`.

---

# 10. Product Grid

Desktop:

```text
3 or 4 cards per row
```

depending on available width.

Tablet:

```text
2 cards per row
```

Mobile:

```text
1 card per row
```

or 2 compact cards if usability remains good at the target viewport.

Use CSS grid rather than arbitrary fixed positioning.

Suggested grid gap:

```text
20–28px
```

The catalogue should feel balanced and deliberate.

---

# 11. Product Card

Every product card should use a consistent structure.

Recommended:

```text
┌───────────────────────────┐
│                           │
│       PRODUCT IMAGE       │
│                           │
├───────────────────────────┤
│ Category / badge          │
│ Product Name              │
│ Short supporting line     │
│                           │
│ R150.00                   │
│                           │
│ [ View Product ]          │
└───────────────────────────┘
```

Do not show internal product type labels.

If useful, customer-facing badges may include:

```text
New
Sale
Featured
Made to Order
```

Do not show:

```text
standard
fixed
configurable
quote_only
```

---

# 12. Product Image Handling — Mandatory

The current image behaviour is unacceptable.

Product images must always render inside a controlled media container.

Recommended card image container:

```text
aspect-ratio: 1 / 1;
```

or:

```text
aspect-ratio: 4 / 3;
```

Use one ratio consistently across product cards.

Recommended image behaviour:

```css
width: 100%;
height: 100%;
object-fit: contain;
```

for products where the full object/logo should be visible.

Use `cover` only where cropping is desirable and intentional.

### Mandatory rules

- image must never determine card height,
- oversized source images must not expand the page,
- logos must not become full-width page artwork,
- use internal padding for transparent product images,
- use a neutral/off-white image background,
- preserve aspect ratio,
- provide fallback image/placeholder if no product image exists.

Example:

```css
.product-card__media {
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: #f3f2ef;
  display: grid;
  place-items: center;
}

.product-card__media img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 1rem;
}
```

Adapt to the project styling system.

---

# 13. Product Image Data Quality

If a product image is actually a Vert logo or placeholder because no proper photo exists, that should not be mistaken for a final product image.

The admin UI should eventually support a proper missing-image state.

Storefront should display a tasteful fallback rather than allowing arbitrary placeholder artwork to dominate the page.

---

# 14. Product Name

Product name should be prominent but not oversized.

Recommended:

```text
18–22px
```

on catalogue cards.

Limit excessive wrapping where practical, but do not truncate important names aggressively.

---

# 15. Product Description On Cards

Optional.

If used, display only a short description, maximum approximately 2–3 lines.

Do not render the full product description inside catalogue cards.

---

# 16. Price Formatting

ZAR customer display must be consistent.

Preferred:

```text
R150.00
R1,250.00
From R195.00
```

Do not display:

```text
R 150,00
R 150.00
R150
```

unless the existing site's currency style has intentionally standardised another format.

Use one helper/formatter for money across the shop.

Do not implement money formatting separately in multiple components.

---

# 17. Product Pricing Behaviour

## Standard + fixed price

Display:

```text
R150.00
```

Action:

```text
View Product
```

or direct:

```text
Add to Cart
```

if no options are required.

## Configurable / from-price

Display:

```text
From R195.00
```

Action:

```text
Configure
```

## Quote only

Display:

```text
Custom pricing
```

optional, followed by:

```text
Request a Quote
```

Do not display a fixed numeric price unless it genuinely represents a meaningful starting price.

## Critical contradiction rule

Do not show:

```text
R150.00   Request Quote
```

for a normal fixed-price product unless there is an intentional business reason.

The CTA must match the product's actual purchase mode.

---

# 18. Product Card CTA Rules

Suggested mapping:

```text
standard + fixed + simple
    -> Add to Cart or View Product

standard + fixed + detail required
    -> View Product

configurable
    -> Configure

quote_only
    -> Request a Quote
```

If product configuration must occur on the detail page, do not attempt to cram it into the catalogue card.

---

# 19. Product Detail Route

Recommended route:

```text
/product/:slug
```

or:

```text
/shop/product/:slug
```

Use the route already approved in project architecture.

Suggested desktop layout:

```text
┌───────────────────────────────────────────────────────────────┐
│ Breadcrumbs                                                   │
│                                                               │
│ ┌─────────────────────────┐  Product Name                     │
│ │                         │  Short description                │
│ │     PRODUCT IMAGE       │                                   │
│ │                         │  R195.00 / From R195.00           │
│ └─────────────────────────┘                                   │
│ [thumb] [thumb] [thumb]      Options                          │
│                              Quantity                         │
│                              Artwork                          │
│                              [ Add to Cart ]                  │
│                                                               │
├───────────────────────────────────────────────────────────────┤
│ Full description                                              │
│ Quantity pricing                                              │
│ Artwork information                                           │
│ Lead time                                                     │
└───────────────────────────────────────────────────────────────┘
```

Mobile:

- images first,
- title/price,
- options,
- quantity,
- CTA,
- details below.

---

# 20. Product Detail Gallery

Use a main image plus thumbnails if multiple images exist.

Main image container must also be constrained.

Suggested:

```text
aspect-ratio: 1 / 1
```

Images should not expand unpredictably.

Use `object-fit: contain` for most print/product imagery.

---

# 21. Product Type Behaviour On Detail Page

## Standard

Show:
- title,
- price,
- description,
- optional variant,
- quantity,
- artwork requirement if applicable,
- Add to Cart.

## Configurable

Show:
- title,
- from price,
- required option groups,
- live calculated price where supported,
- quantity,
- quantity pricing,
- artwork upload,
- Add to Cart after valid configuration.

## Quote Only

Show:
- title,
- description,
- quantity where useful,
- customer requirements,
- artwork upload,
- Request a Quote.

Do not show cart controls for quote-only products.

---

# 22. Option Controls

Use understandable customer controls.

### Size

```text
S  M  L  XL  2XL
```

Buttons/pills where appropriate.

### Colour

Swatches only if reliable colour metadata exists.

Otherwise use labelled buttons/select.

### Branding method

```text
Embroidery
Full-colour print
Vinyl
Laser engraving
```

Use radio/select controls based on complexity.

Do not expose JSON or internal option IDs.

---

# 23. Quantity

Quantity control must be obvious.

Example:

```text
Quantity
[-] 10 [+]
```

or numeric input with sensible validation.

Enforce:
- minimum quantity,
- maximum quantity if present,
- integer values,
- relevant quantity-tier pricing.

If minimum order is 10, do not default to 1.

---

# 24. Quantity Pricing

Where tiers exist, show them clearly.

Example:

```text
Quantity pricing

1–9       R120.00 each
10–24     R105.00 each
25–49     R95.00 each
50+       R85.00 each
```

Highlight the currently active tier where helpful.

Do not show pricing tiers on products that do not have them.

---

# 25. Setup Charges

Where applicable, clearly explain one-off charges.

Example:

```text
Embroidery digitising setup
R150.00 once per item design
```

Do not hide setup charges until final checkout.

Pricing transparency matters.

---

# 26. Artwork Upload

If `requires_artwork` is true, show a proper upload area.

Example:

```text
Artwork

Upload your logo or design.
PDF, SVG, EPS, AI, CDR, PNG or JPG.

[ Choose Artwork ]
```

Do not mention:
- storage bucket,
- Supabase,
- MIME type,
- signed URL.

Show:
- filename,
- file size where useful,
- remove/replace option,
- upload progress,
- friendly error.

For quote-only products, artwork may be attached during quote request instead of cart.

---

# 27. Artwork Helper Copy

Use business-friendly guidance.

Example:

```text
For best print quality, vector artwork is preferred.
If you're unsure, upload what you have and we'll check it before production.
```

Do not promise that all uploaded files are print-ready.

---

# 28. Lead Time

If `lead_time_text` exists, show it.

Example:

```text
Typical turnaround: 5–7 working days after artwork approval.
```

Do not invent lead times.

---

# 29. Stock / Made To Order

Customer-facing stock language:

### Tracked + available

```text
In stock
```

only where useful.

### Made to order

```text
Made to order
```

### Untracked

Do not show fake stock availability.

Avoid statements such as:

```text
Only 999 left
```

unless based on real stock.

---

# 30. Breadcrumbs

Product/category pages should have useful breadcrumbs.

Example:

```text
Home / Shop / Clothing / Ladies Golf Shirt
```

Use semantic markup and structured-data support where appropriate.

---

# 31. Related Products

Optional in initial version.

If easy to support cleanly, show 3–4 related products from the same category.

Do not block Phase 2 completion on recommendation logic.

---

# 32. Empty Shop State

If no published products exist, do not show an empty broken grid.

Use:

```text
Our online catalogue is being updated.

Need something now?
Tell us what you need and we'll put together a quote.

[ Request a Quote ]
```

This should be a genuine fallback, not normal shop copy.

---

# 33. No Search Results

Use:

```text
No products matched your search.

Try another search or browse all products.
```

Actions:

```text
[ Clear Search ]
[ View All Products ]
```

---

# 34. Loading State

Do not flash broken/unformatted content.

Use:
- skeleton cards,
- restrained loader,
- or server-rendered content where possible.

Avoid a giant page spinner.

---

# 35. Public Errors

Do not show technical errors.

Never expose:
- Supabase error payloads,
- SQL messages,
- API stack traces,
- UUIDs,
- internal status values.

User-facing example:

```text
We couldn't load the shop right now.
Please try again shortly.
```

Provide a retry where sensible.

---

# 36. Storefront Responsive Behaviour

Desktop:
- max content width approximately 1200–1400px,
- centred layout,
- 3–4 product columns.

Tablet:
- 2 columns.

Mobile:
- 1 or 2 columns depending on card readability,
- full-width search,
- category pills horizontally scrollable,
- controls stack logically.

Do not allow:
- horizontal page overflow,
- clipped titles,
- giant image height,
- tiny CTA text,
- overlapping fixed header.

---

# 37. Spacing

Use deliberate vertical rhythm.

Suggested:
- page top after header: 48–72px,
- intro to filters: 32–40px,
- filters to grid: 24–32px,
- card content padding: 16–20px,
- section spacing: 56–80px where appropriate.

Do not leave random huge blank regions caused by uncontrolled image dimensions.

---

# 38. Buttons

Primary action:

Hot pink.

Examples:
- Add to Cart
- Configure
- Request a Quote

Secondary:
- View Product
- Continue Shopping
- Back to Shop

Do not make every button hot pink.

Avoid tiny buttons next to oversized content.

Minimum comfortable target height:

```text
42–46px
```

---

# 39. Hover / Interaction

Use restrained interactions:
- subtle card lift or border change,
- image scale no more than a few percent if used,
- clear button hover,
- clear focus state.

Do not over-animate the catalogue.

---

# 40. Accessibility

The public shop must support:
- keyboard navigation,
- visible focus,
- semantic headings,
- labelled controls,
- alt text,
- sufficient contrast,
- accessible form errors,
- buttons/links used correctly,
- no meaning conveyed only by colour.

---

# 41. Product Alt Text

Use admin-provided alt text where available.

Fallback should be product-based:

```text
English Bulldog printed product
```

or simply product name where appropriate.

Do not use filenames such as:

```text
IMG_2314.png
```

as alt text.

---

# 42. SEO — Mandatory

SEO-critical public shop routes must not become client-only pages.

Public routes must provide crawlable HTML with route-specific:

- title,
- meta description,
- canonical,
- Open Graph metadata,
- relevant structured data.

For product pages use:
- `Product`,
- `Offer` when a real price exists,
- `BreadcrumbList`.

For quote-only products:
- do not emit misleading Offer price data.

Published products/categories should be included in sitemap generation.

Exclude:
- cart,
- checkout,
- confirmation,
- admin,
- unpublished products.

---

# 43. Product URL Behaviour

Use readable slugs.

Example:

```text
/product/english-bulldog
```

or approved shop route equivalent.

Never expose UUIDs in customer-facing URLs.

---

# 44. Public Product Visibility

Only show products that satisfy the project's publication rules.

At minimum:
- active,
- published,
- not archived.

Do not leak drafts through:
- direct URL,
- search,
- sitemap,
- related products,
- page source.

---

# 45. Category Page

Route example:

```text
/shop/category/:slug
```

Structure:

```text
Clothing

Custom branded clothing for teams, companies and events.

[ Search ] [ Sort ]

Product grid...
```

Do not create a completely different design from `/shop`.

Reuse the same product-card system.

---

# 46. Cart Icon / Header Integration

Once cart is implemented later, integrate a small cart action into the existing header.

Example:

```text
Shop   Cart (2)
```

Do not add cart UI before cart functionality exists.

No dead cart icon.

---

# 47. Public Header Consistency

Preserve existing Vert header navigation.

The Shop nav item should:
- clearly indicate active page,
- remain readable,
- work consistently on desktop/mobile.

Do not redesign the entire public header just for the shop unless necessary to fix a genuine responsive issue.

---

# 48. Product Card Component

Create one reusable public component for product cards.

Possible component responsibilities:
- image,
- product name,
- customer-facing badge,
- price display,
- CTA selection,
- link/route,
- optional short description.

Centralise product-type-to-CTA logic.

Do not duplicate this logic across:
- shop page,
- category page,
- related products,
- search results.

---

# 49. Money Formatter

Create one money utility.

Input:
- monetary value in the project's canonical format,
- currency code.

Output examples:

```text
R150.00
R1,250.00
```

Use it everywhere.

Do not manually concatenate `"R "` in templates.

---

# 50. Customer-Facing Product Language

Translate internal product concepts into normal language.

Internal:

```text
standard
```

Customer sees:
- nothing,
- or normal purchase CTA.

Internal:

```text
configurable
```

Customer sees:

```text
Choose options
```

Internal:

```text
quote_only
```

Customer sees:

```text
Custom pricing
Request a Quote
```

Internal:

```text
made_to_order
```

Customer sees:

```text
Made to order
```

only when useful.

---

# 51. Product Status Badges

Do not expose admin status badges such as:
- Draft
- Archived
- Inactive

because those products should not be public.

Allowed marketing badges:
- New
- Sale
- Featured
- Made to Order

Keep them restrained.

---

# 52. Sale Pricing

If sale/compare price exists:

```text
R195.00   R150.00
```

Use accessible visual treatment.

Do not rely on strikethrough alone to communicate meaning.

No sale badge without a real price difference.

---

# 53. Quote-Only Product Card Example

```text
┌───────────────────────────┐
│        PRODUCT IMAGE      │
├───────────────────────────┤
│ Custom Laser Signage      │
│ Made to your requirements │
│                           │
│ Custom pricing            │
│                           │
│ [ Request a Quote ]       │
└───────────────────────────┘
```

No meaningless numerical price.

---

# 54. Standard Product Card Example

```text
┌───────────────────────────┐
│        PRODUCT IMAGE      │
├───────────────────────────┤
│ English Bulldog           │
│                           │
│ R150.00                   │
│                           │
│ [ View Product ]          │
└───────────────────────────┘
```

If truly simple and cart supports direct addition:

```text
[ Add to Cart ]
```

---

# 55. Configurable Product Card Example

```text
┌───────────────────────────┐
│        PRODUCT IMAGE      │
├───────────────────────────┤
│ Ladies Golf Shirt         │
│ Colours and sizes         │
│                           │
│ From R195.00              │
│                           │
│ [ Configure ]             │
└───────────────────────────┘
```

---

# 56. Current Screenshot-Specific Corrections

Before proceeding, explicitly correct these current issues:

- [ ] Heading is no longer hidden behind fixed header.
- [ ] Current giant Vert logo/product image is constrained inside a product media frame.
- [ ] Product image can never dictate page height.
- [ ] `standard` is removed from customer display.
- [ ] Product is shown inside a designed card/grid.
- [ ] `R 150,00` is replaced by the shared ZAR formatter.
- [ ] CTA matches product type.
- [ ] Fixed-price product no longer shows contradictory `Request Quote` unless intentionally configured as quote-only.
- [ ] Intro copy no longer implies every product is enquiry-only.
- [ ] Excessive blank space caused by image/layout sizing is removed.
- [ ] Shop page works at desktop, tablet and mobile widths.

---

# 57. Tests

Add tests where the project structure supports them.

At minimum test the customer-facing product presentation logic:

### CTA selection

```text
standard fixed -> View Product/Add to Cart
configurable -> Configure
quote_only -> Request a Quote
```

### Price display

```text
fixed -> R150.00
from -> From R150.00
quote only -> no fake numeric price
```

### Visibility

```text
published active -> visible
draft -> hidden
archived -> hidden
inactive -> hidden
```

### Image

Where practical, ensure cards preserve layout even with extreme source dimensions.

---

# 58. Manual Acceptance Tests

Before considering the storefront corrected, manually test:

## Desktop
- `/shop`
- category navigation
- product cards
- product image sizing
- long product name
- missing product image
- fixed product
- configurable product
- quote-only product

## Mobile
- header does not cover content,
- product cards remain readable,
- images remain constrained,
- categories usable,
- search usable,
- CTAs full/comfortable width where appropriate,
- no horizontal overflow.

## SEO
- product route has unique title/meta,
- published product appears in sitemap where expected,
- unpublished product does not.

---

# 59. Phase Boundary

This brief is a correction to the public catalogue/storefront foundation.

Do not use it as permission to rush ahead into:
- full cart,
- checkout,
- payment provider,
- order creation,
- customer accounts.

First make the catalogue/product presentation correct.

Then continue the agreed project phases.

---

# 60. Codex Implementation Order

## Step 1
Audit current `/shop` components/data loading and preserve working Supabase logic.

## Step 2
Fix global public layout offset for fixed header.

## Step 3
Create reusable storefront primitives:
- ShopPageHeader
- CategoryNav
- ShopToolbar
- ProductGrid
- ProductCard
- ProductImage
- ProductPrice
- ProductCTA
- EmptyState

Names may differ; responsibilities should remain clear.

## Step 4
Implement the product-card grid and strict image constraints.

## Step 5
Centralise customer-facing price formatting and CTA behaviour.

## Step 6
Remove raw internal labels from public rendering.

## Step 7
Implement/refine product detail page using the same visual system.

## Step 8
Implement responsive behaviour.

## Step 9
Verify SEO output remains crawlable and correct.

## Step 10
Run build/tests/manual checks and stop for review.

---

# 61. Codex Must Not

Do not:
- redesign the entire Vert public website,
- replace working product queries without need,
- expose raw product enums,
- allow original image dimensions to control layout,
- show a fixed price with a quote CTA unless business logic explicitly requires that combination,
- show fake prices for quote-only products,
- display R0.00 for quote-only products,
- add cart/checkout UI that does not work,
- add fake filters/search,
- create a generic ecommerce template unrelated to Vert,
- turn public shop pages into client-only SEO-poor routes,
- hide errors without fixing their cause,
- start payment integration,
- weaken publication/RLS rules.

---

# 62. Recommended Codex Prompt

```text
Read VERT_SHOP_UI.md in full before changing code.

The current /shop implementation is functionally connected to Supabase but visually and structurally unacceptable.

Correct the public shop/storefront foundation according to this brief.

IMPORTANT:
- Preserve working Supabase/product data logic and security.
- Do not redesign the existing Vert homepage/header except where required to fix layout bugs.
- Fix the fixed-header overlap globally.
- Constrain all product imagery.
- Remove raw internal enum values from customer-facing UI.
- Centralise product price formatting and CTA selection.
- Fixed, configurable and quote-only products must present differently and correctly.
- Do not start payment integration.
- Do not rush ahead into later phases until the catalogue/product presentation is correct.
- Keep public shop/category/product pages crawlable with proper metadata.

At the end, stop and report:
1. files changed,
2. storefront components created/refactored,
3. image-sizing strategy,
4. price/CTA logic,
5. internal labels removed from public UI,
6. responsive test results,
7. SEO checks,
8. build/test results,
9. any remaining storefront issues.

Do not proceed beyond the agreed phase without review.
```

---

# 63. Final Quality Test

The public shop should pass this test:

> If a customer lands directly on `/shop`, it should immediately look like a deliberate Vert Printing online store — not a database record rendered onto a page.

And:

> No product image, source-file dimension or internal database value should ever be capable of breaking the visual design.

The shop must feel finished before more ecommerce functionality is layered on top of it.
