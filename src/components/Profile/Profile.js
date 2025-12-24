import React, { useState, useEffect } from 'react';
import { User, Camera, TrendingUp, Trophy, Calendar, Scale, Ruler, Save, Edit2 } from 'lucide-react';
import { Card, Button, Input, Avatar, Badge, LoadingState, Modal, StatCard } from '../Common';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { doc, updateDoc, serverTimestamp, collection, query, where, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { ANTHROPOMETRY_FIELDS } from '../../utils/constants';
import { formatDate, calculateBMI, getBMICategory } from '../../utils/helpers';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Profile = () => {
  const { user, userData } = useAuth();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showAnthroModal, setShowAnthroModal] = useState(false);
  const [personalRecords, setPersonalRecords] = useState([]);
  const [anthropometryHistory, setAnthropometryHistory] = useState([]);
  
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    birthDate: '',
    emergencyContact: '',
    emergencyPhone: ''
  });

  const [anthroData, setAnthroData] = useState({
    weight: '',
    height: '',
    bodyFat: '',
    chest: '',
    waist: '',
    hips: '',
    bicepsLeft: '',
    bicepsRight: '',
    thighLeft: '',
    thighRight: ''
  });

  useEffect(() => {
    if (userData) {
      setProfileData({
        name: userData.name || '',
        phone: userData.phone || '',
        birthDate: userData.birthDate || '',
        emergencyContact: userData.emergencyContact || '',
        emergencyPhone: userData.emergencyPhone || ''
      });
      loadData();
    }
  }, [userData]);

  const loadData = async () => {
    try {
      // Cargar PRs
      const prsQuery = query(
        collection(db, 'personalRecords'),
        where('userId', '==', user.uid)
      );
      const prsSnapshot = await getDocs(prsQuery);
      setPersonalRecords(prsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Cargar historial antropométrico
      const anthroQuery = query(
        collection(db, 'anthropometry'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const anthroSnapshot = await getDocs(anthroQuery);
      setAnthropometryHistory(anthroSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...profileData,
        updatedAt: serverTimestamp()
      });
      success('Perfil actualizado');
      setEditing(false);
    } catch (err) {
      error(err.message);
    }
  };

  const handleSaveAnthropometry = async (e) => {
    e.preventDefault();
    try {
      const data = {};
      Object.keys(anthroData).forEach(key => {
        if (anthroData[key]) {
          data[key] = parseFloat(anthroData[key]);
        }
      });

      await addDoc(collection(db, 'anthropometry'), {
        userId: user.uid,
        ...data,
        createdAt: serverTimestamp()
      });
      
      success('Medidas guardadas');
      setShowAnthroModal(false);
      setAnthroData({});
      loadData();
    } catch (err) {
      error(err.message);
    }
  };

  const latestAnthro = anthropometryHistory[0] || {};
  const bmi = calculateBMI(latestAnthro.weight, latestAnthro.height);
  const bmiCategory = getBMICategory(bmi);

  // Preparar datos para el gráfico de peso
  const weightChartData = anthropometryHistory
    .slice(0, 10)
    .reverse()
    .map(entry => ({
      date: formatDate(entry.createdAt, 'dd/MM'),
      peso: entry.weight
    }));

  if (loading) return <LoadingState message="Cargando perfil..." />;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Profile Header */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10" />
        <div className="relative flex flex-col sm:flex-row items-center gap-6 p-6">
          <div className="relative">
            <Avatar name={userData?.name} src={userData?.photoURL} size="xl" />
            <button className="absolute bottom-0 right-0 p-2 bg-emerald-500 rounded-full hover:bg-emerald-600 transition-colors">
              <Camera size={16} />
            </button>
          </div>
          
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold">{userData?.name}</h1>
            <p className="text-gray-400">{userData?.email}</p>
            <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
              <Badge variant="success">Atleta</Badge>
              {userData?.subscriptionStatus === 'active' && (
                <Badge variant="info">Suscripción Activa</Badge>
              )}
            </div>
          </div>

          <Button 
            icon={editing ? Save : Edit2}
            onClick={() => editing ? handleSaveProfile() : setEditing(true)}
          >
            {editing ? 'Guardar' : 'Editar'}
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          icon={Calendar}
          label="Clases este mes"
          value={userData?.classesAttended || 0}
          color="blue"
        />
        <StatCard
          icon={Trophy}
          label="PRs registrados"
          value={personalRecords.length}
          color="orange"
        />
        <StatCard
          icon={Scale}
          label="Peso actual"
          value={latestAnthro.weight ? `${latestAnthro.weight} kg` : '-'}
          color="emerald"
        />
        <StatCard
          icon={TrendingUp}
          label="IMC"
          value={bmi ? bmi.toFixed(1) : '-'}
          color={bmiCategory.color === 'success' ? 'emerald' : 'orange'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Info */}
        <Card>
          <h3 className="font-semibold mb-4">Información Personal</h3>
          <div className="space-y-4">
            <Input
              label="Nombre completo"
              value={profileData.name}
              onChange={(e) => setProfileData({...profileData, name: e.target.value})}
              disabled={!editing}
            />
            <Input
              label="Teléfono"
              value={profileData.phone}
              onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
              disabled={!editing}
            />
            <Input
              label="Fecha de nacimiento"
              type="date"
              value={profileData.birthDate}
              onChange={(e) => setProfileData({...profileData, birthDate: e.target.value})}
              disabled={!editing}
            />
            <div className="pt-4 border-t border-gray-700">
              <h4 className="text-sm font-medium text-gray-400 mb-3">Contacto de Emergencia</h4>
              <div className="space-y-3">
                <Input
                  label="Nombre"
                  value={profileData.emergencyContact}
                  onChange={(e) => setProfileData({...profileData, emergencyContact: e.target.value})}
                  disabled={!editing}
                />
                <Input
                  label="Teléfono"
                  value={profileData.emergencyPhone}
                  onChange={(e) => setProfileData({...profileData, emergencyPhone: e.target.value})}
                  disabled={!editing}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Anthropometry */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Antropometría</h3>
            <Button size="sm" onClick={() => setShowAnthroModal(true)}>
              Registrar Medidas
            </Button>
          </div>

          {anthropometryHistory.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-800/50 rounded-xl text-center">
                  <Scale className="mx-auto text-emerald-500 mb-2" size={24} />
                  <p className="text-2xl font-bold">{latestAnthro.weight || '-'} kg</p>
                  <p className="text-sm text-gray-400">Peso</p>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-xl text-center">
                  <Ruler className="mx-auto text-blue-500 mb-2" size={24} />
                  <p className="text-2xl font-bold">{latestAnthro.height || '-'} cm</p>
                  <p className="text-sm text-gray-400">Altura</p>
                </div>
              </div>

              {weightChartData.length > 1 && (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} />
                      <YAxis stroke="#94A3B8" fontSize={12} domain={['dataMin - 2', 'dataMax + 2']} />
                      <Tooltip 
                        contentStyle={{ 
                          background: '#1E293B', 
                          border: '1px solid #334155',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="peso" 
                        stroke="#10B981" 
                        strokeWidth={2}
                        dot={{ fill: '#10B981' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Scale size={48} className="mx-auto mb-2 opacity-50" />
              <p>No hay medidas registradas</p>
              <Button size="sm" className="mt-4" onClick={() => setShowAnthroModal(true)}>
                Registrar ahora
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Personal Records */}
      <Card>
        <h3 className="font-semibold mb-4">Mis Records Personales (PRs)</h3>
        {personalRecords.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {personalRecords.map(pr => (
              <div key={pr.id} className="p-4 bg-gray-800/50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="text-yellow-500" size={18} />
                  <span className="font-medium">{pr.exerciseName || 'Ejercicio'}</span>
                </div>
                <p className="text-2xl font-bold">{pr.value} <span className="text-sm text-gray-400">{pr.unit}</span></p>
                <p className="text-xs text-gray-500 mt-1">{formatDate(pr.updatedAt)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Trophy size={48} className="mx-auto mb-2 opacity-50" />
            <p>Aún no tenés PRs registrados</p>
            <p className="text-sm mt-1">Completá rutinas para registrar tus marcas</p>
          </div>
        )}
      </Card>

      {/* Anthropometry Modal */}
      <Modal
        isOpen={showAnthroModal}
        onClose={() => setShowAnthroModal(false)}
        title="Registrar Medidas"
        size="lg"
      >
        <form onSubmit={handleSaveAnthropometry} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {ANTHROPOMETRY_FIELDS.slice(0, 6).map(field => (
              <Input
                key={field.id}
                label={`${field.name} (${field.unit})`}
                type="number"
                step="0.1"
                value={anthroData[field.id] || ''}
                onChange={(e) => setAnthroData({...anthroData, [field.id]: e.target.value})}
              />
            ))}
          </div>
          
          <details className="group">
            <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">
              Más medidas (opcional)
            </summary>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {ANTHROPOMETRY_FIELDS.slice(6).map(field => (
                <Input
                  key={field.id}
                  label={`${field.name} (${field.unit})`}
                  type="number"
                  step="0.1"
                  value={anthroData[field.id] || ''}
                  onChange={(e) => setAnthroData({...anthroData, [field.id]: e.target.value})}
                />
              ))}
            </div>
          </details>

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="secondary" onClick={() => setShowAnthroModal(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Guardar Medidas
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Profile;
