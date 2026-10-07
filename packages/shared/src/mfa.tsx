import { useState, type FormEvent } from 'react';
import { errorMessage } from './api/refs';
import { useAuth } from './auth';
import { Button, ErrorNote } from './ui';

/** Champ du code à 6 chiffres (application d'authentification). */
export function CodeInput({ value, onChange, id, autoFocus }: { value: string; onChange: (v: string) => void; id: string; autoFocus?: boolean }) {
  return (
    <input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]{6}"
      maxLength={6}
      autoFocus={autoFocus}
      placeholder="000000"
      className="h-16 w-full rounded-2xl border border-[#c4ccc6] bg-surface text-center font-display text-[32px] font-bold tracking-[0.4em] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
    />
  );
}

/** Deuxième étape de connexion : le code affiché par l'application d'authentification. */
export function MfaChallenge() {
  const { completeMfa, cancelMfa } = useAuth();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      await completeMfa(code);
    } catch (err) {
      setError(errorMessage(err));
      setCode('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-ground p-6">
      <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-5 rounded-[24px] border border-line bg-surface p-6">
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-bold tracking-wider text-brand uppercase">Vérification en deux étapes</span>
          <h1 className="font-display text-2xl font-bold">Entrez votre code</h1>
          <p className="text-[15px] leading-relaxed text-ink-2">
            Ouvrez votre application d'authentification (Google Authenticator, Microsoft Authenticator…) et saisissez le code à 6 chiffres
            affiché pour ParentEcole.
          </p>
        </div>
        {error && <ErrorNote>{error}</ErrorNote>}
        <label htmlFor="mfa-code" className="sr-only">
          Code à 6 chiffres
        </label>
        <CodeInput id="mfa-code" value={code} onChange={setCode} autoFocus />
        <Button type="submit" size="lg" block loading={busy} disabled={code.length !== 6}>
          Valider
        </Button>
        <Button variant="ghost" onClick={cancelMfa}>
          Annuler
        </Button>
      </form>
    </div>
  );
}
