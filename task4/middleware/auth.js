/**
 * middleware/auth.js — JWT verification middleware
 *
 * This function runs BEFORE any protected route handler.
 * If the token is missing, expired, or tampered with, we
 * stop the request here and return a clear error.
 *
 * Usage: router.get('/protected', authenticate, handler)
 */

const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {
  // 1. Extract the token from the Authorization header.
  //    Convention: "Authorization: Bearer <token>"
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "MISSING_TOKEN",
      message: "Authorization header required. Format: Bearer <token>",
    });
  }

  const token = authHeader.split(" ")[1]; // grab the part after "Bearer "

  // 2. Verify the token's signature and expiry.
  //    jwt.verify() throws if anything is wrong — we catch each error type
  //    so the client gets a useful message instead of a generic 500.
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Attach the decoded payload to req so downstream handlers can
    //    access req.user.id, req.user.email, etc.
    req.user = payload;

    next(); // token is valid — proceed to the route handler
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "TOKEN_EXPIRED",
        message: "Your session has expired. Please log in again.",
      });
    }

    // Covers JsonWebTokenError (bad signature, malformed token, etc.)
    return res.status(401).json({
      success: false,
      error: "INVALID_TOKEN",
      message: "Token is invalid or has been tampered with.",
    });
  }
}

module.exports = authenticate;
