import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { ProfileCard } from '../types';
import { storage } from '../services/storage';
import { Button } from '../components/Button';
import { IconArrowLeft, IconMicrophone, IconCamera, IconUser, IconSwitchCamera, IconX, IconLogOut } from '../components/Icons';
import { DeckCard } from '../components/DeckCard';

export const MyProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileCard | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  
  // Preview State
  const [showPreview, setShowPreview] = useState(false);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  
  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Form States
  const [fullName, setFullName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [nationality, setNationality] = useState('');
  const [shortBio, setShortBio] = useState('');
  const [funFact, setFunFact] = useState('');
  const [links, setLinks] = useState(''); // comma separated for input
  const [pronunciationUrl, setPronunciationUrl] = useState('');
  
  // Password Change States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  // Dirty Checking & Success State
  const [isDirty, setIsDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  // File Inputs
  const galleryInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (user) {
      const p = storage.getProfileByUserId(user.id);
      if (p) {
        setProfile(p);
        setFullName(p.fullName);
        setPhotoUrl(p.photoUrl);
        setNationality(p.nationality || '');
        setShortBio(p.shortBio || '');
        setFunFact(p.funFact || '');
        setLinks(p.links?.join(', ') || '');
        setPronunciationUrl(p.pronunciationAudioUrl || '');
        setIsDirty(false);
      }
    }
  }, [user]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
        stopCameraStream();
    };
  }, []);

  // Helper to handle change and set dirty
  const handleChange = (setter: (val: string) => void, val: string) => {
      setter(val);
      setIsDirty(true);
      setSaveSuccess(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setIsSaving(true);
    const updatedProfile: ProfileCard = {
        ...profile,
        fullName,
        photoUrl,
        nationality,
        shortBio,
        funFact,
        links: links.split(',').map(s => s.trim()).filter(s => s.length > 0),
        pronunciationAudioUrl: pronunciationUrl
    };
    
    storage.updateProfile(updatedProfile);

    // Handle password update
    if (newPassword && newPassword === confirmPassword) {
        storage.updatePassword(user.id, newPassword);
        setPasswordMessage('Password updated!');
        setNewPassword('');
        setConfirmPassword('');
    } else if (newPassword) {
        setPasswordMessage('Passwords do not match!');
        setIsSaving(false);
        return;
    }

    setTimeout(() => {
        setIsSaving(false);
        setIsDirty(false);
        setSaveSuccess(true);
        setPasswordMessage('');
        setTimeout(() => setSaveSuccess(false), 3000);
    }, 1500); // Increased duration slightly to show saving state clearly
  };

  const toggleRecording = async () => {
      if (isRecording) {
          // Stop Recording
          mediaRecorderRef.current?.stop();
          setIsRecording(false);
      } else {
          // Start Recording
          try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              const recorder = new MediaRecorder(stream);
              const chunks: BlobPart[] = [];

              recorder.ondataavailable = (e) => {
                  if (e.data.size > 0) chunks.push(e.data);
              };

              recorder.onstop = () => {
                  const blob = new Blob(chunks, { type: 'audio/webm' });
                  const reader = new FileReader();
                  reader.onloadend = () => {
                      const result = reader.result as string;
                      handleChange(setPronunciationUrl, result);
                  };
                  reader.readAsDataURL(blob);
                  
                  // Stop all tracks to release microphone
                  stream.getTracks().forEach(track => track.stop());
              };

              recorder.start();
              mediaRecorderRef.current = recorder;
              setIsRecording(true);
          } catch (err) {
              console.error("Error accessing microphone:", err);
              alert("Could not access microphone. Please ensure permissions are granted.");
          }
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              handleChange(setPhotoUrl, reader.result as string);
              setShowPhotoOptions(false); // Close modal
          };
          reader.readAsDataURL(file);
      }
  };

  // Camera Functions
  const openCamera = () => {
      setShowPhotoOptions(false);
      setIsCameraOpen(true);
  };

  const stopCameraStream = () => {
      if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
      }
  };

  const closeCamera = () => {
      stopCameraStream();
      setIsCameraOpen(false);
  };

  const switchCamera = () => {
      setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const capturePhoto = () => {
      if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          // Set canvas dimensions to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
              // Flip if user mode (mirror effect)
              if (facingMode === 'user') {
                  ctx.translate(canvas.width, 0);
                  ctx.scale(-1, 1);
              }
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
              handleChange(setPhotoUrl, dataUrl);
              closeCamera();
          }
      }
  };

  useEffect(() => {
    if (isCameraOpen) {
        const startStream = async () => {
            stopCameraStream(); // Ensure previous stream is stopped
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: facingMode }
                });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (e) {
                console.error("Camera error:", e);
                alert("Could not access camera. Please ensure permissions are granted.");
                setIsCameraOpen(false);
            }
        };
        startStream();
    }
  }, [isCameraOpen, facingMode]);

  const handleLogout = () => {
      logout();
  };


  if (!user || !profile) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
       <header className="bg-white px-6 py-4 shadow-sm sticky top-0 z-10 flex items-center gap-4">
         <Link to="/" className="text-slate-500 hover:text-slate-800"><IconArrowLeft className="w-6 h-6"/></Link>
         <h1 className="font-bold text-lg">Edit Profile Card</h1>
       </header>

       <main className="p-6 max-w-xl mx-auto pb-20">
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* Photo Upload Section */}
            <div className="flex flex-col items-center">
                <div className="relative group cursor-pointer" onClick={() => setShowPhotoOptions(true)}>
                    <img 
                        src={photoUrl} 
                        alt="Preview" 
                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg group-hover:opacity-75 transition-opacity" 
                    />
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                         <IconCamera className="w-8 h-8 text-white" />
                    </div>
                </div>
                <button type="button" onClick={() => setShowPhotoOptions(true)} className="text-xs text-primary font-medium mt-2 hover:underline">
                    Change Photo
                </button>

                {/* Preview Link */}
                <button 
                    type="button" 
                    onClick={() => {
                        setIsPreviewExpanded(false);
                        setShowPreview(true);
                    }}
                    className="text-xs text-indigo-600 font-medium mt-1 hover:underline"
                >
                    Preview Card
                </button>

                {/* Hidden Input for Gallery */}
                <input 
                    type="file" 
                    ref={galleryInputRef} 
                    onChange={handleImageUpload} 
                    className="hidden" 
                    accept="image/*"
                />
            </div>

            <div className="space-y-4">
                <div>
                    <label className="label-text">Full Name</label>
                    <input type="text" className="input-field" value={fullName} onChange={e => handleChange(setFullName, e.target.value)} required />
                </div>
                
                <div>
                    <label className="label-text">Country</label>
                    <input type="text" className="input-field" value={nationality} onChange={e => handleChange(setNationality, e.target.value)} placeholder="e.g. UK, US, JP" />
                </div>

                <div>
                    <label className="label-text">Photo URL (Or use upload above)</label>
                    <input type="text" className="input-field" value={photoUrl} onChange={e => handleChange(setPhotoUrl, e.target.value)} placeholder="https://..." />
                </div>

                 <div>
                    <label className="label-text">Pronunciation (Record Audio or Paste URL)</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            className="input-field" 
                            value={pronunciationUrl} 
                            onChange={e => handleChange(setPronunciationUrl, e.target.value)} 
                            placeholder="https://... or Record" 
                        />
                        <button 
                            type="button" 
                            onClick={toggleRecording}
                            className={`p-2 rounded-xl transition-colors ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                            title={isRecording ? "Stop Recording" : "Start Recording"}
                        >
                             <IconMicrophone className="w-6 h-6" />
                        </button>
                    </div>
                    {isRecording && <p className="text-xs text-red-500 mt-1">Recording... Tap mic to stop.</p>}
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-700">Personality</h3>
                    </div>
                    
                    <div>
                        <label className="label-text">Fun Fact</label>
                        <textarea className="input-field h-20 py-2" value={funFact} onChange={e => handleChange(setFunFact, e.target.value)} placeholder="I've climbed Mt. Everest..." />
                    </div>

                    <div>
                        <label className="label-text">Short Bio</label>
                        <textarea className="input-field h-24 py-2" value={shortBio} onChange={e => handleChange(setShortBio, e.target.value)} placeholder="Tell us a bit about yourself..." />
                    </div>
                </div>

                <div>
                    <label className="label-text">Links (comma separated)</label>
                    <input type="text" className="input-field" value={links} onChange={e => handleChange(setLinks, e.target.value)} placeholder="linkedin.com/in/me, twitter.com/me" />
                </div>
                
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-700">Change Password</h3>
                    <div>
                        <label className="label-text">New Password</label>
                        <input 
                            type="password" 
                            className="input-field" 
                            value={newPassword} 
                            onChange={e => { setNewPassword(e.target.value); setIsDirty(true); }} 
                            placeholder="••••••••" 
                        />
                    </div>
                    <div>
                        <label className="label-text">Confirm Password</label>
                        <input 
                            type="password" 
                            className="input-field" 
                            value={confirmPassword} 
                            onChange={e => { setConfirmPassword(e.target.value); setIsDirty(true); }} 
                            placeholder="••••••••" 
                        />
                    </div>
                    {passwordMessage && <p className={`text-sm ${passwordMessage.includes('match') ? 'text-red-500' : 'text-green-500'}`}>{passwordMessage}</p>}
                </div>
            </div>

            <Button 
                type="submit" 
                fullWidth 
                size="lg" 
                isLoading={isSaving}
                disabled={!isDirty && !isSaving && !saveSuccess}
                variant={isSaving ? 'secondary' : 'primary'}
                className={`transition-all duration-500 ${
                    saveSuccess 
                    ? "!bg-gradient-to-r !from-emerald-500 !to-green-500 !shadow-lg !shadow-green-500/30 !text-white !border-transparent" 
                    : ""
                }`}
            >
                {saveSuccess ? 'Changes Saved' : (isSaving ? 'Saving...' : 'Save Profile')}
            </Button>
            
            {/* Logout Button */}
            <div className="pt-6 text-center border-t border-slate-100 mt-8 flex justify-center">
                <button 
                    type="button" 
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-medium hover:bg-slate-50 hover:text-slate-800 transition-all"
                >
                    <IconLogOut className="w-4 h-4" />
                    Log Out
                </button>
            </div>

          </form>
       </main>

       {/* Photo Options Modal */}
       {showPhotoOptions && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={() => setShowPhotoOptions(false)}>
               <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center space-y-6" onClick={e => e.stopPropagation()}>
                   <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 border-4 border-white shadow-sm">
                        <div className="relative">
                             <IconUser className="w-10 h-10" />
                             <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-slate-300 rounded-tr-sm"></div>
                             <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-slate-300 rounded-tl-sm"></div>
                             <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-slate-300 rounded-br-sm"></div>
                             <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-slate-300 rounded-bl-sm"></div>
                        </div>
                   </div>
                   <div>
                       <h3 className="text-xl font-bold text-slate-800">A photo of you</h3>
                       <p className="text-slate-500 mt-2 text-sm">Please make sure your photo clearly shows your face.</p>
                   </div>
                   <div className="space-y-3 pt-2">
                       <Button fullWidth variant="primary" onClick={openCamera}>
                           Take photo
                       </Button>
                       <Button fullWidth variant="secondary" onClick={() => galleryInputRef.current?.click()}>
                           Choose from camera roll
                       </Button>
                   </div>
               </div>
           </div>
       )}
       
       {/* Full Screen Camera View */}
       {isCameraOpen && (
            <div className="fixed inset-0 z-[60] bg-black flex flex-col">
                <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                     <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} 
                     />
                     <button onClick={closeCamera} className="absolute top-4 left-4 p-2 bg-black/50 rounded-full text-white">
                        <IconX className="w-6 h-6" />
                     </button>
                </div>
                <div className="h-32 bg-black flex items-center justify-around px-6 pb-safe">
                    <button onClick={switchCamera} className="p-3 rounded-full bg-slate-800 text-white">
                         <IconSwitchCamera className="w-6 h-6" />
                    </button>
                    <button onClick={capturePhoto} className="w-16 h-16 rounded-full bg-white border-4 border-slate-300 flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all">
                         <div className="w-14 h-14 rounded-full bg-white border-2 border-black"></div>
                    </button>
                    <div className="w-12"></div> {/* Spacer for balance */}
                </div>
                <canvas ref={canvasRef} className="hidden" />
            </div>
       )}

       {/* Card Preview Modal */}
       {showPreview && profile && (
           <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowPreview(false)}>
               <div className="relative w-full max-w-md h-[90vh] flex items-center" onClick={e => e.stopPropagation()}>
                    <button 
                        onClick={() => setShowPreview(false)}
                        className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors bg-white/10 p-2 rounded-full"
                    >
                        <IconX className="w-6 h-6" />
                    </button>
                    <div className="w-full overflow-y-auto no-scrollbar h-full rounded-[2.5rem]">
                        <DeckCard 
                            profile={{
                                ...profile,
                                fullName: fullName || profile.fullName,
                                photoUrl: photoUrl || profile.photoUrl,
                                nationality: nationality,
                                shortBio: shortBio,
                                funFact: funFact,
                                links: links.split(',').map(l => l.trim()).filter(Boolean),
                                pronunciationAudioUrl: pronunciationUrl
                            }}
                            isExpanded={isPreviewExpanded}
                            onToggleExpand={() => setIsPreviewExpanded(!isPreviewExpanded)}
                        />
                    </div>
               </div>
           </div>
       )}
       
       <style>{`
         .label-text { display: block; font-size: 0.875rem; font-weight: 500; color: #475569; margin-bottom: 0.25rem; }
         .input-field { width: 100%; padding: 0.5rem 1rem; border-radius: 0.75rem; border: 1px solid #cbd5e1; outline: none; transition: all; }
         .input-field:focus { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2); }
         .animate-fade-in { animation: fadeIn 0.2s ease-out; }
         @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
       `}</style>
    </div>
  );
};