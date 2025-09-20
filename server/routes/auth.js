import express from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";

const router = express.Router();

// Database pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Email transporter (use environment variables)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
});

async function sendVerificationEmail(email, token) {
  const base = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  const url = `${base}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  // If SMTP not configured, log link so dev can proceed
  if (!process.env.SMTP_HOST) {
    console.log(`[DEV] Verification link for ${email}: ${url}`);
    return;
  }
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "no-reply@peakself.local",
    to: email,
    subject: "Verify your PeakSelf account",
    html: `<p>Click to verify your email:</p><p><a href="${url}">${url}</a></p>`
  });
}

// Passport serialization
passport.serializeUser((user, done) => {
  done(null, { id: user.id });
});

passport.deserializeUser(async (obj, done) => {
  try {
    const { rows } = await pool.query("SELECT id, email, provider, verified FROM users WHERE id = $1", [obj.id]);
    if (!rows[0]) return done(null, false);
    done(null, rows[0]);
  } catch (err) {
    done(err);
  }
});

const GOOGLE_ENABLED = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

// Google OAuth Strategy
if (GOOGLE_ENABLED) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value?.toLowerCase();
      const googleId = profile.id;
      if (!email) return done(null, false);

      // Try find by google_id first
      let { rows } = await pool.query("SELECT * FROM users WHERE google_id = $1", [googleId]);
      if (rows[0]) return done(null, rows[0]);

      // Then by email
      const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      const existing = result.rows[0];
      if (existing) {
        // If existing is local, link google_id, keep provider as local to allow local login
        if (existing.provider === 'local') {
          const updated = await pool.query(
            "UPDATE users SET google_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
            [googleId, existing.id]
          );
          return done(null, updated.rows[0]);
        }
        // If existing provider is google, ensure google_id set
        if (!existing.google_id) {
          const updated = await pool.query(
            "UPDATE users SET google_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
            [googleId, existing.id]
          );
          return done(null, updated.rows[0]);
        }
        return done(null, existing);
      }

      // Create new google user with password null and verified false; send verification email
      const insert = await pool.query(
        "INSERT INTO users (email, password_hash, provider, google_id, verified) VALUES ($1, NULL, 'google', $2, FALSE) RETURNING *",
        [email, googleId]
      );
      const user = insert.rows[0];
      const token = uuidv4();
      const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
      await pool.query(
        "INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
        [user.id, token, expires]
      );
      await sendVerificationEmail(email, token);
      return done(null, user);
    } catch (e) {
      return done(e);
    }
  }));
}

// Helpers
function ensureLocalAllowed(user) {
  if (!user) return "Invalid user";
  if (user.provider !== 'local') return "Local login disabled for this account";
  if (!user.verified) return "Please verify your email before logging in";
  return null;
}

// Local register
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
    const lower = String(email).toLowerCase();
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [lower]);
    const existing = rows[0];
    if (existing) {
      if (existing.provider === 'google') {
        return res.status(400).json({ error: "Google account exists for this email. Use Google Sign-In." });
      }
      return res.status(400).json({ error: "User already exists" });
    }
    const hash = await bcrypt.hash(password, 10);
    const insert = await pool.query(
      "INSERT INTO users (email, password_hash, provider, verified) VALUES ($1, $2, 'local', FALSE) RETURNING *",
      [lower, hash]
    );
    const user = insert.rows[0];
    const token = uuidv4();
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
    await pool.query(
      "INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [user.id, token, expires]
    );
    await sendVerificationEmail(lower, token);
    res.status(201).json({ message: "Registered. Please verify your email.", user: { id: user.id, email: user.email, provider: user.provider, verified: user.verified } });
  } catch (e) {
    res.status(500).json({ error: "Registration failed" });
  }
});

// Local login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
    const lower = String(email).toLowerCase();
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [lower]);
    const user = rows[0];
    const blockReason = ensureLocalAllowed(user);
    if (blockReason) return res.status(400).json({ error: blockReason });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });
    req.login({ id: user.id }, (err) => {
      if (err) return res.status(500).json({ error: "Login failed" });
      res.json({ message: "Logged in", user: { id: user.id, email: user.email, provider: user.provider, verified: user.verified } });
    });
  } catch (e) {
    res.status(500).json({ error: "Login failed" });
  }
});

// Start Google auth
router.get("/google", (req, res, next) => {
  if (!GOOGLE_ENABLED) return res.status(503).json({ error: "Google OAuth not configured" });
  return passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});

// Google callback
router.get("/google/callback", (req, res, next) => {
  if (!GOOGLE_ENABLED) return res.status(503).json({ error: "Google OAuth not configured" });
  return passport.authenticate("google", { failureRedirect: "/api/auth/google/failure" })(req, res, next);
}, (req, res) => {
  res.redirect(process.env.POST_AUTH_REDIRECT || "/");
});

router.get("/google/failure", (req, res) => {
  res.status(401).json({ error: "Google authentication failed" });
});

// Verify email
router.get("/verify-email", async (req, res) => {
  try {
    const token = String(req.query.token || "");
    if (!token) return res.status(400).json({ error: "Missing token" });
    const { rows } = await pool.query("SELECT * FROM email_verification_tokens WHERE token = $1 AND consumed_at IS NULL AND expires_at > NOW()", [token]);
    const rec = rows[0];
    if (!rec) return res.status(400).json({ error: "Invalid or expired token" });
    await pool.query("UPDATE users SET verified = TRUE, updated_at = NOW() WHERE id = $1", [rec.user_id]);
    await pool.query("UPDATE email_verification_tokens SET consumed_at = NOW() WHERE id = $1", [rec.id]);
    res.json({ message: "Email verified" });
  } catch (e) {
    res.status(500).json({ error: "Verification failed" });
  }
});

// Logout
router.post("/logout", (req, res) => {
  req.logout(() => {
    res.json({ message: "Logged out" });
  });
});

// Current session user
router.get("/me", (req, res) => {
  if (!req.user) return res.status(200).json({ user: null });
  res.json({ user: req.user });
});

export default router;



