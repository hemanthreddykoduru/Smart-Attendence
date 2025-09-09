import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Clock, RefreshCw } from 'lucide-react';

interface QRCodeGeneratorProps {
  sessionId: string;
  onExpired: (oldCode: string) => void; // send old code back
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ sessionId, onExpired }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [timeLeft, setTimeLeft] = useState(15);
  const [currentCode, setCurrentCode] = useState('');

  // Generate a fresh QR code
  const generateQR = async (data: string) => {
    try {
      const url = await QRCode.toDataURL(data, {
        width: 256,
        margin: 2,
        color: {
          dark: '#1F2937',
          light: '#FFFFFF',
        },
      });
      setQrCodeUrl(url);
      setCurrentCode(data);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  useEffect(() => {
    // Initial QR
    const initialCode = `${sessionId}-${Date.now()}`;
    generateQR(initialCode);
    setTimeLeft(15);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Notify parent that old QR expired
          onExpired(currentCode);

          // Generate new QR code
          const newCode = `${sessionId}-${Date.now()}`;
          generateQR(newCode);

          // Reset timer
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionId]); // regenerate if sessionId changes

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Attendance QR Code
        </h3>

        {qrCodeUrl && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-4">
            <img
              src={qrCodeUrl}
              alt="QR Code"
              className="mx-auto rounded-lg shadow-sm"
            />
          </div>
        )}

        <div className="flex items-center justify-center space-x-2 text-sm">
          <Clock className={`h-4 w-4 ${timeLeft <= 5 ? 'text-red-500' : 'text-blue-500'}`} />
          <span className={`font-medium ${timeLeft <= 5 ? 'text-red-600' : 'text-gray-700'}`}>
            Refreshing in: {formatTime(timeLeft)}
          </span>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            🔒 This QR code refreshes automatically every 15 seconds for enhanced security.  
            Students must scan quickly to mark their attendance before it expires.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
