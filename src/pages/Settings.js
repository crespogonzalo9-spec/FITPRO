import React, { useState, useEffect } from 'react';
import { Palette, Moon, Sun, Image as ImageIcon, Upload, Check, Building2, Save } from 'lucide-react';
import { Button, Card, Badge } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useTheme, COLOR_PALETTES } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const Settings = () => {
  const { userData, isAdmin, isSysadmin } = useAuth();
  const { currentGym } = useGym();
  const { isDark, toggleTheme, paletteId, setPaletteId, saveGymTheme, saveGymLogo, gymLogo } = useTheme();
  const { success, error: showError } = useToast();
  
  const [selectedPalette, setSelectedPalette] = useState(paletteId);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const canEdit = isAdmin() || isSysadmin();

  useEffect(() => {
    setSelectedPalette(paletteId);
  }, [paletteId]);

  useEffect(() => {
    if (gymLogo) setLogoPreview(gymLogo);
  }, [gymLogo]);

  const handlePaletteChange = (newPaletteId) => {
    setSelectedPalette(newPaletteId);
    setPaletteId(newPaletteId);
  };

  const handleSaveTheme = async () => {
    if (!currentGym?.id || !canEdit) return;
    setSaving(true);
    const result = await saveGymTheme(currentGym.id, selectedPalette, isDark);
    if (result.success) {
      success('Tema guardado para todo el gimnasio');
    } else {
      showError('Error al guardar');
    }
    setSaving(false);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showError('Máximo 2MB'); return; }
    const img = new window.Image();
    img.onload = () => {
      if (img.width < 200 || img.height < 200) { showError('Mínimo 200x200px'); return; }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    };
    img.src = URL.createObjectURL(file);
  };

  const handleSaveLogo = async () => {
    if (!logoFile || !currentGym?.id) return;
    setSaving(true);
    try {
      const logoRef = ref(storage, `gyms/${currentGym.id}/logo_${Date.now()}`);
      await uploadBytes(logoRef, logoFile);
      const logoUrl = await getDownloadURL(logoRef);
      const result = await saveGymLogo(currentGym.id, logoUrl);
      if (result.success) { success('Logo actualizado'); setLogoFile(null); }
      else showError('Error');
    } catch (err) { showError('Error al subir'); }
    setSaving(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-gray-400">Personaliza la apariencia</p>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center">
              {isDark ? <Moon className="text-blue-400" size={24} /> : <Sun className="text-yellow-400" size={24} />}
            </div>
            <div>
              <h3 className="font-semibold">Modo {isDark ? 'Oscuro' : 'Claro'}</h3>
              <p className="text-sm text-gray-400">Tema de la interfaz</p>
            </div>
          </div>
          <button onClick={toggleTheme} className="relative w-14 h-7 rounded-full transition-colors" style={{ backgroundColor: isDark ? 'rgba(var(--color-primary), 1)' : '#6B7280' }}>
            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${isDark ? 'left-8' : 'left-1'}`} />
          </button>
        </div>
      </Card>

      {canEdit && currentGym && (
        <Card>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center">
              <Palette className="text-purple-400" size={24} />
            </div>
            <div>
              <h3 className="font-semibold">Paleta de Colores</h3>
              <p className="text-sm text-gray-400">Se aplica a todo el gimnasio</p>
            </div>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mb-4">
            {COLOR_PALETTES.map(p => (
              <button key={p.id} onClick={() => handlePaletteChange(p.id)} title={p.name}
                className={`relative aspect-square rounded-xl transition-all hover:scale-105 ${selectedPalette === p.id ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-105' : ''}`}
                style={{ backgroundColor: p.hex }}>
                {selectedPalette === p.id && <Check className="absolute inset-0 m-auto text-white drop-shadow" size={24} />}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-gray-700">
            <p className="text-sm text-gray-400">Color: <strong>{COLOR_PALETTES.find(p => p.id === selectedPalette)?.name}</strong></p>
            <Button onClick={handleSaveTheme} loading={saving} icon={Save}>Guardar Tema</Button>
          </div>
        </Card>
      )}

      {canEdit && currentGym && (
        <Card>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center">
              <ImageIcon className="text-emerald-400" size={24} />
            </div>
            <div>
              <h3 className="font-semibold">Logo del Gimnasio</h3>
              <p className="text-sm text-gray-400">Mínimo 200x200px, máximo 2MB</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-800 flex items-center justify-center border-2 border-dashed border-gray-600">
              {logoPreview ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" /> : <Building2 className="text-gray-600" size={40} />}
            </div>
            <div className="flex-1">
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl cursor-pointer transition-colors">
                <Upload size={18} /><span>Subir</span>
                <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
              </label>
              {logoFile && (
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-sm text-gray-400 truncate">{logoFile.name}</span>
                  <Button onClick={handleSaveLogo} loading={saving} size="sm">Guardar</Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {currentGym && (
        <Card>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center">
              <Building2 className="text-blue-400" size={24} />
            </div>
            <div>
              <h3 className="font-semibold">{currentGym.name}</h3>
              <p className="text-sm text-gray-400">{currentGym.address || 'Sin dirección'}</p>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold text-lg" style={{ backgroundColor: 'rgba(var(--color-primary), 1)' }}>
            {userData?.name?.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold">{userData?.name}</h3>
            <p className="text-sm text-gray-400">{userData?.email}</p>
            <Badge className="mt-1 badge-primary">{userData?.role === 'sysadmin' ? 'Sysadmin' : userData?.role === 'admin' ? 'Admin' : userData?.role === 'profesor' ? 'Profesor' : 'Alumno'}</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
