import { addFcmToken, saveUserProfile } from '@pe/shared/api';
import { AuthProvider, useAuth } from '@pe/shared/auth';
import { MfaChallenge } from '@pe/shared/mfa';
import { getFirebase, isFirebaseConfigured } from '@pe/shared/firebase';
import { Loading, ToastProvider } from '@pe/shared/ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BottomNav, type Tab } from './components/BottomNav';
import { ParentDataProvider, useParentData } from './data';
import { onBackButton, setupPush, setupStatusBar } from './native';
import { Account } from './screens/Account';
import { AddChild } from './screens/AddChild';
import { AttendanceScreen } from './screens/Attendance';
import { FeesScreen } from './screens/Fees';
import { Home } from './screens/Home';
import { HomeworkScreen } from './screens/Homework';
import { Login } from './screens/Login';
import { Notifications } from './screens/Notifications';
import { SchoolScreen } from './screens/School';
import { SetupMissing } from './screens/SetupMissing';

export function App() {
  useEffect(() => {
    void setupStatusBar();
  }, []);
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
  if (loading) return <Splash />;
  if (mfaPending) return <MfaChallenge />;
  if (!user) return <Login />;
  return (
    <ParentDataProvider key={user.uid}>
      <Shell />
    </ParentDataProvider>
  );
}

function Splash() {
  return (
    <div className="flex h-full items-center justify-center bg-brand text-white">
      <Loading label="ParentEcole" />
    </div>
  );
}

export type Overlay = 'notifications' | 'account' | 'add-child' | null;

export interface Nav {
  tab: Tab;
  go: (tab: Tab) => void;
  open: (overlay: Exclude<Overlay, null>) => void;
  close: () => void;
}

function Shell() {
  const { user } = useAuth();
  const { loading, children } = useParentData();
  const [tab, setTab] = useState<Tab>('home');
  const [overlay, setOverlay] = useState<Overlay>(null);
  const state = useRef({ tab, overlay });
  state.current = { tab, overlay };

  const go = useCallback((t: Tab) => {
    setTab(t);
    setOverlay(null);
    document.getElementById('main-scroll')?.scrollTo({ top: 0 });
  }, []);
  const nav: Nav = { tab, go, open: setOverlay, close: () => setOverlay(null) };

  useEffect(
    () =>
      onBackButton(() => {
        if (state.current.overlay) {
          setOverlay(null);
          return true;
        }
        if (state.current.tab !== 'home') {
          setTab('home');
          return true;
        }
        return false;
      }),
    [],
  );

  // Profil et jeton de notification (si les push sont activées dans cette version de l'APK).
  useEffect(() => {
    if (!user) return;
    const { db } = getFirebase();
    void saveUserProfile(db, user.uid, { name: user.displayName ?? '', email: user.email ?? '' }).catch(() => undefined);
    void setupPush((token) => void addFcmToken(db, user.uid, token).catch(() => undefined));
  }, [user]);

  if (loading) return <Splash />;

  // Pas encore d'enfant lié : on commence par là.
  if (children.length === 0) return <AddChild first onDone={() => go('home')} />;

  if (overlay === 'add-child') return <AddChild onDone={() => go('home')} onCancel={() => setOverlay(null)} />;
  if (overlay === 'notifications') return <Notifications nav={nav} />;
  if (overlay === 'account') return <Account nav={nav} />;

  return (
    <div className="flex h-full flex-col bg-ground">
      <main id="main-scroll" className="flex-1 overflow-y-auto">
        {tab === 'home' && <Home nav={nav} />}
        {tab === 'fees' && <FeesScreen nav={nav} />}
        {tab === 'attendance' && <AttendanceScreen nav={nav} />}
        {tab === 'homework' && <HomeworkScreen nav={nav} />}
        {tab === 'school' && <SchoolScreen nav={nav} />}
      </main>
      <BottomNav tab={tab} onChange={go} />
    </div>
  );
}
