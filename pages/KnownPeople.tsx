import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../App';
import { supabaseStorage } from '../services/supabaseStorage';
import { ProfileCard } from '../types';
import { IconArrowLeft, IconCheck } from '../components/Icons';

export const KnownPeople: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const [knownProfiles, setKnownProfiles] = useState<ProfileCard[]>([]);

  useEffect(() => {
    if (groupId && user) {
        const loadKnown = async () => {
          try {
            const deck = await supabaseStorage.getDeckForGroup(groupId, user.id);
            // Filter for known status
            const known = deck.filter(item => item.status && item.status.isKnown).map(item => item.card);
            setKnownProfiles(known);
          } catch (error) {
            console.error('Failed to load known people:', error);
          }
        };
        loadKnown();
    }
  }, [groupId, user]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white px-6 py-4 shadow-sm sticky top-0 z-10 flex items-center gap-4">
         <Link to={`/group/${groupId}`} className="text-slate-500 hover:text-slate-800"><IconArrowLeft className="w-6 h-6"/></Link>
         <h1 className="font-bold text-lg">People You Know</h1>
      </header>

      <main className="p-6 max-w-2xl mx-auto">
        {knownProfiles.length === 0 ? (
            <div className="text-center mt-10 opacity-60">
                <p>You haven't marked anyone as known yet.</p>
                <Link to={`/group/${groupId}/deck`} className="text-primary underline mt-2 inline-block">Go to Deck</Link>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {knownProfiles.map(profile => (
                    <div key={profile.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                        <img src={profile.photoUrl} alt={profile.fullName} className="w-16 h-16 rounded-full object-cover bg-slate-200" />
                        <div>
                            <h3 className="font-bold text-slate-900">{profile.fullName}</h3>
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium mt-1">
                                <IconCheck className="w-3 h-3" /> Known
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </main>
    </div>
  );
};