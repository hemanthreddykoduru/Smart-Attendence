import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user still exists in database
    let query, params;
    if (decoded.role === 'faculty') {
      query = 'SELECT faculty_id as id, name, email, department, "faculty" as role FROM faculty WHERE faculty_id = ?';
      params = [decoded.id];
    } else {
      query = 'SELECT student_id as id, name, email, roll_number, branch, year, "student" as role FROM students WHERE student_id = ?';
      params = [decoded.id];
    }

    const [rows] = await pool.execute(query, params);
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: `Access denied. ${role} role required.` });
    }
    next();
  };
};