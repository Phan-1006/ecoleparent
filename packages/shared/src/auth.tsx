import {
  browserPopupRedirectResolver,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onIdTokenChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getFirebase } from './firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerification: () => Promise<void>;
  /** Recharge le compte (après vérification de l'e-mail) et rafraîchit le jeton. */
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { auth } = getFirebase();
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(true);
  // Change à chaque rafraîchissement pour que les écrans relisent `user`.
  const [, setVersion] = useState(0);

  useEffect(
    () =>
      onIdTokenChanged(auth, (u) => {
        setUser(u);
        setVersion((v) => v + 1);
        setLoading(false);
      }),
    [auth],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, [auth]);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
    await sendEmailVerification(cred.user).catch(() => undefined);
    await cred.user.getIdToken(true);
  }, [auth]);

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(auth, provider, browserPopupRedirectResolver);
  }, [auth]);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  }, [auth]);

  const sendVerification = useCallback(async () => {
    if (auth.currentUser) await sendEmailVerification(auth.currentUser);
  }, [auth]);

  const refresh = useCallback(async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    await auth.currentUser.getIdToken(true);
    setUser(auth.currentUser);
    setVersion((v) => v + 1);
  }, [auth]);

  const signOut = useCallback(async () => {
    await fbSignOut(auth);
  }, [auth]);

  const value = useMemo(
    () => ({ user, loading, signIn, signUp, signInWithGoogle, resetPassword, sendVerification, refresh, signOut }),
    [user, loading, signIn, signUp, signInWithGoogle, resetPassword, sendVerification, refresh, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>.');
  return ctx;
}

/** Prénom pour les salutations : displayName, sinon la partie locale de l'e-mail. */
export function firstName(user: User | null): string {
  const name = user?.displayName?.trim();
  if (name) return name.split(/\s+/)[0];
  const local = user?.email?.split('@')[0] ?? '';
  return local ? local.charAt(0).toUpperCase() + local.slice(1) : '';
}
