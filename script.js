const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const quoteForm = document.querySelector("#quote-form");
const formNote = document.querySelector("#form-note");

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

quoteForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = new FormData(quoteForm);
  if (data.get("website")) return;

  const subject = `Quote request: ${data.get("service") || "Vert Printing"}`;
  const body = [
    `Name: ${data.get("name") || ""}`,
    `Business or organisation: ${data.get("business") || ""}`,
    `Email: ${data.get("email") || ""}`,
    `Phone or WhatsApp: ${data.get("phone") || ""}`,
    `Preferred contact method: ${data.get("contact_method") || ""}`,
    `Service required: ${data.get("service") || ""}`,
    `Product or item: ${data.get("product") || ""}`,
    `Quantity: ${data.get("quantity") || ""}`,
    `Required date: ${data.get("required_date") || ""}`,
    "",
    "Project details:",
    data.get("details") || "",
    "",
    "Artwork: Please attach artwork or logo files to this email if available.",
  ].join("\n");

  const mailto = `mailto:info@vertprinting.co.za?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
  formNote.textContent = "Thanks. Your email app should open with the quote details prepared. Please attach artwork files before sending if needed.";
});