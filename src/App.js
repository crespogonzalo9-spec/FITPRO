import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GymProvider } from './contexts/GymContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Auth
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';

// Layout
import Layout from './components/Common/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Gyms from './pages/Gyms';
import UsersPage from './pages/Users';
import Members from './pages/Members';
import Profesores from './pages/Profesores';
import Classes from './pages/Classes';
import Exercises from './pages/Exercises';
import Routines from './pages/Routines';
import WODs from './pages/WODs';
import PRs from './pages/PRs';
import Rankings from './pages/Rankings';
import Schedule from './pages/Schedule';
import Calendar from './pages/Calendar';
import News from './pages/News';
import Invites from './pages/Invites';
import Settings from './pages/Settings';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, userData, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="w-8 h-8 border-2 border-gray-700 border-t-emerald-500 rounded-full animate-spin" /></div>;
  }
  
  if (!user) return <Navigate to="/login" replace />;
  
  if (allowedRoles && !allowedRoles.includes(userData?.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="w-8 h-8 border-2 border-gray-700 border-t-emerald-500 rounded-full animate-spin" /></div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

const ComingSoon = ({ title }) => (
  <div className="flex flex-col items-center justify-center py-20">
    <h2 className="text-2xl font-bold mb-2">{title}</h2>
    <p className="text-gray-400">Próximamente</p>
  </div>
);

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Sysadmin only */}
        <Route path="gyms" element={<ProtectedRoute allowedRoles={['sysadmin']}><Gyms /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute allowedRoles={['sysadmin']}><UsersPage /></ProtectedRoute>} />
        
        {/* Admin only */}
        <Route path="profesores" element={<ProtectedRoute allowedRoles={['admin', 'sysadmin']}><Profesores /></ProtectedRoute>} />
        <Route path="invites" element={<ProtectedRoute allowedRoles={['admin', 'sysadmin']}><Invites /></ProtectedRoute>} />
        
        {/* Admin & Profesor */}
        <Route path="members" element={<Members />} />
        <Route path="classes" element={<Classes />} />
        <Route path="exercises" element={<Exercises />} />
        <Route path="routines" element={<Routines />} />
        <Route path="wods" element={<WODs />} />
        <Route path="prs" element={<PRs />} />
        <Route path="rankings" element={<Rankings />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="news" element={<News />} />
        
        {/* Alumno */}
        <Route path="schedule" element={<Schedule />} />
        <Route path="my-classes" element={<Schedule />} />
        <Route path="my-routines" element={<Routines />} />
        <Route path="my-prs" element={<PRs />} />
        
        {/* Common */}
        <Route path="profile" element={<ComingSoon title="Mi Perfil" />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <GymProvider>
            <ThemeProvider>
              <AppRoutes />
            </ThemeProvider>
          </GymProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
