import { formatShort, parseISODate, todayISO, type ConductSeverity } from '@pe/shared';
import { Badge, Card, Empty, Segmented, cx } from '@pe/shared/ui';
import { Award, CalendarDays, Megaphone, Phone, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import type { Nav } from '../App';
import { ScreenHeader } from '../components/ChildPicker';
import { useParentData } from '../data';

type Tab = 'com' | 'agenda' | 'conduite';

const categoryTone = { Général: 'brand', Urgent: 'danger', Pédagogique: 'info', Financier: 'warn', Congés: 'neutral' } as const;

const severityStyle: Record<ConductSeverity, { box: string; text: string }> = {
  positive: { box: 'bg-brand-soft text-brand', text: 'text-brand' },
  info: { box: 'bg-info-soft text-info', text: 'text-info' },
  warning: { box: 'bg-warn-soft text-warn', text: 'text-warn' },
  danger: { box: 'bg-danger-soft text-danger-ink', text: 'text-danger-ink' },
};

export function SchoolScreen({ nav }: { nav: Nav }) {
  const { active } = useParentData();
  const [tab, setTab] = useState<Tab>('com');
  if (!active) return null;
  const today = todayISO();
  const school = active.school;
  const upcoming = active.events.filter((e) => e.date >= today);

  return (
    <div className="pb-6">
      <ScreenHeader title="École" subtitle={school?.name} nav={nav} />
      <div className="flex flex-col gap-4 px-5">
        <Segmented
          label="Rubriques de l'école"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'com', label: 'Communiqués' },
            { value: 'agenda', label: 'Agenda' },
            { value: 'conduite', label: 'Conduite' },
          ]}
        />

        {tab === 'com' &&
          (active.announcements.length === 0 ? (
            <Empty icon={<Megaphone size={22} />} title="Aucun communiqué">
              Les communiqués de la direction apparaîtront ici.
            </Empty>
          ) : (
            active.announcements.map((a) => (
              <Card as="article" key={a.id} className="flex flex-col gap-2.5 p-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge tone={categoryTone[a.category] ?? 'neutral'} className="tracking-wide uppercase">
                    {a.category}
                  </Badge>
                  <span className="text-[13px] text-ink-3">{formatShort(a.publishedAt.slice(0, 10))}</span>
                </div>
                <h2 className="font-display text-[19px] leading-snug font-bold">{a.title}</h2>
                <p className="text-[15px] leading-relaxed whitespace-pre-line text-[#33413a]">{a.content}</p>
                <span className="text-[13px] text-ink-3">{a.author}</span>
              </Card>
            ))
          ))}

        {tab === 'agenda' &&
          (upcoming.length === 0 ? (
            <Empty icon={<CalendarDays size={22} />} title="Rien de prévu">
              Les examens, réunions et congés annoncés par l'école apparaîtront ici.
            </Empty>
          ) : (
            upcoming.map((e) => {
              const d = parseISODate(e.date);
              const tone =
                e.category === 'Paiement' ? 'bg-danger text-white' : e.category === 'Congé' ? 'bg-chalk text-ink' : e.category === 'Examen' ? 'bg-info text-white' : 'bg-brand text-white';
              return (
                <Card key={e.id} className="flex gap-3.5 p-3.5" as="div">
                  <span className={cx('flex h-[60px] w-14 shrink-0 flex-col items-center justify-center rounded-[14px]', tone)}>
                    <span className="font-display text-[22px] leading-none font-extrabold">{d.getDate()}</span>
                    <span className="text-xs font-bold uppercase">{new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(d)}</span>
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold tracking-wide text-ink-3 uppercase">{e.category}</span>
                    <span className="text-base font-bold">{e.title}</span>
                    {e.description && <span className="text-sm leading-relaxed text-ink-2">{e.description}</span>}
                  </div>
                </Card>
              );
            })
          ))}

        {tab === 'conduite' && (
          <>
            <span className="text-sm text-ink-2">
              Notes de conduite de <strong className="text-ink">{active.student.firstName}</strong>, {active.student.className}
            </span>
            {active.conduct.length === 0 ? (
              <Empty icon={<Award size={22} />} title="Aucune note de conduite">
                Les félicitations et remarques des enseignants apparaîtront ici.
              </Empty>
            ) : (
              active.conduct.map((c) => {
                const st = severityStyle[c.severity];
                return (
                  <Card as="article" key={c.id} className="flex gap-3 p-4">
                    <span className={cx('flex size-10 shrink-0 items-center justify-center rounded-xl', st.box)}>
                      {c.severity === 'positive' ? <Award size={20} aria-hidden="true" /> : <TriangleAlert size={20} aria-hidden="true" />}
                    </span>
                    <div className="flex flex-col gap-1">
                      <span className={cx('text-xs font-bold tracking-wide uppercase', st.text)}>
                        {c.type} · {formatShort(c.date)}
                      </span>
                      <h2 className="text-base font-bold">{c.title}</h2>
                      {c.comment && <p className="text-sm leading-relaxed text-ink-2">{c.comment}</p>}
                      <span className="text-[13px] text-ink-3">{c.author}</span>
                    </div>
                  </Card>
                );
              })
            )}
          </>
        )}

        {school?.phone && (
          <a
            href={`tel:${school.phone.replace(/\s/g, '')}`}
            className="mt-2 flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-brand bg-surface font-bold text-brand"
          >
            <Phone size={18} aria-hidden="true" /> Appeler l'école · {school.phone}
          </a>
        )}
      </div>
    </div>
  );
}
