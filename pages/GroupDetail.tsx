import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../App';
import { storage } from '../services/storage';
import { Group, User, UserType } from '../types';
import { Button } from '../components/Button';
import { IconArrowLeft, IconUsers, IconCheck, IconShare, IconClipboard, IconPencil, IconX } from '../components/Icons';

export const GroupDetail: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | undefined>(undefined);
  const [members, setMembers] = useState<User[]>([]);
  const [visibleMembers, setVisibleMembers] = useState<User[]>([]);
  const [copied, setCopied] = useState(false);
  const [inviteEmails, setInviteEmails] = useState('');
  const [invitesSent, setInvitesSent] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  
  useEffect(() => {
      if (groupId && user) {
          const g = storage.getGroupById(groupId);
          setGroup(g);
          
          if (g) {
              setEditName(g.name);
              setEditDesc(g.description);
          }
          
          const allMembers = storage.getGroupMembers(groupId);
          setMembers(allMembers);

          // Filtering Logic
          if (g && g.createdByUserId === user.id) {
              // Creator sees everyone
              setVisibleMembers(allMembers);
          } else {
              // Regular members see themselves + known people
              const deck = storage.getDeckForGroup(groupId, user.id);
              const knownUserIds = deck
                  .filter(item => item.status && item.status.isKnown)
                  .map(item => item.card.userId);
              
              const filtered = allMembers.filter(m => m.id === user.id || knownUserIds.includes(m.id));
              setVisibleMembers(filtered);
          }
      }
  }, [groupId, user]);

  const handleShare = async () => {
    if (!group) return;

    const shareData = {
        title: `Join ${group.name} on KnowMe App`,
        text: `Hey! Join the group "${group.name}" on KnowMe App to learn everyone's names. Use code: ${group.joinCode}`,
        url: window.location.origin 
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (err) {
            console.log("Share canceled");
        }
    } else {
        // Fallback to clipboard
        try {
            await navigator.clipboard.writeText(`${window.location.origin}?code=${group.joinCode}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy", err);
        }
    }
  };

  const handleBulkInvite = (e: React.FormEvent) => {
      e.preventDefault();
      if(!groupId || !inviteEmails) return;

      const emails = inviteEmails.split(',').map(e => e.trim()).filter(e => e.includes('@'));
      if(emails.length > 0) {
          storage.inviteUsers(groupId, emails);
          setInvitesSent(true);
          setInviteEmails('');
          setTimeout(() => setInvitesSent(false), 3000);
      }
  };

  const handleUpdateGroup = (e: React.FormEvent) => {
      e.preventDefault();
      if (!group) return;
      
      try {
          const updated = storage.updateGroup(group.id, { name: editName, description: editDesc });
          setGroup(updated);
          setIsEditing(false);
      } catch (err) {
          console.error("Failed to update group", err);
      }
  };

  if (!group || !user) return <div className="p-6 text-center text-slate-500 mt-10">Loading group info...</div>;

  const isCreator = group.createdByUserId === user.id;
  const joinLink = `${window.location.origin}?code=${group.joinCode}`;
  const isPremium = user.type === UserType.PREMIUM;

  return (
    <div className="min-h-screen bg-indigo-950">
       {/* Header with Gradient */}
       <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white pb-16">
         <header className="px-6 py-4 flex items-center gap-4 sticky top-0 z-20 backdrop-blur-sm bg-indigo-900/20">
            <Link to="/" className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"><IconArrowLeft className="w-6 h-6"/></Link>
            <span className="font-medium opacity-80 text-sm tracking-wide uppercase">Group Details</span>
         </header>
         
         <div className="px-6 pt-4 pb-8 max-w-lg mx-auto">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-4xl font-bold mb-3 tracking-tight text-white flex items-center gap-2">
                        {group.name}
                    </h1>
                </div>
                {isCreator && (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        title="Edit Group Details"
                    >
                        <IconPencil className="w-5 h-5" />
                    </button>
                )}
            </div>
            <p className="text-indigo-200 leading-relaxed text-lg font-light">{group.description}</p>
         </div>
       </div>

       {/* Main Content - Overlapping Card */}
       <main className="bg-slate-50 rounded-t-[2.5rem] -mt-10 min-h-[calc(100vh-220px)] p-6 space-y-8 relative z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] max-w-lg mx-auto">
          
          {/* Actions Card */}
          <div className="bg-white p-6 rounded-3xl shadow-xl shadow-indigo-100/50 border border-slate-100 space-y-4 -mt-20 mb-8">
             <Link to={`/group/${groupId}/deck`}>
                <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-lg shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:scale-[1.01] transition-all active:scale-[0.99]">
                    Start Learning Names
                </button>
             </Link>
          </div>

          {/* Invite / Share Card (Premium Only) */}
          {isPremium && (
              <div className="bg-white rounded-3xl shadow-lg shadow-indigo-100/30 border border-slate-100 p-6">
                 <h2 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-lg">
                    <IconShare className="w-5 h-5 text-pink-500"/> Invite Members
                 </h2>
                 
                 <div className="flex flex-col sm:flex-row items-center gap-6">
                     {/* QR Code */}
                     <div className="shrink-0 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                         <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(joinLink)}`} 
                            alt="Group QR Code" 
                            className="w-24 h-24"
                         />
                         <p className="text-[10px] text-center mt-2 text-slate-400 font-medium uppercase tracking-wider">Scan to Join</p>
                     </div>
                     
                     {/* Code Info */}
                     <div className="flex-1 w-full space-y-3">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                             <div>
                                <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Join Code</span>
                                <span className="text-2xl font-mono font-bold text-slate-800 tracking-wider">{group.joinCode}</span>
                             </div>
                             <button onClick={handleShare} className="text-indigo-600 hover:text-indigo-700 p-2 hover:bg-indigo-50 rounded-lg transition-colors">
                                 {copied ? <IconCheck className="w-6 h-6 text-green-500" /> : <IconClipboard className="w-6 h-6" />}
                             </button>
                        </div>
                        <Button variant="secondary" size="sm" fullWidth onClick={handleShare} className="py-3">
                            Share Invite Link
                        </Button>
                     </div>
                 </div>

                 {/* Admin Bulk Invite */}
                 {isCreator && (
                     <div className="mt-6 pt-6 border-t border-slate-100">
                         <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Admin: Invite by Email</h3>
                         <form onSubmit={handleBulkInvite}>
                             <textarea 
                                className="w-full p-4 text-sm border border-slate-200 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none mb-3 h-24 transition-all placeholder:text-slate-400"
                                placeholder="Paste email addresses separated by commas..."
                                value={inviteEmails}
                                onChange={e => setInviteEmails(e.target.value)}
                             />
                             <Button type="submit" variant="outline" size="sm" fullWidth disabled={!inviteEmails} className="py-3">
                                 {invitesSent ? 'Invites Sent!' : 'Send Invites'}
                             </Button>
                         </form>
                     </div>
                 )}
              </div>
          )}

          {/* Members Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-slate-900 flex items-center gap-2 text-xl">
                    <IconUsers className="w-6 h-6 text-indigo-500" /> Known Members <span className="text-slate-400 text-lg font-normal">({visibleMembers.length}/{members.length})</span>
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
            
            {visibleMembers.length === 0 ? (
                <div className="text-center py-8 text-slate-500 bg-white rounded-2xl border border-slate-100 border-dashed">
                    <p>No members visible yet. Mark people as known to see them here!</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-6">
                    {visibleMembers.map(member => (
                        <div key={member.id} className="flex flex-col items-center gap-2 group cursor-pointer">
                            <div className="relative">
                                <img 
                                    src={member.avatarUrl} 
                                    alt={member.name} 
                                    className={`w-16 h-16 rounded-2xl object-cover shadow-sm transition-transform group-hover:scale-105 ${member.id === user.id ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
                                />
                                {member.type === UserType.PREMIUM && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full border-2 border-white" title="Premium"></div>
                                )}
                            </div>
                            <span className="text-sm font-medium text-slate-700 text-center truncate w-full">{member.name.split(' ')[0]}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {visibleMembers.map(member => (
                        <div key={member.id} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                            <img 
                                src={member.avatarUrl} 
                                alt={member.name} 
                                className={`w-12 h-12 rounded-full object-cover border ${member.id === user.id ? 'border-indigo-500' : 'border-slate-200'}`}
                            />
                            <div className="flex-1">
                                <p className="text-base font-bold text-slate-800">{member.name}</p>
                                <p className="text-xs text-slate-500">{member.email}</p>
                            </div>
                            {member.type === UserType.PREMIUM && (
                                <span className="text-[10px] font-bold bg-pink-50 text-pink-600 px-2 py-1 rounded-full uppercase">Premium</span>
                            )}
                        </div>
                    ))}
                </div>
            )}
          </section>

       </main>

        {/* Edit Group Modal */}
        {isEditing && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-800">Edit Group Details</h2>
                        <button onClick={() => setIsEditing(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
                            <IconX className="w-5 h-5" />
                        </button>
                    </div>
                    <form onSubmit={handleUpdateGroup} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Group Name</label>
                            <input 
                                type="text" 
                                required 
                                className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={editName} 
                                onChange={e => setEditName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea 
                                className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none h-24"
                                value={editDesc} 
                                onChange={e => setEditDesc(e.target.value)}
                            />
                        </div>
                        <div className="pt-2">
                            <Button type="submit" fullWidth>Save Changes</Button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};