const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');

function auth(requiredRole) {
  return (req, res, next) => {
    try {
      const token = (req.headers.authorization || '').replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Yetkilendirme yok (token eksik)' });
      const payload = jwt.verify(token, jwtSecret);
      req.user = payload; // { id, role }
      if (requiredRole && payload.role !== requiredRole) {
        return res.status(403).json({ error: 'Erişim reddedildi' });
      }
      next();
    } catch (e) {
      res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token' });
    }
  };
}

module.exports = { auth };