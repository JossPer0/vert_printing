import { useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { analyseModelFile, type ModelAnalysis } from '../../lib/modelAnalysis';

type ProductInfo = {
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

type Props = {
  productId?: string;
  supabase: SupabaseClient | null;
  existing?: ModelAnalysis | null;
  productInfo: ProductInfo;
  setProductInfo: (value: ProductInfo) => void;
  onSaved: (analysis: ModelAnalysis) => void;
};

function display(value: number | null | undefined) {
  return value === null || value === undefined ? 'Not available' : String(value);
}

function dimensionsFrom(analysis: ModelAnalysis) {
  return `${display(analysis.width)} × ${display(analysis.depth)} × ${display(analysis.height)} ${analysis.unit}`;
}

export default function ProductModelAnalysis({ productId, supabase, existing, productInfo, setProductInfo, onSaved }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [stlUnit, setStlUnit] = useState('mm');
  const [analysis, setAnalysis] = useState<ModelAnalysis | null>(existing || null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function analyseAndSave() {
    if (!file || !productId || !supabase) return;
    setBusy(true);
    setError('');
    try {
      const result = await analyseModelFile(file, stlUnit);
      const { data: previousModel } = await supabase.from('product_model_files').select('storage_path').eq('product_id', productId).maybeSingle();
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
      const storagePath = `products/${productId}/models/${Date.now()}-${safeName}`;
      const upload = await supabase.storage.from('product-models').upload(storagePath, file, { contentType: file.type || 'application/octet-stream', upsert: false });
      if (upload.error) throw new Error('The model file could not be uploaded.');
      const { error: saveError } = await supabase.from('product_model_files').upsert({
        product_id: productId,
        storage_path: storagePath,
        original_filename: result.filename,
        format: result.format,
        file_size_bytes: result.file_size_bytes,
        unit: result.unit,
        width: result.width,
        depth: result.depth,
        height: result.height,
        material: result.material,
        weight: result.weight,
        weight_unit: result.weight_unit,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'product_id' });
      if (saveError) {
        await supabase.storage.from('product-models').remove([storagePath]);
        throw new Error('The model analysis could not be saved.');
      }
      if (previousModel?.storage_path && previousModel.storage_path !== storagePath) {
        await supabase.storage.from('product-models').remove([previousModel.storage_path]);
      }

      const nextInfo = {
        ...productInfo,
        dimensions: productInfo.dimensions.trim() || dimensionsFrom(result),
        material: productInfo.material.trim() || result.material || productInfo.material,
        lead_time_text: productInfo.lead_time_text.trim() || '2-3 working days',
        finish: productInfo.finish.trim() || 'Natural 3D Finish',
      };
      setProductInfo(nextInfo);
      setAnalysis(result);
      onSaved(result);
      setFile(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The model could not be analysed.');
    } finally {
      setBusy(false);
    }
  }

  return <section className="admin-card admin-card-wide admin-model-card">
    <div className="admin-model-heading"><div><h2>3D Model Analysis</h2><p className="admin-muted">Upload an STL or 3MF file to extract verified dimensions for product information and the AI assistant. The model file remains private.</p></div><span className="admin-ai-badge">Admin only</span></div>
    {!productId ? <p className="admin-notice info">Save the product first, then add a model file here.</p> : <>
      <div className="admin-model-upload-row"><label className="admin-field"><span>Model file</span><input type="file" accept=".stl,.3mf,model/stl,model/3mf" onChange={(event) => setFile(event.target.files?.[0] || null)} /><small>Maximum 50 MB. 3MF files can include units and metadata; STL units must be selected.</small></label>{file?.name.toLowerCase().endsWith('.stl') && <label className="admin-field"><span>STL units</span><select value={stlUnit} onChange={(event) => setStlUnit(event.target.value)}><option value="mm">Millimetres</option><option value="cm">Centimetres</option><option value="in">Inches</option></select></label>}</div>
      <button className="admin-button primary admin-ai-generate admin-model-analyse" type="button" disabled={!file || busy} onClick={analyseAndSave}>{busy ? 'Analysing...' : 'Analyse 3D Model'}</button>
      {error && <p className="admin-notice error">{error}</p>}
      {analysis && <div className="admin-model-results"><div><strong>{analysis.filename}</strong><span>{analysis.format.toUpperCase()} · {analysis.unit}</span></div><dl className="admin-model-stats"><div><dt>Dimensions</dt><dd>{dimensionsFrom(analysis)}</dd></div><div><dt>Material</dt><dd>{analysis.material || 'Not available'}</dd></div><div><dt>Weight</dt><dd>{analysis.weight === null ? 'Not available' : `${analysis.weight} ${analysis.weight_unit || 'g'}`}</dd></div></dl><p className="admin-muted">Dimensions and reliable metadata fill empty product fields. Fran can edit them before saving.</p></div>}
    </>}
  </section>;
}
