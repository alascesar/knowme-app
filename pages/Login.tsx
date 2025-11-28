import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { storage } from '../services/storage';
import { Button } from '../components/Button';
import { IconGoogle } from '../components/Icons';
import { WelcomeModal } from '../components/WelcomeModal';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = storage.login(email, password);
    if (user) {
      setUser(user);
      navigate('/');
    } else {
      setError('Invalid email or password. Try alice@example.com / password');
    }
  };

  const handleGoogleLogin = () => {
      const { user, isNew } = storage.loginWithGoogle();
      setUser(user);
      
      if (isNew) {
          setShowWelcomeModal(true);
      } else {
          navigate('/');
      }
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
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">KnowMe App</h1>
          <p className="text-slate-500 font-medium">Never forget a name again.</p>
        </div>

        <div className="space-y-4">
            <button 
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-3 rounded-xl transition-all shadow-sm"
            >
                <IconGoogle className="w-5 h-5" />
                Continue with Google
            </button>

            <div className="relative flex items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase font-bold tracking-widest">Or Login With Email</span>
                <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                <input 
                type="email" 
                required
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                placeholder="you@example.com"
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
            {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-lg text-center">{error}</p>}
            
            <Button type="submit" fullWidth size="lg" className="mt-2">Log In</Button>
            </form>
        </div>

        <div className="text-center text-sm text-slate-500">
          Don't have an account? <Link to="/signup" className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">Sign up</Link>
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-100/50">
            <p className="text-[10px] uppercase tracking-widest text-center text-slate-400 mb-3">Demo Credentials</p>
            <div className="flex flex-wrap gap-3 justify-center">
                <button onClick={() => { setEmail('alice@example.com'); setPassword('password'); }} className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors font-medium">alice (Premium)</button>
                <button onClick={() => { setEmail('bob@example.com'); setPassword('password'); }} className="text-xs bg-slate-50 text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors font-medium">bob (Standard)</button>
            </div>
        </div>
      </div>
    </div>
  );
};