import React, { useState, useEffect } from 'react';
import { Plus, Search, Dumbbell, Play, MoreVertical, Edit, Trash2, Filter } from 'lucide-react';
import { Button, Card, SearchInput, Modal, Badge, EmptyState, LoadingState, ConfirmDialog, Input, Select, Textarea, Checkbox, Dropdown, DropdownItem } from '../Common';
import { useGym } from '../../contexts/GymContext';
import { useToast } from '../../contexts/ToastContext';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { EXERCISE_TYPES, MUSCLE_GROUPS, EQUIPMENT, DIFFICULTY_LEVELS } from '../../utils/constants';

const ExerciseList = () => {
  const { currentGym } = useGym();
  const { success, error } = useToast();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    instructions: '',
    type: 'strength',
    muscles: [],
    equipment: [],
    difficulty: 'intermediate',
    videoUrl: ''
  });

  useEffect(() => {
    if (!currentGym?.id) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'exercises'),
      where('gymId', '==', currentGym.id)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExercises(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentGym]);

  const filteredExercises = exercises.filter(ex => {
    const matchSearch = ex.name?.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || ex.type === typeFilter;
    return matchSearch && matchType;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedExercise) {
        await updateDoc(doc(db, 'exercises', selectedExercise.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        success('Ejercicio actualizado');
      } else {
        await addDoc(collection(db, 'exercises'), {
          ...formData,
          gymId: currentGym.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        success('Ejercicio creado');
      }
      
      setShowModal(false);
      resetForm();
    } catch (err) {
      error(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'exercises', selectedExercise.id));
      success('Ejercicio eliminado');
      setShowDeleteConfirm(false);
      setSelectedExercise(null);
    } catch (err) {
      error(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      instructions: '',
      type: 'strength',
      muscles: [],
      equipment: [],
      difficulty: 'intermediate',
      videoUrl: ''
    });
    setSelectedExercise(null);
  };

  const openEdit = (exercise) => {
    setSelectedExercise(exercise);
    setFormData({
      name: exercise.name,
      description: exercise.description || '',
      instructions: exercise.instructions || '',
      type: exercise.type,
      muscles: exercise.muscles || [],
      equipment: exercise.equipment || [],
      difficulty: exercise.difficulty || 'intermediate',
      videoUrl: exercise.videoUrl || ''
    });
    setShowModal(true);
  };

  const toggleArrayItem = (field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const getTypeName = (typeId) => EXERCISE_TYPES.find(t => t.id === typeId)?.name || typeId;
  const getDifficultyInfo = (diffId) => DIFFICULTY_LEVELS.find(d => d.id === diffId) || {};

  if (loading) return <LoadingState message="Cargando ejercicios..." />;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-3">
          <SearchInput 
            value={search} 
            onChange={setSearch} 
            placeholder="Buscar ejercicios..." 
            className="flex-1 max-w-md" 
          />
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: '', label: 'Todos los tipos' },
              ...EXERCISE_TYPES.map(t => ({ value: t.id, label: t.name }))
            ]}
            className="w-48"
          />
        </div>
        <Button icon={Plus} onClick={() => { resetForm(); setShowModal(true); }}>
          Nuevo Ejercicio
        </Button>
      </div>

      {/* Exercise Grid */}
      {filteredExercises.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No hay ejercicios"
          description="Agregá ejercicios a tu base de datos"
          action={
            <Button icon={Plus} onClick={() => setShowModal(true)}>
              Agregar Ejercicio
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredExercises.map(exercise => (
            <Card key={exercise.id} className="card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <Dumbbell size={24} className="text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{exercise.name}</h3>
                    <Badge variant="info">{getTypeName(exercise.type)}</Badge>
                  </div>
                </div>
                <Dropdown
                  trigger={
                    <button className="p-1 hover:bg-gray-700 rounded">
                      <MoreVertical size={18} />
                    </button>
                  }
                >
                  <DropdownItem icon={Edit} onClick={() => openEdit(exercise)}>
                    Editar
                  </DropdownItem>
                  <DropdownItem 
                    icon={Trash2} 
                    danger 
                    onClick={() => { setSelectedExercise(exercise); setShowDeleteConfirm(true); }}
                  >
                    Eliminar
                  </DropdownItem>
                </Dropdown>
              </div>

              {exercise.description && (
                <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                  {exercise.description}
                </p>
              )}

              <div className="flex flex-wrap gap-1 mb-3">
                {exercise.muscles?.slice(0, 3).map(muscle => (
                  <span key={muscle} className="text-xs bg-gray-800 px-2 py-1 rounded">
                    {MUSCLE_GROUPS.find(m => m.id === muscle)?.name || muscle}
                  </span>
                ))}
                {exercise.muscles?.length > 3 && (
                  <span className="text-xs bg-gray-800 px-2 py-1 rounded">
                    +{exercise.muscles.length - 3}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span 
                  className="text-xs font-medium px-2 py-1 rounded"
                  style={{ 
                    backgroundColor: `${getDifficultyInfo(exercise.difficulty).color}20`,
                    color: getDifficultyInfo(exercise.difficulty).color
                  }}
                >
                  {getDifficultyInfo(exercise.difficulty).name}
                </span>
                {exercise.videoUrl && (
                  <a 
                    href={exercise.videoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-emerald-500 hover:text-emerald-400"
                  >
                    <Play size={14} /> Ver video
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Form */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedExercise ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Ej: Back Squat"
              required
            />
            <Select
              label="Tipo"
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              options={EXERCISE_TYPES.map(t => ({ value: t.id, label: t.name }))}
            />
          </div>

          <Textarea
            label="Descripción"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Breve descripción del ejercicio..."
            rows={2}
          />

          <Textarea
            label="Instrucciones"
            value={formData.instructions}
            onChange={(e) => setFormData({...formData, instructions: e.target.value})}
            placeholder="Paso a paso de cómo realizar el ejercicio..."
            rows={3}
          />

          <div>
            <label className="form-label mb-2 block">Músculos trabajados</label>
            <div className="flex flex-wrap gap-2">
              {MUSCLE_GROUPS.map(muscle => (
                <button
                  key={muscle.id}
                  type="button"
                  onClick={() => toggleArrayItem('muscles', muscle.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    formData.muscles.includes(muscle.id)
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {muscle.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="form-label mb-2 block">Equipamiento</label>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT.map(equip => (
                <button
                  key={equip.id}
                  type="button"
                  onClick={() => toggleArrayItem('equipment', equip.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    formData.equipment.includes(equip.id)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {equip.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Dificultad"
              value={formData.difficulty}
              onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
              options={DIFFICULTY_LEVELS.map(d => ({ value: d.id, label: d.name }))}
            />
            <Input
              label="URL del Video"
              value={formData.videoUrl}
              onChange={(e) => setFormData({...formData, videoUrl: e.target.value})}
              placeholder="https://youtube.com/..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {selectedExercise ? 'Guardar Cambios' : 'Crear Ejercicio'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Eliminar Ejercicio"
        message={`¿Estás seguro de eliminar "${selectedExercise?.name}"?`}
      />
    </div>
  );
};

export default ExerciseList;
