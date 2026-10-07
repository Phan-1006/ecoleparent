import { AuthProvider, useAuth } from '@pe/shared/auth';
import { MfaChallenge } from '@pe/shared/mfa';
import { isFirebaseConfigured } from '@pe/shared/firebase';
import { Loading, ToastProvider } from '@pe/shared/ui';
import { useState } from 'react';
import { AccessProvider, useAccessState } from './access';
import { Shell } from './components/Shell';
import { EnrollMfa, Login, MfaRelogin, NoAccess, SetupMissing, VerifyEmail } from './pages/Auth';
import { SuperSchools } from './pages/SuperSchools';
import { SchoolDataProvider } from './school';

export function App() {
  if (!isFirebaseConfigured) return <SetupMissing />;
  return (
    <ToastProvider>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </ToastProvider>
  );
}

function Gate() {
  const { user, loading, mfaPending } = useAuth();
  if (loading) return <Loading />;
  if (mfaPending) return <MfaChallenge />;
  if (!user) return <Login />;
  const usesPassword = user.providerData.some((p) => p.providerId === 'password');
  if (usesPassword && !user.emailVerified) return <VerifyEmail />;
  return <Authorized key={user.uid} />;
}

function Authorized() {
  const state = useAccessState();
  const { secondFactor, totpEnrolled } = useAuth();
  // Un super-administrateur choisit l'école qu'il veut ouvrir.
  const [openSchool, setOpenSchool] = useState<string | null>(null);

  if (state.status === 'loading') return <Loading label="Vérification de votre accès…" />;
  if (state.status === 'denied') return <NoAccess reason={state.reason} />;

  // Personnel et super-administrateurs : code d'une application d'authentification obligatoire
  // (les règles Firestore refusent tout accès sans lui).
  // Une session ouverte avec le code suffit (la liste des facteurs inscrits arrive parfois après).
  if (!secondFactor) return totpEnrolled ? <MfaRelogin /> : <EnrollMfa />;

  const { access } = state;
  const schoolId = access.isSuper ? openSchool : access.member!.schoolId;

  return (
    <AccessProvider access={access}>
      {schoolId ? (
        <SchoolDataProvider key={schoolId} schoolId={schoolId}>
          <Shell onLeaveSchool={access.isSuper ? () => setOpenSchool(null) : undefined} />
        </SchoolDataProvider>
      ) : (
        <SuperSchools onOpen={setOpenSchool} />
      )}
    </AccessProvider>
  );
}
