import React, { useState, useEffect } from 'react';
import { Plus, Dumbbell, MoreVertical, Edit, Trash2, Play } from 'lucide-react';
import { Button, Card, Modal, Input, Select, Textarea, SearchInput, EmptyState, LoadingState, ConfirmDialog, Badge, Dropdown, DropdownItem } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { EXERCISE_TYPES, MUSCLE_GROUPS, MEASUREMENT_UNITS } from '../utils/constants';

const Exercises = () => {
  const { canManageExercises } = useAuth();
  const { currentGym } = useGym();
  const { success, error: showError } = useToast();
  
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);

  const canEdit = canManageExercises();

  useEffect(() => {
    if (!currentGym?.id) { setLoading(false); return; }
    const q = query(collection(db, 'exercises'), where('gymId', '==', currentGym.id));
    const unsubscribe = onSnapshot(q, (snap) => {
      setExercises(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentGym]);

  const getFilteredExercises = () => {
    let filtered = exercises;
    if (filterType !== 'all') filtered = filtered.filter(e => e.type === filterType);
    if (search) filtered = filtered.filter(e => e.name?.toLowerCase().includes(search.toLowerCase()));
    return filtered;
  };

  const handleSave = async (data) => {
    try {
      if (selected?.id) {
        await updateDoc(doc(db, 'exercises', selected.id), { ...data, updatedAt: serverTimestamp() });
        success('Ejercicio actualizado');
      } else {
        await addDoc(collection(db, 'exercises'), { ...data, gymId: currentGym.id, createdAt: serverTimestamp() });
        success('Ejercicio creado');
      }
      setShowModal(false);
      setSelected(null);
    } catch (err) {
      showError('Error al guardar');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'exercises', selected.id));
      success('Ejercicio eliminado');
      setShowDelete(false);
      setSelected(null);
    } catch (err) {
      showError('Error al eliminar');
    }
  };

  const filteredExercises = getFilteredExercises();
  const getTypeName = (type) => EXERCISE_TYPES.find(t => t.id === type)?.name || type;

  if (loading) return <LoadingState />;
  if (!currentGym) return <EmptyState icon={Dumbbell} title="Sin gimnasio" />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Ejercicios</h1>
          <p className="text-gray-400">{filteredExercises.length} ejercicios</p>
        </div>
        {canEdit && <Button icon={Plus} onClick={() => { setSelected(null); setShowModal(true); }}>Nuevo Ejercicio</Button>}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar ejercicio..." className="flex-1" />
        <Select value={filterType} onChange={e => setFilterType(e.target.value)} options={[{ value: 'all', label: 'Todos' }, ...EXERCISE_TYPES.map(t => ({ value: t.id, label: t.name }))]} className="w-full sm:w-48" />
      </div>

      {filteredExercises.length === 0 ? (
        <EmptyState icon={Dumbbell} title="No hay ejercicios" action={canEdit && <Button icon={Plus} onClick={() => setShowModal(true)}>Crear</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredExercises.map(ex => (
            <Card key={ex.id}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <Dumbbell className="text-emerald-500" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{ex.name}</h3>
                    <Badge className="mt-1 bg-gray-500/20 text-gray-400">{getTypeName(ex.type)}</Badge>
                  </div>
                </div>
                {canEdit && (
                  <Dropdown trigger={<button className="p-2 hover:bg-gray-700 rounded-lg"><MoreVertical size={18} /></button>}>
                    <DropdownItem icon={Edit} onClick={() => { setSelected(ex); setShowModal(true); }}>Editar</DropdownItem>
                    <DropdownItem icon={Trash2} danger onClick={() => { setSelected(ex); setShowDelete(true); }}>Eliminar</DropdownItem>
                  </Dropdown>
                )}
              </div>
              {ex.videoUrl && (
                <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center gap-2 text-sm text-primary hover:underline">
                  <Play size={14} /> Ver video
                </a>
              )}
            </Card>
          ))}
        </div>
      )}

      <ExerciseModal isOpen={showModal} onClose={() => { setShowModal(false); setSelected(null); }} onSave={handleSave} exercise={selected} />
      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete} title="Eliminar" message={`¿Eliminar "${selected?.name}"?`} confirmText="Eliminar" />
    </div>
  );
};

const ExerciseModal = ({ isOpen, onClose, onSave, exercise }) => {
  const [form, setForm] = useState({ name: '', type: 'strength', muscles: [], unit: 'kg', videoUrl: '', description: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (exercise) {
      setForm({ name: exercise.name || '', type: exercise.type || 'strength', muscles: exercise.muscles || [], unit: exercise.unit || 'kg', videoUrl: exercise.videoUrl || '', description: exercise.description || '' });
    } else {
      setForm({ name: '', type: 'strength', muscles: [], unit: 'kg', videoUrl: '', description: '' });
    }
  }, [exercise, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={exercise ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nombre *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Tipo" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} options={EXERCISE_TYPES.map(t => ({ value: t.id, label: t.name }))} />
          <Select label="Unidad" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} options={MEASUREMENT_UNITS.map(u => ({ value: u.id, label: u.name }))} />
        </div>
        <Input label="URL Video (YouTube)" value={form.videoUrl} onChange={e => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://youtube.com/..." />
        <Textarea label="Descripción" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
};

export default Exercises;
