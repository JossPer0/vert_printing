import { useState } from 'react';

type ProductInfo = Record<string, string>;
type Specification = { label: string; value: string };
type Suggestions = {
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

type Props = {
  productId?: string;
  primaryImageUrl?: string;
  productName: string;
  productType: string;
  pricingMode: string;
  basePrice: string;
  productInfo: ProductInfo;
  setProductInfo: (value: ProductInfo) => void;
  specifications: Specification[];
  generateAiContent: (request: { product_id?: string; product: Record<string, unknown>; additional_context: string; use_primary_image: boolean }) => Promise<Suggestions>;
};

const labels: Array<[keyof Suggestions, string]> = [
  ['short_description', 'Short description'],
  ['full_description', 'Full description'],
  ['customisation_information', 'Customisation information'],
  ['care_instructions', 'Care instructions'],
  ['whats_included', "What's included"],
  ['seo_title', 'SEO title'],
  ['seo_description', 'SEO meta description'],
];

export default function AdminAiAssistant(props: Props) {
  const [context, setContext] = useState('');
  const [useImage, setUseImage] = useState(Boolean(props.primaryImageUrl));
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pendingApply, setPendingApply] = useState<{ key: keyof Suggestions; label: string; value: string } | null>(null);
  const [appliedKeys, setAppliedKeys] = useState<Set<string>>(new Set());
  const [appliedAll, setAppliedAll] = useState(false);

  async function generate() {
    setBusy(true);
    setError('');
    setAppliedKeys(new Set());
    setAppliedAll(false);
    try {
      const product = {
        name: props.productName,
        product_type: props.productType,
        pricing_mode: props.pricingMode,
        price: props.basePrice ? Number(props.basePrice) : null,
        currency: 'ZAR',
        material: props.productInfo.material,
        dimensions: props.productInfo.dimensions,
        available_colours: props.productInfo.colour_information,
        finish: props.productInfo.finish,
        weight: props.productInfo.weight,
        lead_time: props.productInfo.lead_time_text,
        made_to_order: props.productInfo.made_to_order_information,
        short_description: props.productInfo.short_description,
        full_description: props.productInfo.description,
        specifications: props.specifications.filter((row) => row.label.trim() && row.value.trim()),
      };
      setSuggestions(await props.generateAiContent({ product_id: props.productId, product, additional_context: context, use_primary_image: useImage }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't generate product content right now.");
    } finally {
      setBusy(false);
    }
  }

  function applyValue(key: keyof Suggestions, value: string) {
    const productKey = key === 'full_description' ? 'description' : key;
    props.setProductInfo({ ...props.productInfo, [productKey]: value });
    setAppliedKeys((current) => new Set(current).add(key));
  }

  function apply(key: keyof Suggestions, label: string) {
    const value = suggestions?.[key];
    if (typeof value !== 'string' || !value.trim()) return;
    const productKey = key === 'full_description' ? 'description' : key;
    const current = props.productInfo[productKey] || '';
    if (current.trim()) {
      setPendingApply({ key, label, value });
      return;
    }
    applyValue(key, value);
  }

  function applyAll() {
    if (!suggestions) return;
    const next = { ...props.productInfo };
    let skipped = 0;
    for (const [key] of labels) {
      const value = suggestions[key];
      if (typeof value !== 'string' || !value.trim()) continue;
      const productKey = key === 'full_description' ? 'description' : key;
      if (next[productKey as keyof typeof next]?.trim()) { skipped += 1; continue; }
      next[productKey as keyof typeof next] = value;
    }
    props.setProductInfo(next);
    setAppliedAll(true);
    if (skipped) setError(`${skipped} existing field${skipped === 1 ? '' : 's'} kept unchanged.`);
  }

  return <section className="admin-card admin-card-wide admin-ai-card">
    <div className="admin-ai-heading"><div><h2>AI Product Assistant</h2><p className="admin-muted">Generate draft copy from the information you have entered. Nothing is saved until you review and apply it.</p></div><span className="admin-ai-badge">Drafts only</span></div>
    <Field label="Anything the AI should know?" helper="Add context such as who the product is for or how customers normally use it."><textarea value={context} onChange={(event) => setContext(event.target.value)} maxLength={2000} rows={3} /></Field>
    <label className="admin-ai-checkbox" title="The assistant may use the product primary managed image for visual context. It will not infer exact dimensions, materials, colours or other technical facts from the image."><input type="checkbox" checked={useImage} disabled={!props.primaryImageUrl} onChange={(event) => setUseImage(event.target.checked)} /><span>Use the primary product image{!props.primaryImageUrl && ' (add one from the Products list first)'}</span></label>
    <button className="admin-button primary admin-ai-generate" type="button" disabled={busy || !props.productName.trim()} onClick={generate}>{busy ? 'Generating...' : 'Generate Product Content'}</button>
    {error && <p className="admin-notice error">{error}</p>}
    {suggestions && <div className="admin-ai-results"><h3>AI Suggestions</h3>{labels.map(([key, label]) => typeof suggestions[key] === 'string' && suggestions[key] && <article key={String(key)}><div><strong>{label}</strong><p>{suggestions[key] as string}</p></div><button className={`admin-button secondary ${appliedKeys.has(String(key)) ? 'is-applied' : ''}`} type="button" onClick={() => apply(key, label)}>{appliedKeys.has(String(key)) ? 'Applied' : 'Apply'}</button></article>)}{suggestions.features.length > 0 && <div className="admin-ai-list"><strong>Suggested features</strong><ul>{suggestions.features.map((feature) => <li key={feature}>{feature}</li>)}</ul></div>}{suggestions.missing_information.length > 0 && <div className="admin-ai-list"><strong>Could be improved with</strong><ul>{suggestions.missing_information.map((item) => <li key={item}>{item}</li>)}</ul></div>}{suggestions.warnings.length > 0 && <div className="admin-ai-list warning"><strong>Review carefully</strong><ul>{suggestions.warnings.map((item) => <li key={item}>{item}</li>)}</ul></div>}{suggestions.alt_text && <div className="admin-ai-list"><strong>Suggested image alt text</strong><p>{suggestions.alt_text}</p><small>Copy this into the image alt text when updating the product image.</small></div>}<div className="admin-ai-actions"><button className={`admin-button primary ${appliedAll ? 'is-applied' : ''}`} type="button" onClick={applyAll}>{appliedAll ? 'Applied to Empty Fields' : 'Apply All to Empty Fields'}</button><button className="admin-button secondary" type="button" onClick={generate}>Regenerate</button><button className="admin-button secondary" type="button" onClick={() => setSuggestions(null)}>Dismiss</button></div></div>}

    {pendingApply && <div className="admin-modal-backdrop" role="presentation"><div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="ai-replace-title"><h2 id="ai-replace-title">Replace existing field?</h2><p>The {pendingApply.label.toLowerCase()} field already has content. Replace it with this draft?</p><div className="admin-modal-actions"><button className="admin-button secondary" type="button" onClick={() => setPendingApply(null)}>Keep Existing</button><button className="admin-button primary" type="button" onClick={() => { applyValue(pendingApply.key, pendingApply.value); setPendingApply(null); }}>Replace Field</button></div></div></div>}  </section>;
}

function Field({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return <label className="admin-field"><span>{label}</span>{children}{helper && <small>{helper}</small>}</label>;
}
