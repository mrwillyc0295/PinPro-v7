import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

type ViewMode = 'mobile' | 'tablet' | 'desktop';

interface ViewContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  realDevice: ViewMode;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export function ViewProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>('mobile');
  const [realDevice, setRealDevice] = useState<ViewMode>('mobile');

  // Helper to detect real device
  const detectRealDevice = (): ViewMode => {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  };

  useEffect(() => {
    const detected = detectRealDevice();
    setRealDevice(detected);

    // Initial preference load
    const loadDefaultMode = async () => {
      const saved = localStorage.getItem('pinpro_view_mode');
      if (saved) {
        setViewMode(saved as ViewMode);
      } else {
        // Fetch most common device from DB if no preference
        try {
          const statsDoc = await getDoc(doc(db, 'system_analytics', 'device_usage'));
          if (statsDoc.exists()) {
            const data = statsDoc.data();
            const counts = [
              { mode: 'mobile', count: data.mobile || 0 },
              { mode: 'tablet', count: data.tablet || 0 },
              { mode: 'desktop', count: data.desktop || 0 }
            ];
            const max = counts.reduce((prev, current) => (prev.count > current.count) ? prev : current);
            setViewMode(max.mode as ViewMode);
          } else {
            setViewMode(detected);
          }
        } catch (error) {
          console.error("Error fetching device stats:", error);
          setViewMode(detected);
        }
      }
    };

    loadDefaultMode();

    // Log this visit's device if it's a new session
    const sessionKey = `pinpro_logged_${new Date().toISOString().split('T')[0]}`;
    if (!sessionStorage.getItem(sessionKey)) {
      const logDevice = async () => {
        try {
          const statsRef = doc(db, 'system_analytics', 'device_usage');
          await updateDoc(statsRef, {
            [detected]: increment(1),
            updatedAt: serverTimestamp()
          });
          sessionStorage.setItem(sessionKey, 'true');
        } catch (error) {
          console.warn("Failed to log device analytics - stats might not be initialized", error);
        }
      };
      logDevice();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pinpro_view_mode', viewMode);
  }, [viewMode]);

  return (
    <ViewContext.Provider value={{ viewMode, setViewMode, realDevice }}>
      {children}
    </ViewContext.Provider>
  );
}

export function useView() {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error('useView must be used within a ViewProvider');
  }
  return context;
}
