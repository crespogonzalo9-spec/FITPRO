import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Phone, ArrowRight, Dumbbell, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

const Register = ({ onToggle }) => {
  const { register, registerWithInvite } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Datos de invitación
  const [inviteData, setInviteData] = useState(null);
  const [inviteCode, setInviteCode] = useState('');
  const [checkingInvite, setCheckingInvite] = useState(false);

  // Verificar si hay código de invitación en la URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('invite');
    if (code) {
      setInviteCode(code);
      checkInviteCode(code);
    }
  }, []);

  const checkInviteCode = async (code) => {
    setCheckingInvite(true);
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
          setForm(prev => ({ ...prev, email: invite.email || '' }));
        } else {
          setError('Esta invitación ha expirado');
        }
      } else {
        setError('Código de invitación inválido');
      }
    } catch (err) {
      console.error(err);
      setError('Error al verificar invitación');
    }
    setCheckingInvite(false);
  };

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
      // Registro con invitación - asigna gimnasio automáticamente
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
        } catch (err) {
          console.error('Error updating invite:', err);
        }
      }
    } else {
      // Registro libre sin gimnasio
      result = await register(form.email, form.password, form.name, form.phone);
    }

    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

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

          {/* Indicador de invitación */}
          {checkingInvite && (
            <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 text-sm">
              Verificando invitación...
            </div>
          )}

          {inviteData && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 text-sm flex items-center gap-2">
              <CheckCircle size={18} />
              <span>Invitación válida para <strong>{inviteData.gymName}</strong></span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nombre completo</label>
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

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary disabled:opacity-50"
                  placeholder="tu@email.com"
                  required
                  disabled={inviteData?.email}
                />
              </div>
            </div>

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

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirmar contraseña</label>
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

            {!inviteData && (
              <p className="text-xs text-gray-500">
                Al registrarte sin invitación, deberás esperar a que un gimnasio te agregue o usar un código de invitación.
              </p>
            )}

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
