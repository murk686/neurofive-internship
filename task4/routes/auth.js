/**
 * routes/auth.js — Public auth endpoints
 *
 * POST /api/auth/signup  → create account, return JWT
 * POST /api/auth/login   → verify credentials, return JWT
 */

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

// ---------------------------------------------------------------------------
// Helper: sign a JWT for a user
// ---------------------------------------------------------------------------
function signToken(user) {
  // The payload is the data embedded inside the token.
  // Keep it minimal — don't put sensitive fields here.
  // Anyone with the token can base64-decode the payload (it's not encrypted),
  // but they cannot forge a new one without the secret.
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
  );
}

// ---------------------------------------------------------------------------
// POST /api/auth/signup
// ---------------------------------------------------------------------------
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // --- Input validation ---
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "MISSING_FIELDS",
        message: "name, email, and password are all required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "WEAK_PASSWORD",
        message: "Password must be at least 8 characters.",
      });
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_EMAIL",
        message: "Please provide a valid email address.",
      });
    }

    // --- Duplicate check ---
    if (db.findByEmail(email)) {
      return res.status(409).json({
        success: false,
        error: "EMAIL_TAKEN",
        message: "An account with that email already exists.",
      });
    }

    // --- Password hashing ---
    // bcrypt's salt rounds (10) control how slow the hash is.
    // Slower = harder to brute-force if your DB is ever leaked.
    // 10 rounds is the industry default; increase for high-security apps.
    const SALT_ROUNDS = 10;
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // --- Persist user ---
    const user = db.createUser({ name, email, passwordHash });

    // --- Issue JWT ---
    const token = signToken(user);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user, // safe user object (no passwordHash)
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Something went wrong. Please try again.",
    });
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // --- Input validation ---
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "MISSING_FIELDS",
        message: "email and password are required.",
      });
    }

    // --- Look up user ---
    const user = db.findByEmailWithHash(email);

    // IMPORTANT: we use the same error message whether the email doesn't
    // exist OR the password is wrong. This prevents "email enumeration" —
    // an attacker probing which emails are registered.
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "INVALID_CREDENTIALS",
        message: "Email or password is incorrect.",
      });
    }

    // --- Password comparison ---
    // bcrypt.compare() hashes the candidate and checks it against the
    // stored hash. It never exposes the original password.
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: "INVALID_CREDENTIALS",
        message: "Email or password is incorrect.",
      });
    }

    // --- Issue JWT ---
    const { passwordHash: _omit, ...safeUser } = user; // strip hash before responding
    const token = signToken(safeUser);

    return res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Something went wrong. Please try again.",
    });
  }
});

module.exports = router;
