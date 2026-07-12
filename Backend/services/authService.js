const bcrypt = require('bcryptjs');
const supabase = require('./supabaseClient');

async function authenticate(payload) {
  const { email, password } = payload;
  const rawEmail = String(email || '').trim().toLowerCase();

  console.log("=== DEBUG AUTHENTICATE ===");
  console.log("Looking for email:", rawEmail);
  
  // Try different table names to debug
  console.log("Trying table: 'Users'");
  let user = null;
  let fetchError = null;
  
  // Try 'Users' first
  const result1 = await supabase
    .from('Users')
    .select('*')
    .eq('email', rawEmail)
    .maybeSingle();
    
  user = result1.data;
  fetchError = result1.error;
  
  if (!user) {
    console.log("Not found in 'Users', trying 'users'");
    const result2 = await supabase
      .from('users')
      .select('*')
      .eq('email', rawEmail)
      .maybeSingle();
      
    user = result2.data;
    fetchError = result2.error;
  }

  console.log("Supabase fetch error:", fetchError);
  console.log("User found:", user);
  console.log("User ID:", user?.id);
  console.log("User email in DB:", user?.email);
  console.log("User password in DB:", user?.password ? "EXISTS" : "MISSING");
  console.log("=== END DEBUG ===");

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
  console.log("Entered password:", password);
  console.log("Database password:", user.password);

  if (String(password) !== String(user.password)) {
    const error = new Error('Invalid password');
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
  console.log("=== DEBUG GETPROFILE ===");
  console.log("Looking for user ID:", userId);
  console.log("Using table: 'Users'");
  
  const { data: user, error: fetchError } = await supabase
    .from('Users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  console.log("Profile fetch error:", fetchError);
  console.log("Profile user found:", user);
  console.log("=== END DEBUG ===");

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
