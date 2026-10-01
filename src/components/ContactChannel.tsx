import React from 'react';
import { Phone, MessageCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils'; // Assuming this exists based on common project practice

interface ContactChannelProps {
  clientData: {
    name: string;
    phone: string;
  };
  onOpenChat: () => void;
  onTriggerEmergency: () => void;
}

export const ContactChannel: React.FC<ContactChannelProps> = ({ clientData, onOpenChat, onTriggerEmergency }) => {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
      <h3 className="text-white font-bold mb-4">Contacto: {clientData.name}</h3>
      <div className="grid grid-cols-1 gap-3">
        <a href={`tel:${clientData.phone}`} className="flex items-center justify-center gap-2 bg-white/10 text-white font-bold py-3 rounded-2xl hover:bg-white/20 transition">
          <Phone size={20} /> Llamar
        </a>

        <button onClick={onOpenChat} className="flex items-center justify-center gap-2 bg-white/10 text-white font-bold py-3 rounded-2xl hover:bg-white/20 transition">
          <MessageCircle size={20} /> Chat
        </button>

        <button
          onClick={onTriggerEmergency}
          className="bg-[#ff0055] text-white font-black py-3 rounded-2xl flex items-center justify-center gap-2 animate-pulse shadow-[0_0_20px_#ff0055] hover:bg-[#ff1a66] transition"
        >
           <AlertTriangle size={20} /> EMERGENCIA
        </button>
      </div>
    </div>
  );
};
