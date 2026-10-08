import { useEffect, useState } from 'react';

/** Routage minimal par ancre : #/eleves, #/caisse… (le rafraîchissement garde la page). */
export function useRoute(): string {
  const [route, setRoute] = useState(() => readRoute());
  useEffect(() => {
    const on = () => setRoute(readRoute());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

function readRoute(): string {
  return window.location.hash.replace(/^#\/?/, '').split('?')[0] || '';
}

export function navigate(route: string) {
  window.location.hash = `/${route}`;
}
