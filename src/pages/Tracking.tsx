import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Truck, Star, MessageSquare, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { opcionesMapa } from '../lib/mapOptions';

// Fix Leaflet marker icon issue
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const blueIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const redIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

import { ChatOverlay, CallUI } from '../components/RealTimeComponents';
import { useSocket } from '../contexts/SocketContext';
import { Bell, X as CloseIcon } from 'lucide-react';

export default function Tracking() {
  const navigate = useNavigate();
  const { requestPushPermission } = useSocket();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [showPushBanner, setShowPushBanner] = useState(false);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      setShowPushBanner(true);
    }
  }, []);

  const handleEnablePush = async () => {
    const granted = await requestPushPermission();
    if (granted) setShowPushBanner(false);
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-black text-slate-100 font-sans">
      <ChatOverlay
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        orderId="demo-order-123"
        recipientId="demo-pro-456"
        recipientName="Juan Pérez"
      />
      <CallUI
        isOpen={isCallOpen}
        onClose={() => setIsCallOpen(false)}
        recipientId="demo-pro-456"
        recipientName="Juan Pérez"
      />

      {/* Push Notification Banner */}
      {showPushBanner && (
        <div className="absolute top-28 left-4 right-4 z-[100] bg-black/80 backdrop-blur-md border border-[#00FFFF]/30 rounded-2xl p-4 shadow-[0_0_20px_rgba(0,255,255,0.1)] flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="w-10 h-10 rounded-full bg-[#00FFFF]/10 flex items-center justify-center text-[#00FFFF]">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex-1">
            <h4 className="text-white text-sm font-bold tracking-tight">Notificaciones</h4>
            <p className="text-white/50 text-[10px] leading-tight">Actívalas para recibir alertas de chat y llamadas incluso si cierras la app.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPushBanner(false)}
              className="p-2 text-white/30 hover:text-white"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleEnablePush}
              className="bg-[#00FFFF] text-black px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(0,255,255,0.4)]"
            >
              Activar
            </button>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 pt-12 pointer-events-none">
        <div className="w-10 h-10"></div>
        <div className="pointer-events-auto rounded-full bg-black/80 backdrop-blur-md px-4 py-2 border border-[#00FFFF]/30 shadow-[0_0_10px_rgba(0,255,255,0.1)] hover:border-[#00FFFF]/60 transition-colors animate-[blink-neon_0.8s_infinite_alternate]">
          <span className="text-xs font-bold text-[#00FFFF] uppercase tracking-wider flex items-center gap-2">
            <span className="text-sm font-bold animate-pulse">!</span>
            Soporte
          </span>
        </div>
      </div>

      {/* Map Area */}
      <div className="relative w-full h-[55vh] bg-black shrink-0 overflow-hidden z-0">
        <MapContainer
          center={[opcionesMapa.center.lat, opcionesMapa.center.lng]}
          zoom={opcionesMapa.zoom}
          zoomControl={false}
          className="w-full h-full"
          style={{ background: '#0a0a0a' }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <Polyline
            positions={[
              [opcionesMapa.center.lat, opcionesMapa.center.lng],
              [opcionesMapa.center.lat + 0.0074, opcionesMapa.center.lng + 0.0132]
            ]}
            pathOptions={{
              color: "#00FFFF",
              weight: 4,
              opacity: 1.0
            }}
          />
          <Marker
            position={[opcionesMapa.center.lat, opcionesMapa.center.lng]}
            icon={blueIcon}
          />
          <Marker
            position={[opcionesMapa.center.lat + 0.0074, opcionesMapa.center.lng + 0.0132]}
            icon={redIcon}
          />
        </MapContainer>
      </div>

      {/* Bottom Panel */}
      <div className="relative -mt-6 flex flex-1 flex-col rounded-t-3xl z-10 overflow-hidden" style={{ background: 'rgba(5, 5, 10, 0.95)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(0, 255, 255, 0.3)', boxShadow: '0 -10px 40px rgba(0, 255, 255, 0.05)' }}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-12 bg-[#00FFFF]/30 rounded-full"></div>
        </div>

        <div className="flex flex-col gap-0 px-6 pt-2 pb-6 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-6 mt-2">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight drop-shadow-[0_0_5px_rgba(0,255,255,0.3)]">En camino</h2>
              <p className="text-sm font-medium text-[#00FFFF] flex items-center gap-2 mt-1 drop-shadow-[0_0_8px_rgba(0,255,255,0.6)] animate-pulse">
                <Clock className="w-5 h-5" />
                Llegada en 12 min
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-950/40 text-[#00FFFF] border border-[#00FFFF]/50 shadow-[0_0_15px_rgba(0,255,255,0.3)]">
              <Truck className="w-6 h-6 animate-pulse" />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8 relative">
            <div className="flex justify-between mb-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <span className="text-[#00FFFF] drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]">Confirmado</span>
              <span className="text-[#00FFFF] drop-shadow-[0_0_5px_rgba(0,255,255,0.8)] animate-pulse">En camino</span>
              <span className="text-slate-500">En sitio</span>
              <span className="text-slate-500">Fin</span>
            </div>
            <div className="relative h-1 w-full bg-slate-900/80 rounded-full overflow-hidden border border-slate-800">
              <div className="absolute left-0 top-0 h-full w-[45%] bg-[#00FFFF] rounded-full shadow-[0_0_10px_rgba(0,255,255,0.8)]">
                <div className="absolute right-0 top-0 h-full w-4 bg-white blur-[2px] opacity-70"></div>
              </div>
            </div>
            {/* Nodes */}
            <div className="absolute top-[23px] left-0 w-2.5 h-2.5 bg-black border-2 border-[#00FFFF] rounded-full shadow-[0_0_10px_rgba(0,255,255,1)] z-10"></div>
            <div className="absolute top-[23px] left-1/3 -translate-x-1.5 w-3 h-3 bg-[#00FFFF] rounded-full shadow-[0_0_15px_rgba(0,255,255,1)] z-20 animate-[blink_1s_cubic-bezier(0.4,0,0.6,1)_infinite]"></div>
            <div className="absolute top-[23px] left-2/3 w-2.5 h-2.5 bg-slate-900 border border-slate-700 rounded-full z-10"></div>
            <div className="absolute top-[23px] right-0 w-2.5 h-2.5 bg-slate-900 border border-slate-700 rounded-full z-10"></div>
          </div>

          {/* Professional Info */}
          <div className="flex items-center gap-4 bg-slate-900/40 border border-[#00FFFF]/20 rounded-xl p-4 mb-6 relative shadow-[0_0_15px_rgba(0,255,255,0.05)]">
            <div className="relative">
              <img alt="Juan Pérez" className="relative h-14 w-14 rounded-full object-cover border-2 border-[#00FFFF]/50 shadow-[0_0_10px_rgba(0,255,255,0.2)]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuCi5vAcqmNYfEbfbaF4cE7r7I0QHxQ-ExyiRZweJLitqnDjEKUWqV67KNQRWpH3xu8SiXJVCS1hIYz20LQO6VHOB_XkL208Y02HNWoIiJ2NYFwDaNvLPYE82PtIwDMrxF6AZ4vdAzzr6bjDADskvj0z40W3LFY0DZ8eClxOzGP8sXh17oZzsGhKyugry9_p_p7idva-bmUPgUnr327jPD47qdiI961mf1Zfjv4e-8q2whmSE30A33Wkd2OV31519kOWsb_K3QYVmI"/>
              <div className="absolute -bottom-1 -right-1 flex items-center justify-center bg-black text-white rounded-full px-1.5 py-0.5 shadow-sm border border-[#00FFFF]/40">
                <Star className="w-2.5 h-2.5 text-[#00FFFF] mr-0.5 fill-current" />
                <span className="text-[10px] font-bold text-[#00FFFF]">4.9</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="truncate text-lg font-bold text-white drop-shadow-[0_0_2px_rgba(0,255,255,0.3)]">Juan Pérez</h3>
              <p className="truncate text-xs text-slate-400">Plomería Experta • ID: <span className="text-[#00FFFF]">#8291</span></p>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-300">
                <span className="px-2 py-0.5 rounded bg-black/50 text-[#00FFFF] border border-[#00FFFF]/30 text-[10px] uppercase font-bold tracking-wide shadow-[0_0_5px_rgba(0,255,255,0.1)]">Ford Transit</span>
                <span className="text-[#00FFFF]/50">|</span>
                <span className="font-mono text-white drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]">ABC 123</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-4 mt-auto">
            <button
              onClick={() => setIsChatOpen(true)}
              className="group flex items-center justify-center gap-2 bg-transparent border border-[#00FFFF] text-[#00FFFF] py-3.5 rounded-xl text-sm font-bold hover:bg-[#00FFFF] hover:text-black transition-all duration-300 shadow-[0_0_10px_rgba(0,255,255,0.2)] hover:shadow-[0_0_20px_rgba(0,255,255,0.6)]"
            >
              <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
              CHAT
            </button>
            <button
              onClick={() => setIsCallOpen(true)}
              className="group flex items-center justify-center gap-2 bg-[#00FFFF] py-3.5 rounded-xl text-sm font-bold text-black shadow-[0_0_20px_rgba(0,255,255,0.4)] hover:shadow-[0_0_35px_rgba(0,255,255,0.7)] hover:bg-white transition-all duration-300"
            >
              <Phone className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              LLAMAR
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-neon {
          0% { box-shadow: 0 0 0 0 rgba(0, 255, 255, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(0, 255, 255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 255, 255, 0); }
        }
        @keyframes blink-neon {
          from { border-color: rgba(0, 255, 255, 0.2); box-shadow: 0 0 5px rgba(0, 255, 255, 0.2); }
          to { border-color: rgba(0, 255, 255, 1); box-shadow: 0 0 15px rgba(0, 255, 255, 0.8); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; box-shadow: 0 0 10px rgba(0, 255, 255, 0.8); }
          50% { opacity: 0.5; box-shadow: 0 0 0px rgba(0, 255, 255, 0); }
        }
      `}</style>
    </div>
  );
}
