import React, { useState } from 'react';
import { ProfileCard } from '../types';
import { IconMicrophone } from './Icons';

interface DeckCardProps {
  profile: ProfileCard;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const DeckCard: React.FC<DeckCardProps> = ({ profile, isExpanded, onToggleExpand }) => {
  const [audioPlaying, setAudioPlaying] = useState(false);

  const playAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profile.pronunciationAudioUrl) return;
    
    setAudioPlaying(true);
    
    try {
        const audio = new Audio(profile.pronunciationAudioUrl);
        audio.onended = () => setAudioPlaying(false);
        audio.onerror = () => setAudioPlaying(false);
        audio.play().catch(err => {
            console.error("Playback failed", err);
            setAudioPlaying(false);
        });
    } catch (err) {
        console.error("Audio init failed", err);
        setAudioPlaying(false);
    }
  };

  const getLinkLabel = (url: string) => {
      if (url.includes('linkedin')) return 'LinkedIn';
      if (url.includes('twitter') || url.includes('x.com')) return 'Twitter';
      if (url.includes('instagram')) return 'Instagram';
      if (url.includes('facebook')) return 'Facebook';
      if (url.includes('github')) return 'GitHub';
      return 'Website';
  };

  return (
    <div 
      onClick={onToggleExpand}
      className={`relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-900/10 overflow-hidden transition-all duration-500 cursor-pointer border border-white/50 ${isExpanded ? 'h-auto min-h-[600px]' : 'h-[65vh] sm:h-[550px]'}`}
    >
      {/* Image Section */}
      <div className={`relative ${isExpanded ? 'h-72' : 'h-full'} w-full bg-slate-200 transition-all duration-500`}>
        <img 
          src={profile.photoUrl} 
          alt="Profile" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent pointer-events-none opacity-90" />
        
        {!isExpanded ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-full mb-4 shadow-lg animate-bounce">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                 </div>
                 <span className="text-white font-bold tracking-widest uppercase text-sm drop-shadow-md border border-white/30 px-4 py-2 rounded-full backdrop-blur-md bg-black/20">Tap to Reveal</span>
            </div>
        ) : (
            <div className="absolute bottom-0 left-0 p-8 text-white w-full animate-fade-in">
              <h2 className="text-4xl font-bold tracking-tight drop-shadow-md">{profile.fullName.split(' ')[0]}</h2>
              <p className="text-lg font-light opacity-90 mb-2 drop-shadow-sm">{profile.fullName}</p>
              {profile.nationality && (
                <span className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wide border border-white/10">
                  {profile.nationality}
                </span>
              )}
            </div>
        )}
      </div>

      {/* Details Section */}
      {isExpanded && (
        <div className="p-8 space-y-6 bg-white relative z-10 animate-fade-in">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                {profile.pronunciationAudioUrl && (
                   <button 
                    onClick={playAudio}
                    className={`p-3 rounded-full transition-all shadow-sm ${audioPlaying ? 'bg-green-500 text-white scale-110' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:scale-105'}`}
                    title="Play Pronunciation"
                   >
                     <IconMicrophone className="w-5 h-5" />
                   </button>
                )}
                {profile.phoneticText && (
                    <span className="text-slate-400 italic text-base font-serif">/{profile.phoneticText}/</span>
                )}
               </div>
            </div>

            <div className="space-y-6 pt-2">
                {profile.shortBio && (
                    <div>
                        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">About</h3>
                        <p className="text-slate-600 leading-relaxed text-base">{profile.shortBio}</p>
                    </div>
                )}
                
                {profile.funFact && (
                    <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100/50 relative overflow-hidden">
                        <div className="absolute -top-2 -right-2 text-5xl opacity-10 rotate-12">💡</div>
                        <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-2">Fun Fact</h3>
                        <p className="text-amber-900/80 italic text-base font-medium relative z-10">"{profile.funFact}"</p>
                    </div>
                )}

                {profile.links && profile.links.length > 0 && (
                    <div className="pt-4 border-t border-slate-50">
                         <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-4">Connect</h3>
                         <div className="flex flex-wrap gap-3">
                            {profile.links.map((link, idx) => {
                                const label = getLinkLabel(link);
                                const href = link.startsWith('http') ? link : `https://${link}`;
                                return (
                                    <a 
                                        key={idx} 
                                        href={href} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center gap-2 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 px-4 py-2.5 rounded-xl transition-colors text-sm font-semibold border border-indigo-100/50"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                                        </svg>
                                        {label}
                                    </a>
                                );
                            })}
                         </div>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};