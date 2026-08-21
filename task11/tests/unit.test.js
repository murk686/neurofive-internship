/**
 * Unit Tests — Core Logic
 * Tests token generation/verification and validation schemas
 * independently of Express or HTTP.
 */

const { generateToken, verifyToken } = require('../src/utils/token');
const { validateSignup, validateLogin } = require('../src/utils/validators');

const TEST_SECRET = 'test_secret_for_unit_tests';

// ─────────────────────────────────────────────
// TOKEN UTILITY
// ─────────────────────────────────────────────
describe('Token Utility', () => {

  describe('generateToken()', () => {
    test('generates a valid JWT string', () => {
      const token = generateToken({ id: 'u1' }, TEST_SECRET);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // header.payload.signature
    });

    test('throws if payload is missing', () => {
      expect(() => generateToken(null, TEST_SECRET)).toThrow('Payload must be a non-null object');
    });

    test('throws if secret is missing', () => {
      expect(() => generateToken({ id: 'u1' }, '')).toThrow('JWT secret is required');
    });

    test('embeds the payload correctly', () => {
      const token = generateToken({ id: 'u123', email: 'murk@test.com' }, TEST_SECRET);
      const decoded = verifyToken(token, TEST_SECRET);
      expect(decoded.id).toBe('u123');
      expect(decoded.email).toBe('murk@test.com');
    });

    test('respects custom expiry', () => {
      const token = generateToken({ id: 'u1' }, TEST_SECRET, '1s');
      const decoded = verifyToken(token, TEST_SECRET);
      expect(decoded.exp - decoded.iat).toBe(1);
    });
  });

  describe('verifyToken()', () => {
    test('successfully verifies a valid token', () => {
      const token = generateToken({ id: 'u1' }, TEST_SECRET);
      const decoded = verifyToken(token, TEST_SECRET);
      expect(decoded.id).toBe('u1');
    });

    test('throws on wrong secret', () => {
      const token = generateToken({ id: 'u1' }, TEST_SECRET);
      expect(() => verifyToken(token, 'wrong_secret')).toThrow();
    });

    test('throws on tampered token', () => {
      const token = generateToken({ id: 'u1' }, TEST_SECRET);
      const tampered = token.slice(0, -5) + 'XXXXX';
      expect(() => verifyToken(tampered, TEST_SECRET)).toThrow();
    });

    test('throws if token is missing', () => {
      expect(() => verifyToken('', TEST_SECRET)).toThrow('Token is required');
    });
  });

});

// ─────────────────────────────────────────────
// VALIDATION SCHEMAS
// ─────────────────────────────────────────────
describe('Validation Schemas', () => {

  describe('validateSignup()', () => {
    const valid = { username: 'murk', email: 'murk@test.com', password: 'secret123' };

    test('passes with valid data', () => {
      const { error } = validateSignup(valid);
      expect(error).toBeUndefined();
    });

    test('fails when username is missing', () => {
      const { error } = validateSignup({ email: 'murk@test.com', password: 'secret123' });
      expect(error).toBeDefined();
      expect(error.details[0].path[0]).toBe('username');
    });

    test('fails when username is too short (< 3 chars)', () => {
      const { error } = validateSignup({ ...valid, username: 'ab' });
      expect(error).toBeDefined();
    });

    test('fails when username has special characters', () => {
      const { error } = validateSignup({ ...valid, username: 'murk!' });
      expect(error).toBeDefined();
    });

    test('fails with invalid email format', () => {
      const { error } = validateSignup({ ...valid, email: 'notanemail' });
      expect(error).toBeDefined();
      expect(error.details[0].path[0]).toBe('email');
    });

    test('fails when password is too short (< 8 chars)', () => {
      const { error } = validateSignup({ ...valid, password: 'short' });
      expect(error).toBeDefined();
    });

    test('returns multiple errors at once (abortEarly: false)', () => {
      const { error } = validateSignup({ username: 'ab', email: 'bad', password: 'x' });
      expect(error.details.length).toBeGreaterThan(1);
    });
  });

  describe('validateLogin()', () => {
    const valid = { email: 'murk@test.com', password: 'secret123' };

    test('passes with valid data', () => {
      const { error } = validateLogin(valid);
      expect(error).toBeUndefined();
    });

    test('fails when email is missing', () => {
      const { error } = validateLogin({ password: 'secret123' });
      expect(error).toBeDefined();
    });

    test('fails when password is missing', () => {
      const { error } = validateLogin({ email: 'murk@test.com' });
      expect(error).toBeDefined();
    });

    test('fails with invalid email format', () => {
      const { error } = validateLogin({ ...valid, email: 'not-an-email' });
      expect(error).toBeDefined();
    });
  });

});
