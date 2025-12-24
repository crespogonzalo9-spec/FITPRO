// Tipos de ejercicios
export const EXERCISE_TYPES = [
  { id: 'strength', name: 'Fuerza', icon: 'Dumbbell' },
  { id: 'cardio', name: 'Cardio', icon: 'Heart' },
  { id: 'crossfit', name: 'CrossFit', icon: 'Flame' },
  { id: 'olympic', name: 'Olímpico', icon: 'Trophy' },
  { id: 'functional', name: 'Funcional', icon: 'Activity' },
  { id: 'flexibility', name: 'Flexibilidad', icon: 'Zap' },
  { id: 'gymnastics', name: 'Gimnasia', icon: 'User' }
];

// Grupos musculares
export const MUSCLE_GROUPS = [
  { id: 'chest', name: 'Pecho' },
  { id: 'back', name: 'Espalda' },
  { id: 'shoulders', name: 'Hombros' },
  { id: 'biceps', name: 'Bíceps' },
  { id: 'triceps', name: 'Tríceps' },
  { id: 'forearms', name: 'Antebrazos' },
  { id: 'core', name: 'Core / Abdomen' },
  { id: 'quadriceps', name: 'Cuádriceps' },
  { id: 'hamstrings', name: 'Isquiotibiales' },
  { id: 'glutes', name: 'Glúteos' },
  { id: 'calves', name: 'Gemelos' },
  { id: 'full_body', name: 'Cuerpo completo' }
];

// Equipamiento
export const EQUIPMENT = [
  { id: 'barbell', name: 'Barra' },
  { id: 'dumbbell', name: 'Mancuernas' },
  { id: 'kettlebell', name: 'Kettlebell' },
  { id: 'pullup_bar', name: 'Barra de dominadas' },
  { id: 'rings', name: 'Anillas' },
  { id: 'box', name: 'Cajón' },
  { id: 'rope', name: 'Cuerda' },
  { id: 'rower', name: 'Remo' },
  { id: 'bike', name: 'Bicicleta' },
  { id: 'medicine_ball', name: 'Balón medicinal' },
  { id: 'wall_ball', name: 'Wall Ball' },
  { id: 'slam_ball', name: 'Slam Ball' },
  { id: 'resistance_band', name: 'Banda elástica' },
  { id: 'bodyweight', name: 'Peso corporal' },
  { id: 'machine', name: 'Máquina' },
  { id: 'cable', name: 'Cable' },
  { id: 'trx', name: 'TRX' }
];

// Niveles de dificultad
export const DIFFICULTY_LEVELS = [
  { id: 'beginner', name: 'Principiante', color: '#10B981' },
  { id: 'intermediate', name: 'Intermedio', color: '#F59E0B' },
  { id: 'advanced', name: 'Avanzado', color: '#EF4444' },
  { id: 'elite', name: 'Elite', color: '#8B5CF6' }
];

// Días de la semana
export const DAYS_OF_WEEK = [
  { id: 0, name: 'Domingo', short: 'Dom' },
  { id: 1, name: 'Lunes', short: 'Lun' },
  { id: 2, name: 'Martes', short: 'Mar' },
  { id: 3, name: 'Miércoles', short: 'Mié' },
  { id: 4, name: 'Jueves', short: 'Jue' },
  { id: 5, name: 'Viernes', short: 'Vie' },
  { id: 6, name: 'Sábado', short: 'Sáb' }
];

// Tipos de WOD de CrossFit
export const WOD_TYPES = [
  { id: 'for_time', name: 'For Time', description: 'Completar lo más rápido posible' },
  { id: 'amrap', name: 'AMRAP', description: 'Máximas rondas/reps en tiempo' },
  { id: 'emom', name: 'EMOM', description: 'Every Minute On the Minute' },
  { id: 'tabata', name: 'Tabata', description: '20s trabajo / 10s descanso' },
  { id: 'chipper', name: 'Chipper', description: 'Lista de ejercicios secuenciales' },
  { id: 'ladder', name: 'Ladder', description: 'Incremento/decremento progresivo' },
  { id: 'strength', name: 'Strength', description: 'Trabajo de fuerza' }
];

// Estados de suscripción
export const SUBSCRIPTION_STATUS = [
  { id: 'active', name: 'Activa', color: 'success' },
  { id: 'pending', name: 'Pendiente', color: 'warning' },
  { id: 'expired', name: 'Vencida', color: 'error' },
  { id: 'cancelled', name: 'Cancelada', color: 'neutral' }
];

// Métodos de pago
export const PAYMENT_METHODS = [
  { id: 'cash', name: 'Efectivo' },
  { id: 'transfer', name: 'Transferencia' },
  { id: 'debit', name: 'Débito' },
  { id: 'credit', name: 'Crédito' },
  { id: 'mercadopago', name: 'MercadoPago' }
];

// Medidas antropométricas
export const ANTHROPOMETRY_FIELDS = [
  { id: 'weight', name: 'Peso', unit: 'kg' },
  { id: 'height', name: 'Altura', unit: 'cm' },
  { id: 'bodyFat', name: '% Grasa corporal', unit: '%' },
  { id: 'chest', name: 'Pecho', unit: 'cm' },
  { id: 'waist', name: 'Cintura', unit: 'cm' },
  { id: 'hips', name: 'Cadera', unit: 'cm' },
  { id: 'bicepsLeft', name: 'Bíceps izq.', unit: 'cm' },
  { id: 'bicepsRight', name: 'Bíceps der.', unit: 'cm' },
  { id: 'thighLeft', name: 'Muslo izq.', unit: 'cm' },
  { id: 'thighRight', name: 'Muslo der.', unit: 'cm' },
  { id: 'calfLeft', name: 'Gemelo izq.', unit: 'cm' },
  { id: 'calfRight', name: 'Gemelo der.', unit: 'cm' }
];

// Rutas de navegación por rol
export const NAV_ROUTES = {
  sysadmin: [
    { path: '/dashboard', name: 'Dashboard', icon: 'LayoutDashboard' },
    { path: '/gyms', name: 'Gimnasios', icon: 'Building2' },
    { path: '/users', name: 'Usuarios', icon: 'Users' },
    { path: '/reports', name: 'Reportes', icon: 'BarChart3' },
    { path: '/settings', name: 'Configuración', icon: 'Settings' }
  ],
  admin: [
    { path: '/dashboard', name: 'Dashboard', icon: 'LayoutDashboard' },
    { path: '/members', name: 'Miembros', icon: 'Users' },
    { path: '/coaches', name: 'Entrenadores', icon: 'UserCheck' },
    { path: '/classes', name: 'Clases', icon: 'Calendar' },
    { path: '/exercises', name: 'Ejercicios', icon: 'Dumbbell' },
    { path: '/routines', name: 'Rutinas', icon: 'ClipboardList' },
    { path: '/payments', name: 'Pagos', icon: 'CreditCard' },
    { path: '/reports', name: 'Reportes', icon: 'BarChart3' },
    { path: '/settings', name: 'Configuración', icon: 'Settings' }
  ],
  coach: [
    { path: '/dashboard', name: 'Dashboard', icon: 'LayoutDashboard' },
    { path: '/my-classes', name: 'Mis Clases', icon: 'Calendar' },
    { path: '/athletes', name: 'Atletas', icon: 'Users' },
    { path: '/exercises', name: 'Ejercicios', icon: 'Dumbbell' },
    { path: '/routines', name: 'Rutinas', icon: 'ClipboardList' },
    { path: '/validate', name: 'Validar Resultados', icon: 'CheckCircle' },
    { path: '/messages', name: 'Mensajes', icon: 'MessageSquare' }
  ],
  athlete: [
    { path: '/dashboard', name: 'Dashboard', icon: 'LayoutDashboard' },
    { path: '/schedule', name: 'Calendario', icon: 'Calendar' },
    { path: '/my-classes', name: 'Mis Clases', icon: 'CheckSquare' },
    { path: '/routines', name: 'Rutinas', icon: 'ClipboardList' },
    { path: '/progress', name: 'Mi Progreso', icon: 'TrendingUp' },
    { path: '/rankings', name: 'Rankings', icon: 'Trophy' },
    { path: '/profile', name: 'Mi Perfil', icon: 'User' }
  ]
};

// Ejercicios predefinidos
export const DEFAULT_EXERCISES = [
  { name: 'Back Squat', type: 'strength', muscles: ['quadriceps', 'glutes'], equipment: ['barbell'] },
  { name: 'Front Squat', type: 'strength', muscles: ['quadriceps', 'core'], equipment: ['barbell'] },
  { name: 'Deadlift', type: 'strength', muscles: ['back', 'hamstrings', 'glutes'], equipment: ['barbell'] },
  { name: 'Bench Press', type: 'strength', muscles: ['chest', 'triceps'], equipment: ['barbell'] },
  { name: 'Overhead Press', type: 'strength', muscles: ['shoulders', 'triceps'], equipment: ['barbell'] },
  { name: 'Clean', type: 'olympic', muscles: ['full_body'], equipment: ['barbell'] },
  { name: 'Clean & Jerk', type: 'olympic', muscles: ['full_body'], equipment: ['barbell'] },
  { name: 'Snatch', type: 'olympic', muscles: ['full_body'], equipment: ['barbell'] },
  { name: 'Thruster', type: 'crossfit', muscles: ['quadriceps', 'shoulders'], equipment: ['barbell'] },
  { name: 'Wall Ball', type: 'crossfit', muscles: ['quadriceps', 'shoulders'], equipment: ['wall_ball'] },
  { name: 'Burpee', type: 'crossfit', muscles: ['full_body'], equipment: ['bodyweight'] },
  { name: 'Box Jump', type: 'crossfit', muscles: ['quadriceps', 'glutes'], equipment: ['box'] },
  { name: 'Kettlebell Swing', type: 'crossfit', muscles: ['glutes', 'hamstrings'], equipment: ['kettlebell'] },
  { name: 'Pull Up', type: 'crossfit', muscles: ['back', 'biceps'], equipment: ['pullup_bar'] },
  { name: 'Muscle Up', type: 'crossfit', muscles: ['back', 'chest'], equipment: ['rings'] },
  { name: 'Double Under', type: 'crossfit', muscles: ['calves'], equipment: ['rope'] },
  { name: 'Row', type: 'cardio', muscles: ['full_body'], equipment: ['rower'] },
  { name: 'Run', type: 'cardio', muscles: ['quadriceps', 'calves'], equipment: ['bodyweight'] }
];

// Benchmark WODs
export const BENCHMARK_WODS = [
  { name: 'Fran', type: 'for_time', description: '21-15-9: Thrusters + Pull-ups' },
  { name: 'Grace', type: 'for_time', description: '30 Clean & Jerk' },
  { name: 'Isabel', type: 'for_time', description: '30 Snatch' },
  { name: 'Helen', type: 'for_time', description: '3 rounds: 400m Run + 21 KB Swings + 12 Pull-ups' },
  { name: 'Cindy', type: 'amrap', description: '20 min: 5 Pull-ups + 10 Push-ups + 15 Squats' },
  { name: 'Murph', type: 'for_time', description: '1 mile + 100 Pull-ups + 200 Push-ups + 300 Squats + 1 mile' }
];
