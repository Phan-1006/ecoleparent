import { updateSchool } from '@pe/shared/api';
import { getFirebase } from '@pe/shared/firebase';
import { Button, Card, Field, SelectField } from '@pe/shared/ui';
import { useState, type FormEvent } from 'react';
import { PageHeader, useAction } from '../components/common';
import { useSchool } from '../school';

export function SettingsPage() {
  const { db } = getFirebase();
  const { school } = useSchool();
  const { busy, run } = useAction();
  const [name, setName] = useState(school?.name ?? '');
  const [address, setAddress] = useState(school?.address ?? '');
  const [phone, setPhone] = useState(school?.phone ?? '');
  const [currency, setCurrency] = useState(school?.currency ?? '$');
  if (!school) return null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    await run(() => updateSchool(db, school!.id, { name: name.trim(), address: address.trim(), phone: phone.trim(), currency }), 'Paramètres enregistrés.');
  }

  return (
    <div>
      <PageHeader title="Paramètres de l'école" description="Ces informations apparaissent sur les reçus et dans l'application des parents." />
      <Card className="max-w-2xl p-5">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Nom de l'école" value={name} onChange={(e) => setName(e.target.value)} required />
          <Field label="Adresse" value={address} onChange={(e) => setAddress(e.target.value)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Téléphone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} hint="Les parents peuvent appeler ce numéro depuis l'application." />
            <SelectField label="Monnaie" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="$">Dollar ($)</option>
              <option value="FC">Franc congolais (FC)</option>
            </SelectField>
          </div>
          <div className="rounded-xl bg-ground px-3.5 py-2.5 text-sm text-ink-2">
            Préfixe des matricules : <strong>{school.codePrefix}</strong> (fixé à la création de l'école).
          </div>
          <Button type="submit" loading={busy} className="self-start">
            Enregistrer
          </Button>
        </form>
      </Card>
    </div>
  );
}
