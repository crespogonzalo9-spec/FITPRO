import React, { useState, useEffect } from 'react';
import { Users, MoreVertical, Edit, Shield, Building2, Crown, Trash2 } from 'lucide-react';
import { Button, Card, Modal, Input, Select, SearchInput, EmptyState, LoadingState, Badge, Avatar, Dropdown, DropdownItem, ConfirmDialog } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, onSnapshot, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { getRoleName, getRoleColor, formatDate } from '../utils/helpers';

const UsersPage = () => {
  const { userData, isSysadmin } = useAuth();
  const { success, error: showError } = useToast();
  
  const [users, setUsers] = useState([]);
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    // Cargar todos los usuarios
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    // Cargar gimnasios
    const unsubGyms = onSnapshot(collection(db, 'gyms'), (snap) => {
      setGyms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubUsers(); unsubGyms(); };
  }, []);

  const getFilteredUsers = () => {
    let filtered = users;
    
    if (filterRole !== 'all') {
      filtered = filtered.filter(u => u.role === filterRole);
    }
    
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(u => 
        u.name?.toLowerCase().includes(s) || 
        u.email?.toLowerCase().includes(s)
      );
    }
    
    // Ordenar: sysadmin primero, luego admin, profesor, alumno
    const roleOrder = { sysadmin: 0, admin: 1, profesor: 2, alumno: 3 };
    filtered.sort((a, b) => (roleOrder[a.role] || 4) - (roleOrder[b.role] || 4));
    
    return filtered;
  };

  const handleSave = async (data) => {
    try {
      await updateDoc(doc(db, 'users', selected.id), {
        ...data,
        updatedAt: serverTimestamp()
      });
      success('Usuario actualizado');
      setShowModal(false);
      setSelected(null);
    } catch (err) {
      showError('Error al actualizar');
    }
  };

  const handleDelete = async () => {
    try {
      // No permitir eliminar al propio usuario
      if (selected.id === userData.id) {
        showError('No podés eliminarte a vos mismo');
        return;
      }
      await deleteDoc(doc(db, 'users', selected.id));
      success('Usuario eliminado');
      setShowDelete(false);
      setSelected(null);
    } catch (err) {
      showError('Error al eliminar');
    }
  };

  const getGymName = (gymId) => gyms.find(g => g.id === gymId)?.name || 'Sin gimnasio';

  const filteredUsers = getFilteredUsers();

  if (!isSysadmin()) {
    return <EmptyState icon={Shield} title="Acceso denegado" description="Solo sysadmin puede ver esta página" />;
  }

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-gray-400">{filteredUsers.length} usuarios en el sistema</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre o email..." className="flex-1" />
        <Select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          options={[
            { value: 'all', label: 'Todos los roles' },
            { value: 'sysadmin', label: '👑 Sysadmin' },
            { value: 'admin', label: '🔧 Admin' },
            { value: 'profesor', label: '👨‍🏫 Profesor' },
            { value: 'alumno', label: '👤 Alumno' }
          ]}
          className="w-full sm:w-48"
        />
      </div>

      {/* Lista de usuarios */}
      {filteredUsers.length === 0 ? (
        <EmptyState icon={Users} title="No hay usuarios" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map(user => (
            <Card key={user.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={user.name} size="lg" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{user.name}</h3>
                      {user.role === 'sysadmin' && <Crown size={16} className="text-yellow-500" />}
                    </div>
                    <p className="text-sm text-gray-400">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getRoleColor(user.role)}>{getRoleName(user.role)}</Badge>
                      {user.id === userData.id && <Badge className="bg-blue-500/20 text-blue-400">Vos</Badge>}
                    </div>
                  </div>
                </div>
                <Dropdown trigger={<button className="p-2 hover:bg-gray-700 rounded-lg"><MoreVertical size={18} /></button>}>
                  <DropdownItem icon={Edit} onClick={() => { setSelected(user); setShowModal(true); }}>Editar</DropdownItem>
                  {user.id !== userData.id && (
                    <DropdownItem icon={Trash2} danger onClick={() => { setSelected(user); setShowDelete(true); }}>Eliminar</DropdownItem>
                  )}
                </Dropdown>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-700 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Building2 size={14} />
                  <span>{getGymName(user.gymId)}</span>
                </div>
                <p className="text-xs mt-1">Registrado: {formatDate(user.createdAt)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal editar usuario */}
      <UserModal 
        isOpen={showModal} 
        onClose={() => { setShowModal(false); setSelected(null); }} 
        onSave={handleSave} 
        user={selected}
        gyms={gyms}
        currentUserId={userData?.id}
      />

      {/* Confirmar eliminar */}
      <ConfirmDialog 
        isOpen={showDelete} 
        onClose={() => setShowDelete(false)} 
        onConfirm={handleDelete} 
        title="Eliminar Usuario" 
        message={`¿Eliminar a "${selected?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar" 
      />
    </div>
  );
};

const UserModal = ({ isOpen, onClose, onSave, user, gyms, currentUserId }) => {
  const [form, setForm] = useState({ role: 'alumno', gymId: '', isActive: true });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        role: user.role || 'alumno',
        gymId: user.gymId || '',
        isActive: user.isActive !== false
      });
    }
  }, [user, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  const isEditingSelf = user?.id === currentUserId;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Editar: ${user?.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-gray-800/50 rounded-xl">
          <p className="text-sm text-gray-400">Email</p>
          <p className="font-medium">{user?.email}</p>
        </div>

        <Select 
          label="Rol" 
          value={form.role} 
          onChange={e => setForm({ ...form, role: e.target.value })}
          options={[
            { value: 'sysadmin', label: '👑 Sysadmin (poder absoluto)' },
            { value: 'admin', label: '🔧 Administrador' },
            { value: 'profesor', label: '👨‍🏫 Profesor' },
            { value: 'alumno', label: '👤 Alumno' }
          ]}
          disabled={isEditingSelf}
        />
        {isEditingSelf && (
          <p className="text-xs text-yellow-500">No podés cambiar tu propio rol</p>
        )}

        <Select 
          label="Gimnasio" 
          value={form.gymId} 
          onChange={e => setForm({ ...form, gymId: e.target.value })}
          options={[
            { value: '', label: 'Sin gimnasio' },
            ...gyms.map(g => ({ value: g.id, label: g.name }))
          ]}
        />

        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
          <span>Usuario Activo</span>
          <button
            type="button"
            onClick={() => !isEditingSelf && setForm({ ...form, isActive: !form.isActive })}
            className={`relative w-12 h-6 rounded-full transition-colors ${form.isActive ? 'bg-green-500' : 'bg-gray-600'} ${isEditingSelf ? 'opacity-50' : ''}`}
            disabled={isEditingSelf}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.isActive ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
};

export default UsersPage;
