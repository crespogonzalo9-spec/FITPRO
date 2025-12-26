import React, { useState, useEffect } from 'react';
import { Plus, ClipboardList, MoreVertical, Edit, Trash2, Users, Lock, User, Eye, Dumbbell, Play } from 'lucide-react';
import { Button, Card, Modal, Input, Select, Textarea, SearchInput, EmptyState, LoadingState, ConfirmDialog, Badge, Dropdown, DropdownItem, Avatar } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

const Routines = () => {
  const { userData, canCreateRoutines, isAlumno } = useAuth();
  const { currentGym } = useGym();
  const { success, error: showError } = useToast();
  
  const [routines, setRoutines] = useState([]);
  const [classes, setClasses] = useState([]);
  const [members, setMembers] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selected, setSelected] = useState(null);

  const canEdit = canCreateRoutines();

  useEffect(() => {
    if (!currentGym?.id) { setLoading(false); return; }

    const routinesQuery = query(collection(db, 'routines'), where('gymId', '==', currentGym.id));
    const unsubRoutines = onSnapshot(routinesQuery, (snap) => {
      setRoutines(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    const classesQuery = query(collection(db, 'classes'), where('gymId', '==', currentGym.id));
    const unsubClasses = onSnapshot(classesQuery, (snap) => {
      setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const exQuery = query(collection(db, 'exercises'), where('gymId', '==', currentGym.id));
    const unsubEx = onSnapshot(exQuery, (snap) => {
      setExercises(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    if (canEdit) {
      const membersQuery = query(collection(db, 'users'), where('gymId', '==', currentGym.id), where('role', '==', 'alumno'));
      const unsubMembers = onSnapshot(membersQuery, (snap) => {
        setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => { unsubRoutines(); unsubClasses(); unsubEx(); unsubMembers(); };
    }

    if (isAlumno() && userData?.id) {
      const enrollQuery = query(collection(db, 'enrollments'), where('userId', '==', userData.id));
      const unsubEnroll = onSnapshot(enrollQuery, (snap) => {
        setMyEnrollments(snap.docs.map(d => d.data().classId));
      });
      return () => { unsubRoutines(); unsubClasses(); unsubEx(); unsubEnroll(); };
    }

    return () => { unsubRoutines(); unsubClasses(); unsubEx(); };
  }, [currentGym, userData, canEdit, isAlumno]);

  const getVisibleRoutines = () => {
    let visible = routines;

    if (isAlumno()) {
      visible = routines.filter(r => {
        if (r.assignmentType === 'individual' && r.memberIds?.includes(userData.id)) return true;
        if (r.assignmentType === 'class' && myEnrollments.includes(r.classId)) return true;
        if (!r.assignmentType || r.assignmentType === 'general') return true;
        return false;
      });
    }

    if (filter !== 'all') visible = visible.filter(r => r.assignmentType === filter);
    if (search) visible = visible.filter(r => r.name?.toLowerCase().includes(search.toLowerCase()));

    return visible;
  };

  const handleSave = async (data) => {
    try {
      const routineData = { ...data, gymId: currentGym.id, updatedAt: serverTimestamp() };

      if (selected?.id) {
        await updateDoc(doc(db, 'routines', selected.id), routineData);
        success('Rutina actualizada');
      } else {
        await addDoc(collection(db, 'routines'), { ...routineData, createdBy: userData.id, createdByName: userData.name, createdAt: serverTimestamp() });
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

  const getClassName = (classId) => classes.find(c => c.id === classId)?.name || 'Sin clase';
  const getMemberNames = (memberIds) => {
    if (!memberIds || memberIds.length === 0) return '';
    const names = memberIds.map(id => members.find(m => m.id === id)?.name).filter(Boolean);
    return names.length <= 2 ? names.join(', ') : `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
  };

  const visibleRoutines = getVisibleRoutines();

  if (loading) return <LoadingState />;
  if (!currentGym) return <EmptyState icon={ClipboardList} title="Sin gimnasio" />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Rutinas</h1>
          <p className="text-gray-400">{visibleRoutines.length} rutinas</p>
        </div>
        {canEdit && <Button icon={Plus} onClick={() => { setSelected(null); setShowModal(true); }}>Nueva Rutina</Button>}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar rutina..." className="flex-1" />
        <Select value={filter} onChange={e => setFilter(e.target.value)} options={[{ value: 'all', label: 'Todas' }, { value: 'general', label: 'Generales' }, { value: 'class', label: 'Para Clases' }, { value: 'individual', label: 'Individuales' }]} className="w-full sm:w-48" />
      </div>

      {visibleRoutines.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No hay rutinas" action={canEdit && <Button icon={Plus} onClick={() => setShowModal(true)}>Crear Rutina</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleRoutines.map(routine => (
            <Card key={routine.id} className="cursor-pointer hover:border-gray-600" onClick={() => { setSelected(routine); setShowView(true); }}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <ClipboardList className="text-blue-500" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{routine.name}</h3>
                    <p className="text-sm text-gray-400">{routine.exercises?.length || 0} ejercicios</p>
                  </div>
                </div>
                {canEdit && (
                  <Dropdown trigger={<button onClick={e => e.stopPropagation()} className="p-2 hover:bg-gray-700 rounded-lg"><MoreVertical size={18} /></button>}>
                    <DropdownItem icon={Edit} onClick={() => { setSelected(routine); setShowModal(true); }}>Editar</DropdownItem>
                    <DropdownItem icon={Trash2} danger onClick={() => { setSelected(routine); setShowDelete(true); }}>Eliminar</DropdownItem>
                  </Dropdown>
                )}
              </div>
              
              {routine.description && <p className="text-sm text-gray-400 mb-3 line-clamp-2">{routine.description}</p>}
              
              <div className="text-xs text-gray-500">
                {routine.assignmentType === 'individual' && <span className="flex items-center gap-1"><Lock size={12} /> {getMemberNames(routine.memberIds)}</span>}
                {routine.assignmentType === 'class' && <span className="flex items-center gap-1"><Users size={12} /> {getClassName(routine.classId)}</span>}
                {(!routine.assignmentType || routine.assignmentType === 'general') && <span>General</span>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <RoutineModal isOpen={showModal} onClose={() => { setShowModal(false); setSelected(null); }} onSave={handleSave} routine={selected} classes={classes} members={members} exercises={exercises} />
      <ViewRoutineModal isOpen={showView} onClose={() => { setShowView(false); setSelected(null); }} routine={selected} exercises={exercises} getClassName={getClassName} getMemberNames={getMemberNames} />
      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete} title="Eliminar" message={`¿Eliminar "${selected?.name}"?`} confirmText="Eliminar" />
    </div>
  );
};

const RoutineModal = ({ isOpen, onClose, onSave, routine, classes, members, exercises }) => {
  const [form, setForm] = useState({ name: '', description: '', assignmentType: 'general', classId: '', memberIds: [], exercises: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (routine) {
      setForm({ name: routine.name || '', description: routine.description || '', assignmentType: routine.assignmentType || 'general', classId: routine.classId || '', memberIds: routine.memberIds || [], exercises: routine.exercises || [] });
    } else {
      setForm({ name: '', description: '', assignmentType: 'general', classId: '', memberIds: [], exercises: [] });
    }
  }, [routine, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    if (form.assignmentType === 'class' && !form.classId) { alert('Seleccioná una clase'); return; }
    if (form.assignmentType === 'individual' && form.memberIds.length === 0) { alert('Seleccioná al menos un alumno'); return; }
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  const addExercise = () => {
    setForm(prev => ({ ...prev, exercises: [...prev.exercises, { exerciseId: '', sets: 3, reps: '10', rest: '60', notes: '' }] }));
  };

  const updateExercise = (index, field, value) => {
    setForm(prev => ({ ...prev, exercises: prev.exercises.map((ex, i) => i === index ? { ...ex, [field]: value } : ex) }));
  };

  const removeExercise = (index) => {
    setForm(prev => ({ ...prev, exercises: prev.exercises.filter((_, i) => i !== index) }));
  };

  const toggleMember = (id) => {
    setForm(prev => ({ ...prev, memberIds: prev.memberIds.includes(id) ? prev.memberIds.filter(m => m !== id) : [...prev.memberIds, id] }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={routine ? 'Editar Rutina' : 'Nueva Rutina'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nombre *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <Textarea label="Descripción" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />

        <Select label="Asignar a" value={form.assignmentType} onChange={e => setForm({ ...form, assignmentType: e.target.value, classId: '', memberIds: [] })} options={[{ value: 'general', label: '🌐 General' }, { value: 'class', label: '📅 Clase' }, { value: 'individual', label: '👤 Alumnos' }]} />

        {form.assignmentType === 'class' && (
          <Select label="Clase *" value={form.classId} onChange={e => setForm({ ...form, classId: e.target.value })} options={classes.map(c => ({ value: c.id, label: c.name }))} />
        )}

        {form.assignmentType === 'individual' && (
          <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-gray-800/50 rounded-xl">
            {members.map(m => (
              <label key={m.id} className="flex items-center gap-2 p-2 hover:bg-gray-700 rounded cursor-pointer">
                <input type="checkbox" checked={form.memberIds.includes(m.id)} onChange={() => toggleMember(m.id)} />
                <span className="text-sm">{m.name}</span>
              </label>
            ))}
          </div>
        )}

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-300">Ejercicios ({form.exercises.length})</label>
            <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={addExercise}>Agregar</Button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {form.exercises.map((ex, idx) => (
              <div key={idx} className="p-3 bg-gray-800/50 rounded-xl space-y-2">
                <div className="flex gap-2">
                  <Select value={ex.exerciseId} onChange={e => updateExercise(idx, 'exerciseId', e.target.value)} options={exercises.map(e => ({ value: e.id, label: e.name }))} className="flex-1" placeholder="Ejercicio" />
                  <button type="button" onClick={() => removeExercise(idx)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"><Trash2 size={16} /></button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input type="number" value={ex.sets} onChange={e => updateExercise(idx, 'sets', e.target.value)} placeholder="Series" />
                  <Input value={ex.reps} onChange={e => updateExercise(idx, 'reps', e.target.value)} placeholder="Reps" />
                  <Input value={ex.rest} onChange={e => updateExercise(idx, 'rest', e.target.value)} placeholder="Descanso" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
};

const ViewRoutineModal = ({ isOpen, onClose, routine, exercises, getClassName, getMemberNames }) => {
  if (!routine) return null;
  const getExerciseName = (id) => exercises.find(e => e.id === id)?.name || 'Ejercicio';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={routine.name} size="lg">
      <div className="space-y-4">
        {routine.description && <p className="text-gray-400">{routine.description}</p>}
        
        <div className="space-y-2">
          {routine.exercises?.map((ex, idx) => (
            <div key={idx} className="flex items-center gap-4 p-3 bg-gray-800 rounded-xl">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Dumbbell className="text-blue-400" size={18} />
              </div>
              <div className="flex-1">
                <p className="font-medium">{getExerciseName(ex.exerciseId)}</p>
                <p className="text-sm text-gray-400">{ex.sets} x {ex.reps} • {ex.rest}s descanso</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-gray-500 pt-4 border-t border-gray-700">
          {routine.assignmentType === 'class' && <span>Para: {getClassName(routine.classId)}</span>}
          {routine.assignmentType === 'individual' && <span>Para: {getMemberNames(routine.memberIds)}</span>}
          {routine.assignmentType === 'general' && <span>General</span>}
        </div>
      </div>
    </Modal>
  );
};

export default Routines;
