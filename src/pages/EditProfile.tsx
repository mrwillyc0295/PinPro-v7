import { ArrowLeft, Camera, User, MapPin, AlignLeft, Save, Instagram, Facebook, ShieldCheck, Image as ImageIcon, X, Plus, Trash2, AlertTriangle, Briefcase, Globe, Linkedin, ExternalLink, DollarSign, Clock, Grid, Search, ChevronDown, Droplets, Zap, Sparkles, Hammer, Paintbrush, Flower2, Wrench, Truck, Scissors, Stethoscope, BookOpen, MonitorSmartphone, Dumbbell, Wifi, LogOut, LocateFixed } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import React, { useState, useRef, useEffect } from 'react';
import { useAuth, ServiceItem } from '../contexts/AuthContext';
import { auth, db, storage } from '../firebase';
import { doc, updateDoc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, uploadString, getDownloadURL } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { spanishSpeakingCountriesMenu } from '../constants/countries';

import { serviceCategories } from '../constants/serviceCategories';

const getProfessionIcon = (profession: string | undefined) => {
  if (!profession) return <Briefcase className="w-full h-full" />;
  const p = profession.toLowerCase();
  if (p.includes('plomero') || p.includes('fontanero') || p.includes('agua')) return <Droplets className="w-full h-full" />;
  if (p.includes('electricista') || p.includes('aire') || p.includes('electrodomésticos')) return <Zap className="w-full h-full" />;
  if (p.includes('limpieza') || p.includes('fumigador') || p.includes('lavandería')) return <Sparkles className="w-full h-full" />;
  if (p.includes('carpintero') || p.includes('albañil') || p.includes('herrero') || p.includes('vidriero')) return <Hammer className="w-full h-full" />;
  if (p.includes('pintor') || p.includes('decorador')) return <Paintbrush className="w-full h-full" />;
  if (p.includes('jardinería')) return <Flower2 className="w-full h-full" />;
  if (p.includes('mecánico') || p.includes('cerrajero')) return <Wrench className="w-full h-full" />;
  if (p.includes('mudanza') || p.includes('delivery') || p.includes('chofer') || p.includes('mensajero')) return <Truck className="w-full h-full" />;
  if (p.includes('estilista') || p.includes('barbero') || p.includes('manicurista') || p.includes('maquillador') || p.includes('peluquería')) return <Scissors className="w-full h-full" />;
  if (p.includes('médico') || p.includes('enfermero') || p.includes('odontólogo') || p.includes('psicólogo') || p.includes('nutricionista') || p.includes('pediatra') || p.includes('ginecólogo') || p.includes('veterinario')) return <Stethoscope className="w-full h-full" />;
  if (p.includes('tutor') || p.includes('profesor') || p.includes('asesor') || p.includes('contador') || p.includes('coach')) return <BookOpen className="w-full h-full" />;
  if (p.includes('tecnología') || p.includes('computadoras') || p.includes('celulares') || p.includes('desarrollador') || p.includes('redes')) return <MonitorSmartphone className="w-full h-full" />;
  if (p.includes('entrenador') || p.includes('masajista') || p.includes('fisioterapeuta')) return <Dumbbell className="w-full h-full" />;
  if (p.includes('fotógrafo') || p.includes('dj') || p.includes('músico') || p.includes('animador') || p.includes('catering') || p.includes('bartender')) return <Camera className="w-full h-full" />;
  return <Briefcase className="w-full h-full" />;
};

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
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // compress to 70% quality jpeg
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

import { AnimatedBackButton } from '../components/AnimatedBackButton';

import { LoadingScreen } from '../components/LoadingScreen';

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [state, setState] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [adminType1, setAdminType1] = useState('estado');
  const [adminType2, setAdminType2] = useState('municipio');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [profession, setProfession] = useState('');
  const [verificationStatus, setVerificationStatus] = useState(profile?.verificationStatus || 'none');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [zodiacSign, setZodiacSign] = useState('');
  const [bio, setBio] = useState('');
  const [bioError, setBioError] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [profileImage, setProfileImage] = useState('');
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [verificationDocs, setVerificationDocs] = useState<string[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [breakTimes, setBreakTimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isServicesMenuOpen, setIsServicesMenuOpen] = useState(false);
  const [menuSearchTerm, setMenuSearchTerm] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const verificationInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (name && name.length < 3) {
      setNameError('El nombre debe tener al menos 3 caracteres.');
    } else {
      setNameError('');
    }
  }, [name]);

  useEffect(() => {
    if (bio && bio.length < 20) {
      setBioError('La biografía debe tener al menos 20 caracteres.');
    } else {
      setBioError('');
    }
  }, [bio]);

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!profile) {
    return <div className="flex items-center justify-center h-full">No se pudo cargar el perfil.</div>;
  }

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setLocation(profile.country || '');
      setState(profile.state || '');
      setMunicipality(profile.municipality || '');
      setLatitude(profile.latitude || null);
      setLongitude(profile.longitude || null);
      setGender(profile.gender || '');
      setAge(profile.age ? profile.age.toString() : '');
      setProfession(profile.profession || '');
      setYearsOfExperience(profile.yearsOfExperience ? profile.yearsOfExperience.toString() : '');
      setZodiacSign(profile.zodiacSign || '');
      setBio(profile.bio || '');
      setInstagram(profile.instagram || '');
      setFacebook(profile.facebook || '');
      setIsOnline(profile.isOnline || false);
      setProfileImage(profile.photoUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAVqV7kR3nY9ZElnG0EBeEF8qLS4vIawXTRCOzs9ycbzOY4CjRoA0m-E2UF1hY7Eg7c0tXOnC0cy7y1nJsGFYuWZYNDvs4PEbsGJn4kaFty-vD0SiCCDGLwp4c_a4EGCQIHxEpmoJqha5OdKbIXPyEZCh87TlrFqPdGFFu2x3pWGTQ0MHq4Xs2B9dzI0ZmnGmYFgRfhz1lrbDzE5AKNuX5vLOX5ar0C-Bd7efu_ZghTx0E0jQG-1n2k2OskIF18ctr2PwYjqBRJYxa');
      setPortfolioImages(profile.portfolio || []);
      setTags(profile.tags || []);
      setVideoUrl(profile.videoUrl || '');
      setVerificationDocs(profile.verificationDocs || []);
      setServices(profile.services || []);
      setBreakTimes(profile.breakTimes || [
        { day: 'Lunes', start: '13:00', end: '14:00', enabled: false },
        { day: 'Martes', start: '13:00', end: '14:00', enabled: false },
        { day: 'Miércoles', start: '13:00', end: '14:00', enabled: false },
        { day: 'Jueves', start: '13:00', end: '14:00', enabled: false },
        { day: 'Viernes', start: '13:00', end: '14:00', enabled: false },
        { day: 'Sábado', start: '13:00', end: '14:00', enabled: false },
        { day: 'Domingo', start: '13:00', end: '14:00', enabled: false },
      ]);
    }
  }, [profile]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setLoading(true);
      // 1. Redimensionar la imagen a 800x800 máximo
      const base64Image = await resizeImage(file, 800, 800);

      // 2. Crear referencia en Firebase Storage
      const storageRef = ref(storage, `profiles/${user.uid}/profile_image_${Date.now()}.jpg`);

      // 3. Subir la imagen (base64) a Storage
      await uploadString(storageRef, base64Image, 'data_url');

      // 4. Obtener la URL de descarga
      const downloadURL = await getDownloadURL(storageRef);

      // 5. Actualizar el estado local y el perfil en Firestore
      setProfileImage(downloadURL);

      const userRef = doc(db, 'profesionales', user.uid);
      await setDoc(userRef, {
        photoUrl: downloadURL,
        updatedAt: serverTimestamp()
      }, { merge: true });

      alert("Imagen de perfil actualizada correctamente.");
    } catch (error) {
      console.error("Error uploading image:", String(error));
      alert("Hubo un error al subir la imagen. Por favor, inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handlePortfolioClick = () => {
    portfolioInputRef.current?.click();
  };

  const handlePortfolioChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length > 0) {
      try {
        const newImages = await Promise.all(
          files.map(file => resizeImage(file, 1024, 1024))
        );
        setPortfolioImages(prev => [...prev, ...newImages].slice(0, 10)); // Max 10 images
      } catch (error) {
        console.error("Error resizing portfolio images:", String(error));
        alert("Hubo un error al procesar las imágenes del portafolio.");
      }
    }
  };

  const removePortfolioImage = (index: number) => {
    setPortfolioImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleVerificationClick = () => {
    verificationInputRef.current?.click();
  };

  const handleVerificationChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length > 0) {
      try {
        const newDocs = await Promise.all(
          files.map(file => resizeImage(file, 1200, 1200))
        );
        setVerificationDocs(prev => [...prev, ...newDocs].slice(0, 3)); // Max 3 docs
      } catch (error) {
        console.error("Error resizing verification docs:", String(error));
        alert("Hubo un error al procesar los documentos.");
      }
    }
  };

  const removeVerificationDoc = (index: number) => {
    setVerificationDocs(prev => prev.filter((_, i) => i !== index));
  };

  const handleMunicipalityChange = (muniName: string) => {
    setMunicipality(muniName);

    // Margarita specific coordinates for better map placement
    const margaritaLocations = [
      { name: 'Mariño (Porlamar)', lat: 10.9550, lng: -63.8486 },
      { name: 'Maneiro (Pampatar)', lat: 10.9961, lng: -63.7981 },
      { name: 'Arismendi (La Asunción)', lat: 11.0294, lng: -63.8628 },
      { name: 'Marcano (Juan Griego)', lat: 11.0817, lng: -63.9658 },
      { name: 'Díaz (San Juan Bautista)', lat: 11.0139, lng: -63.9436 },
      { name: 'Tubores (Punta de Piedras)', lat: 10.9022, lng: -64.0375 },
      { name: 'Península de Macanao (Boca del Río)', lat: 10.9631, lng: -64.1750 },
      { name: 'García (El Valle)', lat: 10.9822, lng: -63.8814 },
      { name: 'Gómez (Santa Ana)', lat: 11.0767, lng: -63.9214 },
      { name: 'Antolín del Campo (Plaza de Paraguachí)', lat: 11.1467, lng: -63.8344 },
      { name: 'Villalba (Isla de Coche)', lat: 10.7794, lng: -63.9439 }
    ];

    const selected = margaritaLocations.find(l => l.name === muniName);
    if (selected) {
      setLatitude(selected.lat);
      setLongitude(selected.lng);
    }
  };

  const handleStateChange = (stateName: string) => {
    setState(stateName);
    setMunicipality('');
  };

  const handleCountryChange = (countryLabel: string) => {
    setLocation(countryLabel);
    setState('');
    setMunicipality('');
    const countryData = spanishSpeakingCountriesMenu.find(c => c.labelCountry === countryLabel);
    if (countryData) {
      setAdminType1(countryData.adminType1);
      setAdminType2(countryData.adminType2 || 'municipio');
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("La geolocalización no es compatible con tu navegador.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLoading(false);
        alert("Ubicación capturada con éxito.");
      },
      (error) => {
        setLoading(false);
        console.error("Error getting location:", error);
      }
    );
  };

  const addService = () => {
    const newService: ServiceItem = {
      id: Math.random().toString(36).substr(2, 9),
      title: '',
      desc: '',
      price: '',
      unit: 'Hora'
    };
    setServices([...services, newService]);
  };

  const updateService = (id: string, field: keyof ServiceItem, value: string) => {
    setServices(services.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);

      const updateData: any = {
        name,
        phone,
        country: location,
        state,
        municipality,
        latitude,
        longitude,
        bio,
        instagram,
        facebook,
        isOnline,
        photoUrl: profileImage,
        portfolio: portfolioImages,
        tags: tags,
        videoUrl: videoUrl,
        verificationDocs: verificationDocs,
        services: services,
        breakTimes: breakTimes,
        referralCode: profile?.referralCode || `REF-${user.uid.substring(0, 8).toUpperCase()}`,
        updatedAt: serverTimestamp()
      };

      if (verificationDocs.length > 0 && profile?.verificationStatus === 'none') {
        updateData.verificationStatus = 'pending';
      }

      if (gender) updateData.gender = gender;

      if (zodiacSign) updateData.zodiacSign = zodiacSign;
      if (age) updateData.age = parseInt(age, 10);
      if (profession) updateData.profession = profession;
      if (yearsOfExperience) updateData.yearsOfExperience = parseInt(yearsOfExperience, 10);

      const collectionName = profile?.role === 'Cliente' ? 'clientes' : 'profesionales';
      await setDoc(doc(db, collectionName, user.uid), updateData, { merge: true });
      alert('Perfil actualizado exitosamente');
      navigate('/profile');
    } catch (error) {
      console.error("Error updating profile:", error);
      handleFirestoreError(error, OperationType.UPDATE, `${profile?.role === 'Cliente' ? 'clientes' : 'profesionales'}/${user.uid}`);
      alert('Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!user || !profile) return;
    try {
      setLoading(true);
      const collectionName = profile.role === 'Cliente' ? 'clientes' : 'profesionales';
      await deleteDoc(doc(db, collectionName, user.uid));
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Error deleting profile:", error);
      handleFirestoreError(error, OperationType.DELETE, `${profile.role === 'Cliente' ? 'clientes' : 'profesionales'}/${user.uid}`);
      alert("Error al eliminar el perfil");
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="relative flex min-h-full w-full max-w-[800px] mx-auto flex-col bg-surface-lowest overflow-x-hidden pb-20">
      {/* Header */}
      <div className="flex items-center bg-surface-lowest/80 backdrop-blur-md px-4 pt-10 pb-4 justify-between sticky top-0 z-20 border-b border-outline-variant/30">
        <div className="w-10"></div>
        <h2 className="text-on-surface text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Editar Perfil</h2>
        <div className="w-10"></div>
      </div>

      <div className="px-6 py-6 flex-1 flex flex-col">
        {/* Profile Picture Edit */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative cursor-pointer group" onClick={handleImageClick}>
            <div className="w-[124px] h-[124px] rounded-full border-4 border-[#00ff88] bg-surface-highest overflow-hidden flex items-center justify-center shadow-[0_4px_15px_rgba(0,255,136,0.4)] transition-transform group-hover:scale-105">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Avatar Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-4xl font-bold text-white uppercase opacity-50">
                  {name.charAt(0)}{name.split(' ')[1]?.charAt(0) || name.charAt(1)}
                </div>
              )}
            </div>
            <button className="absolute bottom-0 right-0 bg-primary-container text-surface-lowest p-2.5 rounded-full shadow-[0_4px_10px_rgba(0,255,255,0.4)] group-hover:bg-primary transition-all border-2 border-surface-lowest z-30">
              <Camera className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-col items-center gap-2 mt-3">
            <p onClick={handleImageClick} className="text-xs text-primary-container font-bold uppercase tracking-wider cursor-pointer hover:underline">Cambiar Foto</p>
            {(profile?.isPremium || profile?.isElite) && (
              <div className="flex items-center gap-1.5 bg-primary-container/10 px-3 py-1 rounded-full border border-primary-container/20 shadow-[0_0_10px_rgba(0,255,255,0.1)]">
                <ShieldCheck className="w-3.5 h-3.5 text-primary-container" />
                <span className="text-[10px] font-black text-primary-container uppercase tracking-widest">Perfil Verificado</span>
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave} className="flex flex-col gap-5 flex-1">
          <div className="flex flex-col gap-5 flex-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">Instagram</label>
              <div className="relative">
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full bg-surface-container/50 border border-outline-variant/50 text-on-surface text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
                  placeholder="@usuario"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">Facebook</label>
              <div className="relative">
                <input
                  type="text"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  className="w-full bg-surface-container/50 border border-outline-variant/50 text-on-surface text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
                  placeholder="facebook.com/usuario"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">Nombre Completo</label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={cn(
                  "w-full bg-surface-container/50 border border-outline-variant/50 text-on-surface text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all",
                  nameError && "border-error focus:border-error focus:ring-error"
                )}
                required
              />
            </div>
            {nameError && <p className="text-xs text-error mt-1">{nameError}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">Teléfono</label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-surface-container/50 border border-outline-variant/50 text-on-surface text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
                placeholder="Ej. +1 809-123-4567"
              />
            </div>
            <p className="text-[10px] text-on-surface-variant/70 pl-2 mt-0.5">
              Si debes actualizar o agregar tu número, hazlo aquí.
            </p>
          </div>

          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">País</label>
              <select
                value={location}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full bg-surface-container/50 border border-outline-variant/50 text-on-surface text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all appearance-none"
              >
                <option value="" disabled>Seleccionar país...</option>
                {spanishSpeakingCountriesMenu.map(c => (
                  <option key={c.country} value={c.labelCountry}>{c.labelCountry}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1 capitalize">
                  {adminType1}
                </label>
                <select
                  value={state}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full bg-surface-container/50 border border-outline-variant/50 text-on-surface text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all appearance-none"
                  disabled={!location}
                >
                  <option value="" disabled>Seleccionar {adminType1}...</option>
                  {location && spanishSpeakingCountriesMenu.find(c => c.labelCountry === location)?.children.map(child => (
                    <option key={child.name} value={child.name}>{child.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1 capitalize">
                  {adminType2}
                </label>
                <select
                  value={municipality}
                  onChange={(e) => handleMunicipalityChange(e.target.value)}
                  className="w-full bg-surface-container/50 border border-outline-variant/50 text-on-surface text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all appearance-none"
                  disabled={!state}
                >
                  <option value="" disabled>Seleccionar {adminType2}...</option>
                  {state && spanishSpeakingCountriesMenu.find(c => c.labelCountry === location)?.children.find(s => s.name === state)?.children?.map(muni => (
                    <option key={muni.name} value={muni.name}>{muni.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">Geolocalización (Mapa)</label>
            <button
              type="button"
              onClick={getCurrentLocation}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border transition-all font-bold text-sm",
                latitude && longitude
                  ? "bg-green-500/10 border-green-500/30 text-green-500"
                  : "bg-surface-container/50 border-outline-variant/50 text-on-surface hover:bg-surface-highest"
              )}
            >
              <LocateFixed className="w-5 h-5" />
              {latitude && longitude ? 'Ubicación Conectada' : 'Conectar mi Ubicación al Mapa'}
            </button>
            {latitude && (
              <p className="text-[10px] text-on-surface-variant mt-1 px-1 font-mono">
                Lat: {latitude.toFixed(4)}, Lng: {longitude?.toFixed(4)}
              </p>
            )}
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">Género</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-surface-container/50 border border-outline-variant/50 text-on-surface text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all appearance-none"
              >
                <option value="" disabled>Seleccionar...</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            {profile?.role === 'Cliente' ? (
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">Signo de horóscopo</label>
                <select
                  value={zodiacSign}
                  onChange={(e) => setZodiacSign(e.target.value)}
                  className="w-full bg-surface-container/50 border border-outline-variant/50 text-on-surface text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all appearance-none"
                >
                  <option value="" disabled>Seleccionar...</option>
                  <option value="Aries">Aries</option>
                  <option value="Tauro">Tauro</option>
                  <option value="Géminis">Géminis</option>
                  <option value="Cáncer">Cáncer</option>
                  <option value="Leo">Leo</option>
                  <option value="Virgo">Virgo</option>
                  <option value="Libra">Libra</option>
                  <option value="Escorpio">Escorpio</option>
                  <option value="Sagitario">Sagitario</option>
                  <option value="Capricornio">Capricornio</option>
                  <option value="Acuario">Acuario</option>
                  <option value="Piscis">Piscis</option>
                </select>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">Edad</label>
                <input
                  type="number"
                  min="18"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-surface-container/50 border border-outline-variant/50 text-on-surface text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
                  placeholder="Ej. 30"
                />
              </div>
            )}
          </div>

          <div className="flex gap-4 w-full">
              <div className="flex flex-col gap-1.5 flex-[2]">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">Profesión / Talento</label>
                <button
                  type="button"
                  onClick={() => setIsServicesMenuOpen(true)}
                  className="w-full bg-surface-container/50 border border-outline-variant/50 text-on-surface text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all flex items-center justify-between"
                >
                  <span className={cn("truncate", !profession && "text-on-surface-variant")}>
                    {profession || 'Seleccionar talento...'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-on-surface-variant shrink-0" />
                </button>
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">Años de Exp.</label>
                <input
                  type="number"
                  min="0"
                  max="80"
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(e.target.value)}
                  className="w-full bg-surface-container/50 border border-outline-variant/50 text-on-surface text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
                  placeholder="Ej. 5"
                />
              </div>
            </div>

          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">Sobre Mí (Bio)</label>
            <div className="relative flex-1 flex flex-col">
              <div className="absolute top-3.5 left-0 pl-4 pointer-events-none">
                <AlignLeft className="h-5 w-5 text-on-surface-variant" />
              </div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className={cn(
                  "w-full flex-1 min-h-[150px] bg-surface-container/50 border border-outline-variant/50 text-on-surface text-sm rounded-xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all resize-none",
                  bioError && "border-error focus:border-error focus:ring-error"
                )}
                placeholder="Cuéntanos un poco sobre ti..."
                required
              />
            </div>
            {bioError && <p className="text-xs text-error mt-1">{bioError}</p>}
          </div>

          {profile?.role === 'Profesional' && (
            <div className="flex flex-col gap-6">
              {/* Etiquetas / Especialidades */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">Especialidades / Etiquetas</label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 10) {
                            setTags([...tags, tagInput.trim()]);
                            setTagInput('');
                          }
                        }
                      }}
                      placeholder="Ej. Urgencias 24/7, A domicilio..."
                      className="flex-1 bg-surface-container/50 border border-outline-variant/50 text-on-surface text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 10) {
                          setTags([...tags, tagInput.trim()]);
                          setTagInput('');
                        }
                      }}
                      className="bg-primary-container text-surface-lowest px-4 rounded-xl font-bold hover:bg-primary-container/90 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag, index) => (
                      <div key={index} className="flex items-center gap-1 bg-primary-container/10 border border-primary-container/30 text-primary-container px-3 py-1.5 rounded-full text-xs font-medium">
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => setTags(tags.filter((_, i) => i !== index))}
                          className="hover:bg-primary-container/20 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {tags.length === 0 && (
                      <p className="text-xs text-on-surface-variant">Agrega hasta 10 etiquetas para destacar tu perfil.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Video de Presentación */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">Video de Presentación (YouTube / Vimeo)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Camera className="h-5 w-5 text-on-surface-variant" />
                  </div>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full bg-surface-container/50 border border-outline-variant/50 text-on-surface text-sm rounded-xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
              </div>
              {/* Servicios y Tarifas */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between pl-1">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary-container" />
                    <h2 className="text-sm font-black text-on-surface uppercase tracking-widest">Servicios y Tarifas</h2>
                  </div>
                  <button
                    type="button"
                    onClick={addService}
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-primary-container bg-primary-container/10 px-3 py-2 rounded-lg hover:bg-primary-container/20 transition-all border border-primary-container/30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Agregar
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  {services.length === 0 ? (
                    <div className="bg-surface-container/30 border border-dashed border-outline-variant/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center">
                      <div className="w-12 h-12 rounded-full bg-surface-highest flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-on-surface-variant/50" />
                      </div>
                      <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                        No has agregado servicios aún.<br/>
                        Define lo que ofreces y tus precios para atraer clientes.
                      </p>
                    </div>
                  ) : (
                    services.map((service) => (
                      <div key={service.id} className="bg-surface-container/50 border border-outline-variant/50 rounded-2xl p-5 flex flex-col gap-4 relative group animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <button
                          type="button"
                          onClick={() => removeService(service.id)}
                          className="absolute top-4 right-4 p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-full transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">Nombre del Servicio</label>
                            <input
                              type="text"
                              value={service.title}
                              onChange={(e) => updateService(service.id, 'title', e.target.value)}
                              className="w-full bg-surface-lowest border border-outline-variant/50 text-on-surface text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-primary-container transition-all"
                              placeholder="Ej. Reparación de Tuberías"
                            />
                          </div>

                          <div className="flex gap-4">
                            <div className="flex flex-col gap-1.5 flex-1">
                              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">Precio</label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                  <DollarSign className="h-4 w-4 text-on-surface-variant" />
                                </div>
                                <input
                                  type="text"
                                  value={service.price}
                                  onChange={(e) => updateService(service.id, 'price', e.target.value)}
                                  className="w-full bg-surface-lowest border border-outline-variant/50 text-on-surface text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-primary-container transition-all"
                                  placeholder="Ej. 50"
                                />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5 w-[120px]">
                              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">Unidad</label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                  <Clock className="h-4 w-4 text-on-surface-variant" />
                                </div>
                                <select
                                  value={service.unit}
                                  onChange={(e) => updateService(service.id, 'unit', e.target.value)}
                                  className="w-full bg-surface-lowest border border-outline-variant/50 text-on-surface text-sm rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:border-primary-container transition-all appearance-none"
                                >
                                  <option value="Hora">/ Hora</option>
                                  <option value="Servicio">/ Servicio</option>
                                  <option value="Día">/ Día</option>
                                  <option value="M2">/ M2</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">Descripción corta</label>
                            <textarea
                              value={service.desc}
                              onChange={(e) => updateService(service.id, 'desc', e.target.value)}
                              className="w-full bg-surface-lowest border border-outline-variant/50 text-on-surface text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-primary-container transition-all resize-none h-24"
                              placeholder="Describe brevemente qué incluye este servicio..."
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Verificación de Identidad */}
              <div className="flex flex-col gap-4 mt-2">
                <div className="flex items-center justify-between pl-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary-container" />
                    <h2 className="text-sm font-black text-on-surface uppercase tracking-widest">Verificación de Identidad</h2>
                  </div>
                  {profile?.verificationStatus === 'verified' ? (
                    <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/30 uppercase tracking-widest">Verificado</span>
                  ) : profile?.verificationStatus === 'pending' ? (
                    <span className="text-[10px] font-black text-gold bg-gold/10 px-3 py-1 rounded-full border border-gold/30 uppercase tracking-widest">Pendiente</span>
                  ) : null}
                </div>

                <div className="bg-surface-container/50 border border-outline-variant/50 rounded-2xl p-5 flex flex-col gap-4">
                  <p className="text-[10px] text-on-surface-variant font-bold leading-relaxed">
                    Sube una foto de tu documento de identidad (DNI, Cédula o Pasaporte) para obtener el sello de confianza. Esto es obligatorio para alcanzar el estatus Elite.
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    {verificationDocs.map((img, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border border-outline-variant/30">
                        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${img})` }}></div>
                        {/* Status Badge */}
                        <div className="absolute bottom-1 left-1 right-1">
                          <div className={cn(
                            "text-[7px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-md text-center backdrop-blur-md border",
                            profile?.verificationStatus === 'verified' ? "bg-green-500/20 text-green-500 border-green-500/30" :
                            profile?.verificationStatus === 'pending' ? "bg-amber-500/20 text-amber-500 border-amber-500/30" :
                            "bg-surface-lowest/60 text-on-surface-variant border-outline-variant/30"
                          )}>
                            {profile?.verificationStatus === 'verified' ? 'Verificado' :
                             profile?.verificationStatus === 'pending' ? 'En Revisión' : 'Subido'}
                          </div>
                        </div>
                        {profile?.verificationStatus !== 'verified' && (
                          <button
                            type="button"
                            onClick={() => removeVerificationDoc(index)}
                            className="absolute top-1 right-1 bg-surface-lowest/80 text-error p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}

                    {verificationDocs.length < 3 && profile?.verificationStatus !== 'verified' && (
                      <div
                        onClick={handleVerificationClick}
                        className="aspect-square rounded-xl border-2 border-dashed border-outline-variant/50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary-container hover:bg-primary-container/5 transition-all text-on-surface-variant hover:text-primary-container"
                      >
                        <Plus className="w-6 h-6" />
                        <span className="text-[10px] font-bold uppercase">Añadir ID</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={verificationInputRef}
                    onChange={handleVerificationChange}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                </div>
              </div>

              {/* Redes Sociales */}
              <div className="flex flex-col gap-4 mt-2">
                <div className="flex items-center gap-2 pl-1">
                  <Globe className="w-4 h-4 text-primary-container" />
                  <h2 className="text-sm font-black text-on-surface uppercase tracking-widest">Redes Sociales</h2>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between pl-1">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Instagram</label>
                      {instagram && <span className="text-[10px] font-bold text-green-500 flex items-center gap-1 bg-green-500/10 px-2 py-0.5 rounded-full"><ShieldCheck className="w-3 h-3" /> Verificado</span>}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Instagram className={cn("h-5 w-5 transition-colors", instagram ? "text-green-500" : "text-error")} />
                      </div>
                      <input
                        type="text"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        className={cn(
                          "w-full bg-surface-container/50 border text-on-surface text-sm rounded-xl pl-11 pr-4 py-3.5 focus:outline-none transition-all",
                          instagram ? "border-green-500/30 focus:border-green-500 focus:ring-1 focus:ring-green-500" : "border-error/30 focus:border-error focus:ring-1 focus:ring-error"
                        )}
                        placeholder="@tu_usuario_ig"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between pl-1">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Facebook</label>
                      {facebook && <span className="text-[10px] font-bold text-green-500 flex items-center gap-1 bg-green-500/10 px-2 py-0.5 rounded-full"><ShieldCheck className="w-3 h-3" /> Verificado</span>}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Facebook className={cn("h-5 w-5 transition-colors", facebook ? "text-green-500" : "text-error")} />
                      </div>
                      <input
                        type="text"
                        value={facebook}
                        onChange={(e) => setFacebook(e.target.value)}
                        className={cn(
                          "w-full bg-surface-container/50 border text-on-surface text-sm rounded-xl pl-11 pr-4 py-3.5 focus:outline-none transition-all",
                          facebook ? "border-green-500/30 focus:border-green-500 focus:ring-1 focus:ring-green-500" : "border-error/30 focus:border-error focus:ring-1 focus:ring-error"
                        )}
                        placeholder="facebook.com/tu_perfil"
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-primary-container/5 border border-primary-container/20 rounded-xl p-3 flex items-start gap-3">
                  <ExternalLink className="w-4 h-4 text-primary-container shrink-0 mt-0.5" />
                  <p className="text-[10px] text-on-surface-variant leading-relaxed">
                    Vincular tus redes sociales ayuda a que los clientes confíen más en tu trabajo y puedan ver más de lo que haces fuera de la plataforma.
                  </p>
                </div>
              </div>

              {/* Online Status Section */}
              <div className="flex flex-col gap-3 mt-2">
                <div className="flex items-center justify-between pl-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Estado de Conexión</label>
                </div>
                <div className="bg-surface-container/50 border border-outline-variant/30 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shadow-inner",
                      isOnline ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                    )}>
                      <Wifi className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-on-surface">
                        {isOnline ? 'En línea' : 'Desconectado'}
                      </span>
                      <span className="text-[10px] text-on-surface-variant">
                        {isOnline ? 'Los clientes pueden ver que estás activo' : 'Aparecerás como no disponible'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOnline(!isOnline)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                      isOnline ? "bg-green-500" : "bg-surface-highest border border-outline-variant"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-surface-lowest transition-transform",
                        isOnline ? "translate-x-6" : "translate-x-1 shadow-sm"
                      )}
                    />
                  </button>
                </div>
              </div>

              {/* Portfolio Section */}
              <div className="flex flex-col gap-3 mt-2">
                <div className="flex items-center justify-between pl-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Portafolio de Trabajo</label>
                  <span className="text-[10px] font-bold text-on-surface-variant">{portfolioImages.length}/10 fotos</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {portfolioImages.map((img, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border border-outline-variant/30">
                      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${img})` }}></div>
                      <button
                        type="button"
                        onClick={() => removePortfolioImage(index)}
                        className="absolute top-1 right-1 bg-surface-lowest/80 text-error p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {portfolioImages.length < 10 && (
                    <div
                      onClick={handlePortfolioClick}
                      className="aspect-square rounded-xl border-2 border-dashed border-outline-variant/50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary-container hover:bg-primary-container/5 transition-all text-on-surface-variant hover:text-primary-container"
                    >
                      <ImageIcon className="w-6 h-6" />
                      <span className="text-[10px] font-bold uppercase">Añadir Foto</span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={portfolioInputRef}
                  onChange={handlePortfolioChange}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
              </div>

              {/* Horarios de Descanso */}
              <div className="flex flex-col gap-4 mt-4">
                <div className="flex items-center gap-2 pl-1">
                  <Clock className="w-4 h-4 text-primary-container" />
                  <h2 className="text-sm font-black text-on-surface uppercase tracking-widest">Horarios de Descanso</h2>
                </div>
                <div className="bg-surface-container/50 border border-outline-variant/30 rounded-2xl p-4 flex flex-col gap-3">
                  <p className="text-[10px] text-on-surface-variant font-bold leading-relaxed mb-1">
                    Define tus horas de descanso diarias. Durante este tiempo, no aparecerás disponible para nuevas solicitudes inmediatas.
                  </p>
                  {breakTimes.map((bt, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 py-2 border-b border-outline-variant/10 last:border-0">
                      <div className="flex items-center gap-3 min-w-[100px]">
                        <button
                          type="button"
                          onClick={() => {
                            const newBT = [...breakTimes];
                            newBT[idx].enabled = !newBT[idx].enabled;
                            setBreakTimes(newBT);
                          }}
                          className={cn(
                            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
                            bt.enabled ? "bg-primary-container" : "bg-surface-highest border border-outline-variant"
                          )}
                        >
                          <span className={cn(
                            "inline-block h-3 w-3 transform rounded-full bg-surface-lowest transition-transform",
                            bt.enabled ? "translate-x-5" : "translate-x-1"
                          )} />
                        </button>
                        <span className="text-xs font-bold text-on-surface">{bt.day}</span>
                      </div>

                      {bt.enabled && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
                          <input
                            type="time"
                            value={bt.start}
                            onChange={(e) => {
                              const newBT = [...breakTimes];
                              newBT[idx].start = e.target.value;
                              setBreakTimes(newBT);
                            }}
                            className="bg-surface-lowest border border-outline-variant/30 text-[10px] font-bold text-on-surface rounded-lg px-2 py-1 focus:outline-none focus:border-primary-container"
                          />
                          <span className="text-[10px] text-on-surface-variant">a</span>
                          <input
                            type="time"
                            value={bt.end}
                            onChange={(e) => {
                              const newBT = [...breakTimes];
                              newBT[idx].end = e.target.value;
                              setBreakTimes(newBT);
                            }}
                            className="bg-surface-lowest border border-outline-variant/30 text-[10px] font-bold text-on-surface rounded-lg px-2 py-1 focus:outline-none focus:border-primary-container"
                          />
                        </div>
                      )}
                      {!bt.enabled && (
                        <span className="text-[10px] text-on-surface-variant italic">Sin descanso</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full bg-primary-container hover:bg-primary text-surface-lowest font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all active:scale-[0.98]"
          >
            <Save className="w-5 h-5" />
            Guardar Cambios
          </button>

          <div className="mt-8 pt-8 border-t border-error/50 shadow-[0_-4px_15px_-4px_rgba(239,68,68,0.4)] flex flex-col gap-4 items-center">
            <h3 className="text-xs font-black text-error uppercase tracking-[0.2em] text-center drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">Zona de Peligro</h3>
            <button
              type="button"
              onClick={() => { signOut(auth); navigate('/'); }}
              className="w-full bg-red-600/20 border-2 border-red-500 text-red-500 font-black py-4 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,0,0,0.4)] hover:shadow-[0_0_30px_rgba(255,0,0,0.8)] uppercase tracking-[0.1em]"
            >
              <LogOut className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              Cerrar Sesión
            </button>
            <p className="text-[10px] text-on-surface-variant text-center px-4">
              Al cerrar sesión, saldrás de tu cuenta de forma segura.
            </p>
          </div>
        </form>
      </div>

      {/* Services Menu Modal */}
      {isServicesMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-surface-lowest/95 backdrop-blur-3xl animate-in slide-in-from-bottom-full duration-300">
          <div className="sticky top-0 z-10 bg-surface-lowest/90 backdrop-blur-xl border-b border-outline-variant/30 px-5 pt-12 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center border border-primary-container/30">
                <Grid className="w-5 h-5 text-primary-container" />
              </div>
              <h2 className="text-base font-black text-on-surface uppercase tracking-normal whitespace-nowrap">Catálogo de Servicios</h2>
            </div>
            <button
              onClick={() => setIsServicesMenuOpen(false)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-highest text-on-surface-variant transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 border-b border-outline-variant/30 bg-surface-lowest/50">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Buscar en el catálogo..."
                value={menuSearchTerm}
                onChange={(e) => setMenuSearchTerm(e.target.value)}
                className="w-full bg-surface-container/50 border border-outline-variant/50 text-on-surface text-sm rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 pb-24">
            <div className="flex flex-col gap-3">
              {serviceCategories.map((category, index) => {
                const filteredServices = category.services.filter(s =>
                  s.toLowerCase().includes(menuSearchTerm.toLowerCase())
                );

                if (menuSearchTerm && filteredServices.length === 0) return null;

                const isExpanded = expandedCategory === category.title || (menuSearchTerm && filteredServices.length > 0);

                return (
                  <div
                    key={index}
                    className={cn(
                      "bg-surface-container/30 border border-outline-variant/30 rounded-2xl overflow-hidden transition-all duration-300",
                      isExpanded && "border-primary-container/50 shadow-[0_0_20px_rgba(0,255,255,0.05)] bg-surface-container/50"
                    )}
                  >
                    <button
                      onClick={() => setExpandedCategory(isExpanded ? null : category.title)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-surface-lowest flex items-center justify-center text-2xl shadow-sm border border-outline-variant/20">
                          {category.icon}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-on-surface">{category.title}</h3>
                          <p className="text-xs text-on-surface-variant mt-0.5">{category.services.length} servicios</p>
                        </div>
                      </div>
                      <ChevronDown className={cn(
                        "w-5 h-5 text-on-surface-variant transition-transform duration-300",
                        isExpanded && "rotate-180 text-primary-container"
                      )} />
                    </button>

                    <div className={cn(
                      "grid transition-all duration-300 ease-in-out",
                      isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    )}>
                      <div className="overflow-hidden">
                        <div className="p-3 pt-0 grid grid-cols-1 gap-2">
                          {filteredServices.map((service, sIndex) => (
                            <button
                              key={sIndex}
                              onClick={() => {
                                setProfession(service);
                                setIsServicesMenuOpen(false);
                                setMenuSearchTerm('');
                              }}
                              className="w-full text-left px-4 py-3 rounded-xl text-sm text-on-surface hover:bg-primary-container/10 hover:text-primary-container transition-colors flex items-center justify-between group"
                            >
                              <span>{service}</span>
                              <ArrowLeft className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all rotate-180" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
