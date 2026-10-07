import { useAuth, AuthProvider } from '@pe/shared/auth';
import { isFirebaseConfigured } from '@pe/shared/firebase';
import { Loading, ToastProvider } from '@pe/shared/ui';
import { useState } from 'react';
import { AccessProvider, useAccessState } from './access';
import { Shell } from './components/Shell';
import { Login, NoAccess, SetupMissing, VerifyEmail } from './pages/Auth';
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
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Login />;
  const usesPassword = user.providerData.some((p) => p.providerId === 'password');
  if (usesPassword && !user.emailVerified) return <VerifyEmail />;
  return <Authorized key={user.uid} />;
}

function Authorized() {
  const state = useAccessState();
  // Un super-administrateur choisit l'école qu'il veut ouvrir.
  const [openSchool, setOpenSchool] = useState<string | null>(null);

  if (state.status === 'loading') return <Loading label="Vérification de votre accès…" />;
  if (state.status === 'denied') return <NoAccess reason={state.reason} />;

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
