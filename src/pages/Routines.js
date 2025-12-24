import React, { useState } from 'react';
import { Plus, ClipboardList, Calendar, Clock, Users, Edit, Trash2, Copy } from 'lucide-react';
import { Button, Card, SearchInput, Modal, Badge, EmptyState, Input, Select, Textarea, Dropdown, DropdownItem } from '../components/Common';
import { useToast } from '../contexts/ToastContext';
import { WOD_TYPES } from '../utils/constants';

const Routines = () => {
  const { success } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState(null);

  const routines = [
    { id: '1', name: 'Fran', type: 'for_time', date: '2024-12-20', className: 'CrossFit 08:00', description: '21-15-9\nThrusters (43/30kg)\nPull-ups', exercises: ['Thruster', 'Pull Up'], timeCap: 10 },
    { id: '2', name: 'Strength Day', type: 'strength', date: '2024-12-21', className: 'CrossFit 08:00', description: 'Back Squat 5x5\nBench Press 5x5\nBarbell Row 5x5', exercises: ['Back Squat', 'Bench Press', 'Barbell Row'], timeCap: null },
    { id: '3', name: 'Cindy', type: 'amrap', date: '2024-12-22', className: 'Funcional 18:00', description: '20 min AMRAP:\n5 Pull-ups\n10 Push-ups\n15 Air Squats', exercises: ['Pull Up', 'Push Up', 'Air Squat'], timeCap: 20 },
    { id: '4', name: 'EMOM Cardio', type: 'emom', date: '2024-12-23', className: 'CrossFit 10:00', description: '12 min EMOM:\nMin 1: 15 Cal Row\nMin 2: 12 Burpees\nMin 3: Rest', exercises: ['Row', 'Burpee'], timeCap: 12 },
  ];

  const getWodTypeInfo = (type) => WOD_TYPES.find(t => t.id === type) || {};

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Rutinas</h1>
          <p className="text-gray-400">Programación de entrenamientos</p>
        </div>
        <Button icon={Plus} onClick={() => { setSelectedRoutine(null); setShowModal(true); }}>Nueva Rutina</Button>
      </div>

      {routines.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No hay rutinas" description="Creá la primera rutina de entrenamiento" action={<Button icon={Plus} onClick={() => setShowModal(true)}>Crear Rutina</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routines.map(routine => (
            <Card key={routine.id} className="hover:border-gray-600 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{routine.name}</h3>
                  <Badge variant="info">{getWodTypeInfo(routine.type).name}</Badge>
                </div>
                <Dropdown trigger={<button className="p-2 hover:bg-gray-700 rounded-lg"><Edit size={16} /></button>}>
                  <DropdownItem icon={Edit} onClick={() => { setSelectedRoutine(routine); setShowModal(true); }}>Editar</DropdownItem>
                  <DropdownItem icon={Copy}>Duplicar</DropdownItem>
                  <DropdownItem icon={Trash2} danger>Eliminar</DropdownItem>
                </Dropdown>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                <span className="flex items-center gap-1"><Calendar size={14} />{routine.date}</span>
                <span className="flex items-center gap-1"><Users size={14} />{routine.className}</span>
                {routine.timeCap && <span className="flex items-center gap-1"><Clock size={14} />{routine.timeCap} min</span>}
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-3">
                <pre className="text-sm whitespace-pre-wrap font-mono text-gray-300">{routine.description}</pre>
              </div>

              <div className="flex flex-wrap gap-1 mt-3">
                {routine.exercises.map(ex => (
                  <span key={ex} className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded">{ex}</span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={selectedRoutine ? 'Editar Rutina' : 'Nueva Rutina'} size="lg">
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre" placeholder="Fran, Cindy, Strength Day..." required />
            <Select label="Tipo" options={WOD_TYPES.map(t => ({ value: t.id, label: t.name }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Fecha" type="date" />
            <Input label="Time Cap (min)" type="number" placeholder="Opcional" />
          </div>
          <Textarea label="Descripción del WOD" placeholder="Describe el entrenamiento..." rows={6} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" onClick={() => { setShowModal(false); success('Rutina guardada'); }}>Guardar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Routines;
