const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const moneyFormatter = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  minimumFractionDigits: 2,
});

function formatMoney(value) {
  return moneyFormatter.format(value).replace('ZAR', 'R').replace(/\s/g, '');
}

function productPrice(product) {
  if (product.pricing_mode === 'quote_only' || product.base_price === null) return 'Custom pricing';
  const price = formatMoney(product.base_price);
  return product.pricing_mode === 'from_price' || product.product_type === 'configurable' ? `From ${price}` : price;
}

function productCta(product) {
  if (product.pricing_mode === 'quote_only' || product.product_type === 'quote_only') return 'Request a Quote';
  if (product.product_type === 'configurable' || product.pricing_mode === 'from_price') return 'Discuss Options';
  return 'Enquire';
}

function productSupportText(product) {
  if (product.pricing_mode === 'quote_only' || product.product_type === 'quote_only') return 'Made to your requirements';
  if (product.product_type === 'configurable') return 'Choose options, quantities and artwork details with us.';
  if (product.requires_artwork) return 'Artwork can be supplied with your enquiry.';
  return 'Send us the quantity and timing you need.';
}

function pageShell({ title, description, canonical, body, structuredData = '' }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <meta property="og:type" content="product" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <title>${escapeHtml(title)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="/styles.css" />
    ${structuredData}
  </head>
  <body class="shop-page product-page">
    <header class="site-header">
      <a class="brand" href="/" aria-label="Vert Printing home"><img class="brand-logo" src="/assets/vert_logo_header.png" alt="Vert Printing" width="1255" height="570" /><span><strong>Vert Printing</strong><small>Kloof, Durban</small></span></a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><span></span><span></span><span></span></button>
      <nav id="site-nav" class="site-nav" aria-label="Main navigation"><a href="/#services">Services</a><a href="/shop">Shop</a><a href="/#work">Our Work</a><a href="/#story">About</a><a href="/#quote">Get a Quote</a></nav>
    </header>
    <main>${body}</main>
    <footer class="site-footer"><p>&copy; 2026 Vert Printing. All rights reserved.</p><div><a href="https://www.facebook.com/vertprinting">Facebook</a><a href="https://www.instagram.com/vertprinting">Instagram</a><a href="https://wa.me/27662456511">WhatsApp</a></div></footer>
    <script src="/script.js" type="module"></script>
  </body>
</html>`;
}

async function supabaseGet(env, path) {
  const response = await fetch(`${env.PUBLIC_SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: env.PUBLIC_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.PUBLIC_SUPABASE_ANON_KEY}`,
    },
  });
  if (!response.ok) throw new Error(`Supabase ${response.status}`);
  return response.json();
}

export async function onRequestGet({ env, params }) {
  const slug = params.slug;
  if (!env.PUBLIC_SUPABASE_URL || !env.PUBLIC_SUPABASE_ANON_KEY || !slug) {
    return new Response('Not found', { status: 404 });
  }

  const products = await supabaseGet(
    env,
    `products?select=id,name,slug,product_type,pricing_mode,base_price,requires_artwork&slug=eq.${encodeURIComponent(slug)}&is_active=eq.true&is_published=eq.true&archived_at=is.null&limit=1`,
  );

  const product = products[0];
  if (!product) {
    const body = `<section class="product-detail product-missing"><p class="section-kicker">Shop</p><h1>Product not found</h1><p>This product is not currently available. Browse the catalogue or request a custom quote.</p><a class="button primary" href="/shop">Back to Shop</a></section>`;
    return new Response(pageShell({ title: 'Product Not Found | Vert Printing', description: 'This Vert Printing product is not currently available.', canonical: `https://www.vertprinting.co.za/product/${escapeHtml(slug)}`, body }), { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } });
  }

  const images = await supabaseGet(env, `product_images?select=storage_path,alt_text,sort_order&product_id=eq.${product.id}&order=sort_order.asc&limit=1`);
  const image = images[0];
  const imageUrl = image ? `${env.PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${image.storage_path}` : '';
  const quoteHref = `/?product=${encodeURIComponent(product.name)}#quote`;
  const price = productPrice(product);
  const cta = productCta(product);
  const description = `${product.name} from Vert Printing in Kloof. ${productSupportText(product)}`;
  const productJson = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description,
    image: imageUrl || undefined,
    url: `https://www.vertprinting.co.za/product/${product.slug}`,
  };
  if (product.base_price !== null && product.pricing_mode !== 'quote_only') {
    productJson.offers = {
      '@type': 'Offer',
      priceCurrency: 'ZAR',
      price: Number(product.base_price).toFixed(2),
      availability: 'https://schema.org/InStock',
    };
  }
  const structuredData = `<script type="application/ld+json">${JSON.stringify(productJson)}</script>`;

  const body = `<section class="product-detail">
    <nav class="product-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/shop">Shop</a><span>/</span><span>${escapeHtml(product.name)}</span></nav>
    <div class="product-detail-grid">
      <div class="product-media-frame">${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(image?.alt_text || product.name)}" />` : '<span>No image available</span>'}</div>
      <div class="product-summary">
        <p class="section-kicker">Vert Product</p>
        <h1>${escapeHtml(product.name)}</h1>
        <p>${escapeHtml(productSupportText(product))}</p>
        <strong>${escapeHtml(price)}</strong>
        ${product.requires_artwork ? '<div class="product-info-note"><strong>Artwork</strong><span>For best print quality, vector artwork is preferred. If you are unsure, send what you have and we will check it before production.</span></div>' : ''}
        <a class="button primary" href="${quoteHref}">${escapeHtml(cta)}</a>
      </div>
    </div>
  </section>`;

  return new Response(pageShell({ title: `${product.name} | Vert Printing`, description, canonical: `https://www.vertprinting.co.za/product/${product.slug}`, body, structuredData }), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=60',
    },
  });
}
