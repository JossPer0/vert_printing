import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

type ChoiceType = 'colour' | 'material' | 'size' | 'branding' | 'finish' | 'custom';
type OptionValue = { id?: string; option_group_id?: string; label: string; value: string; price_adjustment: number; sort_order: number; is_active: boolean; metadata?: { color?: string } };
type OptionGroup = { id?: string; product_id?: string; name: string; choice_type: ChoiceType; display_type: 'select' | 'radio' | 'swatch'; is_required: boolean; sort_order: number; values: OptionValue[] };

const CHOICE_CONFIG: Record<ChoiceType, { label: string; defaultName: string; display: OptionGroup['display_type'] }> = {
  colour: { label: 'Colour', defaultName: 'Colour', display: 'swatch' },
  material: { label: 'Material', defaultName: 'Material', display: 'select' },
  size: { label: 'Size', defaultName: 'Size', display: 'radio' },
  branding: { label: 'Branding method', defaultName: 'Branding method', display: 'select' },
  finish: { label: 'Finish', defaultName: 'Finish', display: 'select' },
  custom: { label: 'Custom choice', defaultName: '', display: 'select' },
};

const inferChoiceType = (group: { name?: string; display_type?: string }): ChoiceType => {
  const name = (group.name || '').toLowerCase();
  if (name.includes('colour') || name.includes('color')) return 'colour';
  if (name.includes('material')) return 'material';
  if (name.includes('size')) return 'size';
  if (name.includes('brand')) return 'branding';
  if (name.includes('finish')) return 'finish';
  return 'custom';
};

const COLOUR_PALETTE = [
  ['Black', '#111111'], ['White', '#ffffff'], ['Grey', '#8b9194'], ['Red', '#e53935'], ['Orange', '#f57c00'], ['Yellow', '#fbc02d'], ['Green', '#43a047'], ['Teal', '#00897b'], ['Blue', '#1e88e5'], ['Navy', '#163a70'], ['Purple', '#8e24aa'], ['Pink', '#ec168c'], ['Brown', '#795548'], ['Gold', '#d4a017'],
] as const;
const makeStoredValue = (label: string) => label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const blankGroup = (): OptionGroup => ({ name: '', choice_type: 'custom', display_type: 'select', is_required: false, sort_order: 0, values: [{ label: '', value: '', price_adjustment: 0, sort_order: 0, is_active: true, metadata: { color: '#ec168c' } }] });

export default function ProductOptionsEditor({ productId, productType, supabase }: { productId?: string; productType: string; supabase: SupabaseClient | null }) {
  const [groups, setGroups] = useState<OptionGroup[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!productId || !supabase) return;
    (async () => {
      const { data } = await supabase.from('option_groups').select('id,product_id,name,display_type,is_required,sort_order,option_values(id,option_group_id,label,value,price_adjustment,sort_order,is_active,metadata)').eq('product_id', productId).order('sort_order');
      setGroups((data || []).map((group: any) => ({ ...group, choice_type: inferChoiceType(group), values: (group.option_values || []).map((value: OptionValue) => ({ ...value, metadata: value.metadata || {} })).sort((a: OptionValue, b: OptionValue) => a.sort_order - b.sort_order) })));
    })();
  }, [productId, supabase]);

  const updateGroup = (index: number, patch: Partial<OptionGroup>) => setGroups(groups.map((group, current) => current === index ? { ...group, ...patch } : group));
  const updateValue = (groupIndex: number, valueIndex: number, patch: Partial<OptionValue>) => setGroups(groups.map((group, current) => current === groupIndex ? { ...group, values: group.values.map((value, inner) => inner === valueIndex ? { ...value, ...patch } : value) } : group));
  const removeGroup = (index: number) => setGroups(groups.filter((_, current) => current !== index));

  const addPaletteColour = (groupIndex: number, label: string, color: string) => {
    setGroups(groups.map((group, current) => {
      if (current !== groupIndex || group.values.some((value) => value.label.toLowerCase() === label.toLowerCase())) return group;
      const nextValue = { label, value: makeStoredValue(label), price_adjustment: 0, sort_order: group.values.length, is_active: true, metadata: { color } };
      const blankIndex = group.values.findIndex((value) => !value.label.trim());
      if (blankIndex < 0) return { ...group, values: [...group.values, nextValue] };
      return { ...group, values: group.values.map((value, valueIndex) => valueIndex === blankIndex ? nextValue : value) };
    }));
  };
  const setChoiceType = (index: number, choiceType: ChoiceType) => {
    const config = CHOICE_CONFIG[choiceType];
    setGroups(groups.map((group, current) => current === index ? { ...group, choice_type: choiceType, display_type: config.display, name: group.name || config.defaultName } : group));
  };

  async function save() {
    if (!productId || !supabase) return;
    setBusy(true); setMessage('');
    try {
      const { data: existing } = await supabase.from('option_groups').select('id').eq('product_id', productId);
      const keep = new Set<string>();
      for (const [groupIndex, group] of groups.entries()) {
        if (!group.name.trim()) continue;
        const { data: saved, error } = await supabase.from('option_groups').upsert({ id: group.id, product_id: productId, name: group.name.trim(), display_type: group.display_type, is_required: group.is_required, sort_order: groupIndex }, { onConflict: 'id' }).select('id').single();
        if (error) throw error;
        keep.add(saved.id);
        const validValues = group.values.filter((value) => value.label.trim());
        for (const [valueIndex, value] of validValues.entries()) {
          const { error: valueError } = await supabase.from('option_values').upsert({ id: value.id, option_group_id: saved.id, label: value.label.trim(), value: makeStoredValue(value.label), price_adjustment: Number(value.price_adjustment) || 0, sort_order: valueIndex, is_active: value.is_active, metadata: value.metadata || {} }, { onConflict: 'id' });
          if (valueError) throw valueError;
        }
      }
      const stale = (existing || []).map((row) => row.id).filter((id) => !keep.has(id));
      if (stale.length) await supabase.from('option_groups').delete().in('id', stale);
      setMessage('Choices saved.');
    } catch { setMessage('Choices could not be saved. Please try again.'); }
    finally { setBusy(false); }
  }

  if (productType !== 'configurable') return <div className="admin-card admin-card-wide admin-option-disabled"><h2>Product Choices</h2><p className="admin-muted">Product choices are available when Product type is set to Configurable.</p></div>;

  return <div className="admin-card admin-card-wide"><div className="admin-section-heading"><div><h2>Product Choices</h2><p className="admin-muted">Add the choices customers must make before ordering. The choice type sets the right customer control automatically.</p></div><button className="admin-button primary" type="button" onClick={() => setGroups([...groups, blankGroup()])} disabled={!productId}>Add another choice</button></div>{!productId && <p className="admin-muted">Save the product first, then add selectable choices.</p>}{productId && groups.map((group, groupIndex) => <div className="admin-option-group" key={group.id || groupIndex}><div className="admin-option-group-heading"><div><span className="admin-option-number">Choice {groupIndex + 1}</span><h3>{group.name || 'New choice'}</h3></div><span className="admin-muted">Customer selection</span></div><div className="admin-field-grid"><label className="admin-field"><span>Choice type</span><select value={group.choice_type} onChange={(event) => setChoiceType(groupIndex, event.target.value as ChoiceType)}>{Object.entries(CHOICE_CONFIG).map(([value, config]) => <option key={value} value={value}>{config.label}</option>)}</select></label><label className="admin-field"><span>Choice name</span><input value={group.name} placeholder={CHOICE_CONFIG[group.choice_type].defaultName || 'e.g. Outer colour'} onChange={(event) => updateGroup(groupIndex, { name: event.target.value })} /></label></div><label className="admin-toggle"><input type="checkbox" checked={group.is_required} onChange={(event) => updateGroup(groupIndex, { is_required: event.target.checked })} /><span>Customer must choose a value</span></label>{group.choice_type === 'colour' && <div className="admin-colour-palette"><div><strong>Quick colour palette</strong><span>Click a colour to add it automatically.</span></div><div className="admin-palette-swatches">{COLOUR_PALETTE.map(([label, color]) => <button key={label} className="admin-palette-swatch" type="button" title={`Add ${label}`} aria-label={`Add ${label}`} style={{ backgroundColor: color }} onClick={() => addPaletteColour(groupIndex, label, color)} />)}</div></div>}<div className="admin-option-values"><div className="admin-option-value-head"><span>Choice value</span><span>Price adjustment</span><span>{group.choice_type === 'colour' ? 'Colour' : ''}</span><span></span></div>{group.values.map((value, valueIndex) => <div className={`admin-option-value ${group.choice_type === 'colour' ? 'has-picker' : ''}`} key={value.id || valueIndex}><input aria-label="Choice value" placeholder={group.choice_type === 'colour' ? 'e.g. Black' : 'Customer-facing value'} value={value.label} onChange={(event) => updateValue(groupIndex, valueIndex, { label: event.target.value })} /><input aria-label="Price adjustment" type="number" step="0.01" value={value.price_adjustment} onChange={(event) => updateValue(groupIndex, valueIndex, { price_adjustment: Number(event.target.value) })} />{group.choice_type === 'colour' ? <input className="admin-colour-picker" aria-label="Colour" type="color" value={value.metadata?.color || '#ec168c'} onChange={(event) => updateValue(groupIndex, valueIndex, { metadata: { ...value.metadata, color: event.target.value } })} /> : <span className="admin-colour-placeholder" aria-hidden="true" />}<button className="admin-button danger" type="button" onClick={() => updateGroup(groupIndex, { values: group.values.filter((_, current) => current !== valueIndex) })}>Remove</button></div>)}</div><div className="admin-option-actions"><button className="admin-button secondary" type="button" onClick={() => updateGroup(groupIndex, { values: [...group.values, { label: '', value: '', price_adjustment: 0, sort_order: group.values.length, is_active: true, metadata: { color: '#ec168c' } }] })}>Add another value</button><button className="admin-button danger" type="button" onClick={() => removeGroup(groupIndex)}>Remove choice</button></div></div>)}{productId && groups.length > 0 && <div className="admin-option-save"><button className="admin-button primary" type="button" onClick={save} disabled={busy}>{busy ? 'Saving...' : 'Save choices'}</button>{message && <span className="admin-muted" role="status">{message}</span>}</div>}</div>;
}