/* Wordt automatisch door Netlify aangeroepen zodra een formulier-inzending
   binnenkomt (event "submission-created"). Verstuurt een nette HTML-e-mail
   via Resend (https://resend.com).

   Vereiste omgevingsvariabelen (in Netlify → Site configuration → Environment):
   - RESEND_API_KEY   (verplicht)  je Resend API-sleutel
   - NOTIFY_EMAIL     (optioneel)  ontvanger, standaard Morephrem@hotmail.com
   - FROM_EMAIL       (optioneel)  afzender, standaard "Mor Ephrem Offerte <onboarding@resend.dev>"
*/

const BRAND = "#7a1f2b";
const BRAND_DARK = "#5e1620";
const GOLD = "#b08a3e";

const euro = (n) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(Number(n) || 0);

const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );

exports.handler = async (event) => {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY ontbreekt");
      return { statusCode: 500, body: "RESEND_API_KEY ontbreekt" };
    }

    const payload = JSON.parse(event.body || "{}").payload || {};
    const d = payload.data || {};

    // Alleen reageren op het offerte-formulier
    if (payload.form_name && payload.form_name !== "offerte") {
      return { statusCode: 200, body: "Overgeslagen (ander formulier)" };
    }

    let items = [];
    try {
      items = JSON.parse(d.bestelling_json || "[]");
    } catch (_) {
      items = [];
    }

    const html = buildEmail(d, items);
    const recipient = process.env.NOTIFY_EMAIL || "Morephrem@hotmail.com";
    const from = process.env.FROM_EMAIL || "Mor Ephrem Offerte <onboarding@resend.dev>";

    const body = {
      from,
      to: [recipient],
      subject: `Nieuwe offerteaanvraag — ${d.naam || "onbekend"}${
        d.organisatie ? " (" + d.organisatie + ")" : ""
      }`,
      html,
    };
    if (d.email) body.reply_to = d.email;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("Resend-fout:", res.status, txt);
      return { statusCode: 502, body: "E-mail versturen mislukt: " + txt };
    }

    return { statusCode: 200, body: "E-mail verstuurd" };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Serverfout: " + err.message };
  }
};

function buildEmail(d, items) {
  const rows =
    items.length > 0
      ? items
          .map(
            (x, i) => `
        <tr style="background:${i % 2 ? "#faf8f4" : "#ffffff"};">
          <td style="padding:9px 12px;border-bottom:1px solid #ece7dd;font-size:14px;color:#2a2520;">${esc(
            x.title
          )}</td>
          <td style="padding:9px 12px;border-bottom:1px solid #ece7dd;font-size:14px;color:#7c7367;text-align:center;white-space:nowrap;">${esc(
            x.qty
          )}×</td>
          <td style="padding:9px 12px;border-bottom:1px solid #ece7dd;font-size:14px;color:#7c7367;text-align:right;white-space:nowrap;">${euro(
            x.price
          )}</td>
          <td style="padding:9px 12px;border-bottom:1px solid #ece7dd;font-size:14px;color:#2a2520;text-align:right;white-space:nowrap;font-weight:600;">${euro(
            x.total
          )}</td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="4" style="padding:12px;color:#7c7367;font-size:14px;">${esc(
          d.bestelling || "(geen titels meegestuurd)"
        )}</td></tr>`;

  const field = (label, value) =>
    value
      ? `<tr>
          <td style="padding:6px 0;font-size:13px;color:#7c7367;width:150px;vertical-align:top;">${esc(
            label
          )}</td>
          <td style="padding:6px 0;font-size:14px;color:#2a2520;">${esc(value)}</td>
        </tr>`
      : "";

  return `
  <div style="margin:0;padding:0;background:#f6f4ef;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f4ef;padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:92%;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e6e1d8;font-family:Segoe UI,Arial,sans-serif;">

          <!-- Header -->
          <tr><td style="background:${BRAND};padding:22px 28px;">
            <table role="presentation" width="100%"><tr>
              <td style="font-size:22px;color:#ffffff;font-weight:700;">Mor Ephrem Bookshop</td>
              <td align="right" style="font-size:13px;color:#f0d9dd;">Nieuwe offerteaanvraag</td>
            </tr></table>
          </td></tr>

          <!-- Intro -->
          <tr><td style="padding:26px 28px 8px;">
            <h1 style="margin:0 0 6px;font-size:20px;color:${BRAND_DARK};">Er is een nieuwe offerte aangevraagd</h1>
            <p style="margin:0;font-size:14px;color:#7c7367;">Hieronder vind je de gegevens en de gewenste titels. Je kunt direct op deze e-mail reageren om de klant te antwoorden.</p>
          </td></tr>

          <!-- Klantgegevens -->
          <tr><td style="padding:14px 28px 4px;">
            <h2 style="margin:0 0 6px;font-size:13px;letter-spacing:.6px;text-transform:uppercase;color:${GOLD};border-bottom:1px solid #e6e1d8;padding-bottom:6px;">Klantgegevens</h2>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${field("Naam", d.naam)}
              ${field("Organisatie / kerk", d.organisatie)}
              ${field("E-mail", d.email)}
              ${field("Telefoon", d.telefoon)}
              ${field("Adres", d.adres)}
              ${field("Gewenste levering", d.levering)}
              ${field("Opmerkingen", d.opmerkingen)}
            </table>
          </td></tr>

          <!-- Bestelling -->
          <tr><td style="padding:18px 28px 4px;">
            <h2 style="margin:0 0 10px;font-size:13px;letter-spacing:.6px;text-transform:uppercase;color:${GOLD};border-bottom:1px solid #e6e1d8;padding-bottom:6px;">Gewenste titels</h2>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #ece7dd;border-radius:8px;overflow:hidden;">
              <tr style="background:#f1ece3;">
                <td style="padding:9px 12px;font-size:12px;color:#7c7367;text-transform:uppercase;letter-spacing:.4px;">Titel</td>
                <td style="padding:9px 12px;font-size:12px;color:#7c7367;text-align:center;">Aantal</td>
                <td style="padding:9px 12px;font-size:12px;color:#7c7367;text-align:right;">Stuksprijs</td>
                <td style="padding:9px 12px;font-size:12px;color:#7c7367;text-align:right;">Subtotaal</td>
              </tr>
              ${rows}
            </table>
          </td></tr>

          <!-- Totalen -->
          <tr><td style="padding:14px 28px 4px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:14px;color:#2a2520;">${esc(d.aantal_titels || items.length)} titel(s) · ${esc(
    d.totaal_exemplaren || ""
  )} exemplaren</td>
                <td align="right" style="font-size:18px;color:${BRAND_DARK};font-weight:700;">${esc(
    d.richtprijs || euro(items.reduce((s, x) => s + (Number(x.total) || 0), 0))
  )}</td>
              </tr>
            </table>
            <p style="margin:6px 0 0;font-size:11px;color:#9a9183;">Richtprijs op basis van losse stuksprijzen, excl. verzending. Definitieve offerte kan afwijken (bv. staffelkorting).</p>
          </td></tr>

          <!-- Footer -->
          <tr><td style="padding:22px 28px;">
            <a href="https://morephrem.shop" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 18px;border-radius:9px;">Open de webshop</a>
          </td></tr>
          <tr><td style="background:#fbfaf6;border-top:1px solid #e6e1d8;padding:14px 28px;font-size:12px;color:#9a9183;">
            Automatisch verstuurd vanaf de offerte-pagina · morephrem.shop
          </td></tr>

        </table>
      </td></tr>
    </table>
  </div>`;
}
