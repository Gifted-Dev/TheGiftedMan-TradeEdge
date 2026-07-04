// Called by the app the instant a session ends. Schedules exactly ONE
// precisely-delayed call to send-gap-notification via Upstash QStash — no
// polling, no cron-frequency limits (Vercel Hobby caps Cron Jobs at once a
// day, which is useless for "notify within minutes of the gap ending").
// The gap duration itself is computed client-side (App.js already has the
// authoritative no-trade-streak/session-style logic) and passed in — this
// function only schedules and never re-derives that logic, so there's one
// source of truth for "how long is the gap" instead of two copies to keep in sync.
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { sessionId, mode, email, endReason, gapMs } = req.body || {};
  if (!sessionId || !mode || !email || !Number.isFinite(gapMs) || gapMs <= 0) {
    res.status(400).json({ error: 'Missing or invalid sessionId, mode, email, or gapMs' });
    return;
  }

  const qstashToken = process.env.QSTASH_TOKEN;
  if (!qstashToken) {
    res.status(500).json({ error: 'QSTASH_TOKEN not configured' });
    return;
  }

  const destination = `https://${req.headers.host}/api/send-gap-notification`;
  const delaySeconds = Math.ceil(gapMs / 1000);

  try {
    const qstashRes = await fetch(`https://qstash.upstash.io/v2/publish/${destination}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${qstashToken}`,
        'Content-Type': 'application/json',
        'Upstash-Delay': `${delaySeconds}s`,
      },
      body: JSON.stringify({ sessionId, mode, email, endReason: endReason || null }),
    });
    if (!qstashRes.ok) {
      const detail = await qstashRes.text().catch(() => '');
      throw new Error(`QStash publish failed (${qstashRes.status}): ${detail}`);
    }
    res.status(200).json({ scheduled: true, delaySeconds });
  } catch (e) {
    console.error('schedule-gap-notification failed', e);
    res.status(502).json({ error: 'Could not schedule notification' });
  }
};
