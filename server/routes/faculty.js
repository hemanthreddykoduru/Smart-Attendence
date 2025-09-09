import express from "express";
import { pool } from "../config/database.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication and faculty role requirement to all routes
router.use(authenticateToken);
router.use(requireRole("faculty"));

// Create course
router.post("/course", async (req, res) => {
  try {
    const { course_name, course_code } = req.body;
    const faculty_id = req.user.id;

    if (!course_name || !course_code) {
      return res
        .status(400)
        .json({ error: "Course name and code are required" });
    }

    const [result] = await pool.execute(
      "INSERT INTO courses (course_name, course_code, faculty_id) VALUES (?, ?, ?)",
      [course_name, course_code, faculty_id]
    );

    res.status(201).json({
      message: "Course created successfully",
      courseId: result.insertId,
    });
  } catch (error) {
    console.error("Create course error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get faculty courses
router.get("/courses", async (req, res) => {
  try {
    const faculty_id = req.user.id;

    const [rows] = await pool.execute(
      "SELECT * FROM courses WHERE faculty_id = ? ORDER BY created_at DESC",
      [faculty_id]
    );

    res.json(rows);
  } catch (error) {
    console.error("Get courses error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start attendance session
router.post("/session", async (req, res) => {
  try {
    const { course_id } = req.body;
    const faculty_id = req.user.id;

    if (!course_id) {
      return res.status(400).json({ error: "Course ID is required" });
    }

    // Verify course belongs to faculty
    const [courseRows] = await pool.execute(
      "SELECT * FROM courses WHERE course_id = ? AND faculty_id = ?",
      [course_id, faculty_id]
    );

    if (courseRows.length === 0) {
      return res
        .status(404)
        .json({ error: "Course not found or access denied" });
    }

    // Generate unique session ID and QR code
    const sessionId =
      Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const expiresAt = new Date(Date.now() + 15 * 1000); // 15 seconds from now

    const [result] = await pool.execute(
      "INSERT INTO attendance_sessions (course_id, qr_code, expires_at) VALUES (?, ?, ?)",
      [course_id, sessionId, expiresAt]
    );

    res.json({
      message: "Attendance session started",
      sessionId: result.insertId,
      qrCode: sessionId,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Start session error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get attendance analytics for a course
router.get("/analytics/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;
    const faculty_id = req.user.id;

    // Verify course belongs to faculty
    const [courseRows] = await pool.execute(
      "SELECT * FROM courses WHERE course_id = ? AND faculty_id = ?",
      [courseId, faculty_id]
    );

    if (courseRows.length === 0) {
      return res
        .status(404)
        .json({ error: "Course not found or access denied" });
    }

    // Get attendance statistics
    const [sessionStats] = await pool.execute(
      `
      SELECT 
        COUNT(DISTINCT s.session_id) as total_sessions,
        COUNT(DISTINCT al.student_id) as unique_students,
        COUNT(al.log_id) as total_attendance
      FROM attendance_sessions s
      LEFT JOIN attendance_logs al ON s.session_id = al.session_id
      WHERE s.course_id = ?
    `,
      [courseId]
    );

    // Get recent sessions with attendance count
    const [recentSessions] = await pool.execute(
      `
      SELECT 
        s.session_id,
        s.session_date,
        s.created_at,
        COUNT(al.log_id) as attendance_count
      FROM attendance_sessions s
      LEFT JOIN attendance_logs al ON s.session_id = al.session_id
      WHERE s.course_id = ?
      GROUP BY s.session_id
      ORDER BY s.created_at DESC
      LIMIT 10
    `,
      [courseId]
    );

    // Get attendance by date for chart
    const [dailyAttendance] = await pool.execute(
      `
      SELECT 
        DATE(s.created_at) as date,
        COUNT(al.log_id) as attendance_count
      FROM attendance_sessions s
      LEFT JOIN attendance_logs al ON s.session_id = al.session_id
      WHERE s.course_id = ?
      GROUP BY DATE(s.created_at)
      ORDER BY date DESC
      LIMIT 30
    `,
      [courseId]
    );

    res.json({
      stats: sessionStats[0],
      recentSessions,
      dailyAttendance,
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all attendance logs for a course
router.get("/attendance/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;
    const faculty_id = req.user.id;

    // Verify course belongs to faculty
    const [courseRows] = await pool.execute(
      "SELECT * FROM courses WHERE course_id = ? AND faculty_id = ?",
      [courseId, faculty_id]
    );

    if (courseRows.length === 0) {
      return res
        .status(404)
        .json({ error: "Course not found or access denied" });
    }

    const [rows] = await pool.execute(
      `
      SELECT 
        al.log_id,
        al.marked_at,
        al.status,
        s.name as student_name,
        s.roll_number,
        sess.session_date,
        sess.created_at as session_time
      FROM attendance_logs al
      JOIN students s ON al.student_id = s.student_id
      JOIN attendance_sessions sess ON al.session_id = sess.session_id
      WHERE sess.course_id = ?
      ORDER BY al.marked_at DESC
    `,
      [courseId]
    );

    res.json(rows);
  } catch (error) {
    console.error("Get attendance logs error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get faculty profile
router.get("/profile", async (req, res) => {
  try {
    const faculty_id = req.user.id;

    const [rows] = await pool.execute(
      "SELECT faculty_id, name, email, department, created_at FROM faculty WHERE faculty_id = ?",
      [faculty_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Faculty not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update faculty profile
router.put("/profile", async (req, res) => {
  try {
    const faculty_id = req.user.id;
    const { name, department } = req.body;

    const [result] = await pool.execute(
      "UPDATE faculty SET name = ?, department = ? WHERE faculty_id = ?",
      [name, department, faculty_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Faculty not found" });
    }

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get detailed student list for a course
router.get("/students/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;
    const faculty_id = req.user.id;

    // Verify course belongs to faculty
    const [courseRows] = await pool.execute(
      "SELECT * FROM courses WHERE course_id = ? AND faculty_id = ?",
      [courseId, faculty_id]
    );

    if (courseRows.length === 0) {
      return res
        .status(404)
        .json({ error: "Course not found or access denied" });
    }

    // Get all students with their attendance stats for this course
    const [rows] = await pool.execute(
      `
      SELECT 
        s.student_id,
        s.name,
        s.roll_number,
        s.branch,
        s.year,
        COUNT(DISTINCT sess.session_id) as total_sessions,
        COUNT(DISTINCT al.log_id) as attended_sessions,
        ROUND((COUNT(DISTINCT al.log_id) / COUNT(DISTINCT sess.session_id)) * 100, 2) as attendance_percentage,
        MAX(al.marked_at) as last_attendance
      FROM students s
      LEFT JOIN attendance_sessions sess ON sess.course_id = ?
      LEFT JOIN attendance_logs al ON al.session_id = sess.session_id AND al.student_id = s.student_id
      GROUP BY s.student_id
      ORDER BY attendance_percentage DESC, s.name
    `,
      [courseId]
    );

    res.json(rows);
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Export attendance report (CSV format)
router.get("/export/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;
    const faculty_id = req.user.id;

    // Verify course belongs to faculty
    const [courseRows] = await pool.execute(
      "SELECT * FROM courses WHERE course_id = ? AND faculty_id = ?",
      [courseId, faculty_id]
    );

    if (courseRows.length === 0) {
      return res
        .status(404)
        .json({ error: "Course not found or access denied" });
    }

    // Get detailed attendance data
    const [rows] = await pool.execute(
      `
      SELECT 
        s.name as student_name,
        s.roll_number,
        s.branch,
        s.year,
        sess.session_date,
        sess.created_at as session_time,
        al.marked_at as attendance_time,
        al.status,
        CASE 
          WHEN al.log_id IS NOT NULL THEN 'Present'
          ELSE 'Absent'
        END as attendance_status
      FROM students s
      CROSS JOIN attendance_sessions sess
      LEFT JOIN attendance_logs al ON al.session_id = sess.session_id AND al.student_id = s.student_id
      WHERE sess.course_id = ?
      ORDER BY s.name, sess.created_at
    `,
      [courseId]
    );

    // Convert to CSV format
    const csvHeader =
      "Student Name,Roll Number,Branch,Year,Session Date,Session Time,Attendance Time,Status\n";
    const csvData = rows
      .map(
        (row) =>
          `"${row.student_name}","${row.roll_number}","${row.branch}","${
            row.year
          }","${row.session_date}","${row.session_time}","${
            row.attendance_time || ""
          }","${row.attendance_status}"`
      )
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="attendance_report_${courseId}.csv"`
    );
    res.send(csvHeader + csvData);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Manual attendance marking
router.post("/manual-attendance", async (req, res) => {
  try {
    const { course_id, student_ids, session_id } = req.body;
    const faculty_id = req.user.id;

    if (!course_id || !student_ids || !Array.isArray(student_ids)) {
      return res
        .status(400)
        .json({ error: "Course ID and student IDs are required" });
    }

    // Verify course belongs to faculty
    const [courseRows] = await pool.execute(
      "SELECT * FROM courses WHERE course_id = ? AND faculty_id = ?",
      [course_id, faculty_id]
    );

    if (courseRows.length === 0) {
      return res
        .status(404)
        .json({ error: "Course not found or access denied" });
    }

    // Get or create session
    let sessionId = session_id;
    if (!sessionId) {
      // Create a new session for manual attendance
      const [sessionResult] = await pool.execute(
        "INSERT INTO attendance_sessions (course_id, qr_code, expires_at) VALUES (?, ?, ?)",
        [
          course_id,
          `manual-${Date.now()}`,
          new Date(Date.now() + 24 * 60 * 60 * 1000),
        ] // 24 hours for manual sessions
      );
      sessionId = sessionResult.insertId;
    }

    // Mark attendance for each student
    const results = [];
    for (const student_id of student_ids) {
      try {
        // Check if already marked
        const [existing] = await pool.execute(
          "SELECT * FROM attendance_logs WHERE session_id = ? AND student_id = ?",
          [sessionId, student_id]
        );

        if (existing.length === 0) {
          const [result] = await pool.execute(
            "INSERT INTO attendance_logs (session_id, student_id, status) VALUES (?, ?, ?)",
            [sessionId, student_id, "present"]
          );
          results.push({
            student_id,
            status: "marked",
            log_id: result.insertId,
          });
        } else {
          results.push({ student_id, status: "already_marked" });
        }
      } catch (error) {
        results.push({ student_id, status: "error", error: error.message });
      }
    }

    res.json({
      message: "Manual attendance processed",
      session_id: sessionId,
      results,
    });
  } catch (error) {
    console.error("Manual attendance error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Post-attendance marking (for late students)
router.post("/post-attendance", async (req, res) => {
  try {
    const { course_id, student_ids, session_date, reason } = req.body;
    const faculty_id = req.user.id;

    if (
      !course_id ||
      !student_ids ||
      !Array.isArray(student_ids) ||
      !session_date
    ) {
      return res
        .status(400)
        .json({
          error: "Course ID, student IDs, and session date are required",
        });
    }

    // Verify course belongs to faculty
    const [courseRows] = await pool.execute(
      "SELECT * FROM courses WHERE course_id = ? AND faculty_id = ?",
      [course_id, faculty_id]
    );

    if (courseRows.length === 0) {
      return res
        .status(404)
        .json({ error: "Course not found or access denied" });
    }

    // Create a post-attendance session
    const [sessionResult] = await pool.execute(
      "INSERT INTO attendance_sessions (course_id, qr_code, expires_at, session_date) VALUES (?, ?, ?, ?)",
      [
        course_id,
        `post-${Date.now()}`,
        new Date(Date.now() + 24 * 60 * 60 * 1000),
        session_date,
      ]
    );
    const sessionId = sessionResult.insertId;

    // Mark attendance for each student
    const results = [];
    for (const student_id of student_ids) {
      try {
        const [result] = await pool.execute(
          "INSERT INTO attendance_logs (session_id, student_id, status) VALUES (?, ?, ?)",
          [sessionId, student_id, "present"]
        );
        results.push({ student_id, status: "marked", log_id: result.insertId });
      } catch (error) {
        results.push({ student_id, status: "error", error: error.message });
      }
    }

    res.json({
      message: "Post-attendance processed successfully",
      session_id: sessionId,
      session_date,
      reason,
      results,
    });
  } catch (error) {
    console.error("Post-attendance error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get dashboard statistics
router.get("/dashboard-stats", async (req, res) => {
  try {
    const faculty_id = req.user.id;

    // Get total courses
    const [courseCount] = await pool.execute(
      "SELECT COUNT(*) as total_courses FROM courses WHERE faculty_id = ?",
      [faculty_id]
    );

    // Get total sessions this month
    const [sessionCount] = await pool.execute(
      `
      SELECT COUNT(*) as total_sessions 
      FROM attendance_sessions s
      JOIN courses c ON s.course_id = c.course_id
      WHERE c.faculty_id = ? AND MONTH(s.created_at) = MONTH(CURRENT_DATE())
    `,
      [faculty_id]
    );

    // Get total attendance this month
    const [attendanceCount] = await pool.execute(
      `
      SELECT COUNT(*) as total_attendance
      FROM attendance_logs al
      JOIN attendance_sessions s ON al.session_id = s.session_id
      JOIN courses c ON s.course_id = c.course_id
      WHERE c.faculty_id = ? AND MONTH(al.marked_at) = MONTH(CURRENT_DATE())
    `,
      [faculty_id]
    );

    // Get average attendance percentage
    const [avgAttendance] = await pool.execute(
      `
      SELECT ROUND(AVG(attendance_percentage), 2) as avg_attendance
      FROM (
        SELECT 
          s.student_id,
          ROUND((COUNT(DISTINCT al.log_id) / COUNT(DISTINCT sess.session_id)) * 100, 2) as attendance_percentage
        FROM students s
        LEFT JOIN attendance_sessions sess ON sess.course_id IN (
          SELECT course_id FROM courses WHERE faculty_id = ?
        )
        LEFT JOIN attendance_logs al ON al.session_id = sess.session_id AND al.student_id = s.student_id
        GROUP BY s.student_id
        HAVING COUNT(DISTINCT sess.session_id) > 0
      ) as student_stats
    `,
      [faculty_id]
    );

    res.json({
      totalCourses: courseCount[0].total_courses,
      totalSessions: sessionCount[0].total_sessions,
      totalAttendance: attendanceCount[0].total_attendance,
      avgAttendance: avgAttendance[0].avg_attendance || 0,
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
