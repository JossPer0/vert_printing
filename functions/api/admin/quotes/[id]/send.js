import { createQuoteDocument, getAdminUser, json, loadQuoteBundle, sendQuoteEmail, supabaseFetch } from "../_shared.js";

function quoteError(error) {
  if (error?.message === "email_config") return json({ error: "Quote email is not configured yet." }, 500);
  if (error?.message === "missing_recipient") return json({ error: "Add a valid customer email before sending the quote." }, 400);
  if (error?.message === "supabase_config") return json({ error: "Quote sending is not configured yet." }, 500);
  if (error?.message === "storage") return json({ error: "We could not save the quote PDF right now." }, 502);
  if (error?.message === "postmark") return json({ error: "Postmark could not send the quote email right now." }, 502);
  return json({ error: "We could not send the quote right now." }, 500);
}

export async function onRequestPost({ request, env, params }) {
  const access = await getAdminUser(request, env);
  if (!access) return json({ error: "You must be signed in as an authorised Shop Manager user." }, 403);

  try {
    const bundle = await loadQuoteBundle(env, params.id);
    if (!bundle) return json({ error: "Quote not found." }, 404);
    if (!["ready_to_send", "sent", "viewed"].includes(bundle.quote.status)) {
      return json({ error: "Mark the quote ready before sending it." }, 400);
    }
    if (!bundle.items.length) return json({ error: "Add quote line items before sending the quote." }, 400);

    const { document, pdf } = await createQuoteDocument(env, bundle.quote, bundle.items, access.user.id);
    await sendQuoteEmail(env, bundle.quote, pdf);
    const now = new Date().toISOString();
    await supabaseFetch(env, `quotes?id=eq.${encodeURIComponent(bundle.quote.id)}`, {
      method: "PATCH",
      body: { status: "sent", sent_at: now },
      prefer: "return=minimal",
      label: "mark quote sent",
    });
    await supabaseFetch(env, `quote_documents?id=eq.${encodeURIComponent(document.id)}`, {
      method: "PATCH",
      body: { sent_at: now },
      prefer: "return=minimal",
      label: "mark quote document sent",
    });
    await supabaseFetch(env, "quote_status_history", {
      method: "POST",
      body: {
        quote_id: bundle.quote.id,
        old_status: bundle.quote.status,
        new_status: "sent",
        changed_by_user_id: access.user.id,
        note: "Quote PDF sent to customer from Shop Manager.",
      },
      prefer: "return=minimal",
      label: "create quote sent history",
    });
    return json({ ok: true, document, message: `${bundle.quote.quote_number} was sent to ${bundle.quote.email}.` });
  } catch (error) {
    console.error("Quote send failed", error);
    return quoteError(error);
  }
}

export function onRequestGet() {
  return json({ error: "Method not allowed." }, 405);
}
