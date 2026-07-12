const bcrypt = require('bcryptjs');
const supabase = require('./supabaseClient');

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

module.exports = { authenticate, getProfile };
