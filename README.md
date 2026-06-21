# Offerte-pagina · Mor Ephrem Bookshop

Een losse (statische) offerte-pagina waar klanten — kerken, parochies, scholen,
bibliotheken of particulieren met een grotere bestelling — boeken en aantallen
kiezen en een vrijblijvende prijsopgave aanvragen. De aanvraag wordt via
**Netlify Forms** per e-mail naar je toegestuurd. Deze pagina staat **buiten**
Shopify; je plaatst er vanuit Shopify alleen een link naartoe.

## Bestanden

| Bestand | Doel |
|---|---|
| `index.html` | De offerte-pagina (catalogus + formulier) |
| `styles.css` | Vormgeving (huisstijl in dieprood/goud) |
| `app.js` | Logica: aantallen, richtprijs, formulier vullen |
| `products.json` | De boekenlijst (titel, categorie, prijs, afbeelding, link) |
| `bedankt.html` | Bevestigingspagina na het versturen |
| `netlify.toml` | Netlify-instellingen (statische site, geen build) |
| `netlify/functions/submission-created.js` | Verstuurt bij elke aanvraag een gestylede HTML-e-mail via Resend |

## Zo zet je hem live op Netlify (gratis)

### Optie A — Slepen en neerzetten (snelst)
1. Ga naar <https://app.netlify.com/drop>.
2. Sleep de **hele projectmap** naar het venster.
3. Klaar — je krijgt direct een URL zoals `https://random-naam.netlify.app`.

> Let op: bij deze optie worden formulieren herkend zodra de eerste echte
> inzending binnenkomt. Werkt het niet meteen, gebruik dan optie B.

### Optie B — Via GitHub (aanbevolen, met automatische updates)
1. Log in op <https://app.netlify.com> → **Add new site → Import an existing project**.
2. Koppel deze GitHub-repository en de branch `claude/shopify-quote-page-pemngu`.
3. Build command: *leeg laten*. Publish directory: `.` (punt).
4. **Deploy**. Toekomstige pushes naar de branch werken de site automatisch bij.

### E-mailmeldingen aanzetten
1. In Netlify: **Site configuration → Forms → Form notifications**.
2. **Add notification → Email notification**.
3. Vul het e-mailadres in waar de aanvragen heen moeten (bv. `Morephrem@hotmail.com`).
4. Inzendingen zijn ook altijd terug te vinden onder **Forms → offerte**.

## Gestylede e-mail via Resend (aanbevolen)

Netlify's eigen e-mailmelding is platte tekst. Voor een nette, gebrande e-mail
(tabel met titels, aantallen en prijzen) verstuurt de functie
`netlify/functions/submission-created.js` de mail via [Resend](https://resend.com).

1. Maak een gratis account op <https://resend.com> (meld je aan met het adres waar
   je de aanvragen wilt ontvangen, bv. `Morephrem@hotmail.com`).
2. Ga naar **API Keys → Create API Key** en kopieer de sleutel.
3. In Netlify: **Site configuration → Environment variables → Add a variable**:
   - `RESEND_API_KEY` = je gekopieerde sleutel *(verplicht)*
   - `NOTIFY_EMAIL` = ontvanger, bv. `Morephrem@hotmail.com` *(optioneel)*
   - `FROM_EMAIL` = afzender *(optioneel)*
4. **Deploy de site opnieuw** zodat de functie en variabelen actief worden.
5. Doe een testaanvraag — je ontvangt nu de gestylede e-mail.

> **Afzender / domein.** Zonder eigen domein verstuurt Resend vanaf
> `onboarding@resend.dev`; dat werkt zolang je naar je **eigen** account-adres
> mailt. Wil je mailen vanaf bv. `offerte@morephrem.shop` (en naar elk adres),
> verifieer dan je domein in Resend onder **Domains** en zet
> `FROM_EMAIL="Mor Ephrem Offerte <offerte@morephrem.shop>"`.

> **Dubbele mail voorkomen.** Laat je de gestylede e-mail via Resend lopen, zet
> dan de ingebouwde Netlify-melding uit: **Forms → Form notifications** →
> verwijder de "Email notification". De inzendingen blijven gewoon zichtbaar
> onder **Forms → offerte**.

### Eigen domein/subdomein (optioneel)
Wil je bv. `offerte.morephrem.shop` in plaats van de netlify.app-URL? Dat kan
onder **Domain management** in Netlify met een CNAME-record bij je domeinbeheerder.

## De link in Shopify zetten

Zodra je de Netlify-URL hebt, kun je die op meerdere plekken in Shopify plaatsen:

- **Navigatiemenu:** Shopify admin → *Winkelinstellingen → Navigatie* → kies je
  menu → *Menu-item toevoegen* → naam "Offerte aanvragen", link = de Netlify-URL.
- **Footer of pagina:** maak eventueel een pagina (*Online Store → Pagina's*) met
  een knop/link naar de Netlify-URL.
- **Knop in het thema:** via de Theme Editor een knop met de URL.

Geef het door zodra de pagina live staat — dan help ik de link netjes in je
Shopify-navigatie te zetten.

## Lijst bijwerken

Prijzen en titels staan in `products.json`. Pas je de prijzen in Shopify aan,
werk dan dit bestand bij (of vraag mij het opnieuw uit je winkel te genereren).
Categorieën komen uit het veld `type`.

## Lokaal bekijken

`products.json` wordt via `fetch` geladen, dus open `index.html` niet direct via
`file://`. Start een klein lokaal serventje, bijvoorbeeld:

```bash
npx serve .
# of
python3 -m http.server 8000
```

en open daarna `http://localhost:8000`.
