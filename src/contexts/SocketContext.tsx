import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { safeStringify } from "../lib/jsonUtils";

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  requestPushPermission: () => Promise<boolean>;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  requestPushPermission: async () => false
});

export const useSocket = () => useContext(SocketContext);

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  const registerSubscription = async (subscription: PushSubscription) => {
    if (!user) return;
    const socketUrl = import.meta.env.VITE_SOCKET_URL || '';
    await fetch(`${socketUrl}/api/push/register`, {
      method: 'POST',
      body: safeStringify({
        userId: user.uid,
        subscription: subscription.toJSON()
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('Push subscription registered');
  };

  const requestPushPermission = async (): Promise<boolean> => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !user) {
      return false;
    }

    try {
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription && VAPID_PUBLIC_KEY) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: VAPID_PUBLIC_KEY
          });
        }

        if (subscription) await registerSubscription(subscription);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error requesting push permission:', err);
      return false;
    }
  };

  useEffect(() => {
    const socketEndpoint = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const newSocket = io(socketEndpoint);

    newSocket.on('connect', () => {
      console.log('Socket coupled:', newSocket.id);
      setConnected(true);

      if (user) {
        newSocket.emit('register-user', user.uid);
      }
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    setSocket(newSocket);

    // Push Notification Setup
    const setupPush = async () => {
      if (!user || !('Notification' in window)) return;

      try {
        const permission = Notification.permission;
        if (permission !== 'granted') return;

        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription && VAPID_PUBLIC_KEY) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: VAPID_PUBLIC_KEY
          });
        }

        if (subscription) await registerSubscription(subscription);
      } catch (err) {
        console.error('Error setting up push notifications automatically:', err);
      }
    };

    if (user && 'serviceWorker' in navigator) {
      setupPush();
    }

    return () => {
      newSocket.close();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, connected, requestPushPermission }}>
      {children}
    </SocketContext.Provider>
  );
};
