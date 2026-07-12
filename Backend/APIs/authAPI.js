const express = require('express');
const { authenticate, getProfile, register } = require('../services/authService');
const { verifyToken } = require('../middlewares/verifyToken');

const authRouter = express.Router();

const isProduction = process.env.NODE_ENV === 'production';

const authCookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? 'none' : 'lax',
  secure: isProduction,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const clearAuthCookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? 'none' : 'lax',
  secure: isProduction,
};

authRouter.post('/register', async (req, res, next) => {
  try {
    const payload = await register(req.body);
    res.status(201).json({ message: 'Registration successful', payload });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const payload = await authenticate(req.body);

    res.cookie('token', payload.token, authCookieOptions);

    res.status(200).json({ message: 'Login successful', payload });
  } catch (err) {
    next(err);
  }
});

authRouter.get('/profile', verifyToken, async (req, res, next) => {
  try {
    const payload = await getProfile(req.user.id);
    res.status(200).json({ message: 'Profile fetched', payload });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie('token', {
    ...clearAuthCookieOptions,
  });
  res.status(200).json({ message: 'Logout successful' });
});

module.exports = { authRouter };
