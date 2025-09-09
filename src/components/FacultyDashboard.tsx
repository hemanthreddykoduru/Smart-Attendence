import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Plus, Users, BookOpen, Calendar, Download, QrCode, BarChart3, TrendingUp } from 'lucide-react';
import { facultyAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import Layout from './Layout';
import QRCodeGenerator from './QRCodeGenerator';
import FacultyProfile from './FacultyProfile';
import StudentManagement from './StudentManagement';
import ManualAttendance from './ManualAttendance';
import toast from 'react-hot-toast';

const FacultyDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    todayAttendance: 0,
    avgAttendance: 0,
  });

  // Course creation form
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({
    course_name: '',
    course_code: '',
  });

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'students'>('dashboard');
  
  // Manual attendance modal
  const [showManualAttendance, setShowManualAttendance] = useState(false);
  const [showPostAttendance, setShowPostAttendance] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchStats();
  }, [user]);

  useEffect(() => {
    if (selectedCourse) {
      fetchAttendanceData(selectedCourse);
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const response = await facultyAPI.getCourses();
      setCourses(response.data);
      if (response.data.length > 0 && !selectedCourse) {
        setSelectedCourse(response.data[0].course_id);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await facultyAPI.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Fallback to basic stats
      setStats({
        totalCourses: courses.length,
        totalStudents: 0,
        todayAttendance: 0,
        avgAttendance: 0,
      });
    }
  };

  const fetchAttendanceData = async (courseId: string) => {
    try {
      const response = await facultyAPI.getAnalytics(courseId);
      const chartData = response.data.dailyAttendance.map((item: any) => ({
        date: new Date(item.date).toLocaleDateString(),
        present: item.attendance_count,
        total: item.attendance_count + Math.floor(Math.random() * 10), // Mock total
      }));
      setAttendanceData(chartData);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    }
  };

  const createCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await facultyAPI.createCourse(newCourse);
      toast.success('Course created successfully!');
      setNewCourse({ course_name: '', course_code: '' });
      setShowCreateCourse(false);
      fetchCourses();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create course');
    }
  };

  const startAttendanceSession = async () => {
    if (!selectedCourse) return;

    try {
      const response = await facultyAPI.startSession(selectedCourse);
      setActiveSession({
        session_id: response.data.qrCode,
        expires_at: response.data.expiresAt,
      });
      toast.success('Attendance session started!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to start session');
    }
  };

  const handleSessionExpired = (oldCode: string) => {
    // QR code refreshed automatically, no need to stop session
    console.log('QR code refreshed:', oldCode);
  };

  const pieData = [
    { name: 'Present', value: 75, color: '#10B981' },
    { name: 'Absent', value: 25, color: '#EF4444' },
  ];

  return (
    <Layout title="Faculty Dashboard">
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-white/20">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Dashboard</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Profile</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'students'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Students</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && <FacultyProfile />}
        {activeTab === 'students' && selectedCourse && <StudentManagement courseId={selectedCourse} />}
        
        {activeTab === 'dashboard' && (
          <>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Courses', value: stats.totalCourses, icon: BookOpen, color: 'blue' },
            { label: 'Today\'s Attendance', value: stats.todayAttendance, icon: Users, color: 'green' },
            { label: 'Average Attendance', value: `${stats.avgAttendance}%`, icon: Calendar, color: 'purple' },
            { label: 'Active Sessions', value: activeSession ? 1 : 0, icon: QrCode, color: 'orange' },
          ].map((stat, index) => (
            <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`h-12 w-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Course Management & QR */}
          <div className="space-y-6">
            {/* Course Selection & Management */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Course Management</h2>
                <button
                  onClick={() => setShowCreateCourse(true)}
                  className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Course</span>
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Course
                  </label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {courses.map((course) => (
                      <option key={course.course_id} value={course.course_id}>
                        {course.course_name} ({course.course_code})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCourse && !activeSession && (
                  <div className="space-y-3">
                    <button
                      onClick={startAttendanceSession}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center space-x-2"
                    >
                      <QrCode className="h-5 w-5" />
                      <span>Start QR Session</span>
                    </button>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setShowManualAttendance(true)}
                        className="bg-blue-600 text-white py-2 px-3 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center justify-center space-x-1 text-sm"
                      >
                        <Users className="h-4 w-4" />
                        <span>Manual</span>
                      </button>
                      <button
                        onClick={() => setShowPostAttendance(true)}
                        className="bg-purple-600 text-white py-2 px-3 rounded-lg font-medium hover:bg-purple-700 transition-all flex items-center justify-center space-x-1 text-sm"
                      >
                        <Calendar className="h-4 w-4" />
                        <span>Post</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* QR Code Generator */}
            {activeSession && (
              <QRCodeGenerator
                sessionId={activeSession.session_id}
                onExpired={handleSessionExpired}
              />
            )}
          </div>

          {/* Right Column - Analytics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Attendance Overview */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Attendance Analytics</h2>
                <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm">
                  <Download className="h-4 w-4" />
                  <span>Export Report</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Today's Attendance</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Line Chart */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Attendance Trend</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={attendanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="present" stroke="#10B981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Sessions</h2>
              <div className="space-y-3">
                {attendanceData.slice(0, 5).map((session, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{session.date}</p>
                      <p className="text-sm text-gray-600">{session.present} students attended</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">
                        {Math.round((session.present / session.total) * 100)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Create Course Modal */}
        {showCreateCourse && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Course</h2>
              <form onSubmit={createCourse} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Name
                  </label>
                  <input
                    type="text"
                    value={newCourse.course_name}
                    onChange={(e) => setNewCourse({...newCourse, course_name: e.target.value})}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Data Structures"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Code
                  </label>
                  <input
                    type="text"
                    value={newCourse.course_code}
                    onChange={(e) => setNewCourse({...newCourse, course_code: e.target.value})}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., CS201"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateCourse(false)}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Create Course
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
          </>
        )}

        {/* Manual Attendance Modal */}
        {showManualAttendance && (
          <ManualAttendance
            courseId={selectedCourse}
            onClose={() => setShowManualAttendance(false)}
            sessionId={activeSession?.session_id}
            isPostAttendance={false}
          />
        )}

        {/* Post Attendance Modal */}
        {showPostAttendance && (
          <ManualAttendance
            courseId={selectedCourse}
            onClose={() => setShowPostAttendance(false)}
            isPostAttendance={true}
          />
        )}
      </div>
    </Layout>
  );
};

export default FacultyDashboard;