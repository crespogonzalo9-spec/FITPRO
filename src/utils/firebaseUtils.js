import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  writeBatch,
  increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';

// ============ GIMNASIOS ============
export const createGym = async (gymData) => {
  try {
    const docRef = await addDoc(collection(db, 'gyms'), {
      ...gymData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true,
      membersCount: 0,
      coachesCount: 0
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateGym = async (gymId, updates) => {
  try {
    await updateDoc(doc(db, 'gyms', gymId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteGym = async (gymId) => {
  try {
    await deleteDoc(doc(db, 'gyms', gymId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ============ USUARIOS ============
export const updateUser = async (userId, updates) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getUsersByGym = async (gymId, role = null) => {
  try {
    let q = query(
      collection(db, 'users'),
      where('gymId', '==', gymId)
    );
    
    if (role) {
      q = query(q, where('role', '==', role));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};

export const assignRole = async (userId, role, gymId) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      role,
      gymId,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ============ CLASES ============
export const createClass = async (classData) => {
  try {
    const docRef = await addDoc(collection(db, 'classes'), {
      ...classData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      enrolledCount: 0,
      isActive: true
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateClass = async (classId, updates) => {
  try {
    await updateDoc(doc(db, 'classes', classId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteClass = async (classId) => {
  try {
    await deleteDoc(doc(db, 'classes', classId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getClassesByGym = async (gymId) => {
  try {
    const q = query(
      collection(db, 'classes'),
      where('gymId', '==', gymId),
      where('isActive', '==', true),
      orderBy('dayOfWeek'),
      orderBy('startTime')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting classes:', error);
    return [];
  }
};

// ============ INSCRIPCIONES A CLASES ============
export const enrollInClass = async (classId, userId, classDate) => {
  try {
    const batch = writeBatch(db);
    
    // Verificar si ya está inscrito
    const existingQuery = query(
      collection(db, 'enrollments'),
      where('classId', '==', classId),
      where('userId', '==', userId),
      where('date', '==', classDate)
    );
    const existing = await getDocs(existingQuery);
    
    if (!existing.empty) {
      return { success: false, error: 'Ya estás inscrito en esta clase' };
    }
    
    // Verificar cupos
    const classDoc = await getDoc(doc(db, 'classes', classId));
    if (!classDoc.exists()) {
      return { success: false, error: 'Clase no encontrada' };
    }
    
    const classData = classDoc.data();
    if (classData.enrolledCount >= classData.capacity) {
      return { success: false, error: 'No hay cupos disponibles' };
    }
    
    // Crear inscripción
    const enrollmentRef = doc(collection(db, 'enrollments'));
    batch.set(enrollmentRef, {
      classId,
      userId,
      date: classDate,
      status: 'enrolled',
      createdAt: serverTimestamp()
    });
    
    // Actualizar contador
    batch.update(doc(db, 'classes', classId), {
      enrolledCount: increment(1)
    });
    
    await batch.commit();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const cancelEnrollment = async (enrollmentId, classId) => {
  try {
    const batch = writeBatch(db);
    
    batch.delete(doc(db, 'enrollments', enrollmentId));
    batch.update(doc(db, 'classes', classId), {
      enrolledCount: increment(-1)
    });
    
    await batch.commit();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getEnrollmentsByUser = async (userId) => {
  try {
    const q = query(
      collection(db, 'enrollments'),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting enrollments:', error);
    return [];
  }
};

// ============ EJERCICIOS ============
export const createExercise = async (exerciseData) => {
  try {
    const docRef = await addDoc(collection(db, 'exercises'), {
      ...exerciseData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateExercise = async (exerciseId, updates) => {
  try {
    await updateDoc(doc(db, 'exercises', exerciseId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteExercise = async (exerciseId) => {
  try {
    await deleteDoc(doc(db, 'exercises', exerciseId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getExercisesByGym = async (gymId) => {
  try {
    const q = query(
      collection(db, 'exercises'),
      where('gymId', '==', gymId),
      orderBy('name')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting exercises:', error);
    return [];
  }
};

// ============ RUTINAS ============
export const createRoutine = async (routineData) => {
  try {
    const docRef = await addDoc(collection(db, 'routines'), {
      ...routineData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateRoutine = async (routineId, updates) => {
  try {
    await updateDoc(doc(db, 'routines', routineId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteRoutine = async (routineId) => {
  try {
    await deleteDoc(doc(db, 'routines', routineId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getRoutinesByClass = async (classId) => {
  try {
    const q = query(
      collection(db, 'routines'),
      where('classId', '==', classId),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting routines:', error);
    return [];
  }
};

// ============ RESULTADOS Y PRs ============
export const saveResult = async (resultData) => {
  try {
    const docRef = await addDoc(collection(db, 'results'), {
      ...resultData,
      validated: false,
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const validateResult = async (resultId, coachId) => {
  try {
    await updateDoc(doc(db, 'results', resultId), {
      validated: true,
      validatedBy: coachId,
      validatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updatePersonalRecord = async (userId, exerciseId, value, unit) => {
  try {
    const prRef = doc(db, 'personalRecords', `${userId}_${exerciseId}`);
    await updateDoc(prRef, {
      value,
      unit,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    // Si no existe, crearlo
    try {
      const prRef = doc(db, 'personalRecords', `${userId}_${exerciseId}`);
      await setDoc(prRef, {
        userId,
        exerciseId,
        value,
        unit,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};

export const getPersonalRecords = async (userId) => {
  try {
    const q = query(
      collection(db, 'personalRecords'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting PRs:', error);
    return [];
  }
};

// ============ ANTROPOMETRÍA ============
export const saveAnthropometry = async (userId, data) => {
  try {
    const docRef = await addDoc(collection(db, 'anthropometry'), {
      userId,
      ...data,
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getAnthropometryHistory = async (userId) => {
  try {
    const q = query(
      collection(db, 'anthropometry'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting anthropometry:', error);
    return [];
  }
};

// ============ ASISTENCIA ============
export const recordAttendance = async (userId, classId, date) => {
  try {
    const batch = writeBatch(db);
    
    // Registrar asistencia
    const attendanceRef = doc(collection(db, 'attendance'));
    batch.set(attendanceRef, {
      userId,
      classId,
      date,
      checkInTime: serverTimestamp()
    });
    
    // Actualizar contador del usuario
    batch.update(doc(db, 'users', userId), {
      classesAttended: increment(1)
    });
    
    await batch.commit();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getAttendanceByClass = async (classId, date) => {
  try {
    const q = query(
      collection(db, 'attendance'),
      where('classId', '==', classId),
      where('date', '==', date)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting attendance:', error);
    return [];
  }
};

// ============ RANKINGS ============
export const getRankingByExercise = async (gymId, exerciseId, limitCount = 10) => {
  try {
    const q = query(
      collection(db, 'results'),
      where('gymId', '==', gymId),
      where('exerciseId', '==', exerciseId),
      where('validated', '==', true),
      orderBy('value', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting ranking:', error);
    return [];
  }
};

// ============ PAGOS ============
export const createPayment = async (paymentData) => {
  try {
    const docRef = await addDoc(collection(db, 'payments'), {
      ...paymentData,
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getPaymentsByUser = async (userId) => {
  try {
    const q = query(
      collection(db, 'payments'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting payments:', error);
    return [];
  }
};

export const getPaymentsByGym = async (gymId, startDate = null, endDate = null) => {
  try {
    let q = query(
      collection(db, 'payments'),
      where('gymId', '==', gymId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    let payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (startDate && endDate) {
      payments = payments.filter(p => {
        const date = p.createdAt?.toDate();
        return date >= startDate && date <= endDate;
      });
    }
    
    return payments;
  } catch (error) {
    console.error('Error getting payments:', error);
    return [];
  }
};

// ============ SUBIR ARCHIVOS ============
export const uploadFile = async (file, path) => {
  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return { success: true, url };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteFile = async (path) => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ============ MENSAJERÍA ============
export const sendMessage = async (fromId, toId, content, gymId) => {
  try {
    const docRef = await addDoc(collection(db, 'messages'), {
      fromId,
      toId,
      gymId,
      content,
      read: false,
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getMessages = async (userId1, userId2) => {
  try {
    const q = query(
      collection(db, 'messages'),
      where('fromId', 'in', [userId1, userId2]),
      orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(msg => 
        (msg.fromId === userId1 && msg.toId === userId2) ||
        (msg.fromId === userId2 && msg.toId === userId1)
      );
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
};

export const markMessageAsRead = async (messageId) => {
  try {
    await updateDoc(doc(db, 'messages', messageId), {
      read: true,
      readAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ============ NOTIFICACIONES ============
export const createNotification = async (notificationData) => {
  try {
    const docRef = await addDoc(collection(db, 'notifications'), {
      ...notificationData,
      read: false,
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getNotifications = async (userId) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
};

// ============ UTILIDADES ============
export const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatDateTime = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(amount);
};
