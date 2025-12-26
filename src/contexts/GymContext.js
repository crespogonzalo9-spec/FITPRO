import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const GymContext = createContext();

export const useGym = () => useContext(GymContext);

export const GymProvider = ({ children }) => {
  const { userData, isSysadmin } = useAuth();
  const [currentGym, setCurrentGymState] = useState(null);
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData) {
      setCurrentGymState(null);
      setGyms([]);
      setLoading(false);
      return;
    }

    // Sysadmin puede ver todos los gimnasios
    if (isSysadmin()) {
      const q = query(collection(db, 'gyms'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const gymList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGyms(gymList);
        
        // Recuperar gimnasio guardado en localStorage o seleccionar el primero
        const savedGymId = localStorage.getItem('fitpro-selected-gym');
        const savedGym = gymList.find(g => g.id === savedGymId);
        
        if (savedGym) {
          setCurrentGymState(savedGym);
        } else if (!currentGym && gymList.length > 0) {
          setCurrentGymState(gymList[0]);
          localStorage.setItem('fitpro-selected-gym', gymList[0].id);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    }

    // Otros usuarios ven solo su gimnasio asignado
    if (userData.gymId) {
      const unsubscribe = onSnapshot(doc(db, 'gyms', userData.gymId), (docSnap) => {
        if (docSnap.exists()) {
          setCurrentGymState({ id: docSnap.id, ...docSnap.data() });
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [userData, isSysadmin]);

  // Función para cambiar de gimnasio (solo sysadmin)
  const setCurrentGym = (gym) => {
    setCurrentGymState(gym);
    if (gym?.id) {
      localStorage.setItem('fitpro-selected-gym', gym.id);
    }
  };

  const value = {
    currentGym,
    setCurrentGym,
    gyms,
    loading
  };

  return (
    <GymContext.Provider value={value}>
      {children}
    </GymContext.Provider>
  );
};
