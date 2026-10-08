import type { ClassRoom } from '@pe/shared';
import { deleteClass, saveClass } from '@pe/shared/api';
import { getFirebase } from '@pe/shared/firebase';
import { Button, Card, Empty, Field, Modal, SelectField } from '@pe/shared/ui';
import { LayoutGrid, Pencil, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { ConfirmAction, PageHeader, useAction } from '../components/common';
import { useSchool } from '../school';

const LEVELS = ['Maternelle', 'Primaire', 'Secondaire', 'Humanités', 'Autre'];

export function ClassesPage() {
  const { db } = getFirebase();
  const { schoolId, classes, students } = useSchool();
  const [editing, setEditing] = useState<ClassRoom | 'new' | null>(null);

  return (
    <div>
      <PageHeader
        title="Classes"
        description="Les devoirs, l'appel et les communiqués ciblés se rattachent aux classes."
        actions={
          <Button icon={<Plus size={18} aria-hidden="true" />} onClick={() => setEditing('new')}>
            Nouvelle classe
          </Button>
        }
      />
      {classes.length === 0 ? (
        <Empty icon={<LayoutGrid size={22} />} title="Aucune classe" action={<Button onClick={() => setEditing('new')}>Créer une classe</Button>}>
          Créez les classes de l'école, par exemple « 6e Primaire B » ou « 3e Scientifique A ».
        </Empty>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => {
            const count = students.filter((s) => s.classId === c.id && s.active).length;
            return (
              <Card as="li" key={c.id} className="flex flex-col gap-3 p-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold tracking-wide text-ink-3 uppercase">{c.level}</span>
                  <span className="font-display text-lg font-bold">{c.name}</span>
                  <span className="text-sm text-ink-2">
                    {count} élève{count > 1 ? 's' : ''}
                    {c.titulaireName ? ` · titulaire : ${c.titulaireName}` : ''}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" icon={<Pencil size={14} aria-hidden="true" />} onClick={() => setEditing(c)}>
                    Modifier
                  </Button>
                  {count === 0 && (
                    <ConfirmAction
                      label="Supprimer"
                      title="Supprimer cette classe ?"
                      message={`La classe « ${c.name} » sera supprimée.`}
                      onConfirm={() => deleteClass(db, schoolId, c.id)}
                    />
                  )}
                </div>
              </Card>
            );
          })}
        </ul>
      )}
      {editing && <ClassForm cls={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function ClassForm({ cls, onClose }: { cls: ClassRoom | null; onClose: () => void }) {
  const { db } = getFirebase();
  const { schoolId, members } = useSchool();
  const { busy, run } = useAction();
  const [name, setName] = useState(cls?.name ?? '');
  const [level, setLevel] = useState(cls?.level ?? 'Primaire');
  const [titulaire, setTitulaire] = useState(cls?.titulaireEmail ?? '');
  const teachers = members.filter((m) => m.role === 'professeur' || m.role === 'surveillant');

  async function submit(e: FormEvent) {
    e.preventDefault();
    const t = members.find((m) => m.email === titulaire);
    const id = await run(
      () => saveClass(db, { id: cls?.id, schoolId, name: name.trim(), level, titulaireEmail: t?.email ?? '', titulaireName: t?.name ?? '' }),
      cls ? 'Classe modifiée.' : 'Classe créée.',
    );
    if (id) onClose();
  }

  return (
    <Modal open onClose={onClose} title={cls ? 'Modifier la classe' : 'Nouvelle classe'}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Nom de la classe" value={name} onChange={(e) => setName(e.target.value)} placeholder="6e Primaire B" required />
        <SelectField label="Niveau" value={level} onChange={(e) => setLevel(e.target.value)}>
          {LEVELS.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </SelectField>
        <SelectField
          label="Titulaire"
          value={titulaire}
          onChange={(e) => setTitulaire(e.target.value)}
          hint="Pour qu'un professeur puisse faire l'appel et publier des devoirs, ajoutez aussi la classe dans sa fiche (Personnel)."
        >
          <option value="">Aucun</option>
          {teachers.map((m) => (
            <option key={m.email} value={m.email}>
              {m.name}
            </option>
          ))}
        </SelectField>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={busy}>
            Enregistrer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
