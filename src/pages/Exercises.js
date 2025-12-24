import React, { useState } from 'react';
import { Plus, Search, Dumbbell, Edit, Trash2, Play, Filter } from 'lucide-react';
import { Button, Card, SearchInput, Modal, Badge, EmptyState, Input, Select, Textarea, Dropdown, DropdownItem } from '../components/Common';
import { useToast } from '../contexts/ToastContext';
import { EXERCISE_TYPES, MUSCLE_GROUPS, EQUIPMENT, DIFFICULTY_LEVELS } from '../utils/constants';

const Exercises = () => {
  const { success } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);

  const exercises = [
    { id: '1', name: 'Back Squat', type: 'strength', muscles: ['quadriceps', 'glutes'], equipment: ['barbell'], difficulty: 'intermediate', videoUrl: '', description: 'Sentadilla con barra en la espalda' },
    { id: '2', name: 'Deadlift', type: 'strength', muscles: ['back', 'hamstrings', 'glutes'], equipment: ['barbell'], difficulty: 'intermediate', videoUrl: '', description: 'Peso muerto convencional' },
    { id: '3', name: 'Clean & Jerk', type: 'olympic', muscles: ['full_body'], equipment: ['barbell'], difficulty: 'advanced', videoUrl: '', description: 'Cargada y envión olímpico' },
    { id: '4', name: 'Thruster', type: 'crossfit', muscles: ['quadriceps', 'shoulders'], equipment: ['barbell', 'dumbbell'], difficulty: 'intermediate', videoUrl: '', description: 'Front squat + push press' },
    { id: '5', name: 'Pull Up', type: 'crossfit', muscles: ['back', 'biceps'], equipment: ['pullup_bar'], difficulty: 'intermediate', videoUrl: '', description: 'Dominada estricta' },
    { id: '6', name: 'Burpee', type: 'crossfit', muscles: ['full_body'], equipment: ['bodyweight'], difficulty: 'beginner', videoUrl: '', description: 'Burpee estándar' },
    { id: '7', name: 'Box Jump', type: 'crossfit', muscles: ['quadriceps', 'glutes'], equipment: ['box'], difficulty: 'beginner', videoUrl: '', description: 'Salto al cajón' },
    { id: '8', name: 'Kettlebell Swing', type: 'functional', muscles: ['glutes', 'hamstrings'], equipment: ['kettlebell'], difficulty: 'beginner', videoUrl: '', description: 'Swing con kettlebell' },
  ];

  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || ex.type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeInfo = (type) => EXERCISE_TYPES.find(t => t.id === type) || {};
  const getDifficultyInfo = (diff) => DIFFICULTY_LEVELS.find(d => d.id === diff) || {};

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Ejercicios</h1>
          <p className="text-gray-400">Base de datos de ejercicios del gimnasio</p>
        </div>
        <Button icon={Plus} onClick={() => { setSelectedExercise(null); setShowModal(true); }}>Nuevo Ejercicio</Button>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Buscar ejercicio..." className="flex-1" />
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            options={[{ value: 'all', label: 'Todos los tipos' }, ...EXERCISE_TYPES.map(t => ({ value: t.id, label: t.name }))]}
          />
        </div>
      </Card>

      {filteredExercises.length === 0 ? (
        <EmptyState icon={Dumbbell} title="No hay ejercicios" description="Agregá ejercicios a la base de datos" action={<Button icon={Plus} onClick={() => setShowModal(true)}>Agregar</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExercises.map(ex => (
            <Card key={ex.id} hover onClick={() => { setSelectedExercise(ex); setShowModal(true); }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                    <Dumbbell size={20} className="text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{ex.name}</h3>
                    <Badge variant="info">{getTypeInfo(ex.type).name}</Badge>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-3">{ex.description}</p>
              <div className="flex flex-wrap gap-1">
                {ex.muscles.slice(0, 3).map(m => (
                  <span key={m} className="text-xs bg-gray-700 px-2 py-0.5 rounded">{MUSCLE_GROUPS.find(mg => mg.id === m)?.name}</span>
                ))}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
                <span className="text-xs" style={{ color: getDifficultyInfo(ex.difficulty).color }}>{getDifficultyInfo(ex.difficulty).name}</span>
                {ex.videoUrl && <Play size={16} className="text-gray-400" />}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={selectedExercise ? 'Editar Ejercicio' : 'Nuevo Ejercicio'} size="lg">
        <form className="space-y-4">
          <Input label="Nombre" defaultValue={selectedExercise?.name} placeholder="Back Squat, Deadlift..." required />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Tipo" options={EXERCISE_TYPES.map(t => ({ value: t.id, label: t.name }))} />
            <Select label="Dificultad" options={DIFFICULTY_LEVELS.map(d => ({ value: d.id, label: d.name }))} />
          </div>
          <Input label="URL del video (opcional)" placeholder="https://youtube.com/watch?v=..." />
          <Textarea label="Descripción / Instrucciones" placeholder="Describe cómo realizar el ejercicio..." rows={4} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" onClick={() => { setShowModal(false); success('Ejercicio guardado'); }}>Guardar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Exercises;
