// Fired once by Upstash QStash after the exact delay scheduled by
// schedule-gap-notification. Verifies the request really came from QStash,
// checks email_notified_at for idempotency (QStash retries on any non-2xx —
// without this a transient failure after send could double-email), sends
// the email via Resend, then marks the session as notified.
const { Receiver } = require('@upstash/qstash');
const { createClient } = require('@supabase/supabase-js');

module.exports.config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

const REASON_LABELS = {
  STOP_LOSS: 'Stop loss triggered',
  TAKE_PROFIT: 'Take profit reached',
  MAX_TRADES: 'Session trade limit reached',
  TIME_EXPIRED: 'Session timer expired',
  TIME_EXPIRED_NO_TRADE: 'No qualifying setup found',
  MANUAL: 'Session ended manually',
};

function emailHtml({ modeLabel, reasonLabel, appUrl }) {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f4f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 2px rgba(15,23,42,0.05),0 8px 24px -12px rgba(15,23,42,0.12);">
            <tr>
              <td style="background:linear-gradient(135deg,#5b67f2,#8b5cf6);padding:28px 32px;">
                <span style="color:#ffffff;font-size:16px;font-weight:700;letter-spacing:-0.01em;">TheGiftedMan Trading Tool</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#7b8294;">${modeLabel} account</p>
                <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#171b26;">Your session cooldown has ended</h1>
                <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#444b5c;">
                  You can start a new session now. Your last session ended with reason:
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                  <tr>
                    <td style="background:#f4f5f9;border-radius:8px;padding:10px 14px;font-size:13px;font-weight:600;color:#171b26;">
                      ${reasonLabel}
                    </td>
                  </tr>
                </table>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:10px;background:linear-gradient(135deg,#4f5ae8,#7c3aed);">
                      <a href="${appUrl}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">Open TheGiftedMan</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #eceef4;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#7b8294;">
                  You're receiving this because session-gap notifications are enabled on your TheGiftedMan Trading Tool account.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const rawBody = await readRawBody(req);

  const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
  });
  let valid = false;
  try {
    valid = await receiver.verify({ signature: req.headers['upstash-signature'], body: rawBody });
  } catch (e) {
    console.error('QStash signature verification failed', e);
  }
  if (!valid) {
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  const { sessionId, mode, email, endReason } = JSON.parse(rawBody || '{}');
  if (!sessionId || !mode || !email) {
    res.status(400).json({ error: 'Missing sessionId, mode, or email' });
    return;
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: session, error: fetchErr } = await supabase
    .from('sessions').select('id, email_notified_at').eq('id', sessionId).maybeSingle();
  if (fetchErr) {
    console.error('send-gap-notification fetch failed', fetchErr);
    res.status(500).json({ error: 'Lookup failed' });
    return;
  }
  if (!session || session.email_notified_at) {
    // Already notified (or the session/trade history was reset since scheduling) — no-op, still 200 so QStash doesn't retry.
    res.status(200).json({ skipped: true });
    return;
  }

  const modeLabel = mode === 'REAL' ? 'Real' : 'Demo';
  const reasonLabel = REASON_LABELS[endReason] || 'Session ended';
  const appUrl = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || req.headers.host}`;

  try {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TheGiftedMan Trading Tool <onboarding@resend.dev>',
        to: email,
        subject: `Your ${modeLabel} session cooldown has ended`,
        html: emailHtml({ modeLabel, reasonLabel, appUrl }),
      }),
    });
    if (!emailRes.ok) {
      const detail = await emailRes.text().catch(() => '');
      throw new Error(`Resend send failed (${emailRes.status}): ${detail}`);
    }
  } catch (e) {
    console.error('send-gap-notification email send failed', e);
    res.status(502).json({ error: 'Email send failed' });
    return;
  }

  await supabase.from('sessions').update({ email_notified_at: new Date().toISOString() }).eq('id', sessionId);
  res.status(200).json({ sent: true });
};
