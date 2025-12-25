import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, Check, X, Clock, Trophy, Filter } from 'lucide-react';
import { Button, Card, Modal, Input, Select, SearchInput, EmptyState, LoadingState, Badge, Avatar, Tabs } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { PR_STATUS } from '../utils/constants';
import { getPRStatusColor, getPRStatusName, formatDate, formatTimeValue } from '../utils/helpers';

const PRs = () => {
  const { userData, canValidateRankings, isAlumno } = useAuth();
  const { currentGym } = useGym();
  const { success, error: showError } = useToast();
  const [prs, setPrs] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!currentGym?.id) { setLoading(false); return; }

    // Query basada en rol
    let prQuery;
    if (isAlumno()) {
      prQuery = query(collection(db, 'personalRecords'), where('userId', '==', userData.id), orderBy('createdAt', 'desc'));
    } else {
      prQuery = query(collection(db, 'personalRecords'), where('gymId', '==', currentGym.id), orderBy('createdAt', 'desc'));
    }

    const unsubPrs = onSnapshot(prQuery, (snap) => {
      setPrs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    const unsubExercises = onSnapshot(query(collection(db, 'exercises'), where('gymId', '==', currentGym.id)), (snap) => {
      setExercises(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    if (!isAlumno()) {
      const unsubUsers = onSnapshot(query(collection(db, 'users'), where('gymId', '==', currentGym.id)), (snap) => {
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => { unsubPrs(); unsubExercises(); unsubUsers(); };
    }

    return () => { unsubPrs(); unsubExercises(); };
  }, [currentGym, userData, isAlumno]);

  const filteredPrs = prs.filter(pr => {
    if (activeTab === 'all') return true;
    return pr.status === activeTab;
  });

  const handleSubmitPR = async (data) => {
    try {
      await addDoc(collection(db, 'personalRecords'), {
        ...data,
        userId: userData.id,
        userName: userData.name,
        gymId: currentGym.id,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      success('PR enviado para validación');
      setShowModal(false);
    } catch (err) {
      showError('Error al guardar');
    }
  };

  const handleValidate = async (pr, newStatus) => {
    try {
      await updateDoc(doc(db, 'personalRecords', pr.id), {
        status: newStatus,
        validatedBy: userData.id,
        validatedAt: serverTimestamp()
      });
      success(newStatus === 'validated' ? 'PR validado' : 'PR rechazado');
    } catch (err) {
      showError('Error al actualizar');
    }
  };

  const getExerciseName = (id) => exercises.find(e => e.id === id)?.name || 'Ejercicio';
  const getExerciseUnit = (id) => exercises.find(e => e.id === id)?.unit || 'kg';
  const getUserName = (id) => users.find(u => u.id === id)?.name || 'Usuario';

  const formatValue = (value, unit) => {
    if (unit === 'seconds' || unit === 'minutes') return formatTimeValue(value);
    return `${value} ${unit}`;
  };

  if (loading) return <LoadingState />;
  if (!currentGym) return <EmptyState icon={TrendingUp} title="Sin gimnasio" />;

  const tabs = isAlumno() 
    ? [{ id: 'all', label: 'Todos' }, { id: 'pending', label: 'Pendientes' }, { id: 'validated', label: 'Validados' }]
    : [{ id: 'pending', label: 'Por Validar', icon: Clock }, { id: 'validated', label: 'Validados', icon: Check }, { id: 'all', label: 'Todos' }];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{isAlumno() ? 'Mis PRs' : 'Marcas Personales'}</h1>
          <p className="text-gray-400">{prs.length} registros</p>
        </div>
        {isAlumno() && <Button icon={Plus} onClick={() => setShowModal(true)}>Registrar PR</Button>}
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {filteredPrs.length === 0 ? (
        <EmptyState icon={TrendingUp} title={activeTab === 'pending' ? 'No hay PRs pendientes' : 'No hay PRs'} action={isAlumno() && <Button icon={Plus} onClick={() => setShowModal(true)}>Registrar</Button>} />
      ) : (
        <div className="space-y-3">
          {filteredPrs.map(pr => (
            <Card key={pr.id} className="hover:border-emerald-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <Trophy className="text-emerald-500" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{getExerciseName(pr.exerciseId)}</h3>
                    {!isAlumno() && <p className="text-sm text-gray-400">{pr.userName || getUserName(pr.userId)}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl font-bold text-emerald-500">{formatValue(pr.value, getExerciseUnit(pr.exerciseId))}</span>
                      <Badge variant={getPRStatusColor(pr.status)}>{getPRStatusName(pr.status)}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{formatDate(pr.createdAt)}</span>
                  {canValidateRankings() && pr.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleValidate(pr, 'validated')} className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-500 rounded-lg">
                        <Check size={18} />
                      </button>
                      <button onClick={() => handleValidate(pr, 'rejected')} className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg">
                        <X size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {pr.notes && <p className="text-sm text-gray-400 mt-2">{pr.notes}</p>}
            </Card>
          ))}
        </div>
      )}

      <PRModal isOpen={showModal} onClose={() => setShowModal(false)} onSave={handleSubmitPR} exercises={exercises} />
    </div>
  );
};

const PRModal = ({ isOpen, onClose, onSave, exercises }) => {
  const [form, setForm] = useState({ exerciseId: '', value: '', notes: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm({ exerciseId: '', value: '', notes: '' });
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.exerciseId || !form.value) return;
    setLoading(true);
    await onSave({ ...form, value: parseFloat(form.value) });
    setLoading(false);
  };

  const selectedExercise = exercises.find(e => e.id === form.exerciseId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar PR">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select label="Ejercicio *" value={form.exerciseId} onChange={e => setForm({ ...form, exerciseId: e.target.value })} options={exercises.map(e => ({ value: e.id, label: e.name }))} placeholder="Seleccionar ejercicio" />
        
        <Input 
          label={`Valor (${selectedExercise?.unit || 'kg'}) *`} 
          type="number" 
          step="0.5"
          value={form.value} 
          onChange={e => setForm({ ...form, value: e.target.value })} 
          placeholder={selectedExercise?.unit === 'reps' ? '10' : '100'}
        />
        
        <Input label="Notas (opcional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Detalles adicionales..." />

        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-sm text-yellow-400">
          ⚠️ Tu PR será revisado por un profesor antes de aparecer en los rankings
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1">Enviar</Button>
        </div>
      </form>
    </Modal>
  );
};

export default PRs;
