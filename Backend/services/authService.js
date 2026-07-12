const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const supabase = require('./supabaseClient');
const { sendVerificationEmail } = require('./emailService');

async function authenticate(payload) {
  const { email, password } = payload;
  const rawEmail = String(email || '').trim().toLowerCase();

  // Query Supabase for the user
  const { data: user, error: fetchError } = await supabase
    .from('Users')
    .select('*')
    .eq('Email', rawEmail)
    .maybeSingle();

  if (fetchError || !user) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }

  // Handle capitalized Blocked column
  if (user.Blocked) {
    const error = new Error('Your account has been blocked. Please contact support.');
    error.status = 403;
    throw error;
  }

  // Check email verification status (if the column exists in db, check it)
  const isVerified = user.is_verified === true || user.is_verified === null || user.is_verified === undefined;
  if (!isVerified) {
    const error = new Error('Email not verified');
    error.status = 403;
    throw error;
  }

  // Verify password: Support both Bcrypt hashes and Plain-Text passwords
  let isPasswordCorrect = false;
  const storedPassword = user.Password || '';
  
  if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$')) {
    isPasswordCorrect = await bcrypt.compare(password, storedPassword);
  } else {
    isPasswordCorrect = (password === storedPassword);
  }

  if (!isPasswordCorrect) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }

  // Generate JWT token
  const token = require('jsonwebtoken').sign(
    { id: user.Email, email: user.Email, role: user.Role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  const safeUser = { ...user };
  delete safeUser.Password;

  return { token, user: safeUser };
}

async function getProfile(userId) {
  const { data: user, error: fetchError } = await supabase
    .from('Users')
    .select('*')
    .eq('Email', userId)
    .maybeSingle();

  if (fetchError || !user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  const safeUser = { ...user };
  delete safeUser.Password;

  return safeUser;
}

async function requestVerification(email) {
  const rawEmail = String(email || '').trim().toLowerCase();

  const { data: user, error: fetchError } = await supabase
    .from('Users')
    .select('*')
    .eq('Email', rawEmail)
    .maybeSingle();

  if (fetchError || !user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  const isVerified = user.is_verified === true;
  if (isVerified) {
    const error = new Error('Email is already verified');
    error.status = 400;
    throw error;
  }

  // Generate verification token
  const token = crypto.randomBytes(32).toString('hex');
  const tokenExpires = new Date();
  tokenExpires.setHours(tokenExpires.getHours() + 24);

  // Update user in Supabase
  const { error: updateError } = await supabase
    .from('Users')
    .update({
      verification_token: token,
      token_expires: tokenExpires.toISOString()
    })
    .eq('Email', user.Email);

  if (updateError) {
    console.error('Update Token Error:', updateError);
    const error = new Error('Database error setting verification token. Make sure is_verified, verification_token, and token_expires columns exist in the Users table!');
    error.status = 500;
    throw error;
  }

  // Send real email using Gmail SMTP
  const userName = user.Name || 'User';
  await sendVerificationEmail(user.Email, userName, token);

  return { success: true };
}

async function verifyEmailToken(token) {
  if (!token) {
    const error = new Error('Token is required');
    error.status = 400;
    throw error;
  }

  const { data: user, error: fetchError } = await supabase
    .from('Users')
    .select('*')
    .eq('verification_token', token)
    .maybeSingle();

  if (fetchError || !user) {
    const error = new Error('Invalid or expired verification link');
    error.status = 400;
    throw error;
  }

  const expiresAt = new Date(user.token_expires);
  if (expiresAt < new Date()) {
    const error = new Error('Verification link has expired');
    error.status = 400;
    throw error;
  }

  const { error: updateError } = await supabase
    .from('Users')
    .update({
      is_verified: true,
      verification_token: null,
      token_expires: null
    })
    .eq('Email', user.Email);

  if (updateError) {
    console.error('Verification Update Error:', updateError);
    const error = new Error('Database error updating verification status');
    error.status = 500;
    throw error;
  }

  return { success: true };
}

module.exports = { authenticate, getProfile, requestVerification, verifyEmailToken };
