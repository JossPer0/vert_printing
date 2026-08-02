# Vert Printing Website Copy and SEO Fixes

**Audited site:** https://vert-printing.pages.dev/  
**Prepared:** 2 August 2026  
**Primary business location:** Kloof, Durban, KwaZulu-Natal  
**Recommended production domain:** https://www.vertprinting.co.za/

---

## 1. Main findings

The visual structure is suitable for a small local printing business, but the current copy still reads partly like a development prototype.

The biggest issues are:

1. The site talks about how the website was built instead of focusing on the customer.
2. Important services are grouped too broadly for strong search visibility.
3. The portfolio section contains placeholders rather than proof of completed work.
4. The homepage needs stronger local signals for Kloof, Durban and the Upper Highway area.
5. The quote section explains that the site is “enquiry-first” instead of making it easy and appealing to request a quote.
6. The site needs a proper production domain, canonical URL, metadata, structured data, sitemap and search-engine setup.
7. “Event Planning” is listed as a future service and may distract from the services Vert currently delivers.

---

# 2. Priority changes

## Priority 1 — Remove all development and placeholder language

The following wording should not appear on the live customer-facing website:

- “This site is structured so a shop can be added later”
- “Designed for real examples as the gallery grows”
- “The first version uses service-focused panels”
- “Add project photos later”
- “For now, the site is enquiry-first”
- “Future event planning and execution services…”

This language makes the business feel unfinished.

Replace it with customer-focused copy and real examples of work.

---

## Priority 2 — Use the custom domain

The public site should use:

`https://www.vertprinting.co.za/`

Configure the following:

- Add `www.vertprinting.co.za` as the primary Cloudflare Pages custom domain.
- Redirect `vertprinting.co.za` to `www.vertprinting.co.za`.
- Redirect the `pages.dev` address to the custom domain where possible.
- Set every canonical URL to the custom domain.
- Use the custom domain in the sitemap, structured data and social metadata.
- Do not allow both the Pages URL and custom domain to compete in search results.

Recommended canonical homepage:

```html
<link rel="canonical" href="https://www.vertprinting.co.za/" />
```

---

# 3. Recommended homepage copy

## Navigation

Use:

- Services
- Our Work
- About
- Get a Quote

The logo should link back to the homepage.

---

## Hero section

### Eyebrow

```text
CUSTOM PRINTING, BRANDING & LASER CUTTING IN KLOOF
```

### Main heading

```text
Custom printing and branding, made properly.
```

### Supporting copy

```text
From branded clothing and personalised mugs to stickers, labels, embroidery and laser-cut products, Vert Printing helps businesses, teams, schools and individuals turn ideas into professionally finished products.
```

### Buttons

Primary:

```text
Request a Quote
```

Secondary:

```text
Explore Our Services
```

### Optional reassurance line

```text
Personal service • Practical artwork assistance • Small and bulk orders
```

Only include “small orders” if Vert genuinely accepts them.

---

## Intro section

### Heading

```text
Tell us what you need. We’ll help you make it.
```

### Copy

```text
Every project is different, so we quote according to the product, quantity, artwork, material, finish and required turnaround time. Send us your idea or existing design and we’ll guide you through the most suitable production option.
```

This replaces:

> “Start with a brief, not a cart.”

That phrase is clever, but it is slightly abstract. The replacement is clearer and more useful for a local service business.

---

# 4. Services copy

## Section heading

```text
Printing, branding and laser cutting under one roof
```

## Section introduction

```text
Whether you need one personalised gift, branded apparel for a team, product labels for a growing business or a custom laser-cut item, we’ll help you choose the right process and finish.
```

---

## Garment Printing

### Suggested heading

```text
T-Shirt and Garment Printing
```

### Suggested copy

```text
Custom printing for T-shirts, hoodies, golf shirts, workwear, uniforms, team clothing and promotional apparel. We’ll recommend the most suitable printing method based on your design, fabric, quantity and budget.
```

Use “direct-to-garment” only if Vert currently offers DTG in-house or through a dependable production partner. Do not claim it otherwise.

---

## Embroidery

Embroidery deserves its own service card and, ideally, its own page.

### Suggested copy

```text
Professional embroidery for golf shirts, caps, jackets, uniforms, workwear and corporate clothing. Ideal for durable logos, names and branded apparel with a premium finish.
```

---

## Mug Printing

### Suggested copy

```text
Personalised and branded mugs for gifts, staff packs, events, promotions and corporate orders. Supply your design or ask us to assist with layout and placement.
```

---

## Stickers and Labels

### Suggested heading

```text
Custom Stickers and Product Labels
```

### Suggested copy

```text
Custom labels, packaging stickers, decals and promotional stickers for products, events and small businesses. Available in different sizes and finishes to suit the application.
```

Add the actual available materials and finishes once confirmed, such as:

- Vinyl
- Paper
- Clear
- Waterproof
- Gloss
- Matte
- Contour cut

Do not list any material Vert does not offer.

---

## Laser Cutting and Engraving

### Suggested copy

```text
Custom laser cutting and engraving for MDF, wood and Perspex. Suitable for signage, décor, gifts, displays, event pieces, branded items and bespoke projects.
```

Current wording says “up to 6 mm.” Keep this only if it is an accurate limit for every supported material. Otherwise specify limits by material or leave the thickness off the homepage.

Use **acrylic** alongside **Perspex** because more customers search for “acrylic laser cutting.”

Suggested version:

```text
Precision laser cutting and engraving on MDF, wood, acrylic and Perspex for signage, décor, gifts, displays and custom projects.
```

---

## Branding

“Branding” is too broad as a standalone service because the other cards already describe branding services.

Either remove this card or rename it:

```text
Corporate and Promotional Branding
```

Suggested copy:

```text
Branded clothing, staff gifts, promotional products, labels and display items for businesses, schools, clubs, teams and events.
```

---

## Event Planning

Remove “Event Planning” until it is a real, available and clearly defined service.

Listing a future service weakens the focus of the website and could attract enquiries Vert cannot yet fulfil.

When ready, add it as a separate service page with:

- Exact services offered
- Types of events
- Service area
- Example packages
- Real event photographs
- Enquiry requirements

---

# 5. Portfolio section

## Current problem

The current portfolio area describes how future photographs can be added. This must be replaced with actual work.

## Recommended heading

```text
Recent work
```

## Supporting copy

```text
A selection of custom printing, embroidery, labels and laser-cut projects completed for local businesses, teams, events and individual clients.
```

## Project cards

Each portfolio item should include:

- A clear photograph
- A descriptive project title
- Service type
- Brief client requirement
- Material or production method
- Location where useful
- Accurate image alt text

Example:

```text
Branded staff shirts for a Kloof business
Heat-transfer garment printing on black golf shirts for a local team.
```

Recommended initial categories:

- Printed Clothing
- Embroidery
- Mugs
- Stickers and Labels
- Laser Cutting
- Corporate Branding

Do not launch an empty filter system. Start with six to twelve strong examples.

---

# 6. About section

## Recommended heading

```text
Local experience. Personal service.
```

## Suggested copy

```text
Vert Printing began in 2012 with custom T-shirt and mug printing and has since grown to include embroidery, stickers, product labels and laser cutting.

Based in Kloof, Vert works closely with businesses, schools, clubs, teams and individuals across Durban and the Upper Highway area. Every project receives practical, personal attention—from checking the artwork and selecting the right process to producing the finished item.
```

Only say “across Durban and the Upper Highway area” if that accurately reflects the normal service area.

## About-page expansion

A dedicated About page should cover:

- Who Fran is
- Why Vert Printing was started
- The meaning of “1949,” if it remains part of the brand
- Whether production is completed in-house
- The types of clients Vert commonly helps
- The business’s approach to quality and customer service
- Real photographs of Fran, the workspace and equipment

A genuine founder photograph will build more trust than generic stock images.

---

# 7. Testimonial section

The existing testimonial is useful but should be marked up more clearly.

Recommended format:

```text
“Fantastic quality and the prices have been more than fair. Dealing with Fran is always a pleasure.”

— The Anchorage Krantzkloof
```

Add more verified testimonials over time.

Best practice:

- Use the customer or company name with permission.
- Do not invent review dates or star ratings.
- Link to a genuine public review profile where available.
- Include different service types in the reviews.

---

# 8. Quote section

## Recommended heading

```text
Request a custom quote
```

## Suggested copy

```text
Tell us what you would like made, how many you need and when you need it. Attach your logo or artwork if it is ready, and we’ll come back to you with the best production option and a clear quote.
```

## Form fields

Recommended fields:

- Name
- Business or organisation — optional
- Email
- Phone or WhatsApp number
- Service required
- Product or item
- Quantity
- Required date
- Project details
- Artwork upload
- Preferred contact method

## Service dropdown

Use:

- T-Shirt and Garment Printing
- Embroidery
- Mug Printing
- Stickers and Labels
- Laser Cutting or Engraving
- Corporate or Promotional Branding
- Other

## Button label

Replace:

```text
Prepare Email Quote Request
```

with:

```text
Request My Quote
```

A button that opens the visitor’s email program is less reliable than a proper server-side form. Prefer submitting the form directly and showing a confirmation page.

## Confirmation message

```text
Thanks — your quote request has been received. We’ll review the details and get back to you as soon as possible.
```

Do not promise a response time unless Vert can meet it consistently.

## Spam protection

Use Cloudflare Turnstile and a hidden honeypot field.

---

# 9. Contact and location copy

## Suggested heading

```text
Visit or contact Vert Printing in Kloof
```

## Suggested copy

```text
Vert Printing is based at 7 Bridle Road, Kloof, KwaZulu-Natal. Contact us before visiting so we can make sure someone is available to assist you.
```

Only include the “contact before visiting” sentence if visits are by appointment.

## Display contact details consistently

```text
Phone / WhatsApp: +27 66 245 6511
Email: info@vertprinting.co.za
Address: 7 Bridle Road, Kloof, KwaZulu-Natal, 3610
```

Use the same business name, address and phone number everywhere:

- Website
- Google Business Profile
- Facebook
- Instagram
- Quotations and invoices
- Local directories

This consistency supports local SEO.

---

# 10. Recommended page structure

A single-page website can launch quickly, but separate service pages will rank better for specific searches.

Recommended pages:

```text
/
 /services/
 /t-shirt-garment-printing-kloof/
 /embroidery-kloof/
 /mug-printing-kloof/
 /stickers-labels-kloof/
 /laser-cutting-engraving-kloof/
 /corporate-branding/
 /our-work/
 /about/
 /contact/
 /quote/
 /privacy-policy/
 /terms/
 /thank-you/
```

Do not create thin pages with almost identical wording. Each service page must contain useful, service-specific information.

---

# 11. Homepage SEO metadata

## Title tag

Recommended:

```text
Vert Printing Kloof | Custom Printing, Branding & Laser Cutting
```

Alternative, if Durban search volume is more important:

```text
Custom Printing Kloof & Durban | Vert Printing
```

Keep the final rendered title around 50–60 characters where practical. Avoid repeating the business name.

## Meta description

```text
Custom garment printing, embroidery, mugs, stickers, labels and laser cutting in Kloof, Durban. Contact Vert Printing for a tailored quote.
```

## Canonical URL

```html
<link rel="canonical" href="https://www.vertprinting.co.za/" />
```

## Robots directive

```html
<meta name="robots" content="index, follow, max-image-preview:large" />
```

Do not include `noindex` on the production site.

---

# 12. Social sharing metadata

Add Open Graph metadata:

```html
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Vert Printing" />
<meta property="og:title" content="Vert Printing Kloof | Custom Printing, Branding & Laser Cutting" />
<meta property="og:description" content="Custom garment printing, embroidery, mugs, stickers, labels and laser cutting in Kloof, Durban." />
<meta property="og:url" content="https://www.vertprinting.co.za/" />
<meta property="og:image" content="https://www.vertprinting.co.za/images/vert-printing-social.jpg" />
<meta property="og:image:alt" content="Custom printed, embroidered and laser-cut products by Vert Printing in Kloof" />
```

Add X/Twitter metadata:

```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Vert Printing Kloof | Custom Printing and Branding" />
<meta name="twitter:description" content="Custom printing, embroidery, stickers, labels and laser cutting in Kloof, Durban." />
<meta name="twitter:image" content="https://www.vertprinting.co.za/images/vert-printing-social.jpg" />
```

Recommended social image size:

```text
1200 × 630 px
```

Use a real photograph of completed Vert products, not a generic mock-up.

---

# 13. Local business structured data

Add JSON-LD to the homepage.

Replace placeholders with accurate information before publishing.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://www.vertprinting.co.za/#business",
  "name": "Vert Printing",
  "url": "https://www.vertprinting.co.za/",
  "telephone": "+27662456511",
  "email": "info@vertprinting.co.za",
  "image": "https://www.vertprinting.co.za/images/vert-printing-workshop.jpg",
  "logo": "https://www.vertprinting.co.za/images/vert-printing-logo.png",
  "description": "Custom garment printing, embroidery, mugs, stickers, labels and laser cutting in Kloof, Durban.",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "7 Bridle Road",
    "addressLocality": "Kloof",
    "addressRegion": "KwaZulu-Natal",
    "postalCode": "3610",
    "addressCountry": "ZA"
  },
  "areaServed": [
    {
      "@type": "City",
      "name": "Kloof"
    },
    {
      "@type": "City",
      "name": "Durban"
    }
  ],
  "sameAs": [
    "REPLACE_WITH_FACEBOOK_URL",
    "REPLACE_WITH_INSTAGRAM_URL"
  ]
}
</script>
```

Optional additions, only when accurate:

- `openingHoursSpecification`
- `priceRange`
- `geo`
- `hasMap`
- Additional Upper Highway service areas

Do not add fake aggregate ratings or review schema.

---

# 14. Heading structure

Use one H1 only:

```text
Custom printing and branding, made properly.
```

Suggested hierarchy:

```text
H1: Custom printing and branding, made properly.

H2: Tell us what you need. We’ll help you make it.
H2: Printing, branding and laser cutting under one roof
  H3: T-Shirt and Garment Printing
  H3: Embroidery
  H3: Mug Printing
  H3: Custom Stickers and Product Labels
  H3: Laser Cutting and Engraving
  H3: Corporate and Promotional Branding

H2: Recent work
H2: Local experience. Personal service.
H2: Request a custom quote
H2: Visit or contact Vert Printing in Kloof
```

Do not use headings only for visual styling.

---

# 15. Image SEO and accessibility

Each important image should have:

- Descriptive filename
- Useful `alt` text
- Explicit width and height
- Responsive image sizes
- Modern format such as WebP or AVIF
- Compression appropriate to the displayed size
- Lazy loading below the fold

Examples:

```text
vert-printing-embroidered-golf-shirts-kloof.webp
custom-mug-printing-durban.webp
laser-cut-mdf-sign-kloof.webp
custom-product-labels-kzn.webp
```

Example alt text:

```text
Black golf shirts embroidered with a white company logo
```

Avoid:

```text
image1
printing image
photo
```

Decorative images should use an empty alt attribute:

```html
alt=""
```

The logo alt text should simply be:

```text
Vert Printing
```

---

# 16. Technical SEO files

## robots.txt

Create `public/robots.txt` or the equivalent static public file:

```text
User-agent: *
Allow: /

Sitemap: https://www.vertprinting.co.za/sitemap.xml
```

Do not point the production robots file to the `pages.dev` domain.

## sitemap.xml

For the current one-page site:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.vertprinting.co.za/</loc>
  </url>
</urlset>
```

Add separate URLs as real pages are created.

Only use `<lastmod>` when it reflects a genuine content update.

## favicon and app icons

Include:

- `favicon.ico`
- SVG favicon where supported
- 32 × 32 PNG
- 180 × 180 Apple touch icon
- Web app manifest if needed

---

# 17. Google setup

## Google Business Profile

Create or fully optimise the Vert Printing profile.

Complete:

- Business name
- Primary category
- Secondary categories
- Address or service-area setup
- Telephone
- Website
- Opening hours
- Business description
- Services
- Products where suitable
- Real photographs
- Logo and cover image
- Regular project updates
- Customer reviews

Possible categories must be checked against the categories currently available in Google Business Profile. Choose the closest accurate primary category rather than forcing several unrelated ones.

## Google Search Console

After the custom domain is live:

1. Add the domain property for `vertprinting.co.za`.
2. Verify it through Cloudflare DNS.
3. Submit `https://www.vertprinting.co.za/sitemap.xml`.
4. Inspect the homepage URL.
5. Request indexing.
6. Monitor indexing, search queries, page experience and rich-result reports.

## Bing Webmaster Tools

Import the Search Console property or verify the site separately and submit the same sitemap.

---

# 18. Content opportunities

Create useful pages or articles based on genuine customer questions.

Recommended topics:

- Which T-shirt printing method is best for my order?
- Embroidery versus printed logos on workwear
- How to prepare artwork for garment printing
- What file format should I send for laser cutting?
- Acrylic versus MDF for laser-cut signs
- How many branded shirts should I order for my team?
- Sticker and label options for small businesses
- Corporate gift and staff-pack ideas
- Custom printing for schools, clubs and sports teams

Each article should answer a real question and link naturally to the relevant service and quote page.

Do not publish generic AI-written articles merely to create volume.

---

# 19. Conversion improvements

Add trust and decision-making information near the quote form:

- Types of customers served
- Minimum order rules, if any
- Typical turnaround range, if dependable
- Artwork requirements
- Delivery or collection options
- Service area
- Accepted payment methods
- Whether samples or proofs are supplied
- Whether rush jobs are possible

Useful FAQ examples:

### Do you have a minimum order quantity?

Answer this accurately by service.

### Can you help with artwork?

```text
Yes. Send us the artwork you have and we’ll check whether it is suitable for the selected production method. Basic layout assistance may be available, while more involved design work may be quoted separately.
```

Adjust this to match Vert’s actual policy.

### How long will my order take?

State a realistic range and explain that turnaround starts after artwork approval and payment, if that is the process.

### Can I supply my own garments or products?

Answer according to Vert’s actual policy and clearly address responsibility for supplied items.

### Do you deliver?

Explain collection, local delivery and courier options accurately.

---

# 20. Accessibility and usability checks

Verify:

- Text contrast meets WCAG AA.
- Every form field has a visible label.
- Keyboard users can reach all links, buttons and fields.
- Focus states are visible.
- Navigation works without a mouse.
- Buttons describe their action.
- The form reports errors next to the relevant field.
- Errors are announced to screen readers.
- The embedded map has an accessible title.
- Telephone and email details are clickable.
- The WhatsApp link opens the correct number.
- Motion respects `prefers-reduced-motion`.
- The site remains usable at 200% zoom.
- Tap targets are large enough on mobile.

---

# 21. Performance checks

Before launch:

- Compress hero and portfolio images.
- Do not preload several large images.
- Preload only the primary above-the-fold asset if necessary.
- Self-host fonts where licensing allows.
- Use `font-display: swap`.
- Remove unused JavaScript.
- Avoid large animation libraries for simple effects.
- Reserve image dimensions to prevent layout shifts.
- Lazy-load the map or use a static map preview until clicked.
- Test with Lighthouse and PageSpeed Insights on mobile.
- Aim for good Core Web Vitals rather than chasing a perfect score.

---

# 22. Recommended implementation order

## Before public launch

1. Connect the custom domain.
2. Replace all prototype and future-facing copy.
3. Add real project photographs.
4. Replace the email-preparation form with a proper submission form.
5. Add unique title, description, canonical and social metadata.
6. Add LocalBusiness structured data.
7. Create robots.txt and sitemap.xml.
8. Confirm mobile layout, form validation and contact links.
9. Add privacy policy and quote-form consent wording.
10. Set up Google Business Profile and Search Console.

## Immediately after launch

1. Request indexing.
2. Add at least six real portfolio projects.
3. Request genuine Google reviews.
4. Build separate pages for the highest-value services.
5. Track quote submissions and WhatsApp clicks.
6. Review Search Console queries monthly.

## Later

1. Add a shop only for products with stable pricing and clear specifications.
2. Add event services only when the service is ready to sell.
3. Publish useful guides based on real customer questions.
4. Expand local landing content only where Vert genuinely serves those locations.

---

# 23. Recommended final homepage flow

```text
Header
Hero
Customer reassurance
Intro / How quoting works
Services
Selected recent work
Why choose Vert
About Fran / Vert story
Testimonials
FAQ
Quote form
Location and contact
Footer
```

## Suggested “Why choose Vert” block

### Heading

```text
Practical help from idea to finished product
```

### Items

```text
Personal service
Deal directly with a local business that takes the time to understand the job.

The right process for the product
Get guidance on the most suitable print, embroidery, label or laser-cutting method.

Artwork assistance
We’ll check your files and help identify what is needed before production begins.

Made for real requirements
Orders are quoted around the quantity, material, finish and deadline—not forced into a generic package.
```

---

# 24. Information to confirm before publishing

The developer or business owner should confirm:

- Exact legal or trading name
- Whether customers may visit without an appointment
- Opening hours
- Current service area
- Minimum order quantities
- Garment-printing methods actually offered
- Materials and maximum thicknesses for laser cutting
- Sticker and label materials
- Whether embroidery is in-house or outsourced
- Standard turnaround expectations
- Collection, delivery and courier options
- Artwork and design fees
- Payment and deposit terms
- Permission to use customer work and testimonials
- Correct Facebook and Instagram URLs
- Whether the 2012 start date is correct
- How the “1949” brand element should be explained

Do not publish unsupported claims such as “best,” “leading,” “fastest,” “highest quality” or “affordable” without evidence and context.
