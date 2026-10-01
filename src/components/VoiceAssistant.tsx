import React, { useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '../lib/utils';

interface VoiceAssistantProps {
  userLocation: { lat: number; lng: number } | null;
  findProfessionals: (category: string, location: { lat: number; lng: number } | null) => void;
  className?: string;
}

export default function VoiceAssistant({ userLocation, findProfessionals, className }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Reconocimiento de voz no soportado');
      return;
    }
    const recognition = new SpeechRecognition();

    recognition.lang = 'es-ES';
    recognition.start();
    setIsListening(true);

    recognition.onresult = (event: any) => {
      const command = event.results[0][0].transcript.toLowerCase();
      processCommand(command);
      setIsListening(false);
    };

    recognition.onerror = () => {
        setIsListening(false);
    }
  };

  const processCommand = (command: string) => {
    if (command.includes('pinpro') && command.includes('necesito')) {
      const category = command.replace('pinpro necesito un', '').replace('cercano y activo', '').trim();
      findProfessionals(category, userLocation);
    }
  };

  return (
    <button
      onClick={startListening}
      className={cn(
        "p-2 sm:p-2.5 rounded-full transition-all flex items-center justify-center border font-black uppercase tracking-widest active:scale-95 shadow-sm",
        isListening
          ? "bg-red-500 text-white border-red-500"
          : "bg-[#252830]/90 text-on-surface border-transparent hover:border-green-500/40",
        className
      )}
    >
      {isListening ? <MicOff size={16} /> : <Mic size={16} />}
    </button>
  );
}
