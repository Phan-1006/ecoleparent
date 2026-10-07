import {
  ATTENDANCE_LABELS,
  formatLongCap,
  formatMonth,
  formatTime,
  parseISODate,
  schoolYear,
  summarizeAttendance,
  todayISO,
  toISODate,
  type Attendance,
} from '@pe/shared';
import { errorMessage, justifyAbsence } from '@pe/shared/api';
import { getFirebase } from '@pe/shared/firebase';
import { Badge, Button, Card, ErrorNote, Modal, TextArea, cx, useToast } from '@pe/shared/ui';
import { ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Nav } from '../App';
import { ScreenHeader, SectionTitle } from '../components/ChildPicker';
import { useParentData } from '../data';
import { accord } from '../format';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export function AttendanceScreen({ nav }: { nav: Nav }) {
  const { active } = useParentData();
  const today = todayISO();
  const [month, setMonth] = useState(() => today.slice(0, 7));
  const [justifying, setJustifying] = useState<Attendance | null>(null);

  const startYear = schoolYear(today).slice(0, 4);
  const sinceStart = useMemo(
    () => (active?.attendance ?? []).filter((a) => a.date >= `${startYear}-08-01`),
    [active?.attendance, startYear],
  );
  if (!active) return null;

  const s = summarizeAttendance(sinceStart);
  const byDate = new Map(active.attendance.map((a) => [a.date, a]));
  const issues = active.attendance.filter((a) => a.status !== 'present');

  // Mois consultables : de septembre de l'année scolaire jusqu'au mois courant.
  const firstMonth = `${startYear}-09`;
  const canPrev = month > firstMonth;
  const canNext = month < today.slice(0, 7);
  const shift = (delta: number) => {
    const d = parseISODate(`${month}-01`);
    d.setMonth(d.getMonth() + delta);
    setMonth(toISODate(d).slice(0, 7));
  };

  return (
    <div className="pb-6">
      <ScreenHeader title="Présences" nav={nav} />
      <div className="flex flex-col gap-4 px-5">
        <section className="grid grid-cols-3 gap-2">
          <Stat value={s.present} label={s.present > 1 ? 'jours présent' : 'jour présent'} className="text-brand" />
          <Stat value={s.absent + s.excused} label={s.absent + s.excused > 1 ? 'absences' : 'absence'} className="text-danger" />
          <Stat value={s.late} label={s.late > 1 ? 'retards' : 'retard'} className="text-warn" />
        </section>
        <span className="-mt-2 text-[13px] text-ink-3">Depuis la rentrée {schoolYear(today)}</span>

        <Card className="flex flex-col gap-2.5 px-3 pt-3.5 pb-3">
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => shift(-1)} disabled={!canPrev} aria-label="Mois précédent" className="flex size-11 items-center justify-center rounded-full disabled:opacity-30">
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <h2 className="font-display text-lg font-bold" aria-live="polite">
              {formatMonth(parseISODate(`${month}-01`))}
            </h2>
            <button type="button" onClick={() => shift(1)} disabled={!canNext} aria-label="Mois suivant" className="flex size-11 items-center justify-center rounded-full disabled:opacity-30">
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </div>
          <MonthGrid month={month} today={today} byDate={byDate} />
          <div className="flex flex-wrap gap-3.5 border-t border-line-soft px-1.5 pt-2 text-[13px] text-ink-2">
            <Legend className="border border-brand bg-brand-soft" label="Présent" />
            <Legend className="bg-danger" label="Absent" />
            <Legend className="bg-chalk" label="En retard" />
            <Legend className="bg-info" label="Justifiée" />
          </div>
        </Card>

        <section className="flex flex-col gap-2.5">
          <SectionTitle>Absences et retards</SectionTitle>
          {issues.length === 0 ? (
            <p className="rounded-2xl border border-line bg-surface p-4 text-sm text-ink-3">
              Aucune absence ni retard : {active.student.firstName} est {accord(active.student, 'assidu', 'assidue')}.
            </p>
          ) : (
            issues.map((a) => <IssueCard key={a.id} a={a} onJustify={() => setJustifying(a)} />)
          )}
        </section>
      </div>

      <JustifyDialog record={justifying} onClose={() => setJustifying(null)} />
    </div>
  );
}

function Stat({ value, label, className }: { value: number; label: string; className: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-2xl border border-line bg-surface p-3">
      <span className={cx('font-display text-[26px] font-extrabold', className)}>{value}</span>
      <span className="text-[13px] text-ink-2">{label}</span>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cx('size-3 rounded-full', className)} />
      {label}
    </span>
  );
}

function MonthGrid({ month, today, byDate }: { month: string; today: string; byDate: Map<string, Attendance> }) {
  const first = parseISODate(`${month}-01`);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(offset).fill(null)];
  for (let d = 1; d <= days; d++) cells.push(`${month}-${String(d).padStart(2, '0')}`);

  return (
    <div>
      <div aria-hidden="true" className="grid grid-cols-7 text-center text-xs font-bold text-ink-3">
        {WEEKDAYS.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-y-1">
        {cells.map((iso, i) => {
          if (!iso) return <span key={`e${i}`} />;
          const rec = byDate.get(iso);
          const n = Number(iso.slice(8));
          const label = rec ? `${formatLongCap(iso)} : ${ATTENDANCE_LABELS[rec.status]}` : formatLongCap(iso);
          const cls = rec
            ? {
                present: 'bg-brand-soft text-brand font-semibold',
                absent: 'bg-danger text-white font-bold',
                late: 'bg-chalk text-ink font-bold',
                excused: 'bg-info text-white font-bold',
              }[rec.status]
            : iso > today
              ? 'text-ink'
              : 'text-ink-4';
          return (
            <span key={iso} className="flex h-[42px] items-center justify-center" title={label}>
              <span className={cx('flex size-9 items-center justify-center rounded-full text-sm', cls, iso === today && 'ring-2 ring-brand ring-offset-2')} aria-label={label}>
                {n}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function IssueCard({ a, onJustify }: { a: Attendance; onJustify: () => void }) {
  const absent = a.status === 'absent' || a.status === 'excused';
  const canJustify = (a.status === 'absent' || a.status === 'late') && (!a.justificationStatus || a.justificationStatus === 'rejected');
  return (
    <Card className="flex flex-col gap-3 p-3.5" as="div">
      <div className="flex gap-3">
        <span
          className={cx(
            'flex size-10 shrink-0 items-center justify-center rounded-xl',
            a.status === 'excused' ? 'bg-info text-white' : absent ? 'bg-danger text-white' : 'bg-chalk text-ink',
          )}
        >
          {absent ? <X size={20} strokeWidth={2.4} aria-hidden="true" /> : <Clock size={20} strokeWidth={2.2} aria-hidden="true" />}
        </span>
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[15px] font-bold">{formatLongCap(a.date)}</span>
            <JustificationBadge a={a} />
          </div>
          <span className="text-sm leading-relaxed text-ink-2">
            {ATTENDANCE_LABELS[a.status]}
            {a.reason ? ` · ${a.reason}` : ''} · signalé à {formatTime(a.recordedAt)} par {a.recordedByName}
          </span>
          {a.justification && <span className="text-[13px] text-ink-3 italic">Votre justification : « {a.justification} »</span>}
        </div>
      </div>
      {canJustify && (
        <Button variant="secondary" onClick={onJustify}>
          {a.justificationStatus === 'rejected' ? 'Envoyer une autre justification' : a.status === 'late' ? 'Justifier ce retard' : 'Justifier cette absence'}
        </Button>
      )}
    </Card>
  );
}

function JustificationBadge({ a }: { a: Attendance }) {
  if (a.status === 'excused' || a.justificationStatus === 'accepted') return <Badge tone="info">Justifiée</Badge>;
  if (a.justificationStatus === 'pending') return <Badge tone="warn">En attente</Badge>;
  if (a.justificationStatus === 'rejected') return <Badge tone="danger">Refusée</Badge>;
  if (a.status === 'absent') return <Badge tone="danger">Non justifiée</Badge>;
  return null;
}

function JustifyDialog({ record, onClose }: { record: Attendance | null; onClose: () => void }) {
  const toast = useToast();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    if (!record || !text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await justifyAbsence(getFirebase().db, record.studentId, record.date, text);
      toast('Justification envoyée à l’école.');
      setText('');
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={!!record}
      onClose={onClose}
      title={record?.status === 'late' ? 'Justifier un retard' : 'Justifier une absence'}
      sheet
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={() => void send()} loading={busy} disabled={!text.trim()}>
            Envoyer
          </Button>
        </>
      }
    >
      {record && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink-2">{formatLongCap(record.date)}</p>
          {error && <ErrorNote>{error}</ErrorNote>}
          <TextArea
            label="Motif"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ex. : malade, certificat médical remis demain."
            maxLength={500}
            hint="L'école verra ce message et pourra accepter ou refuser la justification."
          />
        </div>
      )}
    </Modal>
  );
}
