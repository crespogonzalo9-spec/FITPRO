// Formatear fecha
export const formatDate = (date) => {
  if (!date) return '-';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Formatear hora
export const formatTime = (date) => {
  if (!date) return '-';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
};

// Formatear fecha y hora
export const formatDateTime = (date) => {
  if (!date) return '-';
  return `${formatDate(date)} ${formatTime(date)}`;
};

// Formatear tiempo (mm:ss o hh:mm:ss)
export const formatTimeValue = (seconds) => {
  if (!seconds && seconds !== 0) return '-';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Parsear tiempo (mm:ss) a segundos
export const parseTimeToSeconds = (timeStr) => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
};

// Fecha relativa
export const formatRelativeDate = (date) => {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins} min`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days < 7) return `Hace ${days}d`;
  return formatDate(date);
};

// Obtener iniciales
export const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Color de estado de suscripción
export const getSubscriptionStatusColor = (status) => {
  const colors = { active: 'success', pending: 'warning', expired: 'error', cancelled: 'neutral' };
  return colors[status] || 'neutral';
};

export const getSubscriptionStatusName = (status) => {
  const names = { active: 'Activa', pending: 'Pendiente', expired: 'Vencida', cancelled: 'Cancelada' };
  return names[status] || status;
};

// Color de estado de PR
export const getPRStatusColor = (status) => {
  const colors = { pending: 'warning', validated: 'success', rejected: 'error' };
  return colors[status] || 'neutral';
};

export const getPRStatusName = (status) => {
  const names = { pending: 'Pendiente', validated: 'Validada', rejected: 'Rechazada' };
  return names[status] || status;
};

// Nombre del rol
export const getRoleName = (role) => {
  const names = { sysadmin: 'Sysadmin', admin: 'Administrador', profesor: 'Profesor', alumno: 'Alumno' };
  return names[role] || role;
};

// Color del rol
export const getRoleColor = (role) => {
  const colors = { sysadmin: 'purple', admin: 'blue', profesor: 'emerald', alumno: 'gray' };
  return colors[role] || 'gray';
};

// Validar email
export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Validar teléfono
export const isValidPhone = (phone) => /^[0-9]{8,15}$/.test(phone.replace(/\D/g, ''));

// Truncar texto
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Capitalizar primera letra
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Generar ID único
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Ordenar por campo
export const sortBy = (array, field, order = 'asc') => {
  return [...array].sort((a, b) => {
    if (order === 'asc') return a[field] > b[field] ? 1 : -1;
    return a[field] < b[field] ? 1 : -1;
  });
};

// Agrupar por campo
export const groupBy = (array, field) => {
  return array.reduce((groups, item) => {
    const key = item[field];
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {});
};

// Día de la semana actual (0-6)
export const getCurrentDayOfWeek = () => new Date().getDay();

// Nombre del día
export const getDayName = (dayIndex) => {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[dayIndex] || '';
};
