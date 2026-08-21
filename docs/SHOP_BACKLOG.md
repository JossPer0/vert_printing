# Shop Backlog

Small follow-up tasks that should be handled in later shop/admin passes.

## Admin Images

- Product image cleanup: when an admin updates a product image, delete the previous Supabase Storage object after the product_images.storage_path update succeeds so old files do not accumulate.


## STL Product Analysis

- Add an admin-only STL upload and analysis workflow for 3D products.
- Parse the STL deterministically to extract bounding-box dimensions, triangle count, estimated volume, surface area, mesh/watertight status and file metadata.
- Require an explicit unit selection because STL files generally do not contain units.
- Let Fran choose whether verified measurements are included in AI product-content drafts.
- Keep the STL private unless a future customer-facing 3D preview is deliberately added.
- Do not let AI infer or invent material, colour, finish, print time, price or other unsupported facts.

## Customer Accounts

- Add optional customer accounts after guest checkout is working reliably.
- Allow customers to save contact details and delivery/collection addresses for future orders.
- Keep guest checkout available; do not make accounts mandatory for basic ordering.
- Add an account area for saved details, order history and repeat-order support when the order system is mature enough.
- Preserve privacy and POPIA expectations: store only necessary customer information and keep private artwork/order data protected.

## Address Search

- Add address lookup/search to checkout once delivery flows are implemented.
- Prefer a South Africa-friendly address provider and keep manual address entry as a fallback.
- Store the final customer-approved address snapshot on the order rather than trusting lookup data blindly.
- Avoid exposing address-provider API keys in browser code unless the provider explicitly supports public client keys.

## PUDO Integration

- Investigate PUDO locker/drop-off integration for delivery/collection options.
- Confirm API availability, pricing, coverage, parcel size/weight limits, authentication requirements and webhook/status support before implementation.
- Add this behind a shipping-provider abstraction so PUDO does not become hard-coded into checkout.
- Do not offer PUDO to customers until rates, locker selection and order-status handling are reliable.

## Stitch Payments Integration

- Investigate Stitch as a future payment provider option.
- Confirm merchant requirements, checkout flow, fees, supported payment methods, webhook signing, refund support and settlement reporting.
- Implement only after checkout/order totals are server-validated and order creation is stable.
- Keep payment secrets server-side in Cloudflare Pages secrets and verify webhooks idempotently before marking orders paid.
