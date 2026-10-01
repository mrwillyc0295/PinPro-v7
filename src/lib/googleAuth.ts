import { GoogleAuthProvider, signInWithPopup, linkWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/gmail.send');

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token in memory.
let cachedAccessToken: string | null = null;

// Initialize auth state listener. Call this on app load or mount.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Instead of signing in from scratch, we link the credential since the Admin is already logged in
export const connectGmail = async (): Promise<string | null> => {
  try {
    isSigningIn = true;
    const user = auth.currentUser;
    if (!user) throw new Error('No user is currently signed in');

    // Attempt to link, if already Google provider, maybe just signInWithPopup again?
    // Let's use signInWithPopup directly to get a fresh token if linking fails or isn't needed.
    // If they are an admin, they can just re-authenticate with Google.
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    return cachedAccessToken;
  } catch (error: any) {
    if (error.code === 'auth/credential-already-in-use') {
       // If credential already in use, try just signing in to get the token
       const result = await signInWithPopup(auth, provider);
       const credential = GoogleAuthProvider.credentialFromResult(result);
       cachedAccessToken = credential?.accessToken || null;
       return cachedAccessToken;
    }
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getGmailToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

// Send email using Gmail API
export const sendEmailViaGmail = async (token: string, to: string, subject: string, bodyText: string) => {
  // Construct email
  const emailLines = [];
  emailLines.push(`To: ${to}`);
  emailLines.push('Content-type: text/html;charset=iso-8859-1');
  emailLines.push('MIME-Version: 1.0');
  emailLines.push(`Subject: ${subject}`);
  emailLines.push('');
  emailLines.push(bodyText);

  const emailRaw = emailLines.join('\r\n');
  const base64EncodedEmail = btoa(unescape(encodeURIComponent(emailRaw))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: base64EncodedEmail
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Gmail API error: ${errorData.error?.message || response.statusText}`);
  }

  return response.json();
};
