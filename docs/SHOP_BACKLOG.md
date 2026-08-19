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