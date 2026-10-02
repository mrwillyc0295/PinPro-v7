import { ArrowLeft, Camera, MapPin, Calendar, Clock, CheckCircle2, Loader2, X, Image as ImageIcon, Zap, Droplets, Sparkles, Hammer, Paintbrush, Flower2, Wrench, Truck, Scissors, Stethoscope, BookOpen, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

const SERVICES = [
  { id: 'plomeria', label: 'Plomería', icon: Droplets, color: 'text-blue-400' },
  { id: 'electricidad', label: 'Electricidad', icon: Zap, color: 'text-yellow-400' },
  { id: 'limpieza', label: 'Limpieza', icon: Sparkles, color: 'text-cyan-400' },
  { id: 'carpinteria', label: 'Carpintería', icon: Hammer, color: 'text-orange-400' },
  { id: 'pintura', label: 'Pintura', icon: Paintbrush, color: 'text-pink-400' },
  { id: 'jardineria', label: 'Jardinería', icon: Flower2, color: 'text-green-400' },
  { id: 'mecanica', label: 'Mecánica', icon: Wrench, color: 'text-gray-400' },
  { id: 'mudanza', label: 'Mudanza', icon: Truck, color: 'text-indigo-400' },
  { id: 'belleza', label: 'Belleza', icon: Scissors, color: 'text-purple-400' },
  { id: 'salud', label: 'Salud', icon: Stethoscope, color: 'text-red-400' },
  { id: 'tutoria', label: 'Tutoría', icon: BookOpen, color: 'text-emerald-400' },
  { id: 'otros', label: 'Otros', icon: MoreHorizontal, color: 'text-on-surface-variant' },
];

const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function NewRequest() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  const [serviceType, setServiceType] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'emergency' | 'reservation'>('emergency');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && profile && profile.role !== 'Cliente' && profile.role !== 'Admin' && profile.role !== 'Profesional') {
      navigate('/home');
    }
  }, [profile, loading, navigate]);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length > 0) {
      try {
        const newImages = await Promise.all(
          files.map(file => resizeImage(file, 1024, 1024))
        );
        setPhotos(prev => [...prev, ...newImages].slice(0, 12)); // Max 12 images
      } catch (error) {
        console.error("Error resizing photos:", String(error));
        alert("Hubo un error al procesar las imágenes.");
      }
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!serviceType.trim() || !description.trim()) {
      alert('Por favor completa el tipo de servicio y la descripción.');
      return;
    }

    if (!user) return;

    setIsSubmitting(true);
    try {
      if (mode === 'emergency') {
        // Create Emergency Request
        const docRef = await addDoc(collection(db, 'emergencies'), {
          clientId: user.uid,
          clientName: profile?.name || 'Cliente',
          serviceType,
          description,
          status: 'pending',
          createdAt: serverTimestamp(),
          clientLocation: {
            lat: -12.046374, // Mock: Lima Center
            lng: -77.042793
          },
          photos: photos
        });

        alert('🚨 Emergencia activada. El radar está buscando profesionales cerca de ti.');
        navigate(`/emergency/${docRef.id}`);
      } else {
        // Create standard reservation request
        await addDoc(collection(db, 'requests'), {
          clientId: user.uid,
          clientName: profile?.name || 'Cliente',
          serviceType,
          description,
          photos,
          status: 'pending',
          createdAt: serverTimestamp(),
          location: 'Vivienda Principal',
          date: 'Hoy',
          time: 'Lo antes posible'
        });

        alert('Solicitud enviada. Los profesionales podrán verla en el muro.');
        navigate('/client-reservations');
      }
    } catch (error: any) {
      console.error('Error adding document: ', error);
      handleFirestoreError(error, OperationType.CREATE, 'requests');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-lowest text-on-surface w-full max-w-[800px] mx-auto">
      {/* Header */}
      <header className="px-6 pt-12 pb-4 sticky top-0 z-10 bg-surface-lowest/80 backdrop-blur-xl border-b border-surface-highest flex items-center justify-end">
        <h1 className="text-xl font-display font-black uppercase tracking-tighter italic">Nueva Solicitud</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Mode Selector */}
        <section className="space-y-4">
          <h2 className="text-lg font-display font-semibold">¿Cómo quieres tu servicio?</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setMode('emergency')}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all gap-3",
                mode === 'emergency'
                  ? "bg-primary-container/10 border-primary-container shadow-[0_0_20px_rgba(0,255,255,0.2)]"
                  : "bg-surface-container border-transparent opacity-60"
              )}
            >
              <div className={cn(
                "p-3 rounded-2xl",
                mode === 'emergency' ? "bg-primary-container text-surface-lowest" : "bg-surface-highest text-on-surface-variant"
              )}>
                <Zap className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="font-black text-sm uppercase tracking-tighter">Urgencia</p>
                <p className="text-[10px] opacity-70">Lo antes posible</p>
              </div>
            </button>
            <button
              onClick={() => setMode('reservation')}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all gap-3",
                mode === 'reservation'
                  ? "bg-magenta-500/10 border-magenta-500 shadow-[0_0_20px_rgba(255,0,255,0.2)]"
                  : "bg-surface-container border-transparent opacity-60"
              )}
            >
              <div className={cn(
                "p-3 rounded-2xl",
                mode === 'reservation' ? "bg-magenta-500 text-white" : "bg-surface-highest text-on-surface-variant"
              )}>
                <Calendar className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="font-black text-sm uppercase tracking-tighter">Reserva</p>
                <p className="text-[10px] opacity-70">Planifica tu fecha</p>
              </div>
            </button>
          </div>
        </section>

        {/* Service Type */}
        <section className="space-y-4">
          <h2 className="text-lg font-display font-semibold">¿Qué servicio necesitas?</h2>
          <div className="relative">
            <input
              type="text"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              placeholder="Ej: Plomería, Electricidad, Limpieza..."
              className="w-full bg-surface-container text-on-surface placeholder:text-on-surface-variant rounded-2xl py-4 px-4 focus:outline-none focus:ring-1 focus:ring-primary-container transition-shadow"
            />
          </div>

          {/* Services Menu */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {SERVICES.map((service) => {
              const Icon = service.icon;
              const isSelected = serviceType === service.label;
              return (
                <button
                  key={service.id}
                  onClick={() => setServiceType(service.label)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 gap-2 group",
                    isSelected
                      ? "bg-primary-container/20 border-primary-container shadow-[0_0_15px_rgba(0,255,255,0.2)]"
                      : "bg-surface-container border-outline-variant/30 hover:border-primary-container/50 hover:bg-surface-highest"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
                    isSelected ? "bg-primary-container text-surface-lowest" : "bg-surface-highest text-on-surface-variant",
                    !isSelected && service.color
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-wider text-center",
                    isSelected ? "text-primary-container" : "text-on-surface-variant"
                  )}>
                    {service.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Description */}
        <section className="space-y-4">
          <h2 className="text-lg font-display font-semibold">Describe el problema</h2>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalla lo que necesitas que el profesional haga..."
            className="w-full bg-surface-container text-on-surface placeholder:text-on-surface-variant rounded-2xl py-4 px-4 focus:outline-none focus:ring-1 focus:ring-primary-container transition-shadow resize-none"
          />
        </section>

        {/* Photos */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-semibold">Fotos (Opcional)</h2>
            <span className="text-xs font-medium text-on-surface-variant">{photos.length}/12 fotos</span>
          </div>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
            {photos.map((photo, index) => (
              <div key={index} className="relative w-24 h-24 shrink-0 rounded-2xl border border-outline-variant/30 overflow-hidden group">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${photo})` }}></div>
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 bg-surface-lowest/80 text-error p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {photos.length < 12 && (
              <button
                onClick={handlePhotoClick}
                className="w-24 h-24 shrink-0 rounded-2xl border-2 border-dashed border-surface-highest flex flex-col items-center justify-center gap-2 text-on-surface-variant hover:border-primary-container hover:text-primary-container transition-colors"
              >
                <Camera className="w-6 h-6" />
                <span className="text-xs font-medium">Añadir</span>
              </button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoChange}
              accept="image/*"
              multiple
              className="hidden"
            />
          </div>
        </section>

        {/* Location */}
        <section className="space-y-4">
          <h2 className="text-lg font-display font-semibold">Ubicación</h2>
          <button className="w-full flex items-center gap-4 bg-surface-container p-4 rounded-2xl hover:bg-surface-highest transition-colors text-left">
            <div className="w-10 h-10 rounded-full bg-surface-highest flex items-center justify-center text-primary-container shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-on-surface truncate">Usar mi ubicación actual</p>
              <p className="text-sm text-on-surface-variant truncate">Av. Siempre Viva 742</p>
            </div>
          </button>
        </section>

        {/* Date & Time */}
        <section className="space-y-4">
          <h2 className="text-lg font-display font-semibold">¿Cuándo lo necesitas?</h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center gap-3 bg-surface-container p-4 rounded-2xl hover:bg-surface-highest transition-colors">
              <Calendar className="w-5 h-5 text-primary-container" />
              <span className="font-medium">Hoy</span>
            </button>
            <button className="flex items-center gap-3 bg-surface-container p-4 rounded-2xl hover:bg-surface-highest transition-colors">
              <Clock className="w-5 h-5 text-primary-container" />
              <span className="font-medium">Lo antes posible</span>
            </button>
          </div>
        </section>
      </div>

      {/* Action Button */}
      <div className="p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] bg-surface-lowest border-t border-surface-highest sticky bottom-0 z-10">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-primary-container text-surface-lowest font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-on-surface hover:text-surface-lowest transition-colors shadow-[0_0_20px_rgba(0,255,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-5 h-5" />
          )}
          {isSubmitting ? 'Publicando...' : 'Publicar Solicitud'}
        </button>
      </div>
    </div>
  );
}
