import React, { useState, useEffect } from 'react';
import { Link, Plus, Copy, Trash2, QrCode, Check, Users } from 'lucide-react';
import { Button, Card, Modal, Input, EmptyState, LoadingState, ConfirmDialog, Badge } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { formatDate, formatRelativeDate } from '../utils/helpers';

const Invites = () => {
  const { userData } = useAuth();
  const { currentGym } = useGym();
  const { success, error: showError } = useToast();
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (!currentGym?.id) { setLoading(false); return; }

    const q = query(collection(db, 'invites'), where('gymId', '==', currentGym.id));
    const unsubscribe = onSnapshot(q, (snap) => {
      setInvites(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentGym]);

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreate = async (data) => {
    try {
      const code = generateInviteCode();
      const expiresAt = data.expiresIn ? new Date(Date.now() + data.expiresIn * 24 * 60 * 60 * 1000) : null;

      await addDoc(collection(db, 'invites'), {
        code,
        gymId: currentGym.id,
        gymName: currentGym.name,
        createdBy: userData.id,
        createdByName: userData.name,
        description: data.description || '',
        maxUses: data.maxUses || null,
        usedCount: 0,
        expiresAt,
        isActive: true,
        createdAt: serverTimestamp()
      });

      success('Invitación creada');
      setShowModal(false);
    } catch (err) {
      showError('Error al crear invitación');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'invites', selected.id));
      success('Invitación eliminada');
      setShowDelete(false);
      setSelected(null);
    } catch (err) {
      showError('Error al eliminar');
    }
  };

  const copyLink = (invite) => {
    const link = `${window.location.origin}/register?invite=${invite.code}`;
    navigator.clipboard.writeText(link);
    setCopiedId(invite.id);
    success('Link copiado al portapapeles');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isExpired = (invite) => {
    if (!invite.expiresAt) return false;
    const expiresAt = invite.expiresAt?.toDate ? invite.expiresAt.toDate() : new Date(invite.expiresAt);
    return expiresAt < new Date();
  };

  const isMaxedOut = (invite) => {
    if (!invite.maxUses) return false;
    return invite.usedCount >= invite.maxUses;
  };

  if (loading) return <LoadingState />;
  if (!currentGym) return <EmptyState icon={Link} title="Sin gimnasio" />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Invitaciones</h1>
          <p className="text-gray-400">Genera links para invitar alumnos</p>
        </div>
        <Button icon={Plus} onClick={() => setShowModal(true)}>Nueva Invitación</Button>
      </div>

      {/* Info card */}
      <Card className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-emerald-500/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
            <Users className="text-emerald-500" size={24} />
          </div>
          <div>
            <h3 className="font-semibold mb-1">¿Cómo funciona?</h3>
            <p className="text-sm text-gray-400">
              Genera un link de invitación y compártelo con tus alumnos. 
              Cuando se registren usando el link, automáticamente quedarán asociados a tu gimnasio.
            </p>
          </div>
        </div>
      </Card>

      {invites.length === 0 ? (
        <EmptyState 
          icon={Link} 
          title="Sin invitaciones" 
          description="Crea tu primera invitación para compartir con alumnos"
          action={<Button icon={Plus} onClick={() => setShowModal(true)}>Crear</Button>}
        />
      ) : (
        <div className="space-y-3">
          {invites.map(invite => {
            const expired = isExpired(invite);
            const maxed = isMaxedOut(invite);
            const inactive = expired || maxed || !invite.isActive;

            return (
              <Card key={invite.id} className={inactive ? 'opacity-60' : ''}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${inactive ? 'bg-gray-700' : 'bg-emerald-500/20'}`}>
                      <Link className={inactive ? 'text-gray-400' : 'text-emerald-500'} size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="text-lg font-mono font-semibold">{invite.code}</code>
                        {expired && <Badge variant="error">Expirado</Badge>}
                        {maxed && <Badge variant="warning">Límite alcanzado</Badge>}
                        {!inactive && <Badge variant="success">Activo</Badge>}
                      </div>
                      {invite.description && <p className="text-sm text-gray-400">{invite.description}</p>}
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span>Creado {formatRelativeDate(invite.createdAt)}</span>
                        <span>{invite.usedCount} usos{invite.maxUses ? ` / ${invite.maxUses}` : ''}</span>
                        {invite.expiresAt && <span>Expira: {formatDate(invite.expiresAt)}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={copiedId === invite.id ? Check : Copy}
                      onClick={() => copyLink(invite)}
                      disabled={inactive}
                    >
                      {copiedId === invite.id ? 'Copiado' : 'Copiar'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      onClick={() => { setSelected(invite); setShowDelete(true); }}
                      className="text-red-400 hover:text-red-300"
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <InviteModal isOpen={showModal} onClose={() => setShowModal(false)} onCreate={handleCreate} />
      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete} title="Eliminar" message="¿Eliminar esta invitación?" confirmText="Eliminar" />
    </div>
  );
};

const InviteModal = ({ isOpen, onClose, onCreate }) => {
  const [form, setForm] = useState({ description: '', maxUses: '', expiresIn: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm({ description: '', maxUses: '', expiresIn: '' });
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onCreate({
      description: form.description,
      maxUses: form.maxUses ? parseInt(form.maxUses) : null,
      expiresIn: form.expiresIn ? parseInt(form.expiresIn) : null
    });
    setLoading(false);
  };

  const expirationOptions = [
    { value: '', label: 'Sin expiración' },
    { value: '1', label: '1 día' },
    { value: '7', label: '7 días' },
    { value: '30', label: '30 días' },
    { value: '90', label: '90 días' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva Invitación">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input 
          label="Descripción (opcional)" 
          value={form.description} 
          onChange={e => setForm({ ...form, description: e.target.value })} 
          placeholder="Ej: Promoción Enero 2025"
        />
        
        <Input 
          label="Límite de usos (opcional)" 
          type="number" 
          value={form.maxUses} 
          onChange={e => setForm({ ...form, maxUses: e.target.value })} 
          placeholder="Ej: 50"
          min={1}
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-300">Expiración</label>
          <select
            value={form.expiresIn}
            onChange={e => setForm({ ...form, expiresIn: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white"
          >
            {expirationOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1">Crear Invitación</Button>
        </div>
      </form>
    </Modal>
  );
};

export default Invites;
