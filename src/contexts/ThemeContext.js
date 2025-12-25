import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

// Paletas de colores predefinidas
export const COLOR_PALETTES = [
  { id: 'emerald', name: 'Esmeralda', primary: '#10B981', primaryDark: '#059669', primaryLight: '#34D399' },
  { id: 'blue', name: 'Azul', primary: '#3B82F6', primaryDark: '#2563EB', primaryLight: '#60A5FA' },
  { id: 'purple', name: 'Púrpura', primary: '#8B5CF6', primaryDark: '#7C3AED', primaryLight: '#A78BFA' },
  { id: 'red', name: 'Rojo', primary: '#EF4444', primaryDark: '#DC2626', primaryLight: '#F87171' },
  { id: 'orange', name: 'Naranja', primary: '#F97316', primaryDark: '#EA580C', primaryLight: '#FB923C' },
  { id: 'pink', name: 'Rosa', primary: '#EC4899', primaryDark: '#DB2777', primaryLight: '#F472B6' },
  { id: 'cyan', name: 'Cian', primary: '#06B6D4', primaryDark: '#0891B2', primaryLight: '#22D3EE' },
  { id: 'yellow', name: 'Amarillo', primary: '#EAB308', primaryDark: '#CA8A04', primaryLight: '#FACC15' },
];

export const ThemeProvider = ({ children }) => {
  const { userData } = useAuth();
  const [isDark, setIsDark] = useState(true);
  const [colorPalette, setColorPalette] = useState(COLOR_PALETTES[0]);
  const [gymLogo, setGymLogo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar preferencias del gimnasio
  useEffect(() => {
    if (!userData?.gymId) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'gyms', userData.gymId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.colorPalette) {
          const palette = COLOR_PALETTES.find(p => p.id === data.colorPalette) || COLOR_PALETTES[0];
          setColorPalette(palette);
        }
        if (data.logo) {
          setGymLogo(data.logo);
        }
        if (data.darkMode !== undefined) {
          setIsDark(data.darkMode);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData?.gymId]);

  // Cargar preferencia local de tema
  useEffect(() => {
    const savedTheme = localStorage.getItem('fitpro-theme');
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
    }
  }, []);

  // Aplicar CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', colorPalette.primary);
    root.style.setProperty('--color-primary-dark', colorPalette.primaryDark);
    root.style.setProperty('--color-primary-light', colorPalette.primaryLight);
    
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    
    localStorage.setItem('fitpro-theme', isDark ? 'dark' : 'light');
  }, [isDark, colorPalette]);

  const toggleTheme = () => setIsDark(!isDark);

  const updateGymTheme = async (gymId, paletteId, darkMode) => {
    try {
      await updateDoc(doc(db, 'gyms', gymId), {
        colorPalette: paletteId,
        darkMode: darkMode
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateGymLogo = async (gymId, logoUrl) => {
    try {
      await updateDoc(doc(db, 'gyms', gymId), { logo: logoUrl });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    isDark,
    toggleTheme,
    colorPalette,
    setColorPalette,
    gymLogo,
    loading,
    updateGymTheme,
    updateGymLogo
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
