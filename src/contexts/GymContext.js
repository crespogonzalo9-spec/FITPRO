import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const GymContext = createContext();

export const useGym = () => useContext(GymContext);

export const GymProvider = ({ children }) => {
  const { userData, isSysadmin } = useAuth();
  const [currentGym, setCurrentGym] = useState(null);
  const [gyms, setGyms] = useState([]); // Para sysadmin que ve todos
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData) {
      setCurrentGym(null);
      setGyms([]);
      setLoading(false);
      return;
    }

    // Sysadmin puede ver todos los gimnasios
    if (isSysadmin()) {
      const q = query(collection(db, 'gyms'), where('isActive', '==', true));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const gymList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGyms(gymList);
        // Seleccionar el primero si no hay ninguno seleccionado
        if (!currentGym && gymList.length > 0) {
          setCurrentGym(gymList[0]);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    }

    // Otros usuarios ven solo su gimnasio asignado
    if (userData.gymId) {
      const fetchGym = async () => {
        const gymDoc = await getDoc(doc(db, 'gyms', userData.gymId));
        if (gymDoc.exists()) {
          setCurrentGym({ id: gymDoc.id, ...gymDoc.data() });
        }
        setLoading(false);
      };
      fetchGym();
    } else {
      setLoading(false);
    }
  }, [userData]);

  const selectGym = (gym) => {
    setCurrentGym(gym);
  };

  const value = {
    currentGym,
    gyms,
    loading,
    selectGym
  };

  return (
    <GymContext.Provider value={value}>
      {children}
    </GymContext.Provider>
  );
};
