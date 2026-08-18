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

type Category = {
  id: string;
  name: string;
  slug: string;
};

type ProductCategory = {
  product_id: string;
  category_id: string;
};

function formatMoney(value: number) {
  return `R${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function productPrice(product: Product) {
  if (product.pricing_mode === 'quote_only' || product.base_price === null) return 'Custom pricing';
  const price = formatMoney(product.base_price);
  return product.pricing_mode === 'from_price' || product.product_type === 'configurable' ? `From ${price}` : price;
}

function productCta(product: Product) {
  if (product.pricing_mode === 'quote_only' || product.product_type === 'quote_only') return 'Request a Quote';
  if (product.product_type === 'configurable' || product.pricing_mode === 'from_price') return 'Choose Options';
  return 'View Product';
}

function productHref(product: Product) {
  if (product.pricing_mode === 'quote_only' || product.product_type === 'quote_only') return `/?product=${encodeURIComponent(product.name)}#quote`;
  return `/product/${product.slug}`;
}

function productSupportText(product: Product) {
  if (product.pricing_mode === 'quote_only' || product.product_type === 'quote_only') return 'Made to your requirements';
  if (product.product_type === 'configurable') return 'Choose options before ordering';
  if (product.requires_artwork) return 'Artwork can be supplied after enquiry';
  return 'Available for online enquiry';
}

function ProductCard({ product, image, imageUrl, categoryName }: { product: Product; image?: ProductImage; imageUrl?: string; categoryName?: string }) {
  return <article className="shop-card">
    <a className="shop-card-image" href={productHref(product)} aria-label={`${productCta(product)} for ${product.name}`}>
      {imageUrl ? <img src={imageUrl} alt={image?.alt_text || product.name} loading="lazy" /> : <span>No image available</span>}
    </a>
    <div className="shop-card-body">
      <div>
        {categoryName && <p>{categoryName}</p>}
        <h2>{product.name}</h2>
        <span className="shop-support">{productSupportText(product)}</span>
      </div>
      <strong>{productPrice(product)}</strong>
      {product.requires_artwork && <span className="shop-note">Artwork required</span>}
      <a className="button primary" href={productHref(product)}>{productCta(product)}</a>
    </div>
  </article>;
}

export default function ShopCatalogue() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [images, setImages] = useState<Record<string, ProductImage>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
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

        const [productResult, categoryResult, productCategoryResult] = await Promise.all([
          client
            .from('products')
            .select('id,name,slug,product_type,pricing_mode,base_price,requires_artwork')
            .eq('is_active', true)
            .eq('is_published', true)
            .is('archived_at', null)
            .order('created_at', { ascending: false }),
          client.from('categories').select('id,name,slug').eq('is_active', true).order('sort_order').order('name'),
          client.from('product_categories').select('product_id,category_id'),
        ]);

        if (productResult.error || categoryResult.error || productCategoryResult.error) throw new Error('catalogue');
        const visibleProducts = productResult.data || [];
        setProducts(visibleProducts);
        setCategories(categoryResult.data || []);
        setProductCategories(productCategoryResult.data || []);

        if (visibleProducts.length) {
          const imageResult = await client
            .from('product_images')
            .select('product_id,storage_path,alt_text,sort_order')
            .in('product_id', visibleProducts.map((product) => product.id))
            .order('sort_order');

          if (imageResult.error) throw new Error('images');
          const firstImages: Record<string, ProductImage> = {};
          for (const image of imageResult.data || []) {
            if (!firstImages[image.product_id]) firstImages[image.product_id] = image;
          }
          setImages(firstImages);
        }
      } catch {
        setError("We couldn't load the shop right now. Please try again shortly or request a quote.");
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

  const categoryById = useMemo(() => Object.fromEntries(categories.map((category) => [category.id, category])), [categories]);
  const visibleProductIds = useMemo(() => new Set(products.map((product) => product.id)), [products]);

  const categoryByProduct = useMemo(() => {
    const map: Record<string, Category> = {};
    for (const relation of productCategories) {
      if (!visibleProductIds.has(relation.product_id)) continue;
      if (!map[relation.product_id] && categoryById[relation.category_id]) map[relation.product_id] = categoryById[relation.category_id];
    }
    return map;
  }, [categoryById, productCategories, visibleProductIds]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const relation of productCategories) {
      if (!visibleProductIds.has(relation.product_id)) continue;
      counts[relation.category_id] = (counts[relation.category_id] || 0) + 1;
    }
    return counts;
  }, [productCategories, visibleProductIds]);

  const visibleCategories = useMemo(() => categories.filter((category) => (categoryCounts[category.id] || 0) > 0), [categories, categoryCounts]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    let result = [...products];
    if (activeCategory !== 'all') {
      const productIds = new Set(productCategories.filter((relation) => relation.category_id === activeCategory).map((relation) => relation.product_id));
      result = result.filter((product) => productIds.has(product.id));
    }
    if (query) {
      result = result.filter((product) => {
        const categoryName = categoryByProduct[product.id]?.name || '';
        return `${product.name} ${product.slug} ${categoryName}`.toLowerCase().includes(query);
      });
    }
    return result.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'price-asc') return (a.base_price ?? Number.MAX_SAFE_INTEGER) - (b.base_price ?? Number.MAX_SAFE_INTEGER);
      if (sort === 'price-desc') return (b.base_price ?? 0) - (a.base_price ?? 0);
      return 0;
    });
  }, [activeCategory, categoryByProduct, productCategories, products, search, sort]);

  const hasActiveFilters = activeCategory !== 'all' || search.trim().length > 0;

  if (loading) return <div className="shop-container"><div className="shop-skeleton-grid"><span></span><span></span><span></span></div></div>;
  if (error) return <div className="shop-container"><div className="shop-empty"><h2>Shop unavailable</h2><p>{error}</p><a className="button primary" href="/#quote">Request a Quote</a></div></div>;
  if (!products.length) return <div className="shop-container"><div className="shop-empty"><h2>Our online catalogue is being updated.</h2><p>Need something now? Tell us what you need and we'll put together a quote.</p><a className="button primary" href="/#quote">Request a Quote</a></div></div>;

  return <div className="shop-container">
    <div className="shop-controls" aria-label="Shop filters">
      {visibleCategories.length > 0 && <div className="shop-categories" aria-label="Product categories">
        <button className={activeCategory === 'all' ? 'active' : ''} type="button" aria-pressed={activeCategory === 'all'} onClick={() => setActiveCategory('all')}>All</button>
        {visibleCategories.map((category) => <button className={activeCategory === category.id ? 'active' : ''} key={category.id} type="button" aria-pressed={activeCategory === category.id} onClick={() => setActiveCategory(category.id)}>{category.name}</button>)}
      </div>}
      <div className="shop-toolbar">
        <label><span>Search products</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products..." /></label>
        <label><span>Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products"><option value="newest">Newest</option><option value="name">Name A-Z</option><option value="price-asc">Price Low to High</option><option value="price-desc">Price High to Low</option></select></label>
        {hasActiveFilters && <button className="shop-clear-filters" type="button" onClick={() => { setSearch(''); setActiveCategory('all'); }}>Clear filters</button>}
      </div>
    </div>

    {filteredProducts.length ? <div className="shop-grid">{filteredProducts.map((product) => <ProductCard key={product.id} product={product} image={images[product.id]} imageUrl={imageUrls[product.id]} categoryName={categoryByProduct[product.id]?.name} />)}</div> : <div className="shop-empty"><h2>No products matched your search.</h2><p>Try another search or browse all products.</p><button className="button primary" type="button" onClick={() => { setSearch(''); setActiveCategory('all'); }}>View All Products</button></div>}
  </div>;
}
