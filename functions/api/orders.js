const POSTMARK_API_URL = "https://api.postmarkapp.com/email";
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function clean(value, max = 500) {
  return String(value || "").trim().slice(0, max);
}

function money(value) {
  return `R${Number(value).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function escapeHtml(value) {
  return clean(value, 5000)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cents(value) {
  return Math.round(Number(value || 0) * 100);
}

function fromCents(value) {
  return Number((value / 100).toFixed(2));
}

function postgrestIn(ids) {
  return `in.(${ids.join(",")})`;
}

function supabaseAdminHeaders(env, prefer) {
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = {
    apikey: key,
    "content-type": "application/json",
    Prefer: prefer,
  };

  // Legacy service_role keys are JWTs and can be used as a Bearer token.
  // New Supabase sb_secret_* keys are not JWTs; send them as apikey only.
  if (!String(key || "").startsWith("sb_secret_")) {
    headers.Authorization = `Bearer ${key}`;
  }

  return headers;
}

async function supabaseFetch(env, path, options = {}) {
  const response = await fetch(`${env.PUBLIC_SUPABASE_URL}/rest/v1/${path}`, {
    method: options.method || "GET",
    headers: supabaseAdminHeaders(env, options.prefer || "return=representation"),
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    console.error("Supabase order API failed", options.label || path.split("?")[0], response.status, text);
    throw new Error("supabase");
  }
  return data;
}

function normaliseCartItem(item) {
  return {
    id: clean(item.id, 80),
    quantity: Math.max(1, Math.min(999, Number.parseInt(item.quantity, 10) || 1)),
    options: Array.isArray(item.options) ? item.options : [],
  };
}

function optionMatches(selected, group, value) {
  if (selected.valueId && selected.valueId === value.id) return true;
  if (selected.groupId && selected.groupId !== group.id) return false;
  if (selected.value && selected.value === value.value) return true;
  const label = `${group.name}: ${value.label}`.toLowerCase();
  return clean(selected.label, 300).toLowerCase() === label;
}

function validateCustomer(customer) {
  const firstName = clean(customer?.first_name, 80);
  const lastName = clean(customer?.last_name, 80);
  const email = clean(customer?.email, 160).toLowerCase();
  const phone = clean(customer?.phone, 60);
  if (!firstName || !lastName || !email || !phone) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return {
    first_name: firstName,
    last_name: lastName,
    company_name: clean(customer?.company_name, 120) || null,
    email,
    phone,
    marketing_opt_in: Boolean(customer?.marketing_opt_in),
  };
}

function buildOrderText(order, items) {
  return [
    `New Vert Printing order request: ${order.order_number}`,
    "",
    `Customer: ${order.customer_name}`,
    `Company: ${order.company_name || ""}`,
    `Email: ${order.customer_email}`,
    `Phone: ${order.customer_phone}`,
    `Fulfilment: ${order.fulfilment_method}`,
    `Total: ${money(order.grand_total)}`,
    "",
    "Items:",
    ...items.map((item) => {
      const options = (item.options_snapshot || []).map((option) => `    - ${option.label}`).join("\n");
      return `  ${item.quantity} x ${item.product_name_snapshot} @ ${money(item.unit_price)} = ${money(item.line_total)}${options ? `\n${options}` : ""}`;
    }),
    "",
    "Customer note:",
    order.customer_note || "",
  ].join("\n");
}

function buildOrderHtml(order, items) {
  const rows = items.map((item) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(item.quantity)} x ${escapeHtml(item.product_name_snapshot)}${(item.options_snapshot || []).length ? `<br><small>${(item.options_snapshot || []).map((option) => escapeHtml(option.label)).join("<br>")}</small>` : ""}</td>
      <td align="right" style="padding:8px;border-bottom:1px solid #eee;">${money(item.line_total)}</td>
    </tr>
  `).join("");
  return `
    <h2>New Vert Printing order request: ${escapeHtml(order.order_number)}</h2>
    <p><strong>${escapeHtml(order.customer_name)}</strong><br>${escapeHtml(order.customer_email)}<br>${escapeHtml(order.customer_phone)}</p>
    <p>Fulfilment: ${escapeHtml(order.fulfilment_method)}</p>
    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;min-width:320px;">${rows}<tr><th align="left" style="padding:8px;">Total</th><th align="right" style="padding:8px;">${money(order.grand_total)}</th></tr></table>
    ${order.customer_note ? `<h3>Customer note</h3><p style="white-space:pre-line;">${escapeHtml(order.customer_note)}</p>` : ""}
  `;
}

function buildCustomerOrderText(order, items) {
  return [
    `Thanks, ${order.customer_name}.`,
    "",
    `We have received your Vert Printing order request: ${order.order_number}`,
    "",
    "Items:",
    ...items.map((item) => {
      const options = (item.options_snapshot || []).map((option) => `    - ${option.label}`).join("\n");
      return `  ${item.quantity} x ${item.product_name_snapshot} - ${money(item.line_total)}${options ? `\n${options}` : ""}`;
    }),
    "",
    `Order total: ${money(order.grand_total)}`,
    "",
    "Payment has not been taken online. Vert Printing will confirm payment, artwork and production details before anything goes ahead.",
    "",
    "Vert Printing",
  ].join("\n");
}

function buildCustomerOrderHtml(order, items) {
  const rows = items.map((item) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(item.quantity)} x ${escapeHtml(item.product_name_snapshot)}${(item.options_snapshot || []).length ? `<br><small>${(item.options_snapshot || []).map((option) => escapeHtml(option.label)).join("<br>")}</small>` : ""}</td>
      <td align="right" style="padding:8px;border-bottom:1px solid #eee;">${money(item.line_total)}</td>
    </tr>
  `).join("");
  return `
    <h2>Thanks, ${escapeHtml(order.customer_name)}.</h2>
    <p>We have received your Vert Printing order request <strong>${escapeHtml(order.order_number)}</strong>.</p>
    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;min-width:320px;">${rows}<tr><th align="left" style="padding:8px;">Order total</th><th align="right" style="padding:8px;">${money(order.grand_total)}</th></tr></table>
    <p>Payment has not been taken online. Vert Printing will confirm payment, artwork and production details before anything goes ahead.</p>
  `;
}

async function verifyTurnstile(token, secret, remoteIp) {
  if (!secret) return { success: false };
  if (!token) return { success: false };
  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);
  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) return { success: false };
  return response.json();
}
async function notify(env, order, items) {
  if (!env.POSTMARK_SERVER_TOKEN || !env.POSTMARK_FROM_EMAIL || !env.QUOTE_TO_EMAIL) return;
  const businessResponse = await fetch(POSTMARK_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-postmark-server-token": env.POSTMARK_SERVER_TOKEN,
    },
    body: JSON.stringify({
      From: env.POSTMARK_FROM_EMAIL,
      To: env.QUOTE_TO_EMAIL,
      ReplyTo: order.customer_email,
      Subject: `Order request ${order.order_number}`,
      TextBody: buildOrderText(order, items),
      HtmlBody: buildOrderHtml(order, items),
      MessageStream: env.POSTMARK_MESSAGE_STREAM || "outbound",
    }),
  });
  if (!businessResponse.ok) console.error("Postmark order notification failed", await businessResponse.text());

  const customerResponse = await fetch(POSTMARK_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-postmark-server-token": env.POSTMARK_SERVER_TOKEN,
    },
    body: JSON.stringify({
      From: env.POSTMARK_FROM_EMAIL,
      To: order.customer_email,
      ReplyTo: env.QUOTE_TO_EMAIL,
      Subject: `Vert Printing order request ${order.order_number}`,
      TextBody: buildCustomerOrderText(order, items),
      HtmlBody: buildCustomerOrderHtml(order, items),
      MessageStream: env.POSTMARK_MESSAGE_STREAM || "outbound",
    }),
  });
  if (!customerResponse.ok) console.error("Postmark customer order confirmation failed", await customerResponse.text());
}

export async function onRequestPost({ request, env }) {
  if (!env.PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ error: "Online orders are not configured yet." }, 500);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid order request." }, 400);
  }

  const turnstile = await verifyTurnstile(payload.turnstileToken, env.TURNSTILE_SECRET, request.headers.get("CF-Connecting-IP"));
  if (!turnstile.success) return jsonResponse({ error: "Please confirm you are human and try again." }, 400);

  const customer = validateCustomer(payload.customer);
  const items = Array.isArray(payload.items) ? payload.items.map(normaliseCartItem).filter((item) => /^[0-9a-f-]{36}$/i.test(item.id)) : [];
  if (!customer) return jsonResponse({ error: "Please complete your contact details." }, 400);
  if (!items.length) return jsonResponse({ error: "Your cart is empty." }, 400);
  if (payload.terms_accepted !== true) return jsonResponse({ error: "Please confirm that Vert will check payment, artwork and production details before starting." }, 400);

  try {
    const productIds = [...new Set(items.map((item) => item.id))];
  const products = await supabaseFetch(
    env,
    `products?select=id,name,sku,product_type,pricing_mode,base_price,requires_artwork,minimum_quantity,maximum_quantity,is_active,is_published,archived_at&order=id&id=${postgrestIn(productIds)}`,
    { label: "load products" },
  );
  const productById = new Map((products || []).map((product) => [product.id, product]));

  const groups = await supabaseFetch(
    env,
    `option_groups?select=id,product_id,name,display_type,sort_order,option_values(id,option_group_id,label,value,price_adjustment,is_active,sort_order)&product_id=${postgrestIn(productIds)}&order=sort_order.asc`,
    { label: "load option groups" },
  );
  const groupsByProduct = new Map();
  for (const group of groups || []) {
    if (!groupsByProduct.has(group.product_id)) groupsByProduct.set(group.product_id, []);
    groupsByProduct.get(group.product_id).push(group);
  }

  const orderItems = [];
  let subtotalCents = 0;
  for (const item of items) {
    const product = productById.get(item.id);
    if (!product || !product.is_active || !product.is_published || product.archived_at) {
      return jsonResponse({ error: "One of the products in your cart is no longer available." }, 400);
    }
    if (product.pricing_mode === "quote_only" || product.product_type === "quote_only" || product.base_price === null) {
      return jsonResponse({ error: `${product.name} needs a custom quote and cannot be ordered online yet.` }, 400);
    }
    if (item.quantity < product.minimum_quantity || (product.maximum_quantity && item.quantity > product.maximum_quantity)) {
      return jsonResponse({ error: `Please adjust the quantity for ${product.name}.` }, 400);
    }

    const productGroups = (groupsByProduct.get(product.id) || []).filter((group) => (group.option_values || []).some((value) => value.is_active !== false));
    const selectedOptions = [];
    let unitCents = cents(product.base_price);

    const productNeedsConfiguredChoices = product.product_type === "configurable" || product.pricing_mode === "from_price";
    if (productNeedsConfiguredChoices && !productGroups.length) {
      return jsonResponse({ error: `${product.name} still needs choices added before it can be ordered online.` }, 400);
    }

    if (productGroups.length) {
      for (const group of productGroups) {
        const selected = item.options.find((option) => (group.option_values || []).some((value) => optionMatches(option, group, value)));
        if (!selected) return jsonResponse({ error: `Please choose ${group.name} for ${product.name}.` }, 400);
        const value = group.option_values.find((candidate) => optionMatches(selected, group, candidate) && candidate.is_active !== false);
        if (!value) return jsonResponse({ error: `One of the choices for ${product.name} is no longer available.` }, 400);
        unitCents += cents(value.price_adjustment);
        selectedOptions.push({
          group_id: group.id,
          group_name: group.name,
          value_id: value.id,
          value: value.value,
          label: `${group.name}: ${value.label}`,
          price_adjustment: fromCents(cents(value.price_adjustment)),
        });
      }
    }

    const lineCents = unitCents * item.quantity;
    subtotalCents += lineCents;
    orderItems.push({
      product_id: product.id,
      product_name_snapshot: product.name,
      sku_snapshot: product.sku,
      variant_snapshot: null,
      options_snapshot: selectedOptions,
      quantity: item.quantity,
      unit_price: fromCents(unitCents),
      setup_charges: 0,
      line_total: fromCents(lineCents),
      requires_artwork: Boolean(product.requires_artwork),
    });
  }

  const fulfilment = payload.fulfilment_method === "delivery" ? "delivery" : "collection";
  const note = clean(payload.customer_note, 1000) || null;
  const orderNumber = `VERT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  const customerRows = await supabaseFetch(env, "customers", { method: "POST", body: customer, label: "create customer" });
  const savedCustomer = customerRows[0];
  const orderPayload = {
    order_number: orderNumber,
    customer_id: savedCustomer.id,
    fulfilment_method: fulfilment,
    customer_email: customer.email,
    customer_phone: customer.phone,
    customer_name: `${customer.first_name} ${customer.last_name}`,
    company_name: customer.company_name,
    billing_address_snapshot: null,
    delivery_address_snapshot: fulfilment === "delivery" ? { note: "Delivery details to be confirmed manually." } : null,
    subtotal: fromCents(subtotalCents),
    discount_total: 0,
    shipping_total: 0,
    tax_total: 0,
    grand_total: fromCents(subtotalCents),
    currency: "ZAR",
    customer_note: note,
  };
  const orderRows = await supabaseFetch(env, "orders", { method: "POST", body: orderPayload, label: "create order" });
  const order = orderRows[0];
  const savedItems = await supabaseFetch(env, "order_items", {
    method: "POST",
    body: orderItems.map((item) => ({ ...item, order_id: order.id })),
    label: "create order items",
  });
  await supabaseFetch(env, "order_status_history", {
    method: "POST",
    body: { order_id: order.id, new_status: "new", note: "Order request received from website cart." },
    prefer: "return=minimal",
    label: "create order history",
  });
  await notify(env, order, savedItems || orderItems);

  return jsonResponse({
    ok: true,
    order_number: order.order_number,
    message: `Thanks. Your order request ${order.order_number} has been received.`,
  });
  } catch (error) {
    console.error("Order creation failed", error);
    return jsonResponse({ error: "We could not save your order request right now. Please try again or contact Vert directly." }, 500);
  }
}

export function onRequestGet() {
  return jsonResponse({ error: "Method not allowed." }, 405);
}
