import React, { useState, useEffect } from 'react';
import { Settings, Palette, Moon, Sun, Image, Upload, Check, Building2 } from 'lucide-react';
import { Button, Card, Modal, Input, EmptyState, LoadingState, Badge } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useTheme, COLOR_PALETTES } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { db, storage } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const SettingsPage = () => {
  const { userData, isAdmin, isSysadmin } = useAuth();
  const { currentGym } = useGym();
  const { isDark, toggleTheme, colorPalette, updateGymTheme, updateGymLogo, gymLogo } = useTheme();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedPalette, setSelectedPalette] = useState(colorPalette?.id || 'emerald');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const canEditSettings = isAdmin() || isSysadmin();

  useEffect(() => {
    if (colorPalette) {
      setSelectedPalette(colorPalette.id);
    }
    if (gymLogo) {
      setLogoPreview(gymLogo);
    }
  }, [colorPalette, gymLogo]);

  const handleSaveTheme = async () => {
    if (!currentGym?.id || !canEditSettings) return;
    
    setLoading(true);
    try {
      const result = await updateGymTheme(currentGym.id, selectedPalette, isDark);
      if (result.success) {
        success('Tema actualizado');
      } else {
        showError('Error al guardar tema');
      }
    } catch (err) {
      showError('Error al guardar');
    }
    setLoading(false);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tamaño (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showError('La imagen no puede superar los 2MB');
      return;
    }

    // Validar dimensiones mínimas
    const img = new window.Image();
    img.onload = () => {
      if (img.width < 200 || img.height < 200) {
        showError('La imagen debe tener al menos 200x200 píxeles');
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    };
    img.src = URL.createObjectURL(file);
  };

  const handleSaveLogo = async () => {
    if (!logoFile || !currentGym?.id || !canEditSettings) return;

    setLoading(true);
    try {
      const logoRef = ref(storage, `gyms/${currentGym.id}/logo_${Date.now()}`);
      await uploadBytes(logoRef, logoFile);
      const logoUrl = await getDownloadURL(logoRef);
      
      const result = await updateGymLogo(currentGym.id, logoUrl);
      if (result.success) {
        success('Logo actualizado');
        setLogoFile(null);
      } else {
        showError('Error al guardar logo');
      }
    } catch (err) {
      showError('Error al subir imagen');
    }
    setLoading(false);
  };

  if (!currentGym && !isSysadmin()) {
    return <EmptyState icon={Settings} title="Sin gimnasio" />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-gray-400">Personaliza la apariencia del sistema</p>
      </div>

      {/* Modo Oscuro/Claro */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center">
              {isDark ? <Moon className="text-blue-400" size={24} /> : <Sun className="text-yellow-400" size={24} />}
            </div>
            <div>
              <h3 className="font-semibold">Modo {isDark ? 'Oscuro' : 'Claro'}</h3>
              <p className="text-sm text-gray-400">Cambia el tema de la interfaz</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-14 h-7 rounded-full transition-colors ${isDark ? 'bg-emerald-600' : 'bg-gray-600'}`}
          >
            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${isDark ? 'left-8' : 'left-1'}`} />
          </button>
        </div>
      </Card>

      {/* Paleta de Colores */}
      {canEditSettings && currentGym && (
        <Card>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center">
              <Palette className="text-purple-400" size={24} />
            </div>
            <div>
              <h3 className="font-semibold">Paleta de Colores</h3>
              <p className="text-sm text-gray-400">Color principal del gimnasio</p>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mb-4">
            {COLOR_PALETTES.map(palette => (
              <button
                key={palette.id}
                onClick={() => setSelectedPalette(palette.id)}
                className={`relative w-full aspect-square rounded-xl transition-all ${
                  selectedPalette === palette.id ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : ''
                }`}
                style={{ backgroundColor: palette.primary }}
                title={palette.name}
              >
                {selectedPalette === palette.id && (
                  <Check className="absolute inset-0 m-auto text-white" size={20} />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              Color seleccionado: <span className="font-medium">{COLOR_PALETTES.find(p => p.id === selectedPalette)?.name}</span>
            </p>
            <Button onClick={handleSaveTheme} loading={loading} size="sm">
              Guardar Tema
            </Button>
          </div>
        </Card>
      )}

      {/* Logo del Gimnasio */}
      {canEditSettings && currentGym && (
        <Card>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center">
              <Image className="text-emerald-400" size={24} />
            </div>
            <div>
              <h3 className="font-semibold">Logo del Gimnasio</h3>
              <p className="text-sm text-gray-400">Mínimo 200x200px, máximo 2MB</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-800 flex items-center justify-center">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="text-gray-600" size={40} />
              )}
            </div>

            <div className="flex-1">
              <label className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl cursor-pointer transition-colors w-fit">
                <Upload size={18} />
                <span>Subir imagen</span>
                <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
              </label>
              
              {logoFile && (
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-sm text-gray-400">{logoFile.name}</span>
                  <Button onClick={handleSaveLogo} loading={loading} size="sm">
                    Guardar Logo
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Info del gimnasio */}
      {currentGym && (
        <Card>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center">
              <Building2 className="text-blue-400" size={24} />
            </div>
            <div>
              <h3 className="font-semibold">Información del Gimnasio</h3>
              <p className="text-sm text-gray-400">Datos de tu gimnasio</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">Nombre</span>
              <span className="font-medium">{currentGym.name}</span>
            </div>
            {currentGym.address && (
              <div className="flex justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400">Dirección</span>
                <span className="font-medium">{currentGym.address}</span>
              </div>
            )}
            {currentGym.phone && (
              <div className="flex justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400">Teléfono</span>
                <span className="font-medium">{currentGym.phone}</span>
              </div>
            )}
            {currentGym.email && (
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Email</span>
                <span className="font-medium">{currentGym.email}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Info del usuario */}
      <Card>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-semibold">
            {userData?.name?.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold">{userData?.name}</h3>
            <p className="text-sm text-gray-400">{userData?.email}</p>
          </div>
        </div>
        <Badge variant={userData?.role === 'sysadmin' ? 'purple' : userData?.role === 'admin' ? 'blue' : userData?.role === 'profesor' ? 'emerald' : 'neutral'}>
          {userData?.role === 'sysadmin' ? 'Sysadmin' : userData?.role === 'admin' ? 'Administrador' : userData?.role === 'profesor' ? 'Profesor' : 'Alumno'}
        </Badge>
      </Card>
    </div>
  );
};

export default SettingsPage;
