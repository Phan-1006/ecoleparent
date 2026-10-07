import { addDays, formatLongCap, relativeDays, todayISO, type Homework } from '@pe/shared';
import { errorMessage, markHomeworkSeen, unmarkHomeworkSeen } from '@pe/shared/api';
import { useAuth } from '@pe/shared/auth';
import { getFirebase } from '@pe/shared/firebase';
import { Card, Empty, cx, useToast } from '@pe/shared/ui';
import { BookOpen, Check } from 'lucide-react';
import { useState } from 'react';
import type { Nav } from '../App';
import { ScreenHeader } from '../components/ChildPicker';
import { useParentData, type Child } from '../data';

export function HomeworkScreen({ nav }: { nav: Nav }) {
  const { active } = useParentData();
  const [showPast, setShowPast] = useState(false);
  if (!active) return null;
  const today = todayISO();
  const upcoming = active.homework.filter((h) => h.dueDate >= today);
  const past = active.homework.filter((h) => h.dueDate < today && h.dueDate >= addDays(today, -21)).reverse();
  const toSee = upcoming.filter((h) => !active.seen.has(h.id)).length;

  const groups = new Map<string, Homework[]>();
  for (const h of upcoming) groups.set(h.dueDate, [...(groups.get(h.dueDate) ?? []), h]);

  return (
    <div className="pb-6">
      <ScreenHeader title="Devoirs" subtitle={active.student.className} nav={nav} />
      <div className="flex flex-col gap-5 px-5">
        {upcoming.length > 0 && (
          <div className="flex items-center gap-3 rounded-2xl bg-brand p-3.5 text-white">
            <span className="font-display text-[34px] leading-none font-extrabold text-chalk">{toSee}</span>
            <span className="text-[15px] leading-snug">
              {toSee === 0
                ? 'Tous les devoirs à rendre sont marqués comme vus. Merci !'
                : toSee === 1
                  ? 'devoir à rendre pas encore marqué comme vu'
                  : 'devoirs à rendre pas encore marqués comme vus'}
            </span>
          </div>
        )}

        {upcoming.length === 0 && (
          <Empty icon={<BookOpen size={22} />} title="Aucun devoir à rendre">
            Les devoirs publiés par les enseignants de la classe de {active.student.firstName} apparaîtront ici.
          </Empty>
        )}

        {[...groups.entries()].map(([date, list]) => (
          <section key={date} className="flex flex-col gap-2.5">
            <h2 className="text-sm font-bold tracking-wide text-ink-2 uppercase">
              {relativeDays(date, today) === 'demain' ? 'Demain · ' : relativeDays(date, today) === "aujourd'hui" ? "Aujourd'hui · " : ''}
              {formatLongCap(date)}
            </h2>
            {list.map((h) => (
              <HomeworkCard key={h.id} h={h} child={active} />
            ))}
          </section>
        ))}

        {past.length > 0 && (
          <section className="flex flex-col gap-2.5">
            <button type="button" onClick={() => setShowPast((v) => !v)} className="min-h-11 self-start text-sm font-bold text-brand" aria-expanded={showPast}>
              {showPast ? 'Masquer les devoirs passés' : `Voir les devoirs passés (${past.length})`}
            </button>
            {showPast && past.map((h) => <HomeworkCard key={h.id} h={h} child={active} past />)}
          </section>
        )}

        {upcoming.length > 0 && (
          <p className="text-[13px] leading-relaxed text-ink-3">« Marquer comme vu » prévient l'enseignant, comme une signature du journal de classe.</p>
        )}
      </div>
    </div>
  );
}

function HomeworkCard({ h, child, past }: { h: Homework; child: Child; past?: boolean }) {
  const { user } = useAuth();
  const toast = useToast();
  const seen = child.seen.has(h.id);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const { db } = getFirebase();
    setBusy(true);
    try {
      if (seen) await unmarkHomeworkSeen(db, child.id, h.id);
      else
        await markHomeworkSeen(db, {
          homeworkId: h.id,
          studentId: child.id,
          schoolId: child.student.schoolId,
          classId: child.student.classId,
          uid: user!.uid,
        });
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card as="article" className={cx('flex flex-col gap-2.5 p-4', past && 'opacity-80')}>
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-lg bg-info-soft px-2.5 py-1 text-xs font-bold tracking-wide text-info uppercase">{h.subject}</span>
        <span className="text-[13px] text-ink-3">{h.teacherName}</span>
      </div>
      <h3 className="text-[17px] leading-snug font-bold">{h.title}</h3>
      {h.description && <p className="text-sm leading-relaxed whitespace-pre-line text-ink-2">{h.description}</p>}
      {past ? (
        <span className="text-[13px] text-ink-3">À rendre le {formatLongCap(h.dueDate)}</span>
      ) : (
        <button
          type="button"
          onClick={() => void toggle()}
          disabled={busy}
          aria-pressed={seen}
          className={cx(
            'flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-brand text-[15px] font-bold',
            seen ? 'bg-brand text-white' : 'bg-surface text-brand',
          )}
        >
          {seen && <Check size={18} strokeWidth={2.6} aria-hidden="true" />}
          {seen ? 'Vu par le parent' : 'Marquer comme vu'}
        </button>
      )}
    </Card>
  );
}
