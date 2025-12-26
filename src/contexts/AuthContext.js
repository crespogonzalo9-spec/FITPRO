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

// Email del Sysadmin principal
const SYSADMIN_EMAIL = 'crespo.gonzalo9@gmail.com';

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
          const data = userDoc.data();
          // Normalizar roles a array
          let roles = data.roles || [];
          if (data.role && !roles.includes(data.role)) {
            roles = [data.role, ...roles];
          }
          if (roles.length === 0) roles = ['alumno'];
          setUserData({ id: userDoc.id, ...data, roles });
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
        const data = userDoc.data();
        let roles = data.roles || [];
        if (data.role && !roles.includes(data.role)) roles = [data.role, ...roles];
        if (roles.length === 0) roles = ['alumno'];
        setUserData({ id: userDoc.id, ...data, roles });
      }
      return { success: true };
    } catch (error) {
      let message = 'Error al iniciar sesión';
      if (error.code === 'auth/user-not-found') message = 'Usuario no encontrado';
      if (error.code === 'auth/wrong-password') message = 'Contraseña incorrecta';
      if (error.code === 'auth/invalid-credential') message = 'Credenciales inválidas';
      return { success: false, error: message };
    }
  };

  // Registro libre (puede elegir gimnasio o sin gimnasio)
  const register = async (email, password, name, phone = '', gymId = null) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Sysadmin automático para el email especial
      const isSysadminEmail = email.toLowerCase() === SYSADMIN_EMAIL.toLowerCase();
      const roles = isSysadminEmail ? ['sysadmin', 'admin', 'profesor', 'alumno'] : ['alumno'];
      
      const newUserData = {
        email: email.toLowerCase(),
        name,
        phone,
        roles,
        gymId: isSysadminEmail ? null : (gymId || null),
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'users', result.user.uid), newUserData);
      setUserData({ id: result.user.uid, ...newUserData });
      
      return { success: true };
    } catch (error) {
      let message = 'Error al registrar';
      if (error.code === 'auth/email-already-in-use') message = 'El email ya está registrado';
      if (error.code === 'auth/weak-password') message = 'La contraseña es muy débil';
      return { success: false, error: message };
    }
  };

  // Registro con invitación (asigna gimnasio y roles automáticamente)
  const registerWithInvite = async (email, password, name, phone, gymId, inviteRoles = ['alumno']) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Asegurar que siempre tenga alumno
      const roles = inviteRoles.includes('alumno') ? inviteRoles : [...inviteRoles, 'alumno'];
      
      const newUserData = {
        email: email.toLowerCase(),
        name,
        phone,
        roles,
        gymId,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'users', result.user.uid), newUserData);
      setUserData({ id: result.user.uid, ...newUserData });
      
      return { success: true };
    } catch (error) {
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
      return { success: false, error: 'Error al enviar email' };
    }
  };

  // Refrescar datos del usuario
  const refreshUserData = async () => {
    if (!user) return;
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      let roles = data.roles || [];
      if (roles.length === 0) roles = ['alumno'];
      setUserData({ id: userDoc.id, ...data, roles });
    }
  };

  // =============================================
  // SISTEMA DE ROLES MÚLTIPLES
  // =============================================
  
  const hasRole = (role) => {
    if (!userData?.roles) return false;
    return userData.roles.includes(role);
  };

  const isSysadmin = () => hasRole('sysadmin');
  const isAdmin = () => hasRole('sysadmin') || hasRole('admin');
  const isProfesor = () => hasRole('sysadmin') || hasRole('admin') || hasRole('profesor');
  const isAlumno = () => hasRole('alumno');
  const isOnlyAlumno = () => {
    if (!userData?.roles) return true;
    return userData.roles.length === 1 && userData.roles[0] === 'alumno';
  };

  // =============================================
  // PERMISOS DE ASIGNACIÓN DE ROLES
  // =============================================
  
  const canAssignRole = (targetRole) => {
    if (isSysadmin()) return true;
    if (isAdmin()) return ['admin', 'profesor', 'alumno'].includes(targetRole);
    return false;
  };

  const canRemoveRole = (targetRole) => {
    if (isSysadmin()) return true;
    if (isAdmin()) return ['admin', 'profesor'].includes(targetRole);
    return false;
  };

  // =============================================
  // PERMISOS DE FUNCIONALIDADES
  // =============================================
  
  const canManageGyms = () => isSysadmin();
  const canManageUsers = () => isSysadmin();
  const canManageClasses = () => isAdmin();
  const canManageExercises = () => isAdmin();
  const canManageProfesores = () => isAdmin();
  const canManageAlumnos = () => isProfesor();
  const canCreateRoutines = () => isProfesor();
  const canManageCalendar = () => isAdmin();
  const canManageNews = () => isAdmin();
  const canValidateRankings = () => isProfesor();
  const canCreateRankings = () => isAdmin();
  const canManageInvites = () => isAdmin();
  const canManageGymSettings = () => isAdmin();

  const value = {
    user,
    userData,
    loading,
    login,
    register,
    registerWithInvite,
    logout,
    resetPassword,
    updateUserGym,
    refreshUserData,
    hasRole,
    isSysadmin,
    isAdmin,
    isProfesor,
    isAlumno,
    isOnlyAlumno,
    canAssignRole,
    canRemoveRole,
    canManageGyms,
    canManageUsers,
    canManageClasses,
    canManageExercises,
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
