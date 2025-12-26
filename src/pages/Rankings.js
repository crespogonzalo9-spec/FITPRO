import React, { useState, useEffect } from 'react';
import { Plus, Trophy, Crown, Medal, Award, MoreVertical, Edit, Trash2, Filter } from 'lucide-react';
import { Button, Card, Modal, Input, Select, SearchInput, EmptyState, LoadingState, ConfirmDialog, Badge, Avatar, Dropdown, DropdownItem } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs, orderBy, limit } from 'firebase/firestore';
import { RANKING_TYPES } from '../utils/constants';
import { formatDate, formatTimeValue } from '../utils/helpers';

const Rankings = () => {
  const { canCreateRankings } = useAuth();
  const { currentGym } = useGym();
  const { success, error: showError } = useToast();
  
  const [rankings, setRankings] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [wods, setWods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selected, setSelected] = useState(null);
  const [rankingEntries, setRankingEntries] = useState([]);

  const canEdit = canCreateRankings();

  useEffect(() => {
    if (!currentGym?.id) { setLoading(false); return; }

    const rankingsQuery = query(collection(db, 'rankings'), where('gymId', '==', currentGym.id));
    const unsubRankings = onSnapshot(rankingsQuery, (snap) => {
      setRankings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    const exQuery = query(collection(db, 'exercises'), where('gymId', '==', currentGym.id));
    const unsubEx = onSnapshot(exQuery, (snap) => setExercises(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    const wodQuery = query(collection(db, 'wods'), where('gymId', '==', currentGym.id));
    const unsubWod = onSnapshot(wodQuery, (snap) => setWods(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { unsubRankings(); unsubEx(); unsubWod(); };
  }, [currentGym]);

  const handleSave = async (data) => {
    try {
      if (selected?.id) {
        await updateDoc(doc(db, 'rankings', selected.id), { ...data, updatedAt: serverTimestamp() });
        success('Ranking actualizado');
      } else {
        await addDoc(collection(db, 'rankings'), { ...data, gymId: currentGym.id, createdAt: serverTimestamp() });
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

  const loadRankingEntries = async (ranking) => {
    setSelected(ranking);
    setShowView(true);
    try {
      const entriesQuery = query(
        collection(db, 'prs'),
        where('gymId', '==', currentGym.id),
        where('exerciseId', '==', ranking.exerciseId || ranking.wodId),
        where('status', '==', 'validated'),
        orderBy('value', ranking.sortOrder === 'asc' ? 'asc' : 'desc'),
        limit(20)
      );
      const snap = await getDocs(entriesQuery);
      setRankingEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      setRankingEntries([]);
    }
  };

  const getTypeName = (type) => RANKING_TYPES.find(t => t.id === type)?.name || type;
  
  const filteredRankings = rankings.filter(r => !search || r.name?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <LoadingState />;
  if (!currentGym) return <EmptyState icon={Trophy} title="Sin gimnasio" />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Rankings</h1>
          <p className="text-gray-400">{filteredRankings.length} rankings</p>
        </div>
        {canEdit && <Button icon={Plus} onClick={() => { setSelected(null); setShowModal(true); }}>Nuevo Ranking</Button>}
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Buscar ranking..." />

      {filteredRankings.length === 0 ? (
        <EmptyState icon={Trophy} title="No hay rankings" description="Los rankings muestran las mejores marcas validadas" action={canEdit && <Button icon={Plus} onClick={() => setShowModal(true)}>Crear</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRankings.map(ranking => (
            <Card key={ranking.id} className="cursor-pointer hover:border-gray-600" onClick={() => loadRankingEntries(ranking)}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                    <Trophy className="text-yellow-500" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{ranking.name}</h3>
                    <Badge className="mt-1 bg-gray-500/20 text-gray-400">{getTypeName(ranking.type)}</Badge>
                  </div>
                </div>
                {canEdit && (
                  <Dropdown trigger={<button onClick={e => e.stopPropagation()} className="p-2 hover:bg-gray-700 rounded-lg"><MoreVertical size={18} /></button>}>
                    <DropdownItem icon={Edit} onClick={() => { setSelected(ranking); setShowModal(true); }}>Editar</DropdownItem>
                    <DropdownItem icon={Trash2} danger onClick={() => { setSelected(ranking); setShowDelete(true); }}>Eliminar</DropdownItem>
                  </Dropdown>
                )}
              </div>
              {ranking.description && <p className="mt-3 text-sm text-gray-400">{ranking.description}</p>}
            </Card>
          ))}
        </div>
      )}

      <RankingModal isOpen={showModal} onClose={() => { setShowModal(false); setSelected(null); }} onSave={handleSave} ranking={selected} exercises={exercises} wods={wods} />
      <ViewRankingModal isOpen={showView} onClose={() => { setShowView(false); setSelected(null); setRankingEntries([]); }} ranking={selected} entries={rankingEntries} />
      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete} title="Eliminar" message={`¿Eliminar "${selected?.name}"?`} confirmText="Eliminar" />
    </div>
  );
};

const RankingModal = ({ isOpen, onClose, onSave, ranking, exercises, wods }) => {
  const [form, setForm] = useState({ name: '', type: 'exercise', exerciseId: '', wodId: '', sortOrder: 'desc', description: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ranking) {
      setForm({ name: ranking.name || '', type: ranking.type || 'exercise', exerciseId: ranking.exerciseId || '', wodId: ranking.wodId || '', sortOrder: ranking.sortOrder || 'desc', description: ranking.description || '' });
    } else {
      setForm({ name: '', type: 'exercise', exerciseId: '', wodId: '', sortOrder: 'desc', description: '' });
    }
  }, [ranking, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={ranking ? 'Editar Ranking' : 'Nuevo Ranking'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nombre *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Back Squat 1RM" required />
        <Select label="Tipo" value={form.type} onChange={e => setForm({ ...form, type: e.target.value, exerciseId: '', wodId: '' })} options={RANKING_TYPES.map(t => ({ value: t.id, label: t.name }))} />
        {form.type === 'exercise' && (
          <Select label="Ejercicio" value={form.exerciseId} onChange={e => setForm({ ...form, exerciseId: e.target.value })} options={exercises.map(ex => ({ value: ex.id, label: ex.name }))} />
        )}
        {form.type === 'wod' && (
          <Select label="WOD" value={form.wodId} onChange={e => setForm({ ...form, wodId: e.target.value })} options={wods.map(w => ({ value: w.id, label: w.name }))} />
        )}
        <Select label="Orden" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: e.target.value })} options={[{ value: 'desc', label: 'Mayor es mejor (peso, reps)' }, { value: 'asc', label: 'Menor es mejor (tiempo)' }]} />
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
};

const ViewRankingModal = ({ isOpen, onClose, ranking, entries }) => {
  if (!ranking) return null;
  const getMedalIcon = (pos) => {
    if (pos === 0) return <Crown className="text-yellow-500" size={20} />;
    if (pos === 1) return <Medal className="text-gray-400" size={20} />;
    if (pos === 2) return <Award className="text-orange-600" size={20} />;
    return <span className="text-gray-500 w-5 text-center">{pos + 1}</span>;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={ranking.name} size="lg">
      <div className="space-y-4">
        {entries.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No hay marcas validadas aún</p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, idx) => (
              <div key={entry.id} className={`flex items-center gap-4 p-3 rounded-xl ${idx < 3 ? 'bg-gray-800' : 'bg-gray-800/50'}`}>
                {getMedalIcon(idx)}
                <Avatar name={entry.userName} size="sm" />
                <div className="flex-1">
                  <p className="font-medium">{entry.userName}</p>
                  <p className="text-xs text-gray-500">{formatDate(entry.createdAt)}</p>
                </div>
                <p className="font-bold text-lg">{formatTimeValue(entry.value, entry.unit)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default Rankings;
