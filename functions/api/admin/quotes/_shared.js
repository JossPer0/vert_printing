const POSTMARK_API_URL = "https://api.postmarkapp.com/email";
const QUOTE_BUCKET = "quote-documents";

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export function clean(value, max = 500) {
  return String(value || "").trim().slice(0, max);
}

export function money(value) {
  return `R${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function escapeHtml(value) {
  return clean(value, 5000)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function storageHeaders(env, extra = {}) {
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = { apikey: key, ...extra };
  if (!String(key || "").startsWith("sb_secret_")) headers.Authorization = `Bearer ${key}`;
  return headers;
}

function restHeaders(env, prefer = "return=representation") {
  return storageHeaders(env, { "content-type": "application/json", Prefer: prefer });
}

export async function supabaseFetch(env, path, options = {}) {
  if (!env.PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("supabase_config");
  const response = await fetch(`${env.PUBLIC_SUPABASE_URL}/rest/v1/${path}`, {
    method: options.method || "GET",
    headers: restHeaders(env, options.prefer || "return=representation"),
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    console.error("Supabase quote API failed", options.label || path.split("?")[0], response.status, text);
    throw new Error("supabase");
  }
  return data;
}

export async function getAdminUser(request, env) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token || !env.PUBLIC_SUPABASE_URL || !env.PUBLIC_SUPABASE_ANON_KEY) return null;
  const headers = { apikey: env.PUBLIC_SUPABASE_ANON_KEY, authorization: `Bearer ${token}` };
  const userResponse = await fetch(`${env.PUBLIC_SUPABASE_URL}/auth/v1/user`, { headers });
  if (!userResponse.ok) return null;
  const user = await userResponse.json();
  const profileResponse = await fetch(`${env.PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role,active&limit=1`, { headers });
  if (!profileResponse.ok) return null;
  const profile = (await profileResponse.json())[0];
  return profile?.active && ["owner", "admin", "staff"].includes(profile.role) ? { user, profile } : null;
}

export async function loadQuoteBundle(env, quoteId) {
  const quoteRows = await supabaseFetch(
    env,
    `quotes?select=id,quote_number,quote_request_id,status,source,customer_name,company_name,email,phone,currency,subtotal,discount_total,delivery_total,tax_total,grand_total,prices_include_tax,tax_rate,valid_until,customer_note,internal_note,terms_text,created_at,updated_at&id=eq.${encodeURIComponent(quoteId)}&limit=1`,
    { label: "load quote" },
  );
  const quote = quoteRows?.[0];
  if (!quote) return null;
  const items = await supabaseFetch(
    env,
    `quote_items?select=id,quote_id,sort_order,product_id,description,sku,quantity,unit_price,line_subtotal,discount_amount,line_total,taxable&quote_id=eq.${encodeURIComponent(quote.id)}&order=sort_order.asc`,
    { label: "load quote items" },
  );
  return { quote, items: items || [] };
}

export async function latestQuoteDocument(env, quoteId) {
  const rows = await supabaseFetch(
    env,
    `quote_documents?select=id,quote_id,document_type,version_number,storage_path,generated_at,sent_at,created_at&quote_id=eq.${encodeURIComponent(quoteId)}&document_type=eq.quote&order=version_number.desc&limit=1`,
    { label: "load quote document" },
  );
  return rows?.[0] || null;
}

function ascii(value) {
  return clean(value, 5000)
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/×/g, "x")
    .replace(/[^\x20-\x7e\n]/g, "");
}

function pdfEscape(value) {
  return ascii(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function textWidth(value, size) {
  return ascii(value).length * size * 0.52;
}

function wrapText(value, maxWidth, size) {
  const words = ascii(value).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (textWidth(candidate, size) <= maxWidth || !line) line = candidate;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function isoDate(value) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00Z`));
}

function quoteDate(value) {
  return new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" }).format(new Date(value || Date.now()));
}

function buildPdf(objects) {
  const encoder = new TextEncoder();
  const chunks = ["%PDF-1.4\n"];
  const offsets = [0];
  let offset = encoder.encode(chunks[0]).length;
  objects.forEach((object, index) => {
    offsets.push(offset);
    const body = typeof object === "string" ? object : object();
    const chunk = `${index + 1} 0 obj\n${body}\nendobj\n`;
    chunks.push(chunk);
    offset += encoder.encode(chunk).length;
  });
  const xrefOffset = offset;
  chunks.push(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`);
  for (let index = 1; index <= objects.length; index += 1) {
    chunks.push(`${String(offsets[index]).padStart(10, "0")} 00000 n \n`);
  }
  chunks.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
  return encoder.encode(chunks.join(""));
}

export function generateQuotePdf(quote, items) {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 46;
  const right = pageWidth - margin;
  const bottom = 58;
  const pages = [];
  let commands = [];
  let y = pageHeight - margin;

  function color(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
  }

  function drawText(value, x, yy, size = 10, opts = {}) {
    const fill = opts.color || "#1f2426";
    const font = opts.bold ? "/F2" : "/F1";
    const text = pdfEscape(value);
    const tx = opts.align === "right" ? x - textWidth(value, size) : x;
    commands.push(`BT ${color(fill)} rg ${font} ${size} Tf ${tx.toFixed(2)} ${yy.toFixed(2)} Td (${text}) Tj ET`);
  }

  function line(x1, yy1, x2, yy2, hex = "#e2ddd2") {
    commands.push(`${color(hex)} RG 0.75 w ${x1.toFixed(2)} ${yy1.toFixed(2)} m ${x2.toFixed(2)} ${yy2.toFixed(2)} l S`);
  }

  function rect(x, yy, width, height, hex) {
    commands.push(`${color(hex)} rg ${x.toFixed(2)} ${yy.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f`);
  }

  function finishPage() {
    pages.push(commands.join("\n"));
    commands = [];
    y = pageHeight - margin;
  }

  function header() {
    rect(0, pageHeight - 106, pageWidth, 106, "#1f2426");
    drawText("VERT PRINTING", margin, pageHeight - 58, 17, { bold: true, color: "#ffffff" });
    drawText("Kloof, Durban", margin, pageHeight - 78, 10, { color: "#fbfaf7" });
    drawText("QUOTE", right, pageHeight - 58, 18, { bold: true, align: "right", color: "#ffffff" });
    drawText(quote.quote_number, right, pageHeight - 78, 10, { align: "right", color: "#fbfaf7" });
    y = pageHeight - 136;
  }

  function ensure(space) {
    if (y - space < bottom) {
      finishPage();
      header();
    }
  }

  function paragraph(title, body) {
    if (!clean(body, 5000)) return;
    const lines = wrapText(body, pageWidth - margin * 2, 10);
    ensure(28 + lines.length * 14);
    drawText(title, margin, y, 10, { bold: true, color: "#ec168c" });
    y -= 17;
    for (const row of lines) {
      drawText(row, margin, y, 10, { color: "#4f5b5f" });
      y -= 14;
    }
    y -= 10;
  }

  header();
  drawText("Prepared for", margin, y, 9, { bold: true, color: "#007c7a" });
  drawText("Date", 350, y, 9, { bold: true, color: "#007c7a" });
  drawText("Valid until", 460, y, 9, { bold: true, color: "#007c7a" });
  y -= 17;
  drawText(quote.customer_name || "Customer", margin, y, 12, { bold: true });
  drawText(quoteDate(quote.created_at), 350, y, 10);
  drawText(isoDate(quote.valid_until), 460, y, 10);
  y -= 15;
  if (quote.company_name) {
    drawText(quote.company_name, margin, y, 10, { color: "#4f5b5f" });
    y -= 14;
  }
  if (quote.email) {
    drawText(quote.email, margin, y, 10, { color: "#4f5b5f" });
    y -= 14;
  }
  if (quote.phone) {
    drawText(quote.phone, margin, y, 10, { color: "#4f5b5f" });
    y -= 14;
  }
  y -= 18;

  ensure(42);
  rect(margin, y - 21, pageWidth - margin * 2, 28, "#fbfaf7");
  drawText("Description", margin + 10, y - 10, 9, { bold: true, color: "#667074" });
  drawText("Qty", 355, y - 10, 9, { bold: true, color: "#667074" });
  drawText("Unit", 440, y - 10, 9, { bold: true, align: "right", color: "#667074" });
  drawText("Total", right - 10, y - 10, 9, { bold: true, align: "right", color: "#667074" });
  y -= 34;

  for (const item of items) {
    const descriptionLines = wrapText(item.description, 285, 10);
    const rowHeight = Math.max(30, descriptionLines.length * 13 + 14);
    ensure(rowHeight + 8);
    const rowTop = y;
    descriptionLines.forEach((row, index) => drawText(row, margin + 10, rowTop - index * 13, 10));
    if (item.sku) drawText(`SKU: ${item.sku}`, margin + 10, rowTop - descriptionLines.length * 13, 8, { color: "#667074" });
    drawText(String(item.quantity), 355, rowTop, 10);
    drawText(money(item.unit_price), 440, rowTop, 10, { align: "right" });
    drawText(money(item.line_total), right - 10, rowTop, 10, { bold: true, align: "right" });
    y -= rowHeight;
    line(margin, y + 4, right, y + 4);
    y -= 6;
  }

  const totals = [
    ["Subtotal", money(quote.subtotal)],
    ...(Number(quote.discount_total) > 0 ? [["Discount", `-${money(quote.discount_total)}`]] : []),
    ...(Number(quote.delivery_total) > 0 ? [["Delivery", money(quote.delivery_total)]] : []),
    ...(Number(quote.tax_total) > 0 ? [["Tax", money(quote.tax_total)]] : []),
  ];
  ensure(90 + totals.length * 18);
  y -= 6;
  for (const [label, value] of totals) {
    drawText(label, 365, y, 10, { color: "#667074" });
    drawText(value, right, y, 10, { align: "right" });
    y -= 18;
  }
  line(360, y + 5, right, y + 5, "#ec168c");
  y -= 16;
  drawText("Total", 365, y, 13, { bold: true });
  drawText(money(quote.grand_total), right, y, 15, { bold: true, align: "right", color: "#ec168c" });
  y -= 34;

  paragraph("Notes", quote.customer_note);
  paragraph("Terms", quote.terms_text);
  ensure(48);
  line(margin, bottom + 28, right, bottom + 28, "#e2ddd2");
  drawText("Vert Printing | www.vertprinting.co.za | info@vertprinting.co.za | +27 66 245 6511", margin, bottom + 10, 8, { color: "#667074" });
  finishPage();

  const objects = [];
  const fontRegularId = 3;
  const fontBoldId = 4;
  const pageObjects = [];
  const contentObjects = [];
  const firstPageId = 5;
  for (let index = 0; index < pages.length; index += 1) {
    pageObjects.push(firstPageId + index * 2);
    contentObjects.push(firstPageId + index * 2 + 1);
  }
  objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[1] = `<< /Type /Pages /Kids [${pageObjects.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjects.length} >>`;
  objects[2] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";
  pages.forEach((stream, index) => {
    const pageId = pageObjects[index];
    const contentId = contentObjects[index];
    objects[pageId - 1] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId - 1] = () => `<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`;
  });
  return buildPdf(objects);
}

export async function createQuoteDocument(env, quote, items, userId) {
  const latest = await latestQuoteDocument(env, quote.id);
  const version = Number(latest?.version_number || 0) + 1;
  const safeNumber = quote.quote_number.replace(/[^A-Za-z0-9-]+/g, "-");
  const storagePath = `quotes/${quote.id}/${safeNumber}-v${version}.pdf`;
  const pdf = generateQuotePdf(quote, items);
  const uploadResponse = await fetch(`${env.PUBLIC_SUPABASE_URL}/storage/v1/object/${QUOTE_BUCKET}/${storagePath}`, {
    method: "POST",
    headers: storageHeaders(env, { "content-type": "application/pdf", "x-upsert": "false" }),
    body: pdf,
  });
  if (!uploadResponse.ok) {
    console.error("Quote PDF upload failed", uploadResponse.status, await uploadResponse.text());
    throw new Error("storage");
  }
  const rows = await supabaseFetch(env, "quote_documents", {
    method: "POST",
    body: {
      quote_id: quote.id,
      document_type: "quote",
      version_number: version,
      storage_path: storagePath,
      generated_by_user_id: userId,
    },
    label: "create quote document",
  });
  return { document: rows[0], pdf };
}

export async function readQuoteDocument(env, document) {
  const response = await fetch(`${env.PUBLIC_SUPABASE_URL}/storage/v1/object/${QUOTE_BUCKET}/${document.storage_path}`, {
    headers: storageHeaders(env),
  });
  if (!response.ok) {
    console.error("Quote PDF download failed", response.status, await response.text());
    throw new Error("storage");
  }
  return new Uint8Array(await response.arrayBuffer());
}

export function bytesToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

export function buildQuoteEmailText(quote) {
  const firstName = clean(quote.customer_name, 160).split(/\s+/)[0] || "there";
  return [
    `Hi ${firstName},`,
    "",
    "Thanks for getting in touch.",
    "",
    "Your Vert Printing quote is ready.",
    "",
    `Quote: ${quote.quote_number}`,
    `Total: ${money(quote.grand_total)}`,
    `Valid until: ${isoDate(quote.valid_until)}`,
    "",
    "A PDF copy is attached for your records.",
    "",
    "If anything needs changing, simply reply to this email.",
    "",
    "Vert Printing",
    "Kloof, Durban",
    "info@vertprinting.co.za",
    "+27 66 245 6511",
    "https://www.vertprinting.co.za/",
  ].join("\n");
}

export function buildQuoteEmailHtml(quote) {
  const firstName = escapeHtml(clean(quote.customer_name, 160).split(/\s+/)[0] || "there");
  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @media only screen and (max-width: 520px) {
          .email-container { width: 94% !important; max-width: 94% !important; }
          .email-pad { padding-left: 18px !important; padding-right: 18px !important; }
          .email-word { word-break: break-word !important; overflow-wrap: anywhere !important; }
        }
      </style>
    </head>
    <body style="margin:0;padding:0;background:#fbfaf7;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background:#fbfaf7;table-layout:fixed;">
        <tr>
          <td align="center" style="padding:22px 0 28px;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="94%" class="email-container" style="border-collapse:collapse;width:94%;max-width:640px;table-layout:fixed;">
              <tr>
                <td style="padding:0 0 14px;color:#667074;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.4;">
                  <strong style="display:block;color:#1f2426;font-size:15px;letter-spacing:.08em;">VERT PRINTING</strong>
                  Kloof, Durban
                </td>
              </tr>
              <tr>
                <td style="background:#ffffff;border:1px solid #e2ddd2;border-radius:10px;padding:0;">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;table-layout:fixed;">
                    <tr>
                      <td class="email-pad" style="padding:30px 28px 18px;border-bottom:1px solid #ece8df;">
                        <div style="margin:0 0 10px;color:#ec168c;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;">Quote ready</div>
                        <h1 class="email-word" style="margin:0 0 12px;color:#1f2426;font-family:Arial,Helvetica,sans-serif;font-size:28px;line-height:1.15;">Hi ${firstName}, your quote is ready.</h1>
                        <p class="email-word" style="margin:0;color:#4f5b5f;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;">Thanks for getting in touch with Vert Printing. We have attached your PDF quote for review.</p>
                      </td>
                    </tr>
                    <tr>
                      <td class="email-pad" style="padding:22px 28px;background:#fbfaf7;border-bottom:1px solid #ece8df;">
                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;table-layout:fixed;">
                          <tr>
                            <td style="padding:0;color:#1f2426;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;">
                              <strong>Quote ${escapeHtml(quote.quote_number)}</strong><br>
                              Total: <strong>${money(quote.grand_total)}</strong><br>
                              Valid until: ${escapeHtml(isoDate(quote.valid_until))}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td class="email-pad" style="padding:24px 28px 30px;">
                        <p class="email-word" style="margin:0 0 12px;color:#4f5b5f;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;">If anything needs changing, simply reply to this email and we will help.</p>
                        <p class="email-word" style="margin:0;color:#4f5b5f;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;">Production will only start once the quote, artwork, payment and details have been confirmed.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:18px 10px 0;color:#667074;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.55;">
                  <strong style="color:#1f2426;">Vert Printing</strong><br>
                  <a href="https://www.vertprinting.co.za/" style="color:#007c7a;text-decoration:underline;">www.vertprinting.co.za</a><br>
                  info@vertprinting.co.za - +27 66 245 6511<br>
                  Kloof, Durban
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
}

export async function sendQuoteEmail(env, quote, pdf) {
  if (!env.POSTMARK_SERVER_TOKEN || !env.POSTMARK_FROM_EMAIL || !env.QUOTE_TO_EMAIL) throw new Error("email_config");
  const recipient = clean(quote.email, 180).toLowerCase();
  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) throw new Error("missing_recipient");
  const payload = {
    From: env.POSTMARK_FROM_EMAIL,
    To: recipient,
    Bcc: env.QUOTE_TO_EMAIL,
    ReplyTo: env.QUOTE_TO_EMAIL,
    Subject: `Vert Printing quote ${quote.quote_number}`,
    TextBody: buildQuoteEmailText(quote),
    HtmlBody: buildQuoteEmailHtml(quote),
    MessageStream: env.POSTMARK_MESSAGE_STREAM || "outbound",
    Attachments: [{
      Name: `${quote.quote_number}.pdf`,
      Content: bytesToBase64(pdf),
      ContentType: "application/pdf",
    }],
  };
  const response = await fetch(POSTMARK_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-postmark-server-token": env.POSTMARK_SERVER_TOKEN,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    console.error("Postmark quote send failed", response.status, await response.text());
    throw new Error("postmark");
  }
  return response.json();
}
