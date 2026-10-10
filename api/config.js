// Public PayPal settings for the browser (the client ID is public by design; the secret never leaves the server).
const { catalog, send } = require('./_lib/paypal');

module.exports = (req, res) => {
  const id = (process.env.PAYPAL_CLIENT_ID || '').trim();
  if (!id) return send(res, 503, { error: 'Payment is not configured yet' });
  send(res, 200, { clientId: id, currency: catalog().currency, live: String(process.env.PAYPAL_ENV || '').trim().toLowerCase() === 'live',
    // non-secret diagnostics: which deployment answered and what mode word it was given
    mode: String(process.env.PAYPAL_ENV || '(not set)').slice(0, 12), build: String(process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7), target: process.env.VERCEL_ENV || '' });
};
