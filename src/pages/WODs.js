import React, { useState, useEffect } from 'react';
import { Plus, Flame, MoreVertical, Edit, Trash2, Users, User, Eye, Lock, Clock, Zap } from 'lucide-react';
import { Button, Card, Modal, Input, Select, Textarea, SearchInput, EmptyState, LoadingState, ConfirmDialog, Badge, Dropdown, DropdownItem, Avatar } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { WOD_TYPES, BENCHMARK_WODS } from '../utils/constants';
import { formatDate } from '../utils/helpers';

const WODs = () => {
  const { userData, canCreateRoutines, isAlumno, isAdmin, isProfesor } = useAuth();
  const { currentGym } = useGym();
  const { success, error: showError } = useToast();
  
  const [wods, setWods] = useState([]);
  const [classes, setClasses] = useState([]);
  const [members, setMembers] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!currentGym?.id) { setLoading(false); return; }

    const wodsQuery = query(collection(db, 'wods'), where('gymId', '==', currentGym.id));
    const unsubWods = onSnapshot(wodsQuery, (snap) => {
      setWods(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    const classesQuery = query(collection(db, 'classes'), where('gymId', '==', currentGym.id));
    const unsubClasses = onSnapshot(classesQuery, (snap) => {
      setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    if (isAdmin() || isProfesor()) {
      const membersQuery = query(collection(db, 'users'), where('gymId', '==', currentGym.id), where('role', '==', 'alumno'));
      const unsubMembers = onSnapshot(membersQuery, (snap) => {
        setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => { unsubWods(); unsubClasses(); unsubMembers(); };
    }

    if (isAlumno() && userData?.id) {
      const enrollQuery = query(collection(db, 'enrollments'), where('userId', '==', userData.id));
      const unsubEnroll = onSnapshot(enrollQuery, (snap) => {
        setMyEnrollments(snap.docs.map(d => d.data().classId));
      });
      return () => { unsubWods(); unsubClasses(); unsubEnroll(); };
    }

    return () => { unsubWods(); unsubClasses(); };
  }, [currentGym, userData, isAdmin, isProfesor, isAlumno]);

  const getVisibleWods = () => {
    let visible = wods;

    if (isAlumno()) {
      visible = wods.filter(w => {
        if (w.assignmentType === 'individual' && w.memberIds?.includes(userData.id)) return true;
        if (w.assignmentType === 'class' && myEnrollments.includes(w.classId)) return true;
        if (!w.assignmentType || w.assignmentType === 'general') return true;
        return false;
      });
    }

    if (filter !== 'all') {
      visible = visible.filter(w => w.assignmentType === filter);
    }

    if (search) {
      visible = visible.filter(w => w.name?.toLowerCase().includes(search.toLowerCase()));
    }

    return visible;
  };

  const handleSave = async (data) => {
    try {
      const wodData = { ...data, gymId: currentGym.id, updatedAt: serverTimestamp() };

      if (selected?.id) {
        await updateDoc(doc(db, 'wods', selected.id), wodData);
        success('WOD actualizado');
      } else {
        await addDoc(collection(db, 'wods'), {
          ...wodData,
          createdBy: userData.id,
          createdByName: userData.name,
          createdAt: serverTimestamp()
        });
        success('WOD creado');
      }
      setShowModal(false);
      setSelected(null);
    } catch (err) {
      showError('Error al guardar');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'wods', selected.id));
      success('WOD eliminado');
      setShowDelete(false);
      setSelected(null);
    } catch (err) {
      showError('Error al eliminar');
    }
  };

  const getTypeName = (type) => WOD_TYPES.find(t => t.id === type)?.name || type;
  const getClassName = (classId) => classes.find(c => c.id === classId)?.name || 'Sin clase';
  const getMemberNames = (memberIds) => {
    if (!memberIds || memberIds.length === 0) return '';
    const names = memberIds.map(id => members.find(m => m.id === id)?.name).filter(Boolean);
    return names.length <= 2 ? names.join(', ') : `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
  };

  const visibleWods = getVisibleWods();

  if (loading) return <LoadingState />;
  if (!currentGym) return <EmptyState icon={Flame} title="Sin gimnasio" />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">WODs</h1>
          <p className="text-gray-400">{visibleWods.length} workouts</p>
        </div>
        {canCreateRoutines() && (
          <Button icon={Plus} onClick={() => { setSelected(null); setShowModal(true); }}>
            Nuevo WOD
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar WOD..." className="flex-1" />
        <Select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'general', label: 'Generales' },
            { value: 'class', label: 'Para Clases' },
            { value: 'individual', label: 'Individuales' }
          ]}
          className="w-full sm:w-48"
        />
      </div>

      {visibleWods.length === 0 ? (
        <EmptyState icon={Flame} title="No hay WODs" action={canCreateRoutines() && <Button icon={Plus} onClick={() => setShowModal(true)}>Crear WOD</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleWods.map(wod => (
            <Card key={wod.id} className="cursor-pointer hover:border-gray-600" onClick={() => { setSelected(wod); setShowView(true); }}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                    <Flame className="text-orange-500" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{wod.name}</h3>
                    <div className="flex gap-2 mt-1">
                      <Badge className="bg-orange-500/20 text-orange-400">{getTypeName(wod.type)}</Badge>
                      {wod.timeLimit && <Badge className="bg-gray-500/20 text-gray-400"><Clock size={10} className="mr-1" />{wod.timeLimit}'</Badge>}
                    </div>
                  </div>
                </div>
                {canCreateRoutines() && (
                  <Dropdown trigger={<button onClick={e => e.stopPropagation()} className="p-2 hover:bg-gray-700 rounded-lg"><MoreVertical size={18} /></button>}>
                    <DropdownItem icon={Edit} onClick={() => { setSelected(wod); setShowModal(true); }}>Editar</DropdownItem>
                    <DropdownItem icon={Trash2} danger onClick={() => { setSelected(wod); setShowDelete(true); }}>Eliminar</DropdownItem>
                  </Dropdown>
                )}
              </div>
              
              {wod.description && <p className="text-sm text-gray-400 mb-3 line-clamp-3 whitespace-pre-wrap">{wod.description}</p>}
              
              <div className="text-xs text-gray-500">
                {wod.assignmentType === 'individual' && <span className="flex items-center gap-1"><Lock size={12} /> {getMemberNames(wod.memberIds)}</span>}
                {wod.assignmentType === 'class' && <span className="flex items-center gap-1"><Users size={12} /> {getClassName(wod.classId)}</span>}
                {(!wod.assignmentType || wod.assignmentType === 'general') && <span>General</span>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <WODModal isOpen={showModal} onClose={() => { setShowModal(false); setSelected(null); }} onSave={handleSave} wod={selected} classes={classes} members={members} />
      <ViewWODModal isOpen={showView} onClose={() => { setShowView(false); setSelected(null); }} wod={selected} getTypeName={getTypeName} getClassName={getClassName} getMemberNames={getMemberNames} />
      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete} title="Eliminar" message={`¿Eliminar "${selected?.name}"?`} confirmText="Eliminar" />
    </div>
  );
};

const WODModal = ({ isOpen, onClose, onSave, wod, classes, members }) => {
  const [form, setForm] = useState({ name: '', type: 'for_time', description: '', timeLimit: '', assignmentType: 'general', classId: '', memberIds: [] });
  const [loading, setLoading] = useState(false);
  const [showBenchmarks, setShowBenchmarks] = useState(false);

  useEffect(() => {
    if (wod) {
      setForm({
        name: wod.name || '',
        type: wod.type || 'for_time',
        description: wod.description || '',
        timeLimit: wod.timeLimit || '',
        assignmentType: wod.assignmentType || 'general',
        classId: wod.classId || '',
        memberIds: wod.memberIds || []
      });
    } else {
      setForm({ name: '', type: 'for_time', description: '', timeLimit: '', assignmentType: 'general', classId: '', memberIds: [] });
    }
  }, [wod, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    if (form.assignmentType === 'class' && !form.classId) { alert('Seleccioná una clase'); return; }
    if (form.assignmentType === 'individual' && form.memberIds.length === 0) { alert('Seleccioná al menos un alumno'); return; }
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  const selectBenchmark = (b) => {
    setForm(prev => ({ ...prev, name: b.name, type: b.type, description: b.description }));
    setShowBenchmarks(false);
  };

  const toggleMember = (id) => {
    setForm(prev => ({ ...prev, memberIds: prev.memberIds.includes(id) ? prev.memberIds.filter(m => m !== id) : [...prev.memberIds, id] }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={wod ? 'Editar WOD' : 'Nuevo WOD'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <Input label="Nombre *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="flex-1" required />
          <div className="pt-6">
            <Button type="button" variant="secondary" size="sm" icon={Zap} onClick={() => setShowBenchmarks(!showBenchmarks)}>
              Benchmarks
            </Button>
          </div>
        </div>

        {showBenchmarks && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-gray-800/50 rounded-xl max-h-40 overflow-y-auto">
            {BENCHMARK_WODS.map(b => (
              <button key={b.name} type="button" onClick={() => selectBenchmark(b)} className="text-left p-2 hover:bg-gray-700 rounded-lg">
                <p className="font-medium text-sm text-orange-400">{b.name}</p>
                <p className="text-xs text-gray-500">{b.type}</p>
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Select label="Tipo" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} options={WOD_TYPES.map(t => ({ value: t.id, label: t.name }))} />
          <Input label="Time Cap (min)" type="number" value={form.timeLimit} onChange={e => setForm({ ...form, timeLimit: e.target.value })} placeholder="20" />
        </div>

        <Textarea label="Descripción / Movimientos *" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={6} placeholder="21-15-9&#10;Thrusters (43/30 kg)&#10;Pull-ups" required />

        <Select 
          label="Asignar a" 
          value={form.assignmentType} 
          onChange={e => setForm({ ...form, assignmentType: e.target.value, classId: '', memberIds: [] })}
          options={[
            { value: 'general', label: '🌐 General (todos lo ven)' },
            { value: 'class', label: '📅 Clase específica' },
            { value: 'individual', label: '👤 Alumnos específicos' }
          ]}
        />

        {form.assignmentType === 'class' && (
          <Select label="Clase *" value={form.classId} onChange={e => setForm({ ...form, classId: e.target.value })} options={classes.map(c => ({ value: c.id, label: `${c.name} - ${c.dayOfWeek} ${c.startTime}` }))} placeholder="Elegir clase..." />
        )}

        {form.assignmentType === 'individual' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Alumnos ({form.memberIds.length})</label>
            <div className="max-h-40 overflow-y-auto space-y-1 p-3 bg-gray-800/50 rounded-xl border border-gray-700">
              {members.map(m => (
                <label key={m.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${form.memberIds.includes(m.id) ? 'bg-primary-20' : 'hover:bg-gray-700'}`}>
                  <input type="checkbox" checked={form.memberIds.includes(m.id)} onChange={() => toggleMember(m.id)} className="w-4 h-4" />
                  <span className="text-sm">{m.name}</span>
                </label>
              ))}
            </div>
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

const ViewWODModal = ({ isOpen, onClose, wod, getTypeName, getClassName, getMemberNames }) => {
  if (!wod) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={wod.name} size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-orange-500/20 text-orange-400">{getTypeName(wod.type)}</Badge>
          {wod.timeLimit && <Badge className="bg-gray-500/20 text-gray-400">{wod.timeLimit} min</Badge>}
        </div>
        <div className="bg-gray-800 rounded-xl p-4 whitespace-pre-wrap font-mono text-sm">{wod.description}</div>
        <div className="text-xs text-gray-500 pt-4 border-t border-gray-700">
          {wod.assignmentType === 'class' && <span>Para: {getClassName(wod.classId)}</span>}
          {wod.assignmentType === 'individual' && <span>Para: {getMemberNames(wod.memberIds)}</span>}
          {wod.assignmentType === 'general' && <span>General</span>}
        </div>
      </div>
    </Modal>
  );
};

export default WODs;
