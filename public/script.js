try {
  const pendingProduct = JSON.parse(sessionStorage.getItem('vert-product-request') || 'null');
  if (pendingProduct) {
    const productField = document.querySelector('#quote-form input[name="product"]');
    const detailsField = document.querySelector('#quote-form textarea[name="details"]');
    if (productField && pendingProduct.product) productField.value = pendingProduct.product;
    if (detailsField && pendingProduct.options?.length) detailsField.value = `Selected options: ${pendingProduct.options.join(', ')}`;
    sessionStorage.removeItem('vert-product-request');
  }
} catch { /* Ignore unavailable session storage. */ }
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const quoteForm = document.querySelector("#quote-form");
const formNote = document.querySelector("#form-note");
const CART_KEY = 'vert-cart-v1';
const cartCountBadges = document.querySelectorAll('[data-cart-count]');

function readCartCount() {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    if (!Array.isArray(cart)) return 0;
    return cart.reduce((total, item) => total + (Number.parseInt(item.quantity, 10) || 0), 0);
  } catch {
    return 0;
  }
}

function updateCartCount() {
  const count = readCartCount();
  cartCountBadges.forEach((badge) => {
    badge.textContent = String(count);
    badge.hidden = count === 0;
  });
}

updateCartCount();
window.addEventListener('storage', updateCartCount);
document.addEventListener('vert-cart-updated', updateCartCount);

navToggle?.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

siteNav?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    siteNav.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
  }
});

function setFormState(message, type = "info") {
  if (!formNote) return;
  formNote.textContent = message;
  formNote.dataset.type = type;
}

quoteForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = quoteForm.querySelector('button[type="submit"]');
  const formData = new FormData(quoteForm);

  if (formData.get("website")) return;

  const turnstileToken = formData.get("cf-turnstile-response");
  if (!turnstileToken) {
    setFormState("Please complete the human verification before sending your quote request.", "error");
    return;
  }

  const payload = Object.fromEntries(formData.entries());
  payload.turnstileToken = turnstileToken;
  delete payload["cf-turnstile-response"];
  delete payload.artwork;

  submitButton.disabled = true;
  setFormState("Sending your quote request...", "info");

  try {
    const response = await fetch("/api/quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.ok) {
      throw new Error(result.error || "Your quote request could not be sent. Please try again.");
    }

    quoteForm.reset();
    window.turnstile?.reset();
    setFormState(result.message || "Thanks — your quote request has been received.", "success");
  } catch (error) {
    window.turnstile?.reset();
    setFormState(error.message || "Your quote request could not be sent. Please email or WhatsApp us directly.", "error");
  } finally {
    submitButton.disabled = false;
  }
});