const jwt = require('jsonwebtoken');

const generateToken = (payload, secret, expiresIn = '7d') => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload must be a non-null object');
  }
  if (!secret) {
    throw new Error('JWT secret is required');
  }
  return jwt.sign(payload, secret, { expiresIn });
};

const verifyToken = (token, secret) => {
  if (!token) throw new Error('Token is required');
  if (!secret) throw new Error('Secret is required');
  return jwt.verify(token, secret);
};

module.exports = { generateToken, verifyToken };
