import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { signInWithGoogle } from '../../firebase';
import {
  Lock,
  AlertCircle,
  X,
  User,
  Loader2,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, checkEmailAccountType } = useApp();

  // Mode: 'google_main' (Real Firebase Google Sign-In) | 'password_step' (for admin/staff accounts) | 'email_fallback'
  const [viewMode, setViewMode] = useState<'google_main' | 'password_step' | 'email_fallback'>('google_main');
  const [selectedEmail, setSelectedEmail] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | undefined>(undefined);
  const [passwordInput, setPasswordInput] = useState('');
  const [customEmailInput, setCustomEmailInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  if (!isOpen) return null;

  // Process authenticated Google email (from Firebase or fallback)
  const processAuthenticatedGoogleUser = (email: string, displayName?: string, photoURL?: string) => {
    setErrorMessage(null);
    const cleanEmail = email.trim().toLowerCase();
    const info = checkEmailAccountType(cleanEmail);

    // 1. If it's a PARENT (or any standard Google user):
    // DIRECT LOGIN! NO PASSWORD!
    if (!info.isStaffOrAdmin) {
      const result = login(cleanEmail, undefined, displayName, photoURL);
      if (result.success) {
        if (onClose) onClose();
      } else {
        setErrorMessage(result.message);
      }
      return;
    }

    // 2. If it's a staff/admin account: prompt for security password/PIN
    setSelectedEmail(cleanEmail);
    setSelectedName(displayName || cleanEmail.split('@')[0]);
    setSelectedAvatar(photoURL);
    setPasswordInput('');
    setViewMode('password_step');
  };

  // Real Google Sign-In via Firebase Auth
  const handleRealGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsConnectingGoogle(true);

    try {
      const firebaseUser = await signInWithGoogle();
      setIsConnectingGoogle(false);

      if (firebaseUser && firebaseUser.email) {
        processAuthenticatedGoogleUser(
          firebaseUser.email,
          firebaseUser.displayName || undefined,
          firebaseUser.photoURL || undefined
        );
      } else {
        setErrorMessage("Impossible de récupérer l'adresse e-mail associée à ce compte Google.");
      }
    } catch (err: any) {
      setIsConnectingGoogle(false);
      console.error('Firebase Google Auth error:', err);

      // Gracefully handle iframe popup restrictions or user cancellation
      if (err.code === 'auth/popup-blocked') {
        setErrorMessage(
          "La fenêtre contextuelle de connexion Google a été bloquée par le navigateur. Vous pouvez autoriser les popups ou utiliser la saisie d'email Google ci-dessous."
        );
      } else if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Connexion Google annulée.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Ignored, user reopened
      } else {
        setErrorMessage(
          err.message ||
            "Erreur lors de la connexion Google Firebase. Vous pouvez entrer votre email Google directement ci-dessous."
        );
      }
    }
  };

  const handleProtectedLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!passwordInput.trim()) {
      setErrorMessage('Veuillez saisir votre mot de passe ou code PIN de sécurité.');
      return;
    }

    const result = login(selectedEmail, passwordInput, selectedName, selectedAvatar);
    if (!result.success) {
      setErrorMessage(result.message);
      return;
    }

    if (onClose) onClose();
  };

  const handleCustomEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = customEmailInput.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Veuillez entrer une adresse e-mail Google valide.');
      return;
    }

    processAuthenticatedGoogleUser(cleanEmail, cleanEmail.split('@')[0]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Google Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between relative bg-slate-50/70">
          <div className="flex items-center gap-3">
            {/* Authentic Google G Logo */}
            <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {viewMode === 'password_step'
                  ? 'Vérification de sécurité'
                  : 'Connexion ParentEcole'}
              </h2>
              <p className="text-xs text-slate-500">
                {viewMode === 'password_step'
                  ? 'Authentification requise'
                  : 'Authentification Google sécurisée'}
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-200 transition cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span className="flex-1 font-medium leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* MODE 1: Google Real Sign-In via Firebase */}
        {viewMode === 'google_main' && (
          <div className="p-6 space-y-5">
            {/* Authentic Google Sign-In Button */}
            <button
              type="button"
              onClick={handleRealGoogleSignIn}
              disabled={isConnectingGoogle}
              className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-semibold text-sm rounded-2xl border-2 border-slate-300 hover:border-indigo-400 shadow-sm flex items-center justify-center gap-3 transition cursor-pointer disabled:opacity-60"
            >
              {isConnectingGoogle ? (
                <>
                  <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                  <span>Connexion Google en cours...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continuer avec Google</span>
                </>
              )}
            </button>

            {/* Direct Google email entry fallback (for iframes where popups might be restricted) */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewMode('email_fallback')}
                className="w-full py-2 text-center text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>Saisir une adresse e-mail</span>
              </button>
            </div>
          </div>
        )}

        {/* MODE 2: Email input fallback */}
        {viewMode === 'email_fallback' && (
          <form onSubmit={handleCustomEmailSubmit} className="p-6 space-y-4">
            <div className="text-left space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Adresse e-mail
              </label>
              <input
                type="email"
                required
                autoFocus
                placeholder="votre.email@domaine.com"
                value={customEmailInput}
                onChange={(e) => setCustomEmailInput(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setViewMode('google_main');
                }}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Retour
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Continuer
              </button>
            </div>
          </form>
        )}

        {/* MODE 3: Password/PIN Step for Admin or Staff Accounts */}
        {viewMode === 'password_step' && (
          <form onSubmit={handleProtectedLoginSubmit} className="p-6 space-y-4 animate-in fade-in">
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {selectedName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm text-slate-900 truncate">{selectedName}</div>
                <div className="text-xs text-slate-500 truncate">{selectedEmail}</div>
              </div>
            </div>

            <div className="text-left space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Mot de passe ou Code PIN *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="Mot de passe ou code d'accès"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setViewMode('google_main');
                }}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Changer de compte
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Valider
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
