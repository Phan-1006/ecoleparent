import type { Member, StaffRole } from '@pe/shared';
import { refs } from '@pe/shared/api';
import { useAuth } from '@pe/shared/auth';
import { getFirebase } from '@pe/shared/firebase';
import { useLiveDoc } from '@pe/shared/hooks';
import { getDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface Access {
  email: string;
  name: string;
  isSuper: boolean;
  member: Member | null;
}

const Ctx = createContext<Access | null>(null);

export type AccessState =
  | { status: 'loading' }
  | { status: 'denied'; reason: 'none' | 'inactive' | 'error' }
  | { status: 'ok'; access: Access };

/** Détermine qui est connecté : super-administrateur, membre du personnel, ou personne. */
export function useAccessState(): AccessState {
  const { user } = useAuth();
  const { db } = getFirebase();
  const email = (user?.email ?? '').toLowerCase();
  const member = useLiveDoc<Member>(email ? `member:${email}` : null, () => refs.member(db, email));
  const [isSuper, setIsSuper] = useState<boolean | null>(null);

  useEffect(() => {
    if (!email) return;
    let alive = true;
    setIsSuper(null);
    getDoc(refs.superadmin(db, email))
      .then((snap) => alive && setIsSuper(snap.exists()))
      .catch(() => alive && setIsSuper(false));
    return () => {
      alive = false;
    };
  }, [db, email]);

  if (isSuper === null || member.loading) return { status: 'loading' };
  const name = member.data?.name || user?.displayName || email;
  if (isSuper) return { status: 'ok', access: { email, name, isSuper: true, member: member.data } };
  if (member.error) return { status: 'denied', reason: 'error' };
  if (!member.data) return { status: 'denied', reason: 'none' };
  if (!member.data.active) return { status: 'denied', reason: 'inactive' };
  return { status: 'ok', access: { email, name, isSuper: false, member: member.data } };
}

export function AccessProvider({ access, children }: { access: Access; children: ReactNode }) {
  return <Ctx.Provider value={access}>{children}</Ctx.Provider>;
}

export function useAccess(): Access {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAccess doit être utilisé dans <AccessProvider>.');
  return ctx;
}

/** Rôle effectif dans l'école ouverte (un super-administrateur agit comme la direction). */
export function useRole(): StaffRole {
  const a = useAccess();
  return a.isSuper ? 'admin' : (a.member?.role ?? 'professeur');
}
