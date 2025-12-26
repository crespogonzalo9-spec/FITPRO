import React, { useState, useEffect } from 'react';
import { Users, MoreVertical, Edit, Mail, Phone, Shield, UserPlus, UserMinus } from 'lucide-react';
import { Button, Card, Modal, Select, SearchInput, EmptyState, LoadingState, Badge, Avatar, Dropdown, DropdownItem, ConfirmDialog } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { getRoleName, formatDate } from '../utils/helpers';

const Members = () => {
  const { userData, isAdmin, canAssignRole, canRemoveRole } = useAuth();
  const { currentGym } = useGym();
  const { success, error: showError } = useToast();
  
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);

  const canEdit = isAdmin();

  useEffect(() => {
    if (!currentGym?.id) { setLoading(false); return; }

    const q = query(collection(db, 'users'), where('gymId', '==', currentGym.id));
    const unsubscribe = onSnapshot(q, (snap) => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentGym]);

  const getFilteredMembers = () => {
    let filtered = members;
    
    if (filterRole !== 'all') {
      filtered = filtered.filter(m => m.roles?.includes(filterRole));
    }
    
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(m => 
        m.name?.toLowerCase().includes(s) || 
        m.email?.toLowerCase().includes(s)
      );
    }
    
    // Ordenar por roles
    const roleOrder = { sysadmin: 0, admin: 1, profesor: 2, alumno: 3 };
    filtered.sort((a, b) => {
      const aTop = Math.min(...(a.roles || ['alumno']).map(r => roleOrder[r] ?? 4));
      const bTop = Math.min(...(b.roles || ['alumno']).map(r => roleOrder[r] ?? 4));
      return aTop - bTop;
    });
    
    return filtered;
  };

  const handleSaveRoles = async (data) => {
    try {
      let roles = data.roles;
      if (!roles.includes('alumno')) roles.push('alumno');
      
      await updateDoc(doc(db, 'users', selected.id), {
        roles,
        updatedAt: serverTimestamp()
      });
      success('Roles actualizados');
      setShowModal(false);
      setSelected(null);
    } catch (err) {
      showError('Error al actualizar');
    }
  };

  const getRoleBadges = (roles) => {
    if (!roles || roles.length === 0) return <Badge className="bg-gray-500/20 text-gray-400">Alumno</Badge>;
    
    const roleConfig = {
      sysadmin: { color: 'bg-yellow-500/20 text-yellow-400', icon: '👑' },
      admin: { color: 'bg-blue-500/20 text-blue-400', icon: '🔧' },
      profesor: { color: 'bg-purple-500/20 text-purple-400', icon: '👨‍🏫' },
      alumno: { color: 'bg-gray-500/20 text-gray-400', icon: '👤' }
    };

    return (
      <div className="flex flex-wrap gap-1">
        {roles.map(role => (
          <Badge key={role} className={roleConfig[role]?.color || 'bg-gray-500/20'}>
            {roleConfig[role]?.icon} {getRoleName(role)}
          </Badge>
        ))}
      </div>
    );
  };

  const filteredMembers = getFilteredMembers();

  if (loading) return <LoadingState />;
  if (!currentGym) return <EmptyState icon={Users} title="Sin gimnasio" />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Miembros</h1>
          <p className="text-gray-400">{filteredMembers.length} miembros en {currentGym.name}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre o email..." className="flex-1" />
        <Select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          options={[
            { value: 'all', label: 'Todos los roles' },
            { value: 'admin', label: '🔧 Admins' },
            { value: 'profesor', label: '👨‍🏫 Profesores' },
            { value: 'alumno', label: '👤 Alumnos' }
          ]}
          className="w-full sm:w-48"
        />
      </div>

      {filteredMembers.length === 0 ? (
        <EmptyState icon={Users} title="No hay miembros" description="Invitá personas a tu gimnasio" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map(member => (
            <Card key={member.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={member.name} size="lg" />
                  <div>
                    <h3 className="font-semibold">{member.name}</h3>
                    <p className="text-sm text-gray-400">{member.email}</p>
                    <div className="mt-1">
                      {getRoleBadges(member.roles)}
                    </div>
                  </div>
                </div>
                {canEdit && member.id !== userData.id && !member.roles?.includes('sysadmin') && (
                  <Dropdown trigger={<button className="p-2 hover:bg-gray-700 rounded-lg"><MoreVertical size={18} /></button>}>
                    <DropdownItem icon={Shield} onClick={() => { setSelected(member); setShowModal(true); }}>
                      Gestionar roles
                    </DropdownItem>
                  </Dropdown>
                )}
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-700 text-sm text-gray-400">
                {member.phone && (
                  <p className="flex items-center gap-2"><Phone size={14} /> {member.phone}</p>
                )}
                <p className="text-xs mt-1">Desde: {formatDate(member.createdAt)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <RolesModal 
        isOpen={showModal} 
        onClose={() => { setShowModal(false); setSelected(null); }} 
        onSave={handleSaveRoles} 
        member={selected}
        canAssignRole={canAssignRole}
        canRemoveRole={canRemoveRole}
      />
    </div>
  );
};

const RolesModal = ({ isOpen, onClose, onSave, member, canAssignRole, canRemoveRole }) => {
  const [roles, setRoles] = useState(['alumno']);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (member) {
      setRoles(member.roles || ['alumno']);
    }
  }, [member, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave({ roles });
    setLoading(false);
  };

  const toggleRole = (role) => {
    const hasRole = roles.includes(role);
    
    if (hasRole) {
      if (!canRemoveRole(role)) return;
      if (role === 'alumno') return;
      setRoles(prev => prev.filter(r => r !== role));
    } else {
      if (!canAssignRole(role)) return;
      setRoles(prev => [...prev, role]);
    }
  };

  const availableRoles = [
    { id: 'profesor', name: 'Profesor', desc: 'Crear rutinas, WODs, validar PRs', icon: '👨‍🏫' },
    { id: 'admin', name: 'Admin', desc: 'Gestión completa del gimnasio', icon: '🔧' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Roles de ${member?.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          {availableRoles.map(role => {
            const hasRole = roles.includes(role.id);
            const canToggle = hasRole ? canRemoveRole(role.id) : canAssignRole(role.id);

            return (
              <label 
                key={role.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  hasRole ? 'bg-primary/20 border border-primary/50' : 'bg-gray-800/50 border border-gray-700'
                } ${!canToggle ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-700/50'}`}
              >
                <input 
                  type="checkbox" 
                  checked={hasRole} 
                  onChange={() => canToggle && toggleRole(role.id)}
                  disabled={!canToggle}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <p className="font-medium">{role.icon} {role.name}</p>
                  <p className="text-xs text-gray-400">{role.desc}</p>
                </div>
                {!canToggle && (
                  <span className="text-xs text-gray-500">Sin permiso</span>
                )}
              </label>
            );
          })}
        </div>

        <p className="text-xs text-gray-500">
          El rol de Alumno siempre está incluido.
        </p>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
};

export default Members;
