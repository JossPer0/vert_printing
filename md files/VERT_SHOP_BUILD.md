# Vert Printing Shop & Shop Manager Build Brief

**Project:** Vert Printing  
**Primary goal:** Convert the existing Vert Printing website into a maintainable online shop with a simple shop-management backend that Fran can use without touching code.  
**Target deployment:** Existing Vert Printing website / Cloudflare Pages setup  
**Backend:** Supabase  
**Implementation style:** Incremental, phase-based, production-minded, but deliberately not over-engineered.

---

## 1. Codex Operating Instructions

Before changing code:

1. Inspect the entire existing repository.
2. Identify the current framework, routing structure, styling system, deployment configuration, image handling, forms, SEO implementation, and any existing APIs.
3. Preserve the existing Vert Printing branding, visual language, typography, page structure, responsive behaviour, and existing working content unless this brief explicitly requires a change.
4. Do not rewrite the site from scratch unless there is a hard technical reason and that reason is documented first.
5. Do not hard-code shop products into frontend source files.
6. Products, categories, pricing, images, stock state, featured state, and shop visibility must be managed from Supabase.
7. Implement one phase at a time.
8. Complete and test the acceptance criteria for a phase before starting the next phase.
9. Prefer simple, boring, maintainable solutions over clever abstractions.
10. Do not introduce large dependencies where a small local implementation is sufficient.
11. Keep all secrets server-side. Never expose Supabase service-role keys, payment secrets, webhook secrets, SMTP/API credentials, or admin-only tokens to the browser.
12. Use migrations/schema files for database changes. Do not rely on undocumented manual database edits.
13. Keep README/setup documentation current as the project evolves.
14. If an existing implementation conflicts with this brief, preserve working functionality and document the conflict before changing it.
15. When business logic is ambiguous, implement the safest configurable option rather than inventing irreversible rules.

### Critical rule

This is an online shop and lightweight print-shop management system.

It is **not** intended to become:
- a full ERP,
- accounting software,
- production scheduling software,
- payroll,
- a warehouse-management system,
- a courier-management platform,
- or a full commercial print MIS.

The system should solve Vert's actual online sales and order-management needs cleanly.

---

# 2. Product Vision

The finished system should provide two connected experiences.

## 2.1 Public Vert website

Customers should be able to:

- browse products and services,
- browse categories,
- search/filter products,
- view product photos,
- select variants/options,
- see pricing where appropriate,
- select quantities,
- upload artwork when applicable,
- add products to a cart,
- request a quote for custom work,
- check out as a guest,
- choose collection or delivery where enabled,
- pay online once a payment provider is configured,
- receive order/quote confirmation,
- use the website comfortably on mobile.

Customer accounts are **not required for the MVP**.

## 2.2 Vert Shop Manager

Fran should be able to use a protected `/admin` area to:

- log in securely,
- add/edit/archive products,
- upload and reorder product photos,
- create and manage categories,
- configure product variants,
- manage basic stock or made-to-order status,
- configure quantity pricing,
- mark products as featured/new/sale,
- publish/unpublish products,
- manage orders,
- manage quote requests,
- view customer-uploaded artwork,
- update order statuses,
- add internal notes,
- view basic dashboard counts,
- manage relevant shop settings,
- do all routine catalogue work without GitHub, VS Code, Codex or Supabase Studio.

---

# 3. Architecture

Use the existing frontend unless repository inspection shows a compelling reason not to.

Recommended logical architecture:

```text
Customer
   |
   v
Vert Printing Website
   |
   +-- Public pages
   +-- Shop
   +-- Product pages
   +-- Cart
   +-- Checkout
   +-- Quote request
   |
   v
Server-side API / secure server functions
   |
   v
Supabase
   +-- PostgreSQL database
   +-- Authentication
   +-- Storage
   +-- Row Level Security
   +-- Optional Edge Functions where useful
   |
   +-- Products
   +-- Categories
   +-- Variants/options
   +-- Customers
   +-- Orders
   +-- Order items
   +-- Quotes
   +-- Artwork
   +-- Shop settings
   +-- Audit history

Fran
   |
   v
/admin
   |
   v
Supabase Auth + protected admin functions
```

### Hosting

Preserve the existing Cloudflare Pages deployment unless repository inspection shows otherwise.

Where secure backend execution is required, use the solution that best fits the existing stack, such as:

- Cloudflare Pages Functions,
- framework-native server routes,
- Supabase Edge Functions,

provided secrets are never exposed client-side.

Do not add a separate server simply for the sake of having one.

---

# 4. Environment Strategy

Support at least:

- local development,
- production.

If practical, support a separate Supabase development project later, but do not make this a blocker for initial implementation.

Create/update an `.env.example` containing names only, never real credentials.

Expected variables may include:

```env
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=

SITE_URL=
ADMIN_EMAIL=

PAYMENT_PROVIDER=
PAYMENT_MERCHANT_ID=
PAYMENT_MERCHANT_KEY=
PAYMENT_PASSPHRASE=
PAYMENT_WEBHOOK_SECRET=

EMAIL_PROVIDER=
EMAIL_FROM=
EMAIL_API_KEY=
```

Only expose values to the browser that are explicitly safe for public use.

---

# 5. Authentication & Admin Access

Use Supabase Auth for Shop Manager authentication.

## MVP requirements

- email/password login,
- password reset,
- protected `/admin` routes,
- logout,
- session persistence,
- no public user sign-up page for admin access,
- unauthorised users cannot access admin data or admin mutations.

## Roles

Start with:

- `owner`
- `admin`
- `staff`

For the first implementation, Fran can be `owner`.

Suggested permissions:

### Owner
Full shop access including settings and staff/admin users.

### Admin
Products, categories, orders, quotes, customers and shop operations.

### Staff
Orders, quotes and artwork; restricted catalogue/settings access.

Do not build a complex RBAC engine. A simple role field and clear permissions are enough.

---

# 6. Core Data Model

Use UUID primary keys unless an existing project convention strongly suggests otherwise.

Every important table should include:

```text
id
created_at
updated_at
```

Use database timestamps where possible.

Use soft deletion/archive for products and other records that may be referenced by historical orders.

---

## 6.1 `profiles`

Admin/staff profile associated with Supabase Auth user.

Fields:

```text
id                  uuid, references auth.users
full_name           text
role                enum/text: owner | admin | staff
active              boolean
created_at
updated_at
```

---

## 6.2 `categories`

Fields:

```text
id
name
slug
description
image_path          nullable
parent_id           nullable
sort_order
is_active
seo_title           nullable
seo_description     nullable
created_at
updated_at
```

Support nested categories only if easy to implement cleanly. One parent level is sufficient.

Potential examples:

- Clothing
- Embroidery
- Mugs & Drinkware
- Stickers & Labels
- Corporate Gifts
- Laser Products
- Signage
- Promotional Products

Do not seed assumptions permanently. Fran must be able to change categories.

---

## 6.3 `products`

Fields:

```text
id
name
slug
sku                  nullable
short_description
description
product_type
pricing_mode
base_price            nullable
compare_at_price      nullable
cost_price            nullable, admin-only
is_taxable
stock_mode
stock_quantity        nullable
low_stock_threshold   nullable
allow_backorder
is_featured
is_new
is_on_sale
is_active
is_published
requires_artwork
artwork_instructions  nullable
minimum_quantity
maximum_quantity      nullable
lead_time_text        nullable
sort_order
seo_title             nullable
seo_description       nullable
created_at
updated_at
archived_at            nullable
```

### `product_type`

Support:

```text
standard
configurable
quote_only
```

### `pricing_mode`

Support:

```text
fixed
from_price
quote_only
```

### `stock_mode`

Support:

```text
tracked
made_to_order
untracked
```

Do not assume every Vert product is held in inventory.

---

## 6.4 `product_categories`

Many-to-many join table:

```text
product_id
category_id
```

A product may appear in more than one category.

---

## 6.5 `product_images`

Fields:

```text
id
product_id
storage_path
alt_text
sort_order
is_primary
created_at
```

Admin must be able to:

- upload multiple images,
- select primary image,
- reorder images,
- delete images.

Use image optimisation on the frontend.

---

## 6.6 `option_groups`

Used for configurable products.

Fields:

```text
id
product_id
name
display_type
is_required
sort_order
created_at
updated_at
```

Example option groups:

- Size
- Colour
- Branding Method
- Branding Position
- Finish

Suggested `display_type`:

```text
select
radio
swatch
```

Keep it simple.

---

## 6.7 `option_values`

Fields:

```text
id
option_group_id
label
value
price_adjustment
sku_suffix          nullable
sort_order
is_active
metadata            jsonb nullable
created_at
updated_at
```

Examples:

```text
Size:
S
M
L
XL
2XL

Branding Method:
None
Embroidery
Full-colour print
Vinyl
Laser engraving
```

`price_adjustment` should allow positive or negative adjustments.

Do not attempt to model every possible combination as inventory unless needed.

---

## 6.8 `product_variants`

Use where combinations genuinely need distinct SKU, stock or price.

Fields:

```text
id
product_id
sku
name
price_override       nullable
stock_quantity       nullable
is_active
option_signature     jsonb
created_at
updated_at
```

This is primarily for products where size/colour combinations matter operationally.

Do not require variants for every configurable product.

---

# 7. Print-Shop Pricing

Printing frequently depends on quantity, branding and setup charges.

The system must support this without becoming an unrestricted rules engine.

---

## 7.1 Quantity price breaks

Create `product_price_tiers`:

```text
id
product_id
min_quantity
max_quantity          nullable
unit_price
created_at
updated_at
```

Example:

```text
1–9       R120 each
10–24     R105 each
25–49     R95 each
50+       R85 each
```

Price tiers override `base_price` for relevant quantity ranges.

The storefront must show quantity pricing clearly.

---

## 7.2 Setup charges

Create a simple optional model for once-per-line-item or once-per-order setup charges.

Suggested table:

`product_charges`

```text
id
product_id
name
description
charge_type
amount
is_optional
created_at
updated_at
```

Supported `charge_type`:

```text
per_item
per_line
```

Do not create a full pricing-expression engine.

Examples:

- Embroidery digitising fee
- Screen setup
- Custom engraving setup

If a pricing scenario is too complex to express cleanly, use `quote_only`.

---

# 8. Artwork Handling

Artwork is a first-class requirement.

Customer artwork must never be placed in a public storage bucket.

Use a private Supabase Storage bucket, e.g.:

```text
customer-artwork
```

Product images may use a public bucket, e.g.:

```text
product-images
```

## Accepted artwork types

Configurable, but initial target:

- PDF
- SVG
- EPS
- AI
- CDR
- PNG
- JPG/JPEG

If some formats cannot be safely previewed, store them anyway and show the filename/download control to authorised staff.

Apply file-size limits.

Do not execute, parse or transform unknown files in insecure ways.

---

## 8.1 `artwork_files`

Fields:

```text
id
storage_path
original_filename
mime_type
file_size
uploaded_by_type       customer | admin
customer_id            nullable
order_id               nullable
order_item_id          nullable
quote_id               nullable
notes                   nullable
created_at
```

Artwork should be attachable to:

- an order,
- an order item,
- a quote.

---

# 9. Customers

Guest checkout is the MVP default.

Create `customers`:

```text
id
first_name
last_name
company_name          nullable
email
phone
vat_number            nullable
marketing_opt_in
created_at
updated_at
```

Do not create a Supabase Auth account automatically for every customer.

Customer accounts can be added later.

Avoid duplicate customer records where practical by matching normalised email, but do not block checkout if matching is uncertain.

---

# 10. Addresses

Create reusable address structure.

`addresses`:

```text
id
customer_id           nullable
address_type
recipient_name
company_name          nullable
line1
line2                  nullable
suburb                 nullable
city
province               nullable
postal_code
country_code
created_at
updated_at
```

Default country can be South Africa in the UI, but do not hard-code the database to South Africa only.

---

# 11. Cart

The cart may initially be stored client-side/session-side for guests, but all prices must be recalculated and validated on the server before an order is created.

Never trust:

- client-submitted price,
- discount amount,
- setup charge,
- delivery fee,
- tax amount,
- product publication state,
- stock availability.

A cart item should carry enough information to reconstruct:

- product,
- selected variant,
- selected option values,
- quantity,
- artwork association where applicable.

Persisting abandoned carts is optional and not part of the MVP.

---

# 12. Checkout

Guest checkout first.

Required fields:

- first name,
- surname,
- email,
- phone,
- company name optional,
- billing/delivery address as applicable,
- collection/delivery selection,
- customer note,
- terms acceptance,
- optional marketing consent.

Never bundle marketing consent into required checkout consent.

---

# 13. Collection & Delivery

MVP fulfilment modes:

```text
collection
delivery
```

Shop Manager settings should control which are enabled.

## Collection

Allow admin-configurable:

- collection address,
- collection instructions,
- optional opening hours text.

## Delivery

For the first implementation use one of:

- flat delivery fee,
- free delivery over threshold,
- manual quote for delivery.

Do not integrate complex courier APIs in the initial build.

Create a clean shipping abstraction so courier-rate integration can be added later.

---

# 14. Tax / VAT

Do not assume Vert's VAT status.

Create shop settings:

```text
prices_include_tax
tax_enabled
tax_rate
tax_label
vat_number
```

Default tax rate may be configured through admin; do not permanently hard-code business tax assumptions into product calculations.

Orders must snapshot:

- subtotal,
- discount,
- shipping,
- tax,
- total.

Historical order totals must not change when later settings change.

---

# 15. Orders

Create `orders`.

Fields:

```text
id
order_number
customer_id
status
payment_status
fulfilment_method
customer_email
customer_phone
customer_name
company_name            nullable
billing_address_snapshot jsonb
delivery_address_snapshot jsonb nullable
subtotal
discount_total
shipping_total
tax_total
grand_total
currency
customer_note            nullable
internal_note            nullable
payment_provider         nullable
payment_reference        nullable
paid_at                  nullable
created_at
updated_at
```

Generate human-friendly order numbers.

Example:

```text
VERT-2026-000123
```

Do not expose UUIDs as the primary customer-facing identifier.

---

## 15.1 Order statuses

Use a manageable workflow:

```text
new
awaiting_artwork
awaiting_approval
in_production
ready
shipped
completed
cancelled
```

Payment status is separate:

```text
unpaid
pending
paid
failed
refunded
partially_refunded
```

Do not mix production and payment state into one status.

Admin should be able to update order status from the order screen.

Store a history record whenever status changes.

---

## 15.2 `order_items`

Fields:

```text
id
order_id
product_id              nullable
product_name_snapshot
sku_snapshot             nullable
variant_snapshot         jsonb nullable
options_snapshot         jsonb nullable
quantity
unit_price
setup_charges
line_total
requires_artwork
created_at
```

Snapshot product details into the order.

Historical orders must remain understandable even if a product is later renamed, repriced or archived.

---

## 15.3 `order_status_history`

Fields:

```text
id
order_id
old_status              nullable
new_status
changed_by              nullable
note                    nullable
created_at
```

---

# 16. Quote Requests

Some products/services should not pretend to have a fixed online price.

Create `quotes`:

```text
id
quote_number
customer_id             nullable
status
customer_name
company_name            nullable
email
phone
subject
description
quantity                nullable
product_id              nullable
estimated_value         nullable
admin_note              nullable
valid_until             nullable
created_at
updated_at
```

Suggested quote statuses:

```text
new
reviewing
quoted
accepted
declined
expired
converted
```

A quote request may include artwork.

Future feature: convert accepted quote to order.

For the first version, conversion can be simple and admin-driven.

---

# 17. Discounts

Do not build promotions in Phase 1.

Design so discounts can be added cleanly later.

Phase 5+ may introduce:

`discount_codes`

```text
id
code
discount_type
value
minimum_order
starts_at
ends_at
usage_limit
is_active
created_at
updated_at
```

Supported types:

```text
percentage
fixed
```

Avoid complex stacking rules initially.

---

# 18. Shop Settings

Create a settings table or equivalent keyed configuration.

Suggested settings:

### Business
- shop name
- email
- phone
- WhatsApp number
- physical/collection address
- currency
- tax settings
- order-number prefix

### Storefront
- shop enabled
- featured-products count
- default product sort
- products per page

### Fulfilment
- collection enabled
- delivery enabled
- flat delivery fee
- free delivery threshold
- collection instructions

### Orders
- order confirmation email enabled
- low-stock threshold default

### Artwork
- allowed file extensions
- maximum upload size
- artwork instructions

Do not create a settings framework larger than necessary.

---

# 19. Admin Dashboard

Route:

```text
/admin
```

The dashboard should be visually clean and simple.

Show useful operational cards such as:

- New orders
- Awaiting artwork
- Awaiting approval
- In production
- Ready
- New quote requests
- Low-stock products

Also show:

- latest orders,
- latest quote requests.

Do not fill the dashboard with vanity analytics.

---

# 20. Admin Product Manager

Routes may follow the framework's conventions, for example:

```text
/admin/products
/admin/products/new
/admin/products/:id
/admin/categories
```

Product list should support:

- search,
- category filter,
- status filter,
- published/unpublished filter,
- edit,
- duplicate,
- archive,
- quick publish/unpublish.

Product editor should use logical sections:

1. Basic information
2. Images
3. Pricing
4. Options & variants
5. Quantity pricing
6. Artwork
7. Inventory
8. Categories
9. SEO
10. Publishing

Use autosave only if reliable. A conventional explicit Save button is perfectly acceptable and likely preferable.

Warn before leaving with unsaved changes.

---

# 21. Product Duplication

Fran should be able to duplicate a product.

A duplicated product should:

- receive a new ID,
- receive a unique slug,
- start unpublished,
- copy descriptions/settings/options/tier pricing,
- optionally copy image references where safe,
- never duplicate historical order data.

This will be useful for similar garments/products.

---

# 22. Product Templates

After core product management works, add lightweight templates to speed product creation.

Examples:

- Garment
- Mug
- Promotional item
- Sticker/label
- Embroidery job
- Laser product
- Quote-only custom job

A template may pre-populate option groups and common settings.

Templates must remain editable.

Do not make templates a dependency for basic product CRUD.

---

# 23. Public Shop

Provide a clear Shop entry in the existing website navigation.

Suggested routes:

```text
/shop
/shop/category/:slug
/shop/product/:slug
/cart
/checkout
/quote
/order/confirmation
```

Adapt route syntax to the actual framework.

## Shop listing

Support:

- category navigation,
- product cards,
- primary image,
- product name,
- price / "from" price / Request a Quote,
- featured/sale/new badges,
- sensible pagination or incremental loading,
- search,
- basic sorting.

Suggested sort options:

- Featured
- Name
- Price low to high
- Price high to low
- Newest

Do not build advanced faceted search until there is a real catalogue need.

---

# 24. Product Page

Each product page should support the relevant combination of:

- image gallery,
- title,
- price,
- from-price,
- description,
- variants,
- option groups,
- quantity,
- quantity price table,
- setup charges,
- artwork instructions,
- file upload,
- stock/made-to-order state,
- lead-time text,
- Add to Cart,
- Request a Quote,
- related products,
- category breadcrumbs.

The page should change behaviour based on product type.

### Standard

```text
Select variant if required
Choose quantity
Add to Cart
```

### Configurable

```text
Choose required options
Choose quantity
Upload artwork if applicable
View calculated price
Add to Cart
```

### Quote only

```text
Enter details
Choose quantity where relevant
Upload artwork
Request a Quote
```

---

# 25. Pricing Display Rules

Use:

```text
R95.00
```

rather than:

```text
R 95
```

unless the existing Vert design has a different consistent format.

For tiered/configurable products, display:

```text
From R95.00
```

where appropriate.

For quote-only items display:

```text
Request a Quote
```

Never show `R0.00` for quote-only items.

---

# 26. Payments

Do not tightly couple checkout to one payment provider.

Create a small provider interface/abstraction.

Likely South African options may include PayFast or Yoco, but the actual provider should be selected separately before payment implementation.

## Requirements

- server creates/verifies payment request,
- return URL,
- cancel URL,
- webhook/notification endpoint,
- webhook signature verification,
- amount verification,
- order reference verification,
- idempotent payment handling,
- never mark an order paid solely because the browser returned to a success URL,
- record provider transaction reference.

Payment integration is a later phase.

The site must still support creating orders before online payment is enabled if the business wants EFT/manual payment initially.

---

# 27. Email Notifications

Support transactional email abstraction.

Minimum future emails:

### Customer
- order received
- payment received
- order ready for collection
- order shipped
- quote request received

### Admin
- new order
- new quote request

Do not hard-code an email vendor throughout the app.

Templates should use Vert branding but remain simple and readable.

Never email private artwork as attachments unless specifically required. Link authorised admin users to the order instead.

---

# 28. WhatsApp

Do not implement automated WhatsApp messaging in the MVP.

Where useful, the customer-facing site may provide a normal click-to-WhatsApp contact action using the configured business number.

Leave room for future transactional WhatsApp integration.

---

# 29. Search

Start with simple product search by:

- name,
- SKU,
- description,
- category.

PostgreSQL search is sufficient.

Do not add Algolia/Elasticsearch or another paid search platform unless scale later justifies it.

---

# 30. SEO

The shop must extend, not damage, the existing site's SEO.

Each published product should have:

- unique canonical URL,
- unique title,
- meta description,
- Open Graph metadata,
- product image,
- descriptive alt text,
- indexable server-rendered/static HTML where supported by the current framework.

Create/update sitemap generation to include:

- published products,
- active categories.

Exclude:

- admin routes,
- cart,
- checkout,
- order confirmation,
- private quote/order pages,
- unpublished products.

Add structured data where appropriate:

- `Product`
- `Offer`
- `BreadcrumbList`
- organisation data already used by the main website

Do not emit misleading price/availability structured data for quote-only products.

Preserve existing SEO work.

---

# 31. URLs & Slugs

Slugs must be:

- readable,
- unique,
- lowercase,
- hyphenated.

Example:

```text
/shop/product/ladies-pique-golf-shirt
```

Changing a published product slug should ideally preserve a redirect from the old slug if the existing framework makes this easy.

If not implemented initially, warn admins before changing a published slug.

---

# 32. Security

This section is mandatory.

## Supabase

Enable Row Level Security on all applicable tables.

### Public users may:
- read published, active shop catalogue data,
- create approved guest checkout/quote operations only through safe server logic where required.

### Public users may not:
- read private artwork,
- read all customers,
- read orders,
- read quotes,
- read admin profiles,
- change products,
- change prices,
- change order status,
- access internal notes,
- access cost prices.

### Admin/staff
Permissions should follow roles.

Use service-role credentials only server-side.

---

## 32.1 Storage security

### `product-images`
Can be public/readable if desired.

### `customer-artwork`
Must be private.

Use signed URLs or authenticated access for private artwork.

Do not expose permanent public URLs for customer artwork.

---

## 32.2 Input validation

Validate all server inputs.

Protect against:

- invalid quantities,
- negative prices,
- manipulated totals,
- unsupported file uploads,
- oversized files,
- unsafe filenames,
- SQL injection through proper parameterisation,
- XSS through unsafe rendered customer/admin content,
- unauthorised admin actions.

Use CSRF protections where relevant to the chosen architecture.

---

# 33. Audit Trail

Create a lightweight audit log for important admin actions.

Suggested table:

`audit_log`

```text
id
actor_user_id
action
entity_type
entity_id
summary
metadata            jsonb nullable
created_at
```

Record at minimum:

- product created,
- product published/unpublished,
- product price materially changed,
- order status changed,
- payment status changed manually,
- quote status changed.

Do not audit every button click.

---

# 34. Backups & Export

Supabase/platform backups depend on the selected plan and may change over time.

Regardless of plan, build practical business export tools later.

Admin should eventually be able to export:

### Orders
CSV

### Products
CSV

### Customers
CSV

Avoid making the business dependent on manually copying data out of Supabase Studio.

A full import/export utility is not MVP Phase 1.

---

# 35. Basic Reporting

Keep reporting simple.

Useful future reports:

- orders by date,
- sales totals,
- sales by product,
- sales by category,
- top products,
- quote conversion,
- low stock.

Do not implement BI dashboards in early phases.

---

# 36. Accessibility

Maintain good accessibility:

- keyboard-accessible forms,
- proper labels,
- visible focus states,
- semantic buttons/links,
- sufficient contrast,
- alt text for product images,
- useful validation messages,
- no critical interaction that depends only on colour.

---

# 37. Responsive Design

The public shop must work well on mobile.

The admin interface must also be usable on:

- desktop,
- tablet,
- phone.

Prioritise desktop/tablet efficiency for admin without making mobile unusable.

---

# 38. Performance

Use:

- appropriately sized product images,
- lazy loading below the fold,
- caching where safe,
- pagination where catalogue size warrants it,
- minimal JavaScript where possible.

Do not fetch the entire product catalogue unnecessarily.

Avoid rendering private/admin data into public page bundles.

---

# 39. Error Handling

Provide useful customer-facing errors without leaking implementation details.

Examples:

```text
We couldn't upload that artwork. Please check the file and try again.
```

not:

```text
Supabase StorageError 403 policy violation...
```

Admin errors may be more detailed but should still be understandable.

Implement logging for important server errors.

---

# 40. Empty States

Admin screens must provide useful empty states.

Examples:

```text
No products yet.
Add your first product.
```

```text
No quote requests are waiting.
```

Avoid blank tables with no explanation.

---

# 41. Confirmation & Destructive Actions

Ask for confirmation before:

- archiving/deleting a product,
- deleting an image,
- cancelling an order,
- marking payment as refunded,
- other irreversible/destructive operations.

Prefer archive over hard delete for business records.

Orders should not normally be hard-deleted.

---

# 42. Product Import

Do not build full bulk import initially.

Later, optionally support CSV product import once Fran has enough products to justify it.

The admin UI remains the primary catalogue-management method.

---

# 43. Customer Accounts — Future Phase

Customer accounts are deliberately deferred.

Possible future benefits:

- order history,
- repeat orders,
- saved delivery details,
- saved company details,
- saved artwork library,
- one-click reorder,
- corporate pricing.

The current data model should not prevent this.

Do not build it before the core shop is working.

---

# 44. Saved Artwork — Future Phase

A future authenticated customer could have:

```text
Saved Branding
- Company Logo — Full Colour
- Company Logo — Embroidery
- 2026 Staff Shirt Design
```

and reuse it on later orders.

For the MVP, artwork belongs to the specific order/quote.

---

# 45. Corporate Customers — Future Phase

Leave room for:

- customer-specific pricing,
- approved account customers,
- purchase-order numbers,
- monthly statements/invoicing,
- saved brand assets,
- repeat orders.

Do not implement corporate account logic in the MVP.

---

# 46. Analytics

Preserve any existing analytics.

If none exists, analytics can be added separately later.

Do not send:

- private artwork names,
- customer email addresses,
- customer phone numbers,
- order notes,

to analytics providers.

Useful ecommerce events later:

- view_item
- add_to_cart
- begin_checkout
- purchase
- quote_request

---

# 47. Privacy & POPIA

The shop will process personal information.

At minimum:

- update privacy-policy content to cover ecommerce,
- explain why customer details are collected,
- store only necessary customer data,
- provide marketing opt-in separately,
- keep customer artwork private,
- avoid unnecessary retention of sensitive data,
- protect admin access.

Do not claim formal POPIA compliance purely because these controls exist.

---

# 48. Terms & Policies

Before public launch, ensure the website has appropriate versions of:

- Terms & Conditions
- Privacy Policy
- Returns/Refund Policy
- Delivery/Collection Policy
- Custom Artwork / Personalised Goods policy

For customised goods, clearly communicate approval, production and return limitations.

Legal wording should be reviewed separately rather than invented by the application.

---

# 49. Artwork Approval — Later Enhancement

A future enhancement can support proof approval:

```text
Artwork received
   ->
Proof prepared
   ->
Customer approval requested
   ->
Approved
   ->
Production
```

For MVP, admin status plus manual email/WhatsApp is acceptable.

Do not block launch on a full proofing portal.

---

# 50. Order Notes

Support:

### Customer note
Visible to staff.

Example:

```text
Please match our previous navy shirts.
```

### Internal note
Admin/staff only.

Example:

```text
Fran confirmed thread colour 1842.
```

Internal notes must never be exposed publicly.

---

# 51. Order Search

Admin order manager should support search by:

- order number,
- customer name,
- email,
- company,
- phone.

Filters:

- order status,
- payment status,
- date range,
- fulfilment method.

---

# 52. Order Detail Screen

Admin order detail should show:

- order number,
- date,
- customer,
- contact information,
- fulfilment details,
- payment state,
- line items,
- selected options,
- quantities,
- price breakdown,
- artwork,
- customer note,
- internal notes,
- status history,
- status controls.

The most important operations should not require navigating through multiple screens.

---

# 53. Quote Detail Screen

Show:

- quote number,
- customer,
- request details,
- associated product,
- quantity,
- uploaded artwork,
- admin notes,
- status,
- estimated/quoted value where entered.

Later, support conversion to order.

---

# 54. Inventory

Inventory is deliberately basic.

For tracked products:

- stock quantity,
- low-stock threshold,
- optional backorder.

For made-to-order/untracked products:

- do not display fake stock quantities.

Do not build purchase orders, supplier receiving or stock movement ledgers initially.

---

# 55. Product Publication Rules

A product may be:

- active/inactive,
- published/unpublished,
- archived.

Suggested meaning:

### Published
Visible in public shop if active.

### Unpublished
Editable but not publicly visible.

### Inactive
Not currently sellable.

### Archived
Retained for historical reference but removed from active admin defaults and public shop.

---

# 56. Data Integrity

Important relationships should use foreign keys.

Use constraints where sensible for:

- quantity > 0,
- monetary values >= 0 where appropriate,
- unique slug,
- unique order number,
- unique quote number.

Use transactions for operations such as creating an order plus its items.

---

# 57. Monetary Values

Never use JavaScript floating-point arithmetic as the source of truth for money.

Use one consistent strategy such as:

- integer minor units (cents), or
- PostgreSQL fixed-precision numeric types.

Be consistent across database, server and frontend.

All final totals must be calculated/validated server-side.

Default storefront currency is ZAR but keep a currency field on transactional records.

---

# 58. Date & Time

Store timestamps in UTC.

Display to Vert staff/customers in the appropriate local timezone.

Do not store business logic using naive local timestamps.

---

# 59. Tests

Add automated tests where they provide real value.

At minimum test:

### Pricing
- fixed price
- quantity tier selection
- option price adjustments
- setup charges
- subtotal calculation
- tax calculation if enabled
- delivery
- final total

### Product visibility
- published product visible
- unpublished product hidden
- archived product hidden

### Security
- public cannot access admin data
- public cannot read private artwork
- staff cannot perform owner-only action where applicable

### Orders
- server rejects manipulated prices
- order snapshots remain unchanged after product price update
- payment webhook handling is idempotent once payments are added

### Slugs
- unique product slug handling

Use the existing project's testing ecosystem if one exists.

---

# 60. Manual Acceptance Testing

Before each production release, verify on:

- desktop Chrome/Edge,
- mobile Chrome,
- at least one narrow mobile viewport.

Critical user flows:

1. Browse shop.
2. Open category.
3. Open product.
4. Select options.
5. Change quantity.
6. Upload artwork.
7. Add to cart.
8. Checkout.
9. Submit quote.
10. Admin login.
11. Add product.
12. Upload images.
13. Publish product.
14. Confirm public product appears.
15. Update product.
16. Manage order.
17. View private artwork.

---

# 61. Phased Implementation

Do not implement everything in one pass.

---

## Phase 0 — Repository & Architecture Audit

### Tasks

- inspect repo,
- document framework/version,
- document current routes,
- document CSS/design system,
- document deployment,
- document forms,
- document current SEO,
- identify safe server-side execution option,
- confirm Supabase integration approach,
- identify technical debt that directly affects shop implementation.

### Deliverable

Create:

```text
docs/VERT_SHOP_ARCHITECTURE.md
```

with the findings.

Do not redesign the site during Phase 0.

### Acceptance

- existing site still builds,
- architecture documented,
- shop implementation plan adjusted to actual repo.

---

## Phase 1 — Supabase Foundation + Admin Product Management

### Implement

- Supabase client setup,
- database migrations,
- RLS,
- admin profiles/roles,
- admin login/logout/password reset,
- protected `/admin`,
- categories CRUD,
- products CRUD,
- product images,
- product publishing,
- basic variants/options,
- quantity price tiers,
- artwork settings,
- private/public storage buckets and policies,
- admin product list,
- admin product editor.

### Key milestone

> Fran logs into `/admin`, creates a product, uploads an image, publishes it and the product exists in Supabase without editing code.

### Do not implement yet

- full public cart,
- online payments,
- automated emails,
- advanced discounts,
- customer accounts.

---

## Phase 2 — Public Catalogue

### Implement

- Shop navigation link,
- `/shop`,
- categories,
- product cards,
- product detail pages,
- search,
- sorting,
- public pricing rules,
- options display,
- quantity pricing,
- quote-only behaviour,
- SEO,
- sitemap updates,
- structured data.

### Key milestone

> A product added by Fran in Shop Manager automatically appears on the public Vert shop.

---

## Phase 3 — Cart & Product Configuration

### Implement

- cart,
- quantity changes,
- configurable product selections,
- price calculation,
- setup charges,
- artwork upload where appropriate,
- cart persistence for current browser/session,
- server-side cart validation.

### Key milestone

> Customer can configure a printable product, upload artwork and reach checkout with correct validated pricing.

---

## Phase 4 — Guest Checkout & Orders

### Implement

- guest checkout,
- customer records,
- address capture,
- collection/delivery,
- order creation,
- order numbers,
- order item snapshots,
- order management,
- order status history,
- order confirmation page,
- admin order list/detail,
- customer/internal notes.

Payment can remain manual/EFT pending provider selection.

### Key milestone

> A genuine customer order can move from website checkout into Fran's Shop Manager.

---

## Phase 5 — Quotes

### Implement

- generic quote request,
- product-linked quote request,
- artwork attachments,
- quote numbers,
- quote admin list/detail,
- quote statuses,
- admin estimated/quoted value,
- simple quote-to-order path if practical.

### Key milestone

> Custom jobs are handled cleanly without forcing fake ecommerce pricing.

---

## Phase 6 — Payments & Transactional Email

Only start after payment provider is explicitly chosen.

### Implement

- payment provider adapter,
- payment initiation,
- signed/verified webhook handling,
- idempotency,
- payment state updates,
- customer order emails,
- admin new-order/quote emails,
- payment confirmation.

### Key milestone

> Customers can place and pay for eligible orders online reliably.

---

## Phase 7 — Polish & Useful Enhancements

Prioritise based on actual usage.

Potential additions:

- product templates,
- product duplication improvements,
- discounts,
- low-stock notifications,
- CSV export,
- order reporting,
- better admin dashboard,
- proof approval,
- customer accounts,
- saved artwork,
- reorder,
- corporate pricing,
- courier integration.

Only build enhancements that solve observed needs.

---

# 62. UI / Branding Rules

The shop should look like part of Vert Printing, not a bolted-on SaaS template.

Preserve the established Vert brand.

Use the existing site's:

- logo,
- typography,
- colour system,
- spacing conventions,
- button style,
- card style,
- imagery approach.

The admin interface may be more utilitarian but should still use Vert branding lightly.

Do not over-decorate the admin system.

Priority:

```text
clarity > speed > consistency > visual flourish
```

---

# 63. Admin UX Principle

Assume the Shop Manager is used by a business owner who does not want to understand the software stack.

Do not expose terms such as:

- UUID,
- RLS,
- JSON,
- storage bucket,
- database row,
- enum,
- API,
- foreign key.

Use business language:

```text
Product
Category
Price
Image
Size
Colour
Artwork
Order
Quote
Customer
Published
In Production
Ready for Collection
```

---

# 64. Seed Data

Create a small development seed dataset only.

Example categories/products can be based on Vert's actual services once confirmed.

Seed data must be easy to remove and must not be mistaken for live production catalogue data.

Do not populate hundreds of fake products.

---

# 65. Supabase Setup Documentation

Create:

```text
docs/SUPABASE_SETUP.md
```

Include:

- project creation,
- environment variables,
- how to run migrations,
- storage buckets,
- initial owner creation,
- local development,
- production deployment,
- RLS notes,
- backup/export notes.

Never write real secrets into documentation.

---

# 66. Admin Handover Documentation

Create a simple non-technical:

```text
docs/SHOP_MANAGER_GUIDE.md
```

Cover:

- logging in,
- adding a product,
- adding images,
- adding sizes/colours,
- setting prices,
- quantity pricing,
- publishing/unpublishing,
- managing orders,
- managing quotes,
- downloading customer artwork.

Write this for Fran, not a developer.

---

# 67. Definition of Done

The ecommerce project is considered successfully implemented when:

1. Existing Vert pages continue to work.
2. The public shop visually belongs to the existing website.
3. Fran can manage products without code.
4. Published products come from Supabase.
5. Products support standard, configurable and quote-only modes.
6. Quantity price breaks work.
7. Basic print/setup charges work.
8. Private customer artwork is securely stored.
9. Guest checkout works.
10. Collection/delivery options work as configured.
11. Orders appear in Shop Manager.
12. Quotes appear in Shop Manager.
13. Historical order items retain their original pricing/details.
14. Public users cannot access private/admin data.
15. Admin access is protected.
16. Product/category SEO is implemented.
17. Mobile experience is usable.
18. Critical pricing/order/security logic has tests.
19. Supabase setup is documented.
20. Fran has a non-technical Shop Manager guide.
21. Payments work only after a provider is intentionally selected and securely configured.
22. The system remains understandable by another competent developer.

---

# 68. Things Codex Must NOT Do

Do not:

- rewrite the current Vert site without a documented technical need,
- use Shopify/WooCommerce as an external dependency,
- hard-code catalogue data,
- make customer accounts mandatory,
- expose Supabase service-role keys,
- make customer artwork public,
- trust prices calculated by the browser,
- mark an order paid from a return URL alone,
- hard-delete historical orders,
- create a giant generic pricing engine,
- create complex courier integration before it is required,
- add unnecessary microservices,
- add a separate backend server without justification,
- build a full ERP/MIS,
- introduce paid services without documenting why,
- assume Vert's VAT registration/status,
- assume every product has stock,
- assume every custom job can have a fixed online price,
- implement every future feature before the core workflow works.

---

# 69. Recommended First Codex Prompt

After placing this file in the repository, use:

```text
Read VERT_SHOP_BUILD.md in full.

Inspect the existing Vert Printing repository before changing anything.

Start with Phase 0 only.

Create docs/VERT_SHOP_ARCHITECTURE.md documenting the current stack, routing, styling, SEO, deployment and the safest way to integrate Supabase and secure server-side functionality.

Do not implement the shop yet.

Call out any places where the actual repository requires this build brief to be adjusted.

Run the existing build/tests before and after any documentation/configuration changes and report the results.
```

After Phase 0 is reviewed, use:

```text
Read VERT_SHOP_BUILD.md and docs/VERT_SHOP_ARCHITECTURE.md.

Implement Phase 1 only.

Work incrementally. Preserve the existing site's design and functionality.

Use migrations for all Supabase schema changes, enable appropriate RLS, protect customer artwork, and never expose server secrets.

Run tests/build checks throughout.

At the end, provide:
1. files changed,
2. schema/migrations added,
3. environment variables required,
4. manual Supabase steps still required,
5. tests/build results,
6. Phase 1 acceptance criteria status,
7. anything that should be reviewed before Phase 2.

Do not begin Phase 2.
```

---

# 70. Final Design Principle

The key test for every implementation decision is:

> Can Fran operate the online shop day-to-day without needing Joss, Codex, GitHub or Supabase Studio?

If the answer is no for normal catalogue/order work, improve the Shop Manager.

At the same time:

> Do not automate or abstract a process that Vert does not yet need.

Build the smallest professional system that solves the real workflow, keep the data model clean, and expand based on actual use.
