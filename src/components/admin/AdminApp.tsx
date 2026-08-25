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
  description: string | null;
  seo_title: string | null;
  seo_description: string | null;
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

type OrderStatus = 'new' | 'awaiting_artwork' | 'awaiting_approval' | 'in_production' | 'ready' | 'shipped' | 'completed' | 'cancelled';

type Order = {
  id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: string;
  fulfilment_method: string;
  customer_email: string;
  customer_phone: string;
  customer_name: string;
  company_name: string | null;
  grand_total: number;
  currency: string;
  customer_note: string | null;
  internal_note: string | null;
  created_at: string;
  updated_at: string;
};

type OrderItemOption = {
  label?: string;
  group_name?: string;
  value?: string;
  price_adjustment?: number;
};

type OrderItem = {
  id: string;
  order_id: string;
  product_name_snapshot: string;
  sku_snapshot: string | null;
  options_snapshot: OrderItemOption[] | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  requires_artwork: boolean;
};

type OrderStatusHistory = {
  id: string;
  order_id: string;
  old_status: string | null;
  new_status: string;
  note: string | null;
  created_at: string;
};

type QuoteSource = 'website' | 'gmail' | 'whatsapp' | 'phone' | 'walk_in' | 'manual' | 'other';
type QuoteStatus = 'draft' | 'ready_to_send' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired' | 'converted_to_order' | 'cancelled';

type Quote = {
  id: string;
  quote_number: string;
  quote_request_id: string | null;
  customer_id: string | null;
  status: QuoteStatus;
  source: QuoteSource;
  customer_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  currency: string;
  subtotal: number;
  discount_total: number;
  delivery_total: number;
  tax_total: number;
  grand_total: number;
  prices_include_tax: boolean;
  tax_rate: number | null;
  valid_until: string | null;
  customer_note: string | null;
  internal_note: string | null;
  terms_text: string | null;
  created_at: string;
  updated_at: string;
};

type QuoteItem = {
  id?: string;
  quote_id?: string;
  sort_order: number;
  product_id?: string | null;
  description: string;
  sku?: string | null;
  quantity: number;
  unit_price: number;
  line_subtotal: number;
  discount_amount: number;
  line_total: number;
  taxable: boolean;
};

type QuoteStatusHistory = {
  id: string;
  quote_id: string;
  old_status: string | null;
  new_status: string;
  note: string | null;
  created_at: string;
};

type QuoteDraftPayload = {
  source: QuoteSource;
  status: QuoteStatus;
  customer_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  currency: string;
  subtotal: number;
  discount_total: number;
  delivery_total: number;
  tax_total: number;
  grand_total: number;
  prices_include_tax: boolean;
  tax_rate: number | null;
  valid_until: string | null;
  customer_note: string | null;
  internal_note: string | null;
  terms_text: string | null;
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
type AdminSubmitEvent = { preventDefault: () => void };

type View = 'dashboard' | 'products' | 'new-product' | 'edit-product' | 'categories' | 'orders' | 'quotes' | 'new-quote' | 'edit-quote';

const ORDER_STATUSES: { value: OrderStatus; label: string; tone: 'success' | 'neutral' | 'warning' }[] = [
  { value: 'new', label: 'New', tone: 'warning' },
  { value: 'awaiting_artwork', label: 'Awaiting artwork', tone: 'warning' },
  { value: 'awaiting_approval', label: 'Awaiting approval', tone: 'warning' },
  { value: 'in_production', label: 'In production', tone: 'neutral' },
  { value: 'ready', label: 'Ready', tone: 'success' },
  { value: 'shipped', label: 'Shipped', tone: 'success' },
  { value: 'completed', label: 'Complete', tone: 'success' },
  { value: 'cancelled', label: 'Cancelled', tone: 'neutral' },
];

const QUOTE_STATUSES: { value: QuoteStatus; label: string; tone: 'success' | 'neutral' | 'warning' }[] = [
  { value: 'draft', label: 'Draft', tone: 'neutral' },
  { value: 'ready_to_send', label: 'Ready to Send', tone: 'warning' },
  { value: 'sent', label: 'Sent', tone: 'neutral' },
  { value: 'viewed', label: 'Viewed', tone: 'neutral' },
  { value: 'accepted', label: 'Accepted', tone: 'success' },
  { value: 'declined', label: 'Declined', tone: 'neutral' },
  { value: 'expired', label: 'Expired', tone: 'warning' },
  { value: 'converted_to_order', label: 'Converted to Order', tone: 'success' },
  { value: 'cancelled', label: 'Cancelled', tone: 'neutral' },
];

const QUOTE_SOURCES: { value: QuoteSource; label: string }[] = [
  { value: 'manual', label: 'Manual' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'phone', label: 'Phone' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'other', label: 'Other' },
];

const titleCase = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const statusLabel = (status: string) => ORDER_STATUSES.find((item) => item.value === status)?.label || titleCase(status);
const statusTone = (status: string) => ORDER_STATUSES.find((item) => item.value === status)?.tone || 'neutral';
const quoteStatusLabel = (status: string) => QUOTE_STATUSES.find((item) => item.value === status)?.label || titleCase(status);
const quoteStatusTone = (status: string) => QUOTE_STATUSES.find((item) => item.value === status)?.tone || 'neutral';
const quoteSourceLabel = (source: string) => QUOTE_SOURCES.find((item) => item.value === source)?.label || titleCase(source);

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

const roundMoney = (value: number) => Number((Math.round((Number(value) || 0) * 100) / 100).toFixed(2));

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

const formatDate = (value: string | null) =>
  value ? new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`)) : 'Not set';

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
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [orderHistory, setOrderHistory] = useState<Record<string, OrderStatusHistory[]>>({});
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quoteItems, setQuoteItems] = useState<Record<string, QuoteItem[]>>({});
  const [quoteHistory, setQuoteHistory] = useState<Record<string, QuoteStatusHistory[]>>({});
  const [quotesReady, setQuotesReady] = useState(true);
  const [categoryName, setCategoryName] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [categorySeoTitle, setCategorySeoTitle] = useState('');
  const [categorySeoDescription, setCategorySeoDescription] = useState('');
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
    if (path === '/admin/orders') return 'orders';
    if (path === '/admin/quotes/new') return 'new-quote';
    if (path === '/admin/quotes' && new URLSearchParams(window.location.search).has('edit')) return 'edit-quote';
    if (path === '/admin/quotes') return 'quotes';
    return 'dashboard';
  })();

  const sortedCategories = useMemo(() => [...categories].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)), [categories]);
  const selectedEditProductId = typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('edit') || '';
  const selectedEditQuoteId = typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('edit') || '';
  const selectedEditImage = productImages[selectedEditProductId];
  const selectedEditImageUrl = selectedEditImage && supabase
    ? supabase.storage.from('product-images').getPublicUrl(selectedEditImage.storage_path).data.publicUrl
    : '';
  const publishedCount = products.filter((product) => product.is_published).length;
  const draftCount = products.length - publishedCount;
  const newOrderCount = orders.filter((order) => order.status === 'new').length;
  const draftQuoteCount = quotes.filter((quote) => quote.status === 'draft').length;

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
      setOrders([]);
      setOrderItems({});
      setOrderHistory({});
      setQuotes([]);
      setQuoteItems({});
      setQuoteHistory({});
      setImageAltText('');
    }
  }

  async function loadData(client = supabase) {
    if (!client) return;
    setBusy('loading');
    let [categoryResult, productResult, imageResult, productCategoryResult, specificationResult, modelResult, orderResult, quoteResult]: any[] = await Promise.all([
      client.from('categories').select('id,name,slug,description,seo_title,seo_description,is_active,sort_order').order('sort_order').order('name'),
      client.from('products').select('id,name,slug,product_type,pricing_mode,base_price,short_description,description,material,dimensions,colour_information,finish,weight,lead_time_text,customisation_information,care_instructions,whats_included,made_to_order_information,seo_title,seo_description,is_published,is_active,requires_artwork,minimum_quantity').order('created_at', { ascending: false }),
      client.from('product_images').select('id,product_id,storage_path,alt_text,sort_order').order('sort_order'),
      client.from('product_categories').select('product_id,category_id'),
      client.from('product_specifications').select('id,product_id,label,value,sort_order').order('sort_order'),
      client.from('product_model_files').select('product_id,original_filename,format,file_size_bytes,unit,width,depth,height,volume,surface_area,triangle_count,object_count,watertight,material,weight,weight_unit').order('updated_at', { ascending: false }),
      client.from('orders').select('id,order_number,status,payment_status,fulfilment_method,customer_email,customer_phone,customer_name,company_name,grand_total,currency,customer_note,internal_note,created_at,updated_at').order('created_at', { ascending: false }).limit(50),
      client.from('quotes').select('id,quote_number,quote_request_id,customer_id,status,source,customer_name,company_name,email,phone,currency,subtotal,discount_total,delivery_total,tax_total,grand_total,prices_include_tax,tax_rate,valid_until,customer_note,internal_note,terms_text,created_at,updated_at').order('created_at', { ascending: false }).limit(80),
    ]);

    if (categoryResult.error) await handleAppError(categoryResult.error.message);
    else setCategories(categoryResult.data || []);

    if (productResult.error) {
      productResult = await client.from('products').select('id,name,slug,product_type,pricing_mode,base_price,is_published,is_active,requires_artwork,minimum_quantity').order('created_at', { ascending: false });
    }
    if (productResult.error) await handleAppError(productResult.error.message);
    else setProducts((productResult.data || []).map((product: Partial<Product>) => ({
      ...product,
      short_description: product.short_description ?? null,
      description: product.description ?? null,
      material: product.material ?? null,
      dimensions: product.dimensions ?? null,
      colour_information: product.colour_information ?? null,
      finish: product.finish ?? null,
      weight: product.weight ?? null,
      lead_time_text: product.lead_time_text ?? null,
      customisation_information: product.customisation_information ?? null,
      care_instructions: product.care_instructions ?? null,
      whats_included: product.whats_included ?? null,
      made_to_order_information: product.made_to_order_information ?? null,
    } as Product)));

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
    if (!orderResult.error) {
      const orderRows = (orderResult.data || []) as Order[];
      setOrders(orderRows);
      if (orderRows.length) {
        const [itemResult, historyResult] = await Promise.all([
          client
            .from('order_items')
            .select('id,order_id,product_name_snapshot,sku_snapshot,options_snapshot,quantity,unit_price,line_total,requires_artwork')
            .in('order_id', orderRows.map((order) => order.id))
            .order('created_at'),
          client
            .from('order_status_history')
            .select('id,order_id,old_status,new_status,note,created_at')
            .in('order_id', orderRows.map((order) => order.id))
            .order('created_at', { ascending: false }),
        ]);
        if (itemResult.error) setOrderItems({});
        else {
          const grouped: Record<string, OrderItem[]> = {};
          for (const item of itemResult.data || []) grouped[item.order_id] = [...(grouped[item.order_id] || []), item as OrderItem];
          setOrderItems(grouped);
        }
        if (historyResult.error) setOrderHistory({});
        else {
          const grouped: Record<string, OrderStatusHistory[]> = {};
          for (const row of historyResult.data || []) grouped[row.order_id] = [...(grouped[row.order_id] || []), row as OrderStatusHistory];
          setOrderHistory(grouped);
        }
      } else {
        setOrderItems({});
        setOrderHistory({});
      }
    } else {
      setOrders([]);
      setOrderItems({});
      setOrderHistory({});
    }
    if (!quoteResult.error) {
      setQuotesReady(true);
      const quoteRows = (quoteResult.data || []) as Quote[];
      setQuotes(quoteRows);
      if (quoteRows.length) {
        const [quoteItemResult, quoteHistoryResult] = await Promise.all([
          client
            .from('quote_items')
            .select('id,quote_id,sort_order,product_id,description,sku,quantity,unit_price,line_subtotal,discount_amount,line_total,taxable')
            .in('quote_id', quoteRows.map((quote) => quote.id))
            .order('sort_order'),
          client
            .from('quote_status_history')
            .select('id,quote_id,old_status,new_status,note,created_at')
            .in('quote_id', quoteRows.map((quote) => quote.id))
            .order('created_at', { ascending: false }),
        ]);
        if (quoteItemResult.error) setQuoteItems({});
        else {
          const grouped: Record<string, QuoteItem[]> = {};
          for (const item of quoteItemResult.data || []) grouped[item.quote_id] = [...(grouped[item.quote_id] || []), item as QuoteItem];
          setQuoteItems(grouped);
        }
        if (quoteHistoryResult.error) setQuoteHistory({});
        else {
          const grouped: Record<string, QuoteStatusHistory[]> = {};
          for (const row of quoteHistoryResult.data || []) grouped[row.quote_id] = [...(grouped[row.quote_id] || []), row as QuoteStatusHistory];
          setQuoteHistory(grouped);
        }
      } else {
        setQuoteItems({});
        setQuoteHistory({});
      }
    } else {
      setQuotesReady(false);
      setQuotes([]);
      setQuoteItems({});
      setQuoteHistory({});
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

  async function signIn(event: AdminSubmitEvent) {
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
    setOrders([]);
    setOrderItems({});
    setOrderHistory({});
    setQuotes([]);
    setQuoteItems({});
    setQuoteHistory({});
    setNotice({ type: 'success', text: 'Signed out.' });
  }

  async function createCategory(event: AdminSubmitEvent) {
    event.preventDefault();
    if (!supabase || !categoryName.trim()) return;
    setBusy('category');
    const slug = categorySlug.trim() || slugify(categoryName);
    const { error } = await supabase.from('categories').insert({
      name: categoryName.trim(),
      slug,
      description: cleanText(categoryDescription),
      seo_title: cleanText(categorySeoTitle),
      seo_description: cleanText(categorySeoDescription),
      is_active: true,
    });
    if (error) await handleAppError(error.message);
    else setNotice({ type: 'success', text: 'Category created.' });
    if (!error) {
      setCategoryName('');
      setCategorySlug('');
      setCategoryDescription('');
      setCategorySeoTitle('');
      setCategorySeoDescription('');
      await loadData();
    }
    setBusy('');
  }

  async function updateCategory(category: Category, updates: Pick<Category, 'description' | 'seo_title' | 'seo_description'>) {
    if (!supabase) return;
    setBusy(`category-${category.id}`);
    const { error } = await supabase.from('categories').update({
      description: cleanText(updates.description || ''),
      seo_title: cleanText(updates.seo_title || ''),
      seo_description: cleanText(updates.seo_description || ''),
    }).eq('id', category.id);
    if (error) await handleAppError(error.message);
    else {
      setNotice({ type: 'success', text: 'Category copy updated.' });
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

  async function createProduct(event: AdminSubmitEvent, publish = false) {
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

  async function updateProduct(event: AdminSubmitEvent, product: Product) {
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

  async function updateOrderStatus(order: Order, status: OrderStatus) {
    if (!supabase || status === order.status) return;
    setBusy(`order-${order.id}`);
    const updateResult = await supabase.from('orders').update({ status }).eq('id', order.id);
    if (updateResult.error) await handleAppError(updateResult.error.message);
    else {
      const historyResult = await supabase.from('order_status_history').insert({
        order_id: order.id,
        old_status: order.status,
        new_status: status,
        note: 'Status updated in Shop Manager.',
      });
      if (historyResult.error) await handleAppError(historyResult.error.message);
      else setNotice({ type: 'success', text: `${order.order_number} moved to ${statusLabel(status)}.` });
      await loadData();
    }
    setBusy('');
  }

  async function saveQuoteDraft(quoteId: string | null, payload: QuoteDraftPayload, items: QuoteItem[]) {
    if (!supabase) return;
    if (!payload.customer_name.trim()) {
      setNotice({ type: 'error', text: 'Add a customer name before saving the quote.' });
      return;
    }

    const cleanedItems = items
      .map((item, index) => {
        const description = item.description.trim();
        const quantity = Math.max(0, Number(item.quantity) || 0);
        const unitPrice = Math.max(0, Number(item.unit_price) || 0);
        const discount = Math.max(0, Number(item.discount_amount) || 0);
        const lineSubtotal = roundMoney(quantity * unitPrice);
        const lineTotal = roundMoney(Math.max(0, lineSubtotal - discount));
        return {
          sort_order: index,
          product_id: item.product_id || null,
          description,
          sku: cleanText(item.sku || ''),
          quantity,
          unit_price: roundMoney(unitPrice),
          line_subtotal: lineSubtotal,
          discount_amount: roundMoney(discount),
          line_total: lineTotal,
          taxable: item.taxable,
        };
      })
      .filter((item) => item.description && item.quantity > 0);

    setBusy('quote-save');
    const existing = quoteId ? quotes.find((quote) => quote.id === quoteId) : null;
    const quoteBody = {
      ...payload,
      customer_name: payload.customer_name.trim(),
      subtotal: roundMoney(payload.subtotal),
      discount_total: roundMoney(payload.discount_total),
      delivery_total: roundMoney(payload.delivery_total),
      tax_total: roundMoney(payload.tax_total),
      grand_total: roundMoney(payload.grand_total),
      company_name: cleanText(payload.company_name || ''),
      email: cleanText(payload.email || ''),
      phone: cleanText(payload.phone || ''),
      valid_until: payload.valid_until || null,
      customer_note: cleanText(payload.customer_note || ''),
      internal_note: cleanText(payload.internal_note || ''),
      terms_text: cleanText(payload.terms_text || ''),
    };

    const quoteResult = quoteId
      ? await supabase.from('quotes').update(quoteBody).eq('id', quoteId).select('id,quote_number,status').single()
      : await supabase.from('quotes').insert(quoteBody).select('id,quote_number,status').single();

    if (quoteResult.error || !quoteResult.data?.id) {
      await handleAppError(quoteResult.error?.message || 'The quote could not be saved.');
      setBusy('');
      return;
    }

    const savedQuoteId = quoteResult.data.id;
    const deleteItems = await supabase.from('quote_items').delete().eq('quote_id', savedQuoteId);
    if (deleteItems.error) {
      await handleAppError(deleteItems.error.message);
      setBusy('');
      return;
    }

    if (cleanedItems.length) {
      const itemResult = await supabase.from('quote_items').insert(cleanedItems.map((item) => ({ ...item, quote_id: savedQuoteId })));
      if (itemResult.error) {
        await handleAppError(itemResult.error.message);
        setBusy('');
        return;
      }
    }

    if (!quoteId || existing?.status !== payload.status) {
      const historyResult = await supabase.from('quote_status_history').insert({
        quote_id: savedQuoteId,
        old_status: existing?.status || null,
        new_status: payload.status,
        note: quoteId ? 'Quote status updated in Shop Manager.' : 'Draft quote created in Shop Manager.',
      });
      if (historyResult.error) await handleAppError(historyResult.error.message);
    }

    setNotice({ type: 'success', text: `${quoteResult.data.quote_number} saved.` });
    await loadData();
    if (!quoteId && typeof window !== 'undefined') window.history.pushState(null, '', `/admin/quotes?edit=${encodeURIComponent(savedQuoteId)}`);
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
    { label: 'Orders', href: '/admin/orders', key: 'orders' },
    { label: 'Quotes', href: '/admin/quotes', key: 'quotes' },
  ];

  return <div className="admin-app-shell">
    <aside className={`admin-sidebar ${drawerOpen ? 'open' : ''}`}>
      <a className="admin-side-brand" href="/admin"><img src="/assets/vert_logo_header.png" alt="Vert Printing" /><span>Shop Manager</span></a>
      <nav>{nav.map((item) => <a key={item.href} className={view === item.key || (view === 'new-product' && item.key === 'products') || ((view === 'new-quote' || view === 'edit-quote') && item.key === 'quotes') ? 'active' : ''} href={item.href}><span>{item.label[0]}</span>{item.label}</a>)}</nav>
      <div className="admin-side-footer"><a href="/" target="_blank">View Site</a><button type="button" onClick={signOut}>Log out</button></div>
    </aside>
    <div className="admin-workspace">
      <header className="admin-topbar"><button className="admin-menu" type="button" onClick={() => setDrawerOpen(!drawerOpen)}>Menu</button><div><strong>Vert Printing</strong><small>Shop administration</small></div><a className="admin-button secondary" href="/">View Site</a></header>
      <main className="admin-content">
        {notice && <p className={`admin-notice ${notice.type}`}>{notice.text}</p>}
        {view === 'dashboard' && <Dashboard products={products} categories={categories} orders={orders} quotes={quotes} publishedCount={publishedCount} draftCount={draftCount} newOrderCount={newOrderCount} draftQuoteCount={draftQuoteCount} busy={busy} navigate={navigate} />}
        {view === 'products' && <Products products={products} productImages={productImages} productCategories={productCategories} categories={sortedCategories} supabase={supabase} busy={busy} navigate={navigate} togglePublish={togglePublish} uploadProductImage={uploadProductImage} setPreviewImage={setPreviewImage} updateProductCategory={updateProductCategory} />}
        {view === 'new-product' && <ProductEditor mode="new" busy={busy} onSubmit={createProduct} productName={productName} setProductName={setProductName} productType={productType} setProductType={setProductType} pricingMode={pricingMode} setPricingMode={setPricingMode} basePrice={basePrice} setBasePrice={setBasePrice} requiresArtwork={requiresArtwork} setRequiresArtwork={setRequiresArtwork} categories={sortedCategories} selectedCategoryId={selectedCategoryId} setSelectedCategoryId={setSelectedCategoryId} productInfo={productInfo} setProductInfo={setProductInfo} specifications={specifications} setSpecifications={setSpecifications} aiEnabled={aiEnabled} generateAiContent={generateAiContent} supabase={supabase} />}
        {view === 'edit-product' && <EditProduct products={products} productSpecifications={productSpecifications} productModelAnalysis={productModelAnalysis} busy={busy} updateProduct={updateProduct} loadProductForm={loadProductForm} productName={productName} setProductName={setProductName} productType={productType} setProductType={setProductType} pricingMode={pricingMode} setPricingMode={setPricingMode} basePrice={basePrice} setBasePrice={setBasePrice} requiresArtwork={requiresArtwork} setRequiresArtwork={setRequiresArtwork} productInfo={productInfo} setProductInfo={setProductInfo} specifications={specifications} setSpecifications={setSpecifications} aiEnabled={aiEnabled} generateAiContent={generateAiContent} productId={selectedEditProductId} primaryImageUrl={selectedEditImageUrl} imageAltText={imageAltText} setImageAltText={setImageAltText} supabase={supabase} onModelSaved={(analysis) => setProductModelAnalysis((current) => ({ ...current, [selectedEditProductId]: analysis }))} />}
        {view === 'categories' && <Categories categories={sortedCategories} busy={busy} createCategory={createCategory} updateCategory={updateCategory} categoryName={categoryName} setCategoryName={setCategoryName} categorySlug={categorySlug} setCategorySlug={setCategorySlug} categoryDescription={categoryDescription} setCategoryDescription={setCategoryDescription} categorySeoTitle={categorySeoTitle} setCategorySeoTitle={setCategorySeoTitle} categorySeoDescription={categorySeoDescription} setCategorySeoDescription={setCategorySeoDescription} />}
        {view === 'orders' && <Orders orders={orders} orderItems={orderItems} orderHistory={orderHistory} busy={busy} refresh={() => loadData()} updateOrderStatus={updateOrderStatus} />}
        {view === 'quotes' && <Quotes quotes={quotes} quoteItems={quoteItems} quoteHistory={quoteHistory} quotesReady={quotesReady} busy={busy} refresh={() => loadData()} />}
        {view === 'new-quote' && <QuoteEditor mode="new" busy={busy} saveQuoteDraft={saveQuoteDraft} />}
        {view === 'edit-quote' && <EditQuote quoteId={selectedEditQuoteId} quotes={quotes} quoteItems={quoteItems} quoteHistory={quoteHistory} busy={busy} quotesReady={quotesReady} saveQuoteDraft={saveQuoteDraft} />}
      </main>
    </div>
    {previewImage && <div className="admin-image-modal" role="dialog" aria-modal="true" aria-label="Product image preview" onClick={() => setPreviewImage(null)}><div><button type="button" aria-label="Close image preview" onClick={() => setPreviewImage(null)}>Close</button><img src={previewImage.src} alt={previewImage.alt} /></div></div>}
  </div>;
}

function Dashboard({ products, categories, orders, quotes, publishedCount, draftCount, newOrderCount, draftQuoteCount, busy, navigate }: { products: Product[]; categories: Category[]; orders: Order[]; quotes: Quote[]; publishedCount: number; draftCount: number; newOrderCount: number; draftQuoteCount: number; busy: string; navigate: (path: string) => void }) {
  return <><PageHeader title="Shop Manager" eyebrow="Manage your Vert Printing shop." actions={<><button className="admin-button secondary" onClick={() => navigate('/admin/orders')}>View Orders</button><button className="admin-button secondary" onClick={() => navigate('/admin/quotes')}>View Quotes</button><button className="admin-button primary" onClick={() => navigate('/admin/products/new')}>+ Add Product</button></>} /><section className="admin-metrics"><article><span>Total Products</span><strong>{products.length}</strong></article><article><span>Published Products</span><strong>{publishedCount}</strong></article><article><span>Draft Products</span><strong>{draftCount}</strong></article><article><span>New Orders</span><strong>{newOrderCount}</strong></article><article><span>Draft Quotes</span><strong>{draftQuoteCount}</strong></article></section><section className="admin-card"><h2>Shop overview</h2>{busy === 'loading' ? <p className="admin-muted">Loading shop data...</p> : <p className="admin-muted">Manage catalogue products, categories, the latest {orders.length} submitted order requests and {quotes.length} saved quotes.</p>}<p className="admin-muted">Categories: {categories.length}</p></section></>;
}

function Orders({ orders, orderItems, orderHistory, busy, refresh, updateOrderStatus }: { orders: Order[]; orderItems: Record<string, OrderItem[]>; orderHistory: Record<string, OrderStatusHistory[]>; busy: string; refresh: () => void; updateOrderStatus: (order: Order, status: OrderStatus) => void }) {
  const totalValue = orders.reduce((sum, order) => sum + Number(order.grand_total || 0), 0);
  return <>
    <PageHeader title="Orders" eyebrow="Review cart order requests from the website." actions={<button className="admin-button secondary" type="button" onClick={refresh} disabled={busy === 'loading'}>{busy === 'loading' ? 'Refreshing...' : 'Refresh'}</button>} />
    <section className="admin-metrics admin-order-metrics">
      <article><span>Recent Orders</span><strong>{orders.length}</strong></article>
      <article><span>New</span><strong>{orders.filter((order) => order.status === 'new').length}</strong></article>
      <article><span>In Progress</span><strong>{orders.filter((order) => ['awaiting_artwork', 'awaiting_approval', 'in_production'].includes(order.status)).length}</strong></article>
      <article><span>Recent Value</span><strong>{formatMoney(totalValue)}</strong></article>
    </section>
    {orders.length ? <section className="admin-orders-list">
      {orders.map((order) => {
        const items = orderItems[order.id] || [];
        const history = orderHistory[order.id] || [];
        return <article className="admin-order-card" key={order.id}>
          <div className="admin-order-summary">
            <div><span className="admin-order-number">{order.order_number}</span><h2>{order.customer_name}</h2><p>{formatDateTime(order.created_at)}</p></div>
            <div className="admin-order-total"><Badge tone={statusTone(order.status)}>{statusLabel(order.status)}</Badge><strong>{formatMoney(Number(order.grand_total))}</strong></div>
          </div>
          <div className="admin-order-grid">
            <div>
              <h3>Customer</h3>
              {order.company_name && <p>{order.company_name}</p>}
              <p><a href={`mailto:${order.customer_email}`}>{order.customer_email}</a></p>
              <p><a href={`tel:${order.customer_phone}`}>{order.customer_phone}</a></p>
              <p>{order.fulfilment_method === 'delivery' ? 'Delivery to be confirmed' : 'Collection by appointment'}</p>
            </div>
            <div>
              <h3>Items</h3>
              <div className="admin-order-items">{items.length ? items.map((item) => {
                const options = Array.isArray(item.options_snapshot) ? item.options_snapshot : [];
                return <div key={item.id}>
                  <strong>{item.quantity} x {item.product_name_snapshot}</strong>
                  {options.length > 0 && <ul>{options.map((option, index) => <li key={`${item.id}-${index}`}>{option.label || [option.group_name, option.value].filter(Boolean).join(': ')}</li>)}</ul>}
                  <span>{formatMoney(Number(item.line_total))}{item.requires_artwork ? ' · artwork required' : ''}</span>
                </div>;
              }) : <p className="admin-muted">No item details found.</p>}</div>
            </div>
          </div>
          {order.customer_note && <div className="admin-order-note"><h3>Customer note</h3><p>{order.customer_note}</p></div>}
          <div className="admin-order-history">
            <h3>Order history</h3>
            {history.length ? <ol>{history.map((entry) => <li key={entry.id}><strong>{statusLabel(entry.new_status)}</strong><span>{formatDateTime(entry.created_at)}</span>{entry.note && <p>{entry.note}</p>}</li>)}</ol> : <p className="admin-muted">No status history yet.</p>}
          </div>
          <div className="admin-order-actions">
            <Field label="Order status"><select value={order.status} disabled={busy === `order-${order.id}`} onChange={(event) => updateOrderStatus(order, event.target.value as OrderStatus)}>{ORDER_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></Field>
            <div><span>Payment</span><strong>{statusLabel(order.payment_status)}</strong><small>Payment is still handled manually.</small></div>
          </div>
        </article>;
      })}
    </section> : <EmptyState title="No order requests yet." text="Submitted cart orders will appear here with customer details, selected options and status controls." action={<a className="admin-button secondary" href="/shop/">View Shop</a>} />}
  </>;
}

function Quotes({ quotes, quoteItems, quoteHistory, quotesReady, busy, refresh }: { quotes: Quote[]; quoteItems: Record<string, QuoteItem[]>; quoteHistory: Record<string, QuoteStatusHistory[]>; quotesReady: boolean; busy: string; refresh: () => void }) {
  const draftCount = quotes.filter((quote) => quote.status === 'draft').length;
  const readyCount = quotes.filter((quote) => quote.status === 'ready_to_send').length;
  const recentValue = quotes.reduce((sum, quote) => sum + Number(quote.grand_total || 0), 0);

  if (!quotesReady) {
    return <><PageHeader title="Quotes" eyebrow="Create and manage custom Vert quotes." /><EmptyState title="Quote system migration needed." text="Run the latest Supabase quoting migration before using the quote manager." /></>;
  }

  return <>
    <PageHeader title="Quotes" eyebrow="Create and manage custom Vert quotes." actions={<><button className="admin-button secondary" type="button" onClick={refresh} disabled={busy === 'loading'}>{busy === 'loading' ? 'Refreshing...' : 'Refresh'}</button><a className="admin-button primary" href="/admin/quotes/new">+ New Quote</a></>} />
    <section className="admin-metrics admin-order-metrics">
      <article><span>Saved Quotes</span><strong>{quotes.length}</strong></article>
      <article><span>Drafts</span><strong>{draftCount}</strong></article>
      <article><span>Ready</span><strong>{readyCount}</strong></article>
      <article><span>Recent Value</span><strong>{formatMoney(recentValue)}</strong></article>
    </section>
    {quotes.length ? <section className="admin-orders-list admin-quotes-list">
      {quotes.map((quote) => {
        const items = quoteItems[quote.id] || [];
        const history = quoteHistory[quote.id] || [];
        return <article className="admin-order-card admin-quote-card" key={quote.id}>
          <div className="admin-order-summary">
            <div><span className="admin-order-number">{quote.quote_number}</span><h2>{quote.customer_name}</h2><p>{quoteSourceLabel(quote.source)} · {formatDateTime(quote.created_at)}</p></div>
            <div className="admin-order-total"><Badge tone={quoteStatusTone(quote.status)}>{quoteStatusLabel(quote.status)}</Badge><strong>{formatMoney(Number(quote.grand_total))}</strong></div>
          </div>
          <div className="admin-order-grid">
            <div>
              <h3>Customer</h3>
              {quote.company_name && <p>{quote.company_name}</p>}
              {quote.email ? <p><a href={`mailto:${quote.email}`}>{quote.email}</a></p> : <p className="admin-muted">No email captured yet.</p>}
              {quote.phone && <p><a href={`tel:${quote.phone}`}>{quote.phone}</a></p>}
              <p>Valid until: {formatDate(quote.valid_until)}</p>
            </div>
            <div>
              <h3>Quote lines</h3>
              <div className="admin-order-items">{items.length ? items.map((item) => <div key={item.id || `${quote.id}-${item.sort_order}`}><strong>{item.description}</strong><span>{item.quantity} x {formatMoney(Number(item.unit_price))} = {formatMoney(Number(item.line_total))}</span></div>) : <p className="admin-muted">No line items yet.</p>}</div>
            </div>
          </div>
          {quote.customer_note && <div className="admin-order-note"><h3>Customer note</h3><p>{quote.customer_note}</p></div>}
          <div className="admin-order-history">
            <h3>Quote history</h3>
            {history.length ? <ol>{history.map((entry) => <li key={entry.id}><strong>{quoteStatusLabel(entry.new_status)}</strong><span>{formatDateTime(entry.created_at)}</span>{entry.note && <p>{entry.note}</p>}</li>)}</ol> : <p className="admin-muted">No status history yet.</p>}
          </div>
          <div className="admin-order-actions admin-quote-actions">
            <a className="admin-button secondary" href={`/admin/quotes?edit=${encodeURIComponent(quote.id)}`}>Edit Quote</a>
            <div><span>Phase Q1a</span><strong>Manual draft only</strong><small>PDF sending and acceptance come later.</small></div>
          </div>
        </article>;
      })}
    </section> : <EmptyState title="No quotes yet." text="Create a blank quote for a phone call, walk-in or manually priced custom job." action={<a className="admin-button primary" href="/admin/quotes/new">+ New Quote</a>} />}
  </>;
}

function blankQuoteItem(sortOrder = 0): QuoteItem {
  return {
    sort_order: sortOrder,
    description: '',
    quantity: 1,
    unit_price: 0,
    line_subtotal: 0,
    discount_amount: 0,
    line_total: 0,
    taxable: true,
  };
}

function QuoteEditor({ mode, quote, items = [], history = [], busy, saveQuoteDraft }: { mode: 'new' | 'edit'; quote?: Quote; items?: QuoteItem[]; history?: QuoteStatusHistory[]; busy: string; saveQuoteDraft: (quoteId: string | null, payload: QuoteDraftPayload, items: QuoteItem[]) => void }) {
  const [source, setSource] = useState<QuoteSource>(quote?.source || 'manual');
  const [status, setStatus] = useState<QuoteStatus>(quote?.status || 'draft');
  const [customerName, setCustomerName] = useState(quote?.customer_name || '');
  const [companyName, setCompanyName] = useState(quote?.company_name || '');
  const [email, setQuoteEmail] = useState(quote?.email || '');
  const [phone, setQuotePhone] = useState(quote?.phone || '');
  const [validUntil, setValidUntil] = useState(quote?.valid_until || '');
  const [quoteDiscount, setQuoteDiscount] = useState(String(quote?.discount_total || 0));
  const [deliveryTotal, setDeliveryTotal] = useState(String(quote?.delivery_total || 0));
  const [taxTotal, setTaxTotal] = useState(String(quote?.tax_total || 0));
  const [pricesIncludeTax, setPricesIncludeTax] = useState(quote?.prices_include_tax ?? true);
  const [customerNote, setCustomerNote] = useState(quote?.customer_note || '');
  const [internalNote, setInternalNote] = useState(quote?.internal_note || '');
  const [termsText, setTermsText] = useState(quote?.terms_text || 'Quote is valid until the date shown. Production starts once artwork, payment and production details have been confirmed.');
  const [quoteLines, setQuoteLines] = useState<QuoteItem[]>(items.length ? items.map((item, index) => ({ ...item, sort_order: index })) : [blankQuoteItem()]);

  useEffect(() => {
    if (!quote) return;
    setSource(quote.source);
    setStatus(quote.status);
    setCustomerName(quote.customer_name || '');
    setCompanyName(quote.company_name || '');
    setQuoteEmail(quote.email || '');
    setQuotePhone(quote.phone || '');
    setValidUntil(quote.valid_until || '');
    setQuoteDiscount(String(quote.discount_total || 0));
    setDeliveryTotal(String(quote.delivery_total || 0));
    setTaxTotal(String(quote.tax_total || 0));
    setPricesIncludeTax(quote.prices_include_tax);
    setCustomerNote(quote.customer_note || '');
    setInternalNote(quote.internal_note || '');
    setTermsText(quote.terms_text || '');
    setQuoteLines(items.length ? items.map((item, index) => ({ ...item, sort_order: index })) : [blankQuoteItem()]);
  }, [quote?.id, items.length]);

  const calculatedLines = quoteLines.map((item, index) => {
    const quantity = Math.max(0, Number(item.quantity) || 0);
    const unitPrice = Math.max(0, Number(item.unit_price) || 0);
    const discount = Math.max(0, Number(item.discount_amount) || 0);
    const lineSubtotal = roundMoney(quantity * unitPrice);
    const lineTotal = roundMoney(Math.max(0, lineSubtotal - discount));
    return { ...item, sort_order: index, quantity, unit_price: unitPrice, discount_amount: discount, line_subtotal: lineSubtotal, line_total: lineTotal };
  });
  const subtotal = roundMoney(calculatedLines.reduce((sum, item) => sum + item.line_total, 0));
  const discount = roundMoney(Math.max(0, Number(quoteDiscount) || 0));
  const delivery = roundMoney(Math.max(0, Number(deliveryTotal) || 0));
  const tax = roundMoney(Math.max(0, Number(taxTotal) || 0));
  const total = roundMoney(Math.max(0, subtotal - discount + delivery + tax));

  const updateLine = (index: number, updates: Partial<QuoteItem>) => setQuoteLines(quoteLines.map((item, rowIndex) => rowIndex === index ? { ...item, ...updates } : item));
  const removeLine = (index: number) => setQuoteLines(quoteLines.length === 1 ? [blankQuoteItem()] : quoteLines.filter((_item, rowIndex) => rowIndex !== index).map((item, rowIndex) => ({ ...item, sort_order: rowIndex })));

  function submit(event: AdminSubmitEvent) {
    event.preventDefault();
    saveQuoteDraft(quote?.id || null, {
      source,
      status,
      customer_name: customerName,
      company_name: companyName || null,
      email: email || null,
      phone: phone || null,
      currency: 'ZAR',
      subtotal,
      discount_total: discount,
      delivery_total: delivery,
      tax_total: tax,
      grand_total: total,
      prices_include_tax: pricesIncludeTax,
      tax_rate: null,
      valid_until: validUntil || null,
      customer_note: customerNote || null,
      internal_note: internalNote || null,
      terms_text: termsText || null,
    }, calculatedLines);
  }

  return <form onSubmit={submit}>
    <PageHeader title={mode === 'edit' ? `Quote ${quote?.quote_number || ''}` : 'Create Quote'} eyebrow={mode === 'edit' ? 'Review and update a manual draft quote.' : 'Start a manually priced quote for custom work.'} actions={<><a className="admin-button secondary" href="/admin/quotes">Back to Quotes</a><button className="admin-button primary" type="submit" disabled={busy === 'quote-save'}>{busy === 'quote-save' ? 'Saving...' : 'Save Draft'}</button></>} />
    <section className="admin-quote-editor">
      <div className="admin-card">
        <h2>Customer</h2>
        <Field label="Customer name"><input value={customerName} onChange={(event) => setCustomerName(event.target.value)} required /></Field>
        <Field label="Company"><input value={companyName} onChange={(event) => setCompanyName(event.target.value)} /></Field>
        <div className="admin-field-grid">
          <Field label="Email"><input value={email} onChange={(event) => setQuoteEmail(event.target.value)} type="email" /></Field>
          <Field label="Phone"><input value={phone} onChange={(event) => setQuotePhone(event.target.value)} /></Field>
        </div>
      </div>
      <div className="admin-card">
        <h2>Quote Details</h2>
        <div className="admin-field-grid">
          <Field label="Source"><select value={source} onChange={(event) => setSource(event.target.value as QuoteSource)}>{QUOTE_SOURCES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
          <Field label="Status"><select value={status} onChange={(event) => setStatus(event.target.value as QuoteStatus)}><option value="draft">Draft</option><option value="ready_to_send">Ready to Send</option><option value="cancelled">Cancelled</option></select></Field>
          <Field label="Valid until"><input value={validUntil} onChange={(event) => setValidUntil(event.target.value)} type="date" /></Field>
          <label className="admin-toggle admin-quote-tax-toggle"><input type="checkbox" checked={pricesIncludeTax} onChange={(event) => setPricesIncludeTax(event.target.checked)} /><span>Prices include VAT where applicable</span></label>
        </div>
      </div>
      <div className="admin-card admin-card-wide">
        <div className="admin-section-heading"><div><h2>Line Items</h2><p className="admin-muted">Add the products, branding, setup charges, delivery or other custom work Fran is quoting.</p></div><button className="admin-button secondary" type="button" onClick={() => setQuoteLines([...quoteLines, blankQuoteItem(quoteLines.length)])}>+ Add Line Item</button></div>
        <div className="admin-quote-lines">
          <div className="admin-quote-line-head"><span>Description</span><span>Qty</span><span>Unit price</span><span>Discount</span><span>Total</span><span></span></div>
          {calculatedLines.map((item, index) => <div className="admin-quote-line" key={index}>
            <input aria-label="Line description" value={item.description} onChange={(event) => updateLine(index, { description: event.target.value })} placeholder="e.g. Left chest embroidery" />
            <input aria-label="Quantity" value={item.quantity} onChange={(event) => updateLine(index, { quantity: Number(event.target.value) })} type="number" min="0" step="0.01" />
            <input aria-label="Unit price" value={item.unit_price} onChange={(event) => updateLine(index, { unit_price: Number(event.target.value) })} type="number" min="0" step="0.01" />
            <input aria-label="Line discount" value={item.discount_amount} onChange={(event) => updateLine(index, { discount_amount: Number(event.target.value) })} type="number" min="0" step="0.01" />
            <strong>{formatMoney(item.line_total)}</strong>
            <button className="admin-button secondary" type="button" onClick={() => removeLine(index)}>Remove</button>
          </div>)}
        </div>
      </div>
      <div className="admin-card admin-card-wide admin-quote-summary-card">
        <h2>Totals</h2>
        <div className="admin-quote-total-grid">
          <div><span>Line subtotal</span><strong>{formatMoney(subtotal)}</strong></div>
          <Field label="Quote discount"><input value={quoteDiscount} onChange={(event) => setQuoteDiscount(event.target.value)} type="number" min="0" step="0.01" /></Field>
          <Field label="Delivery"><input value={deliveryTotal} onChange={(event) => setDeliveryTotal(event.target.value)} type="number" min="0" step="0.01" /></Field>
          <Field label="Tax amount"><input value={taxTotal} onChange={(event) => setTaxTotal(event.target.value)} type="number" min="0" step="0.01" /></Field>
          <div className="admin-quote-grand-total"><span>Quote total</span><strong>{formatMoney(total)}</strong></div>
        </div>
      </div>
      <div className="admin-card">
        <h2>Customer Note</h2>
        <Field label="Shown on quote"><textarea value={customerNote} onChange={(event) => setCustomerNote(event.target.value)} rows={5} /></Field>
      </div>
      <div className="admin-card">
        <h2>Internal Note</h2>
        <Field label="For Vert only"><textarea value={internalNote} onChange={(event) => setInternalNote(event.target.value)} rows={5} /></Field>
      </div>
      <div className="admin-card admin-card-wide">
        <h2>Terms</h2>
        <Field label="Quote terms"><textarea value={termsText} onChange={(event) => setTermsText(event.target.value)} rows={4} /></Field>
      </div>
      {mode === 'edit' && <div className="admin-card admin-card-wide">
        <h2>Quote History</h2>
        {history.length ? <div className="admin-order-history"><ol>{history.map((entry) => <li key={entry.id}><strong>{quoteStatusLabel(entry.new_status)}</strong><span>{formatDateTime(entry.created_at)}</span>{entry.note && <p>{entry.note}</p>}</li>)}</ol></div> : <p className="admin-muted">No status history yet.</p>}
      </div>}
    </section>
  </form>;
}

function EditQuote({ quoteId, quotes, quoteItems, quoteHistory, busy, quotesReady, saveQuoteDraft }: { quoteId: string; quotes: Quote[]; quoteItems: Record<string, QuoteItem[]>; quoteHistory: Record<string, QuoteStatusHistory[]>; busy: string; quotesReady: boolean; saveQuoteDraft: (quoteId: string | null, payload: QuoteDraftPayload, items: QuoteItem[]) => void }) {
  if (!quotesReady) return <><PageHeader title="Quotes" eyebrow="Create and manage custom Vert quotes." /><EmptyState title="Quote system migration needed." text="Run the latest Supabase quoting migration before editing quotes." /></>;
  const quote = quotes.find((item) => item.id === quoteId);
  if (busy === 'loading') return <section className="admin-card"><p className="admin-muted">Loading quote...</p></section>;
  if (!quote) return <EmptyState title="Quote not found." text="This quote could not be loaded. Return to the quote list and try again." action={<a className="admin-button secondary" href="/admin/quotes">Back to Quotes</a>} />;
  return <QuoteEditor mode="edit" quote={quote} items={quoteItems[quote.id] || []} history={quoteHistory[quote.id] || []} busy={busy} saveQuoteDraft={saveQuoteDraft} />;
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

function ProductEditor(props: { mode: 'new' | 'edit'; busy: string; onSubmit: (event: AdminSubmitEvent, publish?: boolean) => void; productName: string; setProductName: (value: string) => void; productType: string; setProductType: (value: string) => void; pricingMode: string; setPricingMode: (value: string) => void; basePrice: string; setBasePrice: (value: string) => void; requiresArtwork: boolean; setRequiresArtwork: (value: boolean) => void; categories?: Category[]; selectedCategoryId?: string; setSelectedCategoryId?: (value: string) => void; productInfo: ProductInfoState; setProductInfo: (value: ProductInfoState) => void; specifications: ProductSpecification[]; setSpecifications: (value: ProductSpecification[]) => void; aiEnabled: boolean; generateAiContent: (request: AiRequest) => Promise<AiSuggestions>; productId?: string; primaryImageUrl?: string; supabase: SupabaseClient | null; modelAnalysis?: ModelAnalysis | null; imageAltText?: string; setImageAltText?: (value: string) => void; onModelSaved?: (analysis: ModelAnalysis) => void }) {
  const isEdit = props.mode === 'edit';
  return <form onSubmit={(event) => props.onSubmit(event, false)}><PageHeader title={isEdit ? 'Edit Product' : 'Add Product'} eyebrow={isEdit ? 'Update product details shown to customers.' : 'Create a new product for the Vert shop.'} actions={<><a className="admin-button secondary" href="/admin/products">Back to Products</a>{!isEdit && <button className="admin-button secondary" type="submit" disabled={props.busy === 'product'}>Save Draft</button>}<button className="admin-button primary" type={isEdit ? 'submit' : 'button'} disabled={props.busy === 'publish-new' || props.busy.startsWith('product-')} onClick={!isEdit ? (event) => props.onSubmit(event, true) : undefined}>{isEdit ? 'Save Changes' : 'Publish'}</button></>} /><section className="admin-form-grid"><div className="admin-card"><h2>Basic Information</h2><Field label="Product name"><input value={props.productName} onChange={(event) => props.setProductName(event.target.value)} required /></Field><Field label="Product type" helper="Use Quote Only when the product cannot be priced upfront."><select value={props.productType} onChange={(event) => props.setProductType(event.target.value)}><option value="standard">Standard</option><option value="configurable">Configurable</option><option value="quote_only">Quote Only</option></select></Field></div><div className="admin-card"><h2>Pricing</h2><Field label="Pricing mode"><select value={props.pricingMode} onChange={(event) => props.setPricingMode(event.target.value)}><option value="fixed">Fixed Price</option><option value="from_price">From Price</option><option value="quote_only">Quote Only</option></select></Field><Field label="Base price" helper="Displayed in South African Rand."><input value={props.basePrice} onChange={(event) => props.setBasePrice(event.target.value)} type="number" min="0" step="0.01" disabled={props.pricingMode === 'quote_only'} /></Field></div>{!isEdit && <div className="admin-card"><h2>Category</h2><Field label="Product category" helper="Optional. Create categories first if this list is empty."><select value={props.selectedCategoryId || ''} onChange={(event) => props.setSelectedCategoryId?.(event.target.value)} disabled={!props.categories?.length}><option value="">No category</option>{props.categories?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field></div>}<div className="admin-card"><h2>Artwork</h2><label className="admin-toggle"><input type="checkbox" checked={props.requiresArtwork} onChange={(event) => props.setRequiresArtwork(event.target.checked)} /><span>Requires artwork</span></label><p className="admin-muted">Customers will be prompted to provide artwork details for this product.</p></div>{!isEdit && <div className="admin-card"><h2>Images</h2><div className="admin-dropzone"><strong>Add images after saving</strong><p>Save this product first, then upload images from the Products list.</p></div></div>}<ProductOptionsEditor productId={props.productId} productType={props.productType} supabase={props.supabase} /><ProductInformationFields productInfo={props.productInfo} setProductInfo={props.setProductInfo} />{props.aiEnabled && <AdminAiAssistant productId={props.productId} primaryImageUrl={props.primaryImageUrl} productName={props.productName} productType={props.productType} pricingMode={props.pricingMode} basePrice={props.basePrice} productInfo={props.productInfo} setProductInfo={props.setProductInfo} specifications={props.specifications} generateAiContent={props.generateAiContent} modelAnalysis={props.modelAnalysis} imageAltText={props.imageAltText} setImageAltText={props.setImageAltText} />}{isEdit && <div className="admin-card admin-card-wide"><h2>Primary Image</h2><Field label="Alt text" helper="Describe the image for customers using screen readers."><input value={props.imageAltText || ''} onChange={(event) => props.setImageAltText?.(event.target.value)} /></Field></div>}{isEdit && props.productId && <ProductModelAnalysis productId={props.productId} supabase={props.supabase} existing={props.modelAnalysis} productInfo={props.productInfo} setProductInfo={props.setProductInfo} onSaved={(analysis) => props.onModelSaved?.(analysis)} />}<SpecificationEditor specifications={props.specifications} setSpecifications={props.setSpecifications} /></section></form>;
}

function EditProduct(props: { products: Product[]; productSpecifications: Record<string, ProductSpecification[]>; productModelAnalysis: Record<string, ModelAnalysis>; busy: string; updateProduct: (event: AdminSubmitEvent, product: Product) => void; loadProductForm: (product: Product, rows: ProductSpecification[]) => void; productName: string; setProductName: (value: string) => void; productType: string; setProductType: (value: string) => void; pricingMode: string; setPricingMode: (value: string) => void; basePrice: string; setBasePrice: (value: string) => void; requiresArtwork: boolean; setRequiresArtwork: (value: boolean) => void; productInfo: ProductInfoState; setProductInfo: (value: ProductInfoState) => void; specifications: ProductSpecification[]; setSpecifications: (value: ProductSpecification[]) => void; aiEnabled: boolean; generateAiContent: (request: AiRequest) => Promise<AiSuggestions>; productId?: string; primaryImageUrl?: string; supabase: SupabaseClient | null; modelAnalysis?: ModelAnalysis | null; imageAltText?: string; setImageAltText?: (value: string) => void; onModelSaved?: (analysis: ModelAnalysis) => void }) {
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

function CategoryCopyEditor({ category, busy, updateCategory }: { category: Category; busy: string; updateCategory: (category: Category, updates: Pick<Category, 'description' | 'seo_title' | 'seo_description'>) => void }) {
  const [description, setDescription] = useState(category.description || '');
  const [seoTitle, setSeoTitle] = useState(category.seo_title || '');
  const [seoDescription, setSeoDescription] = useState(category.seo_description || '');

  useEffect(() => {
    setDescription(category.description || '');
    setSeoTitle(category.seo_title || '');
    setSeoDescription(category.seo_description || '');
  }, [category]);

  return <form className="admin-category-editor" onSubmit={(event) => { event.preventDefault(); updateCategory(category, { description, seo_title: seoTitle, seo_description: seoDescription }); }}>
    <div className="admin-category-editor-heading">
      <div>
        <strong>{category.name}</strong>
        <small>{category.slug}</small>
      </div>
      <Badge tone={category.is_active ? 'success' : 'neutral'}>{category.is_active ? 'Active' : 'Inactive'}</Badge>
    </div>
    <Field label="Category description" helper="Shown on the public category page. Keep it short and useful for customers.">
      <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
    </Field>
    <div className="admin-field-grid">
      <Field label="SEO title">
        <input value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} placeholder={`${category.name} | Vert Printing Shop`} />
      </Field>
      <Field label="SEO description">
        <textarea value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} rows={3} />
      </Field>
    </div>
    <button className="admin-button secondary" type="submit" disabled={busy === `category-${category.id}`}>{busy === `category-${category.id}` ? 'Saving...' : 'Save Copy'}</button>
  </form>;
}

function Categories({ categories, busy, createCategory, updateCategory, categoryName, setCategoryName, categorySlug, setCategorySlug, categoryDescription, setCategoryDescription, categorySeoTitle, setCategorySeoTitle, categorySeoDescription, setCategorySeoDescription }: { categories: Category[]; busy: string; createCategory: (event: AdminSubmitEvent) => void; updateCategory: (category: Category, updates: Pick<Category, 'description' | 'seo_title' | 'seo_description'>) => void; categoryName: string; setCategoryName: (value: string) => void; categorySlug: string; setCategorySlug: (value: string) => void; categoryDescription: string; setCategoryDescription: (value: string) => void; categorySeoTitle: string; setCategorySeoTitle: (value: string) => void; categorySeoDescription: string; setCategorySeoDescription: (value: string) => void }) {
  return <><PageHeader title="Categories" eyebrow="Organise products and improve category SEO." /><section className="admin-two-col admin-category-layout"><div className="admin-card"><h2>Add Category</h2><form onSubmit={createCategory}><Field label="Name"><input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} required /></Field><Field label="Slug" helper="Leave blank to generate from the name."><input value={categorySlug} onChange={(event) => setCategorySlug(event.target.value)} /></Field><Field label="Category description" helper="Shown on the public category page."><textarea value={categoryDescription} onChange={(event) => setCategoryDescription(event.target.value)} rows={3} /></Field><Field label="SEO title"><input value={categorySeoTitle} onChange={(event) => setCategorySeoTitle(event.target.value)} /></Field><Field label="SEO description"><textarea value={categorySeoDescription} onChange={(event) => setCategorySeoDescription(event.target.value)} rows={3} /></Field><button className="admin-button primary" type="submit" disabled={busy === 'category'}>{busy === 'category' ? 'Saving...' : '+ Add Category'}</button></form></div><div className="admin-card admin-card-wide"><h2>Category Copy</h2><p className="admin-muted">These fields feed the public category pages and their search snippets. Leave blank only for categories that are not ready to be indexed.</p>{categories.length ? <div className="admin-category-copy-list">{categories.map((category) => <CategoryCopyEditor key={category.id} category={category} busy={busy} updateCategory={updateCategory} />)}</div> : <EmptyState title="No categories yet." text="Create categories to organise future shop products." />}</div></section></>;
}
