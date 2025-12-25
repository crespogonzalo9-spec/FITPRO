import React, { useState, useEffect } from 'react';
import { Users, Calendar, TrendingUp, Trophy, Clock, CheckCircle, Dumbbell, Flame, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useGym } from '../../contexts/GymContext';
import { Card, StatCard, LoadingState, Badge, Avatar, EmptyState } from '../Common';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { getRoleName } from '../../utils/helpers';

const Dashboard = () => {
  const { userData, isSysadmin, isAdmin, isProfesor, isAlumno } = useAuth();
  const { currentGym, gyms } = useGym();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [userData, currentGym]);

  const loadDashboardData = async () => {
    if (!userData) return;
    setLoading(true);
    try {
      if (isSysadmin()) {
        const usersSnap = await getDocs(collection(db, 'users'));
        const gymsSnap = await getDocs(collection(db, 'gyms'));
        setStats({
          totalGyms: gymsSnap.size,
          totalUsers: usersSnap.size,
          admins: usersSnap.docs.filter(d => d.data().role === 'admin').length,
          alumnos: usersSnap.docs.filter(d => d.data().role === 'alumno').length
        });
      } else if (currentGym?.id) {
        const membersSnap = await getDocs(query(collection(db, 'users'), where('gymId', '==', currentGym.id), where('role', '==', 'alumno')));
        const profesoresSnap = await getDocs(query(collection(db, 'users'), where('gymId', '==', currentGym.id), where('role', '==', 'profesor')));
        const classesSnap = await getDocs(query(collection(db, 'classes'), where('gymId', '==', currentGym.id)));
        const prsSnap = await getDocs(query(collection(db, 'personalRecords'), where('gymId', '==', currentGym.id), where('status', '==', 'pending')));
        setStats({
          totalMembers: membersSnap.size,
          totalProfesores: profesoresSnap.size,
          totalClasses: classesSnap.size,
          pendingPRs: prsSnap.size
        });
      }
      if (isAlumno() && userData?.id) {
        const myPRs = await getDocs(query(collection(db, 'personalRecords'), where('userId', '==', userData.id)));
        const validatedPRs = myPRs.docs.filter(d => d.data().status === 'validated').length;
        setStats({ totalPRs: myPRs.size, validatedPRs, pendingPRs: myPRs.size - validatedPRs });
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    }
    setLoading(false);
  };

  if (loading) return <LoadingState message="Cargando dashboard..." />;

  if (isSysadmin()) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div><h1 className="text-2xl font-bold">Panel de Control</h1><p className="text-gray-400">Bienvenido, {userData?.name}</p></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Building2} label="Gimnasios" value={stats.totalGyms || 0} color="emerald" />
          <StatCard icon={Users} label="Usuarios" value={stats.totalUsers || 0} color="blue" />
          <StatCard icon={Users} label="Admins" value={stats.admins || 0} color="purple" />
          <StatCard icon={Users} label="Alumnos" value={stats.alumnos || 0} color="orange" />
        </div>
        <Card>
          <h3 className="font-semibold mb-4">Gimnasios</h3>
          {gyms.length === 0 ? <p className="text-gray-500 text-center py-4">No hay gimnasios</p> : (
            <div className="space-y-3">
              {gyms.map(gym => (
                <div key={gym.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center"><Building2 className="text-emerald-500" size={20} /></div>
                    <div><p className="font-medium">{gym.name}</p><p className="text-xs text-gray-400">{gym.address || 'Sin dirección'}</p></div>
                  </div>
                  <Badge variant={gym.isActive ? 'success' : 'error'}>{gym.isActive ? 'Activo' : 'Inactivo'}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  }

  if ((isAdmin() || isProfesor()) && !currentGym) {
    return <EmptyState icon={Building2} title="Sin gimnasio asignado" description="Contactá al administrador" />;
  }

  if (isAdmin() || isProfesor()) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex justify-between items-start">
          <div><h1 className="text-2xl font-bold">Dashboard</h1><p className="text-gray-400">{currentGym?.name}</p></div>
          <Badge variant={isAdmin() ? 'blue' : 'emerald'}>{getRoleName(userData?.role)}</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Alumnos" value={stats.totalMembers || 0} color="emerald" />
          <StatCard icon={Users} label="Profesores" value={stats.totalProfesores || 0} color="blue" />
          <StatCard icon={Calendar} label="Clases" value={stats.totalClasses || 0} color="purple" />
          <StatCard icon={Clock} label="PRs Pendientes" value={stats.pendingPRs || 0} color="orange" />
        </div>
        <Card className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-emerald-500/20">
          <h3 className="font-semibold mb-2">Acciones Rápidas</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <a href="/classes" className="p-4 bg-gray-800/50 rounded-xl text-center hover:bg-gray-800 transition-colors"><Calendar className="mx-auto mb-2 text-emerald-500" size={24} /><span className="text-sm">Clases</span></a>
            <a href="/routines" className="p-4 bg-gray-800/50 rounded-xl text-center hover:bg-gray-800 transition-colors"><Dumbbell className="mx-auto mb-2 text-blue-500" size={24} /><span className="text-sm">Rutinas</span></a>
            <a href="/wods" className="p-4 bg-gray-800/50 rounded-xl text-center hover:bg-gray-800 transition-colors"><Flame className="mx-auto mb-2 text-orange-500" size={24} /><span className="text-sm">WODs</span></a>
            <a href="/prs" className="p-4 bg-gray-800/50 rounded-xl text-center hover:bg-gray-800 transition-colors"><TrendingUp className="mx-auto mb-2 text-purple-500" size={24} /><span className="text-sm">Validar PRs</span></a>
          </div>
        </Card>
      </div>
    );
  }

  // Dashboard Alumno
  if (!currentGym) {
    return <EmptyState icon={Building2} title="Sin gimnasio asignado" description="Contactá al administrador para ser asignado a un gimnasio" />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div><h1 className="text-2xl font-bold">¡Hola, {userData?.name?.split(' ')[0]}!</h1><p className="text-gray-400">{currentGym?.name}</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Trophy} label="Mis PRs" value={stats.totalPRs || 0} color="emerald" />
        <StatCard icon={CheckCircle} label="Validados" value={stats.validatedPRs || 0} color="blue" />
        <StatCard icon={Clock} label="Pendientes" value={stats.pendingPRs || 0} color="orange" />
      </div>
      <Card className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-emerald-500/20">
        <h3 className="font-semibold mb-2">Acciones Rápidas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <a href="/schedule" className="p-4 bg-gray-800/50 rounded-xl text-center hover:bg-gray-800 transition-colors"><Calendar className="mx-auto mb-2 text-emerald-500" size={24} /><span className="text-sm">Horarios</span></a>
          <a href="/my-routines" className="p-4 bg-gray-800/50 rounded-xl text-center hover:bg-gray-800 transition-colors"><Dumbbell className="mx-auto mb-2 text-blue-500" size={24} /><span className="text-sm">Mis Rutinas</span></a>
          <a href="/my-prs" className="p-4 bg-gray-800/50 rounded-xl text-center hover:bg-gray-800 transition-colors"><TrendingUp className="mx-auto mb-2 text-purple-500" size={24} /><span className="text-sm">Mis PRs</span></a>
          <a href="/rankings" className="p-4 bg-gray-800/50 rounded-xl text-center hover:bg-gray-800 transition-colors"><Trophy className="mx-auto mb-2 text-yellow-500" size={24} /><span className="text-sm">Rankings</span></a>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
