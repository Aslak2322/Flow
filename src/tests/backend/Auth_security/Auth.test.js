const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = global.TextEncoder || TextEncoder;
global.TextDecoder = global.TextDecoder || TextDecoder;

const request = require('supertest'); // for HTTP requests
const { app } = require('../../../../server.js'); // path to your Express app

const jwt = require('jsonwebtoken');
const { auth } = require('../../../../server.js'); // adjust path

describe('auth middleware', () => {
  const next = jest.fn();

  beforeEach(() => {
    next.mockClear();
  });

  it('rejects missing token', () => {
    const req = { headers: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. No token provided.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects invalid token', () => {
    const req = { headers: { authorization: 'Bearer invalidtoken' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts valid token', () => {
    const payload = { id: 1, email: 'test@example.com' };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = {};
    
    auth(req, res, next);

    expect(req.user).toMatchObject(payload);

    expect(next).toHaveBeenCalled();
  });
});