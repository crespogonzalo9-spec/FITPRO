import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

// Roles del sistema
export const ROLES = {
  SYSADMIN: 'sysadmin',
  ADMIN: 'admin',
  COACH: 'coach',
  ATHLETE: 'athlete'
};

// Email del sysadmin
const SYSADMIN_EMAIL = 'crespo.gonzalo9@gmail.com';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Obtener datos adicionales del usuario
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
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
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
      return { success: true };
    } catch (err) {
      const errorMessage = getAuthErrorMessage(err.code);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (email, password, name, gymId = null) => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Determinar el rol
      let role = ROLES.ATHLETE;
      if (email === SYSADMIN_EMAIL) {
        role = ROLES.SYSADMIN;
      }

      // Crear documento del usuario
      const newUserData = {
        uid: result.user.uid,
        email,
        name,
        role,
        gymId,
        photoURL: null,
        phone: null,
        birthDate: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
        // Datos específicos de atleta
        ...(role === ROLES.ATHLETE && {
          subscriptionStatus: 'pending',
          subscriptionEndDate: null,
          personalRecords: {},
          anthropometry: [],
          classesAttended: 0
        })
      };

      await setDoc(doc(db, 'users', result.user.uid), newUserData);
      setUserData(newUserData);
      
      return { success: true };
    } catch (err) {
      const errorMessage = getAuthErrorMessage(err.code);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserData(null);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const resetPassword = async (email) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (err) {
      const errorMessage = getAuthErrorMessage(err.code);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Verificar permisos
  const hasRole = (requiredRole) => {
    if (!userData) return false;
    
    const roleHierarchy = {
      [ROLES.SYSADMIN]: 4,
      [ROLES.ADMIN]: 3,
      [ROLES.COACH]: 2,
      [ROLES.ATHLETE]: 1
    };

    return roleHierarchy[userData.role] >= roleHierarchy[requiredRole];
  };

  const isSysadmin = () => userData?.role === ROLES.SYSADMIN;
  const isAdmin = () => hasRole(ROLES.ADMIN);
  const isCoach = () => hasRole(ROLES.COACH);
  const isAthlete = () => userData?.role === ROLES.ATHLETE;

  const value = {
    user,
    userData,
    loading,
    error,
    login,
    register,
    logout,
    resetPassword,
    hasRole,
    isSysadmin,
    isAdmin,
    isCoach,
    isAthlete,
    ROLES
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Helper para mensajes de error
const getAuthErrorMessage = (code) => {
  const errors = {
    'auth/email-already-in-use': 'Este email ya está registrado',
    'auth/invalid-email': 'Email inválido',
    'auth/operation-not-allowed': 'Operación no permitida',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
    'auth/user-disabled': 'Usuario deshabilitado',
    'auth/user-not-found': 'Usuario no encontrado',
    'auth/wrong-password': 'Contraseña incorrecta',
    'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
    'auth/invalid-credential': 'Credenciales inválidas'
  };
  return errors[code] || 'Error de autenticación';
};

export default AuthContext;
