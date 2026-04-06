import jwt from 'jsonwebtoken';

export default (req, res, next) => {
  // 1. Get the token from the header
  const token = req.header('Authorization');

  // 2. Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // 3. Verify token (Remove "Bearer " if present)
    const tokenString = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;
    
    const decoded = jwt.verify(tokenString, process.env.JWT_SECRET);
    
    // 4. Add user from payload to request object
    req.user = decoded; 
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};