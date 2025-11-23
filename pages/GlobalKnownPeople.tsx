import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import { storage } from '../services/storage';
import { ProfileCard } from '../types';
import { Button } from '../components/Button';
import { IconArrowLeft, IconCheck, IconUsers } from '../components/Icons';

export const GlobalKnownPeople: React.FC = () => {
  const { user } = useAuth();
  const [knownProfiles, setKnownProfiles] = useState<ProfileCard[]>([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (user) {
        const allKnown = storage.getAllKnownProfiles(user.id);
        setKnownProfiles(allKnown);
    }
  }, [user]);

  const displayedProfiles = knownProfiles.slice(0, visibleCount);
  const hasMore = visibleCount < knownProfiles.length;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white px-6 py-4 shadow-sm sticky top-0 z-10 flex items-center gap-4">
         <Link to="/" className="text-slate-500 hover:text-slate-800"><IconArrowLeft className="w-6 h-6"/></Link>
         <h1 className="font-bold text-lg">My Network</h1>
      </header>

      <main className="p-6 max-w-3xl mx-auto">
         {/* Summary Counter Card */}
         <div className="bg-white p-8 rounded-[1.5rem] shadow-sm border border-slate-100 mb-8 flex flex-col justify-center">
            <h2 className="text-6xl font-extrabold text-slate-900 mb-2 tracking-tight leading-none">
                {knownProfiles.length}
            </h2>
            <p className="text-slate-400 text-xs uppercase tracking-[0.15em] font-bold">Known Total</p>
         </div>

         {/* Known Members Header & Toggle */}
         <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-slate-900 flex items-center gap-2 text-xl">
                <IconUsers className="w-6 h-6 text-indigo-500" /> Known Members <span className="text-slate-400 text-lg font-normal">({knownProfiles.length})</span>
            </h2>
            <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                    </svg>
                </button>
                <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                </button>
            </div>
         </div>

        {knownProfiles.length === 0 ? (
            <div className="text-center mt-12 opacity-60">
                <p className="text-slate-500 font-medium">You haven't marked anyone as known yet.</p>
                <Link to="/" className="text-indigo-600 font-bold hover:underline mt-2 inline-block">Go learn some names</Link>
            </div>
        ) : (
            <>
                {viewMode === 'grid' ? (
                    /* GRID VIEW */
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-6 animate-fade-in">
                        {displayedProfiles.map(profile => (
                            <div key={profile.id} className="flex flex-col items-center gap-2 group cursor-pointer">
                                <div className="relative">
                                    <img 
                                        src={profile.photoUrl} 
                                        alt={profile.fullName} 
                                        className="w-16 h-16 rounded-2xl object-cover shadow-sm transition-transform group-hover:scale-105 border border-slate-100" 
                                    />
                                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-white">
                                        <IconCheck className="w-2 h-2 text-white" />
                                    </div>
                                </div>
                                <span className="text-sm font-medium text-slate-700 text-center truncate w-full">
                                    {profile.fullName.split(' ')[0]}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* LIST VIEW */
                    <div className="space-y-3 animate-fade-in">
                        {displayedProfiles.map(profile => (
                             <div key={profile.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow group">
                                <img 
                                    src={profile.photoUrl} 
                                    alt={profile.fullName} 
                                    className="w-12 h-12 rounded-full object-cover bg-slate-200 border border-slate-100" 
                                />
                                <div className="overflow-hidden flex-1 min-w-0">
                                    <h3 className="font-bold text-slate-900 truncate text-base leading-tight mb-0.5">{profile.fullName}</h3>
                                    <p className="text-xs text-slate-500 truncate font-medium">
                                        {profile.nationality || 'Global Citizen'}
                                    </p>
                                </div>
                                <span className="inline-flex items-center gap-1 text-[10px] text-green-700 bg-green-50 px-2 py-1 rounded-md font-bold uppercase tracking-wide border border-green-100">
                                    <IconCheck className="w-3 h-3" /> Known
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {hasMore && (
                    <div className="text-center pt-8 pb-10">
                         <Button variant="secondary" onClick={() => setVisibleCount(prev => prev + 10)} className="w-full sm:w-auto shadow-none bg-slate-200 text-slate-700 hover:bg-slate-300">
                            Show More ({knownProfiles.length - visibleCount})
                         </Button>
                    </div>
                )}
            </>
        )}
      </main>
      <style>{`
         .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; transform: translateY(10px); }
         @keyframes fadeIn { to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};
