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

async function fetchProducts(env) {
  if (!env.PUBLIC_SUPABASE_URL || !env.PUBLIC_SUPABASE_ANON_KEY) return [];

  const endpoint = `${env.PUBLIC_SUPABASE_URL}/rest/v1/products?select=slug,updated_at&is_active=eq.true&is_published=eq.true&archived_at=is.null&order=updated_at.desc`;
  const response = await fetch(endpoint, {
    headers: {
      apikey: env.PUBLIC_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.PUBLIC_SUPABASE_ANON_KEY}`,
    },
  });

  if (!response.ok) return [];
  return response.json();
}

export async function onRequestGet({ env }) {
  const urls = [
    { loc: `${SITE_URL}/` },
    { loc: `${SITE_URL}/shop/` },
  ];

  const products = await fetchProducts(env);
  for (const product of products) {
    if (!product.slug) continue;
    urls.push({
      loc: `${SITE_URL}/product/${encodeURIComponent(product.slug)}`,
      lastmod: product.updated_at ? new Date(product.updated_at).toISOString().slice(0, 10) : '',
    });
  }

  return sitemapResponse(urls);
}
