import { useEffect, useMemo, useState } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import AdminAiAssistant from './AdminAiAssistant';
import ProductModelAnalysis from './ProductModelAnalysis';
import ProductOptionsEditor from './ProductOptionsEditor';
import type { ModelAnalysis } from '../../lib/modelAnalysis';

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
  short_description: string | null;
  description: string | null;
  material: string | null;
  dimensions: string | null;
  colour_information: string | null;
  finish: string | null;
  weight: string | null;
  lead_time_text: string | null;
  customisation_information: string | null;
  care_instructions: string | null;
  whats_included: string | null;
  made_to_order_information: string | null;
  is_published: boolean;
  is_active: boolean;
  requires_artwork: boolean;
  minimum_quantity: number;
  seo_title: string | null;
  seo_description: string | null;
};

type ProductCategory = {
  product_id: string;
  category_id: string;
};

type ProductSpecification = {
  id?: string;
  product_id?: string;
  label: string;
  value: string;
  sort_order: number;
};

type ProductInfoState = {
  short_description: string;
  description: string;
  material: string;
  dimensions: string;
  colour_information: string;
  finish: string;
  weight: string;
  lead_time_text: string;
  customisation_information: string;
  care_instructions: string;
  whats_included: string;
  made_to_order_information: string;
  seo_title: string;
  seo_description: string;
};

const emptyProductInfo = (): ProductInfoState => ({
  short_description: '',
  description: '',
  material: '',
  dimensions: '',
  colour_information: '',
  finish: '',
  weight: '',
  lead_time_text: '',
  customisation_information: '',
  care_instructions: '',
  whats_included: '',
  made_to_order_information: '',
  seo_title: '',
  seo_description: '',
});

const infoFromProduct = (product?: Product): ProductInfoState => ({
  short_description: product?.short_description || '',
  description: product?.description || '',
  material: product?.material || '',
  dimensions: product?.dimensions || '',
  colour_information: product?.colour_information || '',
  finish: product?.finish || '',
  weight: product?.weight || '',
  lead_time_text: product?.lead_time_text || '',
  customisation_information: product?.customisation_information || '',
  care_instructions: product?.care_instructions || '',
  whats_included: product?.whats_included || '',
  made_to_order_information: product?.made_to_order_information || '',
  seo_title: product?.seo_title || '',
  seo_description: product?.seo_description || '',
});

const cleanText = (value: string) => value.trim() || null;

const productInfoPayload = (info: ProductInfoState) => ({
  short_description: cleanText(info.short_description),
  description: cleanText(info.description),
  material: cleanText(info.material),
  dimensions: cleanText(info.dimensions),
  colour_information: cleanText(info.colour_information),
  finish: cleanText(info.finish),
  weight: cleanText(info.weight),
  lead_time_text: cleanText(info.lead_time_text),
  customisation_information: cleanText(info.customisation_information),
  care_instructions: cleanText(info.care_instructions),
  whats_included: cleanText(info.whats_included),
  made_to_order_information: cleanText(info.made_to_order_information),
  seo_title: cleanText(info.seo_title),
  seo_description: cleanText(info.seo_description),
});

type AiSuggestions = {
  short_description: string | null;
  full_description: string | null;
  features: string[];
  customisation_information: string | null;
  care_instructions: string | null;
  whats_included: string | null;
  seo_title: string | null;
  seo_description: string | null;
  alt_text: string | null;
  suggested_tags: string[];
  suggested_category: string | null;
  missing_information: string[];
  warnings: string[];
};

type AiRequest = {
  product_id?: string;
  product: Record<string, unknown>;
  additional_context: string;
  use_primary_image: boolean;
  primary_image_url?: string;
};

type Notice = { type: 'info' | 'success' | 'error'; text: string } | null;

type View = 'dashboard' | 'products' | 'new-product' | 'edit-product' | 'categories';

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
function PublishIcon({ published }: { published: boolean }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={published ? 'M6 6l12 12M18 6L6 18' : 'M5 12l4 4L19 6'} /></svg>;
}

function ImageIcon() {
  return <svg className="admin-image-action-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm1.5 2.5v11h11v-11h-11Z" /><path d="M11 15V10H8.5L12 6.5l3.5 3.5H13v5h-2Z" /></svg>;
}

function EditIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z" /><path d="M13.5 8.5l2 2" /></svg>;
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
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [productSpecifications, setProductSpecifications] = useState<Record<string, ProductSpecification[]>>({});
  const [productModelAnalysis, setProductModelAnalysis] = useState<Record<string, ModelAnalysis>>({});
  const [categoryName, setCategoryName] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [productName, setProductName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [productType, setProductType] = useState('standard');
  const [pricingMode, setPricingMode] = useState('fixed');
  const [requiresArtwork, setRequiresArtwork] = useState(false);
  const [productInfo, setProductInfo] = useState<ProductInfoState>(emptyProductInfo());
  const [imageAltText, setImageAltText] = useState('');
  const [specifications, setSpecifications] = useState<ProductSpecification[]>([{ label: '', value: '', sort_order: 0 }]);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [busy, setBusy] = useState('');
  const [aiEnabled, setAiEnabled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);

  const view: View = (() => {
    if (typeof window === 'undefined') return 'dashboard';
    const path = window.location.pathname.replace(/\/$/, '');
    if (path === '/admin/products/new') return 'new-product';
    if (path === '/admin/products' && new URLSearchParams(window.location.search).has('edit')) return 'edit-product';
    if (path === '/admin/products') return 'products';
    if (path === '/admin/categories') return 'categories';
    return 'dashboard';
  })();

  const sortedCategories = useMemo(() => [...categories].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)), [categories]);
  const selectedEditProductId = typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('edit') || '';
  const selectedEditImage = productImages[selectedEditProductId];
  const selectedEditImageUrl = selectedEditImage && supabase
    ? supabase.storage.from('product-images').getPublicUrl(selectedEditImage.storage_path).data.publicUrl
    : '';
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
      setProductCategories([]);
      setProductSpecifications({});
      setProductModelAnalysis({});
      setImageAltText('');
    }
  }

  async function loadData(client = supabase) {
    if (!client) return;
    setBusy('loading');
    let [categoryResult, productResult, imageResult, productCategoryResult, specificationResult, modelResult] = await Promise.all([
      client.from('categories').select('id,name,slug,is_active,sort_order').order('sort_order').order('name'),
      client.from('products').select('id,name,slug,product_type,pricing_mode,base_price,short_description,description,material,dimensions,colour_information,finish,weight,lead_time_text,customisation_information,care_instructions,whats_included,made_to_order_information,seo_title,seo_description,is_published,is_active,requires_artwork,minimum_quantity').order('created_at', { ascending: false }),
      client.from('product_images').select('id,product_id,storage_path,alt_text,sort_order').order('sort_order'),
      client.from('product_categories').select('product_id,category_id'),
      client.from('product_specifications').select('id,product_id,label,value,sort_order').order('sort_order'),
      client.from('product_model_files').select('product_id,original_filename,format,file_size_bytes,unit,width,depth,height,volume,surface_area,triangle_count,object_count,watertight,material,weight,weight_unit').order('updated_at', { ascending: false }),
    ]);

    if (categoryResult.error) await handleAppError(categoryResult.error.message);
    else setCategories(categoryResult.data || []);

    if (productResult.error) {
      productResult = await client.from('products').select('id,name,slug,product_type,pricing_mode,base_price,is_published,is_active,requires_artwork,minimum_quantity').order('created_at', { ascending: false });
    }
    if (productResult.error) await handleAppError(productResult.error.message);
    else setProducts((productResult.data || []).map((product) => ({
      short_description: null,
      description: null,
      material: null,
      dimensions: null,
      colour_information: null,
      finish: null,
      weight: null,
      lead_time_text: null,
      customisation_information: null,
      care_instructions: null,
      whats_included: null,
      made_to_order_information: null,
      ...product,
    })));

    if (imageResult.error) await handleAppError(imageResult.error.message);
    else {
      const firstImages: Record<string, ProductImage> = {};
      for (const image of imageResult.data || []) {
        if (!firstImages[image.product_id]) firstImages[image.product_id] = image;
      }
      setProductImages(firstImages);
    }

    if (productCategoryResult.error) await handleAppError(productCategoryResult.error.message);
    else setProductCategories(productCategoryResult.data || []);

    if (!specificationResult.error) {
      const grouped: Record<string, ProductSpecification[]> = {};
      for (const spec of specificationResult.data || []) {
        grouped[spec.product_id] = [...(grouped[spec.product_id] || []), spec];
      }
      setProductSpecifications(grouped);
    } else setProductSpecifications({});
    if (!modelResult.error) {
      const grouped: Record<string, ModelAnalysis> = {};
      for (const model of modelResult.data || []) grouped[model.product_id] = { ...model, filename: model.original_filename, material: model.material || null, weight: model.weight === null ? null : Number(model.weight), weight_unit: model.weight_unit || null } as ModelAnalysis;
      setProductModelAnalysis(grouped);
    } else setProductModelAnalysis({});
    setBusy('');
  }

  useEffect(() => {
    let listener: { subscription: { unsubscribe: () => void } } | null = null;

    async function configureSupabase() {
      try {
        const response = await fetch('/api/config', { cache: 'no-store' });
        if (!response.ok) throw new Error('Unable to load shop configuration.');
        const config = await response.json();
        setAiEnabled(config.aiProductContentEnabled === true);
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
    setProductCategories([]);
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

  async function saveProductSpecifications(productId: string, rows: ProductSpecification[]) {
    if (!supabase) return false;
    const cleaned = rows
      .map((row, index) => ({ product_id: productId, label: row.label.trim(), value: row.value.trim(), sort_order: index }))
      .filter((row) => row.label && row.value);
    const deleteResult = await supabase.from('product_specifications').delete().eq('product_id', productId);
    if (deleteResult.error) {
      await handleAppError(deleteResult.error.message);
      return false;
    }
    if (!cleaned.length) return true;
    const insertResult = await supabase.from('product_specifications').insert(cleaned);
    if (insertResult.error) {
      await handleAppError(insertResult.error.message);
      return false;
    }
    return true;
  }

  async function createProduct(event: React.FormEvent, publish = false) {
    event.preventDefault();
    if (!supabase || !productName.trim()) return;
    setBusy(publish ? 'publish-new' : 'product');
    const slug = slugify(productName);
    const price = basePrice.trim() ? Number(basePrice) : null;
    const { data, error } = await supabase.from('products').insert({
      name: productName.trim(),
      slug,
      product_type: productType,
      pricing_mode: pricingMode,
      base_price: pricingMode === 'quote_only' ? null : price,
      ...productInfoPayload(productInfo),
      requires_artwork: requiresArtwork,
      is_active: true,
      is_published: publish,
      minimum_quantity: 1,
    }).select('id').single();
    if (error) await handleAppError(error.message);
    else if (data?.id) {
      let saved = true;
      if (selectedCategoryId) {
        const categoryResult = await supabase.from('product_categories').insert({ product_id: data.id, category_id: selectedCategoryId });
        if (categoryResult.error) {
          await handleAppError(categoryResult.error.message);
          saved = false;
        }
      }
      if (saved) saved = await saveProductSpecifications(data.id, specifications);
      if (saved) setNotice({ type: 'success', text: publish ? 'Product published.' : 'Product draft saved.' });
    }
    if (!error) {
      setProductName('');
      setSelectedCategoryId('');
      setBasePrice('');
      setRequiresArtwork(false);
      setProductInfo(emptyProductInfo());
      setImageAltText('');
      setSpecifications([{ label: '', value: '', sort_order: 0 }]);
      await loadData();
      if (typeof window !== 'undefined') window.history.pushState(null, '', '/admin/products');
    }
    setBusy('');
  }

  async function updateProduct(event: React.FormEvent, product: Product) {
    event.preventDefault();
    if (!supabase || !productName.trim()) return;
    setBusy(`product-${product.id}`);
    const price = basePrice.trim() ? Number(basePrice) : null;
    const { error } = await supabase.from('products').update({
      name: productName.trim(),
      slug: slugify(productName),
      product_type: productType,
      pricing_mode: pricingMode,
      base_price: pricingMode === 'quote_only' ? null : price,
      ...productInfoPayload(productInfo),
      requires_artwork: requiresArtwork,
    }).eq('id', product.id);
    if (error) await handleAppError(error.message);
    else {
      const specsSaved = await saveProductSpecifications(product.id, specifications);
      let imageSaved = true;
      const image = productImages[product.id];
      if (specsSaved && image) {
        const imageResult = await supabase.from('product_images').update({ alt_text: imageAltText.trim() || product.name }).eq('id', image.id);
        imageSaved = !imageResult.error;
        if (imageResult.error) await handleAppError(imageResult.error.message);
      }
      if (specsSaved && imageSaved) setNotice({ type: 'success', text: 'Product updated.' });
    }
    if (!error) await loadData();
    setBusy('');
  }

  function loadProductForm(product: Product, rows: ProductSpecification[] = []) {
    setProductName(product.name);
    setBasePrice(product.base_price === null ? '' : String(product.base_price));
    setProductType(product.product_type);
    setPricingMode(product.pricing_mode);
    setRequiresArtwork(product.requires_artwork);
    setProductInfo(infoFromProduct(product));
    setImageAltText(productImages[product.id]?.alt_text || product.name);
    setSpecifications(rows.length ? rows.map((row, index) => ({ ...row, sort_order: index })) : [{ label: '', value: '', sort_order: 0 }]);
  }

  async function generateAiContent(request: AiRequest): Promise<AiSuggestions> {
    if (!supabase) throw new Error('Shop Manager is not configured.');
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error('Your session has expired. Please sign in again.');
    const response = await fetch('/api/admin/ai/product-content', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
      body: JSON.stringify(request),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.ok) throw new Error(payload.error || 'We could not generate product content right now.');
    return payload.suggestions as AiSuggestions;
  }

  async function updateProductCategory(product: Product, categoryId: string) {
    if (!supabase) return;
    setBusy(`categories-${product.id}`);
    const deleteResult = await supabase.from('product_categories').delete().eq('product_id', product.id);
    if (deleteResult.error) await handleAppError(deleteResult.error.message);
    else if (categoryId) {
      const insertResult = await supabase.from('product_categories').insert({ product_id: product.id, category_id: categoryId });
      if (insertResult.error) await handleAppError(insertResult.error.message);
      else setNotice({ type: 'success', text: 'Product category updated.' });
    } else setNotice({ type: 'success', text: 'Product category cleared.' });
    await loadData();
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
    const existingImage = productImages[product.id];
    const metadata = { product_id: product.id, storage_path: path, alt_text: product.name, sort_order: 0 };
    const { error } = existingImage
      ? await supabase.from('product_images').update(metadata).eq('id', existingImage.id)
      : await supabase.from('product_images').insert(metadata);

    if (error) await handleAppError(error.message);
    else {
      setImageAltText(product.name);
      setProductImages((current) => ({
        ...current,
        [product.id]: {
          id: existingImage?.id || `${product.id}-pending`,
          product_id: product.id,
          storage_path: path,
          alt_text: product.name,
          sort_order: 0,
        },
      }));
      setNotice({ type: 'success', text: existingImage ? 'Product image updated.' : 'Product image uploaded.' });
    }
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
        {view === 'products' && <Products products={products} productImages={productImages} productCategories={productCategories} categories={sortedCategories} supabase={supabase} busy={busy} navigate={navigate} togglePublish={togglePublish} uploadProductImage={uploadProductImage} setPreviewImage={setPreviewImage} updateProductCategory={updateProductCategory} />}
        {view === 'new-product' && <ProductEditor mode="new" busy={busy} onSubmit={createProduct} productName={productName} setProductName={setProductName} productType={productType} setProductType={setProductType} pricingMode={pricingMode} setPricingMode={setPricingMode} basePrice={basePrice} setBasePrice={setBasePrice} requiresArtwork={requiresArtwork} setRequiresArtwork={setRequiresArtwork} categories={sortedCategories} selectedCategoryId={selectedCategoryId} setSelectedCategoryId={setSelectedCategoryId} productInfo={productInfo} setProductInfo={setProductInfo} specifications={specifications} setSpecifications={setSpecifications} aiEnabled={aiEnabled} generateAiContent={generateAiContent} supabase={supabase} />}
        {view === 'edit-product' && <EditProduct products={products} productSpecifications={productSpecifications} productModelAnalysis={productModelAnalysis} busy={busy} updateProduct={updateProduct} loadProductForm={loadProductForm} productName={productName} setProductName={setProductName} productType={productType} setProductType={setProductType} pricingMode={pricingMode} setPricingMode={setPricingMode} basePrice={basePrice} setBasePrice={setBasePrice} requiresArtwork={requiresArtwork} setRequiresArtwork={setRequiresArtwork} productInfo={productInfo} setProductInfo={setProductInfo} specifications={specifications} setSpecifications={setSpecifications} aiEnabled={aiEnabled} generateAiContent={generateAiContent} productId={selectedEditProductId} primaryImageUrl={selectedEditImageUrl} imageAltText={imageAltText} setImageAltText={setImageAltText} supabase={supabase} onModelSaved={(analysis) => setProductModelAnalysis((current) => ({ ...current, [selectedEditProductId]: analysis }))} />}
        {view === 'categories' && <Categories categories={sortedCategories} busy={busy} createCategory={createCategory} categoryName={categoryName} setCategoryName={setCategoryName} categorySlug={categorySlug} setCategorySlug={setCategorySlug} />}
      </main>
    </div>
    {previewImage && <div className="admin-image-modal" role="dialog" aria-modal="true" aria-label="Product image preview" onClick={() => setPreviewImage(null)}><div><button type="button" aria-label="Close image preview" onClick={() => setPreviewImage(null)}>Close</button><img src={previewImage.src} alt={previewImage.alt} /></div></div>}
  </div>;
}

function Dashboard({ products, categories, publishedCount, draftCount, busy, navigate }: { products: Product[]; categories: Category[]; publishedCount: number; draftCount: number; busy: string; navigate: (path: string) => void }) {
  return <><PageHeader title="Shop Manager" eyebrow="Manage your Vert Printing shop." actions={<button className="admin-button primary" onClick={() => navigate('/admin/products/new')}>+ Add Product</button>} /><section className="admin-metrics"><article><span>Total Products</span><strong>{products.length}</strong></article><article><span>Published Products</span><strong>{publishedCount}</strong></article><article><span>Draft Products</span><strong>{draftCount}</strong></article><article><span>Categories</span><strong>{categories.length}</strong></article></section><section className="admin-card"><h2>Catalogue overview</h2>{busy === 'loading' ? <p className="admin-muted">Loading catalogue...</p> : <p className="admin-muted">Use Products and Categories to manage what will appear in the future Vert online catalogue.</p>}</section></>;
}

function Products({ products, productImages, productCategories, categories, supabase, busy, navigate, togglePublish, uploadProductImage, setPreviewImage, updateProductCategory }: { products: Product[]; productImages: Record<string, ProductImage>; productCategories: ProductCategory[]; categories: Category[]; supabase: SupabaseClient | null; busy: string; navigate: (path: string) => void; togglePublish: (product: Product) => void; uploadProductImage: (product: Product, files: FileList | null) => void; setPreviewImage: (image: { src: string; alt: string } | null) => void; updateProductCategory: (product: Product, categoryId: string) => void }) {
  const categoryById = useMemo(() => Object.fromEntries(categories.map((category) => [category.id, category])), [categories]);
  const categoriesByProduct = useMemo(() => {
    const grouped: Record<string, Category[]> = {};
    for (const relation of productCategories) {
      const category = categoryById[relation.category_id];
      if (!category) continue;
      grouped[relation.product_id] = [...(grouped[relation.product_id] || []), category];
    }
    return grouped;
  }, [categoryById, productCategories]);

  const imageUrl = (product: Product) => {
    const image = productImages[product.id];
    if (!image || !supabase) return '';
    return supabase.storage.from('product-images').getPublicUrl(image.storage_path).data.publicUrl;
  };

  return <><PageHeader title="Products" eyebrow="Manage the products shown in your online shop." actions={<button className="admin-button primary" onClick={() => navigate('/admin/products/new')}>+ Add Product</button>} />{products.length ? <section className="admin-card admin-table-card"><div className="admin-table-head"><span>Image</span><span>Product</span><span>Slug</span><span>Price</span><span>Type</span><span>Categories</span><span>Status</span><span>Actions</span></div>{products.map((product) => {
    const url = imageUrl(product);
    const assignedCategories = categoriesByProduct[product.id] || [];
    return <div className="admin-product-row" key={product.id}><button className="admin-thumb" type="button" disabled={!url} onClick={() => url && setPreviewImage({ src: url, alt: productImages[product.id]?.alt_text || product.name })}>{url ? <img src={url} alt={productImages[product.id]?.alt_text || product.name} /> : <span>No image</span>}</button><strong><a className="admin-product-link" href={`/admin/products?edit=${encodeURIComponent(product.id)}`}>{product.name}</a></strong><span>{product.slug}</span><span>{formatMoney(product.base_price)}</span><span>{product.product_type.replace('_', ' ')}</span><select className="admin-category-select" value={assignedCategories[0]?.id || ''} disabled={busy === `categories-${product.id}` || !categories.length} onChange={(event) => updateProductCategory(product, event.target.value)}><option value="">No category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><Badge tone={product.is_published ? 'success' : 'neutral'}>{product.is_published ? 'Published' : 'Draft'}</Badge><div className="admin-row-actions"><a className="admin-button admin-icon-button secondary" href={`/admin/products?edit=${encodeURIComponent(product.id)}`} title="Edit product" aria-label="Edit product"><EditIcon /></a><button className={`admin-button admin-icon-button ${product.is_published ? 'danger' : 'success'}`} type="button" title={product.is_published ? 'Unpublish product' : 'Publish product'} aria-label={product.is_published ? 'Unpublish product' : 'Publish product'} disabled={busy === product.id} onClick={() => togglePublish(product)}><PublishIcon published={product.is_published} /></button><label className={`admin-upload admin-icon-button ${url ? 'success' : 'secondary'}`} title={url ? 'Update image' : 'Add image'} aria-label={url ? 'Update image' : 'Add image'}><ImageIcon /><input type="file" accept="image/*" onChange={(event) => uploadProductImage(product, event.currentTarget.files)} /></label></div></div>;
  })}</section> : <EmptyState title="You haven't added any products yet." text="Add your first product to start building the Vert online catalogue." action={<button className="admin-button primary" onClick={() => navigate('/admin/products/new')}>+ Add Product</button>} />}</>;
}
function ProductInformationFields({ productInfo, setProductInfo }: { productInfo: ProductInfoState; setProductInfo: (value: ProductInfoState) => void }) {
  const update = (key: keyof ProductInfoState, value: string) => setProductInfo({ ...productInfo, [key]: value });
  return <>
    <div className="admin-card admin-card-wide"><h2>Product Information</h2><p className="admin-muted">Use this for information customers need to understand the product. The short description appears near the product title. If a choice affects the order, such as size or colour selection, add it later as a Product Option instead.</p><div className="admin-field-grid"><Field label="Short description"><textarea value={productInfo.short_description} onChange={(event) => update('short_description', event.target.value)} rows={3} /></Field><Field label="Lead time"><input value={productInfo.lead_time_text} onChange={(event) => update('lead_time_text', event.target.value)} placeholder="2-3 working days" /></Field></div><Field label="Full description"><textarea value={productInfo.description} onChange={(event) => update('description', event.target.value)} rows={6} /></Field></div>
    <div className="admin-card admin-card-wide"><h2>Materials & Physical Details</h2><div className="admin-field-grid"><Field label="Material"><input value={productInfo.material} onChange={(event) => update('material', event.target.value)} placeholder="PETG, acrylic, vinyl" /></Field><Field label="Dimensions"><input value={productInfo.dimensions} onChange={(event) => update('dimensions', event.target.value)} placeholder="180 x 120 x 210 mm" /></Field><Field label="Colour information" helper="Information only. Use Product Options for selectable colours."><input value={productInfo.colour_information} onChange={(event) => update('colour_information', event.target.value)} placeholder="White, black and grey available" /></Field><Field label="Finish"><input value={productInfo.finish} onChange={(event) => update('finish', event.target.value)} placeholder="Natural 3D printed finish" /></Field><Field label="Weight"><input value={productInfo.weight} onChange={(event) => update('weight', event.target.value)} placeholder="Approx. 250 g" /></Field><Field label="Made-to-order information"><input value={productInfo.made_to_order_information} onChange={(event) => update('made_to_order_information', event.target.value)} placeholder="Made to order after artwork approval" /></Field></div></div>
    <div className="admin-card admin-card-wide"><h2>Customer Guidance</h2><div className="admin-field-grid"><Field label="Customisation information"><textarea value={productInfo.customisation_information} onChange={(event) => update('customisation_information', event.target.value)} rows={4} /></Field><Field label="Care instructions"><textarea value={productInfo.care_instructions} onChange={(event) => update('care_instructions', event.target.value)} rows={4} /></Field></div><Field label="What's included"><textarea value={productInfo.whats_included} onChange={(event) => update('whats_included', event.target.value)} rows={4} /></Field></div>
  </>;
}

function SpecificationEditor({ specifications, setSpecifications }: { specifications: ProductSpecification[]; setSpecifications: (value: ProductSpecification[]) => void }) {
  const update = (index: number, key: 'label' | 'value', value: string) => setSpecifications(specifications.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row));
  const remove = (index: number) => setSpecifications(specifications.length === 1 ? [{ label: '', value: '', sort_order: 0 }] : specifications.filter((_row, rowIndex) => rowIndex !== index).map((row, rowIndex) => ({ ...row, sort_order: rowIndex })));
  return <div className="admin-card admin-card-wide"><h2>Additional Specifications</h2><p className="admin-muted">Add extra informational rows such as layer height, maximum print area or included fittings. Leave blank rows empty.</p><div className="admin-spec-list">{specifications.map((row, index) => <div className="admin-spec-row" key={index}><Field label="Label"><input value={row.label} onChange={(event) => update(index, 'label', event.target.value)} placeholder="Material" /></Field><Field label="Value"><input value={row.value} onChange={(event) => update(index, 'value', event.target.value)} placeholder="PETG" /></Field><button className="admin-button secondary" type="button" onClick={() => remove(index)}>Remove</button></div>)}</div><button className="admin-button secondary" type="button" onClick={() => setSpecifications([...specifications, { label: '', value: '', sort_order: specifications.length }])}>+ Add specification</button></div>;
}

function ProductEditor(props: { mode: 'new' | 'edit'; busy: string; onSubmit: (event: React.FormEvent, publish?: boolean) => void; productName: string; setProductName: (value: string) => void; productType: string; setProductType: (value: string) => void; pricingMode: string; setPricingMode: (value: string) => void; basePrice: string; setBasePrice: (value: string) => void; requiresArtwork: boolean; setRequiresArtwork: (value: boolean) => void; categories?: Category[]; selectedCategoryId?: string; setSelectedCategoryId?: (value: string) => void; productInfo: ProductInfoState; setProductInfo: (value: ProductInfoState) => void; specifications: ProductSpecification[]; setSpecifications: (value: ProductSpecification[]) => void; aiEnabled: boolean; generateAiContent: (request: AiRequest) => Promise<AiSuggestions>; productId?: string; primaryImageUrl?: string; supabase: SupabaseClient | null; modelAnalysis?: ModelAnalysis | null; imageAltText?: string; setImageAltText?: (value: string) => void; onModelSaved?: (analysis: ModelAnalysis) => void }) {
  const isEdit = props.mode === 'edit';
  return <form onSubmit={(event) => props.onSubmit(event, false)}><PageHeader title={isEdit ? 'Edit Product' : 'Add Product'} eyebrow={isEdit ? 'Update product details shown to customers.' : 'Create a new product for the Vert shop.'} actions={<><a className="admin-button secondary" href="/admin/products">Back to Products</a>{!isEdit && <button className="admin-button secondary" type="submit" disabled={props.busy === 'product'}>Save Draft</button>}<button className="admin-button primary" type={isEdit ? 'submit' : 'button'} disabled={props.busy === 'publish-new' || props.busy.startsWith('product-')} onClick={!isEdit ? (event) => props.onSubmit(event as unknown as React.FormEvent, true) : undefined}>{isEdit ? 'Save Changes' : 'Publish'}</button></>} /><section className="admin-form-grid"><div className="admin-card"><h2>Basic Information</h2><Field label="Product name"><input value={props.productName} onChange={(event) => props.setProductName(event.target.value)} required /></Field><Field label="Product type" helper="Use Quote Only when the product cannot be priced upfront."><select value={props.productType} onChange={(event) => props.setProductType(event.target.value)}><option value="standard">Standard</option><option value="configurable">Configurable</option><option value="quote_only">Quote Only</option></select></Field></div><div className="admin-card"><h2>Pricing</h2><Field label="Pricing mode"><select value={props.pricingMode} onChange={(event) => props.setPricingMode(event.target.value)}><option value="fixed">Fixed Price</option><option value="from_price">From Price</option><option value="quote_only">Quote Only</option></select></Field><Field label="Base price" helper="Displayed in South African Rand."><input value={props.basePrice} onChange={(event) => props.setBasePrice(event.target.value)} type="number" min="0" step="0.01" disabled={props.pricingMode === 'quote_only'} /></Field></div>{!isEdit && <div className="admin-card"><h2>Category</h2><Field label="Product category" helper="Optional. Create categories first if this list is empty."><select value={props.selectedCategoryId || ''} onChange={(event) => props.setSelectedCategoryId?.(event.target.value)} disabled={!props.categories?.length}><option value="">No category</option>{props.categories?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field></div>}<div className="admin-card"><h2>Artwork</h2><label className="admin-toggle"><input type="checkbox" checked={props.requiresArtwork} onChange={(event) => props.setRequiresArtwork(event.target.checked)} /><span>Requires artwork</span></label><p className="admin-muted">Customers will be prompted to provide artwork details for this product.</p></div>{!isEdit && <div className="admin-card"><h2>Images</h2><div className="admin-dropzone"><strong>Add images after saving</strong><p>Save this product first, then upload images from the Products list.</p></div></div>}<ProductInformationFields productInfo={props.productInfo} setProductInfo={props.setProductInfo} />{props.aiEnabled && <AdminAiAssistant productId={props.productId} primaryImageUrl={props.primaryImageUrl} productName={props.productName} productType={props.productType} pricingMode={props.pricingMode} basePrice={props.basePrice} productInfo={props.productInfo} setProductInfo={props.setProductInfo} specifications={props.specifications} generateAiContent={props.generateAiContent} modelAnalysis={props.modelAnalysis} imageAltText={props.imageAltText} setImageAltText={props.setImageAltText} />}{isEdit && <div className="admin-card admin-card-wide"><h2>Primary Image</h2><Field label="Alt text" helper="Describe the image for customers using screen readers."><input value={props.imageAltText || ''} onChange={(event) => props.setImageAltText?.(event.target.value)} /></Field></div>}{isEdit && props.productId && <ProductModelAnalysis productId={props.productId} supabase={props.supabase} existing={props.modelAnalysis} productInfo={props.productInfo} setProductInfo={props.setProductInfo} onSaved={(analysis) => props.onModelSaved?.(analysis)} />}<SpecificationEditor specifications={props.specifications} setSpecifications={props.setSpecifications} /></section></form>;
}

function EditProduct(props: { products: Product[]; productSpecifications: Record<string, ProductSpecification[]>; productModelAnalysis: Record<string, ModelAnalysis>; busy: string; updateProduct: (event: React.FormEvent, product: Product) => void; loadProductForm: (product: Product, rows: ProductSpecification[]) => void; productName: string; setProductName: (value: string) => void; productType: string; setProductType: (value: string) => void; pricingMode: string; setPricingMode: (value: string) => void; basePrice: string; setBasePrice: (value: string) => void; requiresArtwork: boolean; setRequiresArtwork: (value: boolean) => void; productInfo: ProductInfoState; setProductInfo: (value: ProductInfoState) => void; specifications: ProductSpecification[]; setSpecifications: (value: ProductSpecification[]) => void; aiEnabled: boolean; generateAiContent: (request: AiRequest) => Promise<AiSuggestions>; productId?: string; primaryImageUrl?: string; supabase: SupabaseClient | null; modelAnalysis?: ModelAnalysis | null; imageAltText?: string; setImageAltText?: (value: string) => void; onModelSaved?: (analysis: ModelAnalysis) => void }) {
  const productId = typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('edit') || '';
  const product = props.products.find((item) => item.id === productId);
  const [loadedId, setLoadedId] = useState('');
  useEffect(() => {
    if (product && loadedId !== product.id) {
      props.loadProductForm(product, props.productSpecifications[product.id] || []);
      setLoadedId(product.id);
    }
  }, [product, loadedId, props]);
  if (props.busy === 'loading') return <section className="admin-card"><p className="admin-muted">Loading product...</p></section>;
  if (!product) return <EmptyState title="Product not found." text="This product could not be loaded. Return to the product list and try again." action={<a className="admin-button secondary" href="/admin/products">Back to Products</a>} />;
  return <ProductEditor mode="edit" busy={props.busy} onSubmit={(event) => props.updateProduct(event, product)} productName={props.productName} setProductName={props.setProductName} productType={props.productType} setProductType={props.setProductType} pricingMode={props.pricingMode} setPricingMode={props.setPricingMode} basePrice={props.basePrice} setBasePrice={props.setBasePrice} requiresArtwork={props.requiresArtwork} setRequiresArtwork={props.setRequiresArtwork} productInfo={props.productInfo} setProductInfo={props.setProductInfo} specifications={props.specifications} setSpecifications={props.setSpecifications} aiEnabled={props.aiEnabled} generateAiContent={props.generateAiContent} productId={props.productId} primaryImageUrl={props.primaryImageUrl} imageAltText={props.imageAltText} setImageAltText={props.setImageAltText} supabase={props.supabase} modelAnalysis={props.productModelAnalysis[productId]} onModelSaved={props.onModelSaved} />;
}

function Categories({ categories, busy, createCategory, categoryName, setCategoryName, categorySlug, setCategorySlug }: { categories: Category[]; busy: string; createCategory: (event: React.FormEvent) => void; categoryName: string; setCategoryName: (value: string) => void; categorySlug: string; setCategorySlug: (value: string) => void }) {
  return <><PageHeader title="Categories" eyebrow="Organise products in your shop." /><section className="admin-two-col"><div className="admin-card"><h2>Add Category</h2><form onSubmit={createCategory}><Field label="Name"><input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} required /></Field><Field label="Slug" helper="Leave blank to generate from the name."><input value={categorySlug} onChange={(event) => setCategorySlug(event.target.value)} /></Field><button className="admin-button primary" type="submit" disabled={busy === 'category'}>{busy === 'category' ? 'Saving...' : '+ Add Category'}</button></form></div><div className="admin-card"><h2>Category List</h2>{categories.length ? <div className="admin-category-list">{categories.map((category) => <div key={category.id}><div><strong>{category.name}</strong><small>{category.slug}</small></div><Badge tone={category.is_active ? 'success' : 'neutral'}>{category.is_active ? 'Active' : 'Inactive'}</Badge></div>)}</div> : <EmptyState title="No categories yet." text="Create categories to organise future shop products." />}</div></section></>;
}
