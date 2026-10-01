import React from 'react';
import { ShieldCheck, Lock, Terminal, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

export default function SecurityDashboard() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 font-mono">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-2xl mx-auto space-y-6"
      >
        <div className="flex items-center gap-3 text-cyan-400 mb-8 border-b border-cyan-400/20 pb-4">
          <ShieldAlert className="w-8 h-8" />
          <h1 className="text-2xl font-black uppercase tracking-widest">PinPro Secure Shield</h1>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-md border border-cyan-400/20 rounded-3xl p-8 shadow-[0_0_50px_rgba(34,211,238,0.1)]">
          <div className="flex items-center gap-4 mb-6">
            <Lock className="w-10 h-10 text-magenta-500" />
            <h2 className="text-xl font-bold">Protección de Última Generación</h2>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            Tu cuenta está protegida por nuestra avanzada arquitectura de seguridad Zero-Trust.
            Realizamos escaneos en tiempo real para detectar anomalías, inyecciones de código y ataques de fuerza bruta.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
              <p className="text-cyan-400 font-bold text-xs uppercase">Firewall Activo</p>
              <p className="text-white text-lg font-black">24/7</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
              <p className="text-magenta-400 font-bold text-xs uppercase">Cifrado</p>
              <p className="text-white text-lg font-black">AES-256</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <SecurityPoint icon={<Terminal />} title="Monitoreo de Sockets" description="Análisis constante de rutas de datos websockets." />
          <SecurityPoint icon={<ShieldCheck />} title="Validación Estricta" description="Políticas de seguridad Firestore ABAC de confianza cero." />
        </div>
      </motion.div>
    </div>
  );
}

function SecurityPoint({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex items-center gap-4 bg-gray-900 border border-gray-800 p-4 rounded-2xl">
      <div className="text-cyan-400">{React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6' })}</div>
      <div>
        <p className="font-bold text-sm text-gray-200">{title}</p>
        <p className="text-[10px] text-gray-500">{description}</p>
      </div>
    </div>
  );
}
