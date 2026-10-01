import { useEffect, useRef, useCallback } from 'react';

// Fórmula matemática para calcular la distancia exacta entre dos puntos GPS
const calcularDistanciaHaversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const RadioTierra = 6371e3; // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return RadioTierra * c; // Devuelve la distancia en metros
};

export const useRadarProximidad = (miUbicacion: { lat: number, lng: number } | null, profesionales: any[], radioMetros = 500) => {
  // useRef actúa como nuestra memoria a corto plazo para evitar "spam de voz".
  // Si ya le avisamos al usuario sobre un profesional, guardamos su ID aquí.
  const yaNotificadosRef = useRef(new Set<string>());

  useEffect(() => {
    // Si no tenemos la ubicación del usuario o el mapa aún no carga, no hacemos nada
    if (!miUbicacion || !profesionales.length) return;

    profesionales.forEach((profesional) => {
      // Regla estricta: Solo disparamos la alerta si el profesional está certificado
      if (!profesional.certification?.isCertified) return;

      const distancia = calcularDistanciaHaversine(
        miUbicacion.lat,
        miUbicacion.lng,
        profesional.lat,
        profesional.lng
      );

      // Verificamos si está dentro del radio estipulado y si NO ha sido notificado antes
      if (distancia <= radioMetros && !yaNotificadosRef.current.has(profesional.id)) {

        // 1. Lo registramos en la memoria para no volver a repetirlo
        yaNotificadosRef.current.add(profesional.id);

        try {
          // 2. Redondeamos la distancia para que la voz suene natural (ej: "450 metros")
          const distanciaRedondeada = Math.round(distancia);

          // 3. Disparamos la síntesis de voz nativa del navegador
          const mensajeVoz = new SpeechSynthesisUtterance(
            `Pin Pro radar: ${profesional.fullName}, ${profesional.oficio || 'profesional'} certificado, se encuentra a ${distanciaRedondeada} metros de ti.`
          );

          mensajeVoz.lang = 'es-ES'; // Configuración de idioma español
          mensajeVoz.rate = 1.0;     // Velocidad normal de lectura

          window.speechSynthesis.speak(mensajeVoz);
        } catch (error) {
          console.error("Error al disparar síntesis de voz:", error);
        }
      }
    });
  }, [miUbicacion, profesionales, radioMetros]);

  const limpiarMemoriaRadar = useCallback(() => {
    yaNotificadosRef.current.clear();
  }, []);

  return { limpiarMemoriaRadar };
};
