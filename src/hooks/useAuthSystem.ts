import {
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  signInAnonymously as firebaseSignInAnonymously,
  updateProfile,
  linkWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export interface RegistrationData {
  email: string;
  password?: string;
  name: string;
  phone: string;
  role: 'Cliente' | 'Profesional' | 'Referidor' | 'Agente';
  country?: string;
  state?: string;
  municipality?: string;
  coordinates?: { latitude: number; longitude: number } | null;
  bio?: string;
  profession?: string;
}

export const useAuthSystem = () => {
  /**
   * Registro con Upsert Logic:
   * Si el usuario ya es anónimo, vinculamos la cuenta de email.
   * Si no, creamos una nueva.
   */
  const registrarUsuario = async (data: RegistrationData) => {
    try {
      let user = auth.currentUser;

      if (user && user.isAnonymous && data.password) {
        // Vincular cuenta anónima con Email/Password
        const credential = EmailAuthProvider.credential(data.email, data.password);
        try {
          const result = await linkWithCredential(user, credential);
          user = result.user;
        } catch (error: any) {
          if (error.code === 'auth/email-already-in-use') {
             // Si el email ya existe, tal vez el usuario intentó registrarse de nuevo.
             // En este caso, simplemente iniciamos sesión de forma normal.
             const result = await firebaseSignInWithEmailAndPassword(auth, data.email, data.password);
             user = result.user;
          } else {
            throw error;
          }
        }
      } else if (data.password) {
        // Registro normal
        const result = await firebaseCreateUserWithEmailAndPassword(auth, data.email.trim(), data.password);
        user = result.user;
      } else {
        throw new Error("Contraseña requerida.");
      }

      // Actualizar perfil de Firebase Auth
      await updateProfile(user, { displayName: data.name });

      // Upsert en Firestore
      const collectionMapping: Record<string, string> = {
        'Cliente': 'clientes',
        'Profesional': 'profesionales',
        'Referidor': 'referidores',
        'Agente': 'agentes'
      };

      const collectionName = collectionMapping[data.role] || 'clientes';
      const userRef = doc(db, collectionName, user.uid);

      const profileData = {
        uid: user.uid,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        country: data.country || '',
        state: data.state || '',
        municipality: data.municipality || '',
        latitude: data.coordinates?.latitude || null,
        longitude: data.coordinates?.longitude || null,
        bio: data.bio || '',
        profession: data.profession || '',
        status: 'Activo',
        isNewUser: false,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp() // setDoc with merge will keep existing if already there, but we can't easily check here without a getDoc
      };

      // Si queremos un UPSERT real (preservar campos), merge: true es clave
      await setDoc(userRef, profileData, { merge: true });

      return { success: true, user };
    } catch (error: any) {
      console.error("DEBUG FIREBASE:", error.code, error.message);
      let errorMsg = error.code || error.message;

      if (error.message?.includes('requests-from-referer') && error.message?.includes('are-blocked')) {
        const domain = window.location.hostname;
        errorMsg = `🚨 Dominio No Autorizado: "${domain}". Por favor, agréguelo a 'Authorized Domains' en la consola de Firebase Authentication (Settings).`;
      }

      return { success: false, error: errorMsg };
    }
  };

  const loginConEmail = async (email: string, password: string) => {
    try {
      const { user } = await firebaseSignInWithEmailAndPassword(auth, email.trim(), password);
      return { success: true, user };
    } catch (error: any) {
      console.error("DEBUG FIREBASE:", error.code, error.message);
      let errorMsg = error.code || error.message;

      if (error.message?.includes('requests-from-referer') && error.message?.includes('are-blocked')) {
        const domain = window.location.hostname;
        errorMsg = `🚨 Dominio No Autorizado: "${domain}". Actívelo en la consola de Firebase.`;
      }

      return { success: false, error: errorMsg };
    }
  };

  /**
   * Acceso instantáneo (Anónimo)
   */
  const accesoInvitado = async () => {
    try {
      const { user } = await firebaseSignInAnonymously(auth);
      return { success: true, user };
    } catch (error: any) {
      console.error("DEBUG FIREBASE:", error.code, error.message);
      let errorMsg = error.code || error.message;

      if (error.message?.includes('requests-from-referer') && error.message?.includes('are-blocked')) {
        const domain = window.location.hostname;
        errorMsg = `🚨 Dominio No Autorizado: "${domain}". Verifique los ajustes de Firebase.`;
      }

      return { success: false, error: errorMsg };
    }
  };

  return { registrarUsuario, loginConEmail, accesoInvitado };
};
