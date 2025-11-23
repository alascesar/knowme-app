import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { storage } from '../services/storage';
import { UserType } from '../types';
import { Button } from '../components/Button';

export const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = storage.signup(name, email, isPremium ? UserType.PREMIUM : UserType.STANDARD, password);
    setUser(user);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-purple-50 p-4">
      <div className="bg-white/80 backdrop-blur-xl w-full max-w-md rounded-3xl shadow-2xl shadow-indigo-500/10 p-8 space-y-8 border border-white">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">Create Account</h1>
          <p className="text-slate-500 font-medium">Start remembering names today.</p>
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
          
          <div className="flex items-center p-4 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setIsPremium(!isPremium)}>
            <input 
                type="checkbox"
                id="premium"
                checked={isPremium}
                onChange={(e) => setIsPremium(e.target.checked)}
                className="h-5 w-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="premium" className="ml-3 block cursor-pointer">
                <span className="font-bold block text-slate-800">Premium Account</span>
                <span className="text-xs text-slate-500">Create groups & search functionality</span>
            </label>
          </div>

          <Button type="submit" fullWidth size="lg" className="mt-2">Sign Up</Button>
        </form>

        <div className="text-center text-sm text-slate-500">
          Already have an account? <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">Log in</Link>
        </div>
      </div>
    </div>
  );
};