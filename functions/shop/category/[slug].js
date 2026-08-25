const SITE_URL = 'https://www.vertprinting.co.za';

const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

function formatMoney(value) {
  return `R${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function productPrice(product) {
  if (product.pricing_mode === 'quote_only' || product.product_type === 'quote_only' || product.base_price === null) return 'Custom pricing';
  const price = formatMoney(product.base_price);
  return product.pricing_mode === 'from_price' || product.product_type === 'configurable' ? `From ${price}` : price;
}

function productCta(product) {
  if (product.pricing_mode === 'quote_only' || product.product_type === 'quote_only' || product.base_price === null) return 'Request a Quote';
  if (product.product_type === 'configurable' || product.pricing_mode === 'from_price') return 'Choose Options';
  return 'View Product';
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
    <meta property="og:type" content="website" />
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
  <body class="shop-page">
    <header class="site-header">
      <a class="brand" href="/" aria-label="Vert Printing home"><img class="brand-logo" src="/assets/vert_logo_header.png" alt="Vert Printing" width="1255" height="570" /><span><strong>Vert Printing</strong><small>Kloof, Durban</small></span></a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><span></span><span></span><span></span></button>
      <nav id="site-nav" class="site-nav" aria-label="Main navigation"><a href="/#services">Services</a><a href="/#work">Our Work</a><a href="/#story">About</a><a href="/#quote">Get a Quote</a><a href="/shop/" aria-current="page">Shop</a><a class="nav-cart-link" href="/cart/" data-cart-link>Cart <span data-cart-count hidden>0</span></a></nav>
    </header>
    <main>${body}</main>
    <footer class="site-footer"><p>&copy; 2026 Vert Printing. All rights reserved.</p><div><a href="https://www.facebook.com/vertprinting">Facebook</a><a href="https://www.instagram.com/vertprinting">Instagram</a><a href="https://wa.me/27662456511">WhatsApp</a></div></footer>
    <script src="/script.js?v=cart-modal-20260821d" type="module"></script>
  </body>
</html>`;
}

function supabaseHeaders(env) {
  return {
    apikey: env.PUBLIC_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${env.PUBLIC_SUPABASE_ANON_KEY}`,
  };
}

async function supabaseGet(env, path) {
  const response = await fetch(`${env.PUBLIC_SUPABASE_URL}/rest/v1/${path}`, { headers: supabaseHeaders(env) });
  if (!response.ok) throw new Error(`Supabase ${response.status}`);
  return response.json();
}

function inFilter(values) {
  return `(${values.map((value) => `"${String(value).replaceAll('"', '\\"')}"`).join(',')})`;
}

function renderProducts(products, imagesByProduct) {
  if (!products.length) return `<div class="shop-empty"><h2>This category is being updated.</h2><p>Browse all products or request a quote for something custom.</p><a class="button primary" href="/shop/">Browse the shop</a></div>`;
  return `<div class="shop-grid">${products.map((product) => {
    const image = imagesByProduct[product.id];
    const imageUrl = image ? `${image.publicUrl}` : '';
    const href = product.pricing_mode === 'quote_only' || product.product_type === 'quote_only' ? `/?product=${encodeURIComponent(product.name)}#quote` : `/product/${encodeURIComponent(product.slug)}`;
    return `<article class="shop-card">
      <a class="shop-card-image" href="${escapeHtml(href)}" aria-label="${escapeHtml(productCta(product))} for ${escapeHtml(product.name)}">${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(image.alt_text || product.name)}" loading="lazy" />` : '<span>No image available</span>'}</a>
      <div class="shop-card-body"><div><h2>${escapeHtml(product.name)}</h2><span class="shop-support">${escapeHtml(product.short_description || 'Vert Printing product')}</span></div><strong>${escapeHtml(productPrice(product))}</strong><a class="button primary" href="${escapeHtml(href)}">${escapeHtml(productCta(product))}</a></div>
    </article>`;
  }).join('')}</div>`;
}

export async function onRequestGet({ env, params }) {
  const slug = params.slug;
  if (!env.PUBLIC_SUPABASE_URL || !env.PUBLIC_SUPABASE_ANON_KEY || !slug) return new Response('Not found', { status: 404 });

  const categories = await supabaseGet(env, `categories?select=id,name,slug,description,seo_title,seo_description&slug=eq.${encodeURIComponent(slug)}&is_active=eq.true&limit=1`);
  const category = categories[0];
  if (!category) return new Response('Not found', { status: 404 });

  const relations = await supabaseGet(env, `product_categories?select=product_id&category_id=eq.${encodeURIComponent(category.id)}`);
  const productIds = relations.map((relation) => relation.product_id).filter(Boolean);
  let products = [];
  let imagesByProduct = {};

  if (productIds.length) {
    products = await supabaseGet(
      env,
      `products?select=id,name,slug,product_type,pricing_mode,base_price,short_description&is_active=eq.true&is_published=eq.true&archived_at=is.null&id=in.${encodeURIComponent(inFilter(productIds))}&order=created_at.desc`,
    );

    if (products.length) {
      const imageRows = await supabaseGet(
        env,
        `product_images?select=product_id,storage_path,alt_text,sort_order&product_id=in.${encodeURIComponent(inFilter(products.map((product) => product.id)))}&order=sort_order.asc`,
      );
      for (const image of imageRows) {
        if (imagesByProduct[image.product_id]) continue;
        imagesByProduct[image.product_id] = {
          ...image,
          publicUrl: `${env.PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${image.storage_path}`,
        };
      }
    }
  }

  const title = category.seo_title || `${category.name} | Vert Printing Shop`;
  const description = category.seo_description || category.description || `Browse ${category.name} products from Vert Printing in Kloof.`;
  const canonical = `${SITE_URL}/shop/category/${category.slug}`;
  const breadcrumbJson = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${SITE_URL}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Shop',
        item: `${SITE_URL}/shop/`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: category.name,
        item: canonical,
      },
    ],
  };
  const structuredData = `<script type="application/ld+json">${JSON.stringify(breadcrumbJson)}</script>`;
  const body = `<section class="shop-hero shop-container"><nav class="product-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/shop/">Shop</a><span>/</span><span>${escapeHtml(category.name)}</span></nav><p class="section-kicker">Shop category</p><h1>${escapeHtml(category.name)}</h1><p>${escapeHtml(category.description || 'Browse products in this Vert Printing category.')} <a class="shop-quote-link" href="/shop/">View all products -&gt;</a></p></section><section class="shop-section"><div class="shop-container">${renderProducts(products, imagesByProduct)}</div></section>`;

  return new Response(pageShell({ title, description, canonical, body, structuredData }), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=60',
    },
  });
}
