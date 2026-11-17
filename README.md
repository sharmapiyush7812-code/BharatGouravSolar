# Bharat Gourav Solar

**Empowering India with Clean Energy.** This is the website and installable app for Bharat Gourav Solar, a rooftop solar business for homes, shops and factories.

It is a static site: one `index.html` with inline CSS and JavaScript, plus a service worker, a manifest and icons. There is no build step. Enquiries, orders and newsletter sign-ups can go to a **Google Sheet** through a small Google Apps Script backend in [`backend/Code.gs`](backend/Code.gs).

- **Live site (Netlify, free):** https://bharatgouravsolar.netlify.app/
- **Repository:** https://github.com/sharmapiyush7812-code/BharatGouravSolar

---

## Contents

1. [Features](#features)
2. [Project files](#project-files)
3. [Run it locally](#run-it-locally)
4. [Things you should fill in](#things-you-should-fill-in)
5. [Backend: Google Sheets](#backend-google-sheets)
6. [Deploy (Netlify)](#deploy-netlify)
7. [App (PWA)](#app-pwa)
8. [Data stored in the browser](#data-stored-in-the-browser)
9. [Editing content](#editing-content)
10. [Known limits and next steps](#known-limits-and-next-steps)

---

## Features

### Look and feel
- Light and dark themes. The site follows the phone or computer setting, and the sun/moon button in the navbar switches it (the choice is remembered).
- Fonts are Bricolage Grotesque for headings and Manrope for text.
- Warm ivory light mode and deep-night dark mode. The hero, "How it works", calculator and footer stay dark in both themes.
- Grid backgrounds, a bento layout and scroll-in animations. Animations are switched off for people who choose "reduce motion".
- One button system with these styles:
  - variants: primary, `alt`, `dark`, `green`, `link`
  - sizes: `sm`, `lg`, plus `block` for full width
  - states: a spinner while loading and a green ✓ when done
- Works from a 320px phone up to a large desktop. On mobile there is a bottom tab bar, and it respects safe areas such as the iPhone notch.
- Accessibility:
  - skip link and keyboard focus rings
  - ARIA labels and live regions
  - Escape closes the cart, chat and menus

### Sections (top to bottom)
| Section | What it does |
|---|---|
| **Hero** (`#home`) | A 3D rooftop made with three.js: a realistic sun moves across the sky and 12 panels follow it. The "Move the sun" slider shows live kW output. Buttons: *Check your savings*, *See how it works*, and *Call us* (only shown when a phone number is set). |
| **Why us** (`#why`) | Bento grid with:<br>• a daily generation curve you can drag through the day<br>• counters, the 25-year life ring and the battery tile<br>• a before/after bill example |
| **How it works** (`#working`) | An animated energy-flow diagram with three modes: **Sunny day**, **Night** and **Power cut**. Each mode explains the flow step by step and shows readouts, with a 4-step installation process below. |
| **Solutions** (`#solutions`) | Six service cards: rooftop, commercial, industrial, battery, inverters and maintenance. Clicking one pre-fills the quote form. |
| **Videos** (`#videos`) | Instagram section with a *Follow on Instagram* card for [@bharatgouravsolar](https://www.instagram.com/bharatgouravsolar/). Reels listed in `INSTA.reels` show as official Instagram embeds. They load only when the visitor scrolls near them, and they swipe sideways on phones. |
| **Our work** (`#work`) | A photo gallery. It stays hidden until real photos are added (see below). |
| **Shop** (`#products`) | 12 products with:<br>• category chips, search and sort<br>• a quick-view pop-up with details, quantity, *Add to cart*, *Buy now* and *Ask us*<br>• a quantity stepper on each card, plus a "fly to cart" animation and a vibration on phones |
| **Savings calculator** (`#calculator`) | Inputs: bill, tariff, roof area, property type and payment plan (Upfront / EMI 3 yrs / EMI 5 yrs).<br>Results: recommended kW, savings per month, cost, **PM Surya Ghar subsidy** (homes only), cost after subsidy, payback, 25-year savings, units per month, CO₂ avoided and the number of trees that equals.<br>Extras:<br>• an EMI vs savings comparison and a 25-year break-even chart<br>• **Share estimate**, which sends a link that reopens with the same numbers<br>• **Print / save PDF**<br>• the last inputs are remembered |
| **FAQ** (`#faq`) | Seven common questions (cost, subsidy, install time, power cuts, maintenance, net metering, EMI). |
| **Quote** (`#quote`) | Enquiry form with validation. On success you see an enquiry ID with *Copy ID* (and *WhatsApp us* if a number is set). A **Track** box takes an enquiry ID (`SN-…`) or an order ID (`ORD-…`). |
| **Checkout** (`#cart`) | Steps: cart, then delivery, then payment method. It includes:<br>• coupons (`SOLAR10`, `FIRST5`) and an optional installation fee (₹8,000)<br>• GST at 12% and a free-delivery bar (free above ₹50,000)<br>• an estimated delivery date as soon as a pincode is typed<br>• an order confirmation with an order ID |
| **Footer** | Contact details (from `BIZ`), quick links, newsletter sign-up and an "Install app" link. |

### Always available
- **Cart drawer** opens from the cart icon.
- **Login / sign up** dialog has a password show/hide toggle, and the account menu shows orders, enquiries and cart count. Logged-in users get their name and email filled in on forms.
- **"Surya" chat assistant** is a rule-based bot that understands English and simple Hinglish. It can:
  - estimate savings from a bill
  - explain prices, subsidy, batteries, installation, warranty and net metering
  - track `SN-`/`ORD-` IDs
  - open the shop or the quote form
- **WhatsApp button** floats on screen when `BIZ.whatsapp` is set.
- **Back-to-top button**, a scroll progress bar and toasts.

### SEO and sharing
- The page has a meta description, Open Graph and Twitter tags, and a canonical URL.
- It also includes JSON-LD data (Organization, WebSite and FAQPage), so Google can show the FAQ in search results.

---

## Project files

```
index.html             The whole website: markup, styles and scripts
sw.js                  Service worker (offline support and caching). Bump VERSION after every change.
manifest.webmanifest   App name, icons, colours and shortcuts (Calculator, Shop, Quote)
logo.png               Official logo (transparent PNG, cut from the logo artwork). Show it on a light background.
logo-mark.png          Logo inside a round white badge (navbar, chat, login, Instagram card)
icons/                 App icons made from the logo: 192, 512, maskable 512, Apple touch icon, favicon-64
robots.txt             Tells search engines they may index the site, and where the sitemap is
sitemap.xml            List of pages for Google Search Console
backend/Code.gs        Google Apps Script backend (copy it into your Google Sheet)
README.md              This file
.gitignore             Ignores backups (*backup*.html), .DS_Store, node_modules
App.js, code.css       Old files from the first version. Not used by index.html; safe to delete.
Index.*backup*.html    Local backups of earlier versions (git-ignored, not uploaded)
```

The only outside libraries are **three.js r128** (from cdnjs) and **Google Fonts**. If three.js fails to load, the hero simply shows without the 3D scene.

---

## Run it locally

The service worker and the share/copy buttons need a real web server, not a `file://` page.

```bash
cd "Bharat Gourav Solar "
python3 -m http.server 8000
# open http://localhost:8000
```

If you don't see your changes, the service worker may be serving an old copy. Do a hard reload, or in Chrome go to DevTools → Application → Service workers → tick *Update on reload*.

---

## Things you should fill in

All of these are near the top of the main `<script>` in `index.html`.

```js
const BIZ={phone:'',whatsapp:'',email:'',address:'',hours:''};
// e.g. phone:'+91 98xxxxxxxx', whatsapp:'+91 98xxxxxxxx', hours:'Mon–Sat, 9am–7pm'

const API='';   // your Google Apps Script URL (see Backend below)

const INSTA={handle:'bharatgouravsolar',reels:[]};   // Instagram reel links

const WORK=[['images/project-1.jpg',''], …];   // ['file','caption']
```

- **`BIZ`:** your contact details. Filling them in turns on the footer contact list, the hero *Call us* button, the floating WhatsApp button and *WhatsApp us* after an enquiry.
- **`API`:** connects forms to your Google Sheet.
- **`INSTA`:** Instagram videos for the Videos section. On Instagram, open a reel, tap **⋯ / Share → Copy link**, and paste it into the list:
  ```js
  const INSTA={handle:'bharatgouravsolar',reels:[
    'https://www.instagram.com/reel/ABC123xyz/',
    'https://www.instagram.com/reel/DEF456uvw/',
  ]};
  ```
  Keep 3–9 reels; newest first works best. The footer Instagram link and the Google data (`sameAs`) are already set.
- **`WORK`:** create an `images/` folder and add `project-1.jpg` … `project-6.jpg`. The "Our work" gallery appears by itself, and missing files are skipped.
- **Stats in "Why us":** 10,000+ installs, 500 MW, 98%, 100+ cities and 25+ years are placeholders. Change them to your real numbers in the `data-n` attributes.
- **Name order:** the logo artwork reads "Bharat Gourav Solar" while the site says "Bharat Gourav Solar". Make them match.

---

## Backend: Google Sheets

### Why Google Sheets (and not Netlify)

| | Google Sheets + Apps Script | Netlify Functions |
|---|---|---|
| Cost | Free | Free tier, then paid |
| Where you see leads | A normal spreadsheet on phone or laptop. Filter, sort, share with staff. | Needs a database plus an admin page you would have to build |
| Hosting | The site stays on GitHub Pages | The site has to move to Netlify |
| Email alerts | Built in (MailApp) | Needs an email service and API key |
| Skills needed | Copy, paste, click *Deploy* | Node.js, environment variables, a database |
| Good for | Up to a few thousand leads and orders a year, which suits this business | Large volume, payments, real user accounts |

At this stage, a lead sheet that the owner and staff can open from a phone is the most useful option. It also lasts well: you can later move to a database without changing the website. Only the `API` URL changes, as long as the new backend accepts the same JSON.

### What the backend does
- **POST `type: quote`:** adds a row to the **Quotes** tab and emails you.
- **POST `type: order`:** adds a row to the **Orders** tab (items, total, payment method, address) and emails you.
- **POST `type: newsletter`:** adds the email to the **Newsletter** tab, without duplicates.
- **GET `?action=track&id=…`:** returns the **Status** you set in the sheet. Customers see it in the Track box and in the chat. Only the status and date are returned, never personal details.
- **Status column:** each new row gets a drop-down.
  - Quotes: New → Contacted → Site visit booked → Quote sent → Won / Lost.
  - Orders: New → Confirmed → Dispatched → Delivered → Installed / Cancelled.
  - Customers see friendly wording; for example "Lost" shows as "Closed".
- **Protection:**
  - a hidden honeypot field stops simple bots
  - a limit of 5 submissions per phone or email every 10 minutes
  - server-side checks on phone, email and pincode
  - a lock so two people submitting at once don't clash
  - no duplicate rows when a request is retried
  - spreadsheet formula injection is blocked
- **Offline:** if the visitor is offline, the site saves the enquiry or order on the device and sends it by itself when the connection returns.

If `API` is empty, the site still works, but everything stays only in the visitor's own browser.

### Setup (about 10 minutes, one time)

1. Go to [sheets.google.com](https://sheets.google.com) and create a blank sheet named, for example, **GBS Leads**.
2. In the sheet, open **Extensions → Apps Script**.
3. Delete what is in `Code.gs`, paste the whole of [`backend/Code.gs`](backend/Code.gs), and press **Save** (💾).
4. Optional: edit `CONFIG` at the top:
   - `NOTIFY_EMAIL`: where alerts go. Empty means your Google account.
   - `SEND_EMAILS`: set it to `false` to stop alert emails.
5. Choose **`setup`** in the function drop-down and press **Run**. Google asks for permission: **Review permissions** → choose your account. You may see **Advanced → Go to … (unsafe)**; this warning appears for every personal script. Then press **Allow**. The *Quotes*, *Orders* and *Newsletter* tabs appear in the sheet.
6. Press **Deploy → New deployment**, click the ⚙️ and choose **Web app**, then set:
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**
   - Press **Deploy** and copy the **Web app URL**. It ends in `/exec`.
7. In `index.html`, paste it:
   ```js
   const API='https://script.google.com/macros/s/AKfy…/exec';
   ```
8. Bump `VERSION` in `sw.js` (for example `gbs-v7`), then commit and push.
9. Test it: submit a quote on the live site. A row should appear and you should get an email. Change the Status to *Site visit booked*, then track the ID on the site.

### Changing the backend later
After editing the script, go to **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**. This keeps the same URL, so you don't need to touch `index.html`. Choosing *New deployment* instead gives a new URL.

### Limits worth knowing
- **Gmail quota:** about 100 alert emails a day on a free Gmail account and 1,500 on Google Workspace. If the quota runs out, the row is still saved.
- **Speed:** each submission takes about 1–2 seconds; the button shows a spinner meanwhile.
- **Prices:** the order total in the sheet is what the customer saw in the browser. Confirm the price on the confirmation call before taking payment.

---

## Deploy (Netlify)

The site is hosted free on Netlify at **https://bharatgouravsolar.netlify.app** (project name `bharatgouravsolar`). `netlify.toml` turns off caching for `sw.js` and adds basic security headers.

To publish changes:

1. Bump `VERSION` in `sw.js`.
2. Run this from the project folder. It uploads only the site files, not the backups:
   ```bash
   rm -rf /tmp/gbs-deploy && mkdir /tmp/gbs-deploy && \
   cp -R index.html sw.js manifest.webmanifest logo.png logo-mark.png icons robots.txt sitemap.xml netlify.toml /tmp/gbs-deploy/ && \
   (cd /tmp/gbs-deploy && npx netlify-cli deploy --dir . --prod --site 9c91dc04-26af-488a-8406-bf87748fd90c)
   ```
   Add `images` to the `cp` list once you have project photos.
3. Commit and push to GitHub as a backup of the code.

To have every `git push` publish automatically, open Netlify → *Project configuration → Build & deploy → Link repository* and choose this GitHub repo, with no build command and publish directory `.`.

**Custom domain later:** buy `bharatgouravsolar.in` or `.com` (about ₹500–900 a year), then go to Netlify → *Domain management → Add a domain*. HTTPS is free. If you do, change the URL in `index.html` (canonical, `og:` tags, JSON-LD), `robots.txt` and `sitemap.xml`.

**Netlify settings to keep:**
- The site must stay public. Under *Project configuration → Access & security → Visitor access*, keep team-login protection off, or visitors and Google see a login page.
- Netlify adds a small "Powered by Netlify" badge on free projects. It is added by Netlify, not by this code.

### Show up on Google search (free)
The site already has a title, a description, structured data, `robots.txt` and `sitemap.xml`. To get Google to list it:

1. Open [Google Search Console](https://search.google.com/search-console) and choose **Add property → URL prefix**. Enter `https://bharatgouravsolar.netlify.app/`.
2. Verify ownership with the **HTML tag** option. Copy the `<meta name="google-site-verification" …>` tag, paste it in `<head>` of `index.html`, push, then press **Verify**.
3. Go to **Sitemaps**, submit `sitemap.xml`, then use **URL inspection → Request indexing** on the home page.
4. Google usually lists a new site within a few days to two weeks. Search `site:bharatgouravsolar.netlify.app` to check.

After that, the site shows up when people search for the brand name "Bharat Gourav Solar". Ranking for general searches like "solar company in <city>" takes longer. What helps most:
- a free **Google Business Profile** with your address and phone number
- real project photos and customer reviews
- links to the site from your WhatsApp, Instagram and Facebook pages

A custom domain such as `bharatgouravsolar.in` (about ₹500–900 a year) also looks more trustworthy than the `netlify.app` address, and Netlify connects it for free.

---

## App (PWA)

- **Installable:** Android/Chrome shows an *Install* bar, and the footer has an *Install app* link. iPhone users see a hint to tap *Share → Add to Home Screen*.
- **Offline:** pages already opened keep working offline.
  - Page loads try the network first and fall back to the cache.
  - Images, fonts and three.js come from the cache and refresh in the background.
- **Updates:** when a new version is installed, users see a *"A new version of the site is ready – Refresh"* message.
- **App extras:**
  - the app icon shows the number of cart items (badge)
  - the app opens full-screen with a bottom tab bar
  - long-pressing the icon gives shortcuts to Calculator, Shop and Quote
- **Every time you change any file, change `VERSION` in `sw.js`.** Otherwise installed apps keep the old copy.

---

## Data stored in the browser

These are `localStorage` keys on the visitor's device:

| Key | What it holds |
|---|---|
| `sn_cart`, `sn_coupon` | Cart contents and applied coupon |
| `sn_orders`, `sn_quotes` | The visitor's own orders and enquiries (for the account menu and tracking) |
| `sn_users`, `sn_user` | Local accounts (password stored as a SHA-256 hash) and the logged-in user |
| `gbs_calc` | Last calculator inputs |
| `gbs_outbox` | Enquiries or orders waiting to be sent while offline |
| `gbs_theme`, `gbs_install_x` | Theme choice and "install bar dismissed" |

---

## Editing content

All of these live in the main script of `index.html`:

- **Products:** the `PROD` array (`id, name, category, price, rating`) and `PDESC` (quick-view text for each category).
- **Coupons:** `COUPONS`. Free-delivery limit: `FREE`. GST rate and installation fee: inside `calc()`.
- **Price per kW for the calculator:** `RATE` (Residential / Commercial / Industrial). Sizing maths lives in `sizeSystem()`.
- **Subsidy rules:** `subsidyFor()`. It currently follows PM Surya Ghar 2024: ₹30,000/kW up to 2 kW, ₹18,000 for the 3rd kW, maximum ₹78,000, homes only. Update it if the government changes the scheme.
- **EMI interest rate:** `emiFor()`, default 10% a year.
- **FAQ:** the `FAQ` array. Also update the FAQ JSON-LD in `<head>` so Google sees the same questions.
- **Chat answers:** `reply()` inside the chat section.
- **Services:** the `SOL` array.

---

## Known limits and next steps

- **Login is local only.** Accounts live in each visitor's browser and don't sync between devices. Real accounts would need Firebase Auth or Supabase. Don't store real passwords in Google Sheets.
- **No online payment yet.** Orders record the chosen method (UPI, card, net banking, cash on delivery) and your team confirms by phone. For real payments, add Razorpay or Cashfree with a server-side check.
- **Delivery date** is an estimate (4–7 working days), not a courier quote.
- **Testimonials** are not included on purpose. Add them only from real customers, with their permission.
- **Possible next steps:**
  - a Hindi language version
  - real project photos in `images/`
  - Google Analytics or Microsoft Clarity
  - a Google Business Profile linked to the site
