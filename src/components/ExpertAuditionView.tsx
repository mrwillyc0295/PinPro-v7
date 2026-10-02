import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, MessageSquare, ArrowLeft, Send, Sparkles, Brain, TrendingUp, ShieldCheck, Zap, Globe, DollarSign, BarChart3, Rocket, Settings2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../lib/utils'; // Asegúrate de que la ruta sea correcta según tu proyecto

import { AnimatedBackButton } from './AnimatedBackButton';

interface Expert {
  id: string;
  name: string;
  role: string;
  icon: any;
  color: string;
  description: string;
}

const EXPERTS: Expert[] = [
  { id: 'elon', name: 'Elon Musk', role: 'Visionario Tech', icon: Rocket, color: 'text-blue-400', description: 'CEO de Tesla y SpaceX. Experto en innovación disruptiva y energía sostenible.' },
  { id: 'warren', name: 'Warren Buffett', role: 'Análisis Financiero', icon: DollarSign, color: 'text-green-400', description: 'Inversionista legendario. Experto en valor a largo plazo y solidez financiera.' },
  { id: 'seth', name: 'Seth Godin', role: 'Marketing y Marca', icon: Sparkles, color: 'text-orange-400', description: 'Gurú del marketing. Experto en crear conexiones y tribus alrededor de productos.' },
  { id: 'grant', name: 'Grant Cardone', role: 'Ventas y Cierre', icon: TrendingUp, color: 'text-red-400', description: 'Experto en ventas de alto impacto y expansión agresiva de mercado.' },
  { id: 'gary', name: 'Gary Vaynerchuk', role: 'Social Media y CX', icon: MessageSquare, color: 'text-indigo-400', description: 'Experto en atención al cliente y tendencias en redes sociales.' },
  { id: 'cathy', name: 'Cathy Wood', role: 'Tendencias Futuras', icon: Brain, color: 'text-cyan-400', description: 'CEO de ARK Invest. Experta en tecnologías disruptivas y mercados del futuro.' },
  { id: 'jeff', name: 'Jeff Bezos', role: 'Logística y Eficiencia', icon: Globe, color: 'text-yellow-600', description: 'Fundador de Amazon. Experto en escala, logística y obsesión por el cliente.' },
  { id: 'nassim', name: 'Nassim Taleb', role: 'Gestión de Riesgo', icon: ShieldCheck, color: 'text-red-600', description: 'Autor de El Cisne Negro. Experto en antifragilidad y toma de decisiones bajo incertidumbre.' },
  { id: 'simon', name: 'Simon Sinek', role: 'Liderazgo y Propósito', icon: Brain, color: 'text-yellow-500', description: 'Experto en el "Por Qué" y cultura organizacional de alto rendimiento.' }
  // Puedes añadir o quitar expertos fácilmente de esta lista según apliquen a tu nicho en PINPRO
];

interface ExpertAuditionViewProps {
  onBack: () => void;
}

export const ExpertAuditionView: React.FC<ExpertAuditionViewProps> = ({ onBack }) => {
  const [query, setQuery] = useState('');
  const [responses, setResponses] = useState<{ expertId: string, text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedExperts, setSelectedExperts] = useState<string[]>(EXPERTS.map(e => e.id).slice(0, 5));

  const handleAudition = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setResponses([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const selectedNames = EXPERTS.filter(e => selectedExperts.includes(e.id)).map(e => `${e.name} (${e.role})`).join(', ');

      const prompt = `
        Actúa como un panel de expertos.
        Los expertos seleccionados para esta audición son: ${selectedNames}.

        El usuario plantea la siguiente consulta/desafío: "${query}"

        Proporciona una respuesta donde CADA uno de los expertos mencionados dé su opinión crítica, técnica o estratégica basada en su personalidad y experiencia real.

        INSTRUCCIÓN CRÍTICA: Cuando realices una comparación tecnológica, de precios o estrategias, utiliza SIEMPRE una tabla de Markdown titulada "📊 COMPARATIVA ESTRATÉGICA" para que la información sea visualmente clara y accionable.

        Formato OBLIGATORIO para cada experto:
        ### [Nombre del Experto]
        [Respuesta del experto con análisis profundo]

        ---
      `;

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      const text = result.text || '';

      // Separar las respuestas por experto usando los separadores "---"
      const sections = text.split('---').map(s => s.trim()).filter(s => s.length > 0);
      const parsedResponses = sections.map(section => {
        const match = section.match(/### (.*)\n([\s\S]*)/);
        if (match) {
          const name = match[1].trim();
          const expert = EXPERTS.find(e => name.toLowerCase().includes(e.name.toLowerCase()));
          return {
            expertId: expert?.id || 'unknown',
            text: match[2].trim()
          };
        }
        return null;
      }).filter(r => r !== null) as { expertId: string, text: string }[];

      setResponses(parsedResponses);
    } catch (error: any) {
      console.error("Error in expert audition:", error);

      let errorMessage = "Ocurrió un error inesperado al contactar con el panel de expertos. Por favor, intenta de nuevo.";
      const rawMessage = error.message ? error.message.toLowerCase() : "";

      if (rawMessage.includes("api_key") || rawMessage.includes("key not valid") || rawMessage.includes("unauthenticated")) {
        errorMessage = "Error de autenticación con el servicio de IA. Verifica que tu clave de API Gemini esté configurada.";
      } else if (rawMessage.includes("quota") || rawMessage.includes("429") || rawMessage.includes("exhausted")) {
        errorMessage = "El panel de expertos está muy concurrido en este momento (Límite de cuota alcanzado). Espera unos minutos y vuelve a intentarlo.";
      } else if (rawMessage.includes("network") || rawMessage.includes("fetch") || rawMessage.includes("failed to fetch")) {
        errorMessage = "Hay un problema con la conexión a internet. Revisa tu red e intenta de nuevo para escuchar a los expertos.";
      }

      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpert = (id: string) => {
    setSelectedExperts(prev =>
      prev.includes(id)
        ? prev.filter(expertId => expertId !== id)
        : (prev.length < 8 ? [...prev, id] : prev) // Limita a máximo 8 expertos a la vez
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-10 bg-[#0B0F1A] relative hide-scrollbar text-white font-sans min-h-screen">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col items-center justify-center text-center gap-4 mb-12">
          <div className="flex flex-col items-center justify-center text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tighter flex items-center gap-4 justify-center">
              <Users className="w-10 h-10 text-blue-500" />
              Audición de Expertos
            </h2>
            <p className="text-slate-500 mt-2 text-sm font-medium uppercase tracking-widest text-center">Consulta con mentes brillantes</p>
          </div>

          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10">
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Seleccionados</p>
              <p className="text-xl font-black text-blue-400">{selectedExperts.length} / 8</p>
            </div>
            <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Sidebar: Selección de Expertos */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 shadow-xl">
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-400" />
                Panel Profesional
              </h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 hide-scrollbar">
                {EXPERTS.map((expert) => (
                  <button
                    key={expert.id}
                    onClick={() => toggleExpert(expert.id)}
                    className={cn(
                      "w-full p-3 rounded-2xl border transition-all flex items-center gap-3 text-left group",
                      selectedExperts.includes(expert.id)
                        ? "bg-blue-600/20 border-blue-500/50 shadow-lg shadow-blue-900/20"
                        : "bg-white/5 border-white/5 hover:bg-white/10"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                      selectedExperts.includes(expert.id) ? "bg-blue-600 text-white" : "bg-white/5 text-slate-500"
                    )}>
                      <expert.icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className={cn(
                        "text-xs font-bold truncate",
                        selectedExperts.includes(expert.id) ? "text-white" : "text-slate-400"
                      )}>{expert.name}</p>
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter truncate">{expert.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Principal: Chat y Entradas */}
          <div className="lg:col-span-3 space-y-8">
            <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Rocket className="w-32 h-32 text-blue-500" />
              </div>

              <div className="relative z-10">
                <h3 className="text-2xl font-black text-white tracking-tight mb-2">¿Qué quieres consultar hoy?</h3>
                <p className="text-slate-500 text-sm mb-8">Plantea un desafío de negocio, una duda técnica o una estrategia de crecimiento.</p>

                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ej: ¿Cómo podemos optimizar la estructura de nuestro nuevo proyecto considerando costos y alcance en redes?"
                      className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[120px] resize-none"
                    />
                  </div>
                  <button
                    onClick={handleAudition}
                    disabled={isLoading || !query.trim() || selectedExperts.length === 0}
                    className="px-8 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-3xl transition-all flex flex-col items-center justify-center gap-2 shadow-xl shadow-blue-900/20 group"
                  >
                    {isLoading ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Iniciar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {responses.length > 0 ? (
                  responses.map((resp, idx) => {
                    const expert = EXPERTS.find(e => e.id === resp.expertId);
                    if (!expert) return null;

                    return (
                      <motion.div
                        key={expert.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white/5 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10 shadow-xl"
                      >
                        <div className="flex items-center gap-4 mb-6">
                          <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-black/20")}>
                            <expert.icon className={cn("w-7 h-7", expert.color)} />
                          </div>
                          <div>
                            <h4 className="text-xl font-black text-white tracking-tight">{expert.name}</h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{expert.role}</p>
                          </div>
                        </div>
                        <div className="markdown-body">
                          <ReactMarkdown>{resp.text}</ReactMarkdown>
                        </div>
                      </motion.div>
                    );
                  })
                ) : isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-6">
                    <div className="relative">
                      <div className="w-20 h-20 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                      <Brain className="w-8 h-8 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-bold text-lg">El panel está deliberando...</p>
                      <p className="text-slate-500 text-sm">Analizando datos y perspectivas estratégicas</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                    <Users className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Selecciona tus expertos e inicia la consulta</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
