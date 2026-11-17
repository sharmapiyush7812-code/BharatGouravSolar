/**
 * Gourav Bharat Solar – backend on Google Sheets (Google Apps Script)
 *
 * What it does
 *   POST  {type:'quote'|'order'|'newsletter', ...}  → saves a row in the matching sheet tab and emails you
 *   GET   ?action=track&id=SN-XXXXXX | ORD-XXXXXX   → returns the Status you set in the sheet
 *   GET   (no params)                               → health check
 *
 * Setup (full steps with screenshots-level detail are in README.md → "Backend"):
 *   1. Create a Google Sheet → Extensions → Apps Script → paste this file.
 *   2. Run setup() once and allow the permissions.
 *   3. Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone → copy the /exec URL.
 *   4. Paste that URL into  const API=''  in index.html.
 *
 * To change the status a customer sees when they track, just pick a new value in the Status column.
 */

const CONFIG = {
  BUSINESS_NAME: 'Gourav Bharat Solar',
  NOTIFY_EMAIL: '',        // where new enquiry / order emails go. Empty = the Google account that owns this script.
  SEND_EMAILS: true,       // set false to stop email alerts
  MAX_PER_10_MIN: 5        // max submissions per phone/email in 10 minutes (spam guard)
};

const SHEETS = {
  Quotes:     ['ID', 'Received', 'Status', 'Name', 'Phone', 'Email', 'City', 'Property type', 'Preferred date', 'Requirements', 'Source', 'Internal notes'],
  Orders:     ['ID', 'Received', 'Status', 'Name', 'Phone', 'Address', 'Pincode', 'City', 'Payment', 'Items', 'Installation', 'Coupon', 'Total (₹, as shown to customer)', 'Source', 'Internal notes'],
  Newsletter: ['Email', 'Subscribed', 'Source']
};
const STATUS = {
  Quotes: ['New', 'Contacted', 'Site visit booked', 'Quote sent', 'Won', 'Lost'],
  Orders: ['New', 'Confirmed', 'Dispatched', 'Delivered', 'Installed', 'Cancelled']
};
// What the customer sees when they track (internal words like "Lost" stay private)
const PUBLIC_STATUS = {
  'New': 'Received', 'Contacted': 'We have called you', 'Site visit booked': 'Site visit booked', 'Quote sent': 'Quote sent',
  'Won': 'Confirmed', 'Lost': 'Closed', 'Confirmed': 'Confirmed', 'Dispatched': 'Dispatched', 'Delivered': 'Delivered',
  'Installed': 'Installed', 'Cancelled': 'Cancelled'
};

const RE = {
  phone: /^[6-9]\d{9}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  pin: /^\d{6}$/,
  quoteId: /^SN-[A-Z0-9]{6}$/,
  orderId: /^ORD-[A-Z0-9]{6}$/
};

/* ------------------------------------------------------------------ setup */

/** Run once from the editor: creates the tabs, headers and Status dropdowns. Safe to run again. */
function setup() {
  const ss = SpreadsheetApp.getActive();
  Object.keys(SHEETS).forEach(name => sheet_(ss, name));
  const blank = ss.getSheetByName('Sheet1');
  if (blank && ss.getSheets().length > 1 && blank.getLastRow() === 0) ss.deleteSheet(blank);
}

function sheet_(ss, name) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    const head = SHEETS[name];
    sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold').setBackground('#ffe2b8');
    sh.setFrozenRows(1);
    sh.getRange('A:A').setNumberFormat('@');
  }
  return sh;
}

/* ------------------------------------------------------------------ web app */

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'track') return json_(track_(String(p.id || '').trim().toUpperCase()));
  return json_({ ok: true, service: CONFIG.BUSINESS_NAME });
}

function doPost(e) {
  let d;
  try { d = JSON.parse((e && e.postData && e.postData.contents) || '{}'); }
  catch (err) { return json_({ ok: false, error: 'Bad request' }); }

  if (d.website) return json_({ ok: true });              // honeypot: only bots fill the hidden field
  const handler = { quote: saveQuote_, order: saveOrder_, newsletter: saveNews_ }[d.type];
  if (!handler) return json_({ ok: false, error: 'Unknown request' });

  const key = String(d.phone || d.email || '').toLowerCase();
  if (key && tooMany_(key)) return json_({ ok: false, error: 'Too many requests. Please try again in a few minutes.' });

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    return json_(handler(d, SpreadsheetApp.getActive()));
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'Server busy. Please try again.' });
  } finally {
    lock.releaseLock();
  }
}

/* ------------------------------------------------------------------ handlers */

function saveQuote_(d, ss) {
  const id = String(d.id || '').toUpperCase();
  const name = clean_(d.name, 80), city = clean_(d.city, 80), email = String(d.email || '').trim().slice(0, 120);
  if (!RE.quoteId.test(id)) return { ok: false, error: 'Bad enquiry ID' };
  if (name.length < 2 || city.length < 2 || !RE.phone.test(d.phone) || !RE.email.test(email))
    return { ok: false, error: 'Please check your name, phone, email and city.' };

  const sh = sheet_(ss, 'Quotes');
  if (findRow_(sh, id)) return { ok: true, id, duplicate: true };   // a retry from the offline queue
  sh.appendRow([id, new Date(), 'New', name, text_(d.phone), clean_(email, 120), city, clean_(d.ptype, 30),
    clean_(d.date, 20), clean_(d.notes, 1000), clean_(d.source, 20), '']);
  status_(sh, 'Quotes');

  notify_(`New enquiry ${id} – ${name}, ${city}`, [
    ['Enquiry ID', id], ['Name', name], ['Phone', d.phone], ['Email', email], ['City', city],
    ['Property', d.ptype], ['Preferred date', d.date], ['Requirements', d.notes]
  ], ss);
  return { ok: true, id };
}

function saveOrder_(d, ss) {
  const id = String(d.id || '').toUpperCase();
  const name = clean_(d.name, 80), city = clean_(d.city, 80);
  const items = Array.isArray(d.items) ? d.items.slice(0, 30) : [];
  if (!RE.orderId.test(id)) return { ok: false, error: 'Bad order ID' };
  if (name.length < 2 || city.length < 2 || !RE.phone.test(d.phone) || !RE.pin.test(d.pin) || String(d.addr || '').trim().length < 6)
    return { ok: false, error: 'Please check your delivery details.' };
  if (!items.length || items.some(i => !(i.qty >= 1 && i.qty <= 99)))
    return { ok: false, error: 'Your cart looks empty.' };

  const sh = sheet_(ss, 'Orders');
  if (findRow_(sh, id)) return { ok: true, id, duplicate: true };
  const lines = items.map(i => `${Math.round(i.qty)} × ${clean_(i.name, 80)} @ ₹${Math.round(+i.price || 0).toLocaleString('en-IN')}`).join('\n');
  const total = Math.round(+d.total || 0);
  sh.appendRow([id, new Date(), 'New', name, text_(d.phone), clean_(d.addr, 300), text_(d.pin), city, clean_(d.pay, 30),
    lines, d.install ? 'Yes' : 'No', clean_(d.coupon, 20), total, clean_(d.source, 20), '']);
  status_(sh, 'Orders');

  notify_(`New order ${id} – ₹${total.toLocaleString('en-IN')} – ${name}`, [
    ['Order ID', id], ['Name', name], ['Phone', d.phone], ['Address', `${d.addr}, ${city} ${d.pin}`],
    ['Payment', d.pay], ['Items', lines], ['Installation', d.install ? 'Yes' : 'No'], ['Coupon', d.coupon || '–'],
    ['Total shown', '₹' + total.toLocaleString('en-IN')]
  ], ss);
  return { ok: true, id };
}

function saveNews_(d, ss) {
  const email = String(d.email || '').trim().toLowerCase().slice(0, 120);
  if (!RE.email.test(email)) return { ok: false, error: 'Enter a valid email' };
  const sh = sheet_(ss, 'Newsletter');
  if (!findRow_(sh, email)) sh.appendRow([clean_(email, 120), new Date(), clean_(d.source, 20)]);
  return { ok: true };
}

function track_(id) {
  const tab = RE.quoteId.test(id) ? 'Quotes' : RE.orderId.test(id) ? 'Orders' : null;
  if (!tab) return { ok: false, error: 'Invalid ID' };
  const sh = SpreadsheetApp.getActive().getSheetByName(tab);
  const row = sh && findRow_(sh, id);
  if (!row) return { ok: true, found: false };
  const v = sh.getRange(row, 1, 1, 3).getValues()[0];   // ID, Received, Status (no personal data is returned)
  return { ok: true, found: true, id, kind: tab === 'Quotes' ? 'enquiry' : 'order',
    status: PUBLIC_STATUS[v[2]] || 'Received', at: new Date(v[1]).getTime() };
}

/* ------------------------------------------------------------------ helpers */

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/** Trim, cap length, and stop spreadsheet formula injection (=, +, -, @ at the start). */
function clean_(v, max) {
  let s = String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B-\u001F]/g, '').trim().slice(0, max || 200);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

/** Keep digits like phone numbers and pincodes as text so Sheets doesn't reformat them. */
function text_(v) { return "'" + String(v || '').replace(/\D/g, ''); }

function findRow_(sh, value) {
  if (sh.getLastRow() < 2) return 0;
  const hit = sh.getRange(2, 1, sh.getLastRow() - 1, 1).createTextFinder(value).matchEntireCell(true).matchCase(false).findNext();
  return hit ? hit.getRow() : 0;
}

function status_(sh, tab) {
  const rule = SpreadsheetApp.newDataValidation().requireValueInList(STATUS[tab], true).setAllowInvalid(false).build();
  sh.getRange(sh.getLastRow(), 3).setDataValidation(rule);
}

function tooMany_(key) {
  const cache = CacheService.getScriptCache(), k = 'rl_' + Utilities.base64EncodeWebSafe(key).slice(0, 200);
  const n = Number(cache.get(k) || 0) + 1;
  cache.put(k, String(n), 600);
  return n > CONFIG.MAX_PER_10_MIN;
}

function notify_(subject, rows, ss) {
  if (!CONFIG.SEND_EMAILS) return;
  const to = CONFIG.NOTIFY_EMAIL || Session.getEffectiveUser().getEmail();
  if (!to) return;
  subject = subject.replace(/'(?=[=+\-@])/g, '');
  const e = s => String(s == null || s === '' ? '–' : s).replace(/^'(?=[=+\-@])/, '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/\n/g, '<br>');
  const html = `<table cellpadding="6" style="border-collapse:collapse;font:14px Arial">${rows.map(([k, v]) =>
    `<tr><td style="color:#666;vertical-align:top">${e(k)}</td><td><b>${e(v)}</b></td></tr>`).join('')}</table>
    <p><a href="${ss.getUrl()}">Open the sheet</a> to update the status.</p>`;
  try { MailApp.sendEmail({ to, subject: `[${CONFIG.BUSINESS_NAME}] ${subject}`, htmlBody: html }); }
  catch (err) { console.warn('Email not sent: ' + err); }   // daily email quota reached etc. – the row is still saved
}
