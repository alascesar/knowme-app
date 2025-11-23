import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { User } from './types';
import { supabase } from './services/supabase';
import { supabaseStorage } from './services/supabaseStorage';

// Pages
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Home } from './pages/Home';
import { MyProfile } from './pages/MyProfile';
import { GroupDetail } from './pages/GroupDetail';
import { CreateGroup } from './pages/CreateGroup';
import { DeckPage } from './pages/DeckPage';
import { KnownPeople } from './pages/KnownPeople';

// Auth Context
interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoading: boolean;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({ user: null, setUser: () => {}, isLoading: true, logout: () => {} });
export const useAuth = () => useContext(AuthContext);

const ProtectedRoute = ({ children }: PropsWithChildren) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="flex h-screen w-full items-center justify-center text-indigo-600">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppContent = () => {
   // This wrapper allows usage of useNavigate inside the provider if needed, 
   // though mainly for clean structure here.
   return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
        <Route path="/create-group" element={<ProtectedRoute><CreateGroup /></ProtectedRoute>} />
        <Route path="/group/:groupId" element={<ProtectedRoute><GroupDetail /></ProtectedRoute>} />
        <Route path="/group/:groupId/deck" element={<ProtectedRoute><DeckPage /></ProtectedRoute>} />
        <Route path="/group/:groupId/known" element={<ProtectedRoute><KnownPeople /></ProtectedRoute>} />
      </Routes>
   )
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadUser(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await loadUser(session.user.id);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUser = async (userId: string) => {
    try {
      const currentUser = await supabaseStorage.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to load user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading, logout }}>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AuthContext.Provider>
  );
}