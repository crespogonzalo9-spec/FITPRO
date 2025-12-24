import React, { useState, useEffect } from 'react';
import { Plus, Mail, Phone, MoreVertical, Edit, Trash2, Eye, Users } from 'lucide-react';
import { Button, Card, SearchInput, Modal, Badge, Avatar, EmptyState, LoadingState, ConfirmDialog, Input, Select, Dropdown, DropdownItem } from '../Common';
import { useToast } from '../../contexts/ToastContext';
import { formatDate, getSubscriptionStatusColor, getSubscriptionStatusName } from '../../utils/helpers';
import { SUBSCRIPTION_STATUS } from '../../utils/constants';

const Members = () => {
  const { success } = useToast();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setMembers([
      { id: '1', name: 'María García', email: 'maria@email.com', phone: '1155551234', subscriptionStatus: 'active', classesAttended: 24, createdAt: new Date('2024-06-10') },
      { id: '2', name: 'Juan Pérez', email: 'juan@email.com', phone: '1155555678', subscriptionStatus: 'active', classesAttended: 18, createdAt: new Date('2024-07-15') },
      { id: '3', name: 'Ana López', email: 'ana@email.com', phone: '1155559012', subscriptionStatus: 'expired', classesAttended: 45, createdAt: new Date('2024-03-20') },
      { id: '4', name: 'Carlos Ruiz', email: 'carlos@email.com', phone: '1155553456', subscriptionStatus: 'pending', classesAttended: 0, createdAt: new Date('2024-12-20') },
      { id: '5', name: 'Laura Martínez', email: 'laura@email.com', phone: '1155557890', subscriptionStatus: 'active', classesAttended: 32, createdAt: new Date('2024-05-01') },
    ]);
    setLoading(false);
  }, []);

  const filteredMembers = members.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || m.subscriptionStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleSave = (data) => {
    if (selectedMember) {
      setMembers(members.map(m => m.id === selectedMember.id ? { ...m, ...data } : m));
      success('Miembro actualizado');
    } else {
      setMembers([...members, { ...data, id: Date.now().toString(), classesAttended: 0, createdAt: new Date() }]);
      success('Miembro agregado');
    }
    setShowAddModal(false);
    setSelectedMember(null);
  };

  const confirmDelete = () => {
    setMembers(members.filter(m => m.id !== selectedMember.id));
    success('Miembro eliminado');
    setShowDeleteConfirm(false);
    setSelectedMember(null);
  };

  if (loading) return <LoadingState message="Cargando miembros..." />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold">Miembros</h1><p className="text-gray-400">{members.length} registrados</p></div>
        <Button icon={Plus} onClick={() => { setSelectedMember(null); setShowAddModal(true); }}>Nuevo Miembro</Button>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Buscar..." className="flex-1" />
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} options={[{ value: 'all', label: 'Todos' }, ...SUBSCRIPTION_STATUS.map(s => ({ value: s.id, label: s.name }))]} />
        </div>
      </Card>

      {filteredMembers.length === 0 ? (
        <EmptyState icon={Users} title="No hay miembros" description="Agregá tu primer miembro" action={<Button icon={Plus} onClick={() => setShowAddModal(true)}>Agregar</Button>} />
      ) : (
        <div className="grid gap-4">
          {filteredMembers.map(member => (
            <Card key={member.id} className="card-hover">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar name={member.name} size="lg" />
                  <div>
                    <h3 className="font-semibold">{member.name}</h3>
                    <div className="flex gap-3 text-sm text-gray-400"><span className="flex items-center gap-1"><Mail size={14} />{member.email}</span>{member.phone && <span className="flex items-center gap-1"><Phone size={14} />{member.phone}</span>}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:block text-right">
                    <Badge variant={getSubscriptionStatusColor(member.subscriptionStatus)}>{getSubscriptionStatusName(member.subscriptionStatus)}</Badge>
                    <p className="text-sm text-gray-400 mt-1">{member.classesAttended} clases</p>
                  </div>
                  <Dropdown trigger={<button className="p-2 hover:bg-gray-700 rounded-lg"><MoreVertical size={20} /></button>}>
                    <DropdownItem icon={Eye} onClick={() => { setSelectedMember(member); setShowDetailModal(true); }}>Ver</DropdownItem>
                    <DropdownItem icon={Edit} onClick={() => { setSelectedMember(member); setShowAddModal(true); }}>Editar</DropdownItem>
                    <DropdownItem icon={Trash2} onClick={() => { setSelectedMember(member); setShowDeleteConfirm(true); }} danger>Eliminar</DropdownItem>
                  </Dropdown>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <MemberFormModal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setSelectedMember(null); }} onSave={handleSave} member={selectedMember} />
      <MemberDetailModal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} member={selectedMember} />
      <ConfirmDialog isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={confirmDelete} title="Eliminar" message={`¿Eliminar a ${selectedMember?.name}?`} confirmText="Eliminar" />
    </div>
  );
};

const MemberFormModal = ({ isOpen, onClose, onSave, member }) => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subscriptionStatus: 'pending' });
  useEffect(() => { setForm(member ? { name: member.name, email: member.email, phone: member.phone || '', subscriptionStatus: member.subscriptionStatus } : { name: '', email: '', phone: '', subscriptionStatus: 'pending' }); }, [member, isOpen]);
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={member ? 'Editar' : 'Nuevo Miembro'}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
        <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Select label="Estado" value={form.subscriptionStatus} onChange={(e) => setForm({ ...form, subscriptionStatus: e.target.value })} options={SUBSCRIPTION_STATUS.map(s => ({ value: s.id, label: s.name }))} />
        <div className="flex gap-3 pt-4"><Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button><Button type="submit" className="flex-1">{member ? 'Guardar' : 'Crear'}</Button></div>
      </form>
    </Modal>
  );
};

const MemberDetailModal = ({ isOpen, onClose, member }) => {
  if (!member) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalle" size="lg">
      <div className="flex items-center gap-4 mb-6"><Avatar name={member.name} size="xl" /><div><h3 className="text-xl font-semibold">{member.name}</h3><Badge variant={getSubscriptionStatusColor(member.subscriptionStatus)}>{getSubscriptionStatusName(member.subscriptionStatus)}</Badge></div></div>
      <div className="grid grid-cols-2 gap-4"><div><p className="text-sm text-gray-400">Email</p><p>{member.email}</p></div><div><p className="text-sm text-gray-400">Teléfono</p><p>{member.phone || '-'}</p></div><div><p className="text-sm text-gray-400">Clases</p><p className="text-2xl font-bold text-emerald-500">{member.classesAttended}</p></div><div><p className="text-sm text-gray-400">Desde</p><p>{formatDate(member.createdAt)}</p></div></div>
    </Modal>
  );
};

export default Members;
