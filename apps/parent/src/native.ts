import { Capacitor } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();

/** Partage un texte (reçu, code élève) : feuille de partage Android, sinon Web Share, sinon presse-papiers. */
export async function shareText(title: string, text: string): Promise<'shared' | 'copied'> {
  if (isNative) {
    const { Share } = await import('@capacitor/share');
    await Share.share({ title, text, dialogTitle: title });
    return 'shared';
  }
  if (navigator.share) {
    await navigator.share({ title, text });
    return 'shared';
  }
  await navigator.clipboard.writeText(text);
  return 'copied';
}

/**
 * Bouton « retour » d'Android. `handler` renvoie vrai s'il a traité le retour
 * (fermer une fenêtre, revenir à l'accueil) ; sinon l'app se met en arrière-plan.
 */
export function onBackButton(handler: () => boolean): () => void {
  if (!isNative) return () => undefined;
  let remove: (() => void) | undefined;
  let cancelled = false;
  void import('@capacitor/app').then(({ App }) =>
    App.addListener('backButton', () => {
      if (!handler()) void App.minimizeApp();
    }).then((h) => {
      if (cancelled) void h.remove();
      else remove = () => void h.remove();
    }),
  );
  return () => {
    cancelled = true;
    remove?.();
  };
}

export async function setupStatusBar() {
  await setStatusBarOnDark(false);
}

/** Icônes de la barre d'état claires (sur fond vert) ou foncées (sur fond clair). */
export async function setStatusBarOnDark(dark: boolean) {
  if (!isNative) return;
  const { StatusBar, Style } = await import('@capacitor/status-bar');
  await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => undefined);
  await StatusBar.setBackgroundColor({ color: dark ? '#1e4a38' : '#f4f5f0' }).catch(() => undefined);
}

/**
 * Notifications push (Firebase Cloud Messaging). Désactivées tant que
 * VITE_PUSH_ENABLED n'est pas « true » : elles exigent google-services.json dans l'APK.
 */
export async function setupPush(onToken: (token: string) => void): Promise<void> {
  if (!isNative || import.meta.env.VITE_PUSH_ENABLED !== 'true') return;
  const { PushNotifications } = await import('@capacitor/push-notifications');
  let perm = await PushNotifications.checkPermissions();
  if (perm.receive === 'prompt') perm = await PushNotifications.requestPermissions();
  if (perm.receive !== 'granted') return;
  await PushNotifications.addListener('registration', (t) => onToken(t.value));
  await PushNotifications.register();
}
