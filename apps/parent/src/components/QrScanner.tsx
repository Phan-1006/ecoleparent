import { Button, ErrorNote, Modal } from '@pe/shared/ui';
import { useEffect, useRef, useState } from 'react';

/** Lecture d'un QR code avec la caméra arrière (fiche élève, reçu). */
export function QrScanner({ open, onClose, onResult }: { open: boolean; onClose: () => void; onResult: (text: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let stream: MediaStream | null = null;
    let frame = 0;
    let stopped = false;
    // Décodeur chargé à la demande (inutile tant qu'on ne scanne pas).
    let decode: typeof import('jsqr').default | null = null;
    void import('jsqr').then((m) => (decode = m.default));
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const tick = () => {
      if (stopped) return;
      const video = videoRef.current;
      if (decode && video && ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
        const w = video.videoWidth;
        const h = video.videoHeight;
        // Image réduite : plus rapide sur les téléphones modestes.
        const scale = Math.min(1, 640 / Math.max(w, h));
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = decode(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
        if (code?.data) {
          onResult(code.data);
          return;
        }
      }
      frame = requestAnimationFrame(tick);
    };

    setError(null);
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((s) => {
        if (stopped) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        const video = videoRef.current;
        if (video) {
          video.srcObject = s;
          void video.play();
        }
        frame = requestAnimationFrame(tick);
      })
      .catch(() => setError("Impossible d'ouvrir la caméra. Autorisez l'accès à la caméra, ou saisissez le code à la main."));
    if (!navigator.mediaDevices) setError("Cet appareil ne permet pas d'utiliser la caméra ici. Saisissez le code à la main.");

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [open, onResult]);

  return (
    <Modal open={open} onClose={onClose} title="Scanner le QR code" sheet footer={<Button variant="secondary" onClick={onClose}>Annuler</Button>}>
      <div className="flex flex-col gap-3">
        {error ? (
          <ErrorNote>{error}</ErrorNote>
        ) : (
          <div className="relative overflow-hidden rounded-2xl bg-ink">
            <video ref={videoRef} playsInline muted className="aspect-square w-full object-cover" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-[18%] rounded-3xl border-4 border-chalk/90" />
          </div>
        )}
        <p className="text-sm text-ink-3">Visez le QR code imprimé sur la fiche de l'élève ou sur un reçu de paiement.</p>
      </div>
    </Modal>
  );
}

/** Extrait un matricule d'un QR code : texte brut « PE-… » ou lien contenant ?code=PE-… */
export function matriculeFromQr(text: string): string {
  try {
    const url = new URL(text);
    const code = url.searchParams.get('code');
    if (code) return code;
  } catch {
    /* pas une URL */
  }
  const m = text.match(/PE-[A-Z]{1,4}-\d{4}-[A-Z0-9]{4,8}/i);
  return m ? m[0] : text.trim();
}
