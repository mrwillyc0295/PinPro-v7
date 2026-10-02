import { useState, useEffect, useMemo, ReactNode, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import DOMPurify from "dompurify";
import SafeHydration from "../components/SafeHydration";
import { MAP_CATEGORIES, SERVICE_CATEGORIES } from "../constants/services";
import {
  Menu,
  ChevronDown,
  Bell,
  Search,
  SlidersHorizontal,
  Grid,
  Wrench,
  Sparkles,
  MonitorSmartphone,
  Dumbbell,
  Layers,
  LocateFixed,
  Clock,
  CheckCircle2,
  TrendingUp,
  Star,
  X,
  Heart,
  Scissors,
  Car,
  Camera,
  BookOpen,
  Briefcase,
  Trash2,
  Dog,
  ShieldCheck,
  Zap,
  Thermometer,
  Key,
  Hammer,
  Paintbrush,
  HardHat,
  Droplets,
  Microscope,
  Stethoscope,
  Brain,
  Apple,
  Activity,
  Smartphone,
  Cpu,
  Shield,
  Wifi,
  Code,
  Palette,
  Share2 as ShareIcon,
  Gamepad2,
  Printer,
  Truck,
  Music,
  Languages,
  Calculator,
  Building2,
  Scale,
  FileText,
  Ship,
  Baby,
  Shirt,
  Waves,
  Lightbulb,
  Wind,
  Syringe,
  Plus,
  Wand2,
  UserRound,
  WashingMachine,
  Bike,
  Package,
  Instagram,
  Facebook,
  MapPin,
  Navigation,
  AlertCircle,
  Minus,
  Loader2,
  Radio,
  Globe,
  Monitor,
  Tablet,
  BadgeCheck,
  Check,
  Maximize2,
} from "lucide-react";

import { useDebounce } from "use-debounce";
import { useView } from "../contexts/ViewContext";
import {
  collection,
  onSnapshot,
  query,
  where,
  setDoc,
  doc,
  serverTimestamp,
  orderBy,
  limit,
  updateDoc,
  startAfter,
  getDocs
} from "firebase/firestore";
import { calculateRankingScore } from "../services/rankingService";
import { db, auth } from "../firebase";
import { SafeBoundary } from "../components/SafeBoundary";
import ProfessionalCard from "../components/ProfessionalCard";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../lib/utils";
import { spanishSpeakingCountriesMenu } from "../constants/countries";
import { handleFirestoreError, OperationType } from "../lib/firestoreErrorHandler";
import { logSearchQuery } from "../services/seoService";
import SearchBar from "../components/home/SearchBar";
import VoiceAssistant from "../components/VoiceAssistant";
import { findProfessionals } from "../services/professionalFinder";
import ServiceCategories from "../components/home/ServiceCategories";
import { useFirestoreSubscription } from "../hooks/useFirestoreSubscription";
import { Marker, useMap, Popup } from "react-leaflet";
import MapContainer from "../components/MapContainer";

import useSupercluster from "use-supercluster";
import L from "leaflet";
import { motion, AnimatePresence } from "motion/react";
import { opcionesMapa } from "../lib/mapOptions";
import MapPrefetchControl from "../components/MapPrefetchControl";

import { PROFESSION_ICON_MAP, getDistance, getCategoryForProfession } from "../utils/homeUtils";
import { ProfessionalHorizontalList } from "../components/home/ProfessionalHorizontalList";

function RecenterMap({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  const lastCenteredRef = useRef<[number, number] | null>(null);
  const lastZoomRef = useRef<number | null>(null);

  useEffect(() => {
    const hasCenterChanged = !lastCenteredRef.current ||
      lastCenteredRef.current[0] !== center[0] ||
      lastCenteredRef.current[1] !== center[1];
    const hasZoomChanged = lastZoomRef.current !== zoom;

    if (hasCenterChanged || hasZoomChanged) {
      map.setView(center, zoom);
      lastCenteredRef.current = center;
      lastZoomRef.current = zoom;
    }
  }, [center, zoom, map]);
  return null;
}

function MapResizer() {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const handleResize = () => {
      try {
        if (map && map.getContainer()) {
          map.invalidateSize();
        }
      } catch (e) {
        console.warn("Leaflet resize error handled:", e);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    const container = map.getContainer();
    if (container) {
      resizeObserver.observe(container);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [map]);

  return null;
}

function MapEvents({
  setBounds,
  setZoom,
  onMapClick,
}: {
  setBounds: React.Dispatch<React.SetStateAction<[number, number, number, number] | null>>;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  onMapClick?: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const updateBoundsAndZoom = () => {
      const b = map.getBounds();
      const newBounds: [number, number, number, number] = [
        b.getSouthWest().lng,
        b.getSouthWest().lat,
        b.getNorthEast().lng,
        b.getNorthEast().lat,
      ];

      setBounds((prev) => {
        if (prev &&
            Math.abs(prev[0] - newBounds[0]) < 0.0001 &&
            Math.abs(prev[1] - newBounds[1]) < 0.0001 &&
            Math.abs(prev[2] - newBounds[2]) < 0.0001 &&
            Math.abs(prev[3] - newBounds[3]) < 0.0001) {
          return prev;
        }
        return newBounds;
      });

      const nextZoom = map.getZoom();
      setZoom((prevZoom) => {
        if (prevZoom === nextZoom) {
          return prevZoom;
        }
        return nextZoom;
      });
    };

    const handleBackingClick = (e: any) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    };

    updateBoundsAndZoom();

    map.on("moveend", updateBoundsAndZoom);
    map.on("zoomend", updateBoundsAndZoom);
    map.on("click", handleBackingClick);

    return () => {
      map.off("moveend", updateBoundsAndZoom);
      map.off("zoomend", updateBoundsAndZoom);
      map.off("click", handleBackingClick);
    };
  }, [map, setBounds, setZoom, onMapClick]);

  return null;
}

export default function Home() {
  const navigate = useNavigate();
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile, switchRole } = useAuth();
  const { viewMode, setViewMode } = useView();

  // --- OPTIMISTIC UI TELEMETRY & CLON SIMULATOR ---
  const previousLocationsRef = useRef<Record<string, { lat: number; lng: number }>>({});
  const pendingUpdatesRef = useRef<Record<string, { lat: number; lng: number; timestamp: number }>>({});
  const [activeVirtualPro, setActiveVirtualPro] = useState<string | null>(null);
  const [forceWriteFailure, setForceWriteFailure] = useState(false);
  const [showTelemetryConsole, setShowTelemetryConsole] = useState(false);
  const [telemetryLogs, setTelemetryLogs] = useState<{ id: string; msg: string; type: 'info' | 'success' | 'warn' | 'error' }[]>([]);

  const addTelemetryLog = useCallback((msg: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    setTelemetryLogs((prev) => [
      { id: Math.random().toString(), msg: `[${new Date().toLocaleTimeString()}] ${msg}`, type },
      ...prev.slice(0, 14)
    ]);
  }, []);

  const updateProLocationOptimistically = useCallback(async (proId: string, newLat: number, newLng: number) => {
    let currentPro = professionals.find(p => p.id === proId);

    if (!currentPro && activeVirtualPro === proId) {
      currentPro = {
        id: proId,
        name: profile?.name || user?.displayName || "Socio Pro Clon",
        profession: "Electricista",
        rating: 4.8,
        isElite: true,
        isOnline: true,
        status: "Activo",
        latitude: newLat,
        longitude: newLng,
        photoUrl: profile?.photoUrl || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150"
      };
    }

    if (!currentPro) {
      addTelemetryLog(`Profesional ${proId} no encontrado para aplicar update optimista.`, 'error');
      return;
    }

    const prevLat = currentPro.latitude || 10.2117;
    const prevLng = currentPro.longitude || -64.6735;
    previousLocationsRef.current[proId] = { lat: prevLat, lng: prevLng };

    // Registrar en pendiente para reconciliación
    pendingUpdatesRef.current[proId] = { lat: newLat, lng: newLng, timestamp: Date.now() };

    // 1. ACTUALIZACIÓN LOCAL INSTANTÁNEA (OPTIMISTIC)
    addTelemetryLog(`[Optimistic] Moviendo localmente a [Lat ${newLat.toFixed(5)}, Lng ${newLng.toFixed(5)}] (0.2ms)`, 'info');

    setProfessionals((prev) => {
      const exists = prev.some(p => p.id === proId);
      if (exists) {
        return prev.map(p => p.id === proId ? { ...p, latitude: newLat, longitude: newLng } : p);
      } else {
        return [{
          id: proId,
          name: profile?.name || user?.displayName || "Socio Pro Clon",
          profession: "Electricista",
          rating: 4.8,
          isElite: true,
          isOnline: true,
          status: "Activo",
          latitude: newLat,
          longitude: newLng,
          photoUrl: profile?.photoUrl || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150",
          finalScore: 100
        }, ...prev];
      }
    });

    // 2. DISPARAR ENVÍO ASÍNCRONO AL BACKEND
    try {
      addTelemetryLog(`[Firestore] Sincronizando coordenadas en segundo plano...`, 'info');

      if (forceWriteFailure) {
        await new Promise(resolve => setTimeout(resolve, 500));
        throw new Error("Pérdida de paquetes de red / Error de seguridad simulado.");
      }

      await setDoc(doc(db, "profesionales", proId), {
        latitude: newLat,
        longitude: newLng,
        updatedAt: serverTimestamp()
      }, { merge: true });

      addTelemetryLog(`[Firestore] Confirmación recibida del Servidor. (Latencia oculta: ~300ms)`, 'success');
    } catch (err: any) {
      console.error(`[Optimistic Err] Error:`, err);
      addTelemetryLog(`[Firestore Reject] Falló la escritura: ${err.message || String(err)}`, 'error');

      // 3. RECUPERACIÓN GRACIOSA (ROLLBACK COMPLETO)
      addTelemetryLog(`[Rollback Activo] Restableciendo Pin a posición segura: [Lat ${prevLat.toFixed(5)}, Lng ${prevLng.toFixed(5)}]`, 'warn');

      setProfessionals((prev) => {
        return prev.map(p => p.id === proId ? { ...p, latitude: prevLat, longitude: prevLng } : p);
      });

      delete pendingUpdatesRef.current[proId];
    }
  }, [professionals, activeVirtualPro, profile, user, forceWriteFailure, addTelemetryLog]);

  const toggleVirtualClone = useCallback(async () => {
    if (activeVirtualPro) {
      const cloneId = activeVirtualPro;
      setActiveVirtualPro(null);
      setProfessionals(prev => prev.filter(p => p.id !== cloneId));
      addTelemetryLog("Clon Profesional Virtual eliminado.", "warn");
    } else {
      const cloneId = user?.uid || "mock_pro_clone_99";
      setActiveVirtualPro(cloneId);
      addTelemetryLog(`Clon Profesional Virtual inicializado en [10.2117, -64.6735]`, "success");
      setMapCenter([10.2117, -64.6735]);
      setMapZoom(15);
    }
  }, [activeVirtualPro, user, addTelemetryLog]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (activeVirtualPro) {
      updateProLocationOptimistically(activeVirtualPro, lat, lng);
    } else if (profile?.role === 'Profesional') {
      updateProLocationOptimistically(user?.uid || '', lat, lng);
    }
  }, [activeVirtualPro, profile, user, updateProLocationOptimistically]);

  const ServiceTicker = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => {
      if (!db || !user) return;
      const q = query(
        collection(db, "profesionales"),
        where("status", "==", "Activo"),
        orderBy("createdAt", "desc"),
        limit(10),
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const pros = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setItems(pros);
        },
        (error) => {
          if (error.code !== 'permission-denied') {
            console.error("Error fetching ticker data:", error);
          }
        },
      );

      return () => unsubscribe();
    }, [user]);

    if (items.length === 0) return null;

    return (
      <div className="w-full bg-surface-container/30 backdrop-blur-sm border-y border-outline-variant/10 py-1 sm:py-2 overflow-hidden flex items-center">
        <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 shrink-0 border-r border-outline-variant/20 mr-2 sm:mr-4">
          <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#39FF14] animate-pulse drop-shadow-[0_0_5px_#39FF14]" />
          <span className="text-[8px] sm:text-[10px] font-black text-[#39FF14] uppercase tracking-widest drop-shadow-[0_0_3px_rgba(57,255,20,0.5)]">
            Clientes
          </span>
        </div>
        <div className="flex whitespace-nowrap overflow-hidden">
          <motion.div
            className="flex gap-4 sm:gap-8"
            animate={{ x: [0, -2000] }}
            transition={{
              duration: 40,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {[...items, ...items].map((item, idx) => (
              <button
                key={`${item.id}-${idx}`}
                onClick={() => navigate(`/profile/${item.id}`)}
                className="flex items-center gap-2 sm:gap-3 hover:bg-surface-highest/50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#39FF14] shadow-[0_0_5px_#39FF14]"></div>
                  <span className="text-[9px] sm:text-[11px] font-bold text-on-surface uppercase tracking-tight">
                    {item.profession
                      ? DOMPurify.sanitize(item.profession, { ALLOWED_TAGS: [] })
                      : "Profesional"}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1 text-white">
                  <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span className="text-[8px] sm:text-[10px] font-bold">
                    {item.country || "Cerca"}
                  </span>
                </div>
                <span className="text-[9px] sm:text-[11px] font-black text-[#39FF14] drop-shadow-[0_0_3px_rgba(57,255,20,0.3)]">
                  {item.services?.[0]?.price
                    ? `$${item.services[0].price}`
                    : "A convenir"}
                </span>
                <span className="text-[7px] sm:text-[9px] text-white/80 font-bold">
                  Nuevo
                </span>
              </button>
            ))}
          </motion.div>
        </div>
      </div>
    );
  };

  // Optimized icons for performance - memoized by marker properties
  const clusterIconCache = useMemo(() => {
    const cache: Record<number, L.DivIcon> = {};
    return (pointCount: number) => {
      if (cache[pointCount]) return cache[pointCount];

      const icon = L.divIcon({
        html: `<div class="animate-led-cluster" style="border: 1.5px solid; border-radius: 50%; font-weight: 900; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px); font-size: 13px;"><span style="color: #000000;">${pointCount}</span></div>`,
        className: "custom-pro-cluster bg-transparent border-none",
        iconSize: L.point(34, 34, true),
      });

      cache[pointCount] = icon;
      return icon;
    };
  }, []);

  const markerIconCache = useMemo(() => {
    const cache: Record<string, L.DivIcon> = {};
    return (
      color: string,
      emoji: string,
      photoUrl?: string,
      isPremium?: boolean,
      isElite?: boolean,
      id?: string
    ) => {
      const key = `${color}-${emoji}-${photoUrl}-${id}`;
      if (cache[key]) return cache[key];

      const isDefaultCyan = color.toUpperCase() === "#00FFFF";
      const animationClass = isDefaultCyan ? "animate-led-cluster" : "";

      const icon = L.divIcon({
        className: `custom-pro-marker bg-transparent border-none ${animationClass}`,
        html: photoUrl
          ? `<div style="width: 36px; height: 36px; border-radius: 50%; border: 2px solid ${isDefaultCyan ? "inherit" : color}; box-shadow: ${isDefaultCyan ? "inherit" : `0 0 12px ${color}90`}; overflow: hidden; background-color: ${color}; position: relative;">
               ${isPremium || isElite ? `<div style="position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; background: ${isElite ? "#FFD700" : "#FF00FF"}; border-radius: 50%; border: 1px solid #111;"></div>` : ""}
               <img src="${photoUrl}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;" referrerPolicy="no-referrer" />
             </div>`
          : `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #222; box-shadow: 0 4px 10px rgba(0,0,0,0.5); font-size: 16px; color: white;">
                 ${emoji}
               </div>`,
        iconSize: photoUrl ? [36, 36] : [32, 32],
        iconAnchor: photoUrl ? [18, 18] : [16, 16],
        popupAnchor: photoUrl ? [0, -18] : [0, -16],
      });
      cache[key] = icon;
      return icon;
    };
  }, []);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isFixingCoords, setIsFixingCoords] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm && debouncedSearchTerm.trim().length > 2) {
      logSearchQuery(debouncedSearchTerm, user?.uid);
    }
  }, [debouncedSearchTerm, user?.uid]);
  const [isServicesMenuOpen, setIsServicesMenuOpen] = useState(false);
  const [isFiltersMenuOpen, setIsFiltersMenuOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const [menuSearchTerm, setMenuSearchTerm] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedPro, setSelectedPro] = useState<any | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showReqModal, setShowReqModal] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    opcionesMapa.center.lat,
    opcionesMapa.center.lng,
  ]);
  const [mapZoom, setMapZoom] = useState(opcionesMapa.zoom);
  const [mapBounds, setMapBounds] = useState<
    [number, number, number, number] | null
  >(null);
  const [mapCategoryFilter, setMapCategoryFilter] = useState("todas");
  const [mapOnlineFilter, setMapOnlineFilter] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  // Configuración de ubicación Porlamar, Margarita (Fallback)
  const PORLAMAR_LOCATION: [number, number] = [10.9578, -63.8696];

  const requestAndLocate = () => {
    setIsRequestingLocation(true);
    setShowLocationModal(false);
    if (!navigator.geolocation) {
      alert("Tu dispositivo no soporta geolocalización.");
      setIsRequestingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        // Verificar si la ubicación está cerca de Margarita (aprox 200km)
        const dist = Math.sqrt(Math.pow(lat - PORLAMAR_LOCATION[0], 2) + Math.pow(lng - PORLAMAR_LOCATION[1], 2));
        const isNearMargarita = dist < 2.0;

        if (isNearMargarita) {
          const coords: [number, number] = [lat, lng];
          setMapCenter(coords);
          setUserLocation(coords);
          setMapZoom(16);
        } else {
          console.warn("Ubicación detectada lejos de Margarita, ignorando:", lat, lng);
          setMapCenter(PORLAMAR_LOCATION);
          setMapZoom(13);
          alert("Parece que estás fuera de nuestra zona de cobertura. Centrando en Porlamar.");
        }
        setIsRequestingLocation(false);
      },
      (err) => {
        setIsRequestingLocation(false);
        let diagnosticMessage = '';
        switch(err.code) {
          case err.PERMISSION_DENIED:
            diagnosticMessage = 'BLOQUEO DE SO: El navegador denegó acceso al GPS. Revisa permisos de ubicación en Configuración del Sistema o Navegador.';
            break;
          case err.POSITION_UNAVAILABLE:
            diagnosticMessage = 'FALLO DE RED: El dispositivo no puede triangular tu ubicación actual (¿Wi-Fi apagado o señal débil?).';
            break;
          case err.TIMEOUT:
            diagnosticMessage = 'TIEMPO AGOTADO: El dispositivo tardó demasiado en responder a la petición. Inténtalo de nuevo.';
            break;
          default:
            diagnosticMessage = 'ERROR DESCONOCIDO GPS: ' + err.message;
        }

        setMapCenter(PORLAMAR_LOCATION);
        setMapZoom(13);
        console.error(`[Master Brain GPS] Alerta de Desconexión: ${diagnosticMessage}`);
        alert(diagnosticMessage);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const handleFindProfessionals = (category: string, loc: [number, number] | null) => {
    if (!loc) return;
    findProfessionals(category, { lat: loc[0], lng: loc[1] });
  };

  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedMuni, setSelectedMuni] = useState("");

  // Advanced Filters
  const [filterRating, setFilterRating] = useState<number>(0);
  const [filterMinPrice, setFilterMinPrice] = useState<string>("");
  const [filterMaxPrice, setFilterMaxPrice] = useState<string>("");
  const [filterAvailability, setFilterAvailability] = useState<string>("");
  const [filterProfession, setFilterProfession] = useState<string>("");
  const [isSelectingProfessionForFilter, setIsSelectingProfessionForFilter] =
    useState(false);

  const handleServiceSelect = useCallback((service: string) => {
    if (isSelectingProfessionForFilter) {
      setFilterProfession(service);
      setIsFiltersMenuOpen(true);
      setIsSelectingProfessionForFilter(false);
    } else {
      setSearchTerm(service);
    }
    setIsServicesMenuOpen(false);
  }, [isSelectingProfessionForFilter]);

  const [lastVisible, setLastVisible] = useState<any>(null);
  const [isMoreLoading, setIsMoreLoading] = useState(false);

  const professionalsQuery = useMemo(() => {
    if (!db || !user) return null;
    let q = query(
      collection(db, "profesionales"),
      where("status", "==", "Activo")
    );

    if (mapCategoryFilter !== "todas") {
      const selectedCategoryMatch = MAP_CATEGORIES.find(c => c.id === mapCategoryFilter)?.match;
      if (selectedCategoryMatch) {
         q = query(q, where("profession", "==", selectedCategoryMatch));
      }
    }

    return query(q, orderBy("createdAt", "desc"), limit(20));
  }, [user, mapCategoryFilter]);

  useEffect(() => {
    setLastVisible(null);
  }, [mapCategoryFilter]);

  const subscriptionCallback = useCallback((snapshot: any) => {
    if (!snapshot.empty) {
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
    }
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
  }, []);

  const { data: professionalsData, loading: professionalsLoading } =
    useFirestoreSubscription(
      professionalsQuery,
      OperationType.LIST,
      "profesionales",
      subscriptionCallback,
      [mapCategoryFilter, subscriptionCallback],
    );

  const loadMoreProfessionals = useCallback(async () => {
    if (!db || !lastVisible || isMoreLoading) return;

    setIsMoreLoading(true);
    try {
      let q = query(
        collection(db, "profesionales"),
        where("status", "==", "Activo"),
        orderBy("createdAt", "desc")
      );

      if (mapCategoryFilter !== "todas") {
        const selectedCategoryMatch = MAP_CATEGORIES.find(c => c.id === mapCategoryFilter)?.match;
        if (selectedCategoryMatch) {
           q = query(q, where("profession", "==", selectedCategoryMatch));
        }
      }

      const nextQuery = query(q, startAfter(lastVisible), limit(15));
      const snapshot = await getDocs(nextQuery);

      if (!snapshot.empty) {
        const newPros = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProfessionals(prev => [...prev, ...newPros]);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      } else {
        setLastVisible(null);
      }
    } catch (error) {
      console.error("Error loading more professionals:", error);
      handleFirestoreError(error, OperationType.LIST, "profesionales");
    } finally {
      setIsMoreLoading(false);
    }
  }, [db, lastVisible, isMoreLoading, mapCategoryFilter]);

  const professionalsWithScores = useMemo(() => {
    if (!professionalsData) return [];
    return professionalsData.map((pro: any) => ({
      ...pro,
      finalScore:
        pro.finalScore !== undefined
          ? pro.finalScore
          : calculateRankingScore(pro),
    }));
  }, [professionalsData]);

  useEffect(() => {
    if (!professionalsLoading && professionalsWithScores) {
      let filteredScores = [...professionalsWithScores];

      // Reconciliación de Estado Optimista
      const now = Date.now();
      filteredScores = filteredScores.map((pro) => {
        const pending = pendingUpdatesRef.current[pro.id];
        if (pending && (now - pending.timestamp < 6000)) {
          // Si hay una actualización local que se hizo hace menos de 6s,
          // preservamos la coordenada local en vez de sobreescribir con el snapshot rezagado
          return {
            ...pro,
            latitude: pending.lat,
            longitude: pending.lng
          };
        }
        return pro;
      });

      // Asegurar que si tenemos un clon virtual activo, se incorpore al listado de pines en el mapa
      if (activeVirtualPro && !filteredScores.some(p => p.id === activeVirtualPro)) {
        const lastLoc = pendingUpdatesRef.current[activeVirtualPro] || { lat: 10.2117, lng: -64.6735 };
        filteredScores.unshift({
          id: activeVirtualPro,
          name: profile?.name || user?.displayName || "Socio Pro Clon",
          profession: "Electricista",
          rating: 4.8,
          isElite: true,
          isOnline: true,
          status: "Activo",
          latitude: lastLoc.lat,
          longitude: lastLoc.lng,
          photoUrl: profile?.photoUrl || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150",
          finalScore: 100
        });
      }

      const sortedPros = filteredScores.sort((a, b) => {
        if (b.finalScore !== a.finalScore) {
          return b.finalScore - a.finalScore;
        }
        const legacyScoreA =
          (a.isElite ? 1000 : 0) + (parseFloat(a.rating) || 0);
        const legacyScoreB =
          (b.isElite ? 1000 : 0) + (parseFloat(b.rating) || 0);
        return legacyScoreB - legacyScoreA;
      });

      setProfessionals(sortedPros);
      setLoading(false);
    }
  }, [professionalsWithScores, professionalsLoading, activeVirtualPro, profile, user]);

  const seedProfessionals = async () => {
    if (!user) {
      alert("Debes iniciar sesión para generar datos.");
      return;
    }

    setIsSeeding(true);
    try {
      const professionsToSeed = [
        {
          category: "Hogar",
          names: [
            "Plomero / Fontanero",
            "Electricista",
            "Cerrajero (Servicio 24 horas)",
          ],
        },
        {
          category: "Salud",
          names: [
            "Médico General",
            "Fisioterapeuta / Rehabilitador",
            "Psicólogo",
          ],
        },
        {
          category: "Estética",
          names: [
            "Peluquero / Estilista",
            "Barbero",
            "Manicurista / Pedicurista",
          ],
        },
        {
          category: "Tecnología",
          names: [
            "Técnico de Celulares y Tablets",
            "Técnico de Computadoras",
            "Desarrollador Web / App",
          ],
        },
        {
          category: "Vehículos",
          names: [
            "Mecánico Automotriz",
            "Mecánico de Motos",
            "Servicio de Grúa",
          ],
        },
        {
          category: "Eventos",
          names: [
            "Fotógrafo",
            "DJ Profesional",
            "Chef Privado / Servicio de Catering",
          ],
        },
        {
          category: "Educación",
          names: [
            "Profesor de Idiomas",
            "Tutor Académico",
            "Instructor de Manejo",
          ],
        },
        {
          category: "Gestoría",
          names: ["Abogado", "Contador Público", "Arquitecto"],
        },
        {
          category: "Limpieza",
          names: [
            "Servicio de Limpieza del Hogar",
            "Jardinero / Paisajista",
            "Niñera (Babysitter)",
          ],
        },
        {
          category: "Mascotas",
          names: ["Veterinario", "Paseador de Perros", "Adiestrador Canino"],
        },
      ];

      const countries = [
        "Venezuela",
        "Colombia",
        "Argentina",
        "Chile",
        "México",
        "España",
        "Perú",
        "Ecuador",
      ];
      const genders = ["Masculino", "Femenino"];

      const margaritaLocations = [
        {
          name: "Mariño (Porlamar)",
          state: "Nueva Esparta",
          lat: 10.955,
          lng: -63.8486,
        },
        {
          name: "Maneiro (Pampatar)",
          state: "Nueva Esparta",
          lat: 10.9961,
          lng: -63.7981,
        },
        {
          name: "Arismendi (La Asunción)",
          state: "Nueva Esparta",
          lat: 11.0294,
          lng: -63.8628,
        },
        {
          name: "Marcano (Juan Griego)",
          state: "Nueva Esparta",
          lat: 11.0817,
          lng: -63.9658,
        },
        {
          name: "Díaz (San Juan Bautista)",
          state: "Nueva Esparta",
          lat: 11.0139,
          lng: -63.9436,
        },
        {
          name: "Tubores (Punta de Piedras)",
          state: "Nueva Esparta",
          lat: 10.9022,
          lng: -64.0375,
        },
        {
          name: "Península de Macanao (Boca del Río)",
          state: "Nueva Esparta",
          lat: 10.9631,
          lng: -64.175,
        },
        {
          name: "García (El Valle)",
          state: "Nueva Esparta",
          lat: 10.9822,
          lng: -63.8814,
        },
        {
          name: "Gómez (Santa Ana)",
          state: "Nueva Esparta",
          lat: 11.0767,
          lng: -63.9214,
        },
        {
          name: "Antolín del Campo (Plaza de Paraguachí)",
          state: "Nueva Esparta",
          lat: 11.1467,
          lng: -63.8344,
        },
        {
          name: "Villalba (Isla de Coche)",
          state: "Nueva Esparta",
          lat: 10.7794,
          lng: -63.9439,
        },
      ];

      const testPros: any[] = [];

      professionsToSeed.forEach((cat, catIdx) => {
        cat.names.forEach((profName, profIdx) => {
          // Create exactly 1 professional per profession
          const id = `pro-${catIdx}-${profIdx}-1`;
          const gender = genders[Math.floor(Math.random() * genders.length)];
          const name =
            gender === "Masculino"
              ? [
                  "Carlos",
                  "Juan",
                  "Pedro",
                  "Luis",
                  "Miguel",
                  "Roberto",
                  "Andrés",
                ][Math.floor(Math.random() * 7)]
              : ["Ana", "Laura", "María", "Elena", "Sofía", "Carmen", "Lucía"][
                  Math.floor(Math.random() * 7)
                ];

          const lastName = [
            "García",
            "Rodríguez",
            "Martínez",
            "Hernández",
            "López",
            "González",
            "Pérez",
          ][Math.floor(Math.random() * 7)];

          const location =
            margaritaLocations[
              Math.floor(Math.random() * margaritaLocations.length)
            ];

          testPros.push({
            id,
            uid: id,
            name: `${name} ${lastName}`,
            email: `${name.toLowerCase()}.${id}@test.com`,
            role: "Profesional",
            status: "Activo",
            profession: profName,
            country: "Venezuela",
            state: location.state,
            municipality: location.name,
            gender,
            age: 20 + Math.floor(Math.random() * 40),
            bio: `Profesional experto en ${profName} con más de 5 años de experiencia. Comprometido con la calidad y la satisfacción del cliente.`,
            photoUrl: `https://i.pravatar.cc/300?u=${id}`,
            isPremium: Math.random() > 0.7,
            isElite: Math.random() > 0.9,
            latitude: location.lat + (Math.random() - 0.5) * 0.015, // Small offset so they don't overlap exactly
            longitude: location.lng + (Math.random() - 0.5) * 0.015,
            rating: (4 + Math.random()).toFixed(1),
            isOnline: Math.random() > 0.3,
            instagram: `https://instagram.com/${name.toLowerCase()}_${lastName.toLowerCase()}`,
            facebook: `https://facebook.com/${name.toLowerCase()}.${lastName.toLowerCase()}`,
            services: [
              {
                id: "s1",
                title: `Servicio de ${profName}`,
                desc: "Atención profesional garantizada",
                price: (20 + Math.floor(Math.random() * 100)).toString(),
                unit: "fijo",
              },
            ],
          });
        });
      });

      // Add Willy C as the elite example
      const willyLocation =
        margaritaLocations[
          Math.floor(Math.random() * margaritaLocations.length)
        ];
      testPros.push({
        id: "test-pro-willy",
        uid: "test-pro-willy",
        name: "Willy C",
        email: "willy@test.com",
        role: "Profesional",
        status: "Activo",
        profession: "Tecnología",
        country: "Venezuela",
        state: willyLocation.state,
        municipality: willyLocation.name,
        gender: "Masculino",
        age: 29,
        bio: "Líder en soluciones tecnológicas y networking futurista. Especialista en geolocalización.",
        photoUrl:
          "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=100&w=1080&auto=format&fit=crop",
        isPremium: true,
        isElite: true,
        latitude: willyLocation.lat + 0.002,
        longitude: willyLocation.lng + 0.002,
        rating: "5.0",
        isOnline: true,
        instagram: "https://instagram.com/willyc",
        facebook: "https://facebook.com/willyc",
        services: [
          {
            id: "s1",
            title: "Consultoría Tech",
            desc: "Asesoría en sistemas avanzados",
            price: "150",
            unit: "/hr",
          },
        ],
      });

      for (const pro of testPros) {
        try {
          await setDoc(doc(db, "profesionales", pro.id), {
            ...pro,
            createdAt: serverTimestamp(),
          });
        } catch (error) {
          console.error(`Error seeding pro ${pro.id}:`, error);
        }
      }
      alert(
        `${testPros.length} profesionales de prueba generados exitosamente.`,
      );
    } catch (error: any) {
      console.error("Error seeding professionals:", error);
      alert("Error al generar profesionales de prueba.");
    } finally {
      setIsSeeding(false);
    }
  };

  const fixCoordinates = async () => {
    if (!user) {
      alert("Debes iniciar sesión para realizar esta acción.");
      return;
    }

    setIsFixingCoords(true);
    try {
      const margaritaLocations = [
        {
          name: "Mariño (Porlamar)",
          state: "Nueva Esparta",
          lat: 10.955,
          lng: -63.8486,
        },
        {
          name: "Maneiro (Pampatar)",
          state: "Nueva Esparta",
          lat: 10.9961,
          lng: -63.7981,
        },
        {
          name: "Arismendi (La Asunción)",
          state: "Nueva Esparta",
          lat: 11.0294,
          lng: -63.8628,
        },
        {
          name: "Marcano (Juan Griego)",
          state: "Nueva Esparta",
          lat: 11.0817,
          lng: -63.9658,
        },
        {
          name: "Díaz (San Juan Bautista)",
          state: "Nueva Esparta",
          lat: 11.0139,
          lng: -63.9436,
        },
        {
          name: "Tubores (Punta de Piedras)",
          state: "Nueva Esparta",
          lat: 10.9022,
          lng: -64.0375,
        },
        {
          name: "Península de Macanao (Boca del Río)",
          state: "Nueva Esparta",
          lat: 10.9631,
          lng: -64.175,
        },
        {
          name: "García (El Valle)",
          state: "Nueva Esparta",
          lat: 10.9822,
          lng: -63.8814,
        },
        {
          name: "Gómez (Santa Ana)",
          state: "Nueva Esparta",
          lat: 11.0767,
          lng: -63.9214,
        },
        {
          name: "Antolín del Campo (Plaza de Paraguachí)",
          state: "Nueva Esparta",
          lat: 11.1467,
          lng: -63.8344,
        },
        {
          name: "Villalba (Isla de Coche)",
          state: "Nueva Esparta",
          lat: 10.7794,
          lng: -63.9439,
        },
      ];

      let updatedCount = 0;

      for (const pro of professionals) {
        // Update all professionals to spread them out and ensure they have social links
        try {
          const location =
            margaritaLocations[
              Math.floor(Math.random() * margaritaLocations.length)
            ];
          const updates: any = {
            latitude: location.lat + (Math.random() - 0.5) * 0.015,
            longitude: location.lng + (Math.random() - 0.5) * 0.015,
            country: "Venezuela",
            state: location.state,
            municipality: location.name,
            updatedAt: serverTimestamp(),
          };

          if (!pro.instagram) {
            const firstName = pro.name?.split(" ")[0]?.toLowerCase() || "pro";
            updates.instagram = `https://instagram.com/${firstName}_${pro.id.slice(-4)}`;
          }
          if (!pro.facebook) {
            const firstName = pro.name?.split(" ")[0]?.toLowerCase() || "pro";
            updates.facebook = `https://facebook.com/${firstName}.${pro.id.slice(-4)}`;
          }

          await setDoc(doc(db, "profesionales", pro.id), updates, { merge: true });
          updatedCount++;
        } catch (error) {
          console.error(`Error updating coordinates for pro ${pro.id}:`, error);
        }
      }

      alert(
        `Se actualizaron las coordenadas de ${updatedCount} profesionales.`,
      );
    } catch (error) {
      console.error("Error fixing coordinates:", error);
      alert("Error al actualizar coordenadas.");
    } finally {
      setIsFixingCoords(false);
    }
  };

  // El rastreo ahora se maneja en MapContainer

  const userIcon = useMemo(
    () =>
      L.divIcon({
        className: "user-location-marker",
        html: `<div class="pulse-marker"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      }),
    [],
  );

  const getCategoryForProfession = (profession: string) => {
    for (const cat of SERVICE_CATEGORIES) {
      if (cat.services.includes(profession)) {
        return cat.title;
      }
    }
    return "Otros";
  };

  const filteredProfessionals = useMemo(() => {
    const filtered = professionals.filter((pro) => {
      // 1. Search Term
      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase();
        const matchesSearch =
          pro.name?.toLowerCase().includes(searchLower) ||
          pro.profession?.toLowerCase().includes(searchLower) ||
          pro.bio?.toLowerCase().includes(searchLower) ||
          pro.country?.toLowerCase().includes(searchLower) ||
          pro.location?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // 1.5 Profession Filter
      if (filterProfession) {
        const profLower = filterProfession.toLowerCase();
        const matchesProf = pro.profession?.toLowerCase().includes(profLower);
        if (!matchesProf) return false;
      }

      // 2. Rating
      const proRating =
        pro.rating || (pro.isElite ? 5 : pro.isPremium ? 4.5 : 4.0);
      if (filterRating > 0 && proRating < filterRating) return false;

      // 3. Price Range
      if (filterMinPrice || filterMaxPrice) {
        const min = filterMinPrice ? parseFloat(filterMinPrice) : 0;
        const max = filterMaxPrice ? parseFloat(filterMaxPrice) : Infinity;

        const hasValidPrice = pro.services?.some((s: any) => {
          const price = parseFloat(s.price);
          return !isNaN(price) && price >= min && price <= max;
        });

        if (!hasValidPrice && pro.services && pro.services.length > 0)
          return false;
      }

      // 4. Availability
      if (filterAvailability) {
        const proAvail =
          pro.availability || (pro.isElite ? "24/7" : "Mañana, Tarde");
        if (!proAvail.toLowerCase().includes(filterAvailability.toLowerCase()))
          return false;
      }

      return true;
    });

    if (userLocation) {
      return filtered
        .map((pro) => {
          const distance =
            pro.latitude && pro.longitude
              ? getDistance(
                  userLocation[0],
                  userLocation[1],
                  pro.latitude,
                  pro.longitude,
                )
              : Infinity;

          let booster = 0;
          if (profile?.preferences?.fav_categories?.includes(pro.profession)) {
              booster += 5;
          }
          if (profile?.preferences?.last_search && pro.profession.toLowerCase().includes(profile.preferences.last_search.toLowerCase())) {
              booster += 3;
          }

          const score = (pro.finalScore !== undefined ? pro.finalScore : calculateRankingScore(pro)) + booster;
          return { ...pro, _distance: distance, _score: score };
        })
        .sort((a, b) => {
          if (a._distance !== b._distance) return a._distance - b._distance;
          return b._score - a._score;
        });
    }

    return filtered;
  }, [
    professionals,
    debouncedSearchTerm,
    filterProfession,
    filterRating,
    filterMinPrice,
    filterMaxPrice,
    filterAvailability,
    userLocation,
    profile,
  ]);

  const mapFilteredProfessionals = filteredProfessionals;

  const points = useMemo(() => {
    return mapFilteredProfessionals
      .filter((p) => p.latitude && p.longitude)
      .map((pro) => ({
        type: "Feature" as const,
        properties: { cluster: false as const, proId: pro.id, ...pro },
        geometry: {
          type: "Point" as const,
          coordinates: [
            parseFloat(pro.longitude!.toString()),
            parseFloat(pro.latitude!.toString()),
          ],
        },
      }));
  }, [mapFilteredProfessionals]);

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds: mapBounds,
    zoom: mapZoom,
    options: { radius: 75, maxZoom: 20 },
  });

  const handleLocationSelect = (
    type: "country" | "state" | "muni",
    value: string,
  ) => {
    if (type === "country") {
      setSelectedCountry(value);
      setSelectedState("");
      setSelectedMuni("");

      // Center map on country
      const countryCoords: Record<string, [number, number]> = {
        México: [23.6345, -102.5528],
        España: [40.4637, -3.7492],
        Argentina: [-38.4161, -63.6167],
        Colombia: [4.5709, -74.2973],
        Venezuela: [6.4238, -66.5897],
        Perú: [-9.19, -75.0152],
        Chile: [-35.6751, -71.543],
        Ecuador: [-1.8312, -78.1834],
        Bolivia: [-16.2902, -63.5887],
        Uruguay: [-32.5228, -55.7658],
        Paraguay: [-23.4425, -58.4438],
        Panamá: [8.538, -80.7821],
        "Costa Rica": [9.7489, -83.7534],
        Nicaragua: [12.8654, -85.2072],
        Honduras: [15.1999, -86.2419],
        "El Salvador": [13.7942, -88.8965],
        Guatemala: [15.7835, -90.2308],
        Cuba: [21.5218, -77.7812],
        "República Dominicana": [18.7357, -70.1627],
        "Puerto Rico": [18.2208, -66.5901],
        "Guinea Ecuatorial": [1.6508, 10.2679],
      };

      if (countryCoords[value]) {
        setMapCenter(countryCoords[value]);
        setMapZoom(5);
      }
    } else if (type === "state") {
      setSelectedState(value);
      setSelectedMuni("");

      // Center map on state (simplified, usually would need a geocoder)
      // For Nueva Esparta we have specific center
      if (value === "Nueva Esparta") {
        setMapCenter([11.0294, -63.8628]);
        setMapZoom(11);
      } else {
        // Fallback: search for a professional in that state to center
        const proInState = professionals.find(
          (p) => p.state === value && p.latitude,
        );
        if (proInState) {
          setMapCenter([proInState.latitude, proInState.longitude]);
          setMapZoom(9);
        }
      }
    } else if (type === "muni") {
      setSelectedMuni(value);

      // Center map on municipality
      const margaritaLocations = [
        { name: "Mariño (Porlamar)", lat: 10.955, lng: -63.8486 },
        { name: "Maneiro (Pampatar)", lat: 10.9961, lng: -63.7981 },
        { name: "Arismendi (La Asunción)", lat: 11.0294, lng: -63.8628 },
        { name: "Marcano (Juan Griego)", lat: 11.0817, lng: -63.9658 },
        { name: "Díaz (San Juan Bautista)", lat: 11.0139, lng: -63.9436 },
        { name: "Tubores (Punta de Piedras)", lat: 10.9022, lng: -64.0375 },
        {
          name: "Península de Macanao (Boca del Río)",
          lat: 10.9631,
          lng: -64.175,
        },
        { name: "García (El Valle)", lat: 10.9822, lng: -63.8814 },
        { name: "Gómez (Santa Ana)", lat: 11.0767, lng: -63.9214 },
        {
          name: "Antolín del Campo (Plaza de Paraguachí)",
          lat: 11.1467,
          lng: -63.8344,
        },
        { name: "Villalba (Isla de Coche)", lat: 10.7794, lng: -63.9439 },
      ];

      const loc = margaritaLocations.find((l) => l.name === value);
      if (loc) {
        setMapCenter([loc.lat, loc.lng]);
        setMapZoom(14);
      } else {
        const proInMuni = professionals.find(
          (p) => p.municipality === value && p.latitude,
        );
        if (proInMuni) {
          setMapCenter([proInMuni.latitude, proInMuni.longitude]);
          setMapZoom(13);
        }
      }
    }
  };

  const prosCercanos = useMemo(() => {
    if (!userLocation) return [];
    return professionals.filter(pro => {
      if (!pro.latitude || !pro.longitude) return false;
      const d = getDistance(userLocation[0], userLocation[1], pro.latitude, pro.longitude);
      return d <= 15;
    });
  }, [userLocation, professionals]);

  const tickerHtmlContent = useMemo(() => {
    if (prosCercanos.length === 0) return "Sin profesionales activos en tu zona";
    return prosCercanos.map(pro => {
      const dist = getDistance(userLocation![0], userLocation![1], pro.latitude, pro.longitude).toFixed(1);
      const name = pro.name ? pro.name.toUpperCase() : 'PROFESIONAL';
      const category = pro.category || pro.profession || 'SERVICIOS';
      return `<span>${name} (${category}) <b class="distance-badge" style="color: #00ff88; margin-left: 5px; margin-right: 15px;">${dist} KM</b></span>`;
    }).join(' <span style="margin: 0 10px; color: #555">&bull;</span> ');
  }, [prosCercanos, userLocation]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="relative flex-1 w-full h-full bg-surface-lowest overflow-hidden flex flex-col">
      <Helmet>
        <title>PinPro | Encuentra Profesionales Locales</title>
        <meta
          name="description"
          content="Encuentra los mejores profesionales cerca de ti con PinPro. Geolocalización en tiempo real para servicios de calidad."
        />
      </Helmet>
      {/* Top Header & Search */}
      <div className="flex flex-col bg-[#0b0e11] z-30 border-b border-[#1a1d23] sticky top-0 shrink-0">
        {!user && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="px-4 py-2 bg-gradient-to-r from-[#00FFFF]/10 to-[#B026FF]/10 flex items-center justify-between border-b border-[#00FFFF]/20"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00FFFF] animate-pulse" />
              <span className="text-[9px] font-black uppercase text-[#00FFFF] tracking-widest">Plataforma Activa</span>
            </div>
            <button
              onClick={() => navigate('/inicio-registro')}
              className="px-3 py-1 bg-[#00FFFF] text-black rounded-lg font-black text-[9px] uppercase tracking-widest shadow-[0_0_10px_rgba(0,255,255,0.3)] active:scale-95 transition-all"
            >
              Ingresar / Registro
            </button>
          </motion.div>
        )}
        <div className="flex items-center justify-between px-3 sm:px-4 h-[60px] relative w-full">
          {/* Equal width container for left side */}
          <div className="flex justify-start z-10 w-[60px] sm:w-[80px]">
            <Link
              to={user ? "/settings" : "/inicio-registro"}
              className="p-1.5 sm:p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-all duration-300 border border-white/10 active:scale-95 shadow-[0_0_15px_rgba(0,255,102,0.1)] group"
            >
              <style>{`
                @keyframes menuColorChange {
                  0% { color: #00FF66; }
                  33% { color: #00FFFF; }
                  66% { color: #B026FF; }
                  100% { color: #00FF66; }
                }
                .menu-icon-anim {
                  animation: menuColorChange 4s infinite;
                }
                @keyframes dotColorAnim {
                  0% { background-color: #39FF14; box-shadow: 0 0 8px rgba(57,255,20,0.8); }
                  100% { background-color: #FF0000; box-shadow: 0 0 8px rgba(255,0,0,0.8); }
                }
                .dot-color-anim {
                  animation: dotColorAnim 0.8s infinite alternate;
                }
              `}</style>
              <Menu className="w-5 h-5 sm:w-6 sm:h-6 menu-icon-anim" />
            </Link>
          </div>

          {/* Centered Ticker or Logo */}
          <div className="flex-1 flex items-center justify-center z-0 overflow-hidden px-2 relative h-full">
            {!prosCercanos.length ? (
              <div className="flex items-center drop-shadow-[0_0_15px_rgba(0,255,255,0.4)]">
                <span className="text-3xl sm:text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#00FFFF] to-[#B026FF] pointer-events-none">
                  Pin
                </span>
                <span className="text-3xl sm:text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#B026FF] to-[#FF00FF] pointer-events-none">
                  Pro
                </span>
                <Link
                  to="/notifications"
                  className="ml-2 p-1 text-white hover:text-[#00FFFF] transition-all active:scale-95 group relative flex items-center justify-center"
                >
                  <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full dot-color-anim"></span>
                </Link>
              </div>
            ) : (
              <div
                className="w-full text-base sm:text-[1.15rem] font-semibold whitespace-nowrap text-white flex items-center h-full"
                dangerouslySetInnerHTML={{
                  __html: `
                    <marquee scrollamount="3" behavior="scroll" direction="left" class="w-full h-full flex items-center pt-2">
                      ${tickerHtmlContent}
                    </marquee>
                  `
                }}
              />
            )}
          </div>

          {/* Equal width container for right side */}
          <div className="flex justify-end items-center gap-2 sm:gap-4 z-10 w-[110px] sm:w-[130px]">
            {/* Full Screen Button */}
            <button
              onClick={toggleFullScreen}
              className="relative group pointer-events-auto h-7 sm:h-9 px-2 sm:px-3 flex items-center justify-center rounded-full border border-[#00FFFF]/40 bg-[#111]/80 backdrop-blur-xl shadow-[0_0_15px_rgba(0,255,255,0.2)] active:scale-95 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute -inset-1 bg-gradient-to-tr from-[#00FFFF]/20 to-[#00FFFF]/5 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="flex items-center gap-1 sm:gap-2">
                <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00FFFF] menu-icon-anim" />
                <span className="text-[8px] sm:text-[10px] font-black text-[#00FFFF] uppercase tracking-tighter">
                  Full
                </span>
              </div>
            </button>

            {/* Country Selector Globe Icon */}
            <div className="relative group pointer-events-auto h-7 sm:h-9 w-7 sm:w-9 shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-tr from-[#00FFFF]/20 to-[#00FFFF]/5 rounded-full blur opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className={cn(
                "relative w-full h-full flex items-center justify-center rounded-full border backdrop-blur-xl transition-all duration-300",
                "bg-[#111]/80 border-[#00FFFF]/40 shadow-[0_0_15px_rgba(0,255,255,0.2)]"
              )}>
                <Globe className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-500 group-hover:rotate-12 menu-icon-anim" />
                <select
                  value={selectedCountry}
                  onChange={(e) => handleLocationSelect("country", e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer appearance-none w-full h-full"
                >
                  <option value="" className="bg-[#1a1a1a] text-white">PAÍS</option>
                  {spanishSpeakingCountriesMenu.map((c) => (
                    <option key={c.country} value={c.labelCountry} className="bg-[#1a1a1a] text-white">
                      {c.labelCountry}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>



        {/* Service Ticker */}
        <ServiceTicker />
      </div>

      {/* Services Menu Overlay */}
      <ServiceCategories
        isOpen={isServicesMenuOpen}
        onClose={() => {
          setIsServicesMenuOpen(false);
          if (isSelectingProfessionForFilter) {
            setIsFiltersMenuOpen(true);
            setIsSelectingProfessionForFilter(false);
          }
        }}
        menuSearchTerm={menuSearchTerm}
        setMenuSearchTerm={setMenuSearchTerm}
        expandedCategory={expandedCategory}
        setExpandedCategory={setExpandedCategory}
        handleServiceSelect={handleServiceSelect}
      />

      {/* Filters Menu Overlay */}
      {isFiltersMenuOpen && (
        <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full h-[90vh] sm:h-[80vh] bg-surface-lowest flex flex-col rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-10 duration-500">
            {/* Menu Header */}
            <div className="sticky top-0 z-10 bg-surface-lowest/90 backdrop-blur-xl border-b border-outline-variant/30 px-5 pt-8 pb-4 flex items-center justify-between">
              <div className="flex items-center justify-center flex-1 gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center border border-primary-container/30">
                  <SlidersHorizontal className="w-5 h-5 text-primary-container" />
                </div>
                <h2 className="text-base font-black text-on-surface uppercase tracking-normal whitespace-nowrap">
                  Filtros Avanzados
                </h2>
              </div>
              <button
                onClick={() => setIsFiltersMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-highest text-on-surface-variant transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Filters Content */}
            <div className="flex-1 overflow-y-auto px-5 py-6 hide-scrollbar flex flex-col gap-8">
              {/* Profession Filter */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                  Profesión / Servicio
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsSelectingProfessionForFilter(true);
                    setIsFiltersMenuOpen(false);
                    setIsServicesMenuOpen(true);
                  }}
                  className="w-full bg-surface-container/50 border border-outline-variant/30 hover:border-primary-container/50 text-on-surface text-sm rounded-xl px-4 py-3.5 focus:outline-none transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-4 h-4 text-on-surface-variant group-hover:text-primary-container transition-colors" />
                    <span
                      className={cn(
                        "truncate font-medium",
                        !filterProfession && "text-on-surface-variant",
                      )}
                    >
                      {filterProfession || "Seleccionar profesión..."}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-on-surface-variant shrink-0 group-hover:text-primary-container transition-colors" />
                </button>
              </div>

              {/* Rating Filter */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                  Calificación Mínima
                </h3>
                <div className="flex gap-2">
                  {[0, 3, 4, 4.5, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setFilterRating(rating)}
                      className={cn(
                        "flex-1 py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1",
                        filterRating === rating
                          ? "bg-primary-container/20 border-primary-container text-primary-container shadow-[0_0_10px_rgba(0,255,255,0.2)]"
                          : "bg-surface-container/50 border-outline-variant/30 text-on-surface-variant hover:border-primary-container/30",
                      )}
                    >
                      {rating === 0 ? (
                        "Todas"
                      ) : (
                        <>
                          {rating}+ <Star className="w-3 h-3 fill-current" />
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                  Rango de Precios ($)
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="10"
                      placeholder="Mínimo"
                      value={filterMinPrice}
                      onChange={(e) => setFilterMinPrice(e.target.value)}
                      className="w-full bg-surface-container/50 border border-outline-variant/50 focus:border-primary-container rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant transition-colors"
                    />
                  </div>
                  <span className="text-on-surface-variant font-bold">-</span>
                  <div className="flex-1">
                    <input
                      type="number"
                      placeholder="Máximo"
                      value={filterMaxPrice}
                      onChange={(e) => setFilterMaxPrice(e.target.value)}
                      className="w-full bg-surface-container/50 border border-outline-variant/50 focus:border-primary-container rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Availability Filter */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                  Disponibilidad Horaria
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {["Mañana", "Tarde", "Noche", "Fines de semana", "24/7"].map(
                    (avail) => (
                      <button
                        key={avail}
                        onClick={() =>
                          setFilterAvailability(
                            filterAvailability === avail ? "" : avail,
                          )
                        }
                        className={cn(
                          "py-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2",
                          filterAvailability === avail
                            ? "bg-primary-container/20 border-primary-container text-primary-container shadow-[0_0_10px_rgba(0,255,255,0.2)]"
                            : "bg-surface-container/50 border-outline-variant/30 text-on-surface-variant hover:border-primary-container/30",
                        )}
                      >
                        <Clock className="w-4 h-4" />
                        {avail}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-5 border-t border-outline-variant/30 bg-surface-lowest">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setFilterProfession("");
                    setFilterRating(0);
                    setFilterMinPrice("");
                    setFilterMaxPrice("");
                    setFilterAvailability("");
                  }}
                  className="flex-1 py-3 rounded-xl border border-outline-variant/50 text-on-surface-variant font-bold text-sm hover:bg-surface-container transition-colors"
                >
                  Limpiar
                </button>
                <button
                  onClick={() => setIsFiltersMenuOpen(false)}
                  className="flex-[2] py-3 rounded-xl bg-primary-container text-surface-lowest font-black text-sm shadow-[0_0_15px_rgba(0,255,255,0.4)] hover:shadow-[0_0_25px_rgba(0,255,255,0.6)] transition-all"
                >
                  Aplicar Filtros
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Area */}
      <div className="relative flex-1 w-full bg-surface-lowest overflow-hidden flex flex-col -my-[5px] z-[1]">
        {/* Background Decorative Text - "The Message" */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-[0] overflow-hidden">
          <span className="text-[25vw] font-black italic uppercase tracking-tighter rotate-[-12deg] select-none whitespace-nowrap text-white">
            MENSAJE
          </span>
        </div>

        {/* Top UI Layout */}
        <div className="absolute top-0 left-0 right-0 z-[1000] flex flex-col pointer-events-none">
          <div className="flex justify-between items-start px-0 pt-0">
            <SearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              setIsFiltersMenuOpen={setIsFiltersMenuOpen}
              hasFilters={
                !!(
                  filterRating > 0 ||
                  filterMinPrice ||
                  filterMaxPrice ||
                  filterAvailability ||
                  filterProfession
                )
              }
            />
          </div>

          {/* Floating Categories row - Dynamic and modern */}
          <div className="px-4 py-1 flex overflow-x-auto gap-2 pointer-events-auto no-scrollbar z-10">
            {MAP_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() =>
                  setMapCategoryFilter(
                    mapCategoryFilter === cat.id ? null : cat.id,
                  )
                }
                className={cn(
                  "flex-shrink-0 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full border text-[9px] sm:text-[10px] font-bold transition-all uppercase tracking-[1px] cursor-pointer backdrop-blur-xl",
                  mapCategoryFilter === cat.id
                    ? "bg-[#00FFFF] text-black border-[#00FFFF] shadow-[0_0_15px_rgba(0,255,255,0.4)]"
                    : "bg-black/60 text-white/50 border-white/5 hover:border-[#00FFFF]/30 hover:text-white",
                )}
              >
                {cat.label.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "").trim() ||
                  cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Floating Telemetry Control HUD */}
        <div className="absolute right-4 top-16 flex flex-col items-end gap-2.5 z-[1001]">
          <button
            onClick={() => setShowTelemetryConsole((prev) => !prev)}
            className={cn(
              "p-2 sm:px-3 sm:py-2 rounded-2xl text-[9px] sm:text-[10px] font-black tracking-widest uppercase border transition-all flex items-center gap-1.5 shadow-xl active:scale-95 pointer-events-auto",
              showTelemetryConsole
                ? "bg-[#00FFFF] text-black border-[#00FFFF] shadow-[0_0_20px_rgba(0,255,255,0.5)]"
                : "bg-black/90 text-[#00FFFF] border-[#00FFFF]/20 hover:border-[#00FFFF]/50"
            )}
          >
            <Radio className={cn("w-4 h-4", showTelemetryConsole && "animate-pulse")} />
            <span className="hidden sm:inline">Telemetry Live</span>
            <span className="inline sm:hidden">LIVE</span>
          </button>

          <AnimatePresence>
            {showTelemetryConsole && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="w-[280px] sm:w-[350px] bg-black/95 backdrop-blur-xl border border-[#00FFFF]/30 rounded-3xl p-4 sm:p-5 shadow-2xl overflow-hidden pointer-events-auto max-h-[70vh] flex flex-col"
              >
                <div className="flex items-center justify-between border-b border-[#00FFFF]/10 pb-3 mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <h4 className="text-[10px] sm:text-xs font-black tracking-[2px] text-white uppercase font-sans">
                      TELEMETRÍA PINPRO LIVE
                    </h4>
                  </div>
                  <button
                    onClick={() => setShowTelemetryConsole(false)}
                    className="p-1 hover:bg-white/10 rounded-full transition-all text-white/50 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3.5 text-left flex-1 overflow-y-auto no-scrollbar">
                  {/* Info de Rol */}
                  <div className="bg-[#050505] border border-white/5 rounded-2xl p-3 flex flex-col gap-1.5 font-sans">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-white/40 font-mono">USUARIO LOGGEADO:</span>
                      <span className="text-white font-bold">{profile?.name || user?.email || "Invitado"}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-white/40 font-mono">ROL SISTEMA:</span>
                      <span className={cn(
                        "font-black tracking-wider uppercase",
                        profile?.role === 'Profesional' ? "text-green-400" : "text-amber-400"
                      )}>
                        {profile?.role || "Cliente/Invitado"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-white/40 font-mono">CLON INTEGRADO:</span>
                      <span className={activeVirtualPro ? "text-[#00FFFF] font-bold" : "text-white/30"}>
                        {activeVirtualPro ? "SÍ (ACTIVO)" : "NO"}
                      </span>
                    </div>

                    {profile?.role !== 'Profesional' && (
                      <button
                        onClick={toggleVirtualClone}
                        className={cn(
                          "mt-2 w-full py-2 rounded-xl text-[9px] font-black tracking-[1.5px] uppercase transition-all shadow border cursor-pointer",
                          activeVirtualPro
                            ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                            : "bg-[#00FFFF]/10 text-[#00FFFF] border-[#00FFFF]/20 hover:bg-[#00FFFF]/20"
                        )}
                      >
                        {activeVirtualPro ? "ELIMINAR CLON TELEMETRISTA" : "GENERAR CLON PRO VIRTUAL"}
                      </button>
                    )}
                  </div>

                  {/* BOTONES CAMINATA LATENCIA CERO */}
                  {(profile?.role === 'Profesional' || activeVirtualPro) ? (
                    <div className="bg-[#050505] border border-white/5 rounded-2xl p-3 font-sans">
                      <h5 className="text-[9px] font-black tracking-wider text-white/50 uppercase mb-2">
                        DESPLAZAMIENTO MANUAL (LATENCIA CERO)
                      </h5>
                      <p className="text-[8px] text-white/30 mb-3 leading-normal font-sans">
                        Mueve el pin optimísticamente por Lechería. Se reflejará de inmediato en tu pantalla antes de escribir en Firestore.
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <button
                          onClick={() => {
                            const id = activeVirtualPro || user?.uid || "";
                            const p = professionals.find(x => x.id === id) || { latitude: 10.2117, longitude: -64.6735 };
                            updateProLocationOptimistically(id, p.latitude + 0.0003, p.longitude);
                          }}
                          className="py-1.5 bg-white/5 rounded-xl border border-white/10 hover:border-[#00FFFF]/30 hover:bg-white/10 text-white font-mono active:scale-95 transition-all text-center cursor-pointer"
                        >
                          ▲ NORTE (+30m)
                        </button>
                        <button
                          onClick={() => {
                            const id = activeVirtualPro || user?.uid || "";
                            const p = professionals.find(x => x.id === id) || { latitude: 10.2117, longitude: -64.6735 };
                            updateProLocationOptimistically(id, p.latitude - 0.0003, p.longitude);
                          }}
                          className="py-1.5 bg-white/5 rounded-xl border border-white/10 hover:border-[#00FFFF]/30 hover:bg-white/10 text-white font-mono active:scale-95 transition-all text-center cursor-pointer"
                        >
                          ▼ SUR (-30m)
                        </button>
                        <button
                          onClick={() => {
                            const id = activeVirtualPro || user?.uid || "";
                            const p = professionals.find(x => x.id === id) || { latitude: 10.2117, longitude: -64.6735 };
                            updateProLocationOptimistically(id, p.latitude, p.longitude + 0.00035);
                          }}
                          className="py-1.5 bg-white/5 rounded-xl border border-white/10 hover:border-[#00FFFF]/30 hover:bg-white/10 text-white font-mono active:scale-95 transition-all text-center cursor-pointer"
                        >
                          ► ESTE (+30m)
                        </button>
                        <button
                          onClick={() => {
                            const id = activeVirtualPro || user?.uid || "";
                            const p = professionals.find(x => x.id === id) || { latitude: 10.2117, longitude: -64.6735 };
                            updateProLocationOptimistically(id, p.latitude, p.longitude - 0.00035);
                          }}
                          className="py-1.5 bg-white/5 rounded-xl border border-white/10 hover:border-[#00FFFF]/30 hover:bg-white/10 text-white font-mono active:scale-95 transition-all text-center cursor-pointer"
                        >
                          ◄ OESTE (-30m)
                        </button>
                      </div>

                      <div className="text-[8px] text-[#00FFFF]/80 font-mono mt-3 leading-normal border-t border-[#00FFFF]/10 pt-2 bg-black/40 px-2 py-1.5 rounded-lg text-center">
                        💡 CONEXIÓN ACTIVA: ¡Toca en cualquier parte del mapa para teletransportar tu pin instantáneamente!
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#050505] border border-white/5 rounded-2xl p-3 text-center text-white/40 py-5 font-sans">
                      <p className="text-[10px] italic">Activa el clon profesional o tu rol de Socio Pro para probar la telemetría en tiempo real sobre tu pin.</p>
                    </div>
                  )}

                  {/* CONVERTIDOR DE ERRORES / FALLAS */}
                  <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-3 font-sans">
                    <div className="flex items-center justify-between">
                      <div className="pr-4">
                        <h5 className="text-[9px] font-black tracking-wider text-red-400 uppercase">
                          FORZAR FALLO DE ESCRITURA
                        </h5>
                        <p className="text-[8px] text-white/40 leading-normal mt-0.5 font-sans">
                          Simula falla de red de Firestore; tu pin se moverá optimísticamente y luego fallará y regresará al original.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={forceWriteFailure}
                          onChange={(e) => setForceWriteFailure(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500"></div>
                      </label>
                    </div>
                  </div>

                  {/* FEED LIVE CONSOLA */}
                  <div className="bg-black border border-[#00FFFF]/15 rounded-2xl p-3 flex flex-col h-[130px] shrink-0 font-mono">
                    <div className="flex justify-between items-center border-b border-white/5 pb-1.5 mb-1.5 text-[8px] font-black text-white/50 tracking-wider">
                      <span>MONITOR DE RED EN TIEMPO REAL</span>
                      <span className="text-[#00FFFF]">FEED LOGS</span>
                    </div>
                    <div className="flex-1 overflow-y-auto font-mono text-[8.5px] leading-relaxed space-y-1 scrollbar-thin scrollbar-thumb-zinc-800 text-left">
                      {telemetryLogs.length === 0 ? (
                        <span className="text-white/20 select-none italic text-center block pt-8 font-sans">Ningún evento capturado. Consola lista.</span>
                      ) : (
                        telemetryLogs.map((log) => (
                          <div
                            key={log.id}
                            className={cn(
                              log.type === 'success' ? 'text-green-400' :
                              log.type === 'warn' ? 'text-amber-400 font-bold' :
                              log.type === 'error' ? 'text-red-400 font-bold' : 'text-zinc-300'
                            )}
                          >
                            {log.msg}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <SafeBoundary componentName="MapArea">
          <SafeHydration>
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              zoomControl={false}
              className="w-full h-full z-0 min-h-[400px]"
              style={{ background: "#05070a", height: "100%", width: "100%" }}
              preferCanvas={true}
              onLocationUpdate={(newPos) => setUserLocation(newPos)}
            >
              <MapResizer />
              <MapEvents setBounds={setMapBounds} setZoom={setMapZoom} onMapClick={handleMapClick} />
              <RecenterMap center={mapCenter} zoom={mapZoom} />

              {userLocation && (
                <Marker
                  position={userLocation}
                  icon={userIcon}
                  zIndexOffset={5000}
                />
              )}

              {clusters.map((cluster) => {
                const [longitude, latitude] = cluster.geometry.coordinates;
                const { cluster: isCluster, point_count: pointCount } =
                  cluster.properties;

                if (isCluster) {
                  if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) return null;
                  return (
                    <Marker
                      key={`cluster-${cluster.id}`}
                      position={[latitude, longitude]}
                      icon={clusterIconCache(pointCount)}
                      eventHandlers={{
                        click: () => {
                          const expansionZoom = Math.min(
                            supercluster.getClusterExpansionZoom(
                              cluster.id as number,
                            ),
                            20,
                          );
                          setMapZoom(expansionZoom);
                          setMapCenter([latitude, longitude]);
                        },
                      }}
                    />
                  );
                }

                const pro = cluster.properties as any;
                if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) return null;

                const categoryTitle = getCategoryForProfession(
                  pro.profession || "",
                );
                const categoryConfig = MAP_CATEGORIES.find(
                  (c) => c.match === categoryTitle,
                );
                const markerColor = categoryConfig?.color || "#00FFFF";
                const markerEmoji = categoryConfig?.emoji || "📍";

                const customIcon = markerIconCache(
                  markerColor,
                  markerEmoji,
                  pro.photoUrl,
                  pro.isPremium,
                  pro.isElite,
                  pro.proId
                );

                return (
                  <Marker
                    key={`pro-${pro.proId}`}
                    position={[latitude, longitude]}
                    icon={customIcon}
                    eventHandlers={{ click: () => setSelectedPro(pro) }}
                  />
                );
              })}
            </MapContainer>
          </SafeHydration>
        </SafeBoundary>

        {/* Map Controls */}
        <div className="absolute left-4 bottom-[200px] flex flex-col gap-3 z-20">
          <VoiceAssistant
            userLocation={userLocation ? { lat: userLocation[0], lng: userLocation[1] } : null}
            findProfessionals={(category, loc) => handleFindProfessionals(category, loc ? [loc.lat, loc.lng] : null)}
            className="w-11 h-11 sm:w-12 sm:h-12 !rounded-full !border-0 shadow-lg"
          />
        </div>
      </div>

      {/* Recommended Pros List */}
      <div
        className={cn(
          "absolute bottom-0 left-0 w-full z-20 px-[10px] pb-0 transition-all duration-500 pointer-events-none",
          viewMode === "mobile"
            ? "h-fit max-h-[40vh] bg-gradient-to-t from-[rgba(0,0,0,0.8)] to-transparent pt-8"
            : "bg-gradient-to-t from-surface-lowest via-surface-lowest to-transparent pt-16 pb-2",
        )}
      >
        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className="flex flex-col gap-1 px-4 pt-1 items-center">
            <div className="flex justify-center items-center flex-wrap gap-2 mb-1 w-full relative z-10 pointer-events-auto">
              <button
                onClick={() => setMapOnlineFilter(!mapOnlineFilter)}
                className={cn(
                  "px-4 py-2 sm:px-5 sm:py-2.5 rounded-full border text-[9px] sm:text-[11px] font-black transition-all flex items-center justify-center gap-1.5 sm:gap-2 backdrop-blur-xl uppercase tracking-widest shrink-0 active:scale-95 shadow-sm min-w-0 max-w-full",
                  mapOnlineFilter
                    ? "bg-surface-lowest/90 text-white border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.15)]"
                    : "bg-[#252830]/90 text-on-surface border-transparent hover:border-green-500/40",
                )}
              >
                <div
                  className={cn(
                    "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0",
                    mapOnlineFilter
                      ? "bg-green-500 shadow-[0_0_8px_#22c55e]"
                      : "bg-green-500/50",
                  )}
                ></div>
                <span className="truncate">En línea ahora</span>
              </button>

              <button
                onClick={requestAndLocate}
                disabled={isRequestingLocation}
                className={cn(
                  "w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-black/80 border-2 flex items-center justify-center transition-all active:scale-95 led-tornasol shadow-xl z-20 mx-1 shrink-0",
                  isRequestingLocation ? "opacity-50 pointer-events-none" : "hover:scale-110"
                )}
              >
                {isRequestingLocation ? (
                  <Loader2 className="w-4 h-4 sm:w-7 sm:h-7 animate-spin text-[#00FFFF]" />
                ) : (
                  <Navigation className="w-5 h-5 sm:w-8 sm:h-8 text-white -rotate-45" />
                )}
              </button>

              <MapPrefetchControl />

              <button
                onClick={() => setShowReqModal(true)}
                className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-[#00FF66] text-black font-black text-[9px] sm:text-[11px] uppercase tracking-widest shadow-[0_0_15px_rgba(0,255,102,0.3)] active:scale-95 transition-all text-center shrink-0 min-w-0 max-w-full truncate overflow-hidden"
              >
                <span className="truncate inline-block w-full text-center">VER REQUISITOS</span>
              </button>
            </div>

            <h3 className="text-[9px] sm:text-[11px] font-black text-white/90 tracking-[0.25em] uppercase text-center mt-1">
              Profesionales Cerca
            </h3>
          </div>

          <SafeBoundary componentName="ProfessionalsHorizontalList">
            <div
              className={cn(
                "flex hide-scrollbar px-4 gap-3",
                viewMode === "mobile"
                  ? "flex-row overflow-x-auto pb-0 snap-x snap-mandatory"
                  : "flex-row overflow-x-auto pb-4 snap-x snap-mandatory",
              )}
            >
              {loading ? (
                <div
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 bg-surface-container/50 backdrop-blur-xl rounded-[16px] border border-outline-variant/20",
                    viewMode === "mobile" ? "py-4 w-full" : "py-10 px-8 w-full",
                  )}
                >
                  <Loader2 className="w-5 h-5 sm:w-8 sm:h-8 text-primary-container animate-spin" />
                  <span className="text-primary-container font-black text-[8px] sm:text-xs uppercase tracking-[0.2em] animate-pulse">
                    Sincronizando...
                  </span>
                </div>
              ) : (
                <ProfessionalHorizontalList
                  professionals={filteredProfessionals}
                  searchTerm={searchTerm}
                  viewMode={viewMode}
                  lastVisible={lastVisible}
                  loadMoreProfessionals={loadMoreProfessionals}
                  isMoreLoading={isMoreLoading}
                />
              )}
            </div>
          </SafeBoundary>
        </div>
        {selectedPro && (
          <ProfessionalCard
            professional={selectedPro}
            onClose={() => setSelectedPro(null)}
          />
        )}

        {showLocationModal && (
          <div className="fixed inset-0 bg-black/60 z-[4000] flex items-center justify-center p-6 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-surface-lowest p-5 rounded-[24px] max-w-[240px] w-full shadow-2xl border border-outline-variant/20 flex flex-col items-center text-center"
            >
              <div className="w-10 h-10 bg-primary-container/10 rounded-full flex items-center justify-center mb-3 border border-primary-container/20">
                <LocateFixed className="w-5 h-5 text-primary-container" />
              </div>
              <h3 className="text-sm font-black text-on-surface mb-1 uppercase tracking-tight">
                Activar Ubicación
              </h3>
              <p className="text-[11px] text-on-surface-variant/80 font-medium leading-tight mb-5 px-2">
                Activa tu GPS para encontrar los mejores expertos en tu zona
                activa.
              </p>
              <div className="flex flex-col w-full gap-2">
                <button
                  onClick={requestAndLocate}
                  className="w-full py-2.5 rounded-xl font-black bg-primary-container text-surface-lowest shadow-lg uppercase tracking-widest text-[9px] hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Activar
                </button>
                <button
                  onClick={() => setShowLocationModal(false)}
                  className="w-full py-2 rounded-lg font-black text-on-surface-variant uppercase tracking-widest text-[8px] hover:text-white transition-colors"
                >
                  Ahora no
                </button>
              </div>
            </motion.div>
          </div>
        )}

        <AnimatePresence>
          {showReqModal && (
            <div
              className="fixed inset-0 z-[100000] bg-black/60 backdrop-blur-sm w-full h-full flex items-center justify-center p-4"
              onClick={() => setShowReqModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="relative w-full max-w-[360px] bg-[#111] border border-white/10 rounded-[32px] shadow-[0_20px_80px_rgba(0,0,0,0.8)] p-8 text-center flex flex-col items-center justify-center pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-16 h-16 rounded-full bg-[#00FFFF]/10 flex items-center justify-center mb-6 border border-[#00FFFF]/20 shadow-[0_0_30px_rgba(0,255,255,0.15)] shrink-0">
                  <Globe className="w-8 h-8 text-[#00FFFF]" />
                </div>

                <h3 className="text-xl font-black text-white mb-6 uppercase tracking-[0.15em] leading-tight">
                  Requisitos:<br/>
                  <span className="text-[#00FFFF]">{selectedCountry || "General"}</span>
                </h3>

                <div className="w-full space-y-4 mb-8">
                  {selectedCountry === "Venezuela" ? (
                    <>
                      <div className="flex items-center gap-4 text-left p-3 rounded-2xl bg-white/5 border border-white/5">
                        <div className="w-8 h-8 rounded-full bg-[#00FFFF]/20 flex items-center justify-center text-[#00FFFF] shrink-0 border border-[#00FFFF]/30">
                          <Check className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-white/90">Cédula de Identidad vigente</span>
                      </div>
                      <div className="flex items-center gap-4 text-left p-3 rounded-2xl bg-white/5 border border-white/5">
                        <div className="w-8 h-8 rounded-full bg-[#00FFFF]/20 flex items-center justify-center text-[#00FFFF] shrink-0 border border-[#00FFFF]/30">
                          <Check className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-white/90">Número telefónico nacional</span>
                      </div>
                      <div className="flex items-center gap-4 text-left p-3 rounded-2xl bg-white/5 border border-white/5">
                        <div className="w-8 h-8 rounded-full bg-[#00FFFF]/20 flex items-center justify-center text-[#00FFFF] shrink-0 border border-[#00FFFF]/30">
                          <Check className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-white/90">Cuenta bancaria local</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-4 text-left p-3 rounded-2xl bg-white/5 border border-white/5">
                        <div className="w-8 h-8 rounded-full bg-[#00FFFF]/20 flex items-center justify-center text-[#00FFFF] shrink-0 border border-[#00FFFF]/30">
                          <Check className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-white/90">Identificación oficial vigente</span>
                      </div>
                      <div className="flex items-center gap-4 text-left p-3 rounded-2xl bg-white/5 border border-white/5">
                        <div className="w-8 h-8 rounded-full bg-[#00FFFF]/20 flex items-center justify-center text-[#00FFFF] shrink-0 border border-[#00FFFF]/30">
                          <Check className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-white/90">Comprobante de domicilio</span>
                      </div>
                      <div className="flex items-center gap-4 text-left p-3 rounded-2xl bg-white/5 border border-white/5">
                        <div className="w-8 h-8 rounded-full bg-[#00FFFF]/20 flex items-center justify-center text-[#00FFFF] shrink-0 border border-[#00FFFF]/30">
                          <Check className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-white/90">Registro fiscal</span>
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowReqModal(false);
                    if (user) {
                      navigate("/dashboard");
                    } else {
                      navigate("/register");
                    }
                  }}
                  className="w-full bg-[#00FF66] text-black rounded-2xl font-black py-4 shadow-[0_0_30px_rgba(0,255,102,0.3)] hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-[11px] cursor-pointer pointer-events-auto"
                >
                  Continuar
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowReqModal(false);
                  }}
                  className="mt-6 text-[11px] font-black text-white/40 uppercase tracking-[0.2em] hover:text-white transition-colors cursor-pointer pointer-events-auto py-2"
                >
                  Cerrar
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
