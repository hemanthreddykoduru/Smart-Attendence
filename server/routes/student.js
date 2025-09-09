import express from "express";
import { pool } from "../config/database.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication and student role requirement to all routes
router.use(authenticateToken);
router.use(requireRole("student"));

// Mark attendance by scanning QR code
router.post("/attendance", async (req, res) => {
  try {
    const { qr_code } = req.body;
    const student_id = req.user.id;

    if (!qr_code) {
      return res.status(400).json({ error: "QR code is required" });
    }

    // Find the session by QR code
    const [sessionRows] = await pool.execute(
      `
      SELECT s.*, c.course_name, c.course_code
      FROM attendance_sessions s
      JOIN courses c ON s.course_id = c.course_id
      WHERE s.qr_code = ?
    `,
      [qr_code]
    );

    if (sessionRows.length === 0) {
      return res.status(404).json({ error: "Invalid QR code" });
    }

    const session = sessionRows[0];

    // Check if session has expired
    if (new Date() > new Date(session.expires_at)) {
      return res.status(400).json({ error: "QR code has expired" });
    }

    // Check if student has already marked attendance for this session
    const [existingRows] = await pool.execute(
      "SELECT * FROM attendance_logs WHERE session_id = ? AND student_id = ?",
      [session.session_id, student_id]
    );

    if (existingRows.length > 0) {
      return res
        .status(400)
        .json({ error: "Attendance already marked for this session" });
    }

    // Mark attendance
    const [result] = await pool.execute(
      "INSERT INTO attendance_logs (session_id, student_id, status) VALUES (?, ?, ?)",
      [session.session_id, student_id, "present"]
    );

    res.json({
      message: `Attendance marked successfully for ${session.course_name}`,
      logId: result.insertId,
      course: {
        name: session.course_name,
        code: session.course_code,
      },
    });
  } catch (error) {
    console.error("Mark attendance error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get student's attendance history
router.get("/attendance/:studentId?", async (req, res) => {
  try {
    const student_id = req.params.studentId || req.user.id;

    // Ensure student can only access their own data
    if (student_id != req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get attendance logs with course information
    const [attendanceRows] = await pool.execute(
      `
      SELECT 
        al.log_id,
        al.marked_at,
        al.status,
        c.course_name,
        c.course_code,
        s.session_date
      FROM attendance_logs al
      JOIN attendance_sessions s ON al.session_id = s.session_id
      JOIN courses c ON s.course_id = c.course_id
      WHERE al.student_id = ?
      ORDER BY al.marked_at DESC
    `,
      [student_id]
    );

    // Get course-wise attendance statistics
    const [courseStats] = await pool.execute(
      `
      SELECT 
        c.course_id,
        c.course_name,
        c.course_code,
        COUNT(DISTINCT s.session_id) as total_sessions,
        COUNT(DISTINCT al.log_id) as attended_sessions,
        ROUND((COUNT(DISTINCT al.log_id) / COUNT(DISTINCT s.session_id)) * 100, 2) as attendance_percentage
      FROM courses c
      LEFT JOIN attendance_sessions s ON c.course_id = s.course_id
      LEFT JOIN attendance_logs al ON s.session_id = al.session_id AND al.student_id = ?
      GROUP BY c.course_id, c.course_name, c.course_code
      HAVING total_sessions > 0
    `,
      [student_id]
    );

    // Calculate overall statistics
    const totalSessions = courseStats.reduce(
      (sum, course) => sum + course.total_sessions,
      0
    );
    const totalAttended = courseStats.reduce(
      (sum, course) => sum + course.attended_sessions,
      0
    );
    const overallPercentage =
      totalSessions > 0 ? Math.round((totalAttended / totalSessions) * 100) : 0;

    res.json({
      attendanceHistory: attendanceRows,
      courseStats,
      overallStats: {
        totalSessions,
        attendedSessions: totalAttended,
        attendancePercentage: overallPercentage,
        lowAttendanceAlert: overallPercentage < 75,
      },
    });
  } catch (error) {
    console.error("Get attendance history error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get available courses (for reference)
router.get("/courses", async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT c.*, f.name as faculty_name, f.department
      FROM courses c
      JOIN faculty f ON c.faculty_id = f.faculty_id
      ORDER BY c.course_name
    `);

    res.json(rows);
  } catch (error) {
    console.error("Get courses error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get student profile
router.get("/profile", async (req, res) => {
  try {
    const student_id = req.user.id;

    const [rows] = await pool.execute(
      "SELECT student_id, name, email, roll_number, branch, year, created_at FROM students WHERE student_id = ?",
      [student_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update student profile
router.put("/profile", async (req, res) => {
  try {
    const student_id = req.user.id;
    const { name, branch, year } = req.body;

    const [result] = await pool.execute(
      "UPDATE students SET name = ?, branch = ?, year = ? WHERE student_id = ?",
      [name, branch, year, student_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get attendance calendar (monthly view)
router.get("/calendar/:year/:month", async (req, res) => {
  try {
    const student_id = req.user.id;
    const { year, month } = req.params;

    const [rows] = await pool.execute(
      `
      SELECT 
        DATE(s.created_at) as date,
        COUNT(al.log_id) as attended_sessions,
        GROUP_CONCAT(c.course_name) as courses_attended
      FROM attendance_sessions s
      LEFT JOIN attendance_logs al ON s.session_id = al.session_id AND al.student_id = ?
      LEFT JOIN courses c ON s.course_id = c.course_id
      WHERE YEAR(s.created_at) = ? AND MONTH(s.created_at) = ?
      GROUP BY DATE(s.created_at)
      ORDER BY date
    `,
      [student_id, year, month]
    );

    res.json(rows);
  } catch (error) {
    console.error("Get calendar error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get attendance streak
router.get("/streak", async (req, res) => {
  try {
    const student_id = req.user.id;

    const [rows] = await pool.execute(
      `
      SELECT 
        COUNT(*) as current_streak,
        MAX(attendance_date) as last_attendance_date
      FROM (
        SELECT DISTINCT DATE(s.created_at) as attendance_date
        FROM attendance_logs al
        JOIN attendance_sessions s ON al.session_id = s.session_id
        WHERE al.student_id = ?
        ORDER BY attendance_date DESC
      ) as attendance_dates
    `,
      [student_id]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error("Get streak error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
