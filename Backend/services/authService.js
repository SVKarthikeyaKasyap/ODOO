const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const supabase = require('./supabaseClient');
const { sendVerificationEmail } = require('./emailService');

async function authenticate(payload) {
  const { email, password } = payload;
  const rawEmail = String(email || '').trim().toLowerCase();

  // Query Supabase for the user with capitalized columns: Email, Password, Blocked, Role, Name
  const { data: user, error: fetchError } = await supabase
    .from('users')
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

  // Check email verification status (allowing for capitalization just in case)
  const isVerified = user.is_verified === true || user.is_verified === null || user.Is_Verified === true;
  if (!isVerified) {
    const error = new Error('Email not verified');
    error.status = 403;
    throw error;
  }

  // Verify password: Support both Bcrypt hashes and Plain-Text passwords (e.g. "123")
  let isPasswordCorrect = false;
  const storedPassword = user.Password || '';
  
  if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$')) {
    isPasswordCorrect = await bcrypt.compare(password, storedPassword);
  } else {
    // Fallback to plain-text match for direct database entry support
    isPasswordCorrect = (password === storedPassword);
  }

  if (!isPasswordCorrect) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }

  // Generate JWT token using user details
  const userId = user.id || user.Id;
  const token = require('jsonwebtoken').sign(
    { id: userId, email: user.Email, role: user.Role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  const safeUser = { ...user };
  delete safeUser.Password; // hide Password field

  return { token, user: safeUser };
}

async function getProfile(userId) {
  // Try lowercase 'id' then capitalized 'Id'
  let query = supabase.from('users').select('*');
  
  // Try querying by standard id
  const { data: user, error: fetchError } = await query
    .or(`id.eq.${userId},Id.eq.${userId}`)
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

  // Fetch user by Email
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('Email', rawEmail)
    .maybeSingle();

  if (fetchError || !user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  const isVerified = user.is_verified === true || user.Is_Verified === true;
  if (isVerified) {
    const error = new Error('Email is already verified');
    error.status = 400;
    throw error;
  }

  // Generate verification token
  const token = crypto.randomBytes(32).toString('hex');
  const tokenExpires = new Date();
  tokenExpires.setHours(tokenExpires.getHours() + 24); // Expires in 24h

  const userId = user.id || user.Id;

  // Update user in Supabase
  const { error: updateError } = await supabase
    .from('users')
    .update({
      verification_token: token,
      token_expires: tokenExpires.toISOString()
    })
    .or(`id.eq.${userId},Id.eq.${userId}`);

  if (updateError) {
    console.error('Update Token Error:', updateError);
    const error = new Error('Database error setting token');
    error.status = 500;
    throw error;
  }

  // Send the email using Name or Email as fallback
  const userName = user.Name || user.name || 'User';
  const userEmail = user.Email || user.email;
  const { previewUrl } = await sendVerificationEmail(userEmail, userName, token);

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

  const userId = user.id || user.Id;

  // Update user to verified
  const { error: updateError } = await supabase
    .from('users')
    .update({
      is_verified: true,
      verification_token: null,
      token_expires: null
    })
    .or(`id.eq.${userId},Id.eq.${userId}`);

  if (updateError) {
    console.error('Verification Update Error:', updateError);
    const error = new Error('Database error updating verification status');
    error.status = 500;
    throw error;
  }

  return { success: true };
}

module.exports = { authenticate, getProfile, requestVerification, verifyEmailToken };
