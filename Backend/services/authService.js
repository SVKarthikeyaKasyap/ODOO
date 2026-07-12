const bcrypt = require('bcryptjs');
const supabase = require('./supabaseClient');

async function authenticate(payload) {
  const { email, password } = payload;
  const rawEmail = String(email || '').trim().toLowerCase();

  // Query Supabase for the user with capitalized table: Users and column: Email
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

  // Generate JWT token using user details (since Email is the primary key, we sign email as the id claim too)
  const token = require('jsonwebtoken').sign(
    { id: user.Email, email: user.Email, role: user.Role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  const safeUser = { ...user };
  delete safeUser.Password; // hide Password field

  return { token, user: safeUser };
}

async function getProfile(userId) {
  // Since Email is the primary key, userId will contain the user's Email address
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

module.exports = { authenticate, getProfile };
