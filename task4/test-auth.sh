#!/usr/bin/env bash
# test-auth.sh — Walks through the complete auth flow using curl
# Run with: chmod +x test-auth.sh && ./test-auth.sh
#
# Requires: curl, jq (for pretty output)
# Install jq:  brew install jq  OR  sudo apt install jq

BASE="http://localhost:3000"
DIVIDER="────────────────────────────────────────────"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║        Auth Flow — End-to-End Test       ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. SIGNUP ───────────────────────────────────────────────────────────────
echo "$DIVIDER"
echo "1️⃣  SIGNUP — create a new account"
echo "$DIVIDER"
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"name":"Murk Channa","email":"murk@example.com","password":"securepass123"}')

echo "$SIGNUP_RESPONSE" | jq .
TOKEN=$(echo "$SIGNUP_RESPONSE" | jq -r '.token')
echo ""
echo "📦 Token received: ${TOKEN:0:40}..."

# ── 2. DUPLICATE SIGNUP (should fail) ───────────────────────────────────────
echo ""
echo "$DIVIDER"
echo "2️⃣  DUPLICATE SIGNUP — should return 409 EMAIL_TAKEN"
echo "$DIVIDER"
curl -s -X POST "$BASE/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"name":"Murk Channa","email":"murk@example.com","password":"securepass123"}' | jq .

# ── 3. LOGIN ─────────────────────────────────────────────────────────────────
echo ""
echo "$DIVIDER"
echo "3️⃣  LOGIN — get a fresh token"
echo "$DIVIDER"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"murk@example.com","password":"securepass123"}')

echo "$LOGIN_RESPONSE" | jq .
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

# ── 4. WRONG PASSWORD ────────────────────────────────────────────────────────
echo ""
echo "$DIVIDER"
echo "4️⃣  WRONG PASSWORD — should return 401 INVALID_CREDENTIALS"
echo "$DIVIDER"
curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"murk@example.com","password":"wrongpassword"}' | jq .

# ── 5. PROTECTED ROUTE — with valid token ────────────────────────────────────
echo ""
echo "$DIVIDER"
echo "5️⃣  GET /api/profile — with valid token ✅"
echo "$DIVIDER"
curl -s -X GET "$BASE/api/profile" \
  -H "Authorization: Bearer $TOKEN" | jq .

# ── 6. PROTECTED ROUTE 2 — dashboard ────────────────────────────────────────
echo ""
echo "$DIVIDER"
echo "6️⃣  GET /api/dashboard — with valid token ✅"
echo "$DIVIDER"
curl -s -X GET "$BASE/api/dashboard" \
  -H "Authorization: Bearer $TOKEN" | jq .

# ── 7. NO TOKEN ─────────────────────────────────────────────────────────────
echo ""
echo "$DIVIDER"
echo "7️⃣  GET /api/profile — NO token ❌ (should return 401 MISSING_TOKEN)"
echo "$DIVIDER"
curl -s -X GET "$BASE/api/profile" | jq .

# ── 8. INVALID TOKEN ─────────────────────────────────────────────────────────
echo ""
echo "$DIVIDER"
echo "8️⃣  GET /api/profile — TAMPERED token ❌ (should return 401 INVALID_TOKEN)"
echo "$DIVIDER"
curl -s -X GET "$BASE/api/profile" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.this.is.fake" | jq .

echo ""
echo "✅  Test run complete."
echo ""
