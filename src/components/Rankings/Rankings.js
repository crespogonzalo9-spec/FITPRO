import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, TrendingUp, Filter, ChevronDown } from 'lucide-react';
import { Card, Select, LoadingState, EmptyState, Avatar, Badge } from '../Common';
import { useGym } from '../../contexts/GymContext';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { EXERCISE_TYPES, DEFAULT_EXERCISES } from '../../utils/constants';

const Rankings = () => {
  const { currentGym } = useGym();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [rankings, setRankings] = useState([]);
  const [exercises, setExercises] = useState([]);

  useEffect(() => {
    loadExercises();
  }, [currentGym]);

  useEffect(() => {
    if (selectedExercise) {
      loadRankings();
    }
  }, [selectedExercise, selectedPeriod]);

  const loadExercises = async () => {
    if (!currentGym?.id) {
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'exercises'),
        where('gymId', '==', currentGym.id)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExercises(data);
      
      if (data.length > 0) {
        setSelectedExercise(data[0].id);
      }
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRankings = async () => {
    // Simular datos de ranking para demo
    // En producción, esto vendría de Firebase con resultados validados
    setRankings([
      { id: 1, rank: 1, userId: '1', name: 'Carlos Martínez', value: 140, unit: 'kg', date: '20/12/2024', validated: true },
      { id: 2, rank: 2, userId: '2', name: 'Juan Pérez', value: 135, unit: 'kg', date: '19/12/2024', validated: true },
      { id: 3, rank: 3, userId: '3', name: 'María García', value: 130, unit: 'kg', date: '18/12/2024', validated: true },
      { id: 4, rank: 4, userId: '4', name: 'Ana López', value: 125, unit: 'kg', date: '17/12/2024', validated: true },
      { id: 5, rank: 5, userId: '5', name: 'Pedro Ruiz', value: 120, unit: 'kg', date: '16/12/2024', validated: true },
      { id: 6, rank: 6, userId: '6', name: 'Laura Torres', value: 115, unit: 'kg', date: '15/12/2024', validated: true },
      { id: 7, rank: 7, userId: user?.uid, name: 'Tú', value: 110, unit: 'kg', date: '14/12/2024', validated: true },
      { id: 8, rank: 8, userId: '8', name: 'Diego Fernández', value: 105, unit: 'kg', date: '13/12/2024', validated: true },
      { id: 9, rank: 9, userId: '9', name: 'Sofia Díaz', value: 100, unit: 'kg', date: '12/12/2024', validated: true },
      { id: 10, rank: 10, userId: '10', name: 'Martín González', value: 95, unit: 'kg', date: '11/12/2024', validated: true }
    ]);
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Crown className="text-yellow-500" size={24} />;
      case 2: return <Medal className="text-gray-400" size={24} />;
      case 3: return <Medal className="text-orange-600" size={24} />;
      default: return <span className="text-lg font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getRankStyle = (rank) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-yellow-500/30';
      case 2: return 'bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-gray-400/30';
      case 3: return 'bg-gradient-to-r from-orange-600/20 to-orange-700/10 border-orange-600/30';
      default: return '';
    }
  };

  if (loading) return <LoadingState message="Cargando rankings..." />;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="text-yellow-500" />
            Rankings
          </h2>
          <p className="text-gray-400">Competí con tus compañeros y superá tus marcas</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <Select
            label="Ejercicio"
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            options={exercises.map(ex => ({ value: ex.id, label: ex.name }))}
            className="flex-1"
          />
          <Select
            label="Período"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            options={[
              { value: 'all', label: 'Todos los tiempos' },
              { value: 'month', label: 'Este mes' },
              { value: 'week', label: 'Esta semana' },
              { value: 'today', label: 'Hoy' }
            ]}
            className="w-48"
          />
        </div>
      </Card>

      {/* Podium for Top 3 */}
      {rankings.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* 2nd Place */}
          <div className="order-1">
            <Card className="text-center mt-8 bg-gradient-to-b from-gray-400/10 to-transparent border-gray-400/30">
              <div className="relative -mt-12 mb-4">
                <Avatar name={rankings[1].name} size="xl" className="mx-auto ring-4 ring-gray-400" />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center font-bold text-slate-900">
                  2
                </div>
              </div>
              <h3 className="font-semibold">{rankings[1].name}</h3>
              <p className="text-2xl font-bold text-gray-300">{rankings[1].value} {rankings[1].unit}</p>
            </Card>
          </div>

          {/* 1st Place */}
          <div className="order-2">
            <Card className="text-center bg-gradient-to-b from-yellow-500/20 to-transparent border-yellow-500/30">
              <Crown className="mx-auto text-yellow-500 mb-2" size={32} />
              <div className="relative -mt-4 mb-4">
                <Avatar name={rankings[0].name} size="xl" className="mx-auto ring-4 ring-yellow-500" />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center font-bold text-slate-900">
                  1
                </div>
              </div>
              <h3 className="font-semibold text-lg">{rankings[0].name}</h3>
              <p className="text-3xl font-bold text-yellow-500">{rankings[0].value} {rankings[0].unit}</p>
            </Card>
          </div>

          {/* 3rd Place */}
          <div className="order-3">
            <Card className="text-center mt-12 bg-gradient-to-b from-orange-600/10 to-transparent border-orange-600/30">
              <div className="relative -mt-12 mb-4">
                <Avatar name={rankings[2].name} size="xl" className="mx-auto ring-4 ring-orange-600" />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center font-bold text-slate-900">
                  3
                </div>
              </div>
              <h3 className="font-semibold">{rankings[2].name}</h3>
              <p className="text-2xl font-bold text-orange-500">{rankings[2].value} {rankings[2].unit}</p>
            </Card>
          </div>
        </div>
      )}

      {/* Full Ranking List */}
      <Card>
        <h3 className="font-semibold mb-4">Ranking Completo</h3>
        
        {rankings.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="Sin resultados"
            description="Aún no hay resultados validados para este ejercicio"
          />
        ) : (
          <div className="space-y-2">
            {rankings.map((entry) => (
              <div
                key={entry.id}
                className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
                  entry.userId === user?.uid
                    ? 'bg-emerald-500/10 border border-emerald-500/30'
                    : getRankStyle(entry.rank) || 'hover:bg-gray-800/50'
                }`}
              >
                <div className="w-10 flex justify-center">
                  {getRankIcon(entry.rank)}
                </div>
                
                <Avatar name={entry.name} size="md" />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {entry.userId === user?.uid ? 'Tú' : entry.name}
                    </span>
                    {entry.validated && (
                      <Badge variant="success" className="text-xs">Validado</Badge>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">{entry.date}</span>
                </div>

                <div className="text-right">
                  <p className="text-xl font-bold">
                    {entry.value} <span className="text-sm text-gray-400">{entry.unit}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Your Stats */}
      <Card>
        <h3 className="font-semibold mb-4">Tu posición</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-800/50 rounded-xl">
            <p className="text-3xl font-bold text-emerald-500">#7</p>
            <p className="text-sm text-gray-400">Posición actual</p>
          </div>
          <div className="text-center p-4 bg-gray-800/50 rounded-xl">
            <p className="text-3xl font-bold">110 kg</p>
            <p className="text-sm text-gray-400">Tu mejor marca</p>
          </div>
          <div className="text-center p-4 bg-gray-800/50 rounded-xl">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="text-emerald-500" size={20} />
              <p className="text-3xl font-bold text-emerald-500">+2</p>
            </div>
            <p className="text-sm text-gray-400">vs. semana pasada</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Rankings;
