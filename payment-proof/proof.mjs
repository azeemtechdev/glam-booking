// Payment proof: pay -> hold -> confirm -> payout, in the provider's TEST mode.
// Needs Node 18+. No packages. Usage:  node proof.mjs <command>
//   webhook          start a local server that verifies signed events
//   init [amount]    start a payment (amount in naira, default 45000) and print the checkout link
//   verify <ref>     confirm a payment directly with the provider
//   payout <ref>     pay the stylist their share (amount minus commission) for a verified payment
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';

if (fs.existsSync('.env')) for (const l of fs.readFileSync('.env', 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m && !l.trim().startsWith('#')) process.env[m[1]] = m[2];
}
const KEY = process.env.PAYSTACK_SECRET_KEY;
if (!KEY || !KEY.startsWith('sk_test_')) { console.error('Set PAYSTACK_SECRET_KEY to a TEST key (sk_test_...) in .env'); process.exit(1); }
const COMMISSION = Number(process.env.COMMISSION_PERCENT || 12);
const api = async (method, path, body) => {
  const r = await fetch('https://api.paystack.co' + path, { method, headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json(); if (!r.ok || j.status === false) throw new Error(`${path}: ${j.message || r.status}`); return j.data;
};
const split = (kobo) => { const fee = Math.round(kobo * COMMISSION / 100); return { fee, payout: kobo - fee }; };
const [cmd, arg] = process.argv.slice(2);

if (cmd === 'init') {
  const kobo = Math.round(Number(arg || 45000) * 100), reference = 'bk_' + crypto.randomBytes(6).toString('hex');
  const d = await api('POST', '/transaction/initialize', { email: 'customer@test.com', amount: kobo, reference, metadata: { booking_id: reference } });
  console.log('Reference:', reference, '\nOpen this link and pay with a test card:', d.authorization_url);
  console.log('Fee and payout:', split(kobo));
} else if (cmd === 'verify') {
  const d = await api('GET', `/transaction/verify/${arg}`);
  console.log({ status: d.status, amount_kobo: d.amount, paid_at: d.paid_at, ok: d.status === 'success' });
} else if (cmd === 'payout') {
  const tx = await api('GET', `/transaction/verify/${arg}`);
  if (tx.status !== 'success') throw new Error('Payment not successful, no payout');
  const { fee, payout } = split(tx.amount);
  const rec = await api('POST', '/transferrecipient', { type: 'nuban', name: process.env.TEST_ACCOUNT_NAME, account_number: process.env.TEST_ACCOUNT_NUMBER, bank_code: process.env.TEST_BANK_CODE, currency: 'NGN' });
  const t = await api('POST', '/transfer', { source: 'balance', amount: payout, recipient: rec.recipient_code, reason: `Payout for ${arg}`, reference: `po_${arg}` });
  console.log('Transfer started:', { status: t.status, payout_kobo: payout, fee_kobo: fee, reference: t.reference }, '\nWatch the webhook window for the final result.');
} else if (cmd === 'webhook') {
  http.createServer((req, res) => {
    let raw = ''; req.on('data', (c) => (raw += c));
    req.on('end', () => {
      const sig = crypto.createHmac('sha512', KEY).update(raw).digest('hex');
      if (sig !== req.headers['x-paystack-signature']) { console.log('REJECTED: bad signature'); res.writeHead(401).end(); return; }
      const e = JSON.parse(raw); console.log('EVENT', e.event, e.data?.reference, e.data?.amount ?? '');
      res.writeHead(200).end('ok');   // real back end: verify with the provider, then update booking and ledger
    });
  }).listen(3000, () => console.log('Webhook listening on :3000. Expose it (for example with a tunnel) and set it as the test webhook URL in the dashboard.'));
} else console.log('Commands: webhook | init [amount] | verify <ref> | payout <ref>');
