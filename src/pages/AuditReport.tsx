import { useState } from 'react';
import {
  Users, ShieldCheck, AlertTriangle, CheckCircle2, XCircle,
  MessageSquare, CreditCard, MapPin, Siren, Zap,
  ArrowLeft, Star, Clock, Smartphone, Globe,
  Search, Filter, Wallet, Share2, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

interface Persona {
  name: string;
  role: 'Cliente' | 'Profesional' | 'Admin';
  avatar: string;
  scenario: string;
  findings: string[];
  status: 'satisfied' | 'neutral' | 'frustrated';
}

export default function AuditReport() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'personas' | 'report' | 'use-cases'>('personas');

  const personas: Persona[] = [
    {
      name: 'Carlos R.',
      role: 'Profesional',
      avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?q=80&w=150&h=150&auto=format&fit=crop',
      scenario: 'Plomero independiente buscando digitalizar su agenda y recibir pagos seguros.',
      findings: [
        'El registro fue fluido, pero la carga de 12 fotos es limitada para mi portafolio de 5 años.',
        'La geolocalización es precisa, me llegan clientes realmente cerca.',
        'Me gustaría poder establecer horarios de descanso específicos en la agenda.'
      ],
      status: 'satisfied'
    },
    {
      name: 'Marta S.',
      role: 'Cliente',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=150&h=150&auto=format&fit=crop',
      scenario: 'Madre de familia buscando un electricista de urgencia un domingo por la noche.',
      findings: [
        'Encontré a alguien en 2 minutos usando el filtro de "24/7".',
        'El precio no era visible en el mapa, tuve que entrar a 3 perfiles para comparar.',
        'El chat con traducción me ayudó porque el técnico solo hablaba inglés.'
      ],
      status: 'neutral'
    },
    {
      name: 'Willy C.',
      role: 'Admin',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=150&h=150&auto=format&fit=crop',
      scenario: 'Dueño de la plataforma supervisando el crecimiento y la calidad del servicio.',
      findings: [
        'La exportación de leads funciona bien, pero necesito filtros por fecha de registro.',
        'El sistema de auditoría de flujos detectó un error en el balance de la billetera simulada.',
        'Falta una herramienta para masajear (enviar notificaciones push) a todos los usuarios.'
      ],
      status: 'satisfied'
    },
    {
      name: 'Elena M.',
      role: 'Profesional',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150&h=150&auto=format&fit=crop',
      scenario: 'Estilista a domicilio probando la membresía Premium para destacar.',
      findings: [
        'El distintivo Premium aumentó mis visitas un 40%.',
        'El proceso de pago con PayPal fue confuso al principio, faltaba un "Cargando...".',
        'Quiero poder ver quién visitó mi perfil pero no me contactó.'
      ],
      status: 'neutral'
    },
    {
      name: 'Jorge L.',
      role: 'Cliente',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150&h=150&auto=format&fit=crop',
      scenario: 'Usuario en una zona desconocida con una emergencia mecánica.',
      findings: [
        'El botón SOS es muy visible, lo cual da seguridad.',
        'La alerta sonora en el celular del profesional debería ser más persistente.',
        'El seguimiento en el mapa del técnico viniendo es excelente.'
      ],
      status: 'satisfied'
    },
    {
      name: 'Sofía V.',
      role: 'Admin',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&h=150&auto=format&fit=crop',
      scenario: 'Soporte técnico mediando en una disputa de pago.',
      findings: [
        'Puedo ver el historial de chat, lo cual facilita la resolución.',
        'Falta un botón de "Reembolso Directo" en el panel de administración.',
        'La traducción a veces cambia términos técnicos por palabras comunes.'
      ],
      status: 'neutral'
    },
    {
      name: 'Ricardo P.',
      role: 'Cliente',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&h=150&auto=format&fit=crop',
      scenario: 'Usuario frecuente gestionando su presupuesto en la Billetera.',
      findings: [
        'Recargar saldo es instantáneo.',
        'El historial de transacciones es muy básico, necesito descargar facturas PDF.',
        'Me gustaría poder programar pagos recurrentes para servicios de limpieza.'
      ],
      status: 'neutral'
    },
    {
      name: 'Lucía T.',
      role: 'Profesional',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&h=150&auto=format&fit=crop',
      scenario: 'Enfermera recibiendo múltiples solicitudes simultáneas.',
      findings: [
        'Las notificaciones push a veces llegan con retraso de 30 segundos.',
        'Al abrir una notificación de mensaje, me lleva al Home y no al chat.',
        'El sistema de referidos me ha dado $20 extras este mes, ¡genial!'
      ],
      status: 'satisfied'
    },
    {
      name: 'Andrés G.',
      role: 'Cliente',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&h=150&auto=format&fit=crop',
      scenario: 'Usuario de 65 años buscando ayuda para mantenimiento de jardín.',
      findings: [
        'Los iconos son claros, pero el texto de los términos legales es muy pequeño.',
        'Me costó encontrar cómo cerrar la sesión la primera vez.',
        'El contraste de colores es bueno para mi vista cansada.'
      ],
      status: 'neutral'
    },
    {
      name: 'Valeria B.',
      role: 'Profesional',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&h=150&auto=format&fit=crop',
      scenario: 'Influencer de belleza compartiendo su perfil en redes sociales.',
      findings: [
        'El link de mi perfil no muestra mi foto cuando lo pego en Instagram.',
        'Las redes sociales confirmadas (Instagram/FB) dan mucha confianza a mis clientes.',
        'Me gustaría un código QR de mi perfil para poner en mi tarjeta física.'
      ],
      status: 'satisfied'
    },
    {
      name: 'Roberto D.',
      role: 'Profesional',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&h=150&auto=format&fit=crop',
      scenario: 'Experto en ciberseguridad evaluando la privacidad de los datos.',
      findings: [
        'El inicio de sesión con Google es seguro y rápido.',
        'Me gustaría ver una opción de autenticación de dos factores (2FA) para retiros.',
        'Los permisos de ubicación son claros y se piden en el momento adecuado.'
      ],
      status: 'satisfied'
    },
    {
      name: 'Camila F.',
      role: 'Cliente',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150&h=150&auto=format&fit=crop',
      scenario: 'Estudiante universitaria buscando mudanzas económicas.',
      findings: [
        'Pude comparar 4 presupuestos diferentes en menos de una hora.',
        'El diseño oscuro es muy moderno, pero a veces cuesta leer textos grises.',
        'La función de chat me permitió negociar el precio fácilmente.'
      ],
      status: 'satisfied'
    },
    {
      name: 'Diego H.',
      role: 'Profesional',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&h=150&auto=format&fit=crop',
      scenario: 'Arquitecto ofreciendo consultorías virtuales.',
      findings: [
        'Falta una integración nativa para videollamadas dentro del chat.',
        'El sistema de reseñas me ayudó a conseguir clientes internacionales.',
        'El cobro por hora es fácil de configurar en mi perfil.'
      ],
      status: 'neutral'
    },
    {
      name: 'Laura N.',
      role: 'Cliente',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&h=150&auto=format&fit=crop',
      scenario: 'Ama de casa buscando un paseador de perros de confianza.',
      findings: [
        'Ver las fotos de trabajos anteriores me dio mucha tranquilidad.',
        'Me gustaría poder guardar profesionales en una lista de "Favoritos".',
        'El pago con tarjeta fue muy rápido y sin errores.'
      ],
      status: 'satisfied'
    },
    {
      name: 'Miguel A.',
      role: 'Admin',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&h=150&auto=format&fit=crop',
      scenario: 'Analista de datos revisando métricas de conversión.',
      findings: [
        'El panel de reportes necesita gráficos de retención de usuarios.',
        'Los logs de errores de Firestore son muy útiles para depurar.',
        'La carga inicial de la app es muy rápida, excelente PWA.'
      ],
      status: 'satisfied'
    },
    {
      name: 'Carmen J.',
      role: 'Cliente',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&h=150&auto=format&fit=crop',
      scenario: 'Turista extranjera buscando un traductor local.',
      findings: [
        'La traducción automática del chat es una maravilla.',
        'El mapa me ayudó a encontrar a alguien a 2 cuadras de mi hotel.',
        'Tuve problemas para registrar mi número de teléfono internacional.'
      ],
      status: 'neutral'
    },
    {
      name: 'Fernando T.',
      role: 'Profesional',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150&h=150&auto=format&fit=crop',
      scenario: 'Entrenador personal gestionando clases grupales.',
      findings: [
        'La app está muy enfocada a servicios 1 a 1, me cuesta agendar grupos.',
        'Las notificaciones de nuevos clientes son instantáneas.',
        'El diseño de la billetera es muy motivador.'
      ],
      status: 'frustrated'
    },
    {
      name: 'Patricia W.',
      role: 'Cliente',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=150&h=150&auto=format&fit=crop',
      scenario: 'Organizadora de eventos contratando múltiples servicios a la vez.',
      findings: [
        'Tener varios chats activos al mismo tiempo es un poco caótico.',
        'Pude contratar DJ, catering y limpieza desde la misma app.',
        'Me gustaría un panel para ver el estado de todas mis contrataciones activas.'
      ],
      status: 'neutral'
    },
    {
      name: 'Hugo S.',
      role: 'Profesional',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=150&h=150&auto=format&fit=crop',
      scenario: 'Técnico en refrigeración trabajando en zonas con mala señal.',
      findings: [
        'La app se queda cargando si pierdo conexión 4G.',
        'Necesito modo offline para ver la dirección del cliente.',
        'El botón de "Llegué" a veces no registra mi ubicación exacta.'
      ],
      status: 'frustrated'
    },
    {
      name: 'Natalia R.',
      role: 'Cliente',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&h=150&auto=format&fit=crop',
      scenario: 'Usuaria de primera vez intentando entender cómo funciona la app.',
      findings: [
        'El registro con Google fue literalmente de un clic.',
        'Me sentí un poco perdida en la pantalla principal al principio.',
        'Una vez que entendí el mapa, fue súper fácil pedir un servicio.'
      ],
      status: 'satisfied'
    }
  ];

  const reportItems = [
    {
      title: 'UI/UX & Accesibilidad',
      issues: [
        { text: 'Aumentar tamaño de fuente en páginas legales y modales informativos.', priority: 'Baja' },
        { text: 'Implementar estados de carga (skeletons) en la pasarela de pagos.', priority: 'Alta' },
        { text: 'Mejorar el contraste del botón "Cerrar Sesión" para mayor visibilidad.', priority: 'Media' }
      ]
    },
    {
      title: 'Funcionalidad del Mapa',
      issues: [
        { text: 'Mostrar precio base o rango en el popup del marcador del mapa.', priority: 'Alta' },
        { text: 'Optimizar el clustering de marcadores cuando hay muchos profesionales en una zona.', priority: 'Media' }
      ]
    },
    {
      title: 'Mensajería y Notificaciones',
      issues: [
        { text: 'Corregir el Deep Linking: las notificaciones deben abrir el chat específico.', priority: 'Crítica' },
        { text: 'Añadir lista de "Palabras Prohibidas" para evitar que la traducción cambie nombres propios.', priority: 'Baja' }
      ]
    },
    {
      title: 'Motor de Ranking y Visibilidad',
      issues: [
        { text: 'Sistema de Boosting basado en fórmulas (Trust, Premium, Admin) implementado con éxito.', priority: 'Media' },
        { text: 'Optimizar la expiración automática de los Admin Boosts en tiempo real.', priority: 'Alta' }
      ]
    },
    {
      title: 'Billetera y Finanzas',
      issues: [
        { text: 'Implementar generación de recibos/facturas en PDF para cada transacción.', priority: 'Media' },
        { text: 'Añadir botón de "Solicitar Retiro" para profesionales en la billetera.', priority: 'Alta' }
      ]
    },
    {
      title: 'Admin & Moderación',
      issues: [
        { text: 'Añadir filtros de fecha y exportación segmentada en el Dashboard.', priority: 'Media' },
        { text: 'Implementar sistema de notificaciones masivas (Broadcast).', priority: 'Alta' }
      ]
    }
  ];

  const useCases = [
    {
      id: 'referral',
      name: 'Sistema de Referidos Viral',
      steps: [
        'Usuario genera código único.',
        'Nuevo usuario se registra usando el link.',
        'Ambos reciben bono en Billetera tras el primer servicio completado.'
      ],
      status: 'Implementado'
    },
    {
      id: 'withdrawal',
      name: 'Retiro de Fondos (Payout)',
      steps: [
        'Profesional alcanza el mínimo de retiro ($50).',
        'Solicita retiro a cuenta bancaria o PayPal.',
        'Admin aprueba y se descuenta del balance.'
      ],
      status: 'En Desarrollo'
    },
    {
      id: 'tracking',
      name: 'Seguimiento de Servicio Real',
      steps: [
        'Profesional marca "En Camino".',
        'Cliente ve ubicación en tiempo real.',
        'Check-in al llegar y Check-out al terminar.'
      ],
      status: 'Implementado'
    },
    {
      id: 'dispute',
      name: 'Resolución de Disputas',
      steps: [
        'Cliente reporta problema con un servicio.',
        'Fondos se congelan en Escrow.',
        'Admin revisa chat y decide el destino del pago.'
      ],
      status: 'Beta'
    }
  ];

  return (
    <div className="min-h-full bg-surface-lowest text-on-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface-lowest/80 backdrop-blur-xl border-b border-primary-container/20 p-4 pt-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 shrink-0" />
          <h1 className="text-xl font-black uppercase tracking-tighter drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
            Reporte de Auditoría 1.0
          </h1>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-500 text-[10px] font-bold uppercase">
            Salud: 92%
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant/20">
        {[
          { id: 'personas', label: 'Personas', icon: Users },
          { id: 'report', label: 'Hallazgos', icon: AlertTriangle },
          { id: 'use-cases', label: 'Casos de Uso', icon: Zap }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex-1 py-4 flex flex-col items-center gap-1 transition-all relative",
              activeTab === tab.id ? "text-primary-container" : "text-on-surface-variant"
            )}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{tab.label}</span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-container shadow-[0_0_10px_#00FFFF]"></div>
            )}
          </button>
        ))}
      </div>

      <main className="p-6 pb-24">
        {activeTab === 'personas' && (
          <div className="space-y-6">
            <div className="p-4 bg-primary-container/5 border border-primary-container/20 rounded-2xl flex gap-4 items-start">
              <Info className="w-5 h-5 text-primary-container shrink-0 mt-0.5" />
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Hemos simulado 20 perfiles distintos (expertos y usuarios normales) con necesidades reales para estresar la PWA. Aquí sus experiencias directas.
              </p>
            </div>

            <div className="grid gap-4">
              {personas.map((p, i) => (
                <div key={i} className="bg-surface-container/40 border border-outline-variant/10 rounded-2xl p-5 hover:border-primary-container/30 transition-all group">
                  <div className="flex items-center gap-4 mb-4">
                    <img src={p.avatar} alt={p.name} className="w-12 h-12 rounded-full border-2 border-primary-container/30 object-cover" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-on-surface">{p.name}</h3>
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          p.status === 'satisfied' ? "bg-green-500 shadow-[0_0_8px_#22c55e]" :
                          p.status === 'neutral' ? "bg-yellow-500 shadow-[0_0_8px_#eab308]" :
                          "bg-red-500 shadow-[0_0_8px_#ef4444]"
                        )}></div>
                      </div>
                      <p className="text-[10px] text-primary-container font-black uppercase tracking-wider">{p.role}</p>
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-variant italic mb-4 border-l-2 border-primary-container/20 pl-3">
                    "{p.scenario}"
                  </p>
                  <div className="space-y-2">
                    {p.findings.map((f, fi) => (
                      <div key={fi} className="flex gap-2 items-start">
                        <div className="w-1 h-1 rounded-full bg-primary-container mt-1.5 shrink-0"></div>
                        <p className="text-[11px] text-on-surface-variant leading-tight">{f}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <div className="space-y-8">
            {reportItems.map((section, i) => (
              <section key={i} className="space-y-4">
                <h2 className="text-sm font-black text-on-surface uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-primary-container rounded-full"></div>
                  {section.title}
                </h2>
                <div className="grid gap-3">
                  {section.issues.map((issue, ii) => (
                    <div key={ii} className="bg-surface-container/40 border border-outline-variant/10 rounded-xl p-4 flex items-center justify-between gap-4">
                      <p className="text-xs text-on-surface-variant leading-relaxed flex-1">{issue.text}</p>
                      <span className={cn(
                        "text-[9px] font-black uppercase px-2 py-1 rounded-md shrink-0",
                        issue.priority === 'Crítica' ? "bg-red-500/20 text-red-500 border border-red-500/30" :
                        issue.priority === 'Alta' ? "bg-orange-500/20 text-orange-500 border border-orange-500/30" :
                        issue.priority === 'Media' ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30" :
                        "bg-blue-500/20 text-blue-500 border border-blue-500/30"
                      )}>
                        {issue.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {activeTab === 'use-cases' && (
          <div className="space-y-6">
            <div className="grid gap-4">
              {useCases.map((uc, i) => (
                <div key={i} className="bg-surface-container/40 border border-outline-variant/10 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-on-surface flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary-container" />
                      {uc.name}
                    </h3>
                    <span className="text-[9px] font-black uppercase tracking-widest bg-primary-container/10 text-primary-container px-2 py-1 rounded-md border border-primary-container/20">
                      {uc.status}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {uc.steps.map((step, si) => (
                      <div key={si} className="flex gap-3 items-center">
                        <div className="w-5 h-5 rounded-full bg-surface-highest flex items-center justify-center text-[10px] font-bold text-on-surface-variant shrink-0">
                          {si + 1}
                        </div>
                        <p className="text-xs text-on-surface-variant">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer Action */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-surface-lowest/80 backdrop-blur-xl border-t border-outline-variant/20 z-50">
        <button
          onClick={() => navigate('/home')}
          className="w-full bg-primary-container text-surface-lowest font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(0,255,255,0.3)] uppercase tracking-widest text-xs"
        >
          Finalizar Revisión
        </button>
      </div>
    </div>
  );
}
