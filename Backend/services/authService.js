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

  // Verify password first to prevent spamming verification emails on wrong passwords
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

  // Check if the user is blocked
  const isBlocked = user.Blocked === true || user.blocked === true;
  if (isBlocked) {
    // Generate verification token to unblock
    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date();
    tokenExpires.setHours(tokenExpires.getHours() + 24);

    // Save token to Users table
    const { error: updateError } = await supabase
      .from('Users')
      .update({
        verification_token: token,
        token_expires: tokenExpires.toISOString()
      })
      .eq('Email', user.Email);

    if (updateError) {
      console.error('Unblock Token Update Error:', updateError);
      const error = new Error('Your account is blocked, but the system failed to generate an unblock link. Make sure verification_token and token_expires columns exist in your Users table.');
      error.status = 500;
      throw error;
    }

    // Send the unblock verification email
    const userName = user.Name || 'User';
    try {
      await sendVerificationEmail(user.Email, userName, token);
    } catch (mailError) {
      console.error('Mail Send Error:', mailError);
      const error = new Error('Your account is blocked, and we failed to send the verification email. Check your GMAIL config.');
      error.status = 500;
      throw error;
    }

    const error = new Error('Your account is blocked. A verification link has been sent to your email to unblock your account.');
    error.status = 403;
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

  const isBlocked = user.Blocked === true || user.blocked === true;
  if (!isBlocked) {
    const error = new Error('Your account is already unblocked and active');
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
    const error = new Error('Database error setting verification token');
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

  // Verification step: Unblock the user by setting Blocked to false
  const { error: updateError } = await supabase
    .from('Users')
    .update({
      Blocked: false, // Set Blocked to false to unblock!
      verification_token: null,
      token_expires: null
    })
    .eq('Email', user.Email);

  if (updateError) {
    console.error('Verification Update Error:', updateError);
    const error = new Error('Database error unblocking account');
    error.status = 500;
    throw error;
  }

  return { success: true };
}

module.exports = { authenticate, getProfile, requestVerification, verifyEmailToken };
