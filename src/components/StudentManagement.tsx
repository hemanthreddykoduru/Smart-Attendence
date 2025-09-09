import React, { useState, useEffect } from 'react';
import { Users, Search, Download, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { facultyAPI } from '../services/api';
import toast from 'react-hot-toast';

interface StudentManagementProps {
  courseId: string;
}

const StudentManagement: React.FC<StudentManagementProps> = ({ courseId }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'attendance' | 'roll_number'>('attendance');

  useEffect(() => {
    if (courseId) {
      fetchStudents();
    }
  }, [courseId]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await facultyAPI.getStudents(courseId);
      setStudents(response.data);
    } catch (error: any) {
      toast.error('Failed to load students');
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await facultyAPI.exportReport(courseId);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance_report_${courseId}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Report exported successfully!');
    } catch (error: any) {
      toast.error('Failed to export report');
      console.error('Error exporting report:', error);
    }
  };

  const filteredStudents = students
    .filter(student => 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.roll_number.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'roll_number':
          return a.roll_number.localeCompare(b.roll_number);
        case 'attendance':
        default:
          return (b.attendance_percentage || 0) - (a.attendance_percentage || 0);
      }
    });

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 75) return 'text-blue-600 bg-blue-100';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getAttendanceIcon = (percentage: number) => {
    if (percentage >= 75) return TrendingUp;
    return TrendingDown;
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Student Management</h2>
            <p className="text-sm text-gray-600">Track student attendance and performance</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Export Report</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="attendance">Sort by Attendance</option>
            <option value="name">Sort by Name</option>
            <option value="roll_number">Sort by Roll Number</option>
          </select>
        </div>
      </div>

      {/* Student List */}
      <div className="space-y-3">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No students found</p>
            <p className="text-sm">Try adjusting your search criteria</p>
          </div>
        ) : (
          filteredStudents.map((student) => {
            const AttendanceIcon = getAttendanceIcon(student.attendance_percentage || 0);
            
            return (
              <div key={student.student_id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-600">
                        {student.roll_number} • {student.branch} • Year {student.year}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <AttendanceIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {student.attended_sessions || 0} / {student.total_sessions || 0}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Last: {student.last_attendance 
                          ? new Date(student.last_attendance).toLocaleDateString()
                          : 'Never'
                        }
                      </div>
                    </div>
                    
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getAttendanceColor(student.attendance_percentage || 0)}`}>
                      {student.attendance_percentage ? `${student.attendance_percentage}%` : '0%'}
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Attendance Progress</span>
                    <span>{student.attendance_percentage || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        (student.attendance_percentage || 0) >= 75 ? 'bg-green-500' :
                        (student.attendance_percentage || 0) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${student.attendance_percentage || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary Stats */}
      {students.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{students.length}</div>
            <div className="text-sm text-blue-600">Total Students</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {students.filter(s => (s.attendance_percentage || 0) >= 75).length}
            </div>
            <div className="text-sm text-green-600">Good Attendance</div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {students.filter(s => (s.attendance_percentage || 0) < 75).length}
            </div>
            <div className="text-sm text-red-600">Low Attendance</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
