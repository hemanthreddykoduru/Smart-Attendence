import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, Search, Calendar, AlertCircle } from 'lucide-react';
import { facultyAPI } from '../services/api';
import toast from 'react-hot-toast';

interface ManualAttendanceProps {
  courseId: string;
  onClose: () => void;
  sessionId?: string;
  isPostAttendance?: boolean;
}

const ManualAttendance: React.FC<ManualAttendanceProps> = ({ 
  courseId, 
  onClose, 
  sessionId,
  isPostAttendance = false 
}) => {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchStudents();
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

  const handleStudentToggle = (studentId: number) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    const filteredStudents = students.filter(student => 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.roll_number.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.student_id));
    }
  };

  const handleSubmit = async () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    if (isPostAttendance && !sessionDate) {
      toast.error('Please select session date');
      return;
    }

    setSubmitting(true);
    try {
      if (isPostAttendance) {
        await facultyAPI.markPostAttendance({
          course_id: courseId,
          student_ids: selectedStudents,
          session_date: sessionDate,
          reason: reason || 'Late attendance'
        });
        toast.success(`Post-attendance marked for ${selectedStudents.length} students`);
      } else {
        await facultyAPI.markManualAttendance({
          course_id: courseId,
          student_ids: selectedStudents,
          session_id: sessionId
        });
        toast.success(`Manual attendance marked for ${selectedStudents.length} students`);
      }
      
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to mark attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.roll_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isPostAttendance ? 'Post-Attendance' : 'Manual Attendance'}
              </h2>
              <p className="text-sm text-gray-600">
                {isPostAttendance 
                  ? 'Mark attendance for late students' 
                  : 'Mark attendance manually for students with camera issues'
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XCircle className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Post-attendance specific fields */}
        {isPostAttendance && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session Date
              </label>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason (Optional)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Late arrival, Technical issues"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Search and Select All */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={handleSelectAll}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {selectedStudents.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        {/* Student List */}
        <div className="max-h-96 overflow-y-auto space-y-2 mb-6">
          {filteredStudents.map((student) => (
            <div
              key={student.student_id}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                selectedStudents.includes(student.student_id)
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              }`}
              onClick={() => handleStudentToggle(student.student_id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-medium ${
                    selectedStudents.includes(student.student_id)
                      ? 'bg-green-500'
                      : 'bg-gray-400'
                  }`}>
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
                    <div className="text-sm text-gray-600">
                      {student.attended_sessions || 0} / {student.total_sessions || 0}
                    </div>
                    <div className="text-xs text-gray-500">
                      {student.attendance_percentage || 0}%
                    </div>
                  </div>
                  
                  {selectedStudents.includes(student.student_id) ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <div className="h-6 w-6 border-2 border-gray-300 rounded-full"></div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary and Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || selectedStudents.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <CheckCircle className="h-4 w-4" />
              <span>
                {submitting 
                  ? 'Processing...' 
                  : isPostAttendance 
                    ? 'Mark Post-Attendance' 
                    : 'Mark Manual Attendance'
                }
              </span>
            </button>
          </div>
        </div>

        {/* Info Notice */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800 font-medium">
                {isPostAttendance ? 'Post-Attendance Notice:' : 'Manual Attendance Notice:'}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                {isPostAttendance 
                  ? 'This will create a separate attendance session for the selected date. Use this for students who arrived late.'
                  : 'This will mark attendance for students who cannot use their camera. Only use when necessary.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualAttendance;
