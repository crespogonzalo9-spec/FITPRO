import React, { useState, useEffect } from 'react';
import { Plus, Clock, MoreVertical, Edit, Trash2, Calendar } from 'lucide-react';
import { Button, Card, Modal, LoadingState, ConfirmDialog, Input, Select, Dropdown, DropdownItem } from '../Common';
import { useToast } from '../../contexts/ToastContext';
import { DAYS_OF_WEEK } from '../../utils/constants';

const Classes = () => {
  const { success } = useToast();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setClasses([
      { id: '1', name: 'CrossFit', dayOfWeek: 1, startTime: '08:00', endTime: '09:00', coach: 'Carlos Trainer', capacity: 15, enrolledCount: 12, type: 'crossfit' },
      { id: '2', name: 'CrossFit', dayOfWeek: 1, startTime: '10:00', endTime: '11:00', coach: 'Carlos Trainer', capacity: 15, enrolledCount: 15, type: 'crossfit' },
      { id: '3', name: 'Funcional', dayOfWeek: 1, startTime: '18:00', endTime: '19:00', coach: 'María Coach', capacity: 12, enrolledCount: 8, type: 'functional' },
      { id: '4', name: 'CrossFit', dayOfWeek: 2, startTime: '08:00', endTime: '09:00', coach: 'Carlos Trainer', capacity: 15, enrolledCount: 10, type: 'crossfit' },
      { id: '5', name: 'Hipertrofia', dayOfWeek: 2, startTime: '19:00', endTime: '20:00', coach: 'Pedro Coach', capacity: 10, enrolledCount: 6, type: 'strength' },
    ]);
    setLoading(false);
  }, []);

  const groupedClasses = DAYS_OF_WEEK.slice(1, 7).map(day => ({
    ...day,
    classes: classes.filter(c => c.dayOfWeek === day.id).sort((a, b) => a.startTime.localeCompare(b.startTime))
  }));

  const handleSave = (data) => {
    if (selectedClass) {
      setClasses(classes.map(c => c.id === selectedClass.id ? { ...c, ...data } : c));
      success('Clase actualizada');
    } else {
      setClasses([...classes, { ...data, id: Date.now().toString(), enrolledCount: 0 }]);
      success('Clase creada');
    }
    setShowAddModal(false);
    setSelectedClass(null);
  };

  const confirmDelete = () => {
    setClasses(classes.filter(c => c.id !== selectedClass.id));
    success('Clase eliminada');
    setShowDeleteConfirm(false);
  };

  if (loading) return <LoadingState message="Cargando clases..." />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold">Clases</h1><p className="text-gray-400">{classes.length} programadas</p></div>
        <Button icon={Plus} onClick={() => { setSelectedClass(null); setShowAddModal(true); }}>Nueva Clase</Button>
      </div>

      {groupedClasses.map(day => (
        <Card key={day.id}>
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Calendar size={20} className="text-emerald-500" />{day.name}</h3>
          {day.classes.length === 0 ? <p className="text-gray-500 text-center py-4">Sin clases</p> : (
            <div className="space-y-3">
              {day.classes.map(cls => (
                <div key={cls.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500"><Clock size={24} /></div>
                    <div><h4 className="font-semibold">{cls.name}</h4><p className="text-sm text-gray-400">{cls.startTime} - {cls.endTime} • {cls.coach}</p></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right"><span className={`font-semibold ${cls.enrolledCount >= cls.capacity ? 'text-red-500' : 'text-emerald-500'}`}>{cls.enrolledCount}/{cls.capacity}</span></div>
                    <Dropdown trigger={<button className="p-2 hover:bg-gray-700 rounded-lg"><MoreVertical size={20} /></button>}>
                      <DropdownItem icon={Edit} onClick={() => { setSelectedClass(cls); setShowAddModal(true); }}>Editar</DropdownItem>
                      <DropdownItem icon={Trash2} onClick={() => { setSelectedClass(cls); setShowDeleteConfirm(true); }} danger>Eliminar</DropdownItem>
                    </Dropdown>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}

      <ClassFormModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSave={handleSave} classData={selectedClass} />
      <ConfirmDialog isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={confirmDelete} title="Eliminar" message="¿Eliminar esta clase?" confirmText="Eliminar" />
    </div>
  );
};

const ClassFormModal = ({ isOpen, onClose, onSave, classData }) => {
  const [form, setForm] = useState({ name: '', dayOfWeek: 1, startTime: '08:00', endTime: '09:00', coach: '', capacity: 15, type: 'crossfit' });
  useEffect(() => { setForm(classData || { name: '', dayOfWeek: 1, startTime: '08:00', endTime: '09:00', coach: '', capacity: 15, type: 'crossfit' }); }, [classData, isOpen]);
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={classData ? 'Editar Clase' : 'Nueva Clase'}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
        <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Select label="Día" value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: parseInt(e.target.value) })} options={DAYS_OF_WEEK.slice(1, 7).map(d => ({ value: d.id, label: d.name }))} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Inicio" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
          <Input label="Fin" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
        </div>
        <Input label="Coach" value={form.coach} onChange={(e) => setForm({ ...form, coach: e.target.value })} />
        <Input label="Capacidad" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) })} />
        <div className="flex gap-3 pt-4"><Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button><Button type="submit" className="flex-1">Guardar</Button></div>
      </form>
    </Modal>
  );
};

export default Classes;
