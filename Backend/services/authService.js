const bcrypt = require('bcryptjs');
const supabase = require('./supabaseClient');

async function register(payload) {
  const rawName = String(payload.name || '').trim();
  const rawEmail = String(payload.email || '').trim().toLowerCase();
  const rawRole = String(payload.role || '').trim();

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

  // Check if user already exists
  const { data: existingUser, error: findError } = await supabase
    .from('users')
    .select('email')
    .eq('email', rawEmail)
    .maybeSingle();

  if (existingUser) {
    const error = new Error('User already exists');
    error.status = 400;
    throw error;
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(payload.password, salt);

  // Insert into Supabase 'users' table
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert([
      {
        name: rawName,
        email: rawEmail,
        password: hashedPassword,
        role: rawRole,
        blocked: false
      }
    ])
    .select()
    .single();

  if (insertError || !newUser) {
    console.error('Supabase Register Error:', insertError);
    const error = new Error(insertError?.message || 'Error creating user in database');
    error.status = 500;
    throw error;
  }

  const safeUser = { ...newUser };
  delete safeUser.password;

  return safeUser;
}

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

module.exports = { authenticate, getProfile, register };
