// POST /api/capture  { orderID }  ->  PayPal capture result (status, payer, details)
// After a completed payment an order e-mail is sent to the shop (optional: needs RESEND_API_KEY).
const { paypal, send } = require('./_lib/paypal');

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function notify(order) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const pu = (order.purchase_units || [])[0] || {};
  const cap = ((pu.payments || {}).captures || [])[0] || {};
  const payer = order.payer || {};
  const name = [((payer.name || {}).given_name), ((payer.name || {}).surname)].filter(Boolean).join(' ');
  const ship = pu.shipping || {};
  const a = ship.address || {};
  const addr = [(ship.name || {}).full_name, a.address_line_1, a.address_line_2, [a.postal_code, a.admin_area_2].filter(Boolean).join(' '), a.admin_area_1, a.country_code].filter(Boolean);
  const cm = String(pu.custom_id || '').match(/^tel (.*?)(?: \| (.*))?$/) || [];
  const contact = { tel: cm[1] || '', email: cm[2] || '' };
  const items = (pu.items || []).map(i => '<tr><td>' + esc(i.name) + '</td><td>' + esc(i.description) + '</td><td>&times;' + esc(i.quantity) + '</td><td>' + esc(i.unit_amount && i.unit_amount.value) + ' ' + esc(i.unit_amount && i.unit_amount.currency_code) + '</td></tr>').join('');
  const total = (cap.amount || pu.amount || {});
  const html = '<h2>New THCD order</h2>' +
    '<p><b>Total:</b> ' + esc(total.value) + ' ' + esc(total.currency_code) + '<br><b>PayPal order:</b> ' + esc(order.id) + '</p>' +
    '<table cellpadding="6" border="1" style="border-collapse:collapse">' + items + '</table>' +
    '<p><b>Buyer:</b> ' + esc(name) + ' &lt;' + esc(payer.email_address) + '&gt;<br><b>Phone:</b> ' + esc(contact.tel) + '<br><b>Email given on the site:</b> ' + esc(contact.email) + '</p>' +
    '<p><b>Ship to:</b><br>' + addr.map(esc).join('<br>') + '</p>';
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.ORDER_EMAIL_FROM || 'THCD shop <onboarding@resend.dev>',
      to: [process.env.ORDER_EMAIL || 'marina.marbl@gmail.com'],
      reply_to: contact.email || payer.email_address || undefined,
      subject: 'New order ' + esc(total.value) + ' ' + esc(total.currency_code) + (name ? ' from ' + name : ''),
      html
    })
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const id = String(body.orderID || '');
  if (!/^[A-Z0-9]{8,36}$/.test(id)) return send(res, 400, { error: 'Bad order id' });
  try {
    const r = await paypal('POST', '/v2/checkout/orders/' + id + '/capture');
    if (r.ok && r.data && r.data.status === 'COMPLETED') {
      // Items with sizes are only in the full order, so read it back before e-mailing. Never let mail break checkout.
      try { const full = await paypal('GET', '/v2/checkout/orders/' + id); await notify(full.ok ? full.data : r.data); }
      catch (e) { console.error('order e-mail failed', e.message); }
    }
    if (!r.ok || (r.data && r.data.status !== 'COMPLETED')) console.error('capture failed', r.status, JSON.stringify(r.data).slice(0, 1500));
    // Pass PayPal's answer through: the browser needs `details` to handle a declined card (INSTRUMENT_DECLINED).
    send(res, r.ok ? 200 : r.status, r.data);
  } catch (e) {
    send(res, 500, { error: e.message });
  }
};
