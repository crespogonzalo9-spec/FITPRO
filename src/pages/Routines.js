import React, { useState, useEffect } from 'react';
import { Plus, ClipboardList, MoreVertical, Edit, Trash2, Users, User, Calendar, Eye, Lock } from 'lucide-react';
import { Button, Card, Modal, Input, Select, Textarea, SearchInput, EmptyState, LoadingState, ConfirmDialog, Badge, Dropdown, DropdownItem, Checkbox, Avatar } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, or } from 'firebase/firestore';
import { ASSIGNMENT_TYPES } from '../utils/constants';
import { formatDate } from '../utils/helpers';

const Routines = () => {
  const { userData, canCreateRoutines, isAlumno } = useAuth();
  const { currentGym } = useGym();
  const { success, error: showError } = useToast();
  const [routines, setRoutines] = useState([]);
  const [classes, setClasses] = useState([]);
  const [members, setMembers] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!currentGym?.id || !userData?.id) { setLoading(false); return; }

    let routinesQuery;
    
    if (isAlumno()) {
      // Alumno: ver solo rutinas asignadas a él o a clases donde está inscripto
      routinesQuery = query(
        collection(db, 'routines'),
        where('gymId', '==', currentGym.id),
        where('isActive', '==', true)
      );
    } else {
      // Admin/Profesor: ver todas las rutinas del gimnasio
      routinesQuery = query(
        collection(db, 'routines'),
        where('gymId', '==', currentGym.id)
      );
    }

    const unsubRoutines = onSnapshot(routinesQuery, (snap) => {
      const allRoutines = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      if (isAlumno()) {
        // Filtrar solo las que corresponden al alumno
        const filtered = allRoutines.filter(r => {
          // Rutinas individuales asignadas al alumno
          if (r.assignmentType === 'individual' && r.memberIds?.includes(userData.id)) {
            return true;
          }
          // Rutinas de clase donde está inscripto (se filtra después con enrollments)
          if (r.assignmentType === 'class') {
            return true; // Se filtrará después
          }
          return false;
        });
        setRoutines(filtered);
      } else {
        setRoutines(allRoutines);
      }
      setLoading(false);
    });

    // Cargar clases
    const unsubClasses = onSnapshot(
      query(collection(db, 'classes'), where('gymId', '==', currentGym.id)),
      (snap) => setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    // Cargar miembros (solo para admin/profesor)
    if (!isAlumno()) {
      const unsubMembers = onSnapshot(
        query(collection(db, 'users'), where('gymId', '==', currentGym.id), where('role', '==', 'alumno')),
        (snap) => setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      );
      
      return () => { unsubRoutines(); unsubClasses(); unsubMembers(); };
    }

    // Cargar inscripciones del alumno
    if (isAlumno()) {
      const unsubEnrollments = onSnapshot(
        query(collection(db, 'enrollments'), where('userId', '==', userData.id)),
        (snap) => setMyEnrollments(snap.docs.map(d => d.data().classId))
      );
      
      return () => { unsubRoutines(); unsubClasses(); unsubEnrollments(); };
    }

    return () => { unsubRoutines(); unsubClasses(); };
  }, [currentGym, userData, isAlumno]);

  // Filtrar rutinas para alumnos basado en inscripciones
  const visibleRoutines = isAlumno() 
    ? routines.filter(r => {
        if (r.assignmentType === 'individual') return r.memberIds?.includes(userData.id);
        if (r.assignmentType === 'class') return myEnrollments.includes(r.classId);
        return false;
      })
    : routines;

  const filtered = visibleRoutines.filter(r => 
    r.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (data) => {
    try {
      if (selected?.id) {
        await updateDoc(doc(db, 'routines', selected.id), { 
          ...data, 
          updatedAt: serverTimestamp(),
          updatedBy: userData.id
        });
        success('Rutina actualizada');
      } else {
        await addDoc(collection(db, 'routines'), { 
          ...data, 
          gymId: currentGym.id, 
          createdBy: userData.id,
          createdByName: userData.name,
          isActive: true,
          createdAt: serverTimestamp() 
        });
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

  const getClassName = (id) => classes.find(c => c.id === id)?.name || 'Clase';
  const getMemberNames = (ids) => {
    if (!ids || ids.length === 0) return 'Sin asignar';
    const names = ids.map(id => members.find(m => m.id === id)?.name).filter(Boolean);
    if (names.length <= 2) return names.join(', ');
    return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
  };

  if (loading) return <LoadingState />;
  if (!currentGym) return <EmptyState icon={ClipboardList} title="Sin gimnasio" />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{isAlumno() ? 'Mis Rutinas' : 'Rutinas'}</h1>
          <p className="text-gray-400">{filtered.length} rutinas</p>
        </div>
        {canCreateRoutines() && (
          <Button icon={Plus} onClick={() => { setSelected(null); setShowModal(true); }}>
            Nueva Rutina
          </Button>
        )}
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Buscar rutina..." />

      {filtered.length === 0 ? (
        <EmptyState 
          icon={ClipboardList} 
          title={isAlumno() ? "No tenés rutinas asignadas" : "No hay rutinas"} 
          description={isAlumno() ? "Tus rutinas aparecerán aquí cuando te las asignen" : "Crea rutinas para tus alumnos"}
          action={canCreateRoutines() && <Button icon={Plus} onClick={() => setShowModal(true)}>Crear</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map(routine => (
            <Card key={routine.id} className="hover:border-primary-30 cursor-pointer" onClick={() => { setSelected(routine); setShowView(true); }}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{routine.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={routine.assignmentType === 'class' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}>
                      {routine.assignmentType === 'class' ? (
                        <><Calendar size={12} className="mr-1" /> Clase</>
                      ) : (
                        <><User size={12} className="mr-1" /> Individual</>
                      )}
                    </Badge>
                    {routine.assignmentType === 'individual' && (
                      <Badge className="bg-gray-500/20 text-gray-400">
                        <Lock size={12} className="mr-1" /> Privada
                      </Badge>
                    )}
                  </div>
                </div>
                {canCreateRoutines() && (
                  <Dropdown trigger={<button onClick={e => e.stopPropagation()} className="p-2 hover:bg-gray-700 rounded-lg"><MoreVertical size={18} /></button>}>
                    <DropdownItem icon={Edit} onClick={() => { setSelected(routine); setShowModal(true); }}>Editar</DropdownItem>
                    <DropdownItem icon={Trash2} danger onClick={() => { setSelected(routine); setShowDelete(true); }}>Eliminar</DropdownItem>
                  </Dropdown>
                )}
              </div>
              
              {routine.description && (
                <p className="text-sm text-gray-400 mb-3 line-clamp-2">{routine.description}</p>
              )}
              
              <div className="text-sm text-gray-500">
                {routine.assignmentType === 'class' ? (
                  <span className="flex items-center gap-1"><Users size={14} /> {getClassName(routine.classId)}</span>
                ) : (
                  <span className="flex items-center gap-1"><User size={14} /> {getMemberNames(routine.memberIds)}</span>
                )}
              </div>
              
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-700">
                <p className="text-xs text-gray-500">Por {routine.createdByName}</p>
                <p className="text-xs text-gray-500">{formatDate(routine.createdAt)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      <RoutineModal 
        isOpen={showModal} 
        onClose={() => { setShowModal(false); setSelected(null); }} 
        onSave={handleSave} 
        routine={selected} 
        classes={classes} 
        members={members} 
      />

      {/* Modal ver rutina */}
      <ViewRoutineModal
        isOpen={showView}
        onClose={() => { setShowView(false); setSelected(null); }}
        routine={selected}
        className={getClassName(selected?.classId)}
        memberNames={getMemberNames(selected?.memberIds)}
      />

      <ConfirmDialog 
        isOpen={showDelete} 
        onClose={() => setShowDelete(false)} 
        onConfirm={handleDelete} 
        title="Eliminar Rutina" 
        message="¿Eliminar esta rutina?" 
        confirmText="Eliminar" 
      />
    </div>
  );
};

const RoutineModal = ({ isOpen, onClose, onSave, routine, classes, members }) => {
  const [form, setForm] = useState({ 
    name: '', description: '', exercises: '', 
    assignmentType: 'class', classId: '', memberIds: [] 
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (routine) {
      setForm({
        name: routine.name || '',
        description: routine.description || '',
        exercises: routine.exercises || '',
        assignmentType: routine.assignmentType || 'class',
        classId: routine.classId || '',
        memberIds: routine.memberIds || []
      });
    } else {
      setForm({ name: '', description: '', exercises: '', assignmentType: 'class', classId: '', memberIds: [] });
    }
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
      memberIds: prev.memberIds.includes(id) 
        ? prev.memberIds.filter(m => m !== id) 
        : [...prev.memberIds, id]
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={routine ? 'Editar Rutina' : 'Nueva Rutina'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nombre *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <Textarea label="Descripción" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
        <Textarea 
          label="Ejercicios / Detalle" 
          value={form.exercises} 
          onChange={e => setForm({ ...form, exercises: e.target.value })} 
          rows={6} 
          placeholder="Ej:&#10;3x10 Back Squat @ 70%&#10;4x8 Bench Press&#10;3x12 Romanian Deadlift"
        />
        
        <Select 
          label="Asignar a" 
          value={form.assignmentType} 
          onChange={e => setForm({ ...form, assignmentType: e.target.value, classId: '', memberIds: [] })} 
          options={ASSIGNMENT_TYPES.map(a => ({ value: a.id, label: a.name }))} 
        />
        
        {form.assignmentType === 'class' ? (
          <Select 
            label="Clase" 
            value={form.classId} 
            onChange={e => setForm({ ...form, classId: e.target.value })} 
            options={classes.map(c => ({ value: c.id, label: `${c.name} - ${c.startTime}` }))} 
            placeholder="Seleccionar clase" 
          />
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Seleccionar Alumnos <span className="text-gray-500">({form.memberIds.length} seleccionados)</span>
            </label>
            <div className="max-h-48 overflow-y-auto space-y-2 p-3 bg-gray-800/50 rounded-xl">
              {members.length === 0 ? (
                <p className="text-sm text-gray-500">No hay alumnos</p>
              ) : (
                members.map(m => (
                  <label key={m.id} className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.memberIds.includes(m.id)}
                      onChange={() => toggleMember(m.id)}
                      className="w-4 h-4 rounded"
                    />
                    <Avatar name={m.name} size="sm" />
                    <span className="text-sm">{m.name}</span>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Solo estos alumnos podrán ver esta rutina</p>
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

const ViewRoutineModal = ({ isOpen, onClose, routine, className, memberNames }) => {
  if (!routine) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={routine.name} size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge className={routine.assignmentType === 'class' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}>
            {routine.assignmentType === 'class' ? 'Para Clase' : 'Individual'}
          </Badge>
          <span className="text-sm text-gray-400">
            {routine.assignmentType === 'class' ? className : memberNames}
          </span>
        </div>

        {routine.description && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-1">Descripción</h4>
            <p className="text-gray-300">{routine.description}</p>
          </div>
        )}

        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Ejercicios</h4>
          <div className="bg-gray-800 rounded-xl p-4 whitespace-pre-wrap font-mono text-sm">
            {routine.exercises || 'Sin detalles'}
          </div>
        </div>

        <div className="flex justify-between text-xs text-gray-500 pt-4 border-t border-gray-700">
          <span>Creado por {routine.createdByName}</span>
          <span>{formatDate(routine.createdAt)}</span>
        </div>
      </div>
    </Modal>
  );
};

export default Routines;
