import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, Check, X, Clock, Trophy, Filter, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button, Card, Modal, Input, Select, SearchInput, EmptyState, LoadingState, Badge, Avatar, Tabs, Dropdown, DropdownItem, ConfirmDialog } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { PR_STATUS } from '../utils/constants';
import { getPRStatusColor, getPRStatusName, formatDate, formatTimeValue } from '../utils/helpers';

const PRs = () => {
  const { userData, canValidateRankings, isAlumno } = useAuth();
  const { currentGym } = useGym();
  const { success, error: showError } = useToast();
  
  const [prs, setPrs] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);

  const canEdit = canValidateRankings();

  useEffect(() => {
    if (!currentGym?.id) { setLoading(false); return; }

    let prsQuery;
    if (isAlumno()) {
      prsQuery = query(collection(db, 'prs'), where('gymId', '==', currentGym.id), where('userId', '==', userData.id));
    } else {
      prsQuery = query(collection(db, 'prs'), where('gymId', '==', currentGym.id));
    }

    const unsubPrs = onSnapshot(prsQuery, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      setPrs(items);
      setLoading(false);
    });

    const exQuery = query(collection(db, 'exercises'), where('gymId', '==', currentGym.id));
    const unsubEx = onSnapshot(exQuery, (snap) => setExercises(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { unsubPrs(); unsubEx(); };
  }, [currentGym, userData, isAlumno]);

  const getFilteredPRs = () => {
    let filtered = prs;
    if (activeTab === 'mine') filtered = filtered.filter(p => p.userId === userData.id);
    if (activeTab === 'pending') filtered = filtered.filter(p => p.status === 'pending');
    if (filterStatus !== 'all') filtered = filtered.filter(p => p.status === filterStatus);
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(p => p.exerciseName?.toLowerCase().includes(s) || p.userName?.toLowerCase().includes(s));
    }
    return filtered;
  };

  const handleSave = async (data) => {
    try {
      const exercise = exercises.find(e => e.id === data.exerciseId);
      const prData = {
        ...data,
        exerciseName: exercise?.name || '',
        unit: exercise?.unit || 'kg',
        gymId: currentGym.id,
        userId: userData.id,
        userName: userData.name,
        status: 'pending',
        updatedAt: serverTimestamp()
      };

      if (selected?.id) {
        await updateDoc(doc(db, 'prs', selected.id), prData);
        success('PR actualizado');
      } else {
        await addDoc(collection(db, 'prs'), { ...prData, createdAt: serverTimestamp() });
        success('PR registrado y pendiente de validación');
      }
      setShowModal(false);
      setSelected(null);
    } catch (err) {
      showError('Error al guardar');
    }
  };

  const handleValidate = async (pr, newStatus) => {
    try {
      await updateDoc(doc(db, 'prs', pr.id), {
        status: newStatus,
        validatedBy: userData.id,
        validatedByName: userData.name,
        validatedAt: serverTimestamp()
      });
      success(newStatus === 'validated' ? 'PR validado' : 'PR rechazado');
    } catch (err) {
      showError('Error al validar');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'prs', selected.id));
      success('PR eliminado');
      setShowDelete(false);
      setSelected(null);
    } catch (err) {
      showError('Error al eliminar');
    }
  };

  const filteredPRs = getFilteredPRs();
  const pendingCount = prs.filter(p => p.status === 'pending').length;

  if (loading) return <LoadingState />;
  if (!currentGym) return <EmptyState icon={TrendingUp} title="Sin gimnasio" />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Personal Records</h1>
          <p className="text-gray-400">{filteredPRs.length} registros</p>
        </div>
        <Button icon={Plus} onClick={() => { setSelected(null); setShowModal(true); }}>Registrar PR</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button onClick={() => setActiveTab('all')} className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${activeTab === 'all' ? 'bg-primary text-white' : 'bg-gray-800 hover:bg-gray-700'}`}>Todos</button>
        <button onClick={() => setActiveTab('mine')} className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${activeTab === 'mine' ? 'bg-primary text-white' : 'bg-gray-800 hover:bg-gray-700'}`}>Mis PRs</button>
        {canEdit && (
          <button onClick={() => setActiveTab('pending')} className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'pending' ? 'bg-primary text-white' : 'bg-gray-800 hover:bg-gray-700'}`}>
            Pendientes
            {pendingCount > 0 && <span className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full">{pendingCount}</span>}
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar ejercicio o usuario..." className="flex-1" />
        <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} options={[{ value: 'all', label: 'Todos los estados' }, ...PR_STATUS.map(s => ({ value: s.id, label: s.name }))]} className="w-full sm:w-48" />
      </div>

      {filteredPRs.length === 0 ? (
        <EmptyState icon={TrendingUp} title="No hay PRs" description={activeTab === 'pending' ? 'No hay PRs pendientes de validar' : 'Registrá tu primera marca personal'} action={<Button icon={Plus} onClick={() => setShowModal(true)}>Registrar PR</Button>} />
      ) : (
        <div className="space-y-3">
          {filteredPRs.map(pr => (
            <Card key={pr.id} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar name={pr.userName} size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{pr.exerciseName}</h3>
                    <Badge className={getPRStatusColor(pr.status)}>{getPRStatusName(pr.status)}</Badge>
                  </div>
                  <p className="text-sm text-gray-400">{pr.userName} • {formatDate(pr.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-2xl font-bold">{formatTimeValue(pr.value, pr.unit)}</p>
                  {pr.notes && <p className="text-xs text-gray-500">{pr.notes}</p>}
                </div>
                {canEdit && pr.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleValidate(pr, 'validated')} className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400"><Check size={18} /></button>
                    <button onClick={() => handleValidate(pr, 'rejected')} className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400"><X size={18} /></button>
                  </div>
                )}
                {(canEdit || pr.userId === userData.id) && (
                  <Dropdown trigger={<button className="p-2 hover:bg-gray-700 rounded-lg"><MoreVertical size={18} /></button>}>
                    <DropdownItem icon={Edit} onClick={() => { setSelected(pr); setShowModal(true); }}>Editar</DropdownItem>
                    <DropdownItem icon={Trash2} danger onClick={() => { setSelected(pr); setShowDelete(true); }}>Eliminar</DropdownItem>
                  </Dropdown>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <PRModal isOpen={showModal} onClose={() => { setShowModal(false); setSelected(null); }} onSave={handleSave} pr={selected} exercises={exercises} />
      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete} title="Eliminar PR" message="¿Eliminar este registro?" confirmText="Eliminar" />
    </div>
  );
};

const PRModal = ({ isOpen, onClose, onSave, pr, exercises }) => {
  const [form, setForm] = useState({ exerciseId: '', value: '', notes: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pr) {
      setForm({ exerciseId: pr.exerciseId || '', value: pr.value || '', notes: pr.notes || '' });
    } else {
      setForm({ exerciseId: '', value: '', notes: '' });
    }
  }, [pr, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.exerciseId || !form.value) return;
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  const selectedExercise = exercises.find(e => e.id === form.exerciseId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={pr ? 'Editar PR' : 'Registrar PR'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select label="Ejercicio *" value={form.exerciseId} onChange={e => setForm({ ...form, exerciseId: e.target.value })} options={exercises.map(ex => ({ value: ex.id, label: ex.name }))} required />
        <Input label={`Valor (${selectedExercise?.unit || 'kg'}) *`} type="number" step="0.1" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} placeholder="Ej: 100" required />
        <Input label="Notas" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Ej: Sin cinturón" />
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
};

export default PRs;
