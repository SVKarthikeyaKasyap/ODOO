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
    
    // Check if user is blocked using Email on the capitalized 'Users' table
    const { data: user, error } = await supabase
      .from('Users')
      .select('*')
      .eq('Email', req.user.email)
      .maybeSingle();

    if (user) {
      const isBlocked = user.Blocked === true || user.blocked === true;
      if (isBlocked) {
        return res.status(403).json({ message: 'Your account has been blocked' });
      }
    }
    
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = { verifyToken };
