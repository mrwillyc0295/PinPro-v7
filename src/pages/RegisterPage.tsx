import { signOut } from "firebase/auth";
import {
  User,
  Briefcase,
  ArrowRight,
  Sparkles,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  Ticket,
  Camera,
  Upload,
  Loader2,
  Globe,
  MapPin,
  CheckCircle,
  X,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { auth, db, storage } from "../firebase";
import { spanishSpeakingCountriesMenu } from "../constants/countries";
// Add custom style to hide country names
const customStyles = `
  .country-name { display: none !important; }
`;
import {
  createUserWithEmailAndPassword,
  signInAnonymously,
  signInWithEmailAndPassword
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  serverTimestamp,
  query,
  collection,
  where,
  getDocs,
} from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { useAuth } from "../contexts/AuthContext";
import {
  handleFirestoreError,
  OperationType,
} from "../lib/firestoreErrorHandler";
import { useAuthSystem, RegistrationData } from "../hooks/useAuthSystem";
import { cn } from "../lib/utils";
import { Share2 as ShareIcon } from "lucide-react";

const resizeImage = (
  file: File,
  maxWidth: number,
  maxHeight: number,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

import neonMapBg from "../assets/images/neon_city_map_1776719564588.png";

export default function RegisterPage() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const initialRole = (routerLocation.state as any)?.initialRole;
  const {
    user: currentUser,
    profile,
    loading: authLoading,
    isAdmin,
    isNavigating,
    setIsNavigating,
    refreshAdminStatus,
    refreshProfile,
    handleNavigateWithTelemetry,
  } = useAuth();
  const [role, setRole] = useState<
    "Cliente" | "Profesional" | "Referidor" | "Agente"
  >(initialRole || "Cliente");
  const [isLogin, setIsLogin] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [appliedReferralCode, setAppliedReferralCode] = useState("");
  const [isReferralValid, setIsReferralValid] = useState<boolean | null>(null);
  const [isCheckingReferral, setIsCheckingReferral] = useState(false);
  const [referrerId, setReferrerId] = useState<string | null>(null);
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const referralTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [profession, setProfession] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | React.ReactNode>("");
  const [showSecretInput, setShowSecretInput] = useState(false);
  const [secretKey, setSecretKey] = useState("");

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [adminType1, setAdminType1] = useState("Estado");
  const [adminType2, setAdminType2] = useState("Municipio");

  const checkReferralRealTime = async (code: string) => {
    if (!code) {
      setIsReferralValid(null);
      return;
    }

    setIsCheckingReferral(true);
    try {
      const result = await validateReferralCode(code);
      setIsReferralValid(result.valid);
    } catch (err) {
      console.error("Error validating referral code:", err);
      setIsReferralValid(false);
    } finally {
      setIsCheckingReferral(false);
    }
  };

  useEffect(() => {
    if (referralTimeoutRef.current) {
      clearTimeout(referralTimeoutRef.current);
    }

    if (appliedReferralCode) {
      referralTimeoutRef.current = setTimeout(() => {
        checkReferralRealTime(appliedReferralCode);
      }, 600); // 600ms debounce
    } else {
      setIsReferralValid(null);
    }

    return () => {
      if (referralTimeoutRef.current) {
        clearTimeout(referralTimeoutRef.current);
      }
    };
  }, [appliedReferralCode]);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationStatusMessage, setLocationStatusMessage] = useState("");

  const { registrarUsuario, loginConEmail } = useAuthSystem();

  const detectPreciseGPSLocation = (preferredCountryName?: string) => {
    if (!navigator.geolocation) {
      setError(
        "La geolocalización no está soportada por tu navegador o dispositivo.",
      );
      return;
    }

    setDetectingLocation(true);
    setLocationStatusMessage("Solicitando permisos GPS de alta precisión...");
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lon);

        setLocationStatusMessage(
          "Coordenadas fijadas. Geolocalizando tu Municipio y Estado...",
        );

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=es`,
          );
          if (!response.ok) throw new Error("Respuesta de red incorrecta.");
          const data = await response.json();

          if (data && data.address) {
            const addr = data.address;
            const nominatimCountryCode = (
              addr.country_code || ""
            ).toUpperCase();

            // Buscar país coincidente
            let matchedCountry = spanishSpeakingCountriesMenu.find(
              (c) => c.country === nominatimCountryCode,
            );

            // Fallback al país preferido si el GPS dio otra cosa pero está cerca
            if (!matchedCountry && preferredCountryName) {
              matchedCountry = spanishSpeakingCountriesMenu.find(
                (c) => c.labelCountry === preferredCountryName,
              );
            }

            if (matchedCountry) {
              setCountry(matchedCountry.labelCountry);
              setAdminType1(matchedCountry.adminType1);
              setAdminType2(matchedCountry.adminType2);

              const nominatimState =
                addr.state || addr.region || addr.province || "";

              // Buscamos coincidencia aproximada de Estado
              const matchedState = matchedCountry.children.find((s) => {
                const cleanS = s.name
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "");
                const cleanNom = nominatimState
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "");
                return cleanS.includes(cleanNom) || cleanNom.includes(cleanS);
              });

              if (matchedState) {
                setState(matchedState.name);

                // Buscamos coincidencia aproximada de Municipio
                const nominatimMuni =
                  addr.county ||
                  addr.city ||
                  addr.town ||
                  addr.village ||
                  addr.suburb ||
                  addr.municipality ||
                  "";

                if (matchedState.children) {
                  const matchedMuni = matchedState.children.find((m) => {
                    const cleanM = m.name
                      .toLowerCase()
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "");
                    const cleanNom = nominatimMuni
                      .toLowerCase()
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "");
                    return (
                      cleanM.includes(cleanNom) || cleanNom.includes(cleanM)
                    );
                  });

                  if (matchedMuni) {
                    setMunicipality(matchedMuni.name);
                    setLocationStatusMessage(
                      `Precisión de GPS Activa: ${matchedCountry.labelCountry} -> ${matchedState.name} -> ${matchedMuni.name}`,
                    );
                  } else {
                    // Si no coincide exactamente, asignamos el primero o limpiamos para que elija
                    const firstMuni = matchedState.children[0]?.name || "";
                    setMunicipality(firstMuni);
                    setLocationStatusMessage(
                      `GPS: ${matchedCountry.labelCountry}, ${matchedState.name}. Por favor selecciona o confirma tu ${matchedCountry.adminType2}.`,
                    );
                  }
                } else {
                  setMunicipality("");
                  setLocationStatusMessage(
                    `GPS: ${matchedCountry.labelCountry}, ${matchedState.name}.`,
                  );
                }
              } else {
                // Selecciona el primer estado disponible si no se detectó exacto
                if (matchedCountry.children.length > 0) {
                  const firstState = matchedCountry.children[0];
                  setState(firstState.name);
                  if (firstState.children && firstState.children.length > 0) {
                    setMunicipality(firstState.children[0].name);
                  }
                }
                setLocationStatusMessage(
                  `GPS detectó país: ${matchedCountry.labelCountry}. Selecciona tu ${matchedCountry.adminType1}.`,
                );
              }
            } else {
              setError(
                "Tu ubicación GPS actual corresponde a un país fuera de nuestra cobertura.",
              );
            }
          } else {
            setError(
              "No pudimos autodetectar la dirección. Por favor selecciona tu ubicación.",
            );
          }
        } catch (apiErr) {
          console.warn(
            "Fallo de red geocoding, activando fallback local:",
            apiErr,
          );
          const fallbackCountryName =
            preferredCountryName || country || "Venezuela";
          let countryData = spanishSpeakingCountriesMenu.find(
            (c) => c.labelCountry === fallbackCountryName,
          );
          if (!countryData) {
            countryData = spanishSpeakingCountriesMenu[0];
          }
          if (countryData) {
            setCountry(countryData.labelCountry);
            setAdminType1(countryData.adminType1);
            setAdminType2(countryData.adminType2);
            if (countryData.children && countryData.children.length > 0) {
              const firstState = countryData.children[0];
              setState(firstState.name);
              if (firstState.children && firstState.children.length > 0) {
                setMunicipality(firstState.children[0].name);
              }
            }
            setLocationStatusMessage(
              "Conexión con satélite limitada. Por favor, ajusta o confirma tu ubicación de forma manual.",
            );
          } else {
            setError(
              "Fallo de red al buscar la ubicación. Por favor rellena manualmente.",
            );
          }
        } finally {
          setDetectingLocation(false);
        }
      },
      (geoErr) => {
        console.error("GPS Error:", geoErr);
        let errorMsg = "Error al consultar GPS.";
        if (geoErr.code === 1) {
          errorMsg =
            "Debes otorgar permisos de ubicación para autodetectar tu zona de servicio.";
        }
        setError(errorMsg);
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    );
  };

  const handleCountryChange = (countryLabel: string) => {
    setCountry(countryLabel);
    setState("");
    setMunicipality("");
    const countryData = spanishSpeakingCountriesMenu.find(
      (c) => c.labelCountry === countryLabel,
    );
    if (countryData) {
      setAdminType1(countryData.adminType1);
      setAdminType2(countryData.adminType2);

      // Autocomplete if unique options exist
      if (countryData.children.length === 1) {
        const firstState = countryData.children[0];
        setState(firstState.name);

        if (firstState.children && firstState.children.length === 1) {
          setMunicipality(firstState.children[0].name);
        }
      }

      // Auto-trigger GPS detection (ignoring explicit state overrides if already selected, but auto-triggering on first pick)
      detectPreciseGPSLocation(countryLabel);
    }
  };

  const handleStateChange = (stateName: string) => {
    setState(stateName);
    setMunicipality("");
  };

  useEffect(() => {
    // Inject custom styles
    const style = document.createElement("style");
    style.innerHTML = customStyles;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    // AuthGuard (requireAuth={false}) handles redirection for authenticated users.
  }, []);

  const handleSecretSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedKey = secretKey.replace(/\s+/g, "");
    if (sanitizedKey === "11739552") {
      localStorage.setItem("isAdminAuth", "true");
      refreshAdminStatus();
      handleNavigateWithTelemetry(routerLocation.pathname, "/admin", navigate);
    } else {
      setError("Clave incorrecta");
      setShowSecretInput(false);
      setSecretKey("");
    }
  };

  const getCollectionName = (selectedRole: string) => {
    if (selectedRole === "Cliente") return "clientes";
    if (selectedRole === "Profesional") return "profesionales";
    if (selectedRole === "Referidor") return "referidores";
    if (selectedRole === "Agente") return "agentes";
    return "clientes";
  };

  const validateReferralCode = async (code: string) => {
    if (!code) return { valid: false, referrerId: null, name: null };
    const formattedCode = code.trim().toUpperCase();

    const collectionsToCheck = [
      "clientes",
      "profesionales",
      "referidores",
      "agentes",
    ];
    for (const collName of collectionsToCheck) {
      try {
        const q = query(
          collection(db, collName),
          where("referralCode", "==", formattedCode),
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docData = snap.docs[0].data();
          if (docData.status === "Activo") {
            const rId = snap.docs[0].id;
            const rName = docData.name || "";
            setReferrerId(rId);
            setReferrerName(rName);
            return { valid: true, referrerId: rId, name: rName };
          }
        }
      } catch (err) {
        console.warn(`Error querying ${collName} collection:`, err);
      }
    }

    setReferrerId(null);
    setReferrerName(null);
    return { valid: false, referrerId: null, name: null };
  };

  const handleLeadCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError("Por favor, ingresa tu nombre y número de WhatsApp.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const leadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const path = `whatsapp_contacts/${leadId}`;
      try {
        await setDoc(doc(db, "whatsapp_contacts", leadId), {
          name: name.trim(),
          phone: phone.trim(),
          role: role,
          type: "lead",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      console.error("Error saving lead:", err);
      setError("Error al guardar tus datos. Por favor, inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const base64Image = await resizeImage(file, 800, 800);
      setProfileImage(base64Image);
    } catch (error) {
      console.error("Error resizing image:", String(error));
      setError("Hubo un error al procesar la imagen.");
    } finally {
      setLoading(false);
    }
  };

  const validateEmailForm = () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Por favor, ingresa un correo electrónico válido.");
      return false;
    }
    if (!password.trim() || password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return false;
    }

    if (isLogin) {
      return true;
    }

    if (!name.trim()) {
      setError("Por favor, ingresa tu nombre completo.");
      return false;
    }
    if (name.trim().length < 3) {
      setError("El nombre debe tener al menos 3 caracteres.");
      return false;
    }
    if (!phone || phone.length < 8) {
      setError("Por favor, ingresa un número de teléfono de WhatsApp válido.");
      return false;
    }
    if (!country) {
      setError("Por favor, selecciona tu país.");
      return false;
    }
    if (!state) {
      setError(`Por favor, selecciona tu ${adminType1}.`);
      return false;
    }
    if (!municipality) {
      setError(`Por favor, selecciona tu ${adminType2}.`);
      return false;
    }
    return true;
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateEmailForm()) return;

    try {
      setLoading(true);

      if (isLogin) {
        const result = await loginConEmail(email, password);
        if (!result.success) {
           setError(result.error || "Error al iniciar sesión");
           setLoading(false);
           return;
        }
        navigate("/", { replace: true });
        return;
      }

      // Registro con Upsert
      const registrationData: RegistrationData = {
        email: email.trim(),
        password: password,
        name: name.trim(),
        phone: phone.startsWith("+") ? phone : `+${phone}`,
        role: role,
        country,
        state,
        municipality,
        coordinates: latitude && longitude ? { latitude, longitude } : null,
        profession: role === "Profesional" ? profession : undefined
      };

      const result = await registrarUsuario(registrationData);

      if (!result.success) {
        if (result.error?.includes("auth/operation-not-allowed")) {
           setError(
             <span>
               <b>Error de Configuración:</b> El método de autenticación por Email/Password no está habilitado en Firebase.
               <br/>Por favor, actívalo en la consola de Firebase.
             </span>
           );
        } else {
           setError(result.error || "Error en el registro");
        }
        setLoading(false);
        return;
      }

      setSuccess(true);
      navigate("/", { replace: true });
    } catch (err: any) {
      console.error("Error in handleEmailRegister:", err);
      setError(err.message || "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  /* handleGoogleLogin removed: Google auth is deprecated */

  const [step, setStep] = useState(initialRole ? 2 : 1);

  // ... (inside the component return)
  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col bg-black overflow-x-hidden max-w-xl mx-auto">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50"
        style={{ backgroundImage: `url(${neonMapBg})` }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-black/40"></div>

      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-64 bg-primary-container/10 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary-container/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="flex-1 flex flex-col justify-center px-0 pt-12 pb-8 z-10">
        {/* Header */}
        <div className="mb-10 text-center flex flex-col items-center">
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="flex items-center gap-1">
              <span
                className="text-8xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-[#00FFFF] to-[#B026FF] drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]"
                style={{
                  fontFamily: "system-ui, sans-serif",
                  WebkitTextStroke: "2px rgba(0,255,255,0.2)",
                }}
              >
                Pin
              </span>
              <span
                className="text-8xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-[#B026FF] to-[#FF00FF] drop-shadow-[0_0_15px_rgba(176,38,255,0.5)]"
                style={{
                  fontFamily: "system-ui, sans-serif",
                  WebkitTextStroke: "2px rgba(176,38,255,0.2)",
                }}
              >
                Pro
              </span>
            </div>
          </div>
          {step === 2 && (
            <h1 className="text-2xl font-black text-on-surface mb-2 tracking-tight">
              Crea tu cuenta
            </h1>
          )}
          {step === 2 && (
            <p className="text-sm text-on-surface-variant font-medium">
              Registra tu información y dale CLICK 1 y después CLICK 2.
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 text-red-400 text-sm text-center bg-red-500/10 p-3 rounded-lg border border-red-500/20">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 text-green-400 text-sm text-center bg-green-500/10 p-3 rounded-lg border border-green-500/20">
            ¡Datos guardados! Nos pondremos en contacto contigo pronto.
          </div>
        )}
        {!authLoading && currentUser && (
          <div className="mb-6 text-center">
            <p className="text-white/60 text-sm mb-2">
              Ya has iniciado sesión como {currentUser.email}.
            </p>
            <button
              onClick={async () => {
                await signOut(auth);
                window.location.reload();
              }}
              className="bg-white/10 hover:bg-white/20 text-[#00FFFF] py-2 px-4 rounded-lg text-sm font-bold transition-all"
            >
              Cerrar Sesión y Registrar otro correo
            </button>
          </div>
        )}

        <div className="flex flex-col gap-6 w-full pb-4 animate-in fade-in slide-in-from-bottom-5 duration-500">
          {step === 1 ? (
            <div className="flex flex-col items-center justify-center w-full gap-8 px-6">
              <div className="text-center">
                <h2 className="text-3xl font-black text-on-surface mb-3 tracking-tight">
                  Únete a PinPro
                </h2>
                <p className="text-sm text-on-surface-variant font-medium">
                  Selecciona tu perfil de usuario para continuar
                </p>
              </div>

              <div className="flex flex-col gap-4 w-full max-w-sm">
                {/* Profesional Card */}
                <button
                  onClick={() => {
                    setRole("Profesional");
                    setStep(2);
                  }}
                  className="group relative w-full h-24 bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all hover:bg-white/10 active:scale-[0.98] shadow-2xl"
                >
                  <div className="absolute top-0 right-0 p-4 pt-6">
                    <Briefcase className="w-16 h-16 text-[#B026FF]/10 -rotate-12 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="absolute inset-0 flex items-center px-6 gap-4">
                    <div className="w-12 h-12 shrink-0 bg-gradient-to-r from-[#B026FF] to-[#7C3AED] rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(176,38,255,0.4)]">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[#B026FF] font-black text-[9px] uppercase tracking-widest mb-0.5">
                        Quiero Trabajar
                      </span>
                      <span className="text-white font-black text-lg italic tracking-tighter uppercase leading-tight">
                        Soy Profesional
                      </span>
                    </div>
                  </div>
                </button>

                {/* Cliente Card */}
                <button
                  onClick={() => {
                    setRole("Cliente");
                    setStep(2);
                  }}
                  className="group relative w-full h-24 bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all hover:bg-white/10 active:scale-[0.98] shadow-2xl"
                >
                  <div className="absolute top-0 right-0 p-4 pt-6">
                    <User className="w-16 h-16 text-[#00FFFF]/10 rotate-12 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="absolute inset-0 flex items-center px-6 gap-4">
                    <div className="w-12 h-12 shrink-0 bg-[#00FFFF] rounded-xl flex items-center justify-center text-black shadow-[0_0_20px_rgba(0,255,255,0.4)]">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[#00FFFF] font-black text-[9px] uppercase tracking-widest mb-0.5">
                        Busco Ayuda
                      </span>
                      <span className="text-white font-black text-lg italic tracking-tighter uppercase leading-tight">
                        Soy Cliente
                      </span>
                    </div>
                  </div>
                </button>

                {/* Referidor Card */}
                <button
                  onClick={() => {
                    setRole("Referidor");
                    setStep(2);
                  }}
                  className="group relative w-full h-24 bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all hover:bg-white/10 active:scale-[0.98] shadow-2xl"
                >
                  <div className="absolute top-0 right-0 p-4 pt-6">
                    <ShareIcon className="w-16 h-16 text-[#00dc82]/10 rotate-12 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="absolute inset-0 flex items-center px-6 gap-4">
                    <div className="w-12 h-12 shrink-0 bg-[#00dc82] rounded-xl flex items-center justify-center text-black shadow-[0_0_20px_rgba(0,220,130,0.4)]">
                      <ShareIcon className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[#00dc82] font-black text-[9px] uppercase tracking-widest mb-0.5">
                        Membresías Limitadas
                      </span>
                      <span className="text-white font-black text-lg italic tracking-tighter uppercase leading-tight">
                        Trabajar como Referidor
                      </span>
                    </div>
                  </div>
                </button>

                {/* Agente Card */}
                <button
                  onClick={() => {
                    setRole("Agente");
                    setStep(2);
                  }}
                  className="group relative w-full h-24 bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all hover:bg-white/10 active:scale-[0.98] shadow-2xl"
                >
                  <div className="absolute top-0 right-0 p-4 pt-6">
                    <Sparkles className="w-16 h-16 text-[#FFD700]/10 -rotate-12 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="absolute inset-0 flex items-center px-6 gap-4">
                    <div className="w-12 h-12 shrink-0 bg-[#FFD700] rounded-xl flex items-center justify-center text-black shadow-[0_0_20px_rgba(255,215,0,0.4)]">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[#FFD700] font-black text-[9px] uppercase tracking-widest mb-0.5">
                        PinPro Exclusive
                      </span>
                      <span className="text-white font-black text-lg italic tracking-tighter uppercase leading-tight">
                        AGENTE PINPRO
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Role Indicator */}
              <div className="flex justify-center mb-6">
                <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full flex items-center gap-2">
                  {role === "Profesional" && (
                    <Briefcase className="w-4 h-4 text-[#B026FF]" />
                  )}
                  {role === "Cliente" && (
                    <User className="w-4 h-4 text-[#00FFFF]" />
                  )}
                  {role === "Referidor" && (
                    <ShareIcon className="w-4 h-4 text-[#00dc82]" />
                  )}
                  {role === "Agente" && (
                    <Sparkles className="w-4 h-4 text-[#FFD700]" />
                  )}
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
                    Perfil: {role}
                  </span>
                </div>
              </div>

              <form
                onSubmit={handleEmailRegister}
                className="flex flex-col gap-5 px-6 md:px-10"
              >
                <div className="flex flex-col gap-4">
                  {!isLogin && (
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => detectPreciseGPSLocation(country)}
                        disabled={detectingLocation}
                        className={cn(
                          "flex items-center justify-center gap-2 w-full h-[50px] border rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer",
                          detectingLocation
                            ? "bg-cyan-500/10 border-cyan-500/50 text-[#00FFFF] animate-pulse"
                            : "bg-[#00FFFF]/5 border-[#00FFFF]/20 text-[#00FFFF] hover:bg-[#00FFFF]/10 hover:border-[#00FFFF]/40",
                        )}
                      >
                        <MapPin
                          className={cn(
                            "w-4 h-4",
                            detectingLocation && "animate-bounce",
                          )}
                        />
                        {detectingLocation
                          ? "AUTODETECTANDO GPS..."
                          : "📍 GPS INTEGRADO DE ALTA PRECISIÓN"}
                      </button>

                      {locationStatusMessage && (
                        <div className="text-[10px] text-cyan-400/90 font-mono text-center tracking-tight bg-[#00FFFF]/5 border border-[#00FFFF]/10 py-2 px-3 rounded-xl">
                          {locationStatusMessage}
                        </div>
                      )}
                    </div>
                  )}

                  {!isLogin && (
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 z-10" />
                      <input
                        id="nombre_completo"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={
                          role === "Cliente"
                            ? "Tu Nombre Completo"
                            : role === "Profesional"
                              ? "Nombre Completo del Profesional"
                              : role === "Referidor"
                                ? "Nombre Completo del Referidor"
                                : "Nombre Completo del Agente"
                        }
                        className={cn(
                          "w-full bg-white/5 border border-white/10 text-white text-sm text-center rounded-2xl h-[56px] px-12 focus:outline-none transition-all",
                          role === "Profesional"
                            ? "focus:border-[#B026FF]"
                            : role === "Referidor"
                              ? "focus:border-[#00dc82]"
                              : role === "Agente"
                                ? "focus:border-[#FFD700]"
                                : "focus:border-[#00FFFF]",
                        )}
                      />
                    </div>
                  )}

                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 z-10" />
                    <input
                      id="correo_electronico"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Correo Electrónico"
                      className="w-full bg-white/5 border border-white/10 text-white text-sm text-center rounded-2xl h-[56px] px-12 focus:outline-none focus:border-[#00FFFF] transition-all"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 z-10" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Contraseña (mín. 6 caracteres)"
                      className="w-full bg-white/5 border border-white/10 text-white text-sm text-center rounded-2xl h-[56px] px-12 focus:outline-none focus:border-[#00FFFF] transition-all"
                      required
                    />
                  </div>

                  {!isLogin && (
                    <div className="relative">
                    <PhoneInput
                      country={"do"}
                      onlyCountries={[
                        "ar",
                        "bo",
                        "cl",
                        "co",
                        "cr",
                        "cu",
                        "do",
                        "ec",
                        "es",
                        "gq",
                        "gt",
                        "hn",
                        "mx",
                        "ni",
                        "pa",
                        "pe",
                        "pr",
                        "py",
                        "sv",
                        "uy",
                        "ve",
                      ]}
                      value={phone}
                      onChange={(value: string, data: any) => {
                        setPhone(value);
                        if (data && data.countryCode) {
                          // Mapa simple de countryCode a labelCountry de spanishSpeakingCountriesMenu
                          const countryMap: Record<string, string> = {
                            do: "República Dominicana",
                            ve: "Venezuela",
                            co: "Colombia",
                            ar: "Argentina",
                            mx: "México",
                            es: "España",
                            pe: "Perú",
                            cl: "Chile",
                            ec: "Ecuador",
                            bo: "Bolivia",
                            uy: "Uruguay",
                            py: "Paraguay",
                            pa: "Panamá",
                            cr: "Costa Rica",
                            ni: "Nicaragua",
                            hn: "Honduras",
                            sv: "El Salvador",
                            gt: "Guatemala",
                            cu: "Cuba",
                          };
                          const countryName =
                            countryMap[data.countryCode.toLowerCase()];
                          if (countryName && countryName !== country) {
                            handleCountryChange(countryName);
                          }
                        }
                      }}
                      inputClass="!w-full !bg-transparent !border-0 !text-white !text-sm !text-center !h-[56px] !px-[48px] !m-0"
                      containerClass="!w-full !bg-white/5 !border !border-white/10 !rounded-2xl !h-[56px]"
                      buttonClass="!bg-transparent !border-0 !border-r !border-white/10 !left-0 !rounded-l-2xl !h-[56px] !z-10"
                      dropdownClass="!bg-black !text-white !border-white/10 !rounded-xl"
                      placeholder="WhatsApp"
                    />
                    </div>
                  )}

                  {!isLogin && role === "Cliente" && (
                    <div className="relative">
                      <Sparkles className="absolute left-4 top-4 w-5 h-5 text-[#00FFFF] z-10" />
                      <textarea
                        value={profession}
                        onChange={(e) => setProfession(e.target.value)}
                        placeholder="¿Qué servicio profesional necesitas?"
                        className="w-full bg-white/5 border border-white/10 text-white text-sm text-center rounded-2xl py-4 px-12 focus:outline-none focus:border-[#00FFFF] transition-all min-h-[100px]"
                      />
                    </div>
                  )}

                  {!isLogin && role === "Profesional" && (
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 z-10" />
                      <select
                        value={profession}
                        onChange={(e) => setProfession(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 text-white text-sm text-center rounded-2xl h-[56px] px-12 focus:outline-none focus:border-[#B026FF] transition-all appearance-none"
                      >
                        <option value="">Selecciona tu profesión</option>
                        <option value="Electricista">Electricista</option>
                        <option value="Plomero">Plomero</option>
                        <option value="Carpintero">Carpintero</option>
                        <option value="Limpieza">Limpieza</option>
                        {/* Add more as needed */}
                      </select>
                    </div>
                  )}

                  {/* Location Selection */}
                  {!isLogin && (
                    <div className="grid grid-cols-1 gap-4">
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 z-10" />
                        <select
                          value={country}
                          onChange={(e) => handleCountryChange(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 text-white text-sm text-center rounded-2xl h-[56px] px-12 focus:outline-none focus:border-[#00FFFF] transition-all appearance-none"
                        >
                          <option value="">Selecciona tu país</option>
                          {spanishSpeakingCountriesMenu.map((c) => (
                            <option
                              key={c.country}
                              value={c.labelCountry}
                              className="bg-black text-white"
                            >
                              {c.labelCountry}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 z-10" />
                          <select
                            value={state}
                            onChange={(e) => handleStateChange(e.target.value)}
                            disabled={!country}
                            className="w-full bg-white/5 border border-white/10 text-white rounded-2xl h-[56px] px-10 text-center focus:outline-none focus:border-[#00FFFF] transition-all appearance-none disabled:opacity-50 text-sm"
                          >
                            <option value="">{adminType1}</option>
                            {country &&
                              spanishSpeakingCountriesMenu
                                .find((c) => c.labelCountry === country)
                                ?.children.map((s) => (
                                  <option
                                    key={s.name}
                                    value={s.name}
                                    className="bg-black text-white"
                                  >
                                    {s.name}
                                  </option>
                                ))}
                          </select>
                        </div>

                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 z-10" />
                          <select
                            value={municipality}
                            onChange={(e) => setMunicipality(e.target.value)}
                            disabled={!state}
                            className="w-full bg-white/5 border border-white/10 text-white rounded-2xl h-[56px] px-10 text-center focus:outline-none focus:border-[#00FFFF] transition-all appearance-none disabled:opacity-50 text-sm"
                          >
                            <option value="">{adminType2}</option>
                            {state &&
                              spanishSpeakingCountriesMenu
                                .find((c) => c.labelCountry === country)
                                ?.children.find((s) => s.name === state)
                                ?.children?.map((m) => (
                                  <option
                                    key={m.name}
                                    value={m.name}
                                    className="bg-black text-white"
                                  >
                                    {m.name}
                                  </option>
                                ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-4">
                  {error && (
                    <div className="text-red-400 text-sm text-center bg-red-500/10 p-3 rounded-lg border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-in fade-in duration-300">
                      ⚠️ {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#00FFFF] to-[#B026FF] py-4 rounded-2xl text-white font-black uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,255,0.2)] hover:shadow-[0_0_30px_rgba(0,255,255,0.4)] transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    <span className="flex items-center justify-center gap-2">
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <ArrowRight className="w-5 h-5" />
                      )}
                      {loading ? "PROCESANDO..." : (isLogin ? "INICIAR SESIÓN" : "CREAR MI CUENTA")}
                    </span>
                  </button>

                  <div className="text-center text-sm text-white/70 mt-2">
                    {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
                    <button
                      type="button"
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-[#00FFFF] font-bold hover:underline"
                    >
                      {isLogin ? "Regístrate aquí" : "Inicia Sesión aquí"}
                    </button>
                  </div>
                </div>

                <div className="flex justify-center mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (initialRole) {
                        handleNavigateWithTelemetry(
                          routerLocation.pathname,
                          "/inicio-registro",
                          navigate,
                        );
                      } else {
                        setStep(1);
                      }
                    }}
                    className="text-white/40 text-[10px] font-black uppercase tracking-widest hover:text-white underline transition-colors cursor-pointer"
                  >
                    Volver Atrás
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Secret Admin Access */}
          {showSecretInput ? (
            <form
              onSubmit={handleSecretSubmit}
              className="mt-4 w-full animate-in fade-in zoom-in duration-300"
            >
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00FFFF]" />
                <input
                  type="password"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="PIN Administrativo..."
                  className="w-full bg-black/80 border border-[#00FFFF]/30 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-[#00FFFF] focus:ring-1 focus:ring-[#00FFFF] backdrop-blur-md text-sm"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowSecretInput(false)}
                  className="flex-1 py-2 rounded-lg border border-white/20 text-white/70 text-sm font-bold hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-[#00FFFF] to-[#B026FF] text-white text-sm font-bold shadow-[0_0_10px_rgba(0,255,255,0.3)]"
                >
                  Entrar
                </button>
              </div>
            </form>
          ) : (
            <div className="flex justify-center mt-2">
              <button
                onClick={() => setShowSecretInput(true)}
                className="w-10 h-10 rounded-full opacity-20 hover:opacity-100 focus:opacity-100 transition-opacity flex items-center justify-center cursor-default"
                aria-label="Acceso Administrativo"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
