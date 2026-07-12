const jwt = require('jsonwebtoken');
const supabase = require('../services/supabaseClient');

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized request. Please login' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user is blocked
    console.log("=== DEBUG VERIFYTOKEN ===");
    console.log("Checking if user is blocked, ID:", req.user.id);
    console.log("Using table: 'Users'");
    
    const { data: user, error } = await supabase
      .from('Users')
      .select('blocked')
      .eq('id', req.user.id)
      .maybeSingle();

    console.log("Blocked check error:", error);
    console.log("Blocked check user:", user);
    console.log("=== END DEBUG ===");

    if (user && user.blocked) {
      return res.status(403).json({ message: 'Your account has been blocked' });
    }
    
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = { verifyToken };
