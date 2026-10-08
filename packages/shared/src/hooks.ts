import { onSnapshot, type DocumentReference, type Query } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { fromDoc, fromQuery } from './api/refs';

export interface Live<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  /** Vrai si les données viennent du cache local (hors connexion). */
  fromCache: boolean;
}

/**
 * Abonnement temps réel à une requête Firestore. `key` identifie la requête :
 * l'abonnement est refait seulement quand `key` change. `key` à null = pas de requête.
 */
export function useLiveQuery<T>(key: string | null, make: () => Query): Live<T[]> {
  const [state, setState] = useState<Live<T[]>>({ data: [], loading: key !== null, error: null, fromCache: false });
  const makeRef = useRef(make);
  makeRef.current = make;

  useEffect(() => {
    if (key === null) {
      setState({ data: [], loading: false, error: null, fromCache: false });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    return onSnapshot(
      makeRef.current(),
      { includeMetadataChanges: false },
      (snap) => setState({ data: fromQuery<T>(snap), loading: false, error: null, fromCache: snap.metadata.fromCache }),
      (error) => {
        console.warn(`[firestore] ${key}`, error);
        setState({ data: [], loading: false, error, fromCache: false });
      },
    );
  }, [key]);

  return state;
}

export function useLiveDoc<T>(key: string | null, make: () => DocumentReference): Live<T | null> {
  const [state, setState] = useState<Live<T | null>>({ data: null, loading: key !== null, error: null, fromCache: false });
  const makeRef = useRef(make);
  makeRef.current = make;

  useEffect(() => {
    if (key === null) {
      setState({ data: null, loading: false, error: null, fromCache: false });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    return onSnapshot(
      makeRef.current(),
      (snap) => setState({ data: fromDoc<T>(snap), loading: false, error: null, fromCache: snap.metadata.fromCache }),
      (error) => {
        console.warn(`[firestore] ${key}`, error);
        setState({ data: null, loading: false, error, fromCache: false });
      },
    );
  }, [key]);

  return state;
}

/** État du réseau du navigateur. */
export function useOnline(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return online;
}

/**
 * Plusieurs abonnements à la fois (un par enfant, par exemple).
 * Renvoie les résultats indexés par `key` ; se réabonne quand l'ensemble des clés change.
 */
export function useLiveMany<T>(entries: { key: string; make: () => Query | DocumentReference }[]): { data: Record<string, T[]>; loading: boolean } {
  const [data, setData] = useState<Record<string, T[]>>({});
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const joined = entries.map((e) => e.key).join('|');
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  useEffect(() => {
    const current = entriesRef.current;
    const keys = new Set(current.map((e) => e.key));
    setData((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => keys.has(k))));
    setFailed(new Set());
    const fail = (key: string) => (error: Error) => {
      console.warn(`[firestore] ${key}`, error);
      setFailed((f) => new Set(f).add(key));
    };
    const unsubs = current.map((e) => {
      const target = e.make();
      if (target.type === 'document') {
        return onSnapshot(
          target,
          (snap) => {
            const one = fromDoc<T>(snap);
            setData((prev) => ({ ...prev, [e.key]: one ? [one] : [] }));
          },
          fail(e.key),
        );
      }
      return onSnapshot(target, (snap) => setData((prev) => ({ ...prev, [e.key]: fromQuery<T>(snap) })), fail(e.key));
    });
    return () => unsubs.forEach((u) => u());
  }, [joined]);

  // En chargement tant qu'une clé n'a reçu ni données ni erreur.
  const loading = entries.some((e) => !(e.key in data) && !failed.has(e.key));
  return { data, loading };
}
