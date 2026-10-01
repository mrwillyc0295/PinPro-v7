import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  Loader2,
  AlertCircle,
  MapPin,
  Key,
  Radio,
  Smartphone,
  Activity as ActivityIcon,
  ChevronRight,
  RefreshCw,
  LogOut,
} from "lucide-react";

export const OrquestadorNavegacion: React.FC = () => {
  const navigate = useNavigate();
  const [estadoLog, setEstadoLog] = useState(
    "Iniciando sistema de rastreo de PinPro...",
  );
  const [estacionActual, setEstacionActual] = useState<1 | 2 | 3 | 4 | null>(1);
  const [statusMap, setStatusMap] = useState({
    estacion1: "pending", // pending, success, fail
    estacion2: "pending",
    estacion3: "pending",
    estacion4: "pending",
  });
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [resolvedRole, setResolvedRole] = useState<string | null>(null);

  useEffect(() => {
    console.log("🚀 [ESTACIÓN 1] Escuchando cambios de Auth en Firebase...");
    setEstadoLog("Verificando sesión activa con Firebase Auth...");
    setEstacionActual(1);

    const desescribir = auth.onAuthStateChanged(async (usuarioAuth) => {
      if (!usuarioAuth) {
        console.warn(
          "❌ [ESTACIÓN 1 FAIL] No hay usuario autenticado. Redirigiendo a registro/splash.",
        );
        setEstadoLog(
          "Usuario no detectado. Preparando redirección a terminal de registro...",
        );
        setStatusMap((prev) => ({ ...prev, estacion1: "fail" }));
        setTimeout(() => {
          navigate("/inicio-registro");
        }, 1500);
        return;
      }

      setStatusMap((prev) => ({ ...prev, estacion1: "success" }));

      // GESTIÓN DE INVITADOS (Zero Friction)
      if (usuarioAuth.isAnonymous) {
        console.log("🔓 [INVITADO] Sesión anónima detectada. Bypass de perfil.");
        setEstadoLog("Acceso de Invitado habilitado. Sincronizando con el Radar...");
        setStatusMap((prev) => ({
          ...prev,
          estacion2: "success",
          estacion3: "success",
          estacion4: "success"
        }));
        setEstacionActual(4);
        setTimeout(() => {
          navigate("/mapa");
        }, 1500);
        return;
      }

      console.log(
        `✅ [ESTACIÓN 2] Usuario autenticado con UID: ${usuarioAuth.uid}. Buscando perfil en Firestore...`,
      );
      setEstadoLog(
        "Estación 2 activa. Conectando con la base de datos distribuida de PinPro...",
      );
      setEstacionActual(2);

      try {
        const colecciones = [
          "usuarios",
          "clientes",
          "profesionales",
          "referidores",
          "agentes",
        ];
        let userDocData: any = null;
        let intentos = 0;
        const maxIntentos = 3; // Intentos de gracia para registros nuevos

        // Bucle de tolerancia para esperar a la base de datos
        while (intentos < maxIntentos && !userDocData) {
          if (intentos > 0) {
            console.log(
              `⏳ [REINTENTO ${intentos}] Esperando propagación de Firestore para nuevo registro...`,
            );
            setEstadoLog(
              `Sincronizando credenciales de alta... (Intento ${intentos + 1}/${maxIntentos})`,
            );
            // Pausa de 1.5 segundos entre reintentos para dar tiempo a la escritura
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }

          console.log(`📡 [ESTACIÓN 2] Consultando colecciones en paralelo...`);
          // Ejecución en paralelo: Reduce drásticamente el consumo de red y el tiempo de respuesta
          const promesas = colecciones.map((col) =>
            getDoc(doc(db, col, usuarioAuth.uid)),
          );
          const snapshots = await Promise.all(promesas);

          // Evaluamos si el documento existe en alguna de las colecciones
          for (const docSnap of snapshots) {
            if (docSnap.exists()) {
              userDocData = docSnap.data();
              break; // ¡Encontrado! Salimos del bucle interno
            }
          }

          intentos++;
        }

        if (!userDocData) {
          console.error(
            "❌ [ESTACIÓN 3 FAIL] El documento no se creó en ninguna colección tras los reintentos.",
          );
          setEstadoLog("Error de Sincronización: Documento de perfil ausente.");
          setStatusMap((prev) => ({
            ...prev,
            estacion2: "success",
            estacion3: "fail",
          }));
          setEstacionActual(3);
          setErrorDetails(
            "El usuario tiene sesión activa, pero no se encontró un registro de Cliente, Profesional o Referidor en Firestore. ¿Completaste el proceso de alta?",
          );
          return;
        }

        setUserData(userDocData);
        setStatusMap((prev) => ({
          ...prev,
          estacion2: "success",
          estacion3: "success",
        }));
        console.log(
          "✅ [ESTACIÓN 3] Datos de Firestore recuperados con éxito:",
          userDocData,
        );

        const currentRole = userDocData.role;
        if (!currentRole) {
          console.error(
            "❌ [ESTACIÓN 3.5 FAIL] El documento existe, pero el campo 'role' está vacío o indefinido.",
          );
          setEstadoLog(
            "Error de Privilegio: El usuario no tiene un rol válido asignado.",
          );
          setStatusMap((prev) => ({ ...prev, estacion3: "fail" }));
          setEstacionActual(3);
          setErrorDetails(
            "El registro del perfil existe pero no posee el atributo 'role' asignado (Cliente/Profesional).",
          );
          return;
        }

        setResolvedRole(currentRole);
        setEstacionActual(4);
        console.log(
          `🚀 [ESTACIÓN 4] Todo listo. Redirigiendo a la vista del rol: ${currentRole}`,
        );
        setEstadoLog(`Cargando entorno de mapa y radar para: ${currentRole}`);
        setStatusMap((prev) => ({ ...prev, estacion4: "success" }));

        // Automatización de re-rutamiento inteligente
        setTimeout(() => {
          const uRole = currentRole.toUpperCase();
          if (uRole === "PROFESIONAL") {
            navigate("/pro/dashboard");
          } else if (uRole === "ADMIN") {
            navigate("/admin");
          } else if (uRole === "REFERIDOR" || uRole === "AGENTE") {
            navigate("/dashboard-referidor");
          } else {
            navigate("/mapa");
          }
        }, 1800);
      } catch (error: any) {
        console.error("💥 [CRASH EN BASE DE DATOS]:", error);
        setEstadoLog(`Fallo crítico de comunicación con la nube.`);
        setStatusMap((prev) => ({
          ...prev,
          estacion2: "fail",
          estacion3: "fail",
        }));
        setErrorDetails(
          error.message ||
            "Error desconocido durante la lectura del perfil Firestore.",
        );
      }
    });

    return () => desescribir();
  }, [navigate]);

  return (
    <div className="min-h-[100dvh] bg-[#050508] text-white flex flex-col items-center justify-center p-6 select-none font-sans relative overflow-hidden">
      {/* Aesthetic ambient lighting effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Main Orchestration Node Card */}
      <div className="w-full max-w-md bg-stone-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-8 relative z-10 shadow-2xl">
        {/* Hologram Pulse Header */}
        <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-white/5">
          <div className="relative">
            <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center">
              <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-[#050508] animate-bounce" />
          </div>
          <div>
            <span className="text-[9px] font-mono tracking-widest text-[#00FFFF] uppercase font-bold">
              PinPro Live Node
            </span>
            <h1 className="text-base font-black tracking-tight text-white leading-tight">
              Orquestador de Sincronización
            </h1>
          </div>
        </div>

        {/* Dynamic State Console Screen */}
        <div className="p-4 bg-black/60 border border-white/5 rounded-2xl mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono tracking-wide text-stone-500">
              ESTADO_DEL_SISTEMA:
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/45 border border-cyan-800/10 px-2 py-0.5 rounded-full">
              En Vivo
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin mt-0.5 flex-shrink-0" />
            <p className="text-xs font-mono text-stone-300 leading-relaxed break-words">
              {estadoLog}
            </p>
          </div>
        </div>

        {/* Checkpoint Station Stack Map */}
        <div className="space-y-3.5 mb-6">
          {/* Station 1: Firebase Auth */}
          <div
            className={`flex items-start justify-between p-3.5 rounded-xl border transition-all ${
              estacionActual === 1
                ? "bg-cyan-500/5 border-cyan-500/25"
                : "bg-stone-950/40 border-white/5"
            }`}
          >
            <div className="flex gap-3">
              <div className="mt-1 flex items-center justify-center">
                <Key className="w-4 h-4 text-[#B026FF]" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white mb-0.5">
                  Estación 1: Autenticación Coeficiente
                </h3>
                <p className="text-[10px] text-stone-400 leading-normal">
                  Coordinando canal criptográfico.
                </p>
              </div>
            </div>
            <div className="flex-shrink-0">
              {statusMap.estacion1 === "success" && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/30 px-2 py-0.5 border border-emerald-500/10 rounded-md font-semibold">
                  Listo
                </span>
              )}
              {statusMap.estacion1 === "fail" && (
                <span className="text-[10px] font-mono text-rose-400 bg-rose-950/30 px-2 py-0.5 border border-rose-500/10 rounded-md font-semibold">
                  Error
                </span>
              )}
              {statusMap.estacion1 === "pending" && (
                <span className="text-[10px] font-mono text-stone-500">
                  Espera_
                </span>
              )}
            </div>
          </div>

          {/* Station 2: Cloud Firestore Handshake */}
          <div
            className={`flex items-start justify-between p-3.5 rounded-xl border transition-all ${
              estacionActual === 2
                ? "bg-cyan-500/5 border-cyan-500/25"
                : "bg-stone-950/40 border-white/5"
            }`}
          >
            <div className="flex gap-3">
              <div className="mt-1 flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white mb-0.5">
                  Estación 2: Conexión de Base de Datos
                </h3>
                <p className="text-[10px] text-stone-400 leading-normal">
                  Solicitando paquete de credenciales.
                </p>
              </div>
            </div>
            <div className="flex-shrink-0">
              {statusMap.estacion2 === "success" && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/30 px-2 py-0.5 border border-emerald-500/10 rounded-md font-semibold">
                  Listo
                </span>
              )}
              {statusMap.estacion2 === "fail" && (
                <span className="text-[10px] font-mono text-rose-400 bg-rose-950/30 px-2 py-0.5 border border-rose-500/10 rounded-md font-semibold">
                  Fallo
                </span>
              )}
              {statusMap.estacion2 === "pending" && (
                <span className="text-[10px] font-mono text-stone-500">
                  Espera_
                </span>
              )}
            </div>
          </div>

          {/* Station 3: Document Verification */}
          <div
            className={`flex items-start justify-between p-3.5 rounded-xl border transition-all ${
              estacionActual === 3
                ? "bg-cyan-500/5 border-cyan-500/25"
                : "bg-stone-950/40 border-white/5"
            }`}
          >
            <div className="flex gap-3">
              <div className="mt-1 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white mb-0.5">
                  Estación 3: Deserialización de Perfil
                </h3>
                <p className="text-[10px] text-stone-400 leading-normal">
                  Leyendo registros, alcances y roles activos.
                </p>
              </div>
            </div>
            <div className="flex-shrink-0">
              {statusMap.estacion3 === "success" && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/30 px-2 py-0.5 border border-emerald-500/10 rounded-md font-semibold">
                  Listo
                </span>
              )}
              {statusMap.estacion3 === "fail" && (
                <span className="text-[10px] font-mono text-rose-400 bg-rose-950/30 px-2 py-0.5 border border-rose-500/10 rounded-md font-semibold">
                  Fallo
                </span>
              )}
              {statusMap.estacion3 === "pending" && (
                <span className="text-[10px] font-mono text-stone-500">
                  Espera_
                </span>
              )}
            </div>
          </div>

          {/* Station 4: Route Orchestration */}
          <div
            className={`flex items-start justify-between p-3.5 rounded-xl border transition-all ${
              estacionActual === 4
                ? "bg-cyan-500/5 border-cyan-500/25"
                : "bg-stone-950/40 border-white/5"
            }`}
          >
            <div className="flex gap-3">
              <div className="mt-1 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-pink-500" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white mb-0.5">
                  Estación 4: Sincronización de Radar
                </h3>
                <p className="text-[10px] text-stone-400 leading-normal">
                  Canalizando interfaces de mapas de calor.
                </p>
              </div>
            </div>
            <div className="flex-shrink-0">
              {statusMap.estacion4 === "success" && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/30 px-2 py-0.5 border border-emerald-500/10 rounded-md font-semibold">
                  Listo
                </span>
              )}
              {statusMap.estacion4 === "fail" && (
                <span className="text-[10px] font-mono text-rose-400 bg-rose-950/30 px-2 py-0.5 border border-rose-500/10 rounded-md font-semibold">
                  Fallo
                </span>
              )}
              {statusMap.estacion4 === "pending" && (
                <span className="text-[10px] font-mono text-stone-500">
                  Espera_
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Diagnostic Error Panel */}
        <AnimatePresence>
          {errorDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6 p-4 bg-rose-950/30 border border-rose-500/20 rounded-2xl"
            >
              <div className="flex gap-2.5">
                <AlertCircle className="w-4.5 h-4.5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[11px] font-bold text-rose-300 uppercase tracking-wider mb-1">
                    Diagnóstico del Hub
                  </h4>
                  <p className="text-[10px] font-mono text-red-300 leading-relaxed leading-normal">
                    {errorDetails}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-200 text-[10px] font-bold py-2 rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reintentar Diagnóstico
                </button>
                <button
                  onClick={() => {
                    auth.signOut();
                    navigate("/inicio-registro");
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#15151a] hover:bg-[#1a1a24] border border-white/5 text-stone-300 text-[10px] font-bold py-2 rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  <LogOut className="w-3 h-3 text-stone-400" />
                  Cerrar Sesión
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Motivational branding footer */}
        <div className="text-center">
          <p className="text-[9px] text-stone-500">
            Desarrollado para potenciar marcas autónomas de alto rendimiento.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrquestadorNavegacion;
