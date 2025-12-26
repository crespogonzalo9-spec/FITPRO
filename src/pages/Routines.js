import React, { useState, useEffect } from 'react';
import { Plus, ClipboardList, MoreVertical, Edit, Trash2, Users, User, Eye, Lock, Calendar } from 'lucide-react';
import { Button, Card, Modal, Input, Select, Textarea, SearchInput, EmptyState, LoadingState, ConfirmDialog, Badge, Dropdown, DropdownItem, Avatar } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { formatDate } from '../utils/helpers';

const Routines = () => {
  const { userData, canCreateRoutines, isAlumno, isAdmin, isProfesor } = useAuth();
  const { currentGym } = useGym();
  const { success, error: showError } = useToast();
  
  const [routines, setRoutines] = useState([]);
  const [classes, setClasses] = useState([]);
  const [members, setMembers] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, class, individual
  
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!currentGym?.id) { setLoading(false); return; }

    // Cargar rutinas del gimnasio
    const routinesQuery = query(
      collection(db, 'routines'),
      where('gymId', '==', currentGym.id)
    );
    const unsubRoutines = onSnapshot(routinesQuery, (snap) => {
      setRoutines(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    // Cargar clases del gimnasio
    const classesQuery = query(
      collection(db, 'classes'),
      where('gymId', '==', currentGym.id)
    );
    const unsubClasses = onSnapshot(classesQuery, (snap) => {
      setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Admin/Profesor: cargar todos los alumnos
    if (isAdmin() || isProfesor()) {
      const membersQuery = query(
        collection(db, 'users'),
        where('gymId', '==', currentGym.id),
        where('role', '==', 'alumno')
      );
      const unsubMembers = onSnapshot(membersQuery, (snap) => {
        setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => { unsubRoutines(); unsubClasses(); unsubMembers(); };
    }

    // Alumno: cargar sus inscripciones para filtrar rutinas
    if (isAlumno() && userData?.id) {
      const enrollQuery = query(
        collection(db, 'enrollments'),
        where('userId', '==', userData.id)
      );
      const unsubEnroll = onSnapshot(enrollQuery, (snap) => {
        setMyEnrollments(snap.docs.map(d => d.data().classId));
      });
      return () => { unsubRoutines(); unsubClasses(); unsubEnroll(); };
    }

    return () => { unsubRoutines(); unsubClasses(); };
  }, [currentGym, userData, isAdmin, isProfesor, isAlumno]);

  // Filtrar rutinas según rol y tipo
  const getVisibleRoutines = () => {
    let visible = routines;

    // Alumno: solo ve rutinas asignadas a él o a clases donde está inscripto
    if (isAlumno()) {
      visible = routines.filter(r => {
        // Rutina individual para este alumno
        if (r.assignmentType === 'individual' && r.memberIds?.includes(userData.id)) {
          return true;
        }
        // Rutina de clase donde está inscripto
        if (r.assignmentType === 'class' && myEnrollments.includes(r.classId)) {
          return true;
        }
        return false;
      });
    }

    // Aplicar filtro de tipo
    if (filter !== 'all') {
      visible = visible.filter(r => r.assignmentType === filter);
    }

    // Aplicar búsqueda
    if (search) {
      visible = visible.filter(r => 
        r.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    return visible;
  };

  const handleSave = async (data) => {
    try {
      const routineData = {
        ...data,
        gymId: currentGym.id,
        updatedAt: serverTimestamp()
      };

      if (selected?.id) {
        await updateDoc(doc(db, 'routines', selected.id), routineData);
        success('Rutina actualizada');
      } else {
        await addDoc(collection(db, 'routines'), {
          ...routineData,
          createdBy: userData.id,
          createdByName: userData.name,
          createdAt: serverTimestamp()
        });
        success('Rutina creada');
      }
      setShowModal(false);
      setSelected(null);
    } catch (err) {
      console.error(err);
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
    if (!memberIds || memberIds.length === 0) return 'Sin asignar';
    const names = memberIds.map(id => members.find(m => m.id === id)?.name).filter(Boolean);
    if (names.length === 0) return 'Sin asignar';
    if (names.length <= 2) return names.join(', ');
    return `${names.slice(0, 2).join(', ')} y ${names.length - 2} más`;
  };

  const visibleRoutines = getVisibleRoutines();

  if (loading) return <LoadingState />;
  if (!currentGym) return <EmptyState icon={ClipboardList} title="Sin gimnasio asignado" />;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{isAlumno() ? 'Mis Rutinas' : 'Rutinas'}</h1>
          <p className="text-gray-400">{visibleRoutines.length} rutinas</p>
        </div>
        {canCreateRoutines() && (
          <Button icon={Plus} onClick={() => { setSelected(null); setShowModal(true); }}>
            Nueva Rutina
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar rutina..." className="flex-1" />
        <Select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Todas' },
            { value: 'class', label: 'Para Clases' },
            { value: 'individual', label: 'Individuales' }
          ]}
          className="w-full sm:w-48"
        />
      </div>

      {/* Lista de rutinas */}
      {visibleRoutines.length === 0 ? (
        <EmptyState 
          icon={ClipboardList} 
          title={isAlumno() ? "No tenés rutinas asignadas" : "No hay rutinas"} 
          description={isAlumno() ? "Cuando te asignen una rutina aparecerá aquí" : "Creá rutinas para tus alumnos"}
          action={canCreateRoutines() && <Button icon={Plus} onClick={() => setShowModal(true)}>Crear Rutina</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleRoutines.map(routine => (
            <Card 
              key={routine.id} 
              className="cursor-pointer hover:border-gray-600"
              onClick={() => { setSelected(routine); setShowView(true); }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg truncate">{routine.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
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
                  <Dropdown trigger={
                    <button onClick={e => e.stopPropagation()} className="p-2 hover:bg-gray-700 rounded-lg">
                      <MoreVertical size={18} />
                    </button>
                  }>
                    <DropdownItem icon={Eye} onClick={() => { setSelected(routine); setShowView(true); }}>Ver</DropdownItem>
                    <DropdownItem icon={Edit} onClick={() => { setSelected(routine); setShowModal(true); }}>Editar</DropdownItem>
                    <DropdownItem icon={Trash2} danger onClick={() => { setSelected(routine); setShowDelete(true); }}>Eliminar</DropdownItem>
                  </Dropdown>
                )}
              </div>

              {routine.description && (
                <p className="text-sm text-gray-400 mb-3 line-clamp-2">{routine.description}</p>
              )}

              <div className="text-sm text-gray-500 space-y-1">
                {routine.assignmentType === 'class' ? (
                  <p className="flex items-center gap-1">
                    <Users size={14} /> {getClassName(routine.classId)}
                  </p>
                ) : (
                  <p className="flex items-center gap-1">
                    <User size={14} /> {getMemberNames(routine.memberIds)}
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-700 text-xs text-gray-500">
                <span>Por {routine.createdByName}</span>
                <span>{formatDate(routine.createdAt)}</span>
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
        getClassName={getClassName}
        getMemberNames={getMemberNames}
      />

      {/* Confirmar eliminar */}
      <ConfirmDialog 
        isOpen={showDelete} 
        onClose={() => setShowDelete(false)} 
        onConfirm={handleDelete} 
        title="Eliminar Rutina" 
        message={`¿Eliminar la rutina "${selected?.name}"?`}
        confirmText="Eliminar" 
      />
    </div>
  );
};

// Modal para crear/editar rutina
const RoutineModal = ({ isOpen, onClose, onSave, routine, classes, members }) => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    exercises: '',
    assignmentType: 'class',
    classId: '',
    memberIds: []
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
      setForm({
        name: '',
        description: '',
        exercises: '',
        assignmentType: 'class',
        classId: '',
        memberIds: []
      });
    }
  }, [routine, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    
    // Validar asignación
    if (form.assignmentType === 'class' && !form.classId) {
      alert('Seleccioná una clase');
      return;
    }
    if (form.assignmentType === 'individual' && form.memberIds.length === 0) {
      alert('Seleccioná al menos un alumno');
      return;
    }

    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  const toggleMember = (memberId) => {
    setForm(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(memberId)
        ? prev.memberIds.filter(id => id !== memberId)
        : [...prev.memberIds, memberId]
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={routine ? 'Editar Rutina' : 'Nueva Rutina'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input 
          label="Nombre de la rutina *" 
          value={form.name} 
          onChange={e => setForm({ ...form, name: e.target.value })} 
          placeholder="Ej: Rutina Fuerza Semana 1"
          required 
        />

        <Textarea 
          label="Descripción" 
          value={form.description} 
          onChange={e => setForm({ ...form, description: e.target.value })} 
          placeholder="Descripción general de la rutina..."
          rows={2}
        />

        <Textarea 
          label="Ejercicios / Detalle *" 
          value={form.exercises} 
          onChange={e => setForm({ ...form, exercises: e.target.value })} 
          placeholder={`Ej:\n3x10 Back Squat @ 70%\n4x8 Bench Press\n3x12 Romanian Deadlift\n\nDescanso: 90 seg entre series`}
          rows={8}
          required
        />

        <Select 
          label="Asignar a" 
          value={form.assignmentType} 
          onChange={e => setForm({ ...form, assignmentType: e.target.value, classId: '', memberIds: [] })}
          options={[
            { value: 'class', label: '📅 Clase (todos los inscriptos la ven)' },
            { value: 'individual', label: '👤 Alumnos específicos (solo ellos la ven)' }
          ]}
        />

        {form.assignmentType === 'class' ? (
          <Select 
            label="Seleccionar Clase *" 
            value={form.classId} 
            onChange={e => setForm({ ...form, classId: e.target.value })}
            options={classes.map(c => ({ value: c.id, label: `${c.name} - ${c.dayOfWeek} ${c.startTime}` }))}
            placeholder="Elegir clase..."
          />
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Seleccionar Alumnos * 
              <span className="text-gray-500 font-normal ml-2">({form.memberIds.length} seleccionados)</span>
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1 p-3 bg-gray-800/50 rounded-xl border border-gray-700">
              {members.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No hay alumnos en el gimnasio</p>
              ) : (
                members.map(member => (
                  <label 
                    key={member.id} 
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      form.memberIds.includes(member.id) ? 'bg-primary-20' : 'hover:bg-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.memberIds.includes(member.id)}
                      onChange={() => toggleMember(member.id)}
                      className="w-4 h-4 rounded"
                    />
                    <Avatar name={member.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{member.name}</p>
                      <p className="text-xs text-gray-500 truncate">{member.email}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              <Lock size={12} className="inline mr-1" />
              Solo estos alumnos podrán ver esta rutina
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            {routine ? 'Guardar Cambios' : 'Crear Rutina'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Modal para ver rutina
const ViewRoutineModal = ({ isOpen, onClose, routine, getClassName, getMemberNames }) => {
  if (!routine) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={routine.name} size="lg">
      <div className="space-y-4">
        {/* Info de asignación */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={routine.assignmentType === 'class' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}>
            {routine.assignmentType === 'class' ? 'Para Clase' : 'Individual'}
          </Badge>
          <span className="text-sm text-gray-400">
            {routine.assignmentType === 'class' 
              ? getClassName(routine.classId)
              : getMemberNames(routine.memberIds)
            }
          </span>
        </div>

        {/* Descripción */}
        {routine.description && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-1">Descripción</h4>
            <p className="text-gray-300">{routine.description}</p>
          </div>
        )}

        {/* Ejercicios */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Ejercicios</h4>
          <div className="bg-gray-800 rounded-xl p-4 whitespace-pre-wrap font-mono text-sm leading-relaxed">
            {routine.exercises || 'Sin detalles'}
          </div>
        </div>

        {/* Meta info */}
        <div className="flex justify-between text-xs text-gray-500 pt-4 border-t border-gray-700">
          <span>Creada por {routine.createdByName}</span>
          <span>{formatDate(routine.createdAt)}</span>
        </div>
      </div>
    </Modal>
  );
};

export default Routines;
