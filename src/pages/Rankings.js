import React, { useState, useEffect } from 'react';
import { Plus, Trophy, Crown, Medal, Award, MoreVertical, Edit, Trash2, Filter } from 'lucide-react';
import { Button, Card, Modal, Input, Select, SearchInput, EmptyState, LoadingState, ConfirmDialog, Badge, Avatar, Dropdown, DropdownItem } from '../Common';
import { useAuth } from '../../contexts/AuthContext';
import { useGym } from '../../contexts/GymContext';
import { useToast } from '../../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs, orderBy, limit } from 'firebase/firestore';
import { RANKING_TYPES } from '../../utils/constants';
import { formatDate, formatTimeValue } from '../../utils/helpers';

const Rankings = () => {
  const { canCreateRankings } = useAuth();
  const { currentGym } = useGym();
  const { success, error: showError } = useToast();
  const [rankings, setRankings] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [wods, setWods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [selected, setSelected] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);

  useEffect(() => {
    if (!currentGym?.id) { setLoading(false); return; }

    const unsubRankings = onSnapshot(query(collection(db, 'rankings'), where('gymId', '==', currentGym.id)), (snap) => {
      setRankings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    const unsubExercises = onSnapshot(query(collection(db, 'exercises'), where('gymId', '==', currentGym.id)), (snap) => {
      setExercises(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubWods = onSnapshot(query(collection(db, 'wods'), where('gymId', '==', currentGym.id)), (snap) => {
      setWods(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubRankings(); unsubExercises(); unsubWods(); };
  }, [currentGym]);

  const handleSave = async (data) => {
    try {
      if (selected?.id) {
        await updateDoc(doc(db, 'rankings', selected.id), { ...data, updatedAt: serverTimestamp() });
        success('Ranking actualizado');
      } else {
        await addDoc(collection(db, 'rankings'), { ...data, gymId: currentGym.id, isActive: true, createdAt: serverTimestamp() });
        success('Ranking creado');
      }
      setShowModal(false);
      setSelected(null);
    } catch (err) {
      showError('Error al guardar');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'rankings', selected.id));
      success('Ranking eliminado');
      setShowDelete(false);
      setSelected(null);
    } catch (err) {
      showError('Error al eliminar');
    }
  };

  const viewLeaderboard = async (ranking) => {
    setSelected(ranking);
    setLeaderboardData([]);
    setShowLeaderboard(true);

    try {
      // Obtener PRs validados para este ejercicio/wod
      let q;
      if (ranking.type === 'exercise') {
        q = query(
          collection(db, 'personalRecords'),
          where('gymId', '==', currentGym.id),
          where('exerciseId', '==', ranking.exerciseId),
          where('status', '==', 'validated'),
          orderBy('value', ranking.sortOrder === 'asc' ? 'asc' : 'desc'),
          limit(20)
        );
      } else if (ranking.type === 'wod') {
        q = query(
          collection(db, 'wodResults'),
          where('gymId', '==', currentGym.id),
          where('wodId', '==', ranking.wodId),
          where('status', '==', 'validated'),
          orderBy('value', ranking.sortOrder === 'asc' ? 'asc' : 'desc'),
          limit(20)
        );
      }

      if (q) {
        const snap = await getDocs(q);
        const data = snap.docs.map((d, idx) => ({ id: d.id, rank: idx + 1, ...d.data() }));
        setLeaderboardData(data);
      }
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    }
  };

  const getExerciseName = (id) => exercises.find(e => e.id === id)?.name || 'Ejercicio';
  const getWodName = (id) => wods.find(w => w.id === id)?.name || 'WOD';
  const getTypeName = (type) => RANKING_TYPES.find(t => t.id === type)?.name || type;

  if (loading) return <LoadingState />;
  if (!currentGym) return <EmptyState icon={Trophy} title="Sin gimnasio" />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Rankings</h1>
          <p className="text-gray-400">{rankings.length} rankings activos</p>
        </div>
        {canCreateRankings() && <Button icon={Plus} onClick={() => { setSelected(null); setShowModal(true); }}>Nuevo Ranking</Button>}
      </div>

      {rankings.length === 0 ? (
        <EmptyState icon={Trophy} title="No hay rankings" description="Los rankings muestran las mejores marcas validadas" action={canCreateRankings() && <Button icon={Plus} onClick={() => setShowModal(true)}>Crear</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rankings.map(ranking => (
            <Card key={ranking.id} hover onClick={() => viewLeaderboard(ranking)}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                    <Trophy className="text-yellow-500" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{ranking.name}</h3>
                    <Badge variant="info">{getTypeName(ranking.type)}</Badge>
                  </div>
                </div>
                {canCreateRankings() && (
                  <Dropdown trigger={<button onClick={e => e.stopPropagation()} className="p-2 hover:bg-gray-700 rounded-lg"><MoreVertical size={18} /></button>}>
                    <DropdownItem icon={Edit} onClick={() => { setSelected(ranking); setShowModal(true); }}>Editar</DropdownItem>
                    <DropdownItem icon={Trash2} danger onClick={() => { setSelected(ranking); setShowDelete(true); }}>Eliminar</DropdownItem>
                  </Dropdown>
                )}
              </div>
              <p className="text-sm text-gray-400">
                {ranking.type === 'exercise' ? getExerciseName(ranking.exerciseId) : getWodName(ranking.wodId)}
              </p>
              <p className="text-xs text-gray-500 mt-2">Click para ver leaderboard</p>
            </Card>
          ))}
        </div>
      )}

      <RankingModal isOpen={showModal} onClose={() => { setShowModal(false); setSelected(null); }} onSave={handleSave} ranking={selected} exercises={exercises} wods={wods} />
      <LeaderboardModal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} ranking={selected} data={leaderboardData} />
      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete} title="Eliminar" message="¿Eliminar este ranking?" confirmText="Eliminar" />
    </div>
  );
};

const RankingModal = ({ isOpen, onClose, onSave, ranking, exercises, wods }) => {
  const [form, setForm] = useState({ name: '', type: 'exercise', exerciseId: '', wodId: '', sortOrder: 'desc', description: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm(ranking ? {
      name: ranking.name || '',
      type: ranking.type || 'exercise',
      exerciseId: ranking.exerciseId || '',
      wodId: ranking.wodId || '',
      sortOrder: ranking.sortOrder || 'desc',
      description: ranking.description || ''
    } : { name: '', type: 'exercise', exerciseId: '', wodId: '', sortOrder: 'desc', description: '' });
  }, [ranking, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={ranking ? 'Editar Ranking' : 'Nuevo Ranking'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nombre *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Ranking Back Squat 1RM" required />
        
        <Select label="Tipo de Ranking" value={form.type} onChange={e => setForm({ ...form, type: e.target.value, exerciseId: '', wodId: '' })} options={RANKING_TYPES.map(t => ({ value: t.id, label: t.name }))} />

        {form.type === 'exercise' && (
          <Select label="Ejercicio" value={form.exerciseId} onChange={e => setForm({ ...form, exerciseId: e.target.value })} options={exercises.map(e => ({ value: e.id, label: e.name }))} placeholder="Seleccionar ejercicio" />
        )}

        {form.type === 'wod' && (
          <Select label="WOD" value={form.wodId} onChange={e => setForm({ ...form, wodId: e.target.value })} options={wods.map(w => ({ value: w.id, label: w.name }))} placeholder="Seleccionar WOD" />
        )}

        <Select label="Orden" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: e.target.value })} options={[
          { value: 'desc', label: 'Mayor es mejor (peso, reps)' },
          { value: 'asc', label: 'Menor es mejor (tiempo)' }
        ]} />

        <Input label="Descripción (opcional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
};

const LeaderboardModal = ({ isOpen, onClose, ranking, data }) => {
  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="text-yellow-500" size={24} />;
    if (rank === 2) return <Medal className="text-gray-400" size={24} />;
    if (rank === 3) return <Award className="text-orange-600" size={24} />;
    return <span className="w-6 h-6 flex items-center justify-center font-bold text-gray-500">{rank}</span>;
  };

  const getRankStyle = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30';
    if (rank === 2) return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30';
    if (rank === 3) return 'bg-gradient-to-r from-orange-600/20 to-orange-700/20 border-orange-600/30';
    return 'bg-gray-800/50';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={ranking?.name || 'Leaderboard'} size="lg">
      {data.length === 0 ? (
        <EmptyState icon={Trophy} title="Sin registros" description="Aún no hay marcas validadas para este ranking" />
      ) : (
        <div className="space-y-2">
          {data.map(entry => (
            <div key={entry.id} className={`flex items-center justify-between p-3 rounded-xl border ${getRankStyle(entry.rank)}`}>
              <div className="flex items-center gap-4">
                <div className="w-8 flex justify-center">{getRankIcon(entry.rank)}</div>
                <Avatar name={entry.userName} size="sm" />
                <div>
                  <p className="font-medium">{entry.userName}</p>
                  <p className="text-xs text-gray-400">{formatDate(entry.createdAt)}</p>
                </div>
              </div>
              <span className="font-bold text-lg">{entry.value} {entry.unit || 'kg'}</span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default Rankings;
