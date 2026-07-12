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
    
    // Check if user is blocked (supporting id/Id and Blocked/blocked)
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .or(`id.eq.${req.user.id},Id.eq.${req.user.id}`)
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
