import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Scale,
  MapPin,
  CreditCard,
  AlertTriangle,
  FileText,
  ChevronRight,
  ChevronLeft,
  Share2,
  QrCode as QrIcon,
  Briefcase
} from 'lucide-react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

const TermsAndConditions: React.FC = () => {
  const navigate = useNavigate();

const sections = [
    {
      id: 'general',
      title: '1. Naturaleza de los Servicios',
      icon: <Scale className="w-5 h-5 text-primary-container" />,
      content: 'PinPro actúa exclusivamente como un intermediario tecnológico para conectar clientes con profesionales independientes. PinPro NO es empleador, agente o socio de los profesionales, y no garantiza la calidad, seguridad, legalidad o veracidad de los servicios prestados.'
    },
    {
      id: 'digital-crimes',
      title: '2. Prohibición de Delitos Digitales',
      icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
      content: 'Está estrictamente prohibido utilizar esta plataforma para la comisión de delitos digitales (estafas, phishing, acoso, extorsión, difusión de contenido ilegal, etc.). Cualquier actividad de este tipo será reportada de inmediato a las autoridades competentes. PinPro colaborará plenamente con los cuerpos de seguridad del Estado.'
    },
    {
      id: 'liability',
      title: '3. Exención de Responsabilidad',
      icon: <ShieldCheck className="w-5 h-5 text-yellow-500" />,
      content: 'PinPro no se hace responsable por daños directos, indirectos, incidentales o consecuentes derivados de la interacción entre usuarios, incumplimientos contractuales entre las partes, o actos ilícitos perpetrados por terceros utilizando el servicio. El usuario asume total responsabilidad por su conducta y acciones dentro de la plataforma.'
    },
    {
      id: 'geo',
      title: '4. Geolocalización y Seguridad',
      icon: <MapPin className="w-5 h-5 text-blue-500" />,
      content: 'La geolocalización se utiliza para mejorar la experiencia de conexión profesional-cliente. El mal uso de esta información para fines de acoso o seguimiento indebido es causal de expulsión inmediata y acciones legales pertinentes.'
    },
    {
      id: 'conduct',
      title: '5. Conducta y Integridad',
      icon: <FileText className="w-5 h-5 text-purple-500" />,
      content: 'Todos los profesionales y clientes garantizan que su información es veraz, y se comprometen a mantener estándares de respeto, seguridad y profesionalismo. Cualquier conducta violenta, intimidatoria o discriminatoria resultará en la baja definitiva de la cuenta.'
    },
    {
      id: 'jurisdiction',
      title: '6. Jurisdicción y Ley Aplicable',
      icon: <Briefcase className="w-5 h-5 text-cyan-400" />,
      content: 'Estos términos se rigen por las leyes vigentes del país de operación. Cualquier disputa que no pueda resolverse internamente será sometida a los tribunales de la jurisdicción correspondiente.'
    }
  ];

  return (
    <div className="flex flex-col h-full bg-[#05070a] text-white">
      {/* Header */}
      <header className="px-6 pt-12 pb-4 sticky top-0 z-50 bg-[#05070a]/80 backdrop-blur-xl border-b border-white/5 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors border border-white/10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-display font-black tracking-tighter uppercase italic text-[#00f2ff]">Términos Legales</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 hide-scrollbar relative">
        {/* Background Decorative Text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] overflow-hidden">
          <span className="text-[20vw] font-black italic uppercase tracking-tighter rotate-12 select-none whitespace-nowrap">
            MENSAJE
          </span>
        </div>

        {/* Intro */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-container/10 flex items-center justify-center border border-primary-container/20">
              <FileText className="w-6 h-6 text-primary-container" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-primary-container">Condiciones de Uso</p>
              <h2 className="text-2xl font-black italic uppercase">Contrato Digital</h2>
            </div>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed opacity-80">
            Bienvenido a PinPro. Este documento establece las reglas y protecciones legales para todos nuestros usuarios. Por favor, lea detenidamente para entender sus derechos y obligaciones.
          </p>
        </section>

        {/* Sections Grid */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-primary-container/30 transition-all active:scale-[0.98]"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-white/5 group-hover:bg-primary-container/10 transition-colors">
                  {section.icon}
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-bold text-base text-white flex items-center justify-between">
                    {section.title}
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-primary-container transition-colors" />
                  </h3>
                  <p className="text-sm text-white/60 leading-relaxed font-medium">
                    {section.content}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="p-6 rounded-3xl bg-primary-container/5 border border-primary-container/20 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-primary-container flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Compromiso de Seguridad
          </h4>
          <p className="text-xs text-white/50 leading-relaxed">
            PinPro utiliza cifrado de grado militar para proteger sus datos financieros. Al usar la plataforma, acepta que las disputas se resuelvan preferentemente de manera interna antes de recurrir a instancias externas.
          </p>
        </div>

        {/* Share Section - "The Artifact" */}
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative group overflow-hidden p-8 rounded-[2.5rem] bg-gradient-to-br from-[#0a0a0a] to-[#121212] border border-white/10 shadow-2xl"
        >
          {/* Animated Background Elements */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary-container/10 blur-[80px] rounded-full group-hover:bg-primary-container/20 transition-colors" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full group-hover:bg-blue-500/20 transition-colors" />

          <div className="relative z-10 flex flex-col items-center text-center space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/10 border border-primary-container/20 text-[10px] font-black uppercase tracking-widest text-[#00f2ff]">
                <Share2 className="w-3 h-3" />
                Compartir PinPro
              </div>
              <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none">
                Invita a tu <span className="text-primary-container">Red</span>
              </h3>
              <p className="text-sm text-white/50 font-medium max-w-[200px] mx-auto leading-tight">
                Escanea el código para ver el mapa en tiempo real al instante.
              </p>
            </div>

            {/* QR Code Container - Modern "Artifact" Look */}
            <div className="relative p-6 bg-white rounded-3xl shadow-[0_0_50px_rgba(0,242,255,0.2)] group-hover:shadow-[0_0_70px_rgba(0,242,255,0.4)] transition-shadow">
              <div className="absolute -inset-2 bg-gradient-to-tr from-primary-container to-blue-500 rounded-[2rem] opacity-20 group-hover:opacity-40 transition-opacity blur-sm" />
              <div className="relative bg-white p-2 rounded-2xl">
                <QRCodeSVG
                  value={window.location.origin}
                  size={140}
                  level="H"
                  includeMargin={false}
                  imageSettings={{
                    src: "/loading.png",
                    x: undefined,
                    y: undefined,
                    height: 30,
                    width: 30,
                    excavate: true,
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full pt-4">
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'PinPro - Servicios Profesionales',
                      text: 'Encuentra servicios profesionales cerca de ti en tiempo real con PinPro.',
                      url: window.location.origin
                    }).catch((err) => {
                      if (err.name !== 'AbortError') {
                        console.error('Error sharing:', err);
                      }
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.origin);
                    alert('Enlace copiado al portapapeles');
                  }
                }}
                className="w-full h-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest transition-all active:scale-95"
              >
                <Share2 className="w-5 h-5 text-primary-container" />
                Compartir Enlace
              </button>

              <p className="text-[10px] text-white/30 font-medium uppercase tracking-widest italic">
                El futuro de los servicios locales es <span className="text-white/60">PinPro</span>
              </p>
            </div>
          </div>
        </motion.section>

        <p className="text-center text-[10px] text-white/30 font-bold uppercase tracking-[0.2em]">
          Última actualización: Mayo 2024
        </p>
      </div>

      {/* Floating Action (Optional if context needs accept) */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent pointer-events-none">
        <button
          onClick={() => navigate(-1)}
          className="pointer-events-auto w-full h-14 bg-primary-container text-black font-black uppercase tracking-widest rounded-2xl shadow-[0_8px_30px_rgba(0,255,255,0.4)] hover:shadow-[0_12px_40px_rgba(0,255,255,0.6)] active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          He leído y acepto
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default TermsAndConditions;
