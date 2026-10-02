import React, { useState, useEffect } from 'react';

export default function SafeHydration({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mientras no esté montado, mostramos un fondo negro limpio
  if (!mounted) return <div style={{backgroundColor: '#000', height: '100vh', width: '100vw'}} />;

  return <>{children}</>;
}
