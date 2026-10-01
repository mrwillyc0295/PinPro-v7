/**
 * PinPro Live - Sistema de Telemetría para Master Brain
 * Detecta cuellos de botella en la navegación y bloqueos de seguridad.
 */
export const trackScreenTransition = (fromScreen: string, toScreen: string, authState: any) => {
  const startTime = Date.now();
  console.log(`[Master Brain] Iniciando transición: ${fromScreen} ➡️ ${toScreen}`);

  // Evaluar estado de seguridad inmediato antes del cambio
  if (authState?.isAnonymous && toScreen === '/mapa') {
    console.warn(`[Master Brain Alert] Usuario Anónimo intentando forzar pantalla protegida (${toScreen}). Posible retraso por rechazo latente de Firebase.`);
  }

  return {
    resolveTransition: (status: 'SUCCESS' | 'BLOCKED' | 'TIMEOUT', details?: string) => {
      const duration = Date.now() - startTime;
      const report = {
        event: "SCREEN_TRANSITION_REPORT",
        project: "PinPro Live",
        route: { from: fromScreen, to: toScreen },
        duration_ms: duration,
        result_status: status,
        user_id: authState?.uid || authState?.userId || 'no_auth',
        is_anonymous: authState?.isAnonymous || false,
        error_details: details || 'none'
      };

      // Formato JSON limpio para que el log sea leído directamente por la IA
      console.log("[[MASTER_BRAIN_TELEMETRY]]", JSON.stringify(report, null, 2));
    }
  };
};
