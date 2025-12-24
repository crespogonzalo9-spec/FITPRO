import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, TrendingUp, DollarSign, 
  Activity, Trophy, Clock, CheckCircle,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useGym } from '../../contexts/GymContext';
import { StatCard, Card, LoadingState, Badge } from '../Common';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const Dashboard = () => {
  const { userData, isAdmin, isCoach, isAthlete, isSysadmin } = useAuth();
  const { currentGym } = useGym();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, [userData, currentGym]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Simular datos para demo
      // En producción, esto vendría de Firebase
      setStats({
        totalMembers: 156,
        activeMembers: 142,
        totalCoaches: 8,
        totalClasses: 24,
        monthlyRevenue: 485000,
        attendanceToday: 47,
        classesToday: 6,
        pendingPayments: 12
      });

      setChartData([
        { name: 'Lun', asistencias: 45, ingresos: 85000 },
        { name: 'Mar', asistencias: 52, ingresos: 92000 },
        { name: 'Mié', asistencias: 48, ingresos: 78000 },
        { name: 'Jue', asistencias: 61, ingresos: 95000 },
        { name: 'Vie', asistencias: 55, ingresos: 88000 },
        { name: 'Sáb', asistencias: 38, ingresos: 45000 },
        { name: 'Dom', asistencias: 22, ingresos: 12000 }
      ]);

      setRecentActivity([
        { id: 1, type: 'checkin', user: 'María García', time: '08:30', class: 'CrossFit' },
        { id: 2, type: 'payment', user: 'Juan Pérez', amount: 15000, time: '09:15' },
        { id: 3, type: 'enrollment', user: 'Ana López', class: 'Funcional', time: '10:00' },
        { id: 4, type: 'checkin', user: 'Carlos Ruiz', time: '10:30', class: 'CrossFit' },
        { id: 5, type: 'pr', user: 'Laura Martínez', exercise: 'Back Squat', value: '85kg', time: '11:00' }
      ]);

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Cargando dashboard..." />;
  }

  // Dashboard para Admin
  if (isAdmin() || isSysadmin()) {
    return <AdminDashboard stats={stats} chartData={chartData} recentActivity={recentActivity} />;
  }

  // Dashboard para Coach
  if (isCoach()) {
    return <CoachDashboard userData={userData} />;
  }

  // Dashboard para Atleta
  return <AthleteDashboard userData={userData} />;
};

// ============ ADMIN DASHBOARD ============
const AdminDashboard = ({ stats, chartData, recentActivity }) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Miembros Activos"
          value={stats.activeMembers}
          change="+12%"
          changeType="positive"
          color="emerald"
        />
        <StatCard
          icon={Calendar}
          label="Clases Hoy"
          value={stats.classesToday}
          color="blue"
        />
        <StatCard
          icon={Activity}
          label="Asistencias Hoy"
          value={stats.attendanceToday}
          change="+8%"
          changeType="positive"
          color="orange"
        />
        <StatCard
          icon={DollarSign}
          label="Ingresos del Mes"
          value={formatCurrency(stats.monthlyRevenue)}
          change="+15%"
          changeType="positive"
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Chart */}
        <Card>
          <h3 className="font-semibold mb-4">Asistencias de la Semana</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAsist" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    background: '#1E293B', 
                    border: '1px solid #334155',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="asistencias" 
                  stroke="#10B981" 
                  fill="url(#colorAsist)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Revenue Chart */}
        <Card>
          <h3 className="font-semibold mb-4">Ingresos de la Semana</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(v) => `${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ 
                    background: '#1E293B', 
                    border: '1px solid #334155',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Bar dataKey="ingresos" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <h3 className="font-semibold mb-4">Actividad Reciente</h3>
          <div className="space-y-3">
            {recentActivity.map(activity => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </Card>

        {/* Quick Stats */}
        <Card>
          <h3 className="font-semibold mb-4">Resumen Rápido</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Miembros</span>
              <span className="font-semibold">{stats.totalMembers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Entrenadores</span>
              <span className="font-semibold">{stats.totalCoaches}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Clases Activas</span>
              <span className="font-semibold">{stats.totalClasses}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Pagos Pendientes</span>
              <span className="font-semibold text-orange-500">{stats.pendingPayments}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ============ COACH DASHBOARD ============
const CoachDashboard = ({ userData }) => {
  const todayClasses = [
    { id: 1, name: 'CrossFit', time: '08:00', enrolled: 12, capacity: 15 },
    { id: 2, name: 'CrossFit', time: '10:00', enrolled: 15, capacity: 15 },
    { id: 3, name: 'Funcional', time: '18:00', enrolled: 8, capacity: 12 },
    { id: 4, name: 'CrossFit', time: '19:30', enrolled: 14, capacity: 15 }
  ];

  const pendingValidations = [
    { id: 1, athlete: 'María García', exercise: 'Back Squat', value: '80kg' },
    { id: 2, athlete: 'Juan Pérez', exercise: 'Deadlift', value: '120kg' },
    { id: 3, athlete: 'Ana López', exercise: 'Clean', value: '55kg' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome */}
      <Card className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-emerald-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">¡Hola, {userData?.name?.split(' ')[0]}!</h2>
            <p className="text-gray-400">Tenés {todayClasses.length} clases programadas para hoy</p>
          </div>
          <Activity size={48} className="text-emerald-500 opacity-50" />
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Calendar}
          label="Clases Hoy"
          value={todayClasses.length}
          color="blue"
        />
        <StatCard
          icon={Users}
          label="Atletas Inscriptos"
          value={todayClasses.reduce((acc, c) => acc + c.enrolled, 0)}
          color="emerald"
        />
        <StatCard
          icon={CheckCircle}
          label="Resultados por Validar"
          value={pendingValidations.length}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Classes */}
        <Card>
          <h3 className="font-semibold mb-4">Mis Clases de Hoy</h3>
          <div className="space-y-3">
            {todayClasses.map(cls => (
              <div key={cls.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                    <Clock size={20} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-medium">{cls.name}</p>
                    <p className="text-sm text-gray-400">{cls.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{cls.enrolled}/{cls.capacity}</p>
                  <p className="text-sm text-gray-400">inscriptos</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Pending Validations */}
        <Card>
          <h3 className="font-semibold mb-4">Resultados por Validar</h3>
          <div className="space-y-3">
            {pendingValidations.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div>
                  <p className="font-medium">{item.athlete}</p>
                  <p className="text-sm text-gray-400">{item.exercise}: {item.value}</p>
                </div>
                <button className="btn btn-primary btn-sm">
                  Validar
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

// ============ ATHLETE DASHBOARD ============
const AthleteDashboard = ({ userData }) => {
  const myClasses = [
    { id: 1, name: 'CrossFit', time: '08:00', coach: 'Carlos Trainer' },
    { id: 2, name: 'Funcional', time: '18:00', coach: 'María Coach' }
  ];

  const recentPRs = [
    { id: 1, exercise: 'Back Squat', value: '85kg', date: '20/12/2024', improvement: '+5kg' },
    { id: 2, exercise: 'Deadlift', value: '110kg', date: '18/12/2024', improvement: '+10kg' },
    { id: 3, exercise: 'Clean', value: '60kg', date: '15/12/2024', improvement: '+5kg' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome */}
      <Card className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-emerald-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">¡Hola, {userData?.name?.split(' ')[0]}!</h2>
            <p className="text-gray-400">Seguí entrenando duro 💪</p>
          </div>
          <Trophy size={48} className="text-emerald-500 opacity-50" />
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Calendar}
          label="Clases este mes"
          value={18}
          color="blue"
        />
        <StatCard
          icon={Trophy}
          label="PRs este mes"
          value={5}
          color="orange"
        />
        <StatCard
          icon={TrendingUp}
          label="Racha actual"
          value="12 días"
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Classes Today */}
        <Card>
          <h3 className="font-semibold mb-4">Mis Clases de Hoy</h3>
          {myClasses.length > 0 ? (
            <div className="space-y-3">
              {myClasses.map(cls => (
                <div key={cls.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                      <Clock size={20} className="text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-medium">{cls.name}</p>
                      <p className="text-sm text-gray-400">{cls.time} - {cls.coach}</p>
                    </div>
                  </div>
                  <Badge variant="success">Inscripto</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No tenés clases programadas para hoy
            </p>
          )}
        </Card>

        {/* Recent PRs */}
        <Card>
          <h3 className="font-semibold mb-4">Mis Últimos PRs</h3>
          <div className="space-y-3">
            {recentPRs.map(pr => (
              <div key={pr.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                    <Trophy size={20} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="font-medium">{pr.exercise}</p>
                    <p className="text-sm text-gray-400">{pr.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{pr.value}</p>
                  <p className="text-sm text-emerald-500">{pr.improvement}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

// Activity Item Component
const ActivityItem = ({ activity }) => {
  const getActivityIcon = () => {
    switch (activity.type) {
      case 'checkin': return <CheckCircle size={16} className="text-emerald-500" />;
      case 'payment': return <DollarSign size={16} className="text-blue-500" />;
      case 'enrollment': return <Calendar size={16} className="text-orange-500" />;
      case 'pr': return <Trophy size={16} className="text-yellow-500" />;
      default: return <Activity size={16} className="text-gray-500" />;
    }
  };

  const getActivityText = () => {
    switch (activity.type) {
      case 'checkin': return `${activity.user} hizo check-in en ${activity.class}`;
      case 'payment': return `${activity.user} realizó un pago de ${formatCurrency(activity.amount)}`;
      case 'enrollment': return `${activity.user} se inscribió a ${activity.class}`;
      case 'pr': return `${activity.user} nuevo PR en ${activity.exercise}: ${activity.value}`;
      default: return activity.text;
    }
  };

  return (
    <div className="flex items-center gap-3 p-2 hover:bg-gray-800/50 rounded-lg transition-colors">
      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
        {getActivityIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{getActivityText()}</p>
      </div>
      <span className="text-xs text-gray-500">{activity.time}</span>
    </div>
  );
};

export default Dashboard;
