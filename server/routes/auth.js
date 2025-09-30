import express from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

const router = express.Router();

// Database pool
const dbUrl = process.env.DATABASE_URL;
if (typeof dbUrl !== 'string' || !dbUrl) {
  throw new Error('DATABASE_URL environment variable is not set or is not a string. Please ensure it is correctly configured.');
}

// Create database pool with connection timeout and retry settings
const pool = new Pool({ 
  connectionString: dbUrl,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10
});

async function ensureSchema() {
  try {
    await pool.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS name TEXT,
        ADD COLUMN IF NOT EXISTS avatar_url TEXT
    `);
  } catch (e) {
    console.warn('Warning: Failed to ensure users table optional columns (name, avatar_url):', e.message);
  }
}

// Test database connection on startup
let isDatabaseAvailable = false;
pool.connect(async (err, client, release) => {
  if (err) {
    console.warn('Warning: Database connection failed:', err.message);
    console.warn('Server will start but database features will not work.');
    console.warn('For local development, consider setting up a local PostgreSQL database.');
    isDatabaseAvailable = false;
  } else {
    console.log('Database connected successfully');
    isDatabaseAvailable = true;
    release();
    await ensureSchema();
  }
});

// Helper function to check if database operations should be attempted
function checkDatabaseAvailability(res) {
  if (!isDatabaseAvailable) {
    res.status(503).json({ 
      error: "Database unavailable", 
      message: "Database connection is not available. Please check your database configuration." 
    });
    return false;
  }
  return true;
}

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
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "no-reply@peakself.local",
      to: email,
      subject: "Verify your PeakSelf account",
      html: `<p>Click to verify your email:</p><p><a href="${url}">${url}</a></p>`
    });
  } catch (e) {
    // Do not block registration on email failures in dev or misconfigured SMTP
    console.warn('Email send failed (continuing):', e.message);
  }
}

// Passport serialization
passport.serializeUser((user, done) => {
  done(null, { id: user.id });
});

passport.deserializeUser(async (obj, done) => {
  try {
    const { rows } = await pool.query("SELECT id, email, provider, verified, name, avatar_url, role FROM users WHERE id = $1", [obj.id]);
    if (!rows[0]) return done(null, false);
    done(null, rows[0]);
  } catch (err) {
    done(err);
  }
});

// Check Google OAuth configuration at runtime
function isGoogleEnabled() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

// Setup Google OAuth strategy at startup if enabled
if (isGoogleEnabled()) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value?.toLowerCase();
      const googleId = profile.id;
      const displayName = profile.displayName || null;
      const avatarUrl = profile.photos?.[0]?.value || null;
      if (!email) return done(null, false);

      // Try find by google_id first
      let { rows } = await pool.query("SELECT * FROM users WHERE google_id = $1", [googleId]);
      if (rows[0]) {
        // Update avatar/name opportunistically
        const updated = await pool.query(
          "UPDATE users SET name = COALESCE(name, $1), avatar_url = $2, updated_at = NOW() WHERE id = $3 RETURNING *",
          [displayName, avatarUrl, rows[0].id]
        );
        return done(null, updated.rows[0]);
      }

      // Then by email
      const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      const existing = result.rows[0];
      if (existing) {
        // If existing is local, link google_id, keep provider as local to allow local login
        if (existing.provider === 'local') {
          const updated = await pool.query(
            "UPDATE users SET google_id = $1, avatar_url = COALESCE($2, avatar_url), name = COALESCE(name, $3), updated_at = NOW() WHERE id = $4 RETURNING *",
            [googleId, avatarUrl, displayName, existing.id]
          );
          return done(null, updated.rows[0]);
        }
        // If existing provider is google, ensure google_id set and update profile info
        if (!existing.google_id || existing.avatar_url !== avatarUrl) {
          const updated = await pool.query(
            "UPDATE users SET google_id = $1, avatar_url = $2, name = COALESCE(name, $3), updated_at = NOW() WHERE id = $4 RETURNING *",
            [googleId, avatarUrl, displayName, existing.id]
          );
          return done(null, updated.rows[0]);
        }
        return done(null, existing);
      }

      // Create new google user - Google users are automatically verified
      const insert = await pool.query(
        "INSERT INTO users (email, password_hash, provider, google_id, verified, name, avatar_url) VALUES ($1, NULL, 'google', $2, TRUE, $3, $4) RETURNING *",
        [email, googleId, displayName, avatarUrl]
      );
      const user = insert.rows[0];
      console.log(`New Google user created: ${email}`);
      return done(null, user);
    } catch (e) {
      console.error('Google OAuth error:', e);
      return done(e);
    }
  }));
  console.log('Google OAuth strategy initialized');
} else {
  console.log('Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
}

// Helpers
function ensureLocalAllowed(user) {
  if (!user) return "Invalid user";
  if (user.provider !== 'local') return "Local login disabled for this account";
  if (!user.verified) return "Please verify your email before logging in";
  return null;
}

function signJwt(user) {
  const secret = process.env.JWT_SECRET || "dev_jwt_secret_change_me";
  const payload = { sub: user.id, email: user.email, role: user.role };
  const token = jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn: '1d' });
  return token;
}

async function getUserById(id) {
  const { rows } = await pool.query("SELECT id, email, provider, verified, name, avatar_url, role FROM users WHERE id = $1", [id]);
  return rows[0] || null;
}

function setJwtCookie(res, token) {
  res.cookie('access_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  });
}

function verifyJwtFromRequest(req) {
  try {
    const token = req.cookies?.access_token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
    if (!token) return null;
    const secret = process.env.JWT_SECRET || "dev_jwt_secret_change_me";
    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (_) {
    return null;
  }
}

// Local register (accepts name; can merge a Google-only account by setting a local password)
router.post("/register", async (req, res) => {
  if (!checkDatabaseAvailability(res)) return;
  
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
    const lower = String(email).toLowerCase();
    const safeName = typeof name === 'string' && name.trim() ? name.trim() : null;
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [lower]);
    const existing = rows[0];
    if (existing) {
      if (existing.provider === 'google') {
        // Merge: keep google_id; set password_hash; flip provider to local to allow both login methods
        const hash = await bcrypt.hash(password, 10);
const updated = await pool.query(
          "UPDATE users SET password_hash = $1, provider = 'local', name = COALESCE($2, name), updated_at = NOW() WHERE id = $3 RETURNING id, email, provider, verified, name, avatar_url, role",
          [hash, safeName, existing.id]
        );
        const merged = updated.rows[0];
        const token = signJwt(merged);
        setJwtCookie(res, token);
        return req.login({ id: merged.id }, (err) => {
          if (err) return res.status(200).json({ message: "Password set. You are now logged in.", user: merged });
          return req.session.save(() => res.status(200).json({ message: "Password set. You are now logged in.", user: merged }));
        });
      }
      return res.status(400).json({ error: "User already exists" });
    }
    const hash = await bcrypt.hash(password, 10);
const insert = await pool.query(
      "INSERT INTO users (email, password_hash, provider, verified, name) VALUES ($1, $2, 'local', FALSE, $3) RETURNING *",
      [lower, hash, safeName]
    );
    const user = insert.rows[0];
    const token = uuidv4();
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
    await pool.query(
      "INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [user.id, token, expires]
    );
    await sendVerificationEmail(lower, token);
const jwtToken = signJwt(user);
    setJwtCookie(res, jwtToken);
    return req.login({ id: user.id }, (err) => {
      if (err) return res.status(201).json({ message: "Registered. Please verify your email.", user: { id: user.id, email: user.email, provider: user.provider, verified: user.verified, name: user.name, avatar_url: user.avatar_url, role: user.role } });
      // Ensure the session is saved before responding
      return req.session.save(() => res.status(201).json({ message: "Registered and logged in. Check your email to verify.", user: { id: user.id, email: user.email, provider: user.provider, verified: user.verified, name: user.name, avatar_url: user.avatar_url, role: user.role } }));
    });
  } catch (e) {
    console.error('Registration error:', e);
    const msg = process.env.NODE_ENV === 'production' ? 'Registration failed' : `Registration failed: ${e.message}`;
    res.status(500).json({ error: msg });
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
    const token = signJwt(user);
    setJwtCookie(res, token);
    req.login({ id: user.id }, (err) => {
      if (err) return res.status(500).json({ error: "Login failed" });
      return req.session.save(() => res.json({ message: "Logged in", user: { id: user.id, email: user.email, provider: user.provider, verified: user.verified, name: user.name, avatar_url: user.avatar_url, role: user.role } }));
    });
  } catch (e) {
    console.error('Login error:', e);
    const msg = process.env.NODE_ENV === 'production' ? 'Login failed' : `Login failed: ${e.message}`;
    res.status(500).json({ error: msg });
  }
});

// Start Google auth
router.get("/google", (req, res, next) => {
  if (!isGoogleEnabled()) {
    return res.status(503).json({ error: "Google OAuth not configured" });
  }
  
  console.log('Starting Google OAuth flow');
  return passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});

// Google callback
router.get("/google/callback", (req, res, next) => {
  if (!isGoogleEnabled()) return res.status(503).json({ error: "Google OAuth not configured" });
  
  console.log('Google OAuth callback received');
return passport.authenticate("google", { 
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_failed` 
  })(req, res, next);
}, async (req, res) => {
  console.log('Google OAuth success, user:', req.user?.email);
  try {
    if (req.user) {
      const user = await getUserById(req.user.id);
      const token = signJwt(user);
      setJwtCookie(res, token);
      return res.redirect(process.env.CLIENT_URL || 'http://localhost:5173');
    }
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_failed`);
  } catch (e) {
    console.error('Post Google login error:', e);
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_failed`);
  }
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
    await pool.query("UPDATE users SET verified = TRUE, updated_at = NOW() WHERE id::text = $1", [rec.user_id]);
    await pool.query("UPDATE email_verification_tokens SET consumed_at = NOW() WHERE id = $1", [rec.id]);
    res.json({ message: "Email verified" });
  } catch (e) {
    console.error('Email verification error:', e);
    const msg = process.env.NODE_ENV === 'production' ? 'Verification failed' : `Verification failed: ${e.message}`;
    res.status(500).json({ error: msg });
  }
});

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie('access_token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
  req.logout(() => {
    res.json({ message: "Logged out" });
  });
});

// Current user via JWT (fallback to session)
router.get("/me", async (req, res) => {
  try {
    const decoded = verifyJwtFromRequest(req);
    if (decoded?.sub) {
      const user = await getUserById(decoded.sub);
      return res.json({ user });
    }
    if (req.user) return res.json({ user: req.user });
    return res.status(200).json({ user: null });
  } catch (e) {
    return res.status(200).json({ user: null });
  }
});

// Development-only: session debug
if (process.env.NODE_ENV !== 'production') {
  router.get("/debug/session", (req, res) => {
    res.json({
      authenticated: Boolean(req.user),
      sessionId: req.sessionID,
      user: req.user || null
    });
  });
}

export default router;



