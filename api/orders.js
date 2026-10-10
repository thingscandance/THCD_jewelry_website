// POST /api/orders  { cart: [{id, size, q}] }  ->  { id }  (PayPal order ID)
const { paypal, buildOrder, send } = require('./_lib/paypal');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });
  let order;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    order = buildOrder(body.cart);
  } catch (e) {
    return send(res, 400, { error: e.message });
  }
  try {
    const r = await paypal('POST', '/v2/checkout/orders', order);
    if (!r.ok) console.error('create failed', r.status, JSON.stringify(r.data).slice(0, 1500));
    if (!r.ok) return send(res, 502, { error: 'PayPal could not create the order', details: r.data });
    send(res, 200, { id: r.data.id });
  } catch (e) {
    send(res, 500, { error: e.message });
  }
};
