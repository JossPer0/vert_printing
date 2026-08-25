# Shop Manager Guide

The Shop Manager is available at:

```text
/admin
```

Use the email and password created in Supabase Auth.

## Daily Workflow

1. Add or update products in **Products**.
2. Add product images from the product list.
3. Assign each product to a category.
4. Add customer choices for configurable products.
5. Publish only products that are ready for customers.
6. Review new cart order requests in **Orders**.

## Categories

Use **Categories** to create and maintain shop categories.

Each category can have:

- name,
- URL slug,
- public category description,
- SEO title,
- SEO description.

The public category page uses this copy automatically.

## Products

Use **Products** to manage catalogue items.

Product type:

- **Standard**: a normal product with a fixed online price.
- **Configurable**: customers must choose options before adding to cart.
- **Quote Only**: customers request a quote instead of ordering online.

Pricing mode:

- **Fixed Price**: shows a normal price.
- **From Price**: shows a starting price.
- **Quote Only**: hides online ordering.

Only publish products that are ready to appear publicly.

## Product Choices

Use **Product Choices** for selections that affect the order, such as:

- outer colour,
- inner colour,
- size,
- material,
- branding method.

Use product information fields for facts that are not customer choices, such as:

- dimensions,
- material information,
- finish,
- weight,
- lead time,
- care instructions.

## Images

Add or update the primary product image from the product list.

The thumbnail can be opened to preview the uploaded image.

Alt text is edited from the product edit screen and is used on the public product image.

## Orders

When a customer submits the cart form:

- the order appears in **Orders**,
- selected product choices are saved with the order,
- payment remains unpaid until handled manually,
- Vert receives an order request email,
- the customer receives an order request confirmation email if Postmark is configured.

Use the order status dropdown to move an order through:

- New,
- Awaiting artwork,
- Awaiting approval,
- In production,
- Ready,
- Shipped,
- Completed,
- Cancelled.

The order history records status changes.

## Current Limitations

Payment is not taken online yet.

Delivery is still confirmed manually.

Customer accounts, address search, PUDO and Stitch payments are later backlog items.
