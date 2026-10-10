// Shared server helpers for the PayPal checkout.
// Prices are read from data/catalog.js on the server, so the browser can never set the amount.
const fs = require('fs');
const path = require('path');

let _catalog = null;
function catalog() {
  if (_catalog) return _catalog;
  const raw = fs.readFileSync(path.join(process.cwd(), 'data', 'catalog.js'), 'utf8');
  const json = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
  _catalog = JSON.parse(json);
  return _catalog;
}

const LIVE = String(process.env.PAYPAL_ENV || '').trim().toLowerCase() === 'live';
const API = LIVE ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

async function accessToken() {
  const id = (process.env.PAYPAL_CLIENT_ID || '').trim(), secret = (process.env.PAYPAL_CLIENT_SECRET || '').trim();
  if (!id || !secret) throw new Error('PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET are not set');
  const r = await fetch(API + '/v1/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(id + ':' + secret).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const data = await r.json();
  if (!r.ok) throw new Error('PayPal auth failed: ' + (data.error_description || r.status));
  return data.access_token;
}

async function paypal(method, url, body) {
  const token = await accessToken();
  const r = await fetch(API + url, {
    method,
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

const money = v => (Math.round(v * 100) / 100).toFixed(2);

// Turn the cart sent by the browser into PayPal line items, using server prices only.
function buildOrder(cart) {
  const cat = catalog();
  if (!Array.isArray(cart) || !cart.length || cart.length > 30) throw new Error('Cart is empty');
  const items = cart.map(line => {
    const p = cat.products.find(x => x.id === line.id && x.real);
    if (!p) throw new Error('Unknown piece: ' + line.id);
    const q = Math.floor(Number(line.q));
    if (!(q >= 1 && q <= 9)) throw new Error('Bad quantity');
    let size = null;
    if (p.sizes) {
      size = String(line.size || '');
      if (!p.sizes.includes(size)) throw new Error('Choose a size for ' + p.name);
    }
    return {
      name: p.name.slice(0, 127),
      sku: (p.code + (size ? '-' + size : '')).slice(0, 127),
      description: size ? 'Size ' + size : 'Single',
      quantity: String(q),
      unit_amount: { currency_code: cat.currency, value: money(p.price) },
      category: 'PHYSICAL_GOODS'
    };
  });
  const itemTotal = items.reduce((s, i) => s + Number(i.unit_amount.value) * Number(i.quantity), 0);
  const shipping = Number(cat.shipping) || 0;
  return {
    intent: 'CAPTURE',
    // Ask PayPal for the buyer's delivery address (shown to them before they confirm) and label the button "Pay now".
    // application_context (not payment_source.paypal) so it also works for the card button.
    application_context: { shipping_preference: 'GET_FROM_FILE', user_action: 'PAY_NOW', brand_name: 'THINGS CAN DANCE' },
    purchase_units: [{
      description: 'THCD order',
      amount: {
        currency_code: cat.currency,
        value: money(itemTotal + shipping),
        breakdown: {
          item_total: { currency_code: cat.currency, value: money(itemTotal) },
          shipping: { currency_code: cat.currency, value: money(shipping) }
        }
      },
      items
    }]
  };
}

function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(obj));
}

module.exports = { catalog, paypal, buildOrder, send };
