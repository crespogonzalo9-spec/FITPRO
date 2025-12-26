import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share } from 'lucide-react';

const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detectar si ya está instalada como PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone === true;
    setIsStandalone(standalone);

    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // Verificar si ya se mostró el prompt recientemente
    const lastPrompt = localStorage.getItem('fitpro-pwa-prompt');
    const daysSincePrompt = lastPrompt ? (Date.now() - parseInt(lastPrompt)) / (1000 * 60 * 60 * 24) : 999;

    // No mostrar si:
    // - Ya está instalada
    // - Se mostró hace menos de 7 días
    // - El usuario ya lo rechazó 3 veces
    const dismissCount = parseInt(localStorage.getItem('fitpro-pwa-dismiss-count') || '0');
    if (standalone || daysSincePrompt < 7 || dismissCount >= 3) {
      return;
    }

    // Para Android/Chrome - escuchar el evento beforeinstallprompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Mostrar después de 30 segundos de uso
      setTimeout(() => {
        setShowPrompt(true);
        localStorage.setItem('fitpro-pwa-prompt', Date.now().toString());
      }, 30000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Para iOS, mostrar instrucciones manuales después de un tiempo
    if (iOS && !standalone) {
      setTimeout(() => {
        setShowPrompt(true);
        localStorage.setItem('fitpro-pwa-prompt', Date.now().toString());
      }, 60000); // Mostrar después de 1 minuto en iOS
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Android/Chrome
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('[PWA] User accepted install');
        localStorage.removeItem('fitpro-pwa-dismiss-count');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    const count = parseInt(localStorage.getItem('fitpro-pwa-dismiss-count') || '0');
    localStorage.setItem('fitpro-pwa-dismiss-count', (count + 1).toString());
    setShowPrompt(false);
  };

  if (!showPrompt || isStandalone) return null;

  // Prompt para iOS (instrucciones manuales)
  if (isIOS) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700 animate-slideUp">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                <Smartphone className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Instalar FitPro</h3>
                <p className="text-sm text-gray-400">Accedé más rápido</p>
              </div>
            </div>
            <button onClick={handleDismiss} className="p-2 hover:bg-slate-700 rounded-lg">
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <p className="text-gray-300">Para instalar FitPro en tu iPhone:</p>
            <ol className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-white text-xs">1</span>
                <span>Tocá el botón <Share size={16} className="inline text-blue-400" /> en la barra de Safari</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-white text-xs">2</span>
                <span>Deslizá y seleccioná "Agregar a inicio"</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-white text-xs">3</span>
                <span>Tocá "Agregar" en la esquina superior</span>
              </li>
            </ol>
          </div>

          <button
            onClick={handleDismiss}
            className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    );
  }

  // Prompt para Android/Chrome (instalación automática)
  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-50 animate-slideUp">
      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Download className="text-primary" size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold">Instalar FitPro</h3>
            <p className="text-sm text-gray-400 mt-1">
              Agregá FitPro a tu pantalla de inicio para acceder más rápido
            </p>
          </div>
          <button onClick={handleDismiss} className="p-1 hover:bg-slate-700 rounded-lg flex-shrink-0">
            <X size={18} className="text-gray-400" />
          </button>
        </div>
        
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
          >
            Ahora no
          </button>
          <button
            onClick={handleInstall}
            className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Instalar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
