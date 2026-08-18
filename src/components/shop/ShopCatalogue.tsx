import { useEffect, useMemo, useState } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type Product = {
  id: string;
  name: string;
  slug: string;
  product_type: string;
  pricing_mode: string;
  base_price: number | null;
  requires_artwork: boolean;
};

type ProductImage = {
  product_id: string;
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
};

const formatMoney = (value: number | null, mode: string) => {
  if (mode === 'quote_only' || value === null) return 'Request quote';
  const amount = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(value);
  return mode === 'from_price' ? `From ${amount}` : amount;
};

export default function ShopCatalogue() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [images, setImages] = useState<Record<string, ProductImage>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCatalogue() {
      try {
        const configResponse = await fetch('/api/config', { cache: 'no-store' });
        if (!configResponse.ok) throw new Error('config');
        const config = await configResponse.json();
        if (!config.supabaseUrl || !config.supabaseAnonKey) throw new Error('config');

        const client = createClient(config.supabaseUrl, config.supabaseAnonKey);
        setSupabase(client);

        const productResult = await client
          .from('products')
          .select('id,name,slug,product_type,pricing_mode,base_price,requires_artwork')
          .eq('is_active', true)
          .eq('is_published', true)
          .is('archived_at', null)
          .order('created_at', { ascending: false });

        if (productResult.error) throw productResult.error;
        const visibleProducts = productResult.data || [];
        setProducts(visibleProducts);

        if (visibleProducts.length) {
          const imageResult = await client
            .from('product_images')
            .select('product_id,storage_path,alt_text,sort_order')
            .in('product_id', visibleProducts.map((product) => product.id))
            .order('sort_order');

          if (imageResult.error) throw imageResult.error;
          const firstImages: Record<string, ProductImage> = {};
          for (const image of imageResult.data || []) {
            if (!firstImages[image.product_id]) firstImages[image.product_id] = image;
          }
          setImages(firstImages);
        }
      } catch {
        setError('The catalogue could not be loaded right now. Please request a quote and we will assist you directly.');
      } finally {
        setLoading(false);
      }
    }

    loadCatalogue();
  }, []);

  const imageUrls = useMemo(() => {
    if (!supabase) return {};
    return Object.fromEntries(Object.entries(images).map(([productId, image]) => [
      productId,
      supabase.storage.from('product-images').getPublicUrl(image.storage_path).data.publicUrl,
    ]));
  }, [images, supabase]);

  if (loading) return <div className="shop-state"><span></span><p>Loading catalogue...</p></div>;
  if (error) return <div className="shop-empty"><h2>Catalogue unavailable</h2><p>{error}</p><a className="button primary" href="/#quote">Request a Quote</a></div>;
  if (!products.length) return <div className="shop-empty"><h2>Products coming soon</h2><p>We are preparing the Vert catalogue. In the meantime, send us what you need and we will quote directly.</p><a className="button primary" href="/#quote">Request a Quote</a></div>;

  return <div className="shop-grid">{products.map((product) => {
    const imageUrl = imageUrls[product.id];
    const quoteHref = `/#quote?product=${encodeURIComponent(product.name)}`;
    return <article className="shop-card" key={product.id}>
      <a className="shop-card-image" href={quoteHref} aria-label={`Request a quote for ${product.name}`}>
        {imageUrl ? <img src={imageUrl} alt={images[product.id]?.alt_text || product.name} loading="lazy" /> : <span>No image yet</span>}
      </a>
      <div className="shop-card-body">
        <div>
          <p>{product.product_type.replace('_', ' ')}</p>
          <h2>{product.name}</h2>
        </div>
        <strong>{formatMoney(product.base_price, product.pricing_mode)}</strong>
        {product.requires_artwork && <span className="shop-note">Artwork required</span>}
        <a className="button primary" href={quoteHref}>Request Quote</a>
      </div>
    </article>;
  })}</div>;
}
