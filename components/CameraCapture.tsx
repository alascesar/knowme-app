import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, CheckCircle } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    setError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Prefer back camera on mobile
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Unable to access camera. Please ensure permissions are granted.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      <div className="absolute top-4 right-4 z-50">
        <button onClick={onClose} className="p-2 bg-gray-800/50 rounded-full text-white">
          <X size={24} />
        </button>
      </div>

      {error ? (
        <div className="text-white text-center p-6">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 rounded-lg"
          >
            Close Camera
          </button>
        </div>
      ) : capturedImage ? (
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-black">
          <img 
            src={capturedImage} 
            alt="Captured" 
            className="max-h-[80vh] max-w-full object-contain" 
          />
          <div className="absolute bottom-10 flex gap-6">
            <button 
              onClick={handleRetake}
              className="flex items-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-full font-medium"
            >
              <RefreshCw size={20} /> Retake
            </button>
            <button 
              onClick={handleConfirm}
              className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-full font-medium"
            >
              <CheckCircle size={20} /> Use Photo
            </button>
          </div>
        </div>
      ) : (
        <div className="relative w-full h-full flex flex-col items-center bg-black">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-10 w-full flex justify-center">
            <button 
              onClick={handleCapture}
              className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              <div className="w-16 h-16 bg-white border-2 border-black rounded-full" />
            </button>
          </div>
        </div>
      )}
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};