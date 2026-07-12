const UserModel = require('../models/UserModel');

async function register(payload) {
  const rawName = String(payload.name || '').trim();
  const rawEmail = String(payload.email || '').trim().toLowerCase();

  if (/^\d/.test(rawName)) {
    const error = new Error('Name cannot start with a number');
    error.status = 400;
    throw error;
  }

  if (/^\d/.test(rawEmail)) {
    const error = new Error('Email cannot start with a number');
    error.status = 400;
    throw error;
  }

  const email = rawEmail;
  const existingUser = await UserModel.findOne({ email });

  if (existingUser) {
    const error = new Error('User already exists');
    error.status = 400;
    throw error;
  }

  const user = await UserModel.create({
    ...payload,
    name: rawName,
    email,
  });
  const safeUser = user.toObject();
  delete safeUser.password;

  return safeUser;
}

async function authenticate(payload) {
  const { email, password } = payload;
  const user = await UserModel.findOne({ email }).select('+password');

  if (!user) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }

  if (user.blocked) {
    const error = new Error('Your account has been blocked. Please contact support.');
    error.status = 403;
    throw error;
  }

  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }

  const token = require('jsonwebtoken').sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' },
  );

  const safeUser = user.toObject();
  delete safeUser.password;

  return { token, user: safeUser };
}

async function getProfile(userId) {
  const user = await UserModel.findById(userId);

  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  return user;
}

module.exports = { authenticate, getProfile, register };
