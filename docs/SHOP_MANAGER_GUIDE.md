# Shop Manager Guide

The Shop Manager is available at:

```text
/admin
```

## Login

Use the email and password created for you in Supabase Auth.

If the page says Supabase is not configured, the site is missing its Supabase environment variables.

## Add A Category

1. Log in to `/admin`.
2. Enter the category name.
3. Click **Add Category**.

The system creates a URL-friendly slug automatically.

## Add A Product Draft

1. Enter the product name.
2. Choose the product type:
   - Standard
   - Configurable
   - Quote only
3. Choose the pricing mode:
   - Fixed
   - From price
   - Quote only
4. Add a base price if relevant.
5. Tick **Requires artwork** if the customer must supply artwork.
6. Click **Add Product Draft**.

New products are saved as drafts. Public shop display comes in a later phase.

## Current Phase 1 Limitations

This first admin version creates categories and product drafts only.

Not yet included:

- image upload UI,
- category assignment UI,
- option group editor,
- price tier editor,
- public shop pages,
- cart,
- checkout,
- order manager,
- quote manager.

Those are planned in later Phase 1 work or later phases according to the build brief.