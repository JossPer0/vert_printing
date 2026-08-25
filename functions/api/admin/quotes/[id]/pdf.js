import { createQuoteDocument, getAdminUser, json, latestQuoteDocument, loadQuoteBundle, readQuoteDocument } from "../_shared.js";

function quoteError(error) {
  if (error?.message === "supabase_config") return json({ error: "Quote documents are not configured yet." }, 500);
  if (error?.message === "storage") return json({ error: "We could not access the quote PDF storage right now." }, 502);
  return json({ error: "We could not generate the quote PDF right now." }, 500);
}

export async function onRequestPost({ request, env, params }) {
  const access = await getAdminUser(request, env);
  if (!access) return json({ error: "You must be signed in as an authorised Shop Manager user." }, 403);

  try {
    const bundle = await loadQuoteBundle(env, params.id);
    if (!bundle) return json({ error: "Quote not found." }, 404);
    if (bundle.quote.status === "cancelled") return json({ error: "Cancelled quotes cannot generate new PDFs." }, 400);
    if (!bundle.items.length) return json({ error: "Add quote line items before generating a PDF." }, 400);

    const { document } = await createQuoteDocument(env, bundle.quote, bundle.items, access.user.id);
    return json({ ok: true, document, message: `PDF version ${document.version_number} generated for ${bundle.quote.quote_number}.` });
  } catch (error) {
    console.error("Quote PDF generation failed", error);
    return quoteError(error);
  }
}

export async function onRequestGet({ request, env, params }) {
  const access = await getAdminUser(request, env);
  if (!access) return json({ error: "You must be signed in as an authorised Shop Manager user." }, 403);

  try {
    const bundle = await loadQuoteBundle(env, params.id);
    if (!bundle) return json({ error: "Quote not found." }, 404);
    const document = await latestQuoteDocument(env, bundle.quote.id);
    if (!document) return json({ error: "Generate the quote PDF before downloading it." }, 404);
    const pdf = await readQuoteDocument(env, document);
    return new Response(pdf, {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${bundle.quote.quote_number}-v${document.version_number}.pdf"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    console.error("Quote PDF download failed", error);
    return quoteError(error);
  }
}

export function onRequestPut() {
  return json({ error: "Method not allowed." }, 405);
}

export function onRequestDelete() {
  return json({ error: "Method not allowed." }, 405);
}
