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
  if (product.pricing_mode === 'quote_only' || product.base_price === null) return 'Custom pricing';
  const price = formatMoney(product.base_price);
  return product.pricing_mode === 'from_price' || product.product_type === 'configurable' ? `From ${price}` : price;
}

function productCta(product) {
  if (product.pricing_mode === 'quote_only' || product.product_type === 'quote_only') return 'Request a Quote';
  if (product.product_type === 'configurable' || product.pricing_mode === 'from_price') return 'Choose Options';
  return 'Enquire About This Product';
}

function productSupportText(product) {
  if (product.pricing_mode === 'quote_only' || product.product_type === 'quote_only') return 'Made to your requirements';
  if (product.product_type === 'configurable') return 'Choose options, quantities and artwork details with us.';
  if (product.requires_artwork) return 'Artwork can be supplied with your enquiry.';
  return 'Send us the quantity and timing you need.';
}

function nl2br(value = '') {
  return escapeHtml(value).replace(/\r?\n/g, '<br />');
}

function hasText(value) {
  return Boolean(value && String(value).trim());
}

function detailRows(product, extraSpecifications = []) {
  const rows = [
    ['Material', product.material],
    ['Dimensions', product.dimensions],
    ['Colours', product.colour_information],
    ['Finish', product.finish],
    ['Weight', product.weight],
    ['Production', product.made_to_order_information],
    ['Lead time', product.lead_time_text],
  ];
  for (const spec of extraSpecifications) rows.push([spec.label, spec.value]);
  return rows.filter(([, value]) => hasText(value));
}

function renderDefinitionList(rows) {
  if (!rows.length) return '';
  return `<dl class="product-spec-list">${rows.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl>`;
}

function renderProductInfoSections(product) {
  const sections = [
    ['Description', product.description],
    ['Customisation', product.customisation_information],
    ['Care instructions', product.care_instructions],
    ["What's included", product.whats_included],
  ].filter(([, value]) => hasText(value));
  if (!sections.length) return '';
  return `<div class="product-info-sections">${sections.map(([title, value]) => `<article><h2>${escapeHtml(title)}</h2><p>${nl2br(value)}</p></article>`).join('')}</div>`;
}

function inFilter(values) {
  return `(${values.map((value) => `"${String(value).replaceAll('"', '\\"')}"`).join(',')})`;
}

function renderRelatedProducts(relatedProducts, imagesByProduct = {}, category) {
  if (!relatedProducts.length) return '';
  return `<section class="product-related">
    <div class="product-related-heading">
      <div><p class="section-kicker">More to browse</p><h2>${category ? `More in ${escapeHtml(category.name)}` : 'More from the Vert shop'}</h2></div>
      <a class="shop-quote-link" href="${category ? `/shop/category/${encodeURIComponent(category.slug)}` : '/shop/'}">${category ? 'View category' : 'View shop'} -&gt;</a>
    </div>
    <div class="shop-grid">${relatedProducts.map((product) => {
      const image = imagesByProduct[product.id];
      const imageUrl = image ? image.publicUrl : '';
      const quoteOnly = product.pricing_mode === 'quote_only' || product.product_type === 'quote_only' || product.base_price === null;
      const href = quoteOnly ? `/?product=${encodeURIComponent(product.name)}#quote` : `/product/${encodeURIComponent(product.slug)}`;
      const cta = quoteOnly ? 'Request a Quote' : product.product_type === 'configurable' || product.pricing_mode === 'from_price' ? 'Choose Options' : 'View Product';
      return `<article class="shop-card">
        <a class="shop-card-image" href="${escapeHtml(href)}" aria-label="${escapeHtml(cta)} for ${escapeHtml(product.name)}">${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(image.alt_text || product.name)}" loading="lazy" />` : '<span>No image available</span>'}</a>
        <div class="shop-card-body"><div>${category ? `<a class="shop-card-category" href="/shop/category/${encodeURIComponent(category.slug)}">${escapeHtml(category.name)}</a>` : ''}<h2>${escapeHtml(product.name)}</h2><span class="shop-support">${escapeHtml(product.short_description || 'Vert Printing product')}</span></div><strong>${escapeHtml(productPrice(product))}</strong><a class="button primary" href="${escapeHtml(href)}">${escapeHtml(cta)}</a></div>
      </article>`;
    }).join('')}</div>
  </section>`;
}

function renderProductCta(product, quoteHref, cta) {
  const productName = escapeHtml(product.name);
  if (product.pricing_mode === 'quote_only' || product.product_type === 'quote_only') return `<a class="button primary" data-product-name="${productName}" href="${quoteHref}">${escapeHtml(cta)}</a>`;
  const needsConfiguration = product.product_type === 'configurable' || product.pricing_mode === 'from_price';
  const checkingLabel = needsConfiguration ? 'Choose options first' : 'Checking options...';
  return `<button class="button primary" data-product-name="${productName}" type="button" data-product-action="cart" disabled>${checkingLabel}</button>`;
}
function renderQuantityControl(product) {
  if (product.pricing_mode === 'quote_only' || product.product_type === 'quote_only') return '';
  const min = Math.max(1, Number(product.minimum_quantity || 1));
  const max = Number(product.maximum_quantity || 0);
  const maxAttr = max > 0 ? ` max="${max}"` : '';
  return `<label class="product-quantity-control" for="product-quantity"><span>Quantity</span><input id="product-quantity" type="number" inputmode="numeric" min="${min}"${maxAttr} value="${min}" /></label>`;
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
      <nav id="site-nav" class="site-nav" aria-label="Main navigation"><a href="/#services">Services</a><a href="/#work">Our Work</a><a href="/#story">About</a><a href="/#quote">Get a Quote</a><a href="/shop/">Shop</a><a class="nav-cart-link" href="/cart/" data-cart-link>Cart <span data-cart-count hidden>0</span></a></nav>
    </header>
    <main>${body}</main>
    <footer class="site-footer"><p>&copy; 2026 Vert Printing. All rights reserved.</p><div><a href="https://www.facebook.com/vertprinting">Facebook</a><a href="https://www.instagram.com/vertprinting">Instagram</a><a href="https://wa.me/27662456511">WhatsApp</a></div></footer>
    <script src="/script.js?v=cart-modal-20260821d" type="module"></script><script src="/product-options.js?v=cart-modal-20260821d" type="module"></script>
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

async function fetchProductCategories(env, productId) {
  try {
    const relations = await supabaseGet(env, `product_categories?select=category_id&product_id=eq.${encodeURIComponent(productId)}`);
    const categoryIds = relations.map((relation) => relation.category_id).filter(Boolean);
    if (!categoryIds.length) return [];
    return supabaseGet(
      env,
      `categories?select=id,name,slug,description&is_active=eq.true&id=in.${encodeURIComponent(inFilter(categoryIds))}&order=sort_order.asc,name.asc`,
    );
  } catch {
    return [];
  }
}

async function fetchRelatedProducts(env, product, category) {
  if (!category) return { products: [], imagesByProduct: {} };
  try {
    const relations = await supabaseGet(env, `product_categories?select=product_id&category_id=eq.${encodeURIComponent(category.id)}`);
    const relatedIds = relations.map((relation) => relation.product_id).filter((id) => id && id !== product.id);
    if (!relatedIds.length) return { products: [], imagesByProduct: {} };
    const relatedProducts = await supabaseGet(
      env,
      `products?select=id,name,slug,product_type,pricing_mode,base_price,short_description&is_active=eq.true&is_published=eq.true&archived_at=is.null&id=in.${encodeURIComponent(inFilter(relatedIds))}&order=created_at.desc&limit=3`,
    );
    const imagesByProduct = {};
    if (relatedProducts.length) {
      const imageRows = await supabaseGet(
        env,
        `product_images?select=product_id,storage_path,alt_text,sort_order&product_id=in.${encodeURIComponent(inFilter(relatedProducts.map((item) => item.id)))}&order=sort_order.asc`,
      );
      for (const image of imageRows) {
        if (imagesByProduct[image.product_id]) continue;
        imagesByProduct[image.product_id] = {
          ...image,
          publicUrl: `${env.PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${image.storage_path}`,
        };
      }
    }
    return { products: relatedProducts, imagesByProduct };
  } catch {
    return { products: [], imagesByProduct: {} };
  }
}

export async function onRequestGet({ env, params }) {
  const slug = params.slug;
  if (!env.PUBLIC_SUPABASE_URL || !env.PUBLIC_SUPABASE_ANON_KEY || !slug) {
    return new Response('Not found', { status: 404 });
  }

  let products;
  try {
    products = await supabaseGet(
      env,
      `products?select=id,name,slug,product_type,pricing_mode,base_price,requires_artwork,minimum_quantity,maximum_quantity,short_description,description,material,dimensions,colour_information,finish,weight,lead_time_text,customisation_information,care_instructions,whats_included,made_to_order_information,seo_title,seo_description&slug=eq.${encodeURIComponent(slug)}&is_active=eq.true&is_published=eq.true&archived_at=is.null&limit=1`,
    );
  } catch {
    products = await supabaseGet(
      env,
      `products?select=id,name,slug,product_type,pricing_mode,base_price,requires_artwork,minimum_quantity,maximum_quantity&slug=eq.${encodeURIComponent(slug)}&is_active=eq.true&is_published=eq.true&archived_at=is.null&limit=1`,
    );
  }

  const product = products[0];
  if (!product) {
    const body = `<section class="product-detail product-missing"><p class="section-kicker">Shop</p><h1>Product not found</h1><p>This product is not currently available. Browse the catalogue or request a custom quote.</p><a class="button primary" href="/shop/">Back to Shop</a></section>`;
    return new Response(pageShell({ title: 'Product Not Found | Vert Printing', description: 'This Vert Printing product is not currently available.', canonical: `https://www.vertprinting.co.za/product/${escapeHtml(slug)}`, body }), { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } });
  }

  const images = await supabaseGet(env, `product_images?select=storage_path,alt_text,sort_order&product_id=eq.${product.id}&order=sort_order.asc&limit=1`);
  let specifications = [];
  try {
    specifications = await supabaseGet(env, `product_specifications?select=label,value,sort_order&product_id=eq.${product.id}&order=sort_order.asc`);
  } catch {
    specifications = [];
  }
  const image = images[0];
  const categories = await fetchProductCategories(env, product.id);
  const primaryCategory = categories[0];
  const related = await fetchRelatedProducts(env, product, primaryCategory);
  const imageUrl = image ? `${env.PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${image.storage_path}` : '';
  const quoteHref = `/?product=${encodeURIComponent(product.name)}#quote`;
  const price = productPrice(product);
  const cta = productCta(product);
  const summaryText = product.short_description || productSupportText(product);
  const description = product.seo_description || product.short_description || `${product.name} from Vert Printing in Kloof. ${productSupportText(product)}`;
  const specs = detailRows(product, specifications);
  const specsMarkup = renderDefinitionList(specs);
  const infoSectionsMarkup = renderProductInfoSections(product);
  const productJson = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description,
    image: imageUrl || undefined,
    url: `${SITE_URL}/product/${product.slug}`,
    category: primaryCategory?.name || undefined,
  };
  if (product.base_price !== null && product.pricing_mode !== 'quote_only') {
    productJson.offers = {
      '@type': 'Offer',
      priceCurrency: 'ZAR',
      price: Number(product.base_price).toFixed(2),
      availability: 'https://schema.org/InStock',
    };
  }
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
      ...(primaryCategory ? [{
        '@type': 'ListItem',
        position: 3,
        name: primaryCategory.name,
        item: `${SITE_URL}/shop/category/${primaryCategory.slug}`,
      }] : []),
      {
        '@type': 'ListItem',
        position: primaryCategory ? 4 : 3,
        name: product.name,
        item: `${SITE_URL}/product/${product.slug}`,
      },
    ],
  };
  const structuredData = `<script type="application/ld+json">${JSON.stringify(productJson)}</script><script type="application/ld+json">${JSON.stringify(breadcrumbJson)}</script>`;

  const body = `<section class="product-detail">
    <nav class="product-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/shop/">Shop</a>${primaryCategory ? `<span>/</span><a href="/shop/category/${encodeURIComponent(primaryCategory.slug)}">${escapeHtml(primaryCategory.name)}</a>` : ''}<span>/</span><span>${escapeHtml(product.name)}</span></nav>
    <div class="product-detail-grid">
      <div class="product-media-frame">${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(image?.alt_text || product.name)}" />` : '<span>No image available</span>'}</div>
      <div class="product-summary">
        <p class="section-kicker">Vert Product</p>
        <h1>${escapeHtml(product.name)}</h1>
        <p>${escapeHtml(summaryText)}</p>
        <strong>${escapeHtml(price)}</strong>
        ${specs.slice(0, 4).length ? `<div class="product-summary-specs">${renderDefinitionList(specs.slice(0, 4))}</div>` : ''}
        ${product.requires_artwork ? '<div class="product-info-note"><strong>Artwork</strong><span>For best print quality, vector artwork is preferred. If you are unsure, send what you have and we will check it before production.</span></div>' : ''}
        ${renderQuantityControl(product)}
        ${renderProductCta(product, quoteHref, cta)}
      </div>
    </div>
    ${infoSectionsMarkup || specsMarkup ? `<div class="product-detail-info">${infoSectionsMarkup}${specsMarkup ? `<section class="product-spec-panel"><h2>Specifications</h2>${specsMarkup}</section>` : ''}</div>` : ''}
    ${renderRelatedProducts(related.products, related.imagesByProduct, primaryCategory)}
  </section>`;

  return new Response(pageShell({ title: product.seo_title || `${product.name} | Vert Printing`, description, canonical: `${SITE_URL}/product/${product.slug}`, body, structuredData }), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=60',
    },
  });
}
