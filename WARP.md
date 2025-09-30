# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Repository overview
- Monorepo with two Node.js projects:
  - client/: React 19 app built with Vite 7 (React Router 7). Dev server runs on http://localhost:5173.
  - server/: Express 5 API server (ES modules) on http://localhost:5000. Uses PostgreSQL, express-session, passport (optional Google OAuth), and nodemailer for email flows.
- Dev integration: the client makes API requests directly to the API base (default http://localhost:5000). Vite is configured to proxy /api to the server, but most code uses an absolute API base via VITE_API_BASE.

Commands you will commonly use
- Install dependencies
  - Root tooling (concurrently, nodemon):
    - npm install
  - Client app:
    - npm --prefix client install
  - Server API:
    - npm --prefix server install

- Run in development
  - Full stack (client + server concurrently):
    - npm run dev
  - Client only:
    - npm --prefix client run dev
  - Server only (with live reload):
    - npm --prefix server run dev

- Build and preview (client)
  - Build client:
    - npm run build
  - Preview built client (serves dist/):
    - npm run preview

- Lint (client)
  - npm --prefix client run lint

- Start API server (production mode)
  - npm --prefix server run start

- Tests
  - No test tooling is configured in this repository at present.

Environment configuration
- Server loads environment variables via dotenv. Create server/.env with the keys you need. Common variables:
  - PORT=5000
  - CLIENT_URL=http://localhost:5173
  - DATABASE_URL=postgres://... (required; server will exit if not set)
  - SESSION_SECRET=... (use a strong value)
  - SMTP_HOST=...
  - SMTP_PORT=587
  - SMTP_USER=...
  - SMTP_PASS=...
  - EMAIL_FROM=no-reply@peakself.local
  - APP_BASE_URL=http://localhost:5000
  - GOOGLE_CLIENT_ID=... (optional)
  - GOOGLE_CLIENT_SECRET=... (optional)
  - GOOGLE_CALLBACK_URL=/api/auth/google/callback (optional)
- Client API base (optional): set VITE_API_BASE to override the default http://localhost:5000 used in the client. In dev, the client runs on http://localhost:5173.

High-level architecture and integration
- Frontend (client/)
  - React 19 app using React Router (src/App.jsx) with routes: /, /blog, /blog/:slug, /about, /contact, /login, /register.
  - UI composed of pages (src/pages/*) and reusable components (src/components/*) with sidecar CSS files. Blog content is currently static (src/data/blogPosts.js).
  - Network calls target an API base defined by import.meta.env.VITE_API_BASE, defaulting to http://localhost:5000.
  - ESLint uses a flat config (eslint.config.js) with @eslint/js, react-hooks, and react-refresh rule sets.

- Backend (server/)
  - Express app (server/index.js) with CORS configured for CLIENT_URL and sessions via express-session. In production it sets trust proxy for secure cookies.
  - Routes are modular:
    - /api/auth (server/routes/auth.js): Local email/password register/login with bcrypt; email verification via tokens; Google OAuth 2.0 via passport-google-oauth20 when GOOGLE_CLIENT_* vars are present; session-based auth using passport.
    - /api/subscribe (server/routes/subscribe.js): Newsletter subscribe + email confirmation (simplified token link).
    - /api/health: Health check endpoint.
  - PostgreSQL via pg Pool. Tables referenced (not managed in this repo): users, email_verification_tokens, newsletter_subscriptions. The server requires DATABASE_URL at startup.
  - Email via nodemailer using SMTP_* env vars. In development (no SMTP configured), verification links are logged to the console to unblock flows.

- Local development flow
  - Start the API first (default http://localhost:5000) so the client can reach it.
  - Start the client (default http://localhost:5173). CORS is preconfigured to allow the client origin; sessions use cookies with sameSite=lax.
  - Vite proxy is set for /api → http://localhost:5000, but the client code generally uses absolute URLs built from VITE_API_BASE.

Notable repository files
- package.json (root): Orchestrates dev for client and server using concurrently; build/preview for client.
- client/eslint.config.js: Flat ESLint configuration for the client app.
- client/vite.config.js: React plugin; dev server on port 5173; proxy for /api to the server.
- server/index.js: Express app setup, session, CORS, dynamic route loading, and server start.
- server/routes/auth.js and server/routes/subscribe.js: API endpoints for auth and newsletter flows.

Documentation and rules present
- README.md contains the default Vite React template guidance and does not add project-specific instructions beyond what is captured here.
