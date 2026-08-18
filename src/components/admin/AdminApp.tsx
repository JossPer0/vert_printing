import { useEffect, useMemo, useState } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type Category = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
};

type ProductImage = {
  id: string;
  product_id: string;
  storage_path: string;
  alt_text: string | null;
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

type Notice = { type: 'info' | 'success' | 'error'; text: string } | null;

type View = 'dashboard' | 'products' | 'new-product' | 'categories';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const formatMoney = (value: number | null) => {
  if (value === null || Number.isNaN(value)) return 'Quote';
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(value);
};

const friendlyError = (message?: string) => {
  if (!message) return "We couldn't complete that action. Please try again.";
  const lower = message.toLowerCase();
  if (lower.includes('jwt') || lower.includes('token')) return 'Your session has expired. Please sign in again.';
  if (lower.includes('permission') || lower.includes('row-level security') || lower.includes('policy')) return "You don't have permission to make that change.";
  if (lower.includes('network') || lower.includes('fetch')) return 'Connection problem. Please check your internet and try again.';
  return message;
};

function Field({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return <label className="admin-field"><span>{label}</span>{children}{helper && <small>{helper}</small>}</label>;
}

function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'success' | 'neutral' | 'warning' }) {
  return <span className={`admin-badge ${tone}`}>{children}</span>;
}

function PageHeader({ title, eyebrow, actions }: { title: string; eyebrow: string; actions?: React.ReactNode }) {
  return <div className="admin-page-head"><div><p>{eyebrow}</p><h1>{title}</h1></div>{actions && <div className="admin-page-actions">{actions}</div>}</div>;
}

function EmptyState({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return <div className="admin-empty"><h3>{title}</h3><p>{text}</p>{action}</div>;
}

export default function AdminApp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sessionReady, setSessionReady] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productImages, setProductImages] = useState<Record<string, ProductImage>>({});
  const [categoryName, setCategoryName] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [productName, setProductName] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [productType, setProductType] = useState('standard');
  const [pricingMode, setPricingMode] = useState('fixed');
  const [requiresArtwork, setRequiresArtwork] = useState(false);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [busy, setBusy] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);

  const view: View = (() => {
    if (typeof window === 'undefined') return 'dashboard';
    const path = window.location.pathname.replace(/\/$/, '');
    if (path === '/admin/products/new') return 'new-product';
    if (path === '/admin/products') return 'products';
    if (path === '/admin/categories') return 'categories';
    return 'dashboard';
  })();

  const sortedCategories = useMemo(() => [...categories].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)), [categories]);
  const publishedCount = products.filter((product) => product.is_published).length;
  const draftCount = products.length - publishedCount;

  async function handleAppError(message?: string) {
    const friendly = friendlyError(message);
    setNotice({ type: 'error', text: friendly });
    if (friendly === 'Your session has expired. Please sign in again.') {
      await supabase?.auth.signOut();
      setIsSignedIn(false);
      setProducts([]);
      setProductImages({});
      setCategories([]);
    }
  }

  async function loadData(client = supabase) {
    if (!client) return;
    setBusy('loading');
    const [categoryResult, productResult, imageResult] = await Promise.all([
      client.from('categories').select('id,name,slug,is_active,sort_order').order('sort_order').order('name'),
      client.from('products').select('id,name,slug,product_type,pricing_mode,base_price,is_published,is_active,requires_artwork,minimum_quantity').order('created_at', { ascending: false }),
      client.from('product_images').select('id,product_id,storage_path,alt_text,sort_order').order('sort_order'),
    ]);

    if (categoryResult.error) await handleAppError(categoryResult.error.message);
    else setCategories(categoryResult.data || []);

    if (productResult.error) await handleAppError(productResult.error.message);
    else setProducts(productResult.data || []);

    if (imageResult.error) await handleAppError(imageResult.error.message);
    else {
      const firstImages: Record<string, ProductImage> = {};
      for (const image of imageResult.data || []) {
        if (!firstImages[image.product_id]) firstImages[image.product_id] = image;
      }
      setProductImages(firstImages);
    }
    setBusy('');
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
        if (data.session) await loadData(client);

        const authListener = client.auth.onAuthStateChange((_event, session) => {
          setIsSignedIn(Boolean(session));
          if (session) loadData(client);
        });
        listener = authListener.data;
      } catch (error) {
        setNotice({ type: 'error', text: error instanceof Error ? friendlyError(error.message) : 'Unable to load shop configuration.' });
        setSessionReady(true);
      }
    }

    configureSupabase();
    return () => listener?.subscription.unsubscribe();
  }, []);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy('signin');
    setNotice({ type: 'info', text: 'Signing in...' });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) await handleAppError(error.message);
    else setNotice({ type: 'success', text: 'Signed in.' });
    setBusy('');
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setProducts([]);
    setProductImages({});
    setCategories([]);
    setNotice({ type: 'success', text: 'Signed out.' });
  }

  async function createCategory(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase || !categoryName.trim()) return;
    setBusy('category');
    const slug = categorySlug.trim() || slugify(categoryName);
    const { error } = await supabase.from('categories').insert({ name: categoryName.trim(), slug, is_active: true });
    if (error) await handleAppError(error.message);
    else setNotice({ type: 'success', text: 'Category created.' });
    if (!error) {
      setCategoryName('');
      setCategorySlug('');
      await loadData();
    }
    setBusy('');
  }

  async function createProduct(event: React.FormEvent, publish = false) {
    event.preventDefault();
    if (!supabase || !productName.trim()) return;
    setBusy(publish ? 'publish-new' : 'product');
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
      is_published: publish,
      minimum_quantity: 1,
    });
    if (error) await handleAppError(error.message);
    else setNotice({ type: 'success', text: publish ? 'Product published.' : 'Product draft saved.' });
    if (!error) {
      setProductName('');
      setBasePrice('');
      setRequiresArtwork(false);
      await loadData();
      if (typeof window !== 'undefined') window.history.pushState(null, '', '/admin/products');
    }
    setBusy('');
  }

  async function togglePublish(product: Product) {
    if (!supabase) return;
    setBusy(product.id);
    const { error } = await supabase.from('products').update({ is_published: !product.is_published }).eq('id', product.id);
    if (error) await handleAppError(error.message);
    else setNotice({ type: 'success', text: product.is_published ? 'Product moved to draft.' : 'Product published.' });
    if (!error) await loadData();
    setBusy('');
  }

  async function uploadProductImage(product: Product, fileList: FileList | null) {
    if (!supabase || !fileList?.length) return;
    const file = fileList[0];
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
    const path = `products/${product.id}/${Date.now()}-${safeName}`;
    setBusy(`image-${product.id}`);
    const upload = await supabase.storage.from('product-images').upload(path, file, { cacheControl: '3600', upsert: false });
    if (upload.error) {
      await handleAppError(upload.error.message);
      setBusy('');
      return;
    }
    const { error } = await supabase.from('product_images').insert({ product_id: product.id, storage_path: path, alt_text: product.name, sort_order: 0 });
    if (error) await handleAppError(error.message);
    else setNotice({ type: 'success', text: 'Product image uploaded.' });
    setBusy('');
  }

  function navigate(path: string) {
    window.location.href = path;
  }

  if (!sessionReady) return <div className="admin-loading"><span></span><p>Loading shop manager...</p></div>;

  if (!supabase) {
    return <div className="admin-auth-wrap"><div className="admin-panel admin-login"><h2>Shop Manager setup needed</h2><p className="admin-muted">Supabase is not connected yet. Check the Cloudflare Pages environment variables.</p>{notice && <p className={`admin-notice ${notice.type}`}>{notice.text}</p>}</div></div>;
  }

  if (!isSignedIn) {
    return <div className="admin-auth-wrap"><form className="admin-panel admin-login" onSubmit={signIn}><div className="admin-login-brand"><img src="/assets/vert_logo_header.png" alt="Vert Printing" /><div><h1>Shop Manager</h1><p>Sign in to manage the Vert catalogue.</p></div></div><Field label="Email"><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required /></Field><Field label="Password"><input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required /></Field><button className="admin-button primary" type="submit" disabled={busy === 'signin'}>{busy === 'signin' ? 'Signing in...' : 'Log In'}</button>{notice && <p className={`admin-notice ${notice.type}`}>{notice.text}</p>}</form></div>;
  }

  const nav = [
    { label: 'Dashboard', href: '/admin', key: 'dashboard' },
    { label: 'Products', href: '/admin/products', key: 'products' },
    { label: 'Categories', href: '/admin/categories', key: 'categories' },
  ];

  return <div className="admin-app-shell">
    <aside className={`admin-sidebar ${drawerOpen ? 'open' : ''}`}>
      <a className="admin-side-brand" href="/admin"><img src="/assets/vert_logo_header.png" alt="Vert Printing" /><span>Shop Manager</span></a>
      <nav>{nav.map((item) => <a key={item.href} className={view === item.key || (view === 'new-product' && item.key === 'products') ? 'active' : ''} href={item.href}><span>{item.label[0]}</span>{item.label}</a>)}</nav>
      <div className="admin-side-footer"><a href="/" target="_blank">View Site</a><button type="button" onClick={signOut}>Log out</button></div>
    </aside>
    <div className="admin-workspace">
      <header className="admin-topbar"><button className="admin-menu" type="button" onClick={() => setDrawerOpen(!drawerOpen)}>Menu</button><div><strong>Vert Printing</strong><small>Catalogue administration</small></div><a className="admin-button secondary" href="/">View Site</a></header>
      <main className="admin-content">
        {notice && <p className={`admin-notice ${notice.type}`}>{notice.text}</p>}
        {view === 'dashboard' && <Dashboard products={products} categories={categories} publishedCount={publishedCount} draftCount={draftCount} busy={busy} navigate={navigate} />}
        {view === 'products' && <Products products={products} productImages={productImages} supabase={supabase} busy={busy} navigate={navigate} togglePublish={togglePublish} uploadProductImage={uploadProductImage} setPreviewImage={setPreviewImage} />}
        {view === 'new-product' && <NewProduct busy={busy} createProduct={createProduct} productName={productName} setProductName={setProductName} productType={productType} setProductType={setProductType} pricingMode={pricingMode} setPricingMode={setPricingMode} basePrice={basePrice} setBasePrice={setBasePrice} requiresArtwork={requiresArtwork} setRequiresArtwork={setRequiresArtwork} />}
        {view === 'categories' && <Categories categories={sortedCategories} busy={busy} createCategory={createCategory} categoryName={categoryName} setCategoryName={setCategoryName} categorySlug={categorySlug} setCategorySlug={setCategorySlug} />}
      </main>
    </div>
    {previewImage && <div className="admin-image-modal" role="dialog" aria-modal="true" aria-label="Product image preview" onClick={() => setPreviewImage(null)}><div><button type="button" aria-label="Close image preview" onClick={() => setPreviewImage(null)}>Close</button><img src={previewImage.src} alt={previewImage.alt} /></div></div>}
  </div>;
}

function Dashboard({ products, categories, publishedCount, draftCount, busy, navigate }: { products: Product[]; categories: Category[]; publishedCount: number; draftCount: number; busy: string; navigate: (path: string) => void }) {
  return <><PageHeader title="Shop Manager" eyebrow="Manage your Vert Printing shop." actions={<button className="admin-button primary" onClick={() => navigate('/admin/products/new')}>+ Add Product</button>} /><section className="admin-metrics"><article><span>Total Products</span><strong>{products.length}</strong></article><article><span>Published Products</span><strong>{publishedCount}</strong></article><article><span>Draft Products</span><strong>{draftCount}</strong></article><article><span>Categories</span><strong>{categories.length}</strong></article></section><section className="admin-card"><h2>Catalogue overview</h2>{busy === 'loading' ? <p className="admin-muted">Loading catalogue...</p> : <p className="admin-muted">Use Products and Categories to manage what will appear in the future Vert online catalogue.</p>}</section></>;
}

function Products({ products, productImages, supabase, busy, navigate, togglePublish, uploadProductImage, setPreviewImage }: { products: Product[]; productImages: Record<string, ProductImage>; supabase: SupabaseClient | null; busy: string; navigate: (path: string) => void; togglePublish: (product: Product) => void; uploadProductImage: (product: Product, files: FileList | null) => void; setPreviewImage: (image: { src: string; alt: string } | null) => void }) {
  const imageUrl = (product: Product) => {
    const image = productImages[product.id];
    if (!image || !supabase) return '';
    return supabase.storage.from('product-images').getPublicUrl(image.storage_path).data.publicUrl;
  };

  return <><PageHeader title="Products" eyebrow="Manage the products shown in your online shop." actions={<button className="admin-button primary" onClick={() => navigate('/admin/products/new')}>+ Add Product</button>} />{products.length ? <section className="admin-card admin-table-card"><div className="admin-table-head"><span>Image</span><span>Product</span><span>Price</span><span>Type</span><span>Status</span><span>Actions</span></div>{products.map((product) => {
    const url = imageUrl(product);
    return <div className="admin-product-row" key={product.id}><button className="admin-thumb" type="button" disabled={!url} onClick={() => url && setPreviewImage({ src: url, alt: productImages[product.id]?.alt_text || product.name })}>{url ? <img src={url} alt={productImages[product.id]?.alt_text || product.name} /> : <span>No image</span>}</button><div><strong>{product.name}</strong><small>{product.slug}</small></div><span>{formatMoney(product.base_price)}</span><span>{product.product_type.replace('_', ' ')}</span><Badge tone={product.is_published ? 'success' : 'neutral'}>{product.is_published ? 'Published' : 'Draft'}</Badge><div className="admin-row-actions"><button className="admin-button secondary" type="button" disabled={busy === product.id} onClick={() => togglePublish(product)}>{product.is_published ? 'Unpublish' : 'Publish'}</button><label className="admin-upload">{url ? 'Update Image' : 'Add Image'}<input type="file" accept="image/*" onChange={(event) => uploadProductImage(product, event.currentTarget.files)} /></label></div></div>;
  })}</section> : <EmptyState title="You haven't added any products yet." text="Add your first product to start building the Vert online catalogue." action={<button className="admin-button primary" onClick={() => navigate('/admin/products/new')}>+ Add Product</button>} />}</>;
}

function NewProduct(props: { busy: string; createProduct: (event: React.FormEvent, publish?: boolean) => void; productName: string; setProductName: (value: string) => void; productType: string; setProductType: (value: string) => void; pricingMode: string; setPricingMode: (value: string) => void; basePrice: string; setBasePrice: (value: string) => void; requiresArtwork: boolean; setRequiresArtwork: (value: boolean) => void }) {
  return <form onSubmit={(event) => props.createProduct(event, false)}><PageHeader title="Add Product" eyebrow="Create a new product for the Vert shop." actions={<><a className="admin-button secondary" href="/admin/products">Cancel</a><button className="admin-button secondary" type="submit" disabled={props.busy === 'product'}>Save Draft</button><button className="admin-button primary" type="button" disabled={props.busy === 'publish-new'} onClick={(event) => props.createProduct(event as unknown as React.FormEvent, true)}>Publish</button></>} /><section className="admin-form-grid"><div className="admin-card"><h2>Basic Information</h2><Field label="Product name"><input value={props.productName} onChange={(event) => props.setProductName(event.target.value)} required /></Field><Field label="Product type" helper="Use Quote Only when the product cannot be priced upfront."><select value={props.productType} onChange={(event) => props.setProductType(event.target.value)}><option value="standard">Standard</option><option value="configurable">Configurable</option><option value="quote_only">Quote Only</option></select></Field></div><div className="admin-card"><h2>Pricing</h2><Field label="Pricing mode"><select value={props.pricingMode} onChange={(event) => props.setPricingMode(event.target.value)}><option value="fixed">Fixed Price</option><option value="from_price">From Price</option><option value="quote_only">Quote Only</option></select></Field><Field label="Base price" helper="Displayed in South African Rand."><input value={props.basePrice} onChange={(event) => props.setBasePrice(event.target.value)} type="number" min="0" step="0.01" disabled={props.pricingMode === 'quote_only'} /></Field></div><div className="admin-card"><h2>Artwork</h2><label className="admin-toggle"><input type="checkbox" checked={props.requiresArtwork} onChange={(event) => props.setRequiresArtwork(event.target.checked)} /><span>Requires artwork</span></label><p className="admin-muted">Customers will be prompted to provide artwork details for this product.</p></div><div className="admin-card"><h2>Images</h2><div className="admin-dropzone"><strong>Add images after saving</strong><p>Save this product first, then upload images from the Products list.</p></div></div></section></form>;
}

function Categories({ categories, busy, createCategory, categoryName, setCategoryName, categorySlug, setCategorySlug }: { categories: Category[]; busy: string; createCategory: (event: React.FormEvent) => void; categoryName: string; setCategoryName: (value: string) => void; categorySlug: string; setCategorySlug: (value: string) => void }) {
  return <><PageHeader title="Categories" eyebrow="Organise products in your shop." /><section className="admin-two-col"><div className="admin-card"><h2>Add Category</h2><form onSubmit={createCategory}><Field label="Name"><input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} required /></Field><Field label="Slug" helper="Leave blank to generate from the name."><input value={categorySlug} onChange={(event) => setCategorySlug(event.target.value)} /></Field><button className="admin-button primary" type="submit" disabled={busy === 'category'}>{busy === 'category' ? 'Saving...' : '+ Add Category'}</button></form></div><div className="admin-card"><h2>Category List</h2>{categories.length ? <div className="admin-category-list">{categories.map((category) => <div key={category.id}><div><strong>{category.name}</strong><small>{category.slug}</small></div><Badge tone={category.is_active ? 'success' : 'neutral'}>{category.is_active ? 'Active' : 'Inactive'}</Badge></div>)}</div> : <EmptyState title="No categories yet." text="Create categories to organise future shop products." />}</div></section></>;
}
