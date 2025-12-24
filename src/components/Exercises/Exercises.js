import React, { useState, useEffect } from 'react';
import { Plus, Search, Dumbbell, MoreVertical, Edit, Trash2, Play, Filter } from 'lucide-react';
import { Button, Card, SearchInput, Modal, Badge, EmptyState, LoadingState, ConfirmDialog, Input, Select, Textarea, Dropdown, DropdownItem } from '../Common';
import { useToast } from '../../contexts/ToastContext';
import { EXERCISE_TYPES, MUSCLE_GROUPS, EQUIPMENT, DIFFICULTY_LEVELS } from '../../utils/constants';

const Exercises = () => {
  const { success } = useToast();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setExercises([
      { id: '1', name: 'Back Squat', type: 'strength', muscles: ['quadriceps', 'glutes'], equipment: ['barbell'], difficulty: 'intermediate', description: 'Sentadilla con barra en la espalda', videoUrl: '' },
      { id: '2', name: 'Deadlift', type: 'strength', muscles: ['back', 'hamstrings', 'glutes'], equipment: ['barbell'], difficulty: 'intermediate', description: 'Peso muerto convencional' },
      { id: '3', name: 'Clean & Jerk', type: 'olympic', muscles: ['full_body'], equipment: ['barbell'], difficulty: 'advanced', description: 'Cargada y envión olímpico' },
      { id: '4', name: 'Snatch', type: 'olympic', muscles: ['full_body'], equipment: ['barbell'], difficulty: 'advanced', description: 'Arranque olímpico' },
      { id: '5', name: 'Thruster', type: 'crossfit', muscles: ['quadriceps', 'shoulders'], equipment: ['barbell', 'dumbbell'], difficulty: 'intermediate', description: 'Front squat + push press' },
      { id: '6', name: 'Pull Up', type: 'crossfit', muscles: ['back', 'biceps'], equipment: ['pullup_bar'], difficulty: 'intermediate', description: 'Dominadas' },
      { id: '7', name: 'Burpee', type: 'crossfit', muscles: ['full_body'], equipment: ['bodyweight'], difficulty: 'beginner', description: 'Burpee estándar' },
      { id: '8', name: 'Box Jump', type: 'crossfit', muscles: ['quadriceps', 'glutes'], equipment: ['box'], difficulty: 'beginner', description: 'Salto al cajón' },
      { id: '9', name: 'Kettlebell Swing', type: 'crossfit', muscles: ['glutes', 'hamstrings'], equipment: ['kettlebell'], difficulty: 'beginner', description: 'Swing con kettlebell' },
      { id: '10', name: 'Row', type: 'cardio', muscles: ['full_body'], equipment: ['rower'], difficulty: 'beginner', description: 'Remo ergométrico' },
    ]);
    setLoading(false);
  }, []);

  const filteredExercises = exercises.filter(ex => {
    const matchSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType === 'all' || ex.type === filterType;
    return matchSearch && matchType;
  });

  const handleSave = (data) => {
    if (selectedExercise) {
      setExercises(exercises.map(e => e.id === selectedExercise.id ? { ...e, ...data } : e));
      success('Ejercicio actualizado');
    } else {
      setExercises([...exercises, { ...data, id: Date.now().toString() }]);
      success('Ejercicio creado');
    }
    setShowAddModal(false);
    setSelectedExercise(null);
  };

  const confirmDelete = () => {
    setExercises(exercises.filter(e => e.id !== selectedExercise.id));
    success('Ejercicio eliminado');
    setShowDeleteConfirm(false);
  };

  const getTypeBadge = (type) => {
    const colors = { strength: 'error', olympic: 'warning', crossfit: 'success', cardio: 'info', functional: 'neutral' };
    return <Badge variant={colors[type] || 'neutral'}>{EXERCISE_TYPES.find(t => t.id === type)?.name || type}</Badge>;
  };

  if (loading) return <LoadingState message="Cargando ejercicios..." />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold">Ejercicios</h1><p className="text-gray-400">{exercises.length} ejercicios</p></div>
        <Button icon={Plus} onClick={() => { setSelectedExercise(null); setShowAddModal(true); }}>Nuevo Ejercicio</Button>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Buscar ejercicio..." className="flex-1" />
          <Select value={filterType} onChange={(e) => setFilterType(e.target.value)} options={[{ value: 'all', label: 'Todos los tipos' }, ...EXERCISE_TYPES.map(t => ({ value: t.id, label: t.name }))]} />
        </div>
      </Card>

      {filteredExercises.length === 0 ? (
        <EmptyState icon={Dumbbell} title="No hay ejercicios" action={<Button icon={Plus} onClick={() => setShowAddModal(true)}>Crear</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredExercises.map(ex => (
            <Card key={ex.id} className="card-hover">
              <div className="flex justify-between">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500"><Dumbbell size={24} /></div>
                  <div>
                    <h3 className="font-semibold">{ex.name}</h3>
                    <p className="text-sm text-gray-400 mb-2">{ex.description}</p>
                    <div className="flex gap-2">{getTypeBadge(ex.type)}<Badge variant="neutral">{DIFFICULTY_LEVELS.find(d => d.id === ex.difficulty)?.name}</Badge></div>
                  </div>
                </div>
                <Dropdown trigger={<button className="p-2 hover:bg-gray-700 rounded-lg h-fit"><MoreVertical size={20} /></button>}>
                  <DropdownItem icon={Edit} onClick={() => { setSelectedExercise(ex); setShowAddModal(true); }}>Editar</DropdownItem>
                  <DropdownItem icon={Trash2} onClick={() => { setSelectedExercise(ex); setShowDeleteConfirm(true); }} danger>Eliminar</DropdownItem>
                </Dropdown>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ExerciseFormModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSave={handleSave} exercise={selectedExercise} />
      <ConfirmDialog isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={confirmDelete} title="Eliminar" message="¿Eliminar este ejercicio?" confirmText="Eliminar" />
    </div>
  );
};

const ExerciseFormModal = ({ isOpen, onClose, onSave, exercise }) => {
  const [form, setForm] = useState({ name: '', type: 'strength', muscles: [], equipment: [], difficulty: 'intermediate', description: '', videoUrl: '' });
  useEffect(() => { setForm(exercise || { name: '', type: 'strength', muscles: [], equipment: [], difficulty: 'intermediate', description: '', videoUrl: '' }); }, [exercise, isOpen]);
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={exercise ? 'Editar Ejercicio' : 'Nuevo Ejercicio'} size="lg">
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
        <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Tipo" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} options={EXERCISE_TYPES.map(t => ({ value: t.id, label: t.name }))} />
          <Select label="Dificultad" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} options={DIFFICULTY_LEVELS.map(d => ({ value: d.id, label: d.name }))} />
        </div>
        <Textarea label="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
        <Input label="URL del Video (opcional)" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://youtube.com/..." />
        <div className="flex gap-3 pt-4"><Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button><Button type="submit" className="flex-1">Guardar</Button></div>
      </form>
    </Modal>
  );
};

export default Exercises;
