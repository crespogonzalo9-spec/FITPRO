import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const GymContext = createContext();

export const useGym = () => {
  const context = useContext(GymContext);
  if (!context) {
    throw new Error('useGym debe usarse dentro de GymProvider');
  }
  return context;
};

export const GymProvider = ({ children }) => {
  const { userData, isSysadmin } = useAuth();
  const [currentGym, setCurrentGym] = useState(null);
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar gimnasio actual
  useEffect(() => {
    if (!userData) {
      setCurrentGym(null);
      setLoading(false);
      return;
    }

    const loadGym = async () => {
      try {
        if (userData.gymId) {
          const gymDoc = await getDoc(doc(db, 'gyms', userData.gymId));
          if (gymDoc.exists()) {
            setCurrentGym({ id: gymDoc.id, ...gymDoc.data() });
          }
        }
      } catch (error) {
        console.error('Error loading gym:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGym();
  }, [userData]);

  // Cargar todos los gimnasios (solo para sysadmin)
  useEffect(() => {
    if (!isSysadmin()) {
      setGyms([]);
      return;
    }

    const q = query(collection(db, 'gyms'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const gymsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGyms(gymsList);
    });

    return () => unsubscribe();
  }, [isSysadmin]);

  const switchGym = async (gymId) => {
    try {
      const gymDoc = await getDoc(doc(db, 'gyms', gymId));
      if (gymDoc.exists()) {
        setCurrentGym({ id: gymDoc.id, ...gymDoc.data() });
        return { success: true };
      }
      return { success: false, error: 'Gimnasio no encontrado' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    currentGym,
    gyms,
    loading,
    switchGym
  };

  return (
    <GymContext.Provider value={value}>
      {children}
    </GymContext.Provider>
  );
};

export default GymContext;
