import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import webpush from "web-push";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Gemini AI Setup (Lazy Initialization)
let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY not found in environment. AI features will be limited.");
    }
    aiClient = new GoogleGenAI({ apiKey: apiKey || "dummy_key" });
  }
  return aiClient;
}

// Push Notifications Config
const vapidKeys = {
  publicKey: process.env.VITE_VAPID_PUBLIC_KEY || "",
  privateKey: process.env.VAPID_PRIVATE_KEY || ""
};

if (vapidKeys.publicKey && vapidKeys.privateKey) {
  try {
    // Basic length validation based on web-push requirements
    // 65 bytes (X9.62 point format) base64 encoded is typically ~88 chars.
    // If it's too short, it's definitely invalid.
    if (vapidKeys.publicKey.length < 80) {
        console.warn("Vapid public key too short. Push notifications disabled.");
    } else {
        webpush.setVapidDetails(
          "mailto:soporte@pinpro.app",
          vapidKeys.publicKey,
          vapidKeys.privateKey
        );
    }
  } catch (err) {
    console.warn("Failed to set VAPID details. Push notifications may not work. Check VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.", err);
  }
} else {
  console.warn("VAPID keys not fully configured in environment. Push notifications are disabled.");
}

// In-memory subscription store (In real app, use Firestore/DB)
const subscriptions: Record<string, any> = {};

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  app.use(express.json());

  // --- AI WEBHOOKS & PROXIES ---

  // Radar Oportunidades (n8n Integration)
  app.post("/api/radar/oportunidad", async (req, res) => {
    try {
      const { busqueda, distancia, status } = req.body;
      const ai = getAI();

      // Mock stats (based on user orchestrator logic)
      const stats = {
        totales: 32,
        profesionales: 31,
        clientes: 1,
        balance: "Bajo en clientes"
      };

      let urgencia = "MEDIA";
      if (stats.profesionales > stats.clientes * 10) {
        urgencia = "ALTA (Saturación de oferta)";
      }

      const prompt = `Actúa como el motor de crecimiento de PinPro.
Tenemos ${stats.profesionales} profesionales compitiendo por ${stats.clientes} clientes actuales.
Usa este desbalance para convencer al profesional de que el nivel ELITE (17$) es su única opción para destacar.

DATOS DE LA OPORTUNIDAD:
- Servicio buscado: ${busqueda || 'Reparación Técnica'}
- Distancia del usuario: ${distancia || '2'} km
- Estatus del profesional: ${status || 'GRATUITO'}
- Nivel de urgencia detectado: ${urgencia}

INSTRUCCIÓN:
Si el estatus es 'GRATUITO', redacta una alerta push persuasiva (máximo 150 caracteres) generando sentido de urgencia por los clientes que está perdiendo, incitándolo a activar su nivel ELITE por 17$.
Si el estatus es 'ELITE', redacta una alerta felicitándolo e indicándole que revise su bandeja para captar al cliente.

Genera la alerta push ahora:`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });

      res.json({
        success: true,
        message: result.text,
        stats,
        urgencia
      });
    } catch (err) {
      console.error("Radar Error:", err);
      res.status(500).json({ error: "Error procesando radar de oportunidades" });
    }
  });

  // Vercel / Infra Error Diagnosis
  app.post("/api/infra/error", async (req, res) => {
    try {
      const { error_message, context } = req.body;
      const ai = getAI();

      const prompt = `Analiza el siguiente error de infraestructura de PinPro y busca una solución técnica.
ERROR: ${error_message}
CONTEXTO: ${JSON.stringify(context || {})}

Proporciona un diagnóstico breve y los pasos para solucionarlo.`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });

      res.json({
        success: true,
        diagnosis: result.text
      });
    } catch (err) {
      console.error("Infra Diagnosis Error:", err);
      res.status(500).json({ error: "Error en el sistema de diagnóstico de IA" });
    }
  });

  // API to save push subscription
  app.post("/api/push/register", (req, res) => {
    const { userId, subscription } = req.body;
    if (userId && subscription) {
      subscriptions[userId] = subscription;
      console.log(`Registered push subscription for ${userId}`);
      res.status(201).json({});
    } else {
      res.status(400).json({ error: "Missing userId or subscription" });
    }
  });

  // Socket.io logic
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("register-user", (userId) => {
      socket.join(userId);
      console.log(`Socket ${socket.id} registered as user ${userId}`);
    });

    socket.on("join-room", (room) => {
      socket.join(room);
      console.log(`User ${socket.id} joined room: ${room}`);
    });

    socket.on("send-message", async (data) => {
      // data: { room, author, authorName, text, time, recipientId }
      socket.to(data.room).emit("receive-message", data);

      // Push notification fallback if recipient is provided
      if (data.recipientId && subscriptions[data.recipientId]) {
        try {
          const payload = JSON.stringify({
            title: `💬 Mensaje de ${data.authorName || 'PinPro'}`,
            body: data.text,
            url: `/tracking/${data.room}`
          });
          await webpush.sendNotification(subscriptions[data.recipientId], payload);
        } catch (err) {
          console.error("Error sending push notification", err);
        }
      }
      console.log(`Message in ${data.room} from ${data.author}: ${data.text}`);
    });

    // WebRTC Signaling
    socket.on("call-user", async (data) => {
      // data: { offer, to, fromId, fromName }
      socket.to(data.to).emit("incoming-call", data);

      // Push notification fallback for calls
      if (data.to && subscriptions[data.to]) {
        try {
          const payload = JSON.stringify({
            title: `📞 Llamada Entrante`,
            body: `${data.fromName || 'Alguien'} te está llamando`,
            url: `/tracking/call` // Or appropriate tracking page
          });
          await webpush.sendNotification(subscriptions[data.to], payload);
        } catch (err) {
          console.error("Error sending call push notification", err);
        }
      }
    });

    socket.on("answer-call", (data) => {
      // data: { answer, to }
      socket.to(data.to).emit("call-answered", { answer: data.answer });
    });

    socket.on("ice-candidate", (data) => {
      // data: { candidate, to }
      socket.to(data.to).emit("ice-candidate", { candidate: data.candidate });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // API routes (Placeholder)
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
