import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { QrCode, BookOpen, Calendar, AlertTriangle, CheckCircle, BarChart3, User, Flame } from 'lucide-react';
import { studentAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import Layout from './Layout';
import QRScanner from './QRScanner';
import StudentProfile from './StudentProfile';
import AttendanceCalendar from './AttendanceCalendar';
import AttendanceStreak from './AttendanceStreak';

const StudentDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalClasses: 0,
    attendedClasses: 0,
    attendancePercentage: 0,
    lowAttendanceAlert: false,
  });

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'calendar' | 'streak'>('dashboard');

  useEffect(() => {
    if (user) {
      fetchAttendanceData();
    }
  }, [user]);

  const fetchAttendanceData = async () => {
    try {
      const response = await studentAPI.getAttendance();
      const { courseStats, overallStats } = response.data;
      
      // Convert to chart data
      const chartData = courseStats.map((course: any) => ({
        course: course.course_code,
        attended: course.attended_sessions,
        total: course.total_sessions,
        percentage: course.attendance_percentage,
      }));

      setAttendanceData(chartData);
      setOverallStats(overallStats);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    }
  };

  const pieData = [
    { name: 'Attended', value: overallStats.attendancePercentage, color: '#10B981' },
    { name: 'Missed', value: 100 - overallStats.attendancePercentage, color: '#EF4444' },
  ];

  return (
    <Layout title="Student Dashboard">
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-white/20">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center space-x-1">
                <BarChart3 className="h-4 w-4" />
                <span>Dashboard</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                activeTab === 'profile'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center space-x-1">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                activeTab === 'calendar'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Calendar</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('streak')}
              className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                activeTab === 'streak'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center space-x-1">
                <Flame className="h-4 w-4" />
                <span>Streak</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && <StudentProfile />}
        {activeTab === 'calendar' && <AttendanceCalendar />}
        {activeTab === 'streak' && <AttendanceStreak />}
        
        {activeTab === 'dashboard' && (
          <>
        {/* Alert for Low Attendance */}
        {overallStats.lowAttendanceAlert && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Low Attendance Warning
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  Your attendance is {overallStats.attendancePercentage}%, which is below the required 75%. 
                  Please attend classes regularly to meet the minimum requirement.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { 
              label: 'Total Classes', 
              value: overallStats.totalClasses, 
              icon: BookOpen, 
              color: 'blue' 
            },
            { 
              label: 'Classes Attended', 
              value: overallStats.attendedClasses, 
              icon: CheckCircle, 
              color: 'green' 
            },
            { 
              label: 'Attendance %', 
              value: `${overallStats.attendancePercentage}%`, 
              icon: Calendar, 
              color: overallStats.attendancePercentage >= 75 ? 'green' : 'red' 
            },
            { 
              label: 'Status', 
              value: overallStats.attendancePercentage >= 75 ? 'Good' : 'Alert', 
              icon: overallStats.attendancePercentage >= 75 ? CheckCircle : AlertTriangle, 
              color: overallStats.attendancePercentage >= 75 ? 'green' : 'red' 
            },
          ].map((stat, index) => (
            <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${
                    stat.color === 'green' ? 'text-green-600' : 
                    stat.color === 'red' ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                  stat.color === 'green' ? 'bg-green-100' : 
                  stat.color === 'red' ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  <stat.icon className={`h-6 w-6 ${
                    stat.color === 'green' ? 'text-green-600' : 
                    stat.color === 'red' ? 'text-red-600' : 'text-blue-600'
                  }`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* QR Scanner */}
          <div className="lg:col-span-1">
            <QRScanner />
          </div>

          {/* Analytics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course-wise Attendance */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Course-wise Attendance
              </h2>
              
              {attendanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="course" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'attended' ? `${value} attended` : `${value}%`,
                        name === 'attended' ? 'Classes Attended' : 'Attendance %'
                      ]}
                    />
                    <Bar dataKey="attended" fill="#10B981" name="attended" />
                    <Bar dataKey="percentage" fill="#3B82F6" name="percentage" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <QrCode className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No attendance data available</p>
                  <p className="text-sm">Start scanning QR codes to track your attendance</p>
                </div>
              )}
            </div>

            {/* Overall Attendance Overview */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Overall Attendance Overview
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
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

                {/* Summary */}
                <div className="flex flex-col justify-center space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">
                      {overallStats.attendancePercentage}%
                    </p>
                    <p className="text-sm text-gray-600">Overall Attendance</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Classes Attended:</span>
                      <span className="font-medium">{overallStats.attendedClasses}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Classes:</span>
                      <span className="font-medium">{overallStats.totalClasses}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Classes Missed:</span>
                      <span className="font-medium text-red-600">
                        {overallStats.totalClasses - overallStats.attendedClasses}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Attendance
          </h2>
          
          {attendanceData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {attendanceData.map((course, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{course.course}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      course.percentage >= 75 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {course.percentage}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {course.attended} of {course.total} classes
                  </p>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        course.percentage >= 75 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${course.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No course data available</p>
            </div>
          )}
        </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default StudentDashboard;