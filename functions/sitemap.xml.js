const SITE_URL = 'https://www.vertprinting.co.za';

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function sitemapResponse(urls) {
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>${url.lastmod ? `
    <lastmod>${escapeXml(url.lastmod)}</lastmod>` : ''}
  </url>`)
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
}

function supabaseHeaders(env) {
  return {
    apikey: env.PUBLIC_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${env.PUBLIC_SUPABASE_ANON_KEY}`,
  };
}

async function fetchProducts(env) {
  if (!env.PUBLIC_SUPABASE_URL || !env.PUBLIC_SUPABASE_ANON_KEY) return [];

  const endpoint = `${env.PUBLIC_SUPABASE_URL}/rest/v1/products?select=id,slug,updated_at&is_active=eq.true&is_published=eq.true&archived_at=is.null&order=updated_at.desc`;
  const response = await fetch(endpoint, { headers: supabaseHeaders(env) });

  if (!response.ok) return [];
  return response.json();
}

async function fetchCategoryUrls(env, products) {
  if (!env.PUBLIC_SUPABASE_URL || !env.PUBLIC_SUPABASE_ANON_KEY || !products.length) return [];

  const productIds = new Set(products.map((product) => product.id).filter(Boolean));
  if (!productIds.size) return [];

  const headers = supabaseHeaders(env);
  const [categoriesResponse, relationsResponse] = await Promise.all([
    fetch(`${env.PUBLIC_SUPABASE_URL}/rest/v1/categories?select=id,slug,updated_at&is_active=eq.true&order=sort_order.asc,name.asc`, { headers }),
    fetch(`${env.PUBLIC_SUPABASE_URL}/rest/v1/product_categories?select=product_id,category_id`, { headers }),
  ]);

  if (!categoriesResponse.ok || !relationsResponse.ok) return [];

  const [categories, relations] = await Promise.all([
    categoriesResponse.json(),
    relationsResponse.json(),
  ]);

  const visibleCategoryIds = new Set();
  for (const relation of relations) {
    if (productIds.has(relation.product_id)) visibleCategoryIds.add(relation.category_id);
  }

  return categories
    .filter((category) => category.slug && visibleCategoryIds.has(category.id))
    .map((category) => ({
      loc: `${SITE_URL}/shop/category/${encodeURIComponent(category.slug)}`,
      lastmod: category.updated_at ? new Date(category.updated_at).toISOString().slice(0, 10) : '',
    }));
}

export async function onRequestGet({ env }) {
  const urls = [
    { loc: `${SITE_URL}/` },
    { loc: `${SITE_URL}/shop/` },
  ];

  const products = await fetchProducts(env);
  const categoryUrls = await fetchCategoryUrls(env, products);
  urls.push(...categoryUrls);

  for (const product of products) {
    if (!product.slug) continue;
    urls.push({
      loc: `${SITE_URL}/product/${encodeURIComponent(product.slug)}`,
      lastmod: product.updated_at ? new Date(product.updated_at).toISOString().slice(0, 10) : '',
    });
  }

  return sitemapResponse(urls);
}