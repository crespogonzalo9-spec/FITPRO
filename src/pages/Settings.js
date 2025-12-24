import React from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Palette, Database } from 'lucide-react';
import { Card, Button, Input, Toggle } from '../components/Common';
import { useToast } from '../contexts/ToastContext';

const Settings = () => {
  const { success } = useToast();
  
  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl">
      <h1 className="text-2xl font-bold">Configuración</h1>

      <Card>
        <h3 className="font-semibold mb-4 flex items-center gap-2"><User size={20} /> Perfil del Gimnasio</h3>
        <div className="space-y-4">
          <Input label="Nombre del Gimnasio" defaultValue="CrossFit Box" />
          <Input label="Dirección" defaultValue="Av. Corrientes 1234, CABA" />
          <Input label="Teléfono" defaultValue="+54 11 1234-5678" />
          <Input label="Email de contacto" defaultValue="info@crossfitbox.com" />
          <Button onClick={() => success('Configuración guardada')}>Guardar Cambios</Button>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Bell size={20} /> Notificaciones</h3>
        <div className="space-y-4">
          <Toggle label="Notificaciones por email" checked={true} onChange={() => {}} />
          <Toggle label="Recordatorios de clase" checked={true} onChange={() => {}} />
          <Toggle label="Alertas de pago vencido" checked={true} onChange={() => {}} />
          <Toggle label="Notificaciones push" checked={false} onChange={() => {}} />
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Shield size={20} /> Seguridad</h3>
        <div className="space-y-4">
          <Button variant="secondary">Cambiar Contraseña</Button>
          <Button variant="secondary">Configurar 2FA</Button>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
