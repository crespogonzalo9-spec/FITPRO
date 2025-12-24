import React, { useState, useEffect } from 'react';
import { Plus, Search, MoreVertical, Mail, Phone, Edit, Trash2, Eye, UserCheck, UserX } from 'lucide-react';
import { Button, Card, SearchInput, Modal, Badge, Avatar, EmptyState, LoadingState, ConfirmDialog, Input, Select, Dropdown, DropdownItem } from '../Common';
import { useGym } from '../../contexts/GymContext';
import { useToast } from '../../contexts/ToastContext';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { formatDate, getSubscriptionStatusColor, getSubscriptionStatusName } from '../../utils/helpers';
import { SUBSCRIPTION_STATUS } from '../../utils/constants';

const MemberList = () => {
  const { currentGym } = useGym();
  const { success, error } = useToast();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subscriptionStatus: 'pending' });

  useEffect(() => {
    if (!currentGym?.id) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'users'), where('gymId', '==', currentGym.id), where('role', '==', 'athlete'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMembers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentGym]);

  const filteredMembers = members.filter(m => {
    const matchSearch = m.name?.toLowerCase().includes(search.toLowerCase()) || m.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || m.subscriptionStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedMember) {
        await updateDoc(doc(db, 'users', selectedMember.id), { ...formData, updatedAt: serverTimestamp() });
        success('Miembro actualizado');
      }
      setShowModal(false);
      resetForm();
    } catch (err) {
      error(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'users', selectedMember.id));
      success('Miembro eliminado');
      setShowDeleteConfirm(false);
      setSelectedMember(null);
    } catch (err) {
      error(err.message);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', subscriptionStatus: 'pending' });
    setSelectedMember(null);
  };

  const openEdit = (member) => {
    setSelectedMember(member);
    setFormData({ name: member.name, email: member.email, phone: member.phone || '', subscriptionStatus: member.subscriptionStatus || 'pending' });
    setShowModal(true);
  };

  if (loading) return <LoadingState message="Cargando miembros..." />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar miembros..." className="flex-1 max-w-md" />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[{ value: '', label: 'Todos' }, ...SUBSCRIPTION_STATUS.map(s => ({ value: s.id, label: s.name }))]} className="w-40" />
        </div>
        <Button icon={Plus} onClick={() => { resetForm(); setShowModal(true); }}>Nuevo Miembro</Button>
      </div>

      {filteredMembers.length === 0 ? (
        <EmptyState icon={UserCheck} title="No hay miembros" description="Agregá tu primer miembro para comenzar" action={<Button icon={Plus} onClick={() => setShowModal(true)}>Agregar Miembro</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map(member => (
            <Card key={member.id} className="card-hover">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar name={member.name} src={member.photoURL} size="lg" />
                  <div>
                    <h3 className="font-semibold">{member.name}</h3>
                    <Badge variant={getSubscriptionStatusColor(member.subscriptionStatus)}>{getSubscriptionStatusName(member.subscriptionStatus)}</Badge>
                  </div>
                </div>
                <Dropdown trigger={<button className="p-1 hover:bg-gray-700 rounded"><MoreVertical size={18} /></button>}>
                  <DropdownItem icon={Eye}>Ver Perfil</DropdownItem>
                  <DropdownItem icon={Edit} onClick={() => openEdit(member)}>Editar</DropdownItem>
                  <DropdownItem icon={Trash2} danger onClick={() => { setSelectedMember(member); setShowDeleteConfirm(true); }}>Eliminar</DropdownItem>
                </Dropdown>
              </div>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center gap-2"><Mail size={14} />{member.email}</div>
                {member.phone && <div className="flex items-center gap-2"><Phone size={14} />{member.phone}</div>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={selectedMember ? 'Editar Miembro' : 'Nuevo Miembro'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
          <Input label="Teléfono" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
          <Select label="Estado" value={formData.subscriptionStatus} onChange={(e) => setFormData({...formData, subscriptionStatus: e.target.value})} options={SUBSCRIPTION_STATUS.map(s => ({ value: s.id, label: s.name }))} />
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit">{selectedMember ? 'Guardar' : 'Crear'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={handleDelete} title="Eliminar Miembro" message={`¿Estás seguro de eliminar a ${selectedMember?.name}?`} />
    </div>
  );
};

export default MemberList;
