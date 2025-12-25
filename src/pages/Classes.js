import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, Users, MoreVertical, Edit, Trash2, UserPlus } from 'lucide-react';
import { Button, Card, Modal, Input, Select, EmptyState, LoadingState, ConfirmDialog, Badge, Dropdown, DropdownItem, Checkbox } from '../Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { DAYS_OF_WEEK } from '../utils/constants';

const Classes = () => {
  const { userData, isAdmin } = useAuth();
  const { currentGym } = useGym();
  const { success, error: showError } = useToast();
  const [classes, setClasses] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showEnroll, setShowEnroll] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!currentGym?.id) { setLoading(false); return; }

    const qClasses = query(collection(db, 'classes'), where('gymId', '==', currentGym.id));
    const unsubClasses = onSnapshot(qClasses, (snap) => {
      setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    const qProfesores = query(collection(db, 'users'), where('gymId', '==', currentGym.id), where('role', '==', 'profesor'));
    const unsubProfesores = onSnapshot(qProfesores, (snap) => {
      setProfesores(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubClasses(); unsubProfesores(); };
  }, [currentGym]);

  const groupedClasses = DAYS_OF_WEEK.slice(1, 7).concat(DAYS_OF_WEEK[0]).map(day => ({
    ...day,
    classes: classes.filter(c => c.dayOfWeek === day.id).sort((a, b) => a.startTime?.localeCompare(b.startTime))
  }));

  const handleSave = async (data) => {
    try {
      if (selected?.id) {
        await updateDoc(doc(db, 'classes', selected.id), { ...data, updatedAt: serverTimestamp() });
        success('Clase actualizada');
      } else {
        await addDoc(collection(db, 'classes'), { ...data, gymId: currentGym.id, enrolledCount: 0, isActive: true, createdAt: serverTimestamp() });
        success('Clase creada');
      }
      setShowModal(false);
      setSelected(null);
    } catch (err) {
      showError('Error al guardar');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'classes', selected.id));
      success('Clase eliminada');
      setShowDelete(false);
      setSelected(null);
    } catch (err) {
      showError('Error al eliminar');
    }
  };

  const getProfesorName = (id) => profesores.find(p => p.id === id)?.name || 'Sin asignar';

  if (loading) return <LoadingState />;
  if (!currentGym) return <EmptyState icon={Calendar} title="Sin gimnasio" />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Clases</h1>
          <p className="text-gray-400">{classes.length} clases programadas</p>
        </div>
        {isAdmin() && <Button icon={Plus} onClick={() => { setSelected(null); setShowModal(true); }}>Nueva Clase</Button>}
      </div>

      {groupedClasses.map(day => (
        <Card key={day.id}>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-emerald-500" />{day.name}
          </h3>
          {day.classes.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Sin clases</p>
          ) : (
            <div className="space-y-3">
              {day.classes.map(cls => (
                <div key={cls.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500">
                      <Clock size={24} />
                    </div>
                    <div>
                      <h4 className="font-semibold">{cls.name}</h4>
                      <p className="text-sm text-gray-400">{cls.startTime} - {cls.endTime} • {getProfesorName(cls.profesorId)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className={`font-semibold ${(cls.enrolledCount || 0) >= cls.capacity ? 'text-red-500' : 'text-emerald-500'}`}>
                        {cls.enrolledCount || 0}/{cls.capacity}
                      </span>
                      <p className="text-xs text-gray-400">cupos</p>
                    </div>
                    {isAdmin() && (
                      <Dropdown trigger={<button className="p-2 hover:bg-gray-700 rounded-lg"><MoreVertical size={18} /></button>}>
                        <DropdownItem icon={Edit} onClick={() => { setSelected(cls); setShowModal(true); }}>Editar</DropdownItem>
                        <DropdownItem icon={UserPlus} onClick={() => { setSelected(cls); setShowEnroll(true); }}>Ver Inscriptos</DropdownItem>
                        <DropdownItem icon={Trash2} danger onClick={() => { setSelected(cls); setShowDelete(true); }}>Eliminar</DropdownItem>
                      </Dropdown>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}

      <ClassModal isOpen={showModal} onClose={() => { setShowModal(false); setSelected(null); }} onSave={handleSave} classData={selected} profesores={profesores} />
      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete} title="Eliminar" message="¿Eliminar esta clase?" confirmText="Eliminar" />
      <EnrollModal isOpen={showEnroll} onClose={() => setShowEnroll(false)} classData={selected} gymId={currentGym?.id} />
    </div>
  );
};

const ClassModal = ({ isOpen, onClose, onSave, classData, profesores }) => {
  const [form, setForm] = useState({ name: '', dayOfWeek: 1, startTime: '08:00', endTime: '09:00', profesorId: '', capacity: 15 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm(classData ? { name: classData.name || '', dayOfWeek: classData.dayOfWeek || 1, startTime: classData.startTime || '08:00', endTime: classData.endTime || '09:00', profesorId: classData.profesorId || '', capacity: classData.capacity || 15 } : { name: '', dayOfWeek: 1, startTime: '08:00', endTime: '09:00', profesorId: '', capacity: 15 });
  }, [classData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={classData ? 'Editar Clase' : 'Nueva Clase'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nombre *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="CrossFit, Funcional..." required />
        <Select label="Día" value={form.dayOfWeek} onChange={e => setForm({ ...form, dayOfWeek: parseInt(e.target.value) })} options={DAYS_OF_WEEK.map(d => ({ value: d.id, label: d.name }))} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Inicio" type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
          <Input label="Fin" type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
        </div>
        <Select label="Profesor" value={form.profesorId} onChange={e => setForm({ ...form, profesorId: e.target.value })} options={profesores.map(p => ({ value: p.id, label: p.name }))} placeholder="Sin asignar" />
        <Input label="Capacidad" type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) })} min={1} />
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
};

const EnrollModal = ({ isOpen, onClose, classData, gymId }) => {
  const [enrolled, setEnrolled] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !classData?.id) return;
    const fetchEnrolled = async () => {
      const q = query(collection(db, 'enrollments'), where('classId', '==', classData.id));
      const snap = await getDocs(q);
      const enrollments = snap.docs.map(d => d.data());
      
      // Fetch user names
      const userIds = enrollments.map(e => e.userId);
      if (userIds.length > 0) {
        const usersSnap = await getDocs(query(collection(db, 'users'), where('__name__', 'in', userIds.slice(0, 10))));
        const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setEnrolled(users);
      } else {
        setEnrolled([]);
      }
      setLoading(false);
    };
    fetchEnrolled();
  }, [isOpen, classData]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Inscriptos - ${classData?.name}`}>
      {loading ? (
        <LoadingState />
      ) : enrolled.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No hay inscriptos</p>
      ) : (
        <div className="space-y-2">
          {enrolled.map(user => (
            <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
              <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 text-sm font-medium">
                {user.name?.charAt(0)}
              </div>
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default Classes;
