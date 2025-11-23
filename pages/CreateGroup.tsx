import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { supabaseStorage } from '../services/supabaseStorage';
import { Button } from '../components/Button';
import { IconArrowLeft } from '../components/Icons';
import { UserType } from '../types';

export const CreateGroup: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');

  // Guard clause if standard user tries to access URL directly
  if (user && user.type !== UserType.PREMIUM) {
      return (
          <div className="p-8 text-center">
              <h2 className="text-xl font-bold text-red-500">Premium Feature</h2>
              <p className="text-slate-600 mt-2">You need a premium account to create groups.</p>
              <Link to="/" className="mt-4 inline-block text-indigo-600 underline">Back Home</Link>
          </div>
      );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!user) return;

    // Generate a simple code
    const code = joinCode.toUpperCase() || Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
        const newGroup = await supabaseStorage.createGroup({
            name,
            description,
            isPublic,
            createdByUserId: user.id,
            joinCode: code
        });
        navigate(`/group/${newGroup.id}`);
    } catch (err: any) {
        setError(err.message || "This Join Code is already taken. Please choose another.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
       <header className="bg-white px-6 py-4 shadow-sm sticky top-0 z-10 flex items-center gap-4">
         <Link to="/" className="text-slate-500 hover:text-slate-800"><IconArrowLeft className="w-6 h-6"/></Link>
         <h1 className="font-bold text-lg">Create New Group</h1>
       </header>

       <main className="p-6 max-w-lg mx-auto">
         <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl shadow-sm">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Group Name</label>
                <input 
                    type="text" required 
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-secondary outline-none"
                    value={name} onChange={e => setName(e.target.value)}
                    placeholder="e.g. Marketing Team 2024"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-secondary outline-none h-24"
                    value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="What is this group about?"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Custom Join Code (Optional)</label>
                <input 
                    type="text" 
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-secondary outline-none uppercase"
                    value={joinCode} onChange={e => setJoinCode(e.target.value)}
                    placeholder="e.g. TEAMROCK"
                />
                <p className="text-xs text-slate-500 mt-1">If left blank, a random code will be generated.</p>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <input 
                    type="checkbox" 
                    id="public" 
                    className="w-5 h-5 text-secondary rounded focus:ring-secondary"
                    checked={isPublic}
                    onChange={e => setIsPublic(e.target.checked)}
                />
                <label htmlFor="public" className="text-sm text-slate-700 font-medium">
                    Public Group <span className="block text-xs font-normal text-slate-500">Allow people to find this group in search results.</span>
                </label>
            </div>

            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

            <Button type="submit" fullWidth variant="secondary" size="lg">Create Group</Button>
         </form>
       </main>
    </div>
  );
};