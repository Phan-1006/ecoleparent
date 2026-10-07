import { formatDayMonth, formatMoney, formatShort, schoolYear, type FeeStatus, type InstallmentStatus, type Payment } from '@pe/shared';
import { Card, Empty, Progress, cx, useToast } from '@pe/shared/ui';
import { Check, School, Share2, TriangleAlert, Wallet } from 'lucide-react';
import type { Nav } from '../App';
import { ScreenHeader, SectionTitle } from '../components/ChildPicker';
import { useParentData, type Child } from '../data';
import { alertText, alertTitle } from '../format';
import { shareText } from '../native';

export function FeesScreen({ nav }: { nav: Nav }) {
  const { active } = useParentData();
  if (!active) return null;
  const f = active.finance;
  const alert = f.alerts[0];
  const cur = active.currency;

  return (
    <div className="pb-6">
      <ScreenHeader title="Frais scolaires" subtitle={schoolYear()} nav={nav} />
      <div className="flex flex-col gap-4 px-5">
        {alert?.level === 'danger' && (
          <section className="flex gap-3 rounded-[22px] border border-danger-line bg-danger-soft p-4">
            <TriangleAlert size={22} className="mt-0.5 shrink-0 text-danger-ink" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <h2 className="font-display text-lg leading-tight font-bold text-danger-ink">{alertTitle(alert)}</h2>
              <p className="text-sm leading-relaxed text-danger-text">{alertText(alert, cur)}</p>
            </div>
          </section>
        )}

        <section className="flex flex-col gap-3.5 rounded-[22px] bg-brand p-5 text-white">
          <div className="flex items-end justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] text-brand-ink">Déjà payé</span>
              <span className="font-display text-[34px] leading-none font-extrabold">{formatMoney(f.paid, cur)}</span>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[13px] text-brand-ink">Reste à payer</span>
              <span className="font-display text-[22px] leading-none font-bold">{formatMoney(f.remaining, cur)}</span>
            </div>
          </div>
          <Progress value={f.total ? (f.total - f.remaining) / f.total : 0} track="bg-brand-2" bar="bg-chalk" className="h-2.5" />
          <span className="text-[13px] text-brand-ink">
            Total de l'année : {formatMoney(f.total, cur)}
            {f.fees.length > 0 && ` · ${f.fees.map((x) => x.fee.name.toLowerCase()).join(', ')}`}
          </span>
        </section>

        {f.fees.length === 0 && (
          <Empty icon={<Wallet size={22} />} title="Aucun frais publié">
            L'école n'a pas encore publié la grille des frais pour la classe de {active.student.firstName}.
          </Empty>
        )}

        {f.fees.map((fs) => (
          <FeeCard key={fs.fee.id} fs={fs} currency={cur} />
        ))}

        <Payments child={active} />

        {active.school && (
          <div className="flex items-start gap-3 rounded-2xl bg-muted p-3.5">
            <School size={20} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
            <p className="text-[13px] leading-relaxed text-ink-2">
              Paiement à la caisse de l'école
              {active.school.address ? `, ${active.school.address}` : ''}. Le reçu apparaît ici dès qu'il est enregistré.
              {active.school.phone && (
                <>
                  {' '}
                  Contact :{' '}
                  <a className="font-bold text-brand" href={`tel:${active.school.phone.replace(/\s/g, '')}`}>
                    {active.school.phone}
                  </a>
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function FeeCard({ fs, currency }: { fs: FeeStatus; currency: string }) {
  return (
    <Card className="px-4 py-1.5">
      <div className="flex items-center justify-between pt-3 pb-2">
        <h2 className="font-display text-lg font-bold">{fs.fee.name}</h2>
        <span className="text-[15px] font-bold">{formatMoney(fs.fee.totalAmount, currency)}</span>
      </div>
      {fs.installments.length === 0 ? (
        <div className="flex items-center justify-between border-t border-line-soft py-3 text-sm">
          <span className="text-ink-3">Payé</span>
          <span className="font-bold">{formatMoney(fs.paid, currency)}</span>
        </div>
      ) : (
        <ol>
          {fs.installments.map((s) => (
            <InstallmentRow key={s.installment.id} s={s} currency={currency} />
          ))}
        </ol>
      )}
    </Card>
  );
}

function InstallmentRow({ s, currency }: { s: InstallmentStatus; currency: string }) {
  const { installment: inst, state } = s;
  const urgent = state === 'renvoi' || state === 'overdue' || (state === 'upcoming' && s.daysToDue <= 10);
  const partial = state !== 'paid' && s.paidTowards > 0;
  return (
    <li className="flex gap-3 border-t border-line-soft py-3">
      {state === 'paid' ? (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-white">
          <Check size={16} strokeWidth={3} aria-label="Payée" />
        </span>
      ) : urgent ? (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-[3px] border-danger" aria-label="À payer, urgent">
          <span className="size-2.5 rounded-full bg-danger" />
        </span>
      ) : (
        <span className="size-7 shrink-0 rounded-full border-2 border-[#9aa79f]" aria-label="À venir" />
      )}
      <div className="flex flex-1 flex-col gap-1">
        <span className="text-[15px] font-bold">{inst.name}</span>
        {state === 'paid' ? (
          <span className="text-[13px] text-ink-3">Réglée</span>
        ) : (
          <>
            <span className="text-[13px] text-ink-3">
              Avant le {formatDayMonth(inst.dueDate)}
              {partial && ` · ${formatMoney(s.paidTowards, currency)} payés sur ${formatMoney(inst.amount, currency)}`}
            </span>
            {partial && <Progress value={s.paidTowards / inst.amount} track="bg-danger-soft" bar={urgent ? 'bg-danger' : 'bg-brand'} className="h-1.5" />}
            {inst.cutoffDate && (
              <span className={cx('text-[13px]', urgent ? 'font-bold text-danger-ink' : 'text-ink-3')}>
                {state === 'renvoi'
                  ? `Renvoi depuis le ${formatDayMonth(inst.cutoffDate)} · manque ${formatMoney(s.missing, currency)}`
                  : `Renvoi le ${formatDayMonth(inst.cutoffDate)} si moins de ${formatMoney(s.required, currency)} payés`}
              </span>
            )}
          </>
        )}
      </div>
      <span className="text-[15px] font-bold">{formatMoney(inst.amount, currency)}</span>
    </li>
  );
}

function Payments({ child }: { child: Child }) {
  const toast = useToast();
  const cur = child.currency;
  if (child.payments.length === 0) return null;

  async function share(p: Payment) {
    const text = [
      `Reçu de paiement — ${child.school?.name ?? 'École'}`,
      `Élève : ${p.studentName} (${p.className})`,
      `Code élève : ${child.student.matricule}`,
      `${p.feeName} : ${formatMoney(p.amount, cur)}`,
      `Date : ${formatShort(p.date)} · ${p.method}`,
      `Référence : ${p.reference}`,
      `Encaissé par : ${p.recordedByName}`,
    ].join('\n');
    try {
      const r = await shareText(`Reçu ${p.reference}`, text);
      if (r === 'copied') toast('Reçu copié.');
    } catch {
      /* partage annulé */
    }
  }

  return (
    <section className="flex flex-col gap-2.5">
      <SectionTitle>Paiements reçus</SectionTitle>
      {child.payments.map((p) => (
        <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface py-3 pr-3 pl-3.5">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-[15px] font-bold">
              {p.feeName} · {formatMoney(p.amount, cur)}
            </span>
            <span className="text-[13px] text-ink-3">
              {formatShort(p.date)} · {p.method} · {p.reference}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void share(p)}
            aria-label={`Partager le reçu ${p.reference}`}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-line bg-ground text-brand"
          >
            <Share2 size={20} aria-hidden="true" />
          </button>
        </div>
      ))}
      {child.finance.unallocated > 0 && (
        <p className="text-[13px] text-ink-3">
          {formatMoney(child.finance.unallocated, cur)} payés pour des frais qui ne s'appliquent plus à cet élève. Renseignez-vous à la caisse.
        </p>
      )}
    </section>
  );
}
