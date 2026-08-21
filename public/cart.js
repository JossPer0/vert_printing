const root = document.querySelector('#cart-root');
const CART_KEY = 'vert-cart-v1';
const money = (value) => `R${Number(value).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
const readCart = () => { try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; } };
const saveCart = (cart) => { localStorage.setItem(CART_KEY, JSON.stringify(cart)); document.dispatchEvent(new CustomEvent('vert-cart-updated')); };

function normaliseItem(item) {
  return {
    ...item,
    quantity: Math.max(1, Number.parseInt(item.quantity, 10) || 1),
    price: Number(item.price || 0),
    options: Array.isArray(item.options) ? item.options : [],
  };
}

function cartTotal(cart) {
  return cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
}

function optionList(item) {
  if (!item.options.length) return '';
  return `<ul class="cart-options">${item.options.map((option) => `<li>${escapeHtml(option.label || `${option.groupName}: ${option.valueLabel}`)}</li>`).join('')}</ul>`;
}

function emptyCart() {
  root.innerHTML = `<div class="cart-empty"><p class="section-kicker">Your order</p><h1>Your cart is empty.</h1><p>Choose a product from the shop to start an order.</p><a class="button primary" href="/shop">Browse the shop</a></div>`;
}

function renderConfirmation(orderNumber) {
  root.innerHTML = `<div class="cart-confirmation"><p class="section-kicker">Order received</p><h1>Thanks, your order request has been sent.</h1><p>Reference <strong>${escapeHtml(orderNumber)}</strong>. We will review the details and confirm collection, delivery and payment before production starts.</p><div class="cart-actions"><a class="button primary" href="/shop">Continue shopping</a><a class="button secondary" href="/">Back to home</a></div></div>`;
}

function render() {
  const cart = readCart().map(normaliseItem);
  saveCart(cart);
  if (!cart.length) { emptyCart(); return; }
  const total = cartTotal(cart);
  root.innerHTML = `
    <div class="cart-heading">
      <div><p class="section-kicker">Your order</p><h1>Review your order.</h1><p>Check your products, choices and quantities before sending the order request.</p></div>
      <a class="shop-quote-link" href="/shop">Continue shopping -&gt;</a>
    </div>
    <div class="cart-layout">
      <div class="cart-items" aria-label="Cart items">
        ${cart.map((item, index) => `<article class="cart-item">
          <div class="cart-item-main">
            <h2>${escapeHtml(item.name)}</h2>
            ${optionList(item)}
            <p>${money(item.price)} each</p>
            <div class="cart-item-controls">
              <label>Quantity<input class="cart-quantity" data-index="${index}" type="number" min="1" value="${item.quantity}" /></label>
              <button class="text-button cart-remove" data-index="${index}" type="button">Remove</button>
            </div>
          </div>
          <strong>${money(item.price * item.quantity)}</strong>
        </article>`).join('')}
      </div>
      <aside class="cart-summary">
        <h2>Order summary</h2>
        <div><span>Subtotal</span><strong>${money(total)}</strong></div>
        <p>Totals are checked again before the order is saved. Payment is not taken online yet.</p>
      </aside>
    </div>
    <form class="cart-checkout" id="cart-checkout-form">
      <div class="cart-form-heading"><p class="section-kicker">Order details</p><h2>Where should we send the confirmation?</h2><p>We will confirm payment and production timing before anything goes ahead.</p></div>
      <div class="cart-form-grid">
        <label><span>First name</span><input name="first_name" autocomplete="given-name" required /></label>
        <label><span>Surname</span><input name="last_name" autocomplete="family-name" required /></label>
        <label><span>Email</span><input name="email" type="email" autocomplete="email" required /></label>
        <label><span>Phone or WhatsApp</span><input name="phone" autocomplete="tel" required /></label>
        <label class="cart-full"><span>Business or organisation</span><input name="company_name" autocomplete="organization" /></label>
      </div>
      <fieldset class="cart-fulfilment">
        <legend>Collection or delivery</legend>
        <label><input type="radio" name="fulfilment_method" value="collection" checked /> <span>Collect from Vert Printing by appointment</span></label>
        <label><input type="radio" name="fulfilment_method" value="delivery" /> <span>Ask Vert to confirm delivery options</span></label>
      </fieldset>
      <label class="cart-full"><span>Order notes</span><textarea name="customer_note" rows="4" placeholder="Deadline, colour notes, artwork details or anything we should know."></textarea></label>
      <label class="cart-check"><input type="checkbox" name="marketing_opt_in" /> <span>Keep me updated about Vert Printing products and services.</span></label>
      <label class="cart-check"><input type="checkbox" name="terms" required /> <span>I understand Vert will confirm payment, artwork and production details before starting.</span></label>
      <div class="turnstile-field"><div class="cf-turnstile" data-sitekey="0x4AAAAAAEEbOXRF_g_FNQHQ" data-action="turnstile-spin-v2"></div></div>
      <div class="cart-submit-row"><button class="button primary" type="submit">Send order request</button><p class="cart-form-status" role="status"></p></div>
    </form>`;

  root.querySelectorAll('.cart-quantity').forEach((input) => input.addEventListener('change', (event) => {
    const index = Number(event.currentTarget.dataset.index);
    const next = readCart().map(normaliseItem);
    next[index].quantity = Math.max(1, Number(event.currentTarget.value) || 1);
    saveCart(next);
    render();
  }));
  root.querySelectorAll('.cart-remove').forEach((button) => button.addEventListener('click', (event) => {
    const next = readCart().map(normaliseItem);
    next.splice(Number(event.currentTarget.dataset.index), 1);
    saveCart(next);
    render();
  }));
  root.querySelector('#cart-checkout-form')?.addEventListener('submit', submitOrder);
}

async function submitOrder(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button[type="submit"]');
  const status = form.querySelector('.cart-form-status');
  const formData = new FormData(form);
  const turnstileToken = formData.get('cf-turnstile-response');
  if (!turnstileToken) {
    status.textContent = 'Please complete the human verification.';
    return;
  }
  button.disabled = true;
  status.textContent = 'Sending your order request...';
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        items: readCart().map(normaliseItem),
        customer: {
          first_name: formData.get('first_name'),
          last_name: formData.get('last_name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          company_name: formData.get('company_name'),
          marketing_opt_in: formData.get('marketing_opt_in') === 'on',
        },
        fulfilment_method: formData.get('fulfilment_method'),
        customer_note: formData.get('customer_note'),
        turnstileToken,
      }),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || 'We could not send your order request right now.');
    localStorage.removeItem(CART_KEY);
    document.dispatchEvent(new CustomEvent('vert-cart-updated'));
    renderConfirmation(result.order_number);
  } catch (error) {
    status.textContent = error.message || 'We could not send your order request right now.';
    window.turnstile?.reset();
    button.disabled = false;
  }
}

render();