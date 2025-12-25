import React, { useState, useEffect } from 'react';
import { Plus, Users, MoreVertical, Edit, Trash2, Mail, Phone } from 'lucide-react';
import { Button, Card, Modal, Input, Select, SearchInput, EmptyState, LoadingState, ConfirmDialog, Badge, Avatar, Dropdown, DropdownItem } from '../components/Common';
import { useGym } from '../contexts/GymContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { SUBSCRIPTION_STATUS } from '../utils/constants';
import { getSubscriptionStatusColor, getSubscriptionStatusName, formatDate } from '../utils/helpers';

const Members = () => {
  const { currentGym } = useGym();
  const { success, error: showError } = useToast();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!currentGym?.id) { setLoading(false); return; }
    
    const q = query(collection(db, 'users'), where('gymId', '==', currentGym.id), where('role', '==', 'alumno'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentGym]);

  const filtered = members.filter(m => {
    const matchSearch = m.name?.toLowerCase().includes(search.toLowerCase()) || m.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || m.subscriptionStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleSave = async (data) => {
    try {
      await updateDoc(doc(db, 'users', selected.id), { ...data, updatedAt: serverTimestamp() });
      success('Alumno actualizado');
      setShowModal(false);
      setSelected(null);
    } catch (err) {
      showError('Error al guardar');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'users', selected.id));
      success('Alumno eliminado');
      setShowDelete(false);
      setSelected(null);
    } catch (err) {
      showError('Error al eliminar');
    }
  };

  if (loading) return <LoadingState />;

  if (!currentGym) {
    return <EmptyState icon={Users} title="Sin gimnasio" description="No tenés un gimnasio asignado" />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Alumnos</h1>
          <p className="text-gray-400">{members.length} alumnos en {currentGym.name}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar alumno..." className="flex-1" />
        <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} options={[{ value: 'all', label: 'Todos' }, ...SUBSCRIPTION_STATUS.map(s => ({ value: s.id, label: s.name }))]} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No hay alumnos" description="Los alumnos aparecerán cuando se registren y sean asignados a este gimnasio" />
      ) : (
        <div className="space-y-3">
          {filtered.map(member => (
            <Card key={member.id} className="hover:border-emerald-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar name={member.name} size="lg" />
                  <div>
                    <h3 className="font-semibold">{member.name}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                      <span className="flex items-center gap-1"><Mail size={14} />{member.email}</span>
                      {member.phone && <span className="flex items-center gap-1"><Phone size={14} />{member.phone}</span>}
                    </div>
                    <Badge variant={getSubscriptionStatusColor(member.subscriptionStatus)} className="mt-1">
                      {getSubscriptionStatusName(member.subscriptionStatus || 'pending')}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 hidden sm:block">Desde {formatDate(member.createdAt)}</span>
                  <Dropdown trigger={<button className="p-2 hover:bg-gray-700 rounded-lg"><MoreVertical size={18} /></button>}>
                    <DropdownItem icon={Edit} onClick={() => { setSelected(member); setShowModal(true); }}>Editar</DropdownItem>
                    <DropdownItem icon={Trash2} danger onClick={() => { setSelected(member); setShowDelete(true); }}>Eliminar</DropdownItem>
                  </Dropdown>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <MemberModal isOpen={showModal} onClose={() => { setShowModal(false); setSelected(null); }} onSave={handleSave} member={selected} />
      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete} title="Eliminar Alumno" message={`¿Eliminar a ${selected?.name}?`} confirmText="Eliminar" />
    </div>
  );
};

const MemberModal = ({ isOpen, onClose, onSave, member }) => {
  const [form, setForm] = useState({ name: '', phone: '', subscriptionStatus: 'pending' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (member) setForm({ name: member.name || '', phone: member.phone || '', subscriptionStatus: member.subscriptionStatus || 'pending' });
  }, [member, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Alumno">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nombre" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <Input label="Teléfono" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        <Select label="Estado Suscripción" value={form.subscriptionStatus} onChange={e => setForm({ ...form, subscriptionStatus: e.target.value })} options={SUBSCRIPTION_STATUS.map(s => ({ value: s.id, label: s.name }))} />
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
};

export default Members;
