import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Calendar, Dumbbell, ClipboardList,
  Settings, LogOut, Building2, UserCheck, Flame, Trophy,
  TrendingUp, CheckCircle, CheckSquare, User, Menu, X, ChevronDown,
  CalendarDays, Megaphone, Link
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useGym } from '../../contexts/GymContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Avatar, Badge } from './index';
import { NAV_ROUTES } from '../../utils/constants';
import { getRoleName } from '../../utils/helpers';

const iconMap = {
  LayoutDashboard, Users, Calendar, Dumbbell, ClipboardList,
  Settings, Building2, UserCheck, Flame, Trophy, TrendingUp,
  CheckCircle, CheckSquare, User, CalendarDays, Megaphone, Link
};

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { userData, logout, isSysadmin } = useAuth();
  const { currentGym, gyms, setCurrentGym } = useGym();
  const { gymLogo } = useTheme();
  const navigate = useNavigate();
  const [showGymSelector, setShowGymSelector] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const routes = NAV_ROUTES[userData?.role] || NAV_ROUTES.alumno;

  return (
    <>
      {/* Overlay móvil */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-slate-900 border-r border-gray-800 z-50 transition-transform lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {gymLogo ? (
                  <img src={gymLogo} alt="Logo" className="w-10 h-10 rounded-xl object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(var(--color-primary), 1)' }}>
                    <Dumbbell size={20} className="text-white" />
                  </div>
                )}
                <div>
                  <h1 className="font-bold text-lg">FitPro</h1>
                  <Badge className="badge-primary text-xs">{getRoleName(userData?.role)}</Badge>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="lg:hidden p-1 hover:bg-gray-800 rounded">
                <X size={20} />
              </button>
            </div>

            {/* Selector de gimnasio */}
            {isSysadmin() && gyms.length > 0 && (
              <div className="mt-4 relative">
                <button
                  onClick={() => setShowGymSelector(!showGymSelector)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors"
                >
                  <span className="text-sm truncate">{currentGym?.name || 'Seleccionar gimnasio'}</span>
                  <ChevronDown size={16} className={`transition-transform ${showGymSelector ? 'rotate-180' : ''}`} />
                </button>
                {showGymSelector && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-xl shadow-lg border border-gray-700 max-h-48 overflow-y-auto z-50">
                    {gyms.map(gym => (
                      <button
                        key={gym.id}
                        onClick={() => { setCurrentGym(gym); setShowGymSelector(false); }}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-700 text-sm ${currentGym?.id === gym.id ? 'text-primary' : ''}`}
                        style={currentGym?.id === gym.id ? { color: 'rgba(var(--color-primary), 1)' } : {}}
                      >
                        {gym.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Mostrar gimnasio actual para otros roles */}
            {!isSysadmin() && currentGym && (
              <div className="mt-3 px-3 py-2 bg-gray-800/50 rounded-xl">
                <p className="text-xs text-gray-400">Gimnasio</p>
                <p className="text-sm font-medium truncate">{currentGym.name}</p>
              </div>
            )}
          </div>

          {/* Navegación */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {routes.map(route => {
              const Icon = iconMap[route.icon] || LayoutDashboard;
              return (
                <NavLink
                  key={route.path}
                  to={route.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      isActive 
                        ? 'nav-link-active font-medium' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`
                  }
                >
                  <Icon size={20} />
                  <span>{route.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Usuario y logout */}
          <div className="p-3 border-t border-gray-800">
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <Avatar name={userData?.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{userData?.name}</p>
                <p className="text-xs text-gray-400 truncate">{userData?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
            >
              <LogOut size={20} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
