const summary = document.querySelector('.product-summary');
const cta = summary?.querySelector('.button.primary');
const slug = window.location.pathname.split('/').filter(Boolean).pop();

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

async function loadOptions() {
  if (!summary || !cta || !slug) return;
  try {
    const config = await fetch('/api/config', { cache: 'no-store' }).then((response) => response.json());
    if (!config.supabaseUrl || !config.supabaseAnonKey) return;
    const headers = { apikey: config.supabaseAnonKey, Authorization: `Bearer ${config.supabaseAnonKey}` };
    const product = await fetch(`${config.supabaseUrl}/rest/v1/products?select=id&slug=eq.${encodeURIComponent(slug)}&limit=1`, { headers }).then((response) => response.json());
    if (!product[0]) return;
    const groups = await fetch(`${config.supabaseUrl}/rest/v1/option_groups?select=id,name,display_type,is_required,sort_order,option_values(id,label,value,price_adjustment,is_active,metadata,sort_order)&product_id=eq.${product[0].id}&order=sort_order.asc`, { headers }).then((response) => response.json());
    const usable = groups.filter((group) => group.option_values?.some((value) => value.is_active !== false));
    if (!usable.length) return;
    const root = document.createElement('section');
    root.className = 'product-options';
    root.innerHTML = `<h2>Choose your options</h2><p>Select the choices you would like included in your enquiry.</p>${usable.map((group) => {
      const values = group.option_values.filter((value) => value.is_active !== false).sort((a, b) => a.sort_order - b.sort_order);
      const name = `option-${group.id}`;
      const required = group.is_required ? ' required' : '';
      if (group.display_type === 'swatch') return `<fieldset class="product-option-group"><legend>${escapeHtml(group.name)}${group.is_required ? ' *' : ''}</legend><div class="product-option-swatches">${values.map((value) => `<label class="product-option-swatch"><input type="radio" name="${name}" value="${escapeHtml(value.value)}" data-option-label="${escapeHtml(group.name)}: ${escapeHtml(value.label)}"${required}><span style="--swatch-color:${/^#[0-9a-f]{6}$/i.test(value.metadata?.color || '') ? value.metadata.color : '#ec168c'}" title="${escapeHtml(value.label)}"><span class="sr-only">${escapeHtml(value.label)}</span></span></label>`).join('')}</div></fieldset>`;
      if (group.display_type === 'radio') return `<fieldset class="product-option-group"><legend>${escapeHtml(group.name)}${group.is_required ? ' *' : ''}</legend><div class="product-option-radioes">${values.map((value) => `<label><input type="radio" name="${name}" value="${escapeHtml(value.value)}" data-option-label="${escapeHtml(group.name)}: ${escapeHtml(value.label)}"${required}>${escapeHtml(value.label)}</label>`).join('')}</div></fieldset>`;
      return `<label class="product-option-select"><span>${escapeHtml(group.name)}${group.is_required ? ' *' : ''}</span><select name="${name}" data-option-label="${escapeHtml(group.name)}"${required}><option value="">Choose ${escapeHtml(group.name.toLowerCase())}</option>${values.map((value) => `<option value="${escapeHtml(value.value)}" data-option-value-label="${escapeHtml(value.label)}">${escapeHtml(value.label)}</option>`).join('')}</select></label>`;
    }).join('')}`;
    cta.before(root);
    cta.classList.add('product-request-button');
    cta.removeAttribute('href');
    cta.setAttribute('type', 'button');
    cta.addEventListener('click', () => {
      const selected = [...root.querySelectorAll('input:checked, select option:checked')].filter((control) => control.value).map((control) => control.dataset.optionLabel || `${control.closest('select')?.dataset.optionLabel}: ${control.textContent}`);
      if (root.querySelector(':invalid')) { root.querySelector(':invalid').focus(); return; }
      sessionStorage.setItem('vert-product-request', JSON.stringify({ product: cta.dataset.productName || document.querySelector('.product-summary h1')?.textContent?.trim() || '', options: selected }));
      window.location.href = '/?product=' + encodeURIComponent(cta.dataset.productName || '') + '#quote';
    });
  } catch { /* The product remains usable through the existing enquiry link. */ }
}

loadOptions();