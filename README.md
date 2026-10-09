# ABAS Estimator

A installable web app (PWA) version of the ABAS project cost estimator (Labor
& Scope, Materials, Sub-Labor, Misc, Final Estimate, and Billing) — rebuilt
from the `ABAS_Estimator-Template.xltm` workbook so it runs in any browser, on
any device, with no Excel or macros required — and works fully offline once
it's been opened once.

It's a small set of static files (HTML, CSS and JS — no build step, no
dependencies to install). Everything a user enters is saved automatically to
that browser's local storage, so estimates persist between visits on the same
device, online or off. Multiple estimates can be kept side by side, and estimates can be exported to Excel, PDF, CSV or JSON (see Exporting below).

## Files

| File | Purpose |
|---|---|
| `index.html` | The app itself — all markup, styling and logic. |
| `manifest.webmanifest` | PWA metadata (name, icons, colors) so it can be installed. |
| `sw.js` | Service worker — caches the app shell so it loads and works offline after the first visit. |
| `ABAS_Estimator-Template.xltm` | The original ABAS Excel estimator. The **Excel — ABAS estimator template** export fills a copy of it. |
| `` | App icons at the sizes iOS/Android/desktop expect. |

All of these need to be deployed together, at the same folder level, for
install and offline support to work — don't deploy `index.html` on its own.

## What it replicates from the original workbook

- **Labor & Scope** and **Sub-Labor** — item, scope of work, hours, hourly
  rate, auto-computed subtotal, running total.
- **Materials** and **Misc** — description, part number, vendor, qty, unit
  cost, auto-computed line total, running total.
- **Final Estimate** — pulls all four totals, applies an editable margin % per
  category, adds warranty %, trip charge, freight, and tax %, down to a total
  cost.
- **Billing** — contract amount per category (defaults to the Final Estimate's
  cost + margin, or can be overridden), retainage %, and an invoice-cycle
  table with % billed per category, computed $ amounts, retainage held, and a
  running total — same math as the `Billing` sheet.

## Exporting

Use the **Export** menu in the top bar:

| Option | What you get |
|---|---|
| PDF, client proposal | Opens the print dialog with the client proposal (sell prices only). Choose "Save as PDF". |
| PDF, internal estimate | A report of **all** sheets (landscape) with cost and margin, marked INTERNAL. |
| Excel, ABAS estimator template (.xlsx) | The original ABAS estimator workbook, filled in. Same formatting and live formulas as the template; Excel recalculates when it opens. |
| Excel, internal (.xlsx) | One workbook, all six sheets, currency-formatted. Values, not live formulas. |
| CSV, internal (.zip) | One CSV per sheet, zipped. |
| JSON backup (.json) | The full estimate, for backup or moving between browsers/devices. Re-import with **Import**. |

Only the client proposal is safe to send to a customer. Everything marked
internal shows your cost and margin. Each tab also has an **Export CSV** button
for just that sheet. Blank rows are left out of exports.

### ABAS estimator template export

- Fills Labor & Scope, Materials, Sub-Labor, Misc, Final Estimate (date,
  client, scope, margins, warranty, trip, freight) and Billing (contract
  amounts, change order, retainage, invoice cycles). Blank rows are skipped.
- Saved as a normal `.xlsx`. The template's only macro pointed at a sheet that
  no longer exists, so it is left out, and there is no "Enable Content" warning.
- Tax: the template hard-codes 8.25% of the subtotal. The export rewrites that
  one formula to use this estimate's tax rate and taxable lines, so Excel
  matches the app. If some lines are not taxable, the tax label gets a `*` and
  a footnote.
- Row limits come from the template: 50 labor lines, 30 each for materials,
  sub-labor and misc, and 5 invoice cycles. A bigger estimate gets a warning
  instead of a cut-off file; use **Excel, internal** for those.
- To change the template, replace `ABAS_Estimator-Template.xltm` (same file
  name) and bump `CACHE_VERSION` in `sw.js`. If you move cells or rename
  sheets, update `TEMPLATE_MAP` in `index.html`.
- Opened straight from disk (`file://`), the app can't load the template on its
  own and asks you to pick the file instead.

## Client proposal

The **Proposal** tab builds a customer-facing document from the estimate. It
shows sell prices only; cost, margin, vendors and unit rates never appear.

- Pricing detail: *Lump sum*, *By category* or *Itemized (at sell price)*.
- Add scope of work, inclusions, exclusions, other terms, validity (default
  30 days) and payment terms (default Net 30). A signature block is included.
- Your company name, address, contact and "prepared by" are saved once in this
  browser and reused on every estimate. Client and date are shared with the
  Final Estimate tab.
- Totals match the Final Estimate to the cent. Printing with Ctrl+P while on
  the Proposal tab also prints the proposal.

## Sales tax

On the **Final Estimate** tab, each line has a **Taxable** checkbox (labor,
materials, sub-labor, misc, warranty, trip charge, freight). Tax is charged
only on the checked lines; the **Taxable Amount** row shows the base. All
lines start checked, which matches the original workbook. Uncheck whatever is
not taxed where you work.

## Run it locally

No install needed — just open the file:

```bash
open index.html        # macOS
xdg-open index.html    # Linux
start index.html       # Windows
```

Or serve it (useful for testing on a phone on the same network):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy to GitHub Pages

1. Create a new GitHub repository (or use an existing one) and push this
   folder — `index.html`, `manifest.webmanifest`, `sw.js`, `ABAS_Estimator-Template.xltm`, the icons, and this
   `README.md` — to it:

   ```bash
   git init
   git add .
   git commit -m "ABAS Estimator PWA"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```

2. On GitHub, go to the repo's **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**,
   pick the **main** branch and the **/ (root)** folder, then **Save**.
4. GitHub will publish it at `https://<your-username>.github.io/<your-repo>/`
   within a minute or two. Any later push to `main` updates the live site
   automatically.

No server, database, or API key is required — it's a static site, and GitHub
Pages serves it over HTTPS by default, which is required for the service
worker and install prompt to work.

## Installing it as an app

Once it's live on GitHub Pages:

- **Desktop Chrome/Edge:** an install icon appears in the address bar, or use
  the **Install** button that shows up in the app's own toolbar.
- **Android (Chrome):** open the site, then **⋮ menu → Install app** (or the
  **Install** button in-app).
- **iOS/iPadOS (Safari):** Safari doesn't support the automatic install
  prompt — open the site, tap **Share → Add to Home Screen**.

Once installed, it opens in its own window (no browser chrome) and works
offline, the same as any other app on the device.

## Updating the deployed app

The service worker fetches the app's files from the network first and only
falls back to its cache when offline, so a redeploy shows up the next time the
app is opened online. If you change files, also bump `CACHE_VERSION` in
`sw.js` so old caches get cleared.
