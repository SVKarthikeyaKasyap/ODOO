const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const supabase = require('./supabaseClient');
const { sendVerificationEmail } = require('./emailService');

async function authenticate(payload) {
  const { email, password } = payload;
  const rawEmail = String(email || '').trim().toLowerCase();

  // Query Supabase for the user
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('email', rawEmail)
    .maybeSingle();

  if (fetchError || !user) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }

  if (user.blocked) {
    const error = new Error('Your account has been blocked. Please contact support.');
    error.status = 403;
    throw error;
  }

  // Check email verification status
  if (!user.is_verified) {
    const error = new Error('Email not verified');
    error.status = 403;
    throw error;
  }

  // Verify password
  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }

  // Generate JWT token
  const token = require('jsonwebtoken').sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  const safeUser = { ...user };
  delete safeUser.password;

  return { token, user: safeUser };
}

async function getProfile(userId) {
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (fetchError || !user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  const safeUser = { ...user };
  delete safeUser.password;

  return safeUser;
}

async function requestVerification(email) {
  const rawEmail = String(email || '').trim().toLowerCase();

  // Fetch user
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('email', rawEmail)
    .maybeSingle();

  if (fetchError || !user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  if (user.is_verified) {
    const error = new Error('Email is already verified');
    error.status = 400;
    throw error;
  }

  // Generate verification token
  const token = crypto.randomBytes(32).toString('hex');
  const tokenExpires = new Date();
  tokenExpires.setHours(tokenExpires.getHours() + 24); // Expires in 24h

  // Update user in Supabase
  const { error: updateError } = await supabase
    .from('users')
    .update({
      verification_token: token,
      token_expires: tokenExpires.toISOString()
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('Update Token Error:', updateError);
    const error = new Error('Database error setting token');
    error.status = 500;
    throw error;
  }

  // Send the email
  const { previewUrl } = await sendVerificationEmail(user.email, user.name, token);

  return { success: true, previewUrl };
}

async function verifyEmailToken(token) {
  if (!token) {
    const error = new Error('Token is required');
    error.status = 400;
    throw error;
  }

  // Find user with token
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('verification_token', token)
    .maybeSingle();

  if (fetchError || !user) {
    const error = new Error('Invalid or expired verification link');
    error.status = 400;
    throw error;
  }

  // Check token expiration
  const expiresAt = new Date(user.token_expires);
  if (expiresAt < new Date()) {
    const error = new Error('Verification link has expired');
    error.status = 400;
    throw error;
  }

  // Update user to verified
  const { error: updateError } = await supabase
    .from('users')
    .update({
      is_verified: true,
      verification_token: null,
      token_expires: null
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('Verification Update Error:', updateError);
    const error = new Error('Database error updating verification status');
    error.status = 500;
    throw error;
  }

  return { success: true };
}

module.exports = { authenticate, getProfile, requestVerification, verifyEmailToken };
