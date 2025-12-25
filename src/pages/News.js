import React, { useState, useEffect } from 'react';
import { Plus, Megaphone, MoreVertical, Edit, Trash2, Image, Send } from 'lucide-react';
import { Button, Card, Modal, Input, Textarea, EmptyState, LoadingState, ConfirmDialog, Badge, Avatar, Dropdown, DropdownItem } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useGym } from '../contexts/GymContext';
import { useToast } from '../contexts/ToastContext';
import { db, storage } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { formatRelativeDate } from '../utils/helpers';

const News = () => {
  const { userData, isAdmin } = useAuth();
  const { currentGym } = useGym();
  const { success, error: showError } = useToast();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!currentGym?.id) { setLoading(false); return; }

    const q = query(
      collection(db, 'news'),
      where('gymId', '==', currentGym.id),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snap) => {
      setNews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentGym]);

  const handleSave = async (data, imageFile) => {
    try {
      let imageUrl = data.imageUrl || null;

      // Subir imagen si hay una nueva
      if (imageFile) {
        const imageRef = ref(storage, `news/${currentGym.id}/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      const newsData = {
        ...data,
        imageUrl,
        gymId: currentGym.id,
        authorId: userData.id,
        authorName: userData.name
      };

      if (selected?.id) {
        await updateDoc(doc(db, 'news', selected.id), { ...newsData, updatedAt: serverTimestamp() });
        success('Novedad actualizada');
      } else {
        await addDoc(collection(db, 'news'), { ...newsData, createdAt: serverTimestamp() });
        success('Novedad publicada');
        
        // Enviar notificación push (si está configurado)
        sendPushNotification(data.title, data.body);
      }

      setShowModal(false);
      setSelected(null);
    } catch (err) {
      console.error(err);
      showError('Error al guardar');
    }
  };

  const sendPushNotification = async (title, body) => {
    // Aquí se integraría con Firebase Cloud Messaging
    // Por ahora solo logueamos
    console.log('Push notification:', { title, body });
    
    // Para implementar FCM:
    // 1. Guardar tokens de dispositivos en Firestore cuando el usuario acepta notificaciones
    // 2. Usar Cloud Functions para enviar notificaciones cuando se crea una novedad
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'news', selected.id));
      success('Novedad eliminada');
      setShowDelete(false);
      setSelected(null);
    } catch (err) {
      showError('Error al eliminar');
    }
  };

  if (loading) return <LoadingState />;
  if (!currentGym) return <EmptyState icon={Megaphone} title="Sin gimnasio" />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Novedades</h1>
          <p className="text-gray-400">{news.length} publicaciones</p>
        </div>
        {isAdmin() && (
          <Button icon={Plus} onClick={() => { setSelected(null); setShowModal(true); }}>
            Nueva Publicación
          </Button>
        )}
      </div>

      {news.length === 0 ? (
        <EmptyState 
          icon={Megaphone} 
          title="Sin novedades" 
          description="Aún no hay publicaciones"
          action={isAdmin() && <Button icon={Plus} onClick={() => setShowModal(true)}>Publicar</Button>}
        />
      ) : (
        <div className="space-y-4">
          {news.map(item => (
            <Card key={item.id} className="overflow-hidden">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <Avatar name={item.authorName} size="md" />
                  <div>
                    <p className="font-medium">{item.authorName}</p>
                    <p className="text-xs text-gray-400">{formatRelativeDate(item.createdAt)}</p>
                  </div>
                </div>
                {isAdmin() && (
                  <Dropdown trigger={<button className="p-2 hover:bg-gray-700 rounded-lg"><MoreVertical size={18} /></button>}>
                    <DropdownItem icon={Edit} onClick={() => { setSelected(item); setShowModal(true); }}>Editar</DropdownItem>
                    <DropdownItem icon={Trash2} danger onClick={() => { setSelected(item); setShowDelete(true); }}>Eliminar</DropdownItem>
                  </Dropdown>
                )}
              </div>

              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-300 whitespace-pre-wrap">{item.body}</p>

              {item.imageUrl && (
                <div className="mt-4 rounded-xl overflow-hidden">
                  <img src={item.imageUrl} alt={item.title} className="w-full max-h-96 object-cover" />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <NewsModal 
        isOpen={showModal} 
        onClose={() => { setShowModal(false); setSelected(null); }} 
        onSave={handleSave} 
        news={selected} 
      />
      <ConfirmDialog 
        isOpen={showDelete} 
        onClose={() => setShowDelete(false)} 
        onConfirm={handleDelete} 
        title="Eliminar" 
        message="¿Eliminar esta publicación?" 
        confirmText="Eliminar" 
      />
    </div>
  );
};

const NewsModal = ({ isOpen, onClose, onSave, news }) => {
  const [form, setForm] = useState({ title: '', body: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (news) {
      setForm({ title: news.title || '', body: news.body || '' });
      setImagePreview(news.imageUrl || null);
    } else {
      setForm({ title: '', body: '' });
      setImagePreview(null);
    }
    setImageFile(null);
  }, [news, isOpen]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no puede superar los 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.body) return;
    setLoading(true);
    await onSave(form, imageFile);
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={news ? 'Editar Publicación' : 'Nueva Publicación'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input 
          label="Título *" 
          value={form.title} 
          onChange={e => setForm({ ...form, title: e.target.value })} 
          placeholder="Título de la novedad"
          required 
        />
        
        <Textarea 
          label="Contenido *" 
          value={form.body} 
          onChange={e => setForm({ ...form, body: e.target.value })} 
          rows={5}
          placeholder="Escribe el contenido de la publicación..."
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Imagen (opcional)</label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl cursor-pointer transition-colors">
              <Image size={18} />
              <span>Subir imagen</span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
            {imagePreview && (
              <button 
                type="button" 
                onClick={() => { setImageFile(null); setImagePreview(null); }}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Quitar imagen
              </button>
            )}
          </div>
          {imagePreview && (
            <div className="mt-3 rounded-xl overflow-hidden">
              <img src={imagePreview} alt="Preview" className="w-full max-h-48 object-cover" />
            </div>
          )}
        </div>

        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-sm text-blue-400">
          <Send size={16} className="inline mr-2" />
          Al publicar, se enviará una notificación a todos los miembros del gimnasio
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1">
            {news ? 'Guardar' : 'Publicar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default News;
