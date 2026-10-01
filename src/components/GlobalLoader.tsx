import React, { useEffect, useState } from 'react';

const GlobalLoader = () => {
  const [loadingText, setLoadingText] = useState("INICIALIZANDO ENTORNOS...");

  useEffect(() => {
    const timer1 = setTimeout(() => setLoadingText("VERIFICANDO CONECTIVIDAD..."), 1500);
    const timer2 = setTimeout(() => setLoadingText("SINTONIZANDO GEOLOCALIZACIÓN..."), 3000);

    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, []);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh',
      backgroundColor: '#030303', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center', zIndex: 9999
    }}>
      <div className="radar-spinner"></div>

      <p style={{
        color: '#00ffff', fontFamily: 'monospace', fontSize: '11px',
        letterSpacing: '3px', marginTop: '30px', textShadow: '0 0 5px rgba(0,255,255,0.5)'
      }}>
        {loadingText}
      </p>
    </div>
  );
};

export default GlobalLoader;
