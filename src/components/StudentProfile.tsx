import React, { useState, useEffect } from 'react';
import { User, Edit3, Mail, Hash, GraduationCap, Calendar } from 'lucide-react';
import { studentAPI } from '../services/api';
import toast from 'react-hot-toast';

const StudentProfile: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await studentAPI.getProfile();
      setProfile(response.data);
    } catch (error: any) {
      toast.error('Failed to load profile');
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
            <p className="text-sm text-gray-600">View your personal information</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed">
          <Edit3 className="h-4 w-4" />
          <span>Read Only</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-gray-900">{profile?.name}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="text-gray-900">{profile?.email}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Roll Number
            </label>
            <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg">
              <Hash className="h-4 w-4 text-gray-500" />
              <span className="text-gray-900">{profile?.roll_number}</span>
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch
            </label>
            <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg">
              <GraduationCap className="h-4 w-4 text-gray-500" />
              <span className="text-gray-900">{profile?.branch}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-gray-900">{profile?.year} Year</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Member Since
            </label>
            <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-gray-900">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <div className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5">ℹ️</div>
          <div>
            <p className="text-sm text-blue-800 font-medium">Profile Information</p>
            <p className="text-xs text-blue-700 mt-1">
              Your profile information is managed by the administration. 
              Contact your faculty or admin if you need to update any details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
