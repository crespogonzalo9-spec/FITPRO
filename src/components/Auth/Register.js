import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Dumbbell, Mail, Lock, User, Phone, Eye, EyeOff, Loader2, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore';

const Register = () => {
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('invite');
  
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', gymId: '' });
  const [gyms, setGyms] = useState([]);
  const [inviteGym, setInviteGym] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingGyms, setLoadingGyms] = useState(true);
  const { register } = useAuth();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadGyms();
    if (inviteCode) validateInvite();
  }, [inviteCode]);

  const loadGyms = async () => {
    try {
      const q = query(collection(db, 'gyms'), where('isActive', '==', true));
      const snap = await getDocs(q);
      setGyms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error loading gyms:', err);
    }
    setLoadingGyms(false);
  };

  const validateInvite = async () => {
    try {
      const q = query(collection(db, 'invites'), where('code', '==', inviteCode), where('isActive', '==', true));
      const snap = await getDocs(q);
      if (snap.empty) { showError('Código de invitación inválido'); return; }
      const invite = { id: snap.docs[0].id, ...snap.docs[0].data() };
      if (invite.expiresAt) {
        const exp = invite.expiresAt?.toDate ? invite.expiresAt.toDate() : new Date(invite.expiresAt);
        if (exp < new Date()) { showError('Código expirado'); return; }
      }
      if (invite.maxUses && invite.usedCount >= invite.maxUses) { showError('Límite de usos alcanzado'); return; }
      setInviteGym({ id: invite.gymId, name: invite.gymName, inviteId: invite.id });
      setForm(prev => ({ ...prev, gymId: invite.gymId }));
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return showError('Completá todos los campos');
    if (form.password.length < 6) return showError('Contraseña muy corta');
    if (form.password !== form.confirmPassword) return showError('Las contraseñas no coinciden');
    if (!form.gymId && !inviteGym) return showError('Seleccioná un gimnasio');

    setLoading(true);
    const gymId = inviteGym?.id || form.gymId;
    const result = await register(form.email, form.password, form.name, form.phone, gymId);
    
    if (result.success) {
      if (inviteGym?.inviteId) {
        try { await updateDoc(doc(db, 'invites', inviteGym.inviteId), { usedCount: increment(1) }); } catch (err) {}
      }
      success('Cuenta creada');
      navigate('/dashboard');
    } else {
      showError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-2xl mb-4">
            <Dumbbell size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">FitPro</h1>
          <p className="text-gray-400 mt-2">Creá tu cuenta</p>
        </div>

        <div className="bg-slate-800/50 border border-gray-700/50 rounded-2xl p-6">
          {inviteGym && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <p className="text-sm text-emerald-400"><Building2 size={16} className="inline mr-2" />Te registrarás en: <strong>{inviteGym.name}</strong></p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm text-gray-300">Nombre *</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Tu nombre" className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-300">Email *</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="tu@email.com" className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-300">Teléfono</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="1155551234" className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500" />
              </div>
            </div>

            {!inviteGym && (
              <div className="space-y-1">
                <label className="text-sm text-gray-300">Gimnasio *</label>
                <div className="relative">
                  <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <select value={form.gymId} onChange={(e) => setForm({ ...form, gymId: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white appearance-none focus:outline-none focus:border-emerald-500" disabled={loadingGyms}>
                    <option value="">Seleccionar gimnasio</option>
                    {gyms.map(gym => <option key={gym.id} value={gym.id}>{gym.name}</option>)}
                  </select>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm text-gray-300">Contraseña *</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" className="w-full pl-10 pr-10 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-300">Confirmar contraseña *</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type={showPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="••••••••" className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="animate-spin" size={20} /> Creando...</> : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-gray-400 mt-6">¿Ya tenés cuenta? <Link to="/login" className="text-emerald-500 hover:text-emerald-400">Iniciá sesión</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
