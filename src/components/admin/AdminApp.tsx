import { useEffect, useMemo, useState } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type Category = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  product_type: string;
  pricing_mode: string;
  base_price: number | null;
  is_published: boolean;
  is_active: boolean;
  requires_artwork: boolean;
  minimum_quantity: number;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="admin-field"><span>{label}</span>{children}</label>;
}

export default function AdminApp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sessionReady, setSessionReady] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [notice, setNotice] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [productName, setProductName] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [productType, setProductType] = useState('standard');
  const [pricingMode, setPricingMode] = useState('fixed');
  const [requiresArtwork, setRequiresArtwork] = useState(false);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  const canUseSupabase = Boolean(supabase);

  const sortedCategories = useMemo(() => [...categories].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)), [categories]);

  async function loadData(client = supabase) {
    if (!client) return;
    const [categoryResult, productResult] = await Promise.all([
      client.from('categories').select('id,name,slug,is_active,sort_order').order('sort_order').order('name'),
      client.from('products').select('id,name,slug,product_type,pricing_mode,base_price,is_published,is_active,requires_artwork,minimum_quantity').order('created_at', { ascending: false }),
    ]);

    if (categoryResult.error) setNotice(categoryResult.error.message);
    else setCategories(categoryResult.data || []);

    if (productResult.error) setNotice(productResult.error.message);
    else setProducts(productResult.data || []);
  }

  useEffect(() => {
    let listener: { subscription: { unsubscribe: () => void } } | null = null;

    async function configureSupabase() {
      try {
        const response = await fetch('/api/config', { cache: 'no-store' });
        if (!response.ok) throw new Error('Unable to load shop configuration.');
        const config = await response.json();
        if (!config.supabaseUrl || !config.supabaseAnonKey) {
          setSessionReady(true);
          return;
        }

        const client = createClient(config.supabaseUrl, config.supabaseAnonKey);
        setSupabase(client);

        const { data } = await client.auth.getSession();
        setIsSignedIn(Boolean(data.session));
        setSessionReady(true);
        if (data.session) {
          await loadData(client);
        }

        const authListener = client.auth.onAuthStateChange((_event, session) => {
          setIsSignedIn(Boolean(session));
          if (session) loadData(client);
        });
        listener = authListener.data;
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'Unable to load shop configuration.');
        setSessionReady(true);
      }
    }

    configureSupabase();

    return () => listener?.subscription.unsubscribe();
  }, []);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setNotice('Signing in...');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setNotice(error ? error.message : 'Signed in.');
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setProducts([]);
    setCategories([]);
    setNotice('Signed out.');
  }

  async function createCategory(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase || !categoryName.trim()) return;
    const slug = slugify(categoryName);
    const { error } = await supabase.from('categories').insert({ name: categoryName.trim(), slug, is_active: true });
    setNotice(error ? error.message : 'Category added.');
    if (!error) {
      setCategoryName('');
      await loadData();
    }
  }

  async function createProduct(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase || !productName.trim()) return;
    const slug = slugify(productName);
    const price = basePrice.trim() ? Number(basePrice) : null;
    const { error } = await supabase.from('products').insert({
      name: productName.trim(),
      slug,
      product_type: productType,
      pricing_mode: pricingMode,
      base_price: pricingMode === 'quote_only' ? null : price,
      requires_artwork: requiresArtwork,
      is_active: true,
      is_published: false,
      minimum_quantity: 1,
    });
    setNotice(error ? error.message : 'Product draft added.');
    if (!error) {
      setProductName('');
      setBasePrice('');
      setRequiresArtwork(false);
      await loadData();
    }
  }

  async function togglePublish(product: Product) {
    if (!supabase) return;
    setNotice(product.is_published ? 'Moving product back to draft...' : 'Publishing product...');
    const { error } = await supabase
      .from('products')
      .update({ is_published: !product.is_published })
      .eq('id', product.id);
    setNotice(error ? error.message : product.is_published ? 'Product moved to draft.' : 'Product published.');
    if (!error) await loadData();
  }

  async function uploadProductImage(product: Product, fileList: FileList | null) {
    if (!supabase || !fileList?.length) return;
    const file = fileList[0];
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
    const path = `products/${product.id}/${Date.now()}-${safeName}`;
    setNotice(`Uploading image for ${product.name}...`);

    const upload = await supabase.storage.from('product-images').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (upload.error) {
      setNotice(upload.error.message);
      return;
    }

    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    const { error } = await supabase.from('product_images').insert({
      product_id: product.id,
      storage_path: path,
      public_url: data.publicUrl,
      alt_text: product.name,
      sort_order: 0,
    });

    setNotice(error ? error.message : 'Product image uploaded.');
  }

  if (!sessionReady) return <p className="admin-muted">Loading shop manager...</p>;

  if (!canUseSupabase) {
    return <div className="admin-panel"><h2>Supabase is not configured</h2><p>Add `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` before using Shop Manager.</p></div>;
  }

  if (!isSignedIn) {
    return (
      <form className="admin-panel admin-login" onSubmit={signIn}>
        <h2>Shop Manager Login</h2>
        <Field label="Email"><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required /></Field>
        <Field label="Password"><input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required /></Field>
        <button className="button primary" type="submit">Log In</button>
        {notice && <p className="admin-notice">{notice}</p>}
      </form>
    );
  }

  return (
    <div className="admin-shell">
      <div className="admin-toolbar">
        <div><h2>Shop Manager</h2><p>Manage categories and product drafts from Supabase.</p></div>
        <button className="button secondary dark" type="button" onClick={signOut}>Log Out</button>
      </div>
      {notice && <p className="admin-notice">{notice}</p>}

      <section className="admin-grid">
        <form className="admin-panel" onSubmit={createCategory}>
          <h3>Add Category</h3>
          <Field label="Category name"><input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} required /></Field>
          <button className="button primary" type="submit">Add Category</button>
        </form>

        <form className="admin-panel" onSubmit={createProduct}>
          <h3>Add Product Draft</h3>
          <Field label="Product name"><input value={productName} onChange={(event) => setProductName(event.target.value)} required /></Field>
          <Field label="Product type"><select value={productType} onChange={(event) => setProductType(event.target.value)}><option value="standard">Standard</option><option value="configurable">Configurable</option><option value="quote_only">Quote only</option></select></Field>
          <Field label="Pricing mode"><select value={pricingMode} onChange={(event) => setPricingMode(event.target.value)}><option value="fixed">Fixed</option><option value="from_price">From price</option><option value="quote_only">Quote only</option></select></Field>
          <Field label="Base price"><input value={basePrice} onChange={(event) => setBasePrice(event.target.value)} type="number" min="0" step="0.01" disabled={pricingMode === 'quote_only'} /></Field>
          <label className="admin-check"><input type="checkbox" checked={requiresArtwork} onChange={(event) => setRequiresArtwork(event.target.checked)} /> Requires artwork</label>
          <button className="button primary" type="submit">Add Product Draft</button>
        </form>
      </section>

      <section className="admin-panel">
        <h3>Categories</h3>
        {sortedCategories.length ? <div className="admin-list">{sortedCategories.map((category) => <div key={category.id}><strong>{category.name}</strong><span>{category.slug}</span></div>)}</div> : <p className="admin-muted">No categories yet. Add your first category.</p>}
      </section>

      <section className="admin-panel">
        <h3>Products</h3>
        {products.length ? (
          <div className="admin-table">
            {products.map((product) => (
              <div className="admin-row" key={product.id}>
                <strong>{product.name}</strong>
                <span>{product.product_type}</span>
                <span>{product.pricing_mode}</span>
                <span>{product.is_published ? 'Published' : 'Draft'}</span>
                <div className="admin-actions">
                  <button className="button secondary dark" type="button" onClick={() => togglePublish(product)}>
                    {product.is_published ? 'Unpublish' : 'Publish'}
                  </button>
                  <label className="admin-upload">
                    Image
                    <input type="file" accept="image/*" onChange={(event) => uploadProductImage(product, event.currentTarget.files)} />
                  </label>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="admin-muted">No products yet. Add your first product draft.</p>}
      </section>
    </div>
  );
}