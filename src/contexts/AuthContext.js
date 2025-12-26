import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Email del Sysadmin principal (puede nombrar otros sysadmin)
const SYSADMIN_EMAIL = 'crespo.gonzalo9@gmail.com';

// Jerarquía de roles
const ROLE_HIERARCHY = {
  sysadmin: 4,
  admin: 3,
  profesor: 2,
  alumno: 1
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUserData({ id: userDoc.id, ...userDoc.data() });
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (userDoc.exists()) {
        setUserData({ id: userDoc.id, ...userDoc.data() });
      }
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      let message = 'Error al iniciar sesión';
      if (error.code === 'auth/user-not-found') message = 'Usuario no encontrado';
      if (error.code === 'auth/wrong-password') message = 'Contraseña incorrecta';
      if (error.code === 'auth/invalid-credential') message = 'Credenciales inválidas';
      return { success: false, error: message };
    }
  };

  const register = async (email, password, name, phone = '', gymId = null) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Determinar rol inicial
      const role = email.toLowerCase() === SYSADMIN_EMAIL.toLowerCase() ? 'sysadmin' : 'alumno';
      
      const newUserData = {
        email: email.toLowerCase(),
        name,
        phone,
        role,
        gymId: role === 'sysadmin' ? null : gymId,
        isActive: true,
        subscriptionStatus: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'users', result.user.uid), newUserData);
      setUserData({ id: result.user.uid, ...newUserData });
      
      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      let message = 'Error al registrar';
      if (error.code === 'auth/email-already-in-use') message = 'El email ya está registrado';
      if (error.code === 'auth/weak-password') message = 'La contraseña es muy débil';
      return { success: false, error: message };
    }
  };

  const updateUserGym = async (userId, gymId) => {
    try {
      await updateDoc(doc(db, 'users', userId), { gymId, updatedAt: serverTimestamp() });
      if (userData?.id === userId) {
        setUserData(prev => ({ ...prev, gymId }));
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserData(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al enviar email de recuperación' };
    }
  };

  // ============================================
  // SISTEMA DE PERMISOS - SYSADMIN TIENE TODO
  // ============================================

  // Verificar si tiene un rol específico o superior
  const hasRole = (requiredRole) => {
    if (!userData?.role) return false;
    // Sysadmin SIEMPRE tiene todos los permisos
    if (userData.role === 'sysadmin') return true;
    return ROLE_HIERARCHY[userData.role] >= ROLE_HIERARCHY[requiredRole];
  };

  // Verificar rol exacto
  const isRole = (role) => userData?.role === role;

  // ============================================
  // HELPERS DE ROL
  // ============================================
  
  // Sysadmin - poder absoluto
  const isSysadmin = () => userData?.role === 'sysadmin';
  
  // Admin o Sysadmin
  const isAdmin = () => userData?.role === 'admin' || userData?.role === 'sysadmin';
  
  // Profesor, Admin o Sysadmin
  const isProfesor = () => userData?.role === 'profesor' || userData?.role === 'admin' || userData?.role === 'sysadmin';
  
  // Solo Alumno (sin poderes especiales)
  const isAlumno = () => userData?.role === 'alumno';

  // ============================================
  // PERMISOS ESPECÍFICOS - SYSADMIN PUEDE TODO
  // ============================================
  
  // Gestionar gimnasios (crear, editar, eliminar)
  const canManageGyms = () => isSysadmin();
  
  // Asignar/quitar rol sysadmin (solo sysadmin)
  const canAssignSysadmin = () => isSysadmin();
  
  // Asignar/quitar rol admin
  const canAssignAdmin = () => isSysadmin();
  
  // Gestionar profesores (asignar/quitar rol)
  const canManageProfesores = () => isAdmin();
  
  // Gestionar alumnos
  const canManageAlumnos = () => isProfesor();
  
  // Crear/editar/eliminar rutinas y WODs
  const canCreateRoutines = () => isProfesor();
  
  // Crear/editar/eliminar eventos del calendario
  const canManageCalendar = () => isAdmin();
  
  // Publicar/editar/eliminar novedades
  const canManageNews = () => isAdmin();
  
  // Validar PRs
  const canValidateRankings = () => isProfesor();
  
  // Crear/gestionar rankings
  const canCreateRankings = () => isAdmin();
  
  // Gestionar invitaciones
  const canManageInvites = () => isAdmin();
  
  // Cambiar tema/logo del gimnasio
  const canManageGymSettings = () => isAdmin();

  const value = {
    user,
    userData,
    loading,
    login,
    register,
    logout,
    resetPassword,
    updateUserGym,
    hasRole,
    isRole,
    isSysadmin,
    isAdmin,
    isProfesor,
    isAlumno,
    canManageGyms,
    canAssignSysadmin,
    canAssignAdmin,
    canManageProfesores,
    canManageAlumnos,
    canCreateRoutines,
    canManageCalendar,
    canManageNews,
    canValidateRankings,
    canCreateRankings,
    canManageInvites,
    canManageGymSettings
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
