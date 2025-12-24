import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, Users, MoreVertical, Edit, Trash2, Copy } from 'lucide-react';
import { Button, Card, Modal, Badge, EmptyState, LoadingState, ConfirmDialog, Input, Select, Textarea, Dropdown, DropdownItem } from '../Common';
import { useGym } from '../../contexts/GymContext';
import { useToast } from '../../contexts/ToastContext';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { DAYS_OF_WEEK, WOD_TYPES } from '../../utils/constants';

const ClassList = () => {
  const { currentGym } = useGym();
  const { success, error } = useToast();
  const [classes, setClasses] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedDay, setSelectedDay] = useState(1); // Lunes por defecto
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    coachId: '',
    dayOfWeek: 1,
    startTime: '08:00',
    duration: 60,
    capacity: 15,
    type: 'crossfit'
  });

  useEffect(() => {
    if (!currentGym?.id) {
      setLoading(false);
      return;
    }

    // Cargar clases
    const classesQuery = query(
      collection(db, 'classes'),
      where('gymId', '==', currentGym.id),
      where('isActive', '==', true)
    );
    
    const unsubClasses = onSnapshot(classesQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClasses(data);
      setLoading(false);
    });

    // Cargar coaches
    const coachesQuery = query(
      collection(db, 'users'),
      where('gymId', '==', currentGym.id),
      where('role', '==', 'coach')
    );
    
    const unsubCoaches = onSnapshot(coachesQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCoaches(data);
    });

    return () => {
      unsubClasses();
      unsubCoaches();
    };
  }, [currentGym]);

  const classesByDay = DAYS_OF_WEEK.map(day => ({
    ...day,
    classes: classes
      .filter(c => c.dayOfWeek === day.id)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const classData = {
        ...formData,
        gymId: currentGym.id,
        enrolledCount: 0,
        isActive: true
      };

      if (selectedClass) {
        await updateDoc(doc(db, 'classes', selectedClass.id), {
          ...classData,
          updatedAt: serverTimestamp()
        });
        success('Clase actualizada');
      } else {
        await addDoc(collection(db, 'classes'), {
          ...classData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        success('Clase creada');
      }
      
      setShowModal(false);
      resetForm();
    } catch (err) {
      error(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await updateDoc(doc(db, 'classes', selectedClass.id), { isActive: false });
      success('Clase eliminada');
      setShowDeleteConfirm(false);
      setSelectedClass(null);
    } catch (err) {
      error(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      coachId: '',
      dayOfWeek: selectedDay,
      startTime: '08:00',
      duration: 60,
      capacity: 15,
      type: 'crossfit'
    });
    setSelectedClass(null);
  };

  const openEdit = (classItem) => {
    setSelectedClass(classItem);
    setFormData({
      name: classItem.name,
      description: classItem.description || '',
      coachId: classItem.coachId || '',
      dayOfWeek: classItem.dayOfWeek,
      startTime: classItem.startTime,
      duration: classItem.duration,
      capacity: classItem.capacity,
      type: classItem.type || 'crossfit'
    });
    setShowModal(true);
  };

  const duplicateClass = (classItem) => {
    setSelectedClass(null);
    setFormData({
      name: classItem.name,
      description: classItem.description || '',
      coachId: classItem.coachId || '',
      dayOfWeek: classItem.dayOfWeek,
      startTime: classItem.startTime,
      duration: classItem.duration,
      capacity: classItem.capacity,
      type: classItem.type || 'crossfit'
    });
    setShowModal(true);
  };

  const getCoachName = (coachId) => {
    const coach = coaches.find(c => c.id === coachId);
    return coach?.name || 'Sin asignar';
  };

  if (loading) return <LoadingState message="Cargando clases..." />;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Horarios de Clases</h2>
          <p className="text-gray-400 text-sm">Gestiona el calendario semanal de clases</p>
        </div>
        <Button icon={Plus} onClick={() => { resetForm(); setShowModal(true); }}>
          Nueva Clase
        </Button>
      </div>

      {/* Days Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {DAYS_OF_WEEK.map(day => (
          <button
            key={day.id}
            onClick={() => setSelectedDay(day.id)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedDay === day.id
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {day.name}
            <span className="ml-2 text-xs opacity-70">
              ({classesByDay.find(d => d.id === day.id)?.classes.length || 0})
            </span>
          </button>
        ))}
      </div>

      {/* Classes for Selected Day */}
      <div className="space-y-3">
        {classesByDay.find(d => d.id === selectedDay)?.classes.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No hay clases"
            description={`No hay clases programadas para ${DAYS_OF_WEEK.find(d => d.id === selectedDay)?.name}`}
            action={
              <Button icon={Plus} onClick={() => { resetForm(); setFormData(f => ({...f, dayOfWeek: selectedDay})); setShowModal(true); }}>
                Agregar Clase
              </Button>
            }
          />
        ) : (
          classesByDay.find(d => d.id === selectedDay)?.classes.map(classItem => (
            <Card key={classItem.id} className="card-hover">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 text-center">
                    <div className="text-2xl font-bold text-emerald-500">{classItem.startTime}</div>
                    <div className="text-xs text-gray-500">{classItem.duration} min</div>
                  </div>
                  
                  <div className="h-12 w-px bg-gray-700" />
                  
                  <div>
                    <h3 className="font-semibold text-lg">{classItem.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>Coach: {getCoachName(classItem.coachId)}</span>
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {classItem.enrolledCount || 0}/{classItem.capacity}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={classItem.enrolledCount >= classItem.capacity ? 'error' : 'success'}>
                    {classItem.enrolledCount >= classItem.capacity ? 'Completo' : 'Disponible'}
                  </Badge>
                  
                  <Dropdown
                    trigger={
                      <button className="p-2 hover:bg-gray-700 rounded-lg">
                        <MoreVertical size={18} />
                      </button>
                    }
                  >
                    <DropdownItem icon={Edit} onClick={() => openEdit(classItem)}>
                      Editar
                    </DropdownItem>
                    <DropdownItem icon={Copy} onClick={() => duplicateClass(classItem)}>
                      Duplicar
                    </DropdownItem>
                    <DropdownItem 
                      icon={Trash2} 
                      danger 
                      onClick={() => { setSelectedClass(classItem); setShowDeleteConfirm(true); }}
                    >
                      Eliminar
                    </DropdownItem>
                  </Dropdown>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedClass ? 'Editar Clase' : 'Nueva Clase'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre de la clase"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Ej: CrossFit"
              required
            />
            <Select
              label="Tipo"
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              options={WOD_TYPES.map(t => ({ value: t.id, label: t.name }))}
            />
          </div>

          <Textarea
            label="Descripción"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Descripción de la clase..."
            rows={2}
          />

          <Select
            label="Entrenador"
            value={formData.coachId}
            onChange={(e) => setFormData({...formData, coachId: e.target.value})}
            options={coaches.map(c => ({ value: c.id, label: c.name }))}
            placeholder="Seleccionar entrenador"
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Select
              label="Día"
              value={formData.dayOfWeek}
              onChange={(e) => setFormData({...formData, dayOfWeek: parseInt(e.target.value)})}
              options={DAYS_OF_WEEK.map(d => ({ value: d.id, label: d.name }))}
            />
            <Input
              label="Hora inicio"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({...formData, startTime: e.target.value})}
              required
            />
            <Input
              label="Duración (min)"
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
              min={15}
              max={180}
            />
            <Input
              label="Capacidad"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
              min={1}
              max={50}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {selectedClass ? 'Guardar Cambios' : 'Crear Clase'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Eliminar Clase"
        message={`¿Estás seguro de eliminar la clase "${selectedClass?.name}"? Los atletas inscriptos serán notificados.`}
      />
    </div>
  );
};

export default ClassList;
