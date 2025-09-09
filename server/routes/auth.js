import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';

const router = express.Router();

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, ...additionalData } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    let query, params;
    
    if (role === 'faculty') {
      const { department } = additionalData;
      if (!department) {
        return res.status(400).json({ error: 'Department is required for faculty' });
      }
      
      query = 'INSERT INTO faculty (name, email, password, department) VALUES (?, ?, ?, ?)';
      params = [name, email, hashedPassword, department];
    } else if (role === 'student') {
      const { roll_number, branch, year } = additionalData;
      if (!roll_number || !branch || !year) {
        return res.status(400).json({ error: 'Roll number, branch, and year are required for students' });
      }
      
      query = 'INSERT INTO students (name, email, password, roll_number, branch, year) VALUES (?, ?, ?, ?, ?, ?)';
      params = [name, email, hashedPassword, roll_number, branch, parseInt(year)];
    } else {
      return res.status(400).json({ error: 'Invalid role. Must be "faculty" or "student"' });
    }

    const [result] = await pool.execute(query, params);
    
    res.status(201).json({ 
      message: 'User registered successfully',
      userId: result.insertId 
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email or roll number already exists' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check in faculty table first
    let [rows] = await pool.execute(
      'SELECT faculty_id as id, name, email, password, department, "faculty" as role FROM faculty WHERE email = ?',
      [email]
    );

    // If not found in faculty, check students table
    if (rows.length === 0) {
      [rows] = await pool.execute(
        'SELECT student_id as id, name, email, password, roll_number, branch, year, "student" as role FROM students WHERE email = ?',
        [email]
      );
    }

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Remove password from user object
    delete user.password;

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;