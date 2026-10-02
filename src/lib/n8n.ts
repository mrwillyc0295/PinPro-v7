export type N8NEventType =
  | 'nueva_solicitud_servicio'
  | 'usuario_registrado'
  | 'pago_completado'
  | 'alerta_emergencia'
  | string; // Permite eventos personalizados

export interface N8NEventPayload {
  eventId?: string;
  type: N8NEventType;
  timestamp: string;
  data: any;
  metadata?: {
    userId?: string;
    source?: string;
    [key: string]: any;
  };
}

/**
 * Servicio para manejar integraciones con n8n Webhooks.
 * La URL base del webhook debe estar configurada en las variables de entorno:
 * VITE_N8N_WEBHOOK_URL
 */
class N8NService {
  private webhookUrl: string | undefined;

  constructor() {
    // Usamos variables de entorno para la configuración
    this.webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
  }

  /**
   * Envía un evento al flujo de trabajo de n8n.
   * Si la URL del webhook no está configurada, registra una advertencia pero no falla,
   * permitiendo su uso en entornos de desarrollo local sin configuración completa.
   *
   * @param eventType Tipo de evento que se está disparando
   * @param payload Datos asociados al evento
   * @param metadata Información adicional de contexto (opcional)
   */
  async sendEvent(eventType: N8NEventType, payload: any, metadata?: any): Promise<boolean> {
    const eventParams: N8NEventPayload = {
      eventId: crypto.randomUUID(),
      type: eventType,
      timestamp: new Date().toISOString(),
      data: payload,
      metadata: {
        source: 'pinpro_web',
        ...metadata
      }
    };

    console.log(`[n8n][${eventType}] Intentando enviar evento a webhook...`);

    if (!this.webhookUrl) {
      console.warn(`[n8n][${eventType}] URL del Webhook de n8n no configurada (VITE_N8N_WEBHOOK_URL). Ignorando evento.`);
      return false;
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': \`Bearer \${import.meta.env.VITE_N8N_API_KEY}\`, // Opcional si hay autenticación
        },
        body: JSON.stringify(eventParams),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
      }

      console.log(`[n8n][${eventType}] Evento enviado exitosamente a n8n. ID: ${eventParams.eventId}`);
      return true;

    } catch (error) {
      console.error(`[n8n][${eventType}] Fallo al enviar evento a n8n:`, error);
      // En un entorno de producción, aquí podríamos considerar reintentos,
      // o guardar el evento fallido en una cola local para reintentarlo luego.
      return false;
    }
  }

  /**
   * Helper para una solicitud de servicio específicamente
   */
  async notifyNewServiceRequest(requestData: any, userId?: string) {
    return this.sendEvent('nueva_solicitud_servicio', requestData, { userId });
  }

  /**
   * Helper para emergencias
   */
  async notifyEmergencyAlert(alertData: any, userId?: string) {
    return this.sendEvent('alerta_emergencia', alertData, { userId, priority: 'high' });
  }
}

// Exportar una instancia única (Singleton)
export const n8nService = new N8NService();
