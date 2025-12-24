import { format, formatDistance, parseISO, isToday, isTomorrow, isYesterday, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

// ============ FORMATEO DE FECHAS ============
export const formatDate = (date, formatStr = 'dd/MM/yyyy') => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date.toDate ? date.toDate() : date;
  return format(d, formatStr, { locale: es });
};

export const formatTime = (date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date.toDate ? date.toDate() : date;
  return format(d, 'HH:mm', { locale: es });
};

export const formatDateTime = (date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date.toDate ? date.toDate() : date;
  return format(d, "dd/MM/yyyy 'a las' HH:mm", { locale: es });
};

export const formatRelativeDate = (date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date.toDate ? date.toDate() : date;
  
  if (isToday(d)) return 'Hoy';
  if (isTomorrow(d)) return 'Mañana';
  if (isYesterday(d)) return 'Ayer';
  
  return formatDistance(d, new Date(), { addSuffix: true, locale: es });
};

export const getWeekDays = (date = new Date()) => {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
};

export const getDayName = (dayIndex) => {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[dayIndex];
};

export const getDayShortName = (dayIndex) => {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return days[dayIndex];
};

// ============ FORMATEO DE MONEDA ============
export const formatCurrency = (amount, currency = 'ARS') => {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatNumber = (number, decimals = 0) => {
  if (number === null || number === undefined) return '-';
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
};

// ============ FORMATEO DE EJERCICIOS ============
export const formatWeight = (value, unit = 'kg') => {
  if (!value) return '-';
  return `${formatNumber(value, 1)} ${unit}`;
};

export const formatTime24 = (seconds) => {
  if (!seconds) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatReps = (value) => {
  if (!value) return '-';
  return `${value} reps`;
};

export const formatDistance = (meters) => {
  if (!meters) return '-';
  if (meters >= 1000) {
    return `${formatNumber(meters / 1000, 2)} km`;
  }
  return `${formatNumber(meters)} m`;
};

// ============ FORMATEO DE ANTROPOMETRÍA ============
export const formatMeasurement = (value, unit = 'cm') => {
  if (!value) return '-';
  return `${formatNumber(value, 1)} ${unit}`;
};

export const calculateBMI = (weight, heightCm) => {
  if (!weight || !heightCm) return null;
  const heightM = heightCm / 100;
  return weight / (heightM * heightM);
};

export const getBMICategory = (bmi) => {
  if (!bmi) return '-';
  if (bmi < 18.5) return { label: 'Bajo peso', color: 'warning' };
  if (bmi < 25) return { label: 'Normal', color: 'success' };
  if (bmi < 30) return { label: 'Sobrepeso', color: 'warning' };
  return { label: 'Obesidad', color: 'error' };
};

// ============ VALIDACIONES ============
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const isValidPhone = (phone) => {
  const regex = /^[\d\s\-+()]{8,}$/;
  return regex.test(phone);
};

export const isValidPassword = (password) => {
  return password && password.length >= 6;
};

// ============ HELPERS ============
export const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

export const capitalize = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const capitalizeWords = (text) => {
  if (!text) return '';
  return text.split(' ').map(capitalize).join(' ');
};

// ============ COLORES POR TIPO ============
export const getExerciseTypeColor = (type) => {
  const colors = {
    strength: '#EF4444',
    cardio: '#3B82F6',
    flexibility: '#10B981',
    crossfit: '#F59E0B',
    olympic: '#8B5CF6',
    functional: '#EC4899',
    default: '#6B7280'
  };
  return colors[type] || colors.default;
};

export const getRoleColor = (role) => {
  const colors = {
    sysadmin: '#8B5CF6',
    admin: '#3B82F6',
    coach: '#10B981',
    athlete: '#F59E0B'
  };
  return colors[role] || '#6B7280';
};

export const getRoleName = (role) => {
  const names = {
    sysadmin: 'Super Admin',
    admin: 'Administrador',
    coach: 'Entrenador',
    athlete: 'Atleta'
  };
  return names[role] || role;
};

export const getSubscriptionStatusColor = (status) => {
  const colors = {
    active: 'success',
    pending: 'warning',
    expired: 'error',
    cancelled: 'neutral'
  };
  return colors[status] || 'neutral';
};

export const getSubscriptionStatusName = (status) => {
  const names = {
    active: 'Activa',
    pending: 'Pendiente',
    expired: 'Vencida',
    cancelled: 'Cancelada'
  };
  return names[status] || status;
};

// ============ GENERADORES ============
export const generateId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const generateColor = (seed) => {
  const colors = [
    '#EF4444', '#F97316', '#F59E0B', '#84CC16',
    '#22C55E', '#10B981', '#14B8A6', '#06B6D4',
    '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
    '#A855F7', '#D946EF', '#EC4899', '#F43F5E'
  ];
  
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

// ============ SORT HELPERS ============
export const sortByDate = (items, field = 'createdAt', order = 'desc') => {
  return [...items].sort((a, b) => {
    const dateA = a[field]?.toDate ? a[field].toDate() : new Date(a[field]);
    const dateB = b[field]?.toDate ? b[field].toDate() : new Date(b[field]);
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
};

export const sortByName = (items, field = 'name', order = 'asc') => {
  return [...items].sort((a, b) => {
    const nameA = (a[field] || '').toLowerCase();
    const nameB = (b[field] || '').toLowerCase();
    return order === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
  });
};

export const sortByNumber = (items, field, order = 'desc') => {
  return [...items].sort((a, b) => {
    const numA = a[field] || 0;
    const numB = b[field] || 0;
    return order === 'desc' ? numB - numA : numA - numB;
  });
};

// ============ FILTER HELPERS ============
export const filterBySearch = (items, search, fields = ['name']) => {
  if (!search) return items;
  const searchLower = search.toLowerCase();
  return items.filter(item =>
    fields.some(field => {
      const value = item[field];
      return value && value.toLowerCase().includes(searchLower);
    })
  );
};

export const filterByDateRange = (items, startDate, endDate, field = 'createdAt') => {
  return items.filter(item => {
    const date = item[field]?.toDate ? item[field].toDate() : new Date(item[field]);
    return (!startDate || date >= startDate) && (!endDate || date <= endDate);
  });
};

// ============ EXPORTAR DATOS ============
export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        let value = row[header];
        if (value === null || value === undefined) value = '';
        if (typeof value === 'object') value = JSON.stringify(value);
        if (typeof value === 'string' && value.includes(',')) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
};

export const downloadJSON = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.json`;
  link.click();
};
