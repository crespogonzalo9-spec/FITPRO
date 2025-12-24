import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GymProvider } from './contexts/GymContext';
import { ToastProvider } from './contexts/ToastContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Layout from './components/Common/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import Members from './components/Members/Members';
import Classes from './components/Classes/Classes';
import Exercises from './components/Exercises/Exercises';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="loader" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="loader" /></div>;
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
        <Route path="members" element={<Members />} />
        <Route path="coaches" element={<ComingSoon title="Entrenadores" />} />
        <Route path="classes" element={<Classes />} />
        <Route path="exercises" element={<Exercises />} />
        <Route path="routines" element={<ComingSoon title="Rutinas" />} />
        <Route path="payments" element={<ComingSoon title="Pagos" />} />
        <Route path="reports" element={<ComingSoon title="Reportes" />} />
        <Route path="settings" element={<ComingSoon title="Configuración" />} />
        <Route path="my-classes" element={<ComingSoon title="Mis Clases" />} />
        <Route path="athletes" element={<ComingSoon title="Atletas" />} />
        <Route path="validate" element={<ComingSoon title="Validar" />} />
        <Route path="messages" element={<ComingSoon title="Mensajes" />} />
        <Route path="schedule" element={<ComingSoon title="Calendario" />} />
        <Route path="progress" element={<ComingSoon title="Mi Progreso" />} />
        <Route path="rankings" element={<ComingSoon title="Rankings" />} />
        <Route path="profile" element={<ComingSoon title="Mi Perfil" />} />
        <Route path="gyms" element={<ComingSoon title="Gimnasios" />} />
        <Route path="users" element={<ComingSoon title="Usuarios" />} />
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
            <AppRoutes />
          </GymProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
