import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Group, UserType } from '../types';
import { storage } from '../services/storage';
import { Button } from '../components/Button';
import { IconUser, IconLogOut, IconUsers } from '../components/Icons';

// Extend window to satisfy TypeScript for the global library
declare global {
  interface Window {
    Html5QrcodeScanner: any;
    Html5Qrcode: any;
  }
}

export const Home: React.FC = () => {
  const { user, logout } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [globalRank, setGlobalRank] = useState<{ totalKnown: number, topPercent: number }>({ totalKnown: 0, topPercent: 0 });
  
  // My Groups Pagination & Search
  const [visibleGroupCount, setVisibleGroupCount] = useState(3);
  const [myGroupsFilter, setMyGroupsFilter] = useState('');
  
  // Search State (Premium)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Group[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Scanner State
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const scannerRef = useRef<any>(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setGroups(storage.getGroupsForUser(user.id));
      setGlobalRank(storage.getGlobalRanking(user.id));
    }
  }, [user]);

  // QR Scanner Effect
  useEffect(() => {
    if (showScanner && window.Html5Qrcode) {
        setScannerError('');
        
        // Cleanup previous instance if it exists (safety check)
        if (scannerRef.current) {
            try { scannerRef.current.clear(); } catch(e) {}
        }

        const html5QrCode = new window.Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        
        // Start scanning explicitly with environment (rear) camera
        html5QrCode.start(
            { facingMode: "environment" }, 
            config, 
            (decodedText: string) => {
                // Success Callback
                handleScanSuccess(decodedText);
            },
            (errorMessage: any) => {
                // Ignore frame parse errors
            }
        ).catch((err: any) => {
            console.error("Error starting scanner", err);
            setScannerError("Unable to access the rear camera. Please ensure you have granted camera permissions.");
        });

        return () => {
            if (scannerRef.current) {
                // We attempt to stop, but if it's not scanning it might throw, so we catch
                scannerRef.current.stop().then(() => {
                    scannerRef.current.clear();
                }).catch((e: any) => {
                    // If stop fails (e.g. wasn't scanning), just clear
                    try { scannerRef.current.clear(); } catch(ex) {}
                });
            }
        };
    }
  }, [showScanner]);

  const handleScanSuccess = (decodedText: string) => {
      let code = decodedText;
      try {
          const url = new URL(decodedText);
          const codeParam = url.searchParams.get("code");
          if (codeParam) code = codeParam;
      } catch (e) {
          // Not a URL, assume it is the code
      }
      
      const cleanCode = code.toUpperCase();
      setJoinCode(cleanCode);
      
      // Stop scanner
      if (scannerRef.current) {
           scannerRef.current.stop().then(() => {
               scannerRef.current.clear();
               setShowScanner(false);
               joinGroupById(storage.findGroupByCode(cleanCode)?.id);
           }).catch((e: any) => {
               console.error("Stop failed", e);
               setShowScanner(false);
           });
      } else {
          setShowScanner(false);
          joinGroupById(storage.findGroupByCode(cleanCode)?.id);
      }
  };

  const handleJoinGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const group = storage.findGroupByCode(joinCode);
    joinGroupById(group?.id);
  };

  const joinGroupById = (groupId?: string) => {
      if (!user) return;
      if (groupId) {
        const joined = storage.joinGroup(groupId, user.id);
        if (joined) {
            const group = storage.getGroupById(groupId);
            // Use functional update to ensure we have latest groups state
            if (group) setGroups(prev => [...prev, group]);
            setJoinCode('');
            setError('');
            setHasSearched(false);
            setSearchQuery('');
            setSearchResults([]);
        } else {
            setError('You are already in this group.');
        }
      } else {
        setError('Invalid Group or Code.');
      }
  }

  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchQuery.trim()) return;
      const results = storage.searchPublicGroups(searchQuery);
      setSearchResults(results);
      setHasSearched(true);
  };

  const getProgressColor = (percentage: number) => {
      if (percentage < 25) return 'bg-red-50 text-red-600';
      if (percentage < 75) return 'bg-yellow-50 text-yellow-700';
      return 'bg-green-50 text-green-700';
  }

  if (!user) return null;

  const isPremium = user.type === UserType.PREMIUM;

  // Logic for My Groups Display
  const filteredMyGroups = groups.filter(g => 
    g.name.toLowerCase().includes(myGroupsFilter.toLowerCase())
  );
  
  // Use slice to show only the visible count
  const displayedGroups = filteredMyGroups.slice(0, visibleGroupCount);
  const showSearchInMyGroups = groups.length > 6;

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md px-6 py-4 sticky top-0 z-20 border-b border-slate-100 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="relative">
                <img src={user.avatarUrl} alt={user.name} className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm" />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
                <h1 className="font-bold text-slate-900 leading-tight text-lg">{user.name}</h1>
                <p className="text-xs text-slate-500 font-medium">{isPremium ? 'Premium Member' : 'Standard Member'}</p>
            </div>
         </div>
         <div className="flex gap-1">
             <Link to="/profile">
                <Button variant="ghost" size="sm" className="w-10 h-10 p-0 rounded-full hover:bg-indigo-50 hover:text-indigo-600"><IconUser className="w-6 h-6" /></Button>
             </Link>
             <Button variant="ghost" size="sm" className="w-10 h-10 p-0 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500" onClick={logout}><IconLogOut className="w-6 h-6" /></Button>
         </div>
      </header>

      <main className="p-6 space-y-8 max-w-lg mx-auto">
        
        {/* Global Rankings Section - Compact */}
        <Link to="/my-network">
          <section className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 rounded-2xl shadow-lg shadow-indigo-500/20 text-white relative overflow-hidden transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
              {/* Decorative blur */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
              
              <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl shadow-inner">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-yellow-300">
                              <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                          </svg>
                      </div>
                      <div>
                          <h2 className="font-bold text-base">Your Ranking</h2>
                          <p className="text-indigo-100 text-xs font-medium opacity-90">You know {globalRank.totalKnown} people total</p>
                      </div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-bold border border-white/10 shadow-sm">
                      Top {globalRank.topPercent}%
                  </div>
              </div>
          </section>
        </Link>

        {/* My Groups Card */}
        <section className="bg-white p-6 rounded-[2rem] shadow-xl shadow-indigo-100/50 border border-slate-100/50">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">My Groups</h2>
            </div>

            {/* Search filter within My Groups (Visible only if total groups > 6) */}
            {showSearchInMyGroups && (
                <div className="mb-4">
                    <input 
                        type="text" 
                        placeholder="Filter your groups..." 
                        value={myGroupsFilter}
                        onChange={(e) => {
                            setMyGroupsFilter(e.target.value);
                            setVisibleGroupCount(3); // Reset expansion on search
                        }}
                        className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                </div>
            )}

            {groups.length === 0 ? (
                <div className="bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center flex flex-col items-center justify-center h-48">
                    <div className="text-4xl mb-3 opacity-30">👥</div>
                    <p className="text-slate-500 font-medium mb-1">No groups yet.</p>
                    <p className="text-xs text-slate-400">Join one below or create your own.</p>
                </div>
            ) : filteredMyGroups.length === 0 ? (
                <div className="text-center py-8 text-slate-400 italic text-sm">
                    No groups match your filter.
                </div>
            ) : (
                <div className="space-y-4">
                    {displayedGroups.map(group => {
                        const percentage = storage.getGroupProgress(group.id, user.id);
                        const memberCount = storage.getGroupMembers(group.id).length;
                        
                        return (
                            <Link key={group.id} to={`/group/${group.id}`} className="block transform transition-transform hover:scale-[1.02] active:scale-[0.98]">
                                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all group">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-bold text-lg text-slate-800 group-hover:text-indigo-600 transition-colors">{group.name}</h3>
                                        <span className="bg-slate-50 text-slate-600 text-[10px] uppercase tracking-wide px-2 py-1 rounded-lg font-bold border border-slate-100">
                                            {memberCount} Users
                                        </span>
                                    </div>
                                    <p className="text-slate-500 text-sm line-clamp-1 mb-4 leading-relaxed">{group.description}</p>
                                    <div className="space-y-2">
                                         <div className="flex justify-between items-center text-xs mb-1">
                                            <span className="font-medium text-slate-500">Progress</span>
                                            <span className={`font-bold ${percentage === 100 ? 'text-green-600' : 'text-slate-400'}`}>{percentage}%</span>
                                         </div>
                                         <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-500 ${percentage === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`} 
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                         </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}

                    {/* Show More Link */}
                    {visibleGroupCount < filteredMyGroups.length && (
                        <button 
                            onClick={() => setVisibleGroupCount(prev => prev + 3)}
                            className="w-full text-center text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wide py-3 hover:bg-indigo-50 rounded-xl transition-colors mt-2"
                        >
                            Show More Groups ({filteredMyGroups.length - visibleGroupCount} remaining)
                        </button>
                    )}
                </div>
            )}
        </section>

        {/* Join Group Section */}
        <section className="bg-white p-6 rounded-[2rem] shadow-xl shadow-indigo-100/50 border border-slate-100/50">
            <h2 className="font-bold text-xl text-slate-900 mb-2">Join a Group</h2>
            <p className="text-sm text-slate-500 mb-6">Enter the code or scan QR provided by admin.</p>
            <div className="flex flex-col gap-4">
                <form onSubmit={handleJoinGroup} className="flex gap-3">
                    <input 
                        type="text" 
                        placeholder="CODE"
                        className="flex-1 px-5 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-0 outline-none uppercase font-mono tracking-wider transition-all text-lg"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    />
                    <Button type="submit" className="shadow-none px-8">Join</Button>
                </form>
                <div className="relative py-2 flex items-center">
                    <div className="flex-grow border-t border-slate-100"></div>
                    <span className="flex-shrink-0 mx-4 text-slate-300 text-xs uppercase tracking-widest font-medium">OR</span>
                    <div className="flex-grow border-t border-slate-100"></div>
                </div>
                <Button 
                    type="button" 
                    variant="outline" 
                    fullWidth 
                    className="py-4 flex items-center justify-center gap-3 border-dashed border-slate-300 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30"
                    onClick={() => setShowScanner(true)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75z" />
                    </svg>
                    Scan QR Code
                </Button>
            </div>
            {error && <p className="text-red-500 text-sm mt-3 bg-red-50 p-3 rounded-xl text-center">{error}</p>}
        </section>

        {/* Create Group & Search (Premium Only) */}
             <section className="space-y-8">
                 {isPremium ? (
                     <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-[2rem] border border-indigo-100 relative">
                        <div className="flex items-center gap-1.5 absolute -top-3 -left-1 bg-white px-3 py-1 rounded-full shadow-sm border border-indigo-100">
                             {/* Star Icon */}
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-indigo-500">
                                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                             </svg>
                             <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Premium</span>
                         </div>
                        <h2 className="font-bold text-indigo-900 mb-4 flex items-center gap-2 text-lg pt-2">
                            <IconUsers className="w-5 h-5"/> Search Public Groups
                        </h2>
                        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                            <input 
                                type="text" 
                                placeholder="Search by name..."
                                className="flex-1 px-4 py-3 rounded-xl border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <Button type="submit" variant="secondary" className="px-6">Search</Button>
                        </form>

                        {hasSearched && (
                            <div className="space-y-2 animate-fade-in">
                                {searchResults.length === 0 ? (
                                    <p className="text-sm text-indigo-400 italic text-center py-4">No public groups found.</p>
                                ) : (
                                    searchResults.map(group => {
                                        const isMember = groups.some(g => g.id === group.id);
                                        return (
                                            <div key={group.id} className="bg-white p-4 rounded-xl flex items-center justify-between shadow-sm border border-indigo-50">
                                                <div className="overflow-hidden mr-3">
                                                    <div className="font-bold text-slate-800 truncate">{group.name}</div>
                                                    <div className="text-xs text-slate-500 truncate">{group.description}</div>
                                                </div>
                                                {isMember ? (
                                                    <span className="text-xs text-green-600 font-bold bg-green-50 px-3 py-1.5 rounded-lg">Joined</span>
                                                ) : (
                                                    <button 
                                                        onClick={() => joinGroupById(group.id)}
                                                        className="text-xs bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg font-bold hover:bg-indigo-200 transition-colors"
                                                    >
                                                        Join
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                     </div>
                 ) : (
                    <div>
                        <div className="flex items-center gap-1 mb-1 ml-1">
                             <div className="flex items-center gap-1.5">
                                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-pink-500">
                                    <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                                 </svg>
                                 <span className="text-[10px] font-bold text-pink-500 uppercase tracking-wider">Premium</span>
                             </div>
                        </div>
                        <div className="opacity-50 pointer-events-none select-none bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
                            <h2 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-lg">
                                <IconUsers className="w-5 h-5"/> Search Public Groups
                            </h2>
                            <div className="flex gap-2">
                                <input type="text" className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm" disabled placeholder="Search by name..." />
                                <Button disabled variant="secondary" className="px-6 grayscale">Search</Button>
                            </div>
                        </div>
                    </div>
                 )}

                 {isPremium ? (
                     <div className="relative mt-8">
                         <div className="flex items-center gap-1.5 absolute -top-3 -left-1 bg-white px-3 py-1 rounded-full shadow-sm border border-indigo-100 z-10">
                             {/* Star Icon */}
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-indigo-500">
                                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                             </svg>
                             <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Premium</span>
                         </div>
                         <Button fullWidth variant="outline" className="py-6 text-lg border-dashed border-2" onClick={() => navigate('/create-group')}>
                            + Create New Group
                         </Button>
                     </div>
                 ) : (
                    <div className="mt-8">
                        <div className="flex items-center gap-1 mb-1 ml-1">
                             <div className="flex items-center gap-1.5">
                                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-pink-500">
                                    <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                                 </svg>
                                 <span className="text-[10px] font-bold text-pink-500 uppercase tracking-wider">Premium</span>
                             </div>
                        </div>
                        <Button fullWidth variant="outline" disabled className="opacity-50 !bg-white !text-slate-400 border-slate-200 py-5 text-lg">
                            + Create New Group
                        </Button>
                    </div>
                 )}
             </section>

        {/* Scanner Modal */}
        {showScanner && (
            <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
                <div className="bg-white rounded-3xl p-6 w-full max-w-md relative shadow-2xl">
                    <h2 className="font-bold text-center mb-6 text-xl text-slate-800">Scan Join Code</h2>
                    
                    {scannerError ? (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center mb-4 border border-red-100">
                            <p className="font-bold mb-2 text-lg">Camera Error</p>
                            <p className="text-sm leading-relaxed">{scannerError}</p>
                            <div className="mt-4 text-xs text-red-500 bg-white/50 p-2 rounded">
                                Tip: If denied, please enable camera access in your browser settings.
                            </div>
                        </div>
                    ) : (
                        <div id="reader" className="w-full h-80 bg-black rounded-2xl overflow-hidden shadow-inner border border-slate-100 relative"></div>
                    )}

                    <p className="text-center text-xs text-slate-500 mt-4 px-4">
                        Point your camera at a Group QR Code to join automatically.
                    </p>
                    <Button fullWidth variant="secondary" className="mt-4 py-3" onClick={() => setShowScanner(false)}>
                        Close Scanner
                    </Button>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};