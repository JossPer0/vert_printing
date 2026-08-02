const POSTMARK_API_URL = "https://api.postmarkapp.com/email";
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const requiredFields = ["name", "email", "phone", "service"];

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function clean(value) {
  return String(value || "").trim();
}

function escapeHtml(value) {
  return clean(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildText(data) {
  return [
    "New quote request from Vert Printing website",
    "",
    `Name: ${data.name}`,
    `Business or organisation: ${data.business || ""}`,
    `Email: ${data.email}`,
    `Phone or WhatsApp: ${data.phone}`,
    `Preferred contact method: ${data.contact_method || ""}`,
    `Service required: ${data.service}`,
    `Product or item: ${data.product || ""}`,
    `Quantity: ${data.quantity || ""}`,
    `Required date: ${data.required_date || ""}`,
    "",
    "Project details:",
    data.details || "",
  ].join("\n");
}

function buildHtml(data) {
  const rows = [
    ["Name", data.name],
    ["Business or organisation", data.business],
    ["Email", data.email],
    ["Phone or WhatsApp", data.phone],
    ["Preferred contact method", data.contact_method],
    ["Service required", data.service],
    ["Product or item", data.product],
    ["Quantity", data.quantity],
    ["Required date", data.required_date],
  ]
    .map(([label, value]) => `<tr><th align="left" style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(label)}</th><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(value)}</td></tr>`)
    .join("");

  return `
    <h2>New quote request from Vert Printing website</h2>
    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;min-width:320px;">${rows}</table>
    <h3>Project details</h3>
    <p style="white-space:pre-line;">${escapeHtml(data.details)}</p>
  `;
}

async function verifyTurnstile(token, secret, remoteIp) {
  if (!secret) return { success: false, error: "Turnstile is not configured." };
  if (!token) return { success: false, error: "Please complete the human verification." };

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) return { success: false, error: "Human verification could not be checked." };
  return response.json();
}

export async function onRequestPost({ request, env }) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request." }, 400);
  }

  const data = Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, clean(value)]));

  if (data.website) return jsonResponse({ ok: true });

  const missing = requiredFields.filter((field) => !data[field]);
  if (missing.length) return jsonResponse({ error: "Please complete the required fields." }, 400);

  const turnstile = await verifyTurnstile(data.turnstileToken, env.TURNSTILE_SECRET, request.headers.get("CF-Connecting-IP"));
  if (!turnstile.success) return jsonResponse({ error: "Please confirm you are human and try again." }, 400);

  if (!env.POSTMARK_SERVER_TOKEN || !env.POSTMARK_FROM_EMAIL || !env.QUOTE_TO_EMAIL) {
    return jsonResponse({ error: "Quote email is not configured yet." }, 500);
  }

  const postmarkResponse = await fetch(POSTMARK_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-postmark-server-token": env.POSTMARK_SERVER_TOKEN,
    },
    body: JSON.stringify({
      From: env.POSTMARK_FROM_EMAIL,
      To: env.QUOTE_TO_EMAIL,
      ReplyTo: data.email,
      Subject: `Quote request: ${data.service}`,
      TextBody: buildText(data),
      HtmlBody: buildHtml(data),
      MessageStream: env.POSTMARK_MESSAGE_STREAM || "outbound",
    }),
  });

  if (!postmarkResponse.ok) {
    const details = await postmarkResponse.text();
    console.error("Postmark send failed", details);
    return jsonResponse({ error: "We could not send your quote request. Please email or WhatsApp us directly." }, 502);
  }

  return jsonResponse({ ok: true, message: "Thanks — your quote request has been received. We’ll review the details and get back to you as soon as possible." });
}

export function onRequestGet() {
  return jsonResponse({ error: "Method not allowed." }, 405);
}