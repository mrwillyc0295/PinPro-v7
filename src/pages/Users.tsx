import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, MessageSquare, Star, ArrowLeft, Users as UsersIcon, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Helmet } from 'react-helmet-async';

const COUNTRIES = [
  { id: 'all', name: 'Todos', flag: '🌎' },
  { id: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { id: 'CL', name: 'Chile', flag: '🇨🇱' },
  { id: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { id: 'ES', name: 'España', flag: '🇪🇸' },
  { id: 'MX', name: 'México', flag: '🇲🇽' },
  { id: 'PE', name: 'Perú', flag: '🇵🇪' },
  { id: 'US', name: 'USA', flag: '🇺🇸' },
  { id: 'VE', name: 'Venezuela', flag: '🇻🇪' },
];

export default function Users() {
  const navigate = useNavigate();
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [pros, setPros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPros();
  }, [selectedCountry]);

  const fetchPros = async () => {
    setLoading(true);
    try {
      let q;
      const prosRef = collection(db, 'profesionales');

      if (selectedCountry === 'all') {
        q = query(prosRef, limit(30));
      } else {
        q = query(prosRef, where('country', '==', selectedCountry), limit(30));
      }

      const querySnapshot = await getDocs(q);
      const fetchedPros = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...(data as any)
        };
      });
      setPros(fetchedPros);
    } catch (error) {
      console.error('Error fetching professionals:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPros = pros.filter(pro =>
    pro.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pro.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans selection:bg-[#00FFFF] selection:text-black pb-20">
      <Helmet>
        <title>Explorar Usuarios | PinPro</title>
      </Helmet>

      {/* Header Fijo */}
      <div className="sticky top-0 z-[100] bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10"></div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Directorio</h1>
            <p className="text-[10px] font-bold text-[#00FFFF] uppercase tracking-widest">Profesionales Globales</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o especialidad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00FFFF]/50 transition-all"
          />
        </div>

        {/* Country Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
          {COUNTRIES.map((country) => (
            <button
              key={country.id}
              onClick={() => setSelectedCountry(country.id)}
              className={cn(
                "whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                selectedCountry === country.id
                  ? "bg-[#00FFFF] text-black shadow-[0_0_15px_rgba(0,255,255,0.3)]"
                  : "bg-white/5 text-zinc-400 hover:bg-white/10"
              )}
            >
              <span>{country.flag}</span>
              {country.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <div className="w-10 h-10 border-2 border-[#00FFFF] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-xs font-black uppercase tracking-widest">Conectando con la red...</p>
          </div>
        ) : filteredPros.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredPros.map((pro, idx) => (
              <motion.div
                key={pro.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-zinc-900/50 border border-white/5 rounded-[32px] p-4 flex items-center gap-4 group hover:bg-zinc-900 transition-all border-b-2 border-b-transparent hover:border-b-[#00FFFF]/30 hover:shadow-2xl"
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                    <img
                      src={pro.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${pro.id}`}
                      alt={pro.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0a0a0a]",
                    pro.isOnline ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-zinc-500"
                  )} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-sm truncate">{pro.name}</h3>
                    <div className="flex items-center gap-1 bg-[#00FFFF]/10 px-1.5 py-0.5 rounded text-[#00FFFF] text-[8px] font-black uppercase">
                      <Star className="w-2 h-2 fill-[#00FFFF]" />
                      {pro.rating || '5.0'}
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest truncate">{pro.category || 'Profesional'}</p>
                  <div className="flex items-center gap-1 mt-1 text-zinc-600 text-[9px] font-medium">
                    <MapPin className="w-2.5 h-2.5" />
                    {pro.ciudad || 'Local'}, {pro.country || 'Global'}
                  </div>
                </div>

                {/* Action */}
                <button
                  onClick={() => navigate(`/chat/${pro.id}`, { state: { recipientName: pro.name } })}
                  className="w-10 h-10 bg-white/5 hover:bg-[#00FFFF] hover:text-black rounded-2xl flex items-center justify-center transition-all active:scale-90"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-white/10">
              <UsersIcon className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-lg font-bold mb-1">No hay perfiles aquí</h3>
            <p className="text-sm text-zinc-500 font-medium">No encontramos profesionales en este país en este momento.</p>
          </div>
        )}
      </div>

      {/* Bottom Nav Helper */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-[#00FFFF] text-black rounded-2xl flex items-center gap-3 shadow-[0_10px_25px_rgba(0,255,255,0.4)] pointer-events-none opacity-0 lg:opacity-100 transition-opacity">
        <Globe className="w-4 h-4 animate-spin-slow" />
        <span className="text-[10px] font-black uppercase tracking-widest">PinPro Global Network</span>
      </div>
    </div>
  );
}
