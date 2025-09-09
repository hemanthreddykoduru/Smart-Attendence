-- QR-Based Attendance System Database Schema
-- Run this SQL script in your MySQL database

CREATE DATABASE IF NOT EXISTS attendance_system;
USE attendance_system;

-- Students table
CREATE TABLE IF NOT EXISTS students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    roll_number VARCHAR(50) UNIQUE NOT NULL,
    branch VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Faculty table
CREATE TABLE IF NOT EXISTS faculty (
    faculty_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    department VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL,
    course_code VARCHAR(20) NOT NULL,
    faculty_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id) ON DELETE CASCADE
);

-- Attendance sessions table
CREATE TABLE IF NOT EXISTS attendance_sessions (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    session_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    qr_code TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

-- Attendance logs table
CREATE TABLE IF NOT EXISTS attendance_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    student_id INT NOT NULL,
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('present', 'late') DEFAULT 'present',
    FOREIGN KEY (session_id) REFERENCES attendance_sessions(session_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    UNIQUE KEY unique_attendance (session_id, student_id)
);

-- Insert sample data for testing
INSERT IGNORE INTO faculty (name, email, password, department) VALUES 
('Dr. John Smith', 'john.smith@college.edu', '$2a$10$example_hashed_password', 'Computer Science'),
('Dr. Sarah Johnson', 'sarah.johnson@college.edu', '$2a$10$example_hashed_password', 'Mathematics');

INSERT IGNORE INTO students (name, email, password, roll_number, branch, year) VALUES 
('Alice Brown', 'alice.brown@student.edu', '$2a$10$example_hashed_password', 'CS2021001', 'Computer Science', 3),
('Bob Wilson', 'bob.wilson@student.edu', '$2a$10$example_hashed_password', 'CS2021002', 'Computer Science', 3);

INSERT IGNORE INTO courses (course_name, course_code, faculty_id) VALUES 
('Data Structures', 'CS301', 1),
('Database Systems', 'CS302', 1),
('Calculus II', 'MATH201', 2);