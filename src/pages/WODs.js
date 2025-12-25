import React, { useState, useEffect } from 'react';
import { Plus, Flame, MoreVertical, Edit, Trash2, Users, User, Calendar, Clock } from 'lucide-react';
import { Button, Card, Modal, Input, Select, Textarea, SearchInput, EmptyState, LoadingState, ConfirmDialog, Badge, Dropdown, DropdownItem, Checkbox } from '../Common';
import { useAuth } from '../../contexts/AuthContext';
import { useGym } from '../../contexts/GymContext';
import { useToast } from '../../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { WOD_TYPES, ASSIGNMENT_TYPES, BENCHMARK_WODS } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';

const WODs = () => {
  const { canCreateRoutines } = useAuth();
  const { currentGym } = useGym();
  const { success, error: showError } = useToast();
  const [wods, setWods] = useState([]);
  const [classes, setClasses] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!currentGym?.id) { setLoading(false); return; }

    const unsubWods = onSnapshot(query(collection(db, 'wods'), where('gymId', '==', currentGym.id)), (snap) => {
      setWods(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    const unsubClasses = onSnapshot(query(collection(db, 'classes'), where('gymId', '==', currentGym.id)), (snap) => {
      setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubMembers = onSnapshot(query(collection(db, 'users'), where('gymId', '==', currentGym.id), where('role', '==', 'alumno')), (snap) => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubWods(); unsubClasses(); unsubMembers(); };
  }, [currentGym]);

  const filtered = wods.filter(w => w.name?.toLowerCase().includes(search.toLowerCase()));

  const handleSave = async (data) => {
    try {
      if (selected?.id) {
        await updateDoc(doc(db, 'wods', selected.id), { ...data, updatedAt: serverTimestamp() });
        success('WOD actualizado');
      } else {
        await addDoc(collection(db, 'wods'), { ...data, gymId: currentGym.id, createdAt: serverTimestamp() });
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
  const getClassName = (id) => classes.find(c => c.id === id)?.name || '';

  if (loading) return <LoadingState />;
  if (!currentGym) return <EmptyState icon={Flame} title="Sin gimnasio" />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">WODs</h1>
          <p className="text-gray-400">{wods.length} WODs</p>
        </div>
        {canCreateRoutines() && <Button icon={Plus} onClick={() => { setSelected(null); setShowModal(true); }}>Nuevo WOD</Button>}
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Buscar WOD..." />

      {filtered.length === 0 ? (
        <EmptyState icon={Flame} title="No hay WODs" action={canCreateRoutines() && <Button icon={Plus} onClick={() => setShowModal(true)}>Crear</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map(wod => (
            <Card key={wod.id} className="hover:border-emerald-500/30">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                    <Flame className="text-orange-500" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{wod.name}</h3>
                    <div className="flex gap-2">
                      <Badge variant="warning">{getTypeName(wod.type)}</Badge>
                      {wod.timeLimit && <Badge variant="neutral"><Clock size={12} className="mr-1" />{wod.timeLimit} min</Badge>}
                    </div>
                  </div>
                </div>
                {canCreateRoutines() && (
                  <Dropdown trigger={<button className="p-2 hover:bg-gray-700 rounded-lg"><MoreVertical size={18} /></button>}>
                    <DropdownItem icon={Edit} onClick={() => { setSelected(wod); setShowModal(true); }}>Editar</DropdownItem>
                    <DropdownItem icon={Trash2} danger onClick={() => { setSelected(wod); setShowDelete(true); }}>Eliminar</DropdownItem>
                  </Dropdown>
                )}
              </div>
              {wod.description && <p className="text-sm text-gray-400 mb-3 whitespace-pre-wrap">{wod.description}</p>}
              <div className="text-sm text-gray-500">
                {wod.assignmentType === 'class' ? (
                  <span className="flex items-center gap-1"><Calendar size={14} /> {getClassName(wod.classId)}</span>
                ) : wod.memberIds?.length > 0 ? (
                  <span className="flex items-center gap-1"><User size={14} /> {wod.memberIds.length} alumnos</span>
                ) : null}
              </div>
              <p className="text-xs text-gray-600 mt-2">{formatDate(wod.createdAt)}</p>
            </Card>
          ))}
        </div>
      )}

      <WODModal isOpen={showModal} onClose={() => { setShowModal(false); setSelected(null); }} onSave={handleSave} wod={selected} classes={classes} members={members} />
      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete} title="Eliminar" message="¿Eliminar este WOD?" confirmText="Eliminar" />
    </div>
  );
};

const WODModal = ({ isOpen, onClose, onSave, wod, classes, members }) => {
  const [form, setForm] = useState({ name: '', type: 'for_time', description: '', timeLimit: '', assignmentType: 'class', classId: '', memberIds: [] });
  const [loading, setLoading] = useState(false);
  const [showBenchmarks, setShowBenchmarks] = useState(false);

  useEffect(() => {
    setForm(wod ? {
      name: wod.name || '',
      type: wod.type || 'for_time',
      description: wod.description || '',
      timeLimit: wod.timeLimit || '',
      assignmentType: wod.assignmentType || 'class',
      classId: wod.classId || '',
      memberIds: wod.memberIds || []
    } : { name: '', type: 'for_time', description: '', timeLimit: '', assignmentType: 'class', classId: '', memberIds: [] });
  }, [wod, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  const selectBenchmark = (b) => {
    setForm(prev => ({ ...prev, name: b.name, type: b.type, description: b.description }));
    setShowBenchmarks(false);
  };

  const toggleMember = (id) => {
    setForm(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(id) ? prev.memberIds.filter(m => m !== id) : [...prev.memberIds, id]
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={wod ? 'Editar WOD' : 'Nuevo WOD'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <Input label="Nombre *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="flex-1" required />
          <div className="pt-6">
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowBenchmarks(!showBenchmarks)}>Benchmarks</Button>
          </div>
        </div>

        {showBenchmarks && (
          <div className="grid grid-cols-2 gap-2 p-3 bg-gray-800/50 rounded-xl max-h-40 overflow-y-auto">
            {BENCHMARK_WODS.map(b => (
              <button key={b.name} type="button" onClick={() => selectBenchmark(b)} className="text-left p-2 hover:bg-gray-700 rounded-lg">
                <p className="font-medium text-sm">{b.name}</p>
                <p className="text-xs text-gray-500">{b.type}</p>
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Select label="Tipo" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} options={WOD_TYPES.map(t => ({ value: t.id, label: t.name }))} />
          <Input label="Time Cap (min)" type="number" value={form.timeLimit} onChange={e => setForm({ ...form, timeLimit: e.target.value })} placeholder="20" />
        </div>

        <Textarea label="Descripción / Movimientos" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} placeholder="21-15-9 Thrusters + Pull-ups" />

        <Select label="Asignar a" value={form.assignmentType} onChange={e => setForm({ ...form, assignmentType: e.target.value, classId: '', memberIds: [] })} options={ASSIGNMENT_TYPES.map(a => ({ value: a.id, label: a.name }))} />

        {form.assignmentType === 'class' ? (
          <Select label="Clase" value={form.classId} onChange={e => setForm({ ...form, classId: e.target.value })} options={classes.map(c => ({ value: c.id, label: `${c.name} - ${c.startTime}` }))} placeholder="Seleccionar clase" />
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Seleccionar Alumnos</label>
            <div className="max-h-40 overflow-y-auto space-y-2 p-3 bg-gray-800/50 rounded-xl">
              {members.map(m => (
                <Checkbox key={m.id} label={m.name} checked={form.memberIds.includes(m.id)} onChange={() => toggleMember(m.id)} />
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

export default WODs;
