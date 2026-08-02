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
  const subject = `Quote request: ${data.get("service") || "Vert Printing"}`;
  const body = [
    `Name: ${data.get("name") || ""}`,
    `Email: ${data.get("email") || ""}`,
    `Service: ${data.get("service") || ""}`,
    `Quantity: ${data.get("quantity") || ""}`,
    "",
    "Project details:",
    data.get("details") || "",
  ].join("\n");

  const mailto = `mailto:info@vertprinting.co.za?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
  formNote.textContent = "Your email app should open with the quote details prepared.";
});
