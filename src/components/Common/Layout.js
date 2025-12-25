import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/gyms': 'Gimnasios',
  '/users': 'Usuarios',
  '/members': 'Alumnos',
  '/profesores': 'Profesores',
  '/classes': 'Clases',
  '/exercises': 'Ejercicios',
  '/routines': 'Rutinas',
  '/wods': 'WODs',
  '/rankings': 'Rankings',
  '/prs': 'Marcas Personales',
  '/settings': 'Configuración',
  '/my-classes': 'Mis Clases',
  '/my-routines': 'Mis Rutinas',
  '/my-prs': 'Mis PRs',
  '/schedule': 'Horarios',
  '/profile': 'Mi Perfil'
};

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} title={pageTitles[location.pathname] || 'FitPro'} />
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
