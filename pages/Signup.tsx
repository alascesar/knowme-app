import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { storage } from '../services/storage';
import { UserType } from '../types';
import { Button } from '../components/Button';
import { IconGoogle } from '../components/Icons';
import { WelcomeModal } from '../components/WelcomeModal';

export const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Default to STANDARD user type as premium is handled separately/later
    const user = storage.signup(name, email, UserType.STANDARD, password);
    setUser(user);
    setShowWelcomeModal(true);
  };

  const handleGoogleSignup = () => {
      // For demo, loginWithGoogle handles both sign up and sign in logic
      const { user } = storage.loginWithGoogle();
      setUser(user);
      // For google signup, we assume it's always successful in demo,
      // but strictly we should trigger modal for new users. 
      // Since this is the "Signup" page, we can assume intent is to sign up.
      setShowWelcomeModal(true);
  };

  const onCompleteProfile = () => {
      navigate('/profile');
  };

  const onSkip = () => {
      navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-purple-50 p-4 relative">
      
      {/* Welcome Modal Overlay */}
      {showWelcomeModal && (
          <WelcomeModal onCompleteProfile={onCompleteProfile} onSkip={onSkip} />
      )}

      <div className="bg-white/80 backdrop-blur-xl w-full max-w-md rounded-3xl shadow-2xl shadow-indigo-500/10 p-8 space-y-8 border border-white">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">Create Account</h1>
          <p className="text-slate-500 font-medium">Start remembering names today.</p>
        </div>

        <div className="space-y-4">
            <button 
                onClick={handleGoogleSignup}
                className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-3 rounded-xl transition-all shadow-sm"
            >
                <IconGoogle className="w-5 h-5" />
                Sign Up with Google
            </button>

            <div className="relative flex items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase font-bold tracking-widest">Or Sign Up With Email</span>
                <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                <input 
                type="text" 
                required
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                />
            </div>
            <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                <input 
                type="email" 
                required
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                <input 
                type="password" 
                required
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            <Button type="submit" fullWidth size="lg" className="mt-2">Sign Up</Button>
            </form>
        </div>

        <div className="text-center text-sm text-slate-500">
          Already have an account? <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">Log in</Link>
        </div>
      </div>
    </div>
  );
};