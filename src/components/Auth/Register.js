import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Phone, ArrowRight, Dumbbell, CheckCircle, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp, onSnapshot } from 'firebase/firestore';

const Register = ({ onToggle }) => {
  const { register, registerWithInvite } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', gymId: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Lista de gimnasios disponibles
  const [gyms, setGyms] = useState([]);
  const [loadingGyms, setLoadingGyms] = useState(true);
  
  // Datos de invitación
  const [inviteData, setInviteData] = useState(null);
  const [checkingInvite, setCheckingInvite] = useState(true);

  // Cargar gimnasios disponibles
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'gyms'), (snap) => {
      setGyms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoadingGyms(false);
    });
    return () => unsubscribe();
  }, []);

  // Verificar si hay código de invitación en la URL
  useEffect(() => {
    const checkInvite = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('invite');
      
      if (code) {
        try {
          const q = query(
            collection(db, 'invites'),
            where('code', '==', code),
            where('status', '==', 'pending')
          );
          const snap = await getDocs(q);
          
          if (!snap.empty) {
            const invite = { id: snap.docs[0].id, ...snap.docs[0].data() };
            
            // Verificar que no esté expirada
            if (invite.expiresAt?.toDate() > new Date()) {
              setInviteData(invite);
              setForm(prev => ({ 
                ...prev, 
                email: invite.email || '',
                gymId: invite.gymId || ''
              }));
            } else {
              setError('Esta invitación ha expirado');
            }
          } else {
            setError('Código de invitación inválido o ya fue usado');
          }
        } catch (err) {
          console.error(err);
          setError('Error al verificar invitación');
        }
      }
      setCheckingInvite(false);
    };

    checkInvite();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    let result;
    
    if (inviteData) {
      // Registro con invitación - usa el gimnasio de la invitación
      result = await registerWithInvite(
        form.email,
        form.password,
        form.name,
        form.phone,
        inviteData.gymId,
        inviteData.roles || ['alumno']
      );

      // Marcar invitación como usada
      if (result.success) {
        try {
          await updateDoc(doc(db, 'invites', inviteData.id), {
            status: 'used',
            usedAt: serverTimestamp(),
            usedByName: form.name
          });
          // Limpiar URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err) {
          console.error('Error updating invite:', err);
        }
      }
    } else {
      // Registro libre - puede elegir gimnasio o sin gimnasio
      result = await register(form.email, form.password, form.name, form.phone, form.gymId || null);
    }

    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  if (checkingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Verificando invitación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/50 mb-4">
            <Dumbbell className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white">FitPro</h1>
          <p className="text-gray-400 mt-2">Gestión de gimnasios</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-8 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-6">Crear cuenta</h2>

          {/* Indicador de invitación válida */}
          {inviteData && (
            <div className="mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-400" size={24} />
                <div>
                  <p className="text-green-400 font-medium">Invitación válida</p>
                  <p className="text-sm text-gray-300 mt-1">
                    Te unirás a <strong>{inviteData.gymName}</strong>
                  </p>
                  {inviteData.roles && inviteData.roles.length > 1 && (
                    <p className="text-xs text-gray-400 mt-1">
                      Roles: {inviteData.roles.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nombre completo *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                  placeholder="Tu nombre"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={`w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary ${inviteData?.email ? 'opacity-60' : ''}`}
                  placeholder="tu@email.com"
                  required
                  disabled={!!inviteData?.email}
                />
              </div>
              {inviteData?.email && (
                <p className="text-xs text-gray-500 mt-1">Email definido por la invitación</p>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Teléfono (opcional)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                  placeholder="+54 11 1234-5678"
                />
              </div>
            </div>

            {/* Gimnasio - selector o bloqueado si hay invitación */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Gimnasio</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                {inviteData ? (
                  // Invitación: gimnasio bloqueado
                  <div className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white opacity-60">
                    {inviteData.gymName}
                  </div>
                ) : (
                  // Sin invitación: selector de gimnasio
                  <select
                    value={form.gymId}
                    onChange={(e) => setForm({ ...form, gymId: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-primary appearance-none"
                    disabled={loadingGyms}
                  >
                    <option value="">Sin gimnasio (registrarme solo)</option>
                    {gyms.map(gym => (
                      <option key={gym.id} value={gym.id}>{gym.name}</option>
                    ))}
                  </select>
                )}
              </div>
              {!inviteData && (
                <p className="text-xs text-gray-500 mt-1">
                  Podés elegir un gimnasio o registrarte sin uno. También podés unirte después con una invitación.
                </p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Contraseña *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirmar contraseña *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Registrando...' : 'Crear cuenta'}
              <ArrowRight size={18} />
            </button>
          </form>

          <p className="mt-6 text-center text-gray-400">
            ¿Ya tenés cuenta?{' '}
            <button onClick={onToggle} className="text-primary hover:underline">
              Iniciar sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
