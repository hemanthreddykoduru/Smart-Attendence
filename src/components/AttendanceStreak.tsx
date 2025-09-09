import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Target, Calendar } from 'lucide-react';
import { studentAPI } from '../services/api';
import toast from 'react-hot-toast';

const AttendanceStreak: React.FC = () => {
  const [streakData, setStreakData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreakData();
  }, []);

  const fetchStreakData = async () => {
    try {
      const response = await studentAPI.getStreak();
      setStreakData(response.data);
    } catch (error: any) {
      toast.error('Failed to load attendance streak');
      console.error('Error fetching streak data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStreakMessage = (streak: number) => {
    if (streak === 0) return "Start your attendance streak!";
    if (streak === 1) return "Great start! Keep it up!";
    if (streak < 5) return "Building momentum! 🔥";
    if (streak < 10) return "On fire! You're unstoppable! 🔥🔥";
    if (streak < 20) return "Legendary streak! 🏆";
    return "You're a attendance champion! 🏆👑";
  };

  const getStreakColor = (streak: number) => {
    if (streak === 0) return 'text-gray-500';
    if (streak < 5) return 'text-orange-500';
    if (streak < 10) return 'text-red-500';
    return 'text-purple-600';
  };

  const getStreakIcon = (streak: number) => {
    if (streak === 0) return Target;
    if (streak < 5) return Flame;
    if (streak < 10) return Trophy;
    return Trophy;
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  const streak = streakData?.current_streak || 0;
  const lastAttendance = streakData?.last_attendance_date;
  const StreakIcon = getStreakIcon(streak);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
      <div className="flex items-center space-x-3 mb-6">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
          streak === 0 ? 'bg-gray-100' : 
          streak < 5 ? 'bg-orange-100' : 
          streak < 10 ? 'bg-red-100' : 'bg-purple-100'
        }`}>
          <StreakIcon className={`h-6 w-6 ${
            streak === 0 ? 'text-gray-500' : 
            streak < 5 ? 'text-orange-500' : 
            streak < 10 ? 'text-red-500' : 'text-purple-600'
          }`} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Attendance Streak</h2>
          <p className="text-sm text-gray-600">Track your consecutive attendance</p>
        </div>
      </div>

      <div className="text-center mb-6">
        <div className={`text-6xl font-bold mb-2 ${getStreakColor(streak)}`}>
          {streak}
        </div>
        <div className="text-lg text-gray-600 mb-2">
          {streak === 1 ? 'Day' : 'Days'} Streak
        </div>
        <div className="text-sm text-gray-500">
          {getStreakMessage(streak)}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Last Attendance</span>
          </div>
          <span className="text-sm font-medium text-gray-900">
            {lastAttendance 
              ? new Date(lastAttendance).toLocaleDateString()
              : 'Never'
            }
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{streak}</div>
            <div className="text-xs text-blue-600">Current</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {streak >= 5 ? '🔥' : '🎯'}
            </div>
            <div className="text-xs text-green-600">Status</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {Math.max(0, 10 - streak)}
            </div>
            <div className="text-xs text-purple-600">To Goal</div>
          </div>
        </div>

        {streak === 0 && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-center">
              <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-medium text-blue-800 mb-1">Start Your Streak!</h3>
              <p className="text-sm text-blue-700">
                Attend your next class to begin your attendance streak. 
                Consistency is key to academic success!
              </p>
            </div>
          </div>
        )}

        {streak > 0 && streak < 10 && (
          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="text-center">
              <Flame className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <h3 className="font-medium text-orange-800 mb-1">Keep It Going!</h3>
              <p className="text-sm text-orange-700">
                You're building a great habit! Aim for 10 consecutive days to unlock the next achievement.
              </p>
            </div>
          </div>
        )}

        {streak >= 10 && (
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-center">
              <Trophy className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-medium text-purple-800 mb-1">Streak Master!</h3>
              <p className="text-sm text-purple-700">
                Incredible dedication! You're setting an excellent example for consistent attendance.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceStreak;
