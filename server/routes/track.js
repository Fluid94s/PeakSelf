import express from "express";
import { Pool } from "pg";

const router = express.Router();
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10
});

function categorize(sourceHint, referrer) {
  const s = (sourceHint || "").toLowerCase();
  const r = (referrer || "").toLowerCase();
  if (s.includes('instagram') || r.includes('instagram.com')) return 'instagram';
  if (s.includes('youtube') || r.includes('youtube.com') || r.includes('youtu.be')) return 'youtube';
  if (s.includes('google') || r.includes('google.')) return 'google';
  return 'other';
}

router.post('/', async (req, res) => {
  try {
    const referrer = typeof req.body?.referrer === 'string' ? req.body.referrer.substring(0, 2048) : (req.get('referer') || null);
    const path = typeof req.body?.path === 'string' ? req.body.path.substring(0, 512) : null;
    const sourceHint = typeof req.body?.source === 'string' ? req.body.source : null;
    const userAgent = (req.get('user-agent') || '').substring(0, 512);
    const ip = (req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '').toString().substring(0, 128);

    const source = categorize(sourceHint, referrer);

    await pool.query(
      `INSERT INTO traffic_events (path, referrer, user_agent, ip, source)
       VALUES ($1, $2, $3, $4, $5)`,
      [path, referrer, userAgent, ip, source]
    );

    res.json({ ok: true });
  } catch (e) {
    console.error('Track error:', e);
    // Do not reveal details
    res.status(200).json({ ok: true });
  }
});

export default router;
