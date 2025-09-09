import React, { useState } from 'react';
import { Camera, CheckCircle, AlertCircle, QrCode } from 'lucide-react';
import { studentAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const QRScanner: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const { user } = useAuthStore();

  const handleScanResult = async (sessionId: string) => {
    try {
      const response = await studentAPI.markAttendance(sessionId);
      toast.success(response.data.message);
      setManualCode('');
      setScanning(false);
    } catch (error: any) {
      console.error('Error marking attendance:', error);
      toast.error(error.response?.data?.error || 'Failed to mark attendance');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleScanResult(manualCode.trim());
    }
  };

  // Note: In a real implementation, you would integrate with a camera library
  // For this demo, we'll use manual input
  const startScanning = () => {
    setScanning(true);
    toast('Camera scanning would open here. Please use manual input below.', {
      icon: '📷',
    });
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
      <div className="text-center mb-6">
        <QrCode className="h-12 w-12 text-blue-600 mx-auto mb-3" />
        <h2 className="text-xl font-semibold text-gray-900">
          Scan Attendance QR
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          Scan the QR code displayed by your instructor
        </p>
      </div>

      {/* Camera Scanner Button */}
      <div className="mb-6">
        <button
          onClick={startScanning}
          disabled={scanning}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
        >
          <Camera className="h-5 w-5" />
          <span>{scanning ? 'Scanning...' : 'Open Camera Scanner'}</span>
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or enter manually</span>
        </div>
      </div>

      {/* Manual Input */}
      <form onSubmit={handleManualSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Session Code
          </label>
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Enter session code manually"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={!manualCode.trim()}
          className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
        >
          <CheckCircle className="h-4 w-4" />
          <span>Mark Attendance</span>
        </button>
      </form>

      <div className="mt-6 p-4 bg-amber-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-800 font-medium">Important:</p>
            <ul className="text-xs text-amber-700 mt-1 space-y-1">
              <li>• QR codes expire after 15 seconds</li>
              <li>• You can only mark attendance once per session</li>
              <li>• Make sure you're in the correct class</li>
              <li>• Scan quickly before the code refreshes!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;