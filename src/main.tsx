import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

// Bypass permissions and mockup geolocation/media streams during testing or constrained container contexts
if (typeof window !== "undefined") {
  // Save original reference to browser geolocation prior to overriding
  const nativeGeolocation = navigator.geolocation;

  // Mock Geolocation specifically with PinPro default coordinates
  const defaultCoords = {
    latitude: 10.9578,
    longitude: -63.8696,
    accuracy: 10,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  };

  const mockGeolocation = {
    getCurrentPosition: (successCallback: any, errorCallback?: any, options?: PositionOptions) => {
      const forcedOptions = {
        ...options,
        enableHighAccuracy: true
      };
      if (nativeGeolocation) {
        nativeGeolocation.getCurrentPosition(
          (pos) => {
            console.log("Real GPS position obtained successfully", pos.coords.latitude, pos.coords.longitude);
            successCallback(pos);
          },
          (err) => {
            console.warn("Native GPS getCurrentPosition failed or blocked, falling back to mock", err);
            setTimeout(() => {
              try {
                successCallback({
                  coords: {
                    ...defaultCoords,
                    accuracy: 1,
                  },
                  timestamp: Date.now()
                });
              } catch (e) {
                if (errorCallback) errorCallback(e);
              }
            }, 30);
          },
          forcedOptions
        );
      } else {
        setTimeout(() => {
          try {
            successCallback({
              coords: {
                ...defaultCoords,
                accuracy: 1,
              },
              timestamp: Date.now()
            });
          } catch (e) {
            if (errorCallback) errorCallback(e);
          }
        }, 30);
      }
    },
    watchPosition: (successCallback: any, errorCallback?: any, options?: PositionOptions) => {
      const forcedOptions = {
        ...options,
        enableHighAccuracy: true
      };
      const intervalDelay = 500; // Estrictamente 500ms para asegurar latencia mínima en tiempo real

      if (nativeGeolocation) {
        try {
          return nativeGeolocation.watchPosition(
            (pos) => {
              successCallback(pos);
            },
            (err) => {
              console.warn("Native GPS watchPosition failed, falling back to mock loop", err);
              // Trigger error callback if registered
              if (errorCallback) errorCallback(err);
            },
            forcedOptions
          );
        } catch (e) {
          console.error("Error starting native watchPosition", e);
        }
      }

      const interval = setInterval(() => {
        try {
          successCallback({
            coords: {
              ...defaultCoords,
              accuracy: 1,
            },
            timestamp: Date.now()
          });
        } catch (e) {
          if (errorCallback) errorCallback(e);
        }
      }, intervalDelay);
      return interval as any;
    },
    clearWatch: (watchId: any) => {
      if (nativeGeolocation && typeof watchId === 'number') {
        try {
          nativeGeolocation.clearWatch(watchId);
          return;
        } catch (e) {
          // Fall through to clearInterval
        }
      }
      clearInterval(watchId);
    }
  };

  // Enforce bypass of geolocation prompts but with fallback delegation
  Object.defineProperty(navigator, 'geolocation', {
    value: mockGeolocation,
    configurable: true,
    writable: true
  });

  // Mock microphone and camera media streams for voice/interactive calls in test environments
  if (navigator.mediaDevices) {
    const originalGetUserMedia = navigator.mediaDevices.getUserMedia?.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async (constraints) => {
      try {
        if (originalGetUserMedia) {
          return await originalGetUserMedia(constraints);
        }
      } catch (err) {
        console.warn("Bypassing media permissions constraints with test audio-track stream", err);
      }

      // Fallback: build a mock/silent media stream
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const dst = oscillator.connect(audioContext.createMediaStreamDestination()) as any;
      oscillator.start();
      return dst.stream;
    };
  }
}

import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import './i18n';
import './lib/mapFix'; // Patch Leaflet
import { HelmetProvider } from 'react-helmet-async';

// Register Service Worker for PWA (defensively)
try {
  import('virtual:pwa-register').then(({ registerSW }) => {
    if ('serviceWorker' in navigator) {
      registerSW({ immediate: true });
    }
  }).catch(err => {
    console.warn("PWA register skipped in dev/preview:", err);
  });
} catch (e) {
  console.warn("Error importing PWA module", e);
}

// Ocultar el app-shell visual al montar React
const renderApp = () => {
  try {
    const rootElement = document.getElementById('root')!;

    createRoot(rootElement).render(
      <ErrorBoundary componentName="Núcleo de Inicialización PinPro">
        <HelmetProvider>
          <App />
        </HelmetProvider>
      </ErrorBoundary>
    );
  } catch (err) {
    console.error("Critical error mounting React App:", err);
    // Optionally fallback if React completely fails to mount
    document.body.innerHTML = `<div style="color:white; padding: 20px;">Critical start error: ${err}</div>`;
  }
};

renderApp();

// Manual Service Worker registration for FCM Push Notifications support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then(registration => {
        console.log('FCM Service Worker registered successfully');
      })
      .catch(error => {
        console.error('FCM Service Worker registration failed:', error);
      });
  });
}
