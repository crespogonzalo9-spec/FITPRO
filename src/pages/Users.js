import React, { useState, useEffect } from 'react';
import { Users, MoreVertical, Edit, Shield, Building2 } from 'lucide-react';
import { Button, Card, Modal, Input, Select, SearchInput, EmptyState, LoadingState, Badge, Avatar, Dropdown, DropdownItem } from '../components/Common';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, onSnapshot, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ROLES } from '../utils/constants';
import { getRoleName, getRoleColor, formatDate } from '../utils/helpers';

const UsersPage = () => {
  const { success, error: showError } = useToast();
  const [users, setUsers] = useState([]);
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const unsubUsers = onSnapshot(query(collection(db, 'users')), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubGyms = onSnapshot(query(collection(db, 'gyms')), (snap) => {
      setGyms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => { unsubUsers(); unsubGyms(); };
  }, []);

  const filtered = users.filter(u => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const getGymName = (gymId) => gyms.find(g => g.id === gymId)?.name || 'Sin asignar';

  const handleSave = async (data) => {
    try {
      await updateDoc(doc(db, 'users', selected.id), { ...data, updatedAt: serverTimestamp() });
      success('Usuario actualizado');
      setShowModal(false);
      setSelected(null);
    } catch (err) {
      showError('Error al actualizar');
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <p className="text-gray-400">{users.length} usuarios registrados</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar..." className="flex-1" />
        <Select value={filterRole} onChange={e => setFilterRole(e.target.value)} options={[{ value: 'all', label: 'Todos los roles' }, ...ROLES.filter(r => r.id !== 'sysadmin').map(r => ({ value: r.id, label: r.name }))]} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No hay usuarios" />
      ) : (
        <div className="space-y-3">
          {filtered.map(user => (
            <Card key={user.id} className="hover:border-emerald-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar name={user.name} size="lg" />
                  <div>
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-gray-400">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getRoleColor(user.role)}>{getRoleName(user.role)}</Badge>
                      {user.gymId && <span className="text-xs text-gray-500 flex items-center gap-1"><Building2 size={12} />{getGymName(user.gymId)}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 hidden sm:block">{formatDate(user.createdAt)}</span>
                  {user.role !== 'sysadmin' && (
                    <Dropdown trigger={<button className="p-2 hover:bg-gray-700 rounded-lg"><MoreVertical size={18} /></button>}>
                      <DropdownItem icon={Edit} onClick={() => { setSelected(user); setShowModal(true); }}>Editar</DropdownItem>
                      <DropdownItem icon={Shield} onClick={() => { setSelected(user); setShowModal(true); }}>Cambiar Rol</DropdownItem>
                    </Dropdown>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <UserModal isOpen={showModal} onClose={() => { setShowModal(false); setSelected(null); }} onSave={handleSave} user={selected} gyms={gyms} />
    </div>
  );
};

const UserModal = ({ isOpen, onClose, onSave, user, gyms }) => {
  const [form, setForm] = useState({ role: 'alumno', gymId: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) setForm({ role: user.role || 'alumno', gymId: user.gymId || '' });
  }, [user, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  const roleOptions = ROLES.filter(r => r.id !== 'sysadmin').map(r => ({ value: r.id, label: r.name }));
  const gymOptions = gyms.map(g => ({ value: g.id, label: g.name }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Usuario">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl mb-4">
          <Avatar name={user?.name} size="lg" />
          <div>
            <p className="font-semibold">{user?.name}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
        </div>
        
        <Select label="Rol" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} options={roleOptions} />
        
        {form.role !== 'sysadmin' && (
          <Select label="Gimnasio" value={form.gymId} onChange={e => setForm({ ...form, gymId: e.target.value })} options={gymOptions} placeholder="Sin asignar" />
        )}
        
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
};

export default UsersPage;
