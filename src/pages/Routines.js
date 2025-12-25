import React, { useState, useEffect } from 'react';
import { Plus, ClipboardList, MoreVertical, Edit, Trash2, Users, User, Calendar } from 'lucide-react';
import { Button, Card, Modal, Input, Select, Textarea, SearchInput, EmptyState, LoadingState, ConfirmDialog, Badge, Dropdown, DropdownItem, Checkbox } from '../Common';
import { useAuth } from '../../contexts/AuthContext';
import { useGym } from '../../contexts/GymContext';
import { useToast } from '../../contexts/ToastContext';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ASSIGNMENT_TYPES } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';

const Routines = () => {
  const { canCreateRoutines } = useAuth();
  const { currentGym } = useGym();
  const { success, error: showError } = useToast();
  const [routines, setRoutines] = useState([]);
  const [classes, setClasses] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!currentGym?.id) { setLoading(false); return; }

    const unsubRoutines = onSnapshot(query(collection(db, 'routines'), where('gymId', '==', currentGym.id)), (snap) => {
      setRoutines(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    const unsubClasses = onSnapshot(query(collection(db, 'classes'), where('gymId', '==', currentGym.id)), (snap) => {
      setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubMembers = onSnapshot(query(collection(db, 'users'), where('gymId', '==', currentGym.id), where('role', '==', 'alumno')), (snap) => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubRoutines(); unsubClasses(); unsubMembers(); };
  }, [currentGym]);

  const filtered = routines.filter(r => r.name?.toLowerCase().includes(search.toLowerCase()));

  const handleSave = async (data) => {
    try {
      if (selected?.id) {
        await updateDoc(doc(db, 'routines', selected.id), { ...data, updatedAt: serverTimestamp() });
        success('Rutina actualizada');
      } else {
        await addDoc(collection(db, 'routines'), { ...data, gymId: currentGym.id, createdAt: serverTimestamp() });
        success('Rutina creada');
      }
      setShowModal(false);
      setSelected(null);
    } catch (err) {
      showError('Error al guardar');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'routines', selected.id));
      success('Rutina eliminada');
      setShowDelete(false);
      setSelected(null);
    } catch (err) {
      showError('Error al eliminar');
    }
  };

  const getClassName = (id) => classes.find(c => c.id === id)?.name || '';
  const getMemberNames = (ids) => {
    if (!ids || ids.length === 0) return '';
    const names = ids.map(id => members.find(m => m.id === id)?.name).filter(Boolean);
    return names.slice(0, 3).join(', ') + (names.length > 3 ? ` +${names.length - 3}` : '');
  };

  if (loading) return <LoadingState />;
  if (!currentGym) return <EmptyState icon={ClipboardList} title="Sin gimnasio" />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Rutinas</h1>
          <p className="text-gray-400">{routines.length} rutinas</p>
        </div>
        {canCreateRoutines() && <Button icon={Plus} onClick={() => { setSelected(null); setShowModal(true); }}>Nueva Rutina</Button>}
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Buscar rutina..." />

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No hay rutinas" action={canCreateRoutines() && <Button icon={Plus} onClick={() => setShowModal(true)}>Crear</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map(routine => (
            <Card key={routine.id} className="hover:border-emerald-500/30">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{routine.name}</h3>
                  <Badge variant={routine.assignmentType === 'class' ? 'info' : 'purple'}>
                    {routine.assignmentType === 'class' ? <><Calendar size={12} className="mr-1" /> Para Clase</> : <><User size={12} className="mr-1" /> Individual</>}
                  </Badge>
                </div>
                {canCreateRoutines() && (
                  <Dropdown trigger={<button className="p-2 hover:bg-gray-700 rounded-lg"><MoreVertical size={18} /></button>}>
                    <DropdownItem icon={Edit} onClick={() => { setSelected(routine); setShowModal(true); }}>Editar</DropdownItem>
                    <DropdownItem icon={Trash2} danger onClick={() => { setSelected(routine); setShowDelete(true); }}>Eliminar</DropdownItem>
                  </Dropdown>
                )}
              </div>
              {routine.description && <p className="text-sm text-gray-400 mb-3">{routine.description}</p>}
              <div className="text-sm text-gray-500">
                {routine.assignmentType === 'class' ? (
                  <span className="flex items-center gap-1"><Users size={14} /> {getClassName(routine.classId)}</span>
                ) : (
                  <span className="flex items-center gap-1"><User size={14} /> {getMemberNames(routine.memberIds)}</span>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-2">{formatDate(routine.createdAt)}</p>
            </Card>
          ))}
        </div>
      )}

      <RoutineModal isOpen={showModal} onClose={() => { setShowModal(false); setSelected(null); }} onSave={handleSave} routine={selected} classes={classes} members={members} />
      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete} title="Eliminar" message="¿Eliminar esta rutina?" confirmText="Eliminar" />
    </div>
  );
};

const RoutineModal = ({ isOpen, onClose, onSave, routine, classes, members }) => {
  const [form, setForm] = useState({ name: '', description: '', exercises: '', assignmentType: 'class', classId: '', memberIds: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm(routine ? {
      name: routine.name || '',
      description: routine.description || '',
      exercises: routine.exercises || '',
      assignmentType: routine.assignmentType || 'class',
      classId: routine.classId || '',
      memberIds: routine.memberIds || []
    } : { name: '', description: '', exercises: '', assignmentType: 'class', classId: '', memberIds: [] });
  }, [routine, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  const toggleMember = (id) => {
    setForm(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(id) ? prev.memberIds.filter(m => m !== id) : [...prev.memberIds, id]
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={routine ? 'Editar Rutina' : 'Nueva Rutina'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nombre *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <Textarea label="Descripción" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
        <Textarea label="Ejercicios / Detalle de la rutina" value={form.exercises} onChange={e => setForm({ ...form, exercises: e.target.value })} rows={4} placeholder="Ej: 3x10 Back Squat, 4x8 Bench Press..." />
        
        <Select label="Asignar a" value={form.assignmentType} onChange={e => setForm({ ...form, assignmentType: e.target.value, classId: '', memberIds: [] })} options={ASSIGNMENT_TYPES.map(a => ({ value: a.id, label: a.name }))} />
        
        {form.assignmentType === 'class' ? (
          <Select label="Clase" value={form.classId} onChange={e => setForm({ ...form, classId: e.target.value })} options={classes.map(c => ({ value: c.id, label: `${c.name} - ${c.startTime}` }))} placeholder="Seleccionar clase" />
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Seleccionar Alumnos</label>
            <div className="max-h-48 overflow-y-auto space-y-2 p-3 bg-gray-800/50 rounded-xl">
              {members.length === 0 ? (
                <p className="text-sm text-gray-500">No hay alumnos</p>
              ) : (
                members.map(m => (
                  <Checkbox key={m.id} label={m.name} checked={form.memberIds.includes(m.id)} onChange={() => toggleMember(m.id)} />
                ))
              )}
            </div>
            {form.memberIds.length > 0 && <p className="text-xs text-emerald-500 mt-1">{form.memberIds.length} seleccionados</p>}
          </div>
        )}
        
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
};

export default Routines;
