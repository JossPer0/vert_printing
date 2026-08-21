const summary = document.querySelector('.product-summary');
const cta = summary?.querySelector('.button.primary');
const slug = window.location.pathname.split('/').filter(Boolean).pop();
const CART_KEY = 'vert-cart-v1';

function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }
function money(value) { return `R${Number(value).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function isQuoteOnly(product) { return product.product_type === 'quote_only' || product.pricing_mode === 'quote_only'; }
function isConfigurable(product) { return product.product_type === 'configurable' || product.pricing_mode === 'from_price'; }
function activeValues(group) {
  return (group.option_values || [])
    .filter((value) => value.is_active !== false)
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
}
function selectedControls() {
  return [...(summary.querySelectorAll('.product-options input:checked, .product-options select option:checked') || [])].filter((control) => control.value);
}
function requiredChoicesMade(groups, requireEveryGroup = false) {
  return groups.every((group) => {
    if (!requireEveryGroup && !group.is_required) return true;
    const name = `option-${group.id}`;
    if (group.display_type === 'select') return Boolean(summary.querySelector(`select[name="${name}"]`)?.value);
    return Boolean(summary.querySelector(`input[name="${name}"]:checked`));
  });
}
function setButtonState(enabled, text = 'Add to Cart') {
  cta.textContent = text;
  if (enabled) cta.removeAttribute('disabled');
  else cta.setAttribute('disabled', 'disabled');
}

async function loadOptions() {
  if (!summary || !cta || !slug) return;
  try {
    const config = await fetch('/api/config', { cache: 'no-store' }).then((response) => response.json());
    if (!config.supabaseUrl || !config.supabaseAnonKey) return;
    const headers = { apikey: config.supabaseAnonKey, Authorization: `Bearer ${config.supabaseAnonKey}` };
    const products = await fetch(`${config.supabaseUrl}/rest/v1/products?select=id,name,slug,product_type,pricing_mode,base_price&slug=eq.${encodeURIComponent(slug)}&limit=1`, { headers }).then((response) => response.json());
    const product = products[0];
    if (!product || isQuoteOnly(product)) return;

    const configurable = isConfigurable(product);
    setButtonState(false, configurable ? 'Choose options first' : 'Checking options...');

    const groups = await fetch(`${config.supabaseUrl}/rest/v1/option_groups?select=id,name,display_type,is_required,sort_order,option_values(id,label,value,price_adjustment,is_active,metadata,sort_order)&product_id=eq.${product.id}&order=sort_order.asc`, { headers }).then((response) => response.json());
    if (!Array.isArray(groups)) throw new Error('Options unavailable');
    const usable = groups.filter((group) => activeValues(group).length > 0);

    if (usable.length) {
      const root = document.createElement('section');
      root.className = 'product-options';
      root.innerHTML = `<h2>Choose your options</h2><p>Select the choices you would like included in your order.</p>${usable.map((group) => {
        const values = activeValues(group);
        const name = `option-${group.id}`;
        const required = group.is_required ? ' required' : '';
        if (group.display_type === 'swatch') return `<fieldset class="product-option-group"><legend>${escapeHtml(group.name)}${group.is_required ? ' *' : ''}</legend><div class="product-option-swatches">${values.map((value) => `<label class="product-option-swatch"><input type="radio" name="${name}" value="${escapeHtml(value.value)}" data-option-label="${escapeHtml(group.name)}: ${escapeHtml(value.label)}" data-option-group-id="${escapeHtml(group.id)}" data-option-group-name="${escapeHtml(group.name)}" data-option-value-id="${escapeHtml(value.id)}" data-option-value-label="${escapeHtml(value.label)}" data-price-adjustment="${Number(value.price_adjustment) || 0}"${required}><span class="product-option-swatch-ui" style="--swatch-color:${/^#[0-9a-f]{6}$/i.test(value.metadata?.color || '') ? value.metadata.color : '#ec168c'}" title="${escapeHtml(value.label)}"><span class="product-option-swatch-dot"></span><span>${escapeHtml(value.label)}</span></span></label>`).join('')}</div></fieldset>`;
        if (group.display_type === 'radio') return `<fieldset class="product-option-group"><legend>${escapeHtml(group.name)}${group.is_required ? ' *' : ''}</legend><div class="product-option-radioes">${values.map((value) => `<label><input type="radio" name="${name}" value="${escapeHtml(value.value)}" data-option-label="${escapeHtml(group.name)}: ${escapeHtml(value.label)}" data-option-group-id="${escapeHtml(group.id)}" data-option-group-name="${escapeHtml(group.name)}" data-option-value-id="${escapeHtml(value.id)}" data-option-value-label="${escapeHtml(value.label)}" data-price-adjustment="${Number(value.price_adjustment) || 0}"${required}>${escapeHtml(value.label)}</label>`).join('')}</div></fieldset>`;
        return `<label class="product-option-select"><span>${escapeHtml(group.name)}${group.is_required ? ' *' : ''}</span><select name="${name}" data-option-label="${escapeHtml(group.name)}" data-option-group-id="${escapeHtml(group.id)}" data-option-group-name="${escapeHtml(group.name)}"${required}><option value="">Choose ${escapeHtml(group.name.toLowerCase())}</option>${values.map((value) => `<option value="${escapeHtml(value.value)}" data-option-value-id="${escapeHtml(value.id)}" data-option-value-label="${escapeHtml(value.label)}" data-price-adjustment="${Number(value.price_adjustment) || 0}">${escapeHtml(value.label)}${Number(value.price_adjustment) ? ` (${Number(value.price_adjustment) > 0 ? '+' : ''}${money(value.price_adjustment)})` : ''}</option>`).join('')}</select></label>`;
      }).join('')}`;
      cta.before(root);
      cta.classList.add('product-request-button');
      const updateState = () => {
        const ready = requiredChoicesMade(usable, true);
        setButtonState(ready, ready ? 'Add to Cart' : 'Choose options first');
      };
      root.addEventListener('change', updateState);
      updateState();
    } else if (configurable) {
      const root = document.createElement('section');
      root.className = 'product-options product-options-empty';
      root.innerHTML = '<h2>Choose your options</h2><p>This product still needs options added before it can be ordered online.</p><a class="button secondary" href="/#quote">Request help ordering</a>';
      cta.before(root);
      setButtonState(false, 'Options unavailable');
      return;
    }

    cta.removeAttribute('href');
    cta.setAttribute('type', 'button');
    if (!usable.length && !configurable) setButtonState(true);
    cta.addEventListener('click', () => {
      if (cta.disabled) return;
      const invalid = summary.querySelector('.product-options :invalid');
      if (invalid) { invalid.focus(); return; }
            const options = selectedControls().map((control) => {
        const select = control.closest('select');
        const groupName = control.dataset.optionGroupName || select?.dataset.optionGroupName || select?.dataset.optionLabel || '';
        const valueLabel = control.dataset.optionValueLabel || control.textContent?.trim() || '';
        return {
          groupId: control.dataset.optionGroupId || select?.dataset.optionGroupId || '',
          groupName,
          valueId: control.dataset.optionValueId || '',
          value: control.value,
          valueLabel,
          label: control.dataset.optionLabel || `${groupName}: ${valueLabel}`,
          priceAdjustment: Number(control.dataset.priceAdjustment || 0),
        };
      });
      const item = { id: product.id, name: product.name, slug: product.slug, price: Number(product.base_price || 0) + options.reduce((total, option) => total + option.priceAdjustment, 0), quantity: 1, options };
      const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      const existing = cart.find((current) => current.id === item.id && JSON.stringify(current.options) === JSON.stringify(item.options));
      if (existing) existing.quantity += 1; else cart.push(item);
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
      window.location.href = '/cart';
    });
  } catch {
    if (cta?.dataset.productAction) setButtonState(false, 'Options unavailable');
  }
}
loadOptions();
