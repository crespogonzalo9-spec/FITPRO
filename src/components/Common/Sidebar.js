import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Calendar, Dumbbell, ClipboardList,
  Settings, LogOut, Building2, UserCheck, Flame, Trophy,
  TrendingUp, CheckCircle, CheckSquare, User, Menu, X, ChevronDown,
  CalendarDays, Megaphone, Link
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useGym } from '../../contexts/GymContext';
import { Avatar, Badge } from './index';
import { NAV_ROUTES } from '../../utils/constants';
import { getRoleName, getRoleColor } from '../../utils/helpers';

const iconMap = {
  LayoutDashboard, Users, Calendar, Dumbbell, ClipboardList,
  Settings, Building2, UserCheck, Flame, Trophy, TrendingUp,
  CheckCircle, CheckSquare, User, CalendarDays, Megaphone, Link
};

const Sidebar = ({ isOpen, onClose }) => {
  const { userData, logout } = useAuth();
  const { currentGym, gyms, selectGym } = useGym();
  const navigate = useNavigate();
  const [showGymSelector, setShowGymSelector] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = NAV_ROUTES[userData?.role] || NAV_ROUTES.alumno;

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />}
      
      <aside className={`fixed top-0 left-0 z-40 w-64 h-full bg-slate-900 border-r border-gray-800 transition-transform lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Dumbbell size={24} className="text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">FitPro</h1>
                <Badge variant={getRoleColor(userData?.role)}>{getRoleName(userData?.role)}</Badge>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden p-2 hover:bg-gray-800 rounded-lg"><X size={20} /></button>
          </div>
        </div>

        {/* Gym Selector (solo para sysadmin) */}
        {userData?.role === 'sysadmin' && gyms.length > 0 && (
          <div className="p-4 border-b border-gray-800">
            <div className="relative">
              <button
                onClick={() => setShowGymSelector(!showGymSelector)}
                className="w-full flex items-center justify-between p-3 bg-gray-800 rounded-xl hover:bg-gray-700"
              >
                <span className="text-sm truncate">{currentGym?.name || 'Seleccionar gimnasio'}</span>
                <ChevronDown size={16} className={`transition-transform ${showGymSelector ? 'rotate-180' : ''}`} />
              </button>
              {showGymSelector && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-10 max-h-60 overflow-y-auto">
                  {gyms.map(gym => (
                    <button
                      key={gym.id}
                      onClick={() => { selectGym(gym); setShowGymSelector(false); }}
                      className={`w-full p-3 text-left hover:bg-gray-700 ${currentGym?.id === gym.id ? 'bg-emerald-500/10 text-emerald-400' : ''}`}
                    >
                      {gym.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Current Gym for non-sysadmin */}
        {userData?.role !== 'sysadmin' && currentGym && (
          <div className="p-4 border-b border-gray-800">
            <p className="text-xs text-gray-500">Gimnasio</p>
            <p className="font-medium truncate">{currentGym.name}</p>
          </div>
        )}

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
                    className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-emerald-500/10 text-emerald-500' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
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
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <Avatar name={userData?.name} size="md" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{userData?.name}</p>
              <p className="text-xs text-gray-500 truncate">{userData?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
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
