const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

function auth(requiredRole) {
  return (req, res, next) => {
    try {
      const token = (req.headers.authorization || '').replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Yetkilendirme yok (token eksik)' });
      const payload = jwt.verify(token, jwtSecret);
      
      // JWT payload yapısına uygun olarak req.user'ı set et
      req.user = {
        id: payload.userId || payload.id, // userId veya id'yi destekle
        role: payload.role
      };
      
      if (requiredRole && req.user.role !== requiredRole) {
        return res.status(403).json({ error: 'Erişim reddedildi' });
      }
      next();
    } catch (e) {
      res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token' });
    }
  };
}

module.exports = auth;