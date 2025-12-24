import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Calendar, Dumbbell, ClipboardList,
  CreditCard, BarChart3, Settings, LogOut, Building2, UserCheck,
  CheckCircle, MessageSquare, TrendingUp, Trophy, User, CheckSquare,
  Menu, X, ChevronLeft
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useGym } from '../../contexts/GymContext';
import { Avatar } from '../Common';

const iconMap = {
  LayoutDashboard, Users, Calendar, Dumbbell, ClipboardList,
  CreditCard, BarChart3, Settings, Building2, UserCheck,
  CheckCircle, MessageSquare, TrendingUp, Trophy, User, CheckSquare
};

const Sidebar = ({ isOpen, onClose }) => {
  const { userData, logout } = useAuth();
  const { currentGym } = useGym();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Rutas según rol
  const getNavItems = () => {
    const role = userData?.role;
    
    const routes = {
      sysadmin: [
        { path: '/dashboard', name: 'Dashboard', icon: 'LayoutDashboard' },
        { path: '/gyms', name: 'Gimnasios', icon: 'Building2' },
        { path: '/users', name: 'Usuarios', icon: 'Users' },
        { path: '/reports', name: 'Reportes', icon: 'BarChart3' },
        { path: '/settings', name: 'Configuración', icon: 'Settings' }
      ],
      admin: [
        { path: '/dashboard', name: 'Dashboard', icon: 'LayoutDashboard' },
        { path: '/members', name: 'Miembros', icon: 'Users' },
        { path: '/coaches', name: 'Entrenadores', icon: 'UserCheck' },
        { path: '/classes', name: 'Clases', icon: 'Calendar' },
        { path: '/exercises', name: 'Ejercicios', icon: 'Dumbbell' },
        { path: '/routines', name: 'Rutinas', icon: 'ClipboardList' },
        { path: '/payments', name: 'Pagos', icon: 'CreditCard' },
        { path: '/reports', name: 'Reportes', icon: 'BarChart3' },
        { path: '/settings', name: 'Configuración', icon: 'Settings' }
      ],
      coach: [
        { path: '/dashboard', name: 'Dashboard', icon: 'LayoutDashboard' },
        { path: '/my-classes', name: 'Mis Clases', icon: 'Calendar' },
        { path: '/athletes', name: 'Atletas', icon: 'Users' },
        { path: '/exercises', name: 'Ejercicios', icon: 'Dumbbell' },
        { path: '/routines', name: 'Rutinas', icon: 'ClipboardList' },
        { path: '/validate', name: 'Validar', icon: 'CheckCircle' },
        { path: '/messages', name: 'Mensajes', icon: 'MessageSquare' }
      ],
      athlete: [
        { path: '/dashboard', name: 'Dashboard', icon: 'LayoutDashboard' },
        { path: '/schedule', name: 'Calendario', icon: 'Calendar' },
        { path: '/my-classes', name: 'Mis Clases', icon: 'CheckSquare' },
        { path: '/routines', name: 'Rutinas', icon: 'ClipboardList' },
        { path: '/progress', name: 'Mi Progreso', icon: 'TrendingUp' },
        { path: '/rankings', name: 'Rankings', icon: 'Trophy' },
        { path: '/profile', name: 'Mi Perfil', icon: 'User' }
      ]
    };

    return routes[role] || routes.athlete;
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Dumbbell size={24} className="text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">FitPro</h1>
                {currentGym && (
                  <p className="text-xs text-gray-400">{currentGym.name}</p>
                )}
              </div>
            </div>
            <button 
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-gray-700 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map(item => {
              const Icon = iconMap[item.icon] || LayoutDashboard;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => window.innerWidth < 1024 && onClose()}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-4 py-3 rounded-xl
                      transition-all duration-200
                      ${isActive 
                        ? 'bg-emerald-500/10 text-emerald-500' 
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }
                    `}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.name}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Avatar name={userData?.name} src={userData?.photoURL} />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{userData?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{userData?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
              text-gray-400 hover:bg-red-500/10 hover:text-red-500
              transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
