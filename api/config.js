// Public PayPal settings for the browser (the client ID is public by design; the secret never leaves the server).
const { catalog, send } = require('./_lib/paypal');

module.exports = (req, res) => {
  const id = process.env.PAYPAL_CLIENT_ID;
  if (!id) return send(res, 503, { error: 'Payment is not configured yet' });
  send(res, 200, { clientId: id, currency: catalog().currency, live: process.env.PAYPAL_ENV === 'live' });
};
