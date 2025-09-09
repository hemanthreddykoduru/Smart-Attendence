import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
};

// Faculty API
export const facultyAPI = {
  createCourse: (courseData) => api.post("/faculty/course", courseData),
  getCourses: () => api.get("/faculty/courses"),
  startSession: (courseId) =>
    api.post("/faculty/session", { course_id: courseId }),
  getAnalytics: (courseId) => api.get(`/faculty/analytics/${courseId}`),
  getAttendance: (courseId) => api.get(`/faculty/attendance/${courseId}`),
  getProfile: () => api.get("/faculty/profile"),
  updateProfile: (profileData) => api.put("/faculty/profile", profileData),
  getStudents: (courseId) => api.get(`/faculty/students/${courseId}`),
  exportReport: (courseId) => api.get(`/faculty/export/${courseId}`),
  getDashboardStats: () => api.get("/faculty/dashboard-stats"),
  markManualAttendance: (data) => api.post("/faculty/manual-attendance", data),
  markPostAttendance: (data) => api.post("/faculty/post-attendance", data),
};

// Student API
export const studentAPI = {
  markAttendance: (qrCode) =>
    api.post("/student/attendance", { qr_code: qrCode }),
  getAttendance: (studentId) =>
    api.get(`/student/attendance/${studentId || ""}`),
  getCourses: () => api.get("/student/courses"),
  getProfile: () => api.get("/student/profile"),
  updateProfile: (profileData) => api.put("/student/profile", profileData),
  getCalendar: (year, month) => api.get(`/student/calendar/${year}/${month}`),
  getStreak: () => api.get("/student/streak"),
};

export default api;
