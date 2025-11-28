import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { User } from './types';
import { storage } from './services/storage';

// Pages
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Home } from './pages/Home';
import { MyProfile } from './pages/MyProfile';
import { GroupDetail } from './pages/GroupDetail';
import { CreateGroup } from './pages/CreateGroup';
import { DeckPage } from './pages/DeckPage';
import { KnownPeople } from './pages/KnownPeople';
import { GlobalKnownPeople } from './pages/GlobalKnownPeople';

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
   const { user } = useAuth();
   const navigate = useNavigate();

   // Handle Deep Linking (External QR Codes / Links)
   useEffect(() => {
     // Check for ?code= in the main window URL (before hash)
     const params = new URLSearchParams(window.location.search);
     const code = params.get('code');
     
     if (code) {
         console.log("Deep link code detected:", code);
         localStorage.setItem('pendingJoinCode', code.toUpperCase());
         
         // Clean the URL so we don't re-trigger on refresh
         const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + window.location.hash;
         window.history.replaceState({path: newUrl}, '', newUrl);
     }
   }, []);

   // Process Pending Joins when User is Authenticated
   useEffect(() => {
       const pendingCode = localStorage.getItem('pendingJoinCode');
       if (user && pendingCode) {
           console.log("Processing pending join code:", pendingCode);
           const group = storage.findGroupByCode(pendingCode);
           if (group) {
               // Auto join
               storage.joinGroup(group.id, user.id);
               // Clear pending
               localStorage.removeItem('pendingJoinCode');
               // Redirect to group
               navigate(`/group/${group.id}`);
           } else {
               // Invalid code, clear it
               console.warn("Invalid pending code");
               localStorage.removeItem('pendingJoinCode');
           }
       }
   }, [user, navigate]);

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
        <Route path="/my-network" element={<ProtectedRoute><GlobalKnownPeople /></ProtectedRoute>} />
      </Routes>
   )
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = storage.getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const logout = () => {
    storage.logout();
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