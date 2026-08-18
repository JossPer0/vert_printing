# Vert Printing — Shop Manager UI Brief

**Project:** Vert Printing  
**Document:** Admin / Shop Manager UI Correction Brief  
**Purpose:** Replace the current developer-style admin scaffold with a polished, usable Vert Shop Manager interface without breaking working Supabase, authentication, CRUD, storage, or API logic.

## 1. Primary instruction to Codex

The existing `/admin` implementation is functionally useful as a scaffold, but visually it is not acceptable for production use.

The current screen looks like raw browser controls and developer test output. It must be redesigned into a proper shop-management application for Fran to use day-to-day.

**Critical rule:** Do not throw away or rewrite working Supabase/auth/product/category logic merely to improve the UI.

Preserve and reuse:
- existing Supabase client setup,
- authentication flow,
- protected-route logic,
- category CRUD,
- product CRUD,
- database migrations,
- RLS/security,
- storage configuration,
- API/server functions,
- existing error handling where technically sound.

Refactor UI structure where needed, but avoid unnecessary backend changes.

## 2. Problems to fix

The current `/admin` screen has these issues:

1. Raw/default browser form styling.
2. Poor spacing and alignment.
3. Inputs and selects packed horizontally.
4. No proper navigation.
5. No dashboard hierarchy.
6. No card/table system.
7. No visual distinction between primary and secondary actions.
8. Header/logo contrast is poor.
9. Admin feels like a developer tool rather than a business application.
10. Product creation is crammed into one horizontal row.
11. Category creation has no proper form layout.
12. Empty states are plain text with no hierarchy.
13. No consistent responsive layout.
14. Technical error text such as `JWT issued at future` is exposed directly in the interface.
15. No clear distinction between dashboard, products, categories and future operational sections.

Goal:

> clean, professional, fast, obvious and pleasant to use.

## 3. Who the UI is for

The Shop Manager is primarily for Fran, the owner/operator of Vert Printing.

Assume she:
- does not want to understand Supabase,
- does not want to understand databases,
- does not want to use GitHub or VS Code,
- wants to add/edit products quickly,
- wants to find orders and quotes quickly,
- wants obvious buttons and simple forms,
- may use desktop, tablet or phone,
- should not need developer knowledge for routine shop work.

Do not expose terms such as UUID, JSON, JWT, RLS, enum, storage bucket, database row, API response, or foreign key.

## 4. Design direction

The Shop Manager should feel related to the public Vert Printing brand without looking like a marketing website.

Use:
- strong clean layout,
- dark charcoal navigation,
- warm off-white main background,
- hot pink for primary actions,
- teal for secondary accents/status,
- white cards,
- subtle borders,
- restrained shadows,
- clear hierarchy,
- generous spacing,
- modern form controls,
- readable typography.

Do not make it:
- overly playful,
- overly decorative,
- glassmorphic,
- neon,
- gradient-heavy,
- animation-heavy,
- visually noisy.

Priority:

`clarity > speed > consistency > decoration`

## 5. Vert colour direction

Use the existing brand colours:

```css
--vert-ink: #1f2426;
--vert-paper: #fbfaf7;
--vert-teal: #007c7a;
--vert-teal-dark: #005c5a;
--vert-coral: #e8694f;
--vert-pink: #ec168c;
```

Recommended admin additions:

```css
--admin-bg: #f6f5f2;
--admin-surface: #ffffff;
--admin-border: #e5e3de;
--admin-muted: #6f7577;
--admin-text: #1f2426;
--admin-sidebar: #1f2426;
--admin-sidebar-hover: #2b3133;
--admin-danger: #b42318;
--admin-success: #147a52;
--admin-warning: #b7791f;
```

Extend existing tokens rather than duplicating them if the project already has a token system.

## 6. Typography

Use the site's existing typography if suitable.

Suggested hierarchy:
- Page title: 30–36px bold
- Section title: 20–24px semibold
- Card title: 16–18px semibold
- Body: 14–16px
- Labels: 13–14px medium
- Helper/meta text: 12–14px

Avoid giant marketing-style headings inside admin.

## 7. Overall admin layout

Desktop/tablet:

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Vert Printing Shop Manager                   View Site      Fran ▼ │
├──────────────────┬──────────────────────────────────────────────────┤
│                  │                                                  │
│ Dashboard        │  Page content                                    │
│ Products         │                                                  │
│ Categories       │                                                  │
│ Orders           │                                                  │
│ Quotes           │                                                  │
│ Customers        │                                                  │
│ Artwork          │                                                  │
│                  │                                                  │
│ Settings         │                                                  │
│                  │                                                  │
│ Log out          │                                                  │
└──────────────────┴──────────────────────────────────────────────────┘
```

Sidebar:
- approximately 220–260px wide,
- dark charcoal background,
- Vert logo at top,
- icon + label navigation,
- clear active state,
- subtle hover state,
- logout near bottom.

Top bar:
- section/page title where useful,
- View Site action,
- logged-in user name,
- compact user menu or logout access.

Do not use white text on white/off-white backgrounds.

## 8. Mobile layout

Below tablet width:
- sidebar becomes slide-out drawer,
- top bar includes menu button,
- page content uses full width,
- tables may become stacked cards or horizontally scroll,
- forms become one column,
- primary actions remain easy to reach.

Do not simply shrink the desktop layout until it breaks.

## 9. Dashboard

Route: `/admin`

The dashboard should not contain product/category creation forms.

Header example:

```text
Shop Manager
Manage your Vert Printing shop.
```

Phase 1 metric cards can include:
- Total Products
- Published Products
- Draft Products
- Categories

When later phases exist, add:
- New Orders
- Awaiting Artwork
- In Production
- Ready for Collection
- New Quotes

Do not show fake metrics.

## 10. Main navigation

Prepare navigation for:
- Dashboard
- Products
- Categories
- Orders
- Quotes
- Customers
- Artwork
- Settings

During Phase 1:
- Products and Categories are active.
- Hide unavailable future sections rather than making Fran click dead links.

## 11. Products page

Route: `/admin/products`

Header:

```text
Products
Manage the products shown in your online shop.

[ + Add Product ]
```

`Add Product` is the primary hot-pink action.

Search/filter row as functionality becomes available:

```text
[ Search products... ]   [Category ▼]   [Status ▼]
```

Desktop table suggested columns:
- Image
- Product
- SKU
- Category
- Price
- Type
- Status
- Updated
- Actions

Status badges:
- Published
- Draft
- Inactive
- Archived

Actions:
- Edit
- Duplicate
- Publish / Unpublish
- Archive

Archive must not be the dominant action.

## 12. Products empty state

Use a designed empty state rather than bare text:

```text
Products

You haven't added any products yet.

Add your first product to start building the Vert online catalogue.

[ + Add Product ]
```

## 13. Add Product

Route: `/admin/products/new`

Do not place the entire form on the dashboard.

Header:

```text
Add Product

Create a new product for the Vert shop.

[Cancel] [Save Draft] [Publish]
```

Only show actions that actually work.

## 14. Product editor structure

Use sections/cards or clearly separated vertical groups.

### Basic Information
- Product name
- SKU
- Short description
- Full description
- Product type

Product type:
- Standard
- Configurable
- Quote Only

Use short helper text explaining each.

### Images
Provide:
- drag/drop area,
- browse button,
- thumbnails,
- primary image control,
- image reorder if implemented,
- delete image action.

Do not show storage paths or bucket names.

### Pricing
Relevant fields:
- Pricing mode
- Base price
- Compare-at price
- Cost price

Pricing mode:
- Fixed Price
- From Price
- Quote Only

Use ZAR display.

### Product Options
For configurable products.

Example:

```text
Options

Size
S
M
L
XL
2XL

[ + Add Value ]

Colour
Black
White
Navy

[ + Add Value ]

[ + Add Option ]
```

Do not expose raw JSON.

### Quantity Pricing

```text
Minimum    Maximum     Price each
1          9           R120
10         24          R105
25         49          R95
50         —           R85

[ + Add Price Tier ]
```

Use a compact editable table.

### Artwork
Fields:
- Requires artwork toggle
- Artwork instructions

If enabled:

`Customers will be prompted to upload artwork for this product.`

### Inventory
Stock mode:
- Track Stock
- Made to Order
- Don't Track

If Track Stock:
- Quantity
- Low-stock threshold
- Allow backorders

### Categories
Use checkboxes, multi-select or searchable selection. Never require category IDs.

### SEO
Fields:
- Page title
- Meta description
- URL slug

Warn before changing a published slug if redirects are not supported.

### Publishing
Group:
- Published
- Featured
- New
- On Sale
- Active

Use clear toggles/checkboxes.

## 15. Form layout rules

Desktop:
- generally 2-column where fields naturally pair,
- long text areas full width,
- max content width around 1000–1200px.

Mobile:
- single column.

Suggested input height: 42–46px.

Every input needs:
- visible label,
- clear focus state,
- useful validation,
- helper text where needed.

Never rely on placeholder text instead of labels.

## 16. Categories page

Route: `/admin/categories`

Header:

```text
Categories
Organise products in your shop.

[ + Add Category ]
```

Use a table/list.

Suggested columns:
- Category
- Products
- Status
- Updated
- Actions

For Phase 1, omit product count if it is not efficiently available.

Add Category should use:
- modal,
- drawer,
- or dedicated page.

Do not permanently place an add-category field above the list.

## 17. Add/Edit Category

Fields:
- Name
- Slug
- Description
- Image
- Parent category optional
- Sort order
- Active
- SEO title
- SEO description

Slug may auto-generate from category name but remain editable.

## 18. Buttons

Primary — hot pink:
- Add Product
- Save Changes
- Publish
- Add Category

Secondary — white/subtle with border:
- Cancel
- View Site
- Save Draft

Destructive — red:
- Archive Product
- Delete Image

Do not make Log Out or Cancel bright pink.

## 19. Cards

Use cards for:
- dashboard metrics,
- form sections where useful,
- empty states,
- settings groups.

Suggested:
- white surface,
- subtle border,
- 10–12px radius,
- very light/no shadow,
- 20–24px padding.

Avoid excessive nested cards.

## 20. Tables

Desktop:
- visible header row,
- consistent row height,
- subtle dividers,
- row hover,
- no heavy border on every cell,
- actions right-aligned.

Mobile:
- horizontal scroll or stacked cards,
- preserve all important actions.

## 21. Status badges

Suggested:
- Published: teal/green
- Draft: neutral grey
- Inactive: muted
- Archived: muted/dark
- Warning: amber
- Error: red

Always include text; do not rely only on colour.

## 22. Alerts and errors

Do not display raw technical errors such as:

`JWT issued at future`

directly to Fran.

**Do not merely hide that error. Investigate and fix the underlying cause.**

Inspect:
- system/server clock,
- local development clock,
- token validation tolerance,
- Supabase auth session handling,
- JWT timestamp validation,
- cached token/session state.

User-facing examples:

```text
Your session has expired. Please sign in again.
```

```text
We couldn't save the product. Please try again.
```

Technical detail belongs in development logs, not the normal UI.

## 23. Toasts / feedback

Use lightweight non-blocking feedback:

Success:
- Product saved.
- Category created.
- Product published.
- Image uploaded.

Errors:
- We couldn't upload that image.

Do not use browser `alert()` for normal feedback.

## 24. Loading states

Provide states for:
- login,
- product fetch,
- save,
- image upload,
- category fetch,
- publish/unpublish.

Disable duplicate submissions while requests run.

## 25. Unsaved changes

Track unsaved product/category changes where practical and warn before leaving.

Explicit Save is preferred over complex autosave for Phase 1.

## 26. Accessibility

Include:
- keyboard navigation,
- visible focus states,
- semantic labels,
- sufficient contrast,
- accessible modal/drawer focus handling,
- readable validation.

## 27. Header branding

Fix the current low-contrast logo/header.

Suggested sidebar branding:

```text
VERT
Shop Manager
```

Use a logo version that contrasts properly against charcoal.

Main top bar:

```text
Products                          View Site     Fran ▼
```

Dark text on a light background.

## 28. Preserve public branding without copying the homepage

Admin should feel like:

`Vert Printing + professional business software`

not:

`the homepage squeezed into an admin panel`

## 29. Future routes

Prepare the shell so these can be added later without redesigning navigation:
- `/admin/orders`
- `/admin/orders/:id`
- `/admin/quotes`
- `/admin/quotes/:id`
- `/admin/customers`
- `/admin/artwork`
- `/admin/settings`

Do not build them before their planned phases.

## 30. Reusable components

Create only useful local components, such as:
- AdminShell
- AdminSidebar
- AdminTopbar
- PageHeader
- Button
- Input
- Select
- Textarea
- Checkbox
- Toggle
- Card
- Badge
- Table
- EmptyState
- FormSection
- Field
- Toast
- ConfirmDialog

Do not create a giant design-system package.

## 31. Styling structure

Do not keep dumping all admin styles into an unstructured global stylesheet.

Use the styling method appropriate to the chosen stack:
- component-scoped CSS,
- CSS modules,
- organised admin CSS,
- or the existing project convention.

Do not introduce Tailwind or another large styling dependency merely because the admin needs design.

## 32. No backend regression

After redesign:
- admin routes remain protected,
- anon users cannot mutate catalogue data,
- service-role secrets remain server-side,
- RLS remains enabled,
- login/logout still work,
- category CRUD still works,
- product CRUD still works,
- image permissions remain correct,
- no private data is rendered into public bundles.

## 33. Phase 1 UI acceptance criteria

### Layout
- [ ] Proper admin shell exists.
- [ ] Desktop sidebar exists.
- [ ] Mobile navigation works.
- [ ] Header is legible.
- [ ] Vert branding is recognisable.
- [ ] No raw browser-style layout remains.

### Dashboard
- [ ] Dashboard is separate from product/category creation.
- [ ] Relevant metric cards are shown.
- [ ] No fake metrics are shown.

### Products
- [ ] Products have a dedicated page.
- [ ] Add Product is a dedicated page or full editor.
- [ ] Product list is readable.
- [ ] Product status is clearly displayed.
- [ ] Empty state is designed.
- [ ] Product form is structured into logical sections.
- [ ] Forms are responsive.
- [ ] Save/publish actions are clear.

### Categories
- [ ] Categories have a dedicated page.
- [ ] Add Category is not permanently crammed into the list screen.
- [ ] Category list is clean and usable.

### Feedback
- [ ] Loading states exist.
- [ ] Success feedback exists.
- [ ] Errors are user-friendly.
- [ ] Technical JWT/error text is not exposed directly.
- [ ] Root cause of `JWT issued at future` has been investigated/fixed.

### Security
- [ ] Existing auth still works.
- [ ] Protected routes remain protected.
- [ ] Supabase/RLS behaviour is unchanged or improved.
- [ ] No service secrets are exposed.

### Build quality
- [ ] Existing public homepage still works.
- [ ] Existing quote flow still works.
- [ ] Cloudflare deployment/build passes.
- [ ] No unnecessary backend rewrite occurred.

## 34. Visual quality test

A non-technical business owner should be able to open `/admin` and immediately understand:

1. where products are,
2. how to add a product,
3. where categories are,
4. how to edit something,
5. how to get back to the public site,
6. how to log out.

If it still looks like a database or developer test harness, it is not done.

## 35. Codex implementation order

### Step 1
Audit current admin components and working Supabase logic. Identify what must be preserved.

### Step 2
Create the admin shell:
- sidebar,
- top bar,
- responsive mobile navigation,
- page container,
- shared design tokens.

### Step 3
Move current category management to `/admin/categories` and style it properly.

### Step 4
Move current product management to `/admin/products`. Create proper product list and empty state.

### Step 5
Build `/admin/products/new` using the existing product-create logic. Structure the form per this brief. Only show real Phase 1 fields.

### Step 6
Build edit-product UI as supported by current Phase 1 functionality.

### Step 7
Fix loading, success and error feedback. Investigate/fix `JWT issued at future`.

### Step 8
Test mobile layouts.

### Step 9
Run build/tests and manually verify:
- login,
- logout,
- create category,
- create product,
- edit product where supported,
- publish status where supported,
- refresh authenticated page,
- unauthorised access,
- public site regression.

## 36. Codex must not

Do not:
- redesign the public Vert website,
- rewrite working Supabase logic without need,
- weaken RLS,
- expose service-role credentials,
- add fake dashboard data,
- create unfinished clickable navigation,
- leave raw JWT errors visible,
- put all product fields in one horizontal line,
- put product creation on the dashboard,
- put category creation permanently above the category list,
- use browser alerts as the main feedback mechanism,
- introduce a heavyweight UI framework merely to add styling,
- make the admin an overly decorative showcase,
- start Phase 2 during this correction.

## 37. Recommended Codex prompt

```text
Read VERT_ADMIN_UI.md in full before changing code.

The current Phase 1 Shop Manager is functionally useful but visually unacceptable.

Implement the admin UI correction described in this brief.

IMPORTANT:
- Preserve working Supabase, auth, CRUD, RLS, storage and API logic.
- Do not start Phase 2.
- Do not redesign the public Vert website.
- Fix the admin as a reusable design system first, then move existing product/category functionality into the correct screens.
- Investigate and fix the visible "JWT issued at future" problem rather than merely hiding the message.
- Only expose controls backed by real Phase 1 functionality.
- Keep the admin responsive and suitable for a non-technical business owner.

At the end, stop and report:
1. files changed,
2. reusable admin components created,
3. existing backend/auth logic preserved,
4. JWT issue cause and resolution,
5. routes/screens implemented,
6. build/test results,
7. manual acceptance-test results,
8. any outstanding Phase 1 UI issues.

Do not proceed to Phase 2.
```

## 38. Final principle

The Shop Manager should pass this test:

> Fran should be able to manage Vert's catalogue without thinking about the software underneath it.

The backend can be technical.

The admin experience must not be.
