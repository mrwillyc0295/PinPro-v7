import { ArrowLeft, Shield, ExternalLink, AlertTriangle, FileText, Scale } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 w-full h-full bg-surface-lowest overflow-y-auto hide-scrollbar flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-surface-lowest/90 backdrop-blur-xl border-b border-primary-container/20 shadow-[0_4px_20px_-10px_rgba(0,255,255,0.3)] px-5 py-4 pt-16 flex items-center justify-between">
        <div className="w-14 h-14 shrink-0" />
        <h1 className="text-lg font-bold text-on-surface tracking-wide drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">Privacidad y Legal</h1>
        <div className="w-10 h-10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary-container drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col gap-6 pb-12">
        {/* Intro */}
        <div className="bg-surface-container/60 border border-primary-container/20 rounded-2xl p-5 shadow-[0_0_15px_rgba(0,255,255,0.05)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-primary-container/20 p-2 rounded-full">
              <Shield className="w-6 h-6 text-primary-container" />
            </div>
            <h2 className="text-base font-bold text-on-surface">Tu Privacidad es Importante</h2>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            En PinPro, nos tomamos muy en serio la protección de tus datos personales y tu seguridad. Esta sección detalla nuestras políticas y las leyes que rigen el uso de nuestra plataforma.
          </p>
        </div>

        {/* Leyes y Regulaciones */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-black text-on-surface-variant uppercase tracking-[0.2em] px-2 flex items-center gap-2">
            <Scale className="w-5 h-5" /> Marco Legal y Regulaciones
          </h3>

          <div className="bg-surface-container/40 border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
            {/* GDPR / CCPA */}
            <div className="p-6 border-b border-outline-variant/50">
              <h4 className="text-lg font-bold text-on-surface mb-3">Protección de Datos (GDPR / CCPA)</h4>
              <p className="text-base text-on-surface-variant mb-4 leading-relaxed">
                Cumplimos con las normativas internacionales de protección de datos. Tienes derecho a acceder, rectificar o eliminar tu información personal en cualquier momento.
              </p>
              <a href="https://gdpr-info.eu/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary-container hover:underline font-bold">
                Leer sobre GDPR <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Responsabilidad Civil */}
            <div className="p-6 border-b border-outline-variant/50">
              <h4 className="text-lg font-bold text-on-surface mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" /> Responsabilidad Civil
              </h4>
              <p className="text-base text-on-surface-variant mb-3 leading-relaxed">
                PinPro actúa únicamente como intermediario entre clientes y profesionales. No nos hacemos responsables por daños, perjuicios o mala praxis durante la ejecución de los trabajos. Recomendamos a los profesionales contar con seguros de responsabilidad civil.
              </p>
            </div>

            {/* Prevención de Fraude */}
            <div className="p-6">
              <h4 className="text-lg font-bold text-on-surface mb-3">Prevención de Fraude y Lavado de Dinero</h4>
              <p className="text-base text-on-surface-variant mb-3 leading-relaxed">
                Para cumplir con las leyes financieras (AML/KYC), monitoreamos las transacciones realizadas a través de la plataforma y podemos requerir verificación de identidad adicional para procesar pagos.
              </p>
            </div>
          </div>
        </div>

        {/* Documentos Legales */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-2 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Documentos Legales
          </h3>

          <div className="flex flex-col gap-3">
            <button className="w-full bg-surface-container/80 border border-outline-variant hover:border-primary-container/50 p-4 rounded-2xl flex items-center justify-between group transition-all">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-on-surface-variant group-hover:text-primary-container transition-colors" />
                <span className="text-sm font-bold text-on-surface group-hover:text-primary-container transition-colors">Términos y Condiciones</span>
              </div>
              <ExternalLink className="w-4 h-4 text-on-surface-variant group-hover:text-primary-container transition-colors" />
            </button>

            <button className="w-full bg-surface-container/80 border border-outline-variant hover:border-primary-container/50 p-4 rounded-2xl flex items-center justify-between group transition-all">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-on-surface-variant group-hover:text-primary-container transition-colors" />
                <span className="text-sm font-bold text-on-surface group-hover:text-primary-container transition-colors">Política de Privacidad Completa</span>
              </div>
              <ExternalLink className="w-4 h-4 text-on-surface-variant group-hover:text-primary-container transition-colors" />
            </button>

            <button className="w-full bg-surface-container/80 border border-outline-variant hover:border-primary-container/50 p-4 rounded-2xl flex items-center justify-between group transition-all">
              <div className="flex items-center gap-3">
                <Scale className="w-5 h-5 text-on-surface-variant group-hover:text-primary-container transition-colors" />
                <span className="text-sm font-bold text-on-surface group-hover:text-primary-container transition-colors">Acuerdo de Servicios Profesionales</span>
              </div>
              <ExternalLink className="w-4 h-4 text-on-surface-variant group-hover:text-primary-container transition-colors" />
            </button>
          </div>
        </div>

        {/* Contacto Legal */}
        <div className="mt-4 text-center">
          <p className="text-xs text-on-surface-variant mb-2">¿Tienes dudas sobre nuestras políticas?</p>
          <a href="mailto:legal@pinpro.com" className="text-sm font-bold text-primary-container hover:underline drop-shadow-[0_0_5px_rgba(0,255,255,0.3)]">
            Contactar al Departamento Legal
          </a>
        </div>
      </div>
    </div>
  );
}
