import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, collection, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const GymContext = createContext();

export const useGym = () => useContext(GymContext);

export const GymProvider = ({ children }) => {
  const { userData, isSysadmin } = useAuth();
  const [currentGym, setCurrentGymState] = useState(null);
  const [availableGyms, setAvailableGyms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData) {
      setCurrentGymState(null);
      setAvailableGyms([]);
      setLoading(false);
      return;
    }

    // Sysadmin puede ver todos los gimnasios
    if (isSysadmin && isSysadmin()) {
      const unsubscribe = onSnapshot(collection(db, 'gyms'), (snapshot) => {
        const gymList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setAvailableGyms(gymList);
        
        // Recuperar gimnasio guardado en localStorage
        const savedGymId = localStorage.getItem('fitpro-selected-gym');
        const savedGym = gymList.find(g => g.id === savedGymId);
        
        if (savedGym) {
          setCurrentGymState(savedGym);
        }
        // NO seleccionar automáticamente - dejar que el sysadmin elija
        setLoading(false);
      });
      return () => unsubscribe();
    }

    // Otros usuarios ven solo su gimnasio asignado
    if (userData.gymId) {
      const unsubscribe = onSnapshot(doc(db, 'gyms', userData.gymId), (docSnap) => {
        if (docSnap.exists()) {
          const gym = { id: docSnap.id, ...docSnap.data() };
          setCurrentGymState(gym);
          setAvailableGyms([gym]);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Usuario sin gimnasio
      setCurrentGymState(null);
      setAvailableGyms([]);
      setLoading(false);
    }
  }, [userData, isSysadmin]);

  // Función para seleccionar gimnasio (solo sysadmin)
  const selectGym = (gymId) => {
    const gym = availableGyms.find(g => g.id === gymId);
    if (gym) {
      setCurrentGymState(gym);
      localStorage.setItem('fitpro-selected-gym', gymId);
    }
  };

  const value = {
    currentGym,
    availableGyms,
    selectGym,
    loading
  };

  return (
    <GymContext.Provider value={value}>
      {children}
    </GymContext.Provider>
  );
};
