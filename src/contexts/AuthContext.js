import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Email del Sysadmin
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
        // Obtener datos del usuario de Firestore
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

  const register = async (email, password, name, phone = '') => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Determinar rol inicial
      const role = email.toLowerCase() === SYSADMIN_EMAIL.toLowerCase() ? 'sysadmin' : 'alumno';
      
      // Crear documento de usuario
      const newUserData = {
        email: email.toLowerCase(),
        name,
        phone,
        role,
        gymId: null, // Se asigna cuando un admin lo agrega a un gimnasio
        isActive: true,
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

  // Verificar si tiene un rol específico o superior
  const hasRole = (requiredRole) => {
    if (!userData?.role) return false;
    return ROLE_HIERARCHY[userData.role] >= ROLE_HIERARCHY[requiredRole];
  };

  // Verificar rol exacto
  const isRole = (role) => userData?.role === role;

  // Helpers de rol
  const isSysadmin = () => isRole('sysadmin');
  const isAdmin = () => isRole('admin') || isRole('sysadmin');
  const isProfesor = () => isRole('profesor');
  const isAlumno = () => isRole('alumno');

  // Puede gestionar gimnasios (solo sysadmin)
  const canManageGyms = () => isSysadmin();
  
  // Puede asignar admins (solo sysadmin)
  const canAssignAdmin = () => isSysadmin();
  
  // Puede gestionar profesores (admin o sysadmin)
  const canManageProfesores = () => hasRole('admin');
  
  // Puede gestionar alumnos (admin, profesor)
  const canManageAlumnos = () => hasRole('profesor');
  
  // Puede crear rutinas/WODs
  const canCreateRoutines = () => hasRole('profesor');
  
  // Puede validar rankings
  const canValidateRankings = () => hasRole('profesor');
  
  // Puede crear rankings (solo admin)
  const canCreateRankings = () => hasRole('admin');

  const value = {
    user,
    userData,
    loading,
    login,
    register,
    logout,
    resetPassword,
    hasRole,
    isRole,
    isSysadmin,
    isAdmin,
    isProfesor,
    isAlumno,
    canManageGyms,
    canAssignAdmin,
    canManageProfesores,
    canManageAlumnos,
    canCreateRoutines,
    canValidateRankings,
    canCreateRankings
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
