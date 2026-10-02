import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot, updateDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { trackScreenTransition } from '../lib/masterBrainTracker';

export interface ServiceItem {
  id: string;
  title: string;
  desc: string;
  price: string;
  unit: string;
}

export interface Preferences {
  fav_categories?: string[];
  last_search?: string;
}

export interface BreakTime {
  day: string;
  start: string;
  end: string;
  enabled: boolean;
}

export interface ViewStat {
  userId?: string;
  timestamp: any;
}

export interface Certification {
  isCertified: boolean;
  status: 'none' | 'pending' | 'verified' | 'rejected';
  documentType: string;
  documentNumber: string;
  documentImageUrl: string;
  submittedAt: any;
  verifiedAt: any;
  rejectionReason: string | null;
}

export interface Activity {
  pinsCreated: number;
  jobsCompleted: number;
  rating: number;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: 'Cliente' | 'Profesional' | 'Admin' | 'Referidor' | 'Agente';
  preferences?: Preferences;
  country?: string;
  state?: string;
  municipality?: string;
  latitude?: number;
  longitude?: number;
  gender?: 'Masculino' | 'Femenino' | 'Otro';
  age?: number;
  zodiacSign?: string;
  status: 'Activo' | 'Bloqueado';
  profession?: string;
  yearsOfExperience?: number;
  bio?: string;
  photoUrl?: string;
  instagram?: string;
  facebook?: string;
  isOnline?: boolean;
  isPremium?: boolean;
  isElite?: boolean;
  isAdmin?: boolean;
  isNewUser?: boolean;
  location?: { latitude: number; longitude: number } | string;
  rating?: number;
  completedJobs?: number;
  tags?: string[];
  referralCode?: string;
  referredBy?: string | null;
  services?: ServiceItem[];
  breakTimes?: BreakTime[];
  viewStats?: ViewStat[];
  portfolio?: string[];
  videoUrl?: string;
  verificationDocs?: string[];
  verificationStatus?: 'none' | 'pending' | 'verified' | 'rejected';
  certification?: Certification;
  activity?: Activity;
  baseScore?: number;
  trustBoost?: number;
  premiumBoost?: number;
  activityBoost?: number;
  locationBoost?: number;
  adminBoost?: number;
  adminBoostExpiry?: any;
  adminBoostReason?: string;
  penalties?: number;
  finalScore?: number;
  deviceOS?: string;
  createdAt: any;
}

const getDeviceOS = () => {
  const userAgent = window.navigator.userAgent || window.navigator.vendor || (window as any).opera;
  if (/android/i.test(userAgent)) {
      return "Android";
  }
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      return "iOS";
  }
  return "Otro";
};

export type AuthStateType = 'LOADING' | 'UNAUTHENTICATED' | 'AUTHENTICATED';

export interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  authState: AuthStateType;
  isNavigating: boolean;
  isInitialized: boolean;
  setIsNavigating: (val: boolean) => void;
  refreshAdminStatus: () => void;
  refreshProfile: () => void;
  switchRole: (newRole: 'Cliente' | 'Profesional') => Promise<void>;
  handleNavigateWithTelemetry: (currentRoute: string, targetRoute: string, navigateFn: Function) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isAdmin: false,
  loading: true,
  authState: 'LOADING',
  isNavigating: false,
  isInitialized: false,
  setIsNavigating: () => {},
  refreshAdminStatus: () => {},
  refreshProfile: () => {},
  switchRole: async () => {},
  handleNavigateWithTelemetry: () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [syncTrigger, setSyncTrigger] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const refreshProfile = useCallback(() => {
    setSyncTrigger(prev => prev + 1);
  }, []);

  const handleNavigateWithTelemetry = useCallback((currentRoute: string, targetRoute: string, navigateFn: Function) => {
    const tracker = trackScreenTransition(currentRoute, targetRoute, user);

    try {
      setIsNavigating(true);
      navigateFn(targetRoute);
      tracker.resolveTransition('SUCCESS');
    } catch (error: any) {
      tracker.resolveTransition('BLOCKED', error.message);
    } finally {
      // Liberamos el candado después de un breve delay para que la pantalla de destino se monte
      setTimeout(() => setIsNavigating(false), 500);
    }
  }, [user]);

  // existing code...

  const switchRole = async (newRole: 'Cliente' | 'Profesional') => {
    if (!user || !profile || profile.role === newRole) return;

    const oldCollection = profile.role === 'Cliente' ? 'clientes' : 'profesionales';
    const newCollection = newRole === 'Cliente' ? 'clientes' : 'profesionales';

    try {
      // 1. First ensure it exists in the NEW collection with the new role
      try {
        await setDoc(doc(db, newCollection, user.uid), {
          ...profile,
          role: newRole,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        // Log this specifically to know if setDoc failed
        handleFirestoreError(err, OperationType.WRITE, `${newCollection}/${user.uid}`);
        throw err;
      }

      // 2. Then DELETE from the OLD collection to prevent stale data
      try {
        await deleteDoc(doc(db, oldCollection, user.uid));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `${oldCollection}/${user.uid}`);
        throw err;
      }

      console.log(`Role moved successfully to ${newCollection}`);
      refreshProfile();
    } catch (error) {
      throw error;
    }
  };
  const [isAdmin, setIsAdmin] = useState(() => {
    // Initial check on mount
    const hasSecretSession = localStorage.getItem('isAdminAuth') === 'true' || sessionStorage.getItem('isAdminAuth') === 'true';
    return hasSecretSession;
  });
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState<AuthStateType>('LOADING');

  const refreshAdminStatus = useCallback(() => {
    const isAdminEmail = ['mr.willyc0295@gmail.com', 'publicpost0295@gmail.com'].includes(user?.email?.toLowerCase() || '');
    const hasSecretSession = localStorage.getItem('isAdminAuth') === 'true' || sessionStorage.getItem('isAdminAuth') === 'true';

    setIsAdmin(isAdminEmail || hasSecretSession);
  }, [user]);

  useEffect(() => {
    refreshAdminStatus();
  }, [user, refreshAdminStatus]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth State Changed:", firebaseUser);
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setAuthState('UNAUTHENTICATED');
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let unsubscribeProfile: (() => void) | null = null;
    let isMounted = true;

    const setupProfileListener = async () => {
      try {
        // Only trigger full loading if we have NO profile yet
        if (isMounted && !profile) setLoading(true);

        const collectionsToCheck = ['clientes', 'profesionales', 'referidores', 'agentes'];
        let foundCollection = '';

        const results = await Promise.all(
          collectionsToCheck.map(async (col) => {
            try {
              const snap = await getDoc(doc(db, col, user.uid));
              return snap.exists() ? col : null;
            } catch (e) {
              return null;
            }
          })
        );
        foundCollection = results.filter(Boolean)[0] || '';

        if (!isMounted) return;

        const collectionToListen = foundCollection || 'clientes';

        unsubscribeProfile = onSnapshot(doc(db, collectionToListen, user.uid), (snap) => {
          if (!isMounted) return;

          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            const isAdminEmail = ['mr.willyc0295@gmail.com', 'publicpost0295@gmail.com'].includes(user.email?.toLowerCase() || '');

            setProfile(prev => {
              const newData = {
                ...data,
                uid: user.uid,
                email: data.email || user.email || '',
                role: isAdminEmail ? 'Admin' : (data.role as any)
              };

              if (prev &&
                  prev.uid === newData.uid &&
                  prev.role === newData.role &&
                  prev.name === newData.name &&
                  prev.photoUrl === newData.photoUrl &&
                  prev.email === newData.email &&
                  prev.status === newData.status &&
                  JSON.stringify(prev.location) === JSON.stringify(newData.location)
              ) {
                return prev;
              }
              return newData;
            });
          } else {
            if (['mr.willyc0295@gmail.com', 'publicpost0295@gmail.com'].includes(user.email?.toLowerCase() || '')) {
              setProfile({
                uid: user.uid,
                name: 'Willy C (Admin)',
                email: user.email!,
                role: 'Admin',
                status: 'Activo',
                createdAt: new Date()
              } as any);
            } else {
              setProfile(prev => {
                if (prev && (prev as any).isNewUser && prev.uid === user.uid) {
                  return prev;
                }
                return {
                  uid: user.uid,
                  name: '',
                  email: user.email || '',
                  role: 'Cliente',
                  status: 'Activo',
                  isNewUser: true,
                  bypassActive: true
                } as any;
              });
            }
          }
          setAuthState('AUTHENTICATED');
          setLoading(false);
        }, (error) => {
          if (isMounted) {
            console.warn('[AuthContext] Permission error suppressed:', error.message);
            setProfile(prev => {
              if (prev && (prev as any).isNewUser && (prev as any).permissionsError && prev.uid === user.uid) {
                return prev;
              }
              return {
                uid: user.uid,
                name: 'Usuario Temporal',
                email: user.email || '',
                role: 'Cliente',
                status: 'Activo',
                isNewUser: true,
                bypassActive: true,
                permissionsError: true
              } as any;
            });
            setLoading(false);
          }
        });
      } catch (error) {
        if (isMounted) {
          console.error('[AuthContext] setupProfileListener error:', error);
          setLoading(false);
        }
      }
    };

    setupProfileListener();

    return () => {
      isMounted = false;
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [user?.uid, syncTrigger]);

  const [lastProfileWasNew, setLastProfileWasNew] = useState<boolean | null>(null);

  useEffect(() => {
    if (profile) {
      sessionStorage.setItem('pinpro_cached_role', profile.role || 'Cliente');
      sessionStorage.setItem('pinpro_cached_email', profile.email || '');
      sessionStorage.setItem('pinpro_cached_name', profile.name || '');
    } else {
      sessionStorage.removeItem('pinpro_cached_role');
      sessionStorage.removeItem('pinpro_cached_email');
      sessionStorage.removeItem('pinpro_cached_name');
    }
  }, [profile]);

  useEffect(() => {
    if (profile) {
      const isNew = !!(profile as any).isNewUser;
      if (lastProfileWasNew === true && isNew === false) {
        // We transitioned from new user to real user!
        // Stabilize the UI for a moment to allow routers to catch up
        setIsNavigating(true);
        setTimeout(() => setIsNavigating(false), 800);
      }
      setLastProfileWasNew(isNew);
    }
  }, [profile, lastProfileWasNew]);

  const value = useMemo(() => ({
    user,
    profile,
    isAdmin,
    loading,
    authState,
    isNavigating,
    isInitialized,
    setIsNavigating,
    refreshAdminStatus,
    refreshProfile,
    switchRole,
    handleNavigateWithTelemetry
  }), [user, profile, isAdmin, loading, authState, isNavigating, isInitialized, setIsNavigating, refreshAdminStatus, refreshProfile, switchRole, handleNavigateWithTelemetry]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
