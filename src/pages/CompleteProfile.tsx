import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { User, Phone, Mail, ArrowRight, Loader2, CheckCircle2, ShieldCheck, MapPin, Briefcase, Globe } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { spanishSpeakingCountriesMenu } from '../constants/countries';

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, handleNavigateWithTelemetry } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Cliente' | 'Profesional' | 'Agente'>('Cliente');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const [profession, setProfession] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [adminType1, setAdminType1] = useState('Estado');
  const [adminType2, setAdminType2] = useState('Municipio');

  const handleCountryChange = (countryLabel: string) => {
    setCountry(countryLabel);
    setState('');
    setMunicipality('');
    const countryData = spanishSpeakingCountriesMenu.find(c => c.labelCountry === countryLabel);
    if (countryData) {
      setAdminType1(countryData.adminType1);
      setAdminType2(countryData.adminType2);
    }
  };

  useEffect(() => {
    // AuthGuard handles security redirections.
    // We only need to load initial user data here.
    if (user) {
      setName(user.displayName || '');
      setEmail(user.email || '');

      const savedRole = localStorage.getItem('pending_role') as 'Cliente' | 'Profesional' | 'Agente';
      if (savedRole) {
        setRole(savedRole);
      }
    }
  }, [user]);

  const validateForm = () => {
    if (!name.trim()) {
      setError('Por favor ingresa tu nombre completo');
      return false;
    }
    if (name.trim().length < 3) {
      setError('El nombre debe tener al menos 3 caracteres');
      return false;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Por favor ingresa un correo electrónico válido');
      return false;
    }
    if (!phone || phone.length < 10) {
      setError('Por favor ingresa un número de teléfono válido (WhatsApp)');
      return false;
    }
    if (role === 'Profesional' && !profession) {
      setError('Por favor selecciona tu profesión');
      return false;
    }
    if (!country) {
      setError('Por favor selecciona tu país');
      return false;
    }
    if (!state) {
      setError(`Por favor selecciona tu ${adminType1}`);
      return false;
    }
    if (!municipality) {
      setError(`Por favor selecciona tu ${adminType2}`);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    try {
      setLoading(true);
      let collectionName = 'clientes';
      if (role === 'Profesional') collectionName = 'profesionales';
      if (role === 'Agente') collectionName = 'agentes';

      const docRef = doc(db, collectionName, user!.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        const userProfile: any = {
          uid: user!.uid,
          name: name.trim(),
          role: role,
          photoUrl: user!.photoURL || '',
          country: country,
          state: state,
          municipality: municipality,
          status: 'Activo',
          verificationStatus: 'none',
          phone: phone.startsWith('+') ? phone : `+${phone}`,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          certification: {
            isCertified: false,
            status: 'none',
            documentType: '',
            documentNumber: '',
            documentImageUrl: '',
            submittedAt: null,
            verifiedAt: null,
            rejectionReason: null
          },
          activity: {
            pinsCreated: 0,
            jobsCompleted: 0,
            rating: 0
          },
        };

        if (role === 'Profesional') {
          userProfile.profession = profession;
          userProfile.baseScore = 50;
          userProfile.finalScore = 50;
          userProfile.isOnline = true;
        }

        await setDoc(docRef, userProfile);
      } else {
        // Just update allowed fields if necessary
        await setDoc(docRef, {
          name: name.trim(),
          country: country,
          state: state,
          municipality: municipality,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      // Separate private data
      await setDoc(doc(db, collectionName, user!.uid, 'private', 'data'), {
        email: email.trim(),
        phone: phone,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setIsSuccess(true);
      localStorage.removeItem('pending_role');

      setTimeout(() => {
        if (role === 'Profesional') {
          handleNavigateWithTelemetry(window.location.pathname, '/pro/dashboard', navigate);
        } else if (role === 'Agente') {
          handleNavigateWithTelemetry(window.location.pathname, '/home', navigate);
        } else {
          handleNavigateWithTelemetry(window.location.pathname, '/home', navigate);
        }
      }, 2000);

    } catch (err: any) {
      console.error("Error completing profile:", err);
      setError("Hubo un error al guardar tu perfil. Inténtalo de nuevo.");
      handleFirestoreError(err, OperationType.WRITE, `profiles/${user?.uid}`);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-black px-6 text-center">
        <motion.div
           initial={{ scale: 0.8, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="flex flex-col items-center gap-6"
        >
          {isSuccess ? (
            <>
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">¡Perfil Listos!</h2>
                <p className="text-white/60 text-sm">Bienvenido a la comunidad PinPro</p>
              </div>
            </>
          ) : (
            <>
              <Loader2 className="w-12 h-12 text-[#00FFFF] animate-spin" />
              <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-xs">Cargando Experiencia...</p>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-black relative max-w-md mx-auto border-x border-white/10 overflow-hidden">
      {/* Visual Accents */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#B026FF]/10 blur-[100px] rounded-full"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#00FFFF]/10 blur-[100px] rounded-full"></div>

      <div className="relative z-10 flex-1 flex flex-col px-6 pt-12 pb-8">
        <div className="mb-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2">
              Completa tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFFF] to-[#B026FF]">Perfil</span>
            </h1>
            <p className="text-white/50 text-sm font-medium">Solo un paso más para entrar al marketplace</p>
          </motion.div>
        </div>

        {/* Benefits Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 p-4 bg-white/5 border border-white/5 rounded-3xl flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-[#00FFFF]/20 to-[#B026FF]/20 rounded-2xl flex items-center justify-center border border-white/10 shrink-0">
            {role === 'Cliente' ? <CheckCircle2 className="w-6 h-6 text-[#00FFFF]" /> : <Briefcase className="w-6 h-6 text-[#B026FF]" />}
          </div>
          <div>
            <h4 className="text-white text-xs font-black uppercase tracking-widest leading-none mb-1">
              {role === 'Cliente' ? 'Acceso Client Elite' : 'Perfil Profesional Pro'}
            </h4>
            <p className="text-white/40 text-[10px] font-medium leading-relaxed">
              {role === 'Cliente'
                ? 'Conecta con los mejores profesionales verificados en tiempo real.'
                : 'Muestra tu talento y recibe solicitudes de trabajo instantáneas.'}
            </p>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-red-400 text-xs font-bold uppercase tracking-wide leading-tight">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-6">
          {/* Role Selection (Condensed) */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-white/5 border border-white/10 rounded-[24px]">
            <button
              type="button"
              onClick={() => setRole('Cliente')}
              className={`py-3 px-2 rounded-[20px] text-[9px] font-black uppercase tracking-widest transition-all ${
                role === 'Cliente'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              Cliente
            </button>
            <button
              type="button"
              onClick={() => setRole('Profesional')}
              className={`py-3 px-2 rounded-[20px] text-[9px] font-black uppercase tracking-widest transition-all ${
                role === 'Profesional'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              Pro
            </button>
            <button
              type="button"
              onClick={() => setRole('Agente')}
              className={`py-3 px-2 rounded-[20px] text-[9px] font-black uppercase tracking-widest transition-all ${
                role === 'Agente'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              Agente
            </button>
          </div>

          <div className="space-y-4">
            {/* Name Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-4">Nombre Completo</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-focus-within:border-[#00FFFF]/50 transition-all">
                  <User className="w-5 h-5 text-white/30 group-focus-within:text-[#00FFFF]" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full bg-white/5 border border-white/10 text-white rounded-[24px] py-4 pl-16 pr-6 focus:outline-none focus:border-[#00FFFF] focus:bg-white/10 transition-all font-medium"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-4">Tu mejor Email</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-focus-within:border-[#00FFFF]/50 transition-all">
                  <Mail className="w-5 h-5 text-white/30 group-focus-within:text-[#00FFFF]" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-white/5 border border-white/10 text-white rounded-[24px] py-4 pl-16 pr-6 focus:outline-none focus:border-[#00FFFF] focus:bg-white/10 transition-all font-medium"
                />
              </div>
            </div>

            {/* Phone Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-4">WhatsApp (Requerido)</label>
              <div className="relative group">
                <style>{`
                  .profile-phone-input .form-control {
                    width: 100% !important;
                    background: rgba(255, 255, 255, 0.05) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    border-radius: 24px !important;
                    height: 58px !important;
                    color: white !important;
                    font-size: 16px !important;
                    padding-left: 64px !important;
                    transition: all 0.3s ease !important;
                  }
                  .profile-phone-input .form-control:focus {
                    border-color: #00FFFF !important;
                    background: rgba(255, 255, 255, 0.1) !important;
                  }
                  .profile-phone-input .flag-dropdown {
                    background: transparent !important;
                    border: none !important;
                    padding-left: 12px !important;
                  }
                  .profile-phone-input .selected-flag {
                    background: transparent !important;
                    width: 50px !important;
                  }
                `}</style>
                <div className="profile-phone-input">
                  <PhoneInput
                    country={'do'}
                    value={phone}
                    onChange={(value: string, data: any) => {
                      setPhone(value);
                      if (data && data.countryCode) {
                        const countryMap: Record<string, string> = {
                          'do': 'República Dominicana',
                          've': 'Venezuela',
                          'co': 'Colombia',
                          'ar': 'Argentina',
                          'mx': 'México',
                          'es': 'España',
                          'pe': 'Perú',
                          'cl': 'Chile',
                          'ec': 'Ecuador',
                          'bo': 'Bolivia',
                          'uy': 'Uruguay',
                          'py': 'Paraguay',
                          'pa': 'Panamá',
                          'cr': 'Costa Rica',
                          'ni': 'Nicaragua',
                          'hn': 'Honduras',
                          'sv': 'El Salvador',
                          'gt': 'Guatemala',
                          'cu': 'Cuba'
                        };
                        const countryName = countryMap[data.countryCode.toLowerCase()];
                        if (countryName) {
                          handleCountryChange(countryName);
                        }
                      }
                    }}
                    placeholder="WhatsApp"
                    buttonClass="!bg-transparent !border-none"
                  />
                </div>
              </div>
            </div>

            {/* Profession Selection for Professionals */}
            {role === 'Profesional' && (
              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-4">Tu Profesión / Especialidad</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-focus-within:border-[#B026FF]/50 transition-all">
                    <Briefcase className="w-5 h-5 text-white/30 group-focus-within:text-[#B026FF]" />
                  </div>
                  <select
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-[24px] py-4 pl-16 pr-6 focus:outline-none focus:border-[#B026FF] focus:bg-white/10 transition-all font-medium appearance-none"
                  >
                    <option value="" className="bg-[#1a1a1a]">Selecciona tu profesión</option>
                    <option value="Electricista" className="bg-[#1a1a1a]">Electricista</option>
                    <option value="Plomero" className="bg-[#1a1a1a]">Plomero</option>
                    <option value="Carpintero" className="bg-[#1a1a1a]">Carpintero</option>
                    <option value="Limpieza" className="bg-[#1a1a1a]">Servicios de Limpieza</option>
                    <option value="Marketing" className="bg-[#1a1a1a]">Marketing Digital</option>
                    <option value="Programador" className="bg-[#1a1a1a]">Programador / IA</option>
                    <option value="Asesor" className="bg-[#1a1a1a]">Asesor de Startups</option>
                    <option value="Veterinario" className="bg-[#1a1a1a]">Veterinario / Mascotas</option>
                    {/* Add more common ones */}
                  </select>
                </div>
              </div>
            )}

            {/* Location Selection */}
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-4">País</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-focus-within:border-[#00FFFF]/50 transition-all">
                    <Globe className="w-5 h-5 text-white/30 group-focus-within:text-[#00FFFF]" />
                  </div>
                  <select
                    value={country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-[24px] py-4 pl-16 pr-6 focus:outline-none focus:border-[#00FFFF] focus:bg-white/10 transition-all font-medium appearance-none"
                  >
                    <option value="" className="bg-[#1a1a1a]">Seleccion País</option>
                    {spanishSpeakingCountriesMenu.map(c => (
                      <option key={c.country} value={c.labelCountry} className="bg-[#1a1a1a]">
                        {c.labelCountry}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-4 capitalize">{adminType1}</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    disabled={!country}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-[24px] py-4 px-4 focus:outline-none focus:border-[#00FFFF] focus:bg-white/10 transition-all font-medium appearance-none disabled:opacity-50 text-sm"
                  >
                    <option value="" className="bg-[#1a1a1a]">Seleccionar</option>
                    {country && spanishSpeakingCountriesMenu.find(c => c.labelCountry === country)?.children.map(s => (
                      <option key={s.name} value={s.name} className="bg-[#1a1a1a]">{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-4 capitalize">{adminType2}</label>
                  <select
                    value={municipality}
                    onChange={(e) => setMunicipality(e.target.value)}
                    disabled={!state}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-[24px] py-4 px-4 focus:outline-none focus:border-[#00FFFF] focus:bg-white/10 transition-all font-medium appearance-none disabled:opacity-50 text-sm"
                  >
                    <option value="" className="bg-[#1a1a1a]">Seleccionar</option>
                    {state && spanishSpeakingCountriesMenu.find(c => c.labelCountry === country)?.children.find(s => s.name === state)?.children?.map(m => (
                      <option key={m.name} value={m.name} className="bg-[#1a1a1a]">{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-6">
            <div className="flex items-start gap-3 px-4">
              <ShieldCheck className="w-5 h-5 text-[#00FFFF] shrink-0" />
              <p className="text-[9px] text-white/30 font-medium leading-relaxed">
                Tus datos están seguros. Al hacer clic en continuar, aceptas nuestros términos de servicio y política de privacidad.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#00FFFF] to-[#B026FF] hover:shadow-[0_0_25px_rgba(0,255,255,0.4)] text-white font-black py-5 rounded-[24px] flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 group"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <span className="uppercase tracking-[0.2em]">Finalizar Registro</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="pb-8 text-center text-white/10 text-[8px] font-bold uppercase tracking-[0.5em]">
        Integridad Digital Protegida
      </div>
    </div>
  );
}
