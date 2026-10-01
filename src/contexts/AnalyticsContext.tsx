import React, { createContext, useContext, useMemo } from 'react';

// 1. Crear el contexto sin estados internos reactivos
const AnalyticsContext = createContext<any>(null);

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  // FIX EXTRA: Un objeto estático dummy que no usa useState.
  // Al no cambiar de referencia ni mutar estados de React, es FÍSICAMENTE IMPOSIBLE causar un bucle infinito.
  const mockAnalyticsValue = useMemo(() => ({
    isReady: true,
    logDeviceStats: () => Promise.resolve(true),
    trackScreenChange: () => {}
  }), []);

  return (
    <AnalyticsContext.Provider value={mockAnalyticsValue}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    return {
      isReady: true,
      logDeviceStats: () => Promise.resolve(true),
      trackScreenChange: () => {}
    };
  }
  return context;
};
