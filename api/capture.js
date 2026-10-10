// POST /api/capture  { orderID }  ->  PayPal capture result (status, payer, details)
const { paypal, send } = require('./_lib/paypal');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const id = String(body.orderID || '');
  if (!/^[A-Z0-9]{8,36}$/.test(id)) return send(res, 400, { error: 'Bad order id' });
  try {
    const r = await paypal('POST', '/v2/checkout/orders/' + id + '/capture');
    // Pass PayPal's answer through: the browser needs `details` to handle a declined card (INSTRUMENT_DECLINED).
    send(res, r.ok ? 200 : r.status, r.data);
  } catch (e) {
    send(res, 500, { error: e.message });
  }
};
