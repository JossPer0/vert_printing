import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

type OptionValue = { id?: string; option_group_id?: string; label: string; value: string; price_adjustment: number; sort_order: number; is_active: boolean; metadata?: { color?: string } };
type OptionGroup = { id?: string; product_id?: string; name: string; display_type: 'select' | 'radio' | 'swatch'; is_required: boolean; sort_order: number; values: OptionValue[] };

const blankGroup = (): OptionGroup => ({ name: '', display_type: 'select', is_required: false, sort_order: 0, values: [{ label: '', value: '', price_adjustment: 0, sort_order: 0, is_active: true, metadata: { color: '#ec168c' } }] });

export default function ProductOptionsEditor({ productId, supabase }: { productId?: string; supabase: SupabaseClient | null }) {
  const [groups, setGroups] = useState<OptionGroup[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!productId || !supabase) return;
    (async () => {
      const { data } = await supabase.from('option_groups').select('id,product_id,name,display_type,is_required,sort_order,option_values(id,option_group_id,label,value,price_adjustment,sort_order,is_active)').eq('product_id', productId).order('sort_order');
      setGroups((data || []).map((group: any) => ({ ...group, values: (group.option_values || []).sort((a: OptionValue, b: OptionValue) => a.sort_order - b.sort_order) })));
    })();
  }, [productId, supabase]);

  const updateGroup = (index: number, patch: Partial<OptionGroup>) => setGroups(groups.map((group, current) => current === index ? { ...group, ...patch } : group));
  const updateValue = (groupIndex: number, valueIndex: number, patch: Partial<OptionValue>) => setGroups(groups.map((group, current) => current === groupIndex ? { ...group, values: group.values.map((value, inner) => inner === valueIndex ? { ...value, ...patch } : value) } : group));
  const removeGroup = (index: number) => setGroups(groups.filter((_, current) => current !== index));

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
        const validValues = group.values.filter((value) => value.label.trim() && value.value.trim());
        for (const [valueIndex, value] of validValues.entries()) {
          const { error: valueError } = await supabase.from('option_values').upsert({ id: value.id, option_group_id: saved.id, label: value.label.trim(), value: value.value.trim(), price_adjustment: Number(value.price_adjustment) || 0, sort_order: valueIndex, is_active: value.is_active, metadata: value.metadata || {} }, { onConflict: 'id' });
          if (valueError) throw valueError;
        }
        const keptValueIds = validValues.map((value) => value.id).filter(Boolean);
        if (keptValueIds.length) await supabase.from('option_values').delete().eq('option_group_id', saved.id).not('id', 'in', `(${keptValueIds.join(',')})`);
      }
      const stale = (existing || []).map((row) => row.id).filter((id) => !keep.has(id));
      if (stale.length) await supabase.from('option_groups').delete().in('id', stale);
      setMessage('Options saved.');
    } catch { setMessage('Options could not be saved. Please try again.'); }
    finally { setBusy(false); }
  }

  return <div className="admin-card admin-card-wide"><div className="admin-section-heading"><div><h2>Product Options</h2><p className="admin-muted">Add choices customers must make before ordering, such as colour, size or branding method. Informational details belong in Product Information.</p></div><button className="admin-button primary" type="button" onClick={() => setGroups([...groups, blankGroup()])} disabled={!productId}>Add option group</button></div>{!productId && <p className="admin-muted">Save the product first, then add selectable options.</p>}{productId && groups.map((group, groupIndex) => <div className="admin-option-group" key={group.id || groupIndex}><div className="admin-option-group-heading"><div><span className="admin-option-number">Option group {groupIndex + 1}</span><h3>{group.name || 'New option group'}</h3></div><span className="admin-muted">Customer choice</span></div><div className="admin-field-grid"><label className="admin-field"><span>Option name</span><input value={group.name} placeholder="Colour or Size" onChange={(event) => updateGroup(groupIndex, { name: event.target.value })} /></label><label className="admin-field"><span>Display style</span><select value={group.display_type} onChange={(event) => updateGroup(groupIndex, { display_type: event.target.value as OptionGroup['display_type'] })}><option value="select">Dropdown</option><option value="radio">Radio buttons</option><option value="swatch">Colour swatches</option></select></label></div><label className="admin-toggle"><input type="checkbox" checked={group.is_required} onChange={(event) => updateGroup(groupIndex, { is_required: event.target.checked })} /><span>Customer must choose a value</span></label><div className="admin-option-values"><div className="admin-option-value-head"><span>Customer label</span><span>Stored value</span><span>Price adjustment</span><span></span></div>{group.values.map((value, valueIndex) => <div className={`admin-option-value ${group.name.trim().toLowerCase() === 'colour' && group.display_type === 'swatch' ? 'has-picker' : ''}`} key={value.id || valueIndex}><input aria-label="Option label" placeholder="Customer-facing label" value={value.label} onChange={(event) => updateValue(groupIndex, valueIndex, { label: event.target.value })} /><input aria-label="Option value" placeholder="Stored value" value={value.value} onChange={(event) => updateValue(groupIndex, valueIndex, { value: event.target.value })} /><input aria-label="Price adjustment" type="number" step="0.01" value={value.price_adjustment} onChange={(event) => updateValue(groupIndex, valueIndex, { price_adjustment: Number(event.target.value) })} />{group.name.trim().toLowerCase() === 'colour' && group.display_type === 'swatch' && <input className="admin-colour-picker" aria-label="Colour" type="color" value={value.metadata?.color || '#ec168c'} onChange={(event) => updateValue(groupIndex, valueIndex, { metadata: { ...value.metadata, color: event.target.value } })} />}<button className="admin-button danger" type="button" onClick={() => updateGroup(groupIndex, { values: group.values.filter((_, current) => current !== valueIndex) })}>Remove</button></div>)}</div><div className="admin-option-actions"><button className="admin-button secondary" type="button" onClick={() => updateGroup(groupIndex, { values: [...group.values, { label: '', value: '', price_adjustment: 0, sort_order: group.values.length, is_active: true, metadata: { color: '#ec168c' } }] })}>Add value</button><button className="admin-button danger" type="button" onClick={() => removeGroup(groupIndex)}>Remove group</button></div></div>)}{productId && groups.length > 0 && <div className="admin-option-save"><button className="admin-button primary" type="button" onClick={save} disabled={busy}>{busy ? 'Saving...' : 'Save options'}</button>{message && <span className="admin-muted" role="status">{message}</span>}</div>}</div>;
}