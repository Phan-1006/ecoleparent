import { EVENT_CATEGORIES, formatLongCap, todayISO, type EventCategory, type SchoolEvent } from '@pe/shared';
import { deleteEvent, q, saveEvent } from '@pe/shared/api';
import { getFirebase } from '@pe/shared/firebase';
import { useLiveQuery } from '@pe/shared/hooks';
import { Badge, Button, Empty, Field, Modal, SelectField, TextArea } from '@pe/shared/ui';
import { CalendarDays, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { ConfirmAction, PageHeader, Table, useAction } from '../components/common';
import { useSchool } from '../school';

export function EventsPage() {
  const { db } = getFirebase();
  const { schoolId } = useSchool();
  const events = useLiveQuery<SchoolEvent>(`ev:${schoolId}`, () => q.events(db, schoolId));
  const [adding, setAdding] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const today = todayISO();
  const list = events.data.filter((e) => showPast || e.date >= today);

  return (
    <div>
      <PageHeader
        title="Agenda"
        description="Examens, réunions, congés et dates de paiement, visibles dans l'onglet École de l'application des parents."
        actions={
          <Button icon={<Plus size={18} aria-hidden="true" />} onClick={() => setAdding(true)}>
            Ajouter une date
          </Button>
        }
      />
      <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-2">
        <input type="checkbox" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} className="size-4 accent-[#1e4a38]" />
        Afficher les dates passées
      </label>
      {list.length === 0 ? (
        <Empty icon={<CalendarDays size={22} />} title="Aucune date à venir" />
      ) : (
        <Table head={['Date', 'Catégorie', 'Événement', '']}>
          {list.map((e) => (
            <tr key={e.id} className={e.date < today ? 'opacity-60' : undefined}>
              <td className="whitespace-nowrap">{formatLongCap(e.date)}</td>
              <td>
                <Badge tone={e.category === 'Paiement' ? 'danger' : e.category === 'Examen' ? 'info' : 'neutral'}>{e.category}</Badge>
              </td>
              <td>
                <div className="font-semibold">{e.title}</div>
                {e.description && <div className="text-[13px] text-ink-3">{e.description}</div>}
              </td>
              <td className="text-right">
                <ConfirmAction label="Supprimer" title="Supprimer cette date ?" message={`« ${e.title} » sera retiré de l'agenda.`} onConfirm={() => deleteEvent(db, schoolId, e.id)} />
              </td>
            </tr>
          ))}
        </Table>
      )}
      {adding && <EventForm onClose={() => setAdding(false)} />}
    </div>
  );
}

function EventForm({ onClose }: { onClose: () => void }) {
  const { db } = getFirebase();
  const { schoolId } = useSchool();
  const { busy, run } = useAction();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState<EventCategory>('Réunion');
  const [description, setDescription] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    const id = await run(() => saveEvent(db, { schoolId, title: title.trim(), date, category, description: description.trim() || undefined }), 'Date ajoutée.');
    if (id) onClose();
  }

  return (
    <Modal open onClose={onClose} title="Ajouter une date">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Titre" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Assemblée générale des parents" required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          <SelectField label="Catégorie" value={category} onChange={(e) => setCategory(e.target.value as EventCategory)}>
            {EVENT_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </SelectField>
        </div>
        <TextArea label="Détails (facultatif)" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={busy}>
            Ajouter
          </Button>
        </div>
      </form>
    </Modal>
  );
}
