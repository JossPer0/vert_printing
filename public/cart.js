const root = document.querySelector('#cart-root');
const CART_KEY = 'vert-cart-v1';
const money = (value) => `R${Number(value).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
const readCart = () => { try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; } };
const saveCart = (cart) => localStorage.setItem(CART_KEY, JSON.stringify(cart));

function render() {
  const cart = readCart();
  if (!cart.length) { root.innerHTML = `<p class="section-kicker">Your order</p><h1>Your cart is empty.</h1><p>Choose a product from the shop to start an order.</p><a class="button primary" href="/shop">Browse the shop</a>`; return; }
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  root.innerHTML = `<div class="cart-heading"><div><p class="section-kicker">Your order</p><h1>Review your order.</h1><p>Check your products and choices before moving on to order details.</p></div><a class="shop-quote-link" href="/shop">Continue shopping -&gt;</a></div><div class="cart-layout"><div class="cart-items">${cart.map((item, index) => `<article class="cart-item"><div><h2>${escapeHtml(item.name)}</h2>${item.options?.length ? `<ul>${item.options.map((option) => `<li>${escapeHtml(option.label)}</li>`).join('')}</ul>` : ''}<p>${money(item.price)} each</p><label>Quantity<input class="cart-quantity" data-index="${index}" type="number" min="1" value="${item.quantity}" /></label><button class="text-button cart-remove" data-index="${index}" type="button">Remove</button></div><strong>${money(item.price * item.quantity)}</strong></article>`).join('')}</div><aside class="cart-summary"><h2>Order summary</h2><div><span>Subtotal</span><strong>${money(total)}</strong></div><p>Payment and fulfilment details will be confirmed before your order is finalised.</p><a class="button primary" href="/#quote">Continue to order details</a></aside></div>`;
  root.querySelectorAll('.cart-quantity').forEach((input) => input.addEventListener('change', (event) => { const index = Number(event.currentTarget.dataset.index); const next = readCart(); next[index].quantity = Math.max(1, Number(event.currentTarget.value) || 1); saveCart(next); render(); }));
  root.querySelectorAll('.cart-remove').forEach((button) => button.addEventListener('click', (event) => { const next = readCart(); next.splice(Number(event.currentTarget.dataset.index), 1); saveCart(next); render(); }));
}
render();