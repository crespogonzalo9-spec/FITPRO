import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/gyms': 'Gimnasios',
  '/users': 'Usuarios',
  '/members': 'Miembros',
  '/coaches': 'Entrenadores',
  '/classes': 'Clases',
  '/exercises': 'Ejercicios',
  '/routines': 'Rutinas',
  '/payments': 'Pagos',
  '/reports': 'Reportes',
  '/settings': 'Configuración',
  '/my-classes': 'Mis Clases',
  '/athletes': 'Atletas',
  '/validate': 'Validar Resultados',
  '/messages': 'Mensajes',
  '/schedule': 'Calendario',
  '/progress': 'Mi Progreso',
  '/rankings': 'Rankings',
  '/profile': 'Mi Perfil'
};

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    return pageTitles[location.pathname] || 'FitPro';
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="main-content">
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          title={getPageTitle()}
        />
        
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
