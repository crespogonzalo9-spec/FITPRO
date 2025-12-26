import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const COLOR_PALETTES = [
  { id: 'emerald', name: 'Esmeralda', primary: '16, 185, 129', hex: '#10B981' },
  { id: 'blue', name: 'Azul', primary: '59, 130, 246', hex: '#3B82F6' },
  { id: 'purple', name: 'Púrpura', primary: '139, 92, 246', hex: '#8B5CF6' },
  { id: 'red', name: 'Rojo', primary: '239, 68, 68', hex: '#EF4444' },
  { id: 'orange', name: 'Naranja', primary: '249, 115, 22', hex: '#F97316' },
  { id: 'pink', name: 'Rosa', primary: '236, 72, 153', hex: '#EC4899' },
  { id: 'cyan', name: 'Cian', primary: '6, 182, 212', hex: '#06B6D4' },
  { id: 'yellow', name: 'Amarillo', primary: '234, 179, 8', hex: '#EAB308' },
];

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('fitpro-dark-mode');
    return saved !== null ? saved === 'true' : true;
  });
  const [paletteId, setPaletteId] = useState(() => {
    return localStorage.getItem('fitpro-palette') || 'emerald';
  });
  const [gymLogo, setGymLogo] = useState(null);
  const [gymId, setGymId] = useState(null);

  // Escuchar cambios del gimnasio
  useEffect(() => {
    if (!gymId) return;

    const unsubscribe = onSnapshot(doc(db, 'gyms', gymId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.colorPalette) {
          setPaletteId(data.colorPalette);
          localStorage.setItem('fitpro-palette', data.colorPalette);
        }
        if (data.darkMode !== undefined) {
          setIsDark(data.darkMode);
          localStorage.setItem('fitpro-dark-mode', data.darkMode.toString());
        }
        if (data.logo) {
          setGymLogo(data.logo);
        }
      }
    });

    return () => unsubscribe();
  }, [gymId]);

  // Aplicar tema al DOM
  useEffect(() => {
    const palette = COLOR_PALETTES.find(p => p.id === paletteId) || COLOR_PALETTES[0];
    const root = document.documentElement;
    
    // Aplicar color primario como CSS variable
    root.style.setProperty('--color-primary', palette.primary);
    root.style.setProperty('--color-primary-hex', palette.hex);
    
    // Aplicar modo oscuro/claro
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      document.body.style.backgroundColor = '#0F172A';
      document.body.style.color = '#F8FAFC';
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      document.body.style.backgroundColor = '#F8FAFC';
      document.body.style.color = '#1E293B';
    }
  }, [isDark, paletteId]);

  const toggleTheme = () => {
    const newValue = !isDark;
    setIsDark(newValue);
    localStorage.setItem('fitpro-dark-mode', newValue.toString());
  };

  const changePalette = (newPaletteId) => {
    setPaletteId(newPaletteId);
    localStorage.setItem('fitpro-palette', newPaletteId);
  };

  const saveGymTheme = async (targetGymId, newPaletteId, newDarkMode) => {
    try {
      await updateDoc(doc(db, 'gyms', targetGymId), {
        colorPalette: newPaletteId,
        darkMode: newDarkMode
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const saveGymLogo = async (targetGymId, logoUrl) => {
    try {
      await updateDoc(doc(db, 'gyms', targetGymId), { logo: logoUrl });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const colorPalette = COLOR_PALETTES.find(p => p.id === paletteId) || COLOR_PALETTES[0];

  return (
    <ThemeContext.Provider value={{
      isDark,
      toggleTheme,
      paletteId,
      colorPalette,
      changePalette,
      gymLogo,
      setGymId,
      saveGymTheme,
      saveGymLogo
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
