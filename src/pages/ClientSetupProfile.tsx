import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'motion/react';
import { MapPin, Phone, User, Loader2, ArrowRight, LocateFixed, CheckCircle2 } from 'lucide-react';
import { spanishSpeakingCountriesMenu } from '../constants/countries';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { cn } from '../lib/utils';

export default function ClientSetupProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [name, setName] = useState(user?.displayName || '');
  const [email] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [state, setState] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const handleCountryChange = (countryLabel: string) => {
    setLocation(countryLabel);
    setState('');
    setMunicipality('');
  };

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!user || !location || !state || !municipality) {
      setError('Por favor completa todos los campos de ubicación');
      return;
    }

    try {
      setLoading(true);
      await setDoc(doc(db, 'clientes', user.uid), {
        name,
        email,
        phone,
        country: location,
        state,
        municipality,
        latitude,
        longitude,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      navigate('/client/dashboard');
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, `clientes/${user.uid}`);
      setError("Error al guardar perfil.");
    } finally {
      setLoading(false);
    }
  };

  const authorizeAndProceed = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        handleSubmit();
      }, (error) => {
        console.error("Error getting location:", error);
        setError("No pudimos obtener tu ubicación.");
      });
    } else {
      setError("Geolocalización no soportada.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {step === 1 ? (
        <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="flex flex-col gap-4">
          <h1 className="text-2xl font-black mb-6 italic text-[#00FFFF]">Configura tu Perfil</h1>
          <input type="text" placeholder="Nombre completo" value={name} onChange={e => setName(e.target.value)} className="bg-white/5 p-4 rounded-2xl border border-white/10" required />
          <input type="email" value={email} className="bg-white/5 p-4 rounded-2xl border border-white/10 text-white/50" disabled />
          <PhoneInput country={'do'} value={phone} onChange={setPhone} containerClass="!bg-white/5" inputClass="!bg-white/5 !border-none !text-white" />

          <select value={location} onChange={(e) => handleCountryChange(e.target.value)} className="bg-white/5 p-4 rounded-2xl border border-white/10 text-white">
            <option value="">Selecciona País</option>
            {spanishSpeakingCountriesMenu.map(c => <option key={c.labelCountry} value={c.labelCountry}>{c.labelCountry}</option>)}
          </select>

          <select value={state} onChange={(e) => setState(e.target.value)} className="bg-white/5 p-4 rounded-2xl border border-white/10 text-white" disabled={!location}>
            <option value="">Selecciona Estado</option>
            {location && spanishSpeakingCountriesMenu.find(c => c.labelCountry === location)?.children.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
          </select>

          <select value={municipality} onChange={(e) => setMunicipality(e.target.value)} className="bg-white/5 p-4 rounded-2xl border border-white/10 text-white" disabled={!state}>
            <option value="">Selecciona Municipio</option>
            {state && spanishSpeakingCountriesMenu.find(c => c.labelCountry === location)?.children.find(s => s.name === state)?.children?.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
          </select>

          <button type="submit" className="bg-gradient-to-r from-[#00FFFF] to-[#B026FF] p-4 rounded-2xl font-black italic tracking-widest uppercase mt-4">
            Siguiente
          </button>
        </form>
      ) : (
        <div className="flex flex-col gap-6 items-center justify-center min-h-[80vh]">
          <h1 className="text-2xl font-black mb-6 italic text-[#00FFFF] text-center">Autorización de Seguridad</h1>
          <p className="text-white/60 text-center">PinPro necesita tu ubicación para conectarte con profesionales cercanos.</p>
          <button onClick={authorizeAndProceed} className="bg-gradient-to-r from-[#00FFFF] to-[#B026FF] p-4 rounded-2xl font-black italic tracking-widest uppercase w-full">
            {loading ? <Loader2 className="animate-spin" /> : "AUTORIZAR Y TERMINAR"}
          </button>
        </div>
      )}
    </div>
  );
}
