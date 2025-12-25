import React, { useState, useEffect } from 'react';
import { Plus, UserCheck, MoreVertical, Edit, Trash2, Mail, Phone, Shield } from 'lucide-react';
import { Button, Card, Modal, Input, Select, SearchInput, EmptyState, LoadingState, ConfirmDialog, Badge, Avatar, Dropdown, DropdownItem } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { formatDate } from '../utils/helpers';

const Profesores = () => {
  const { userData, isAdmin } = useAuth();
  const { currentGym } = useGym();
  const { success, error: showError } = useToast();
  const [profesores, setProfesores] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showRemove, setShowRemove] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!currentGym?.id) { setLoading(false); return; }

    // Profesores del gimnasio
    const qProfesores = query(
      collection(db, 'users'),
      where('gymId', '==', currentGym.id),
      where('role', '==', 'profesor')
    );
    const unsubProfesores = onSnapshot(qProfesores, (snap) => {
      setProfesores(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    // Todos los usuarios del gimnasio (para poder asignar)
    const qUsers = query(
      collection(db, 'users'),
      where('gymId', '==', currentGym.id)
    );
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubProfesores(); unsubUsers(); };
  }, [currentGym]);

  const filtered = profesores.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssignProfesor = async (userId) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: 'profesor',
        updatedAt: serverTimestamp()
      });
      success('Profesor asignado');
      setShowModal(false);
    } catch (err) {
      showError('Error al asignar');
    }
  };

  const handleRemoveProfesor = async () => {
    try {
      await updateDoc(doc(db, 'users', selected.id), {
        role: 'alumno',
        updatedAt: serverTimestamp()
      });
      success('Rol de profesor removido');
      setShowRemove(false);
      setSelected(null);
    } catch (err) {
      showError('Error al remover');
    }
  };

  // Usuarios que pueden ser asignados como profesores (alumnos del gimnasio)
  const availableUsers = allUsers.filter(u => u.role === 'alumno');

  if (loading) return <LoadingState />;
  if (!currentGym) return <EmptyState icon={UserCheck} title="Sin gimnasio" />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Profesores</h1>
          <p className="text-gray-400">{profesores.length} profesores en {currentGym.name}</p>
        </div>
        {isAdmin() && (
          <Button icon={Plus} onClick={() => setShowModal(true)}>
            Asignar Profesor
          </Button>
        )}
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Buscar profesor..." />

      {filtered.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="Sin profesores"
          description="Asigna el rol de profesor a los alumnos que darán clases"
          action={isAdmin() && <Button icon={Plus} onClick={() => setShowModal(true)}>Asignar</Button>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(profesor => (
            <Card key={profesor.id} className="hover:border-emerald-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar name={profesor.name} size="lg" />
                  <div>
                    <h3 className="font-semibold">{profesor.name}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                      <span className="flex items-center gap-1"><Mail size={14} />{profesor.email}</span>
                      {profesor.phone && <span className="flex items-center gap-1"><Phone size={14} />{profesor.phone}</span>}
                    </div>
                    <Badge variant="emerald" className="mt-1">
                      <UserCheck size={12} className="mr-1" /> Profesor
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 hidden sm:block">Desde {formatDate(profesor.createdAt)}</span>
                  {isAdmin() && (
                    <Dropdown trigger={<button className="p-2 hover:bg-gray-700 rounded-lg"><MoreVertical size={18} /></button>}>
                      <DropdownItem icon={Shield} danger onClick={() => { setSelected(profesor); setShowRemove(true); }}>
                        Quitar rol de profesor
                      </DropdownItem>
                    </Dropdown>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal para asignar profesor */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Asignar Profesor" size="lg">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">Selecciona un alumno para asignarle el rol de profesor:</p>
          
          {availableUsers.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay alumnos disponibles para asignar</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableUsers.map(user => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800 cursor-pointer"
                  onClick={() => handleAssignProfesor(user.id)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={user.name} size="md" />
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="secondary">Asignar</Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showRemove}
        onClose={() => setShowRemove(false)}
        onConfirm={handleRemoveProfesor}
        title="Quitar rol de profesor"
        message={`¿Quitar el rol de profesor a ${selected?.name}? Pasará a ser alumno.`}
        confirmText="Quitar rol"
      />
    </div>
  );
};

export default Profesores;
