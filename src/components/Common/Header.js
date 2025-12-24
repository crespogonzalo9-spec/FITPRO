import React, { useState, useEffect } from 'react';
import { Menu, Bell, Search, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar, Dropdown, DropdownItem } from '../Common';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { formatRelativeDate } from '../../utils/helpers';

const Header = ({ onMenuClick, title }) => {
  const { user, userData } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Cargar notificaciones
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-lg border-b border-gray-800">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
          <h2 className="text-lg font-semibold hidden sm:block">{title}</h2>
        </div>

        {/* Center - Search (desktop) */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 py-2 bg-gray-800/50"
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Search mobile */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="md:hidden p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Search size={20} />
          </button>

          {/* Notifications */}
          <Dropdown
            trigger={
              <button className="relative p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 rounded-full text-xs flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            }
          >
            <div className="w-80">
              <div className="p-3 border-b border-gray-700">
                <h4 className="font-semibold">Notificaciones</h4>
              </div>
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No hay notificaciones
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map(notif => (
                    <div 
                      key={notif.id}
                      className={`p-3 border-b border-gray-700/50 hover:bg-gray-800/50 cursor-pointer ${
                        !notif.read ? 'bg-emerald-500/5' : ''
                      }`}
                    >
                      <p className="text-sm">{notif.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatRelativeDate(notif.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Dropdown>

          {/* User Menu */}
          <Dropdown
            trigger={
              <button className="flex items-center gap-2 p-1 hover:bg-gray-800 rounded-lg transition-colors">
                <Avatar name={userData?.name} src={userData?.photoURL} size="sm" />
              </button>
            }
          >
            <DropdownItem onClick={() => {}}>Mi Perfil</DropdownItem>
            <DropdownItem onClick={() => {}}>Configuración</DropdownItem>
            <div className="dropdown-divider" />
            <DropdownItem onClick={() => {}} danger>Cerrar Sesión</DropdownItem>
          </Dropdown>
        </div>
      </div>

      {/* Mobile Search */}
      {showSearch && (
        <div className="md:hidden p-4 border-t border-gray-800 animate-fadeIn">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 py-2"
              autoFocus
            />
            <button
              onClick={() => setShowSearch(false)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
