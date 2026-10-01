import React, { useState } from 'react';
import { X, MapPin, Mic, Camera } from 'lucide-react';

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (permissions: { location: boolean; mic: boolean; camera: boolean }) => void;
}

export default function PermissionsModal({ isOpen, onClose, onApply }: PermissionsModalProps) {
  const [location, setLocation] = useState(false);
  const [mic, setMic] = useState(false);
  const [camera, setCamera] = useState(false);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply({ location, mic, camera });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div
        className="w-full max-w-md bg-[#1a1f26] border border-[#00f2ff]/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(0,242,255,0.15)] relative animate-in fade-in zoom-in duration-200"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-bold text-white mb-2">Solicitud de Acceso</h2>
        <p className="text-sm text-white/70 mb-6">
          PinPro solicita acceso a los siguientes permisos para brindarte la mejor experiencia:
        </p>

        <div className="space-y-3 mb-8">
          <PermissionToggle
            icon={<MapPin className="w-5 h-5 text-[#00f2ff]" />}
            label="Ubicación Geográfica"
            enabled={location}
            onChange={setLocation}
          />
          <PermissionToggle
            icon={<Mic className="w-5 h-5 text-[#bc13fe]" />}
            label="Micrófono"
            enabled={mic}
            onChange={setMic}
          />
          <PermissionToggle
            icon={<Camera className="w-5 h-5 text-[#0072ff]" />}
            label="Cámara"
            enabled={camera}
            onChange={setCamera}
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleApply}
            className="px-6 py-2 rounded-xl text-black font-bold tracking-wider uppercase text-sm transition-transform hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(90deg, #00f2ff, #0072ff)' }}
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}

function PermissionToggle({ icon, label, enabled, onChange }: { icon: React.ReactNode, label: string, enabled: boolean, onChange: (val: boolean) => void }) {
  return (
    <div
      className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-black/30 cursor-pointer hover:bg-black/50 transition-colors"
      onClick={() => onChange(!enabled)}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/5 rounded-lg">
          {icon}
        </div>
        <span className="text-white font-medium">{label}</span>
      </div>

      {/* Toggle Switch */}
      <div
        className={`w-12 h-6 rounded-full p-1 transition-all duration-300 relative ${
          enabled ? 'bg-gradient-to-r from-[#00f2ff] to-[#0072ff]' : 'bg-gray-600'
        }`}
      >
        <div
          className={`bg-white w-4 h-4 rounded-full shadow-md transition-all duration-300 transform ${
            enabled ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </div>
    </div>
  );
}
