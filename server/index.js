import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const ORIGIN = process.env.CLIENT_URL || "http://localhost:5173";

app.use(cors({
  origin: ORIGIN,
  credentials: true,
}));
app.use(express.json());
// Trust proxy in production (required for secure cookies behind proxies)
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(session({
  secret: process.env.SESSION_SECRET || "dev_secret_change_me",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
}));
app.use(passport.initialize());
app.use(passport.session());

// Mount auth routes (defined in ./routes/auth.js)
import authRouter from "./routes/auth.js";
app.use("/api/auth", authRouter);

import subscribeRouter from "./routes/subscribe.js";
app.use("/api/subscribe", subscribeRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
