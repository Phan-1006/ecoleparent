import { computeStudentFinance, formatLongCap, formatMoney, todayISO, type Attendance } from '@pe/shared';
import { q } from '@pe/shared/api';
import { getFirebase } from '@pe/shared/firebase';
import { useLiveQuery } from '@pe/shared/hooks';
import { Badge, Card } from '@pe/shared/ui';
import { useMemo } from 'react';
import { PageHeader, StatTile } from '../components/common';
import { fullName, useSchool } from '../school';

export function Dashboard() {
  const { db } = getFirebase();
  const { schoolId, school, students, classes, fees, payments, currency } = useSchool();
  const today = todayISO();
  const attendance = useLiveQuery<Attendance>(`att-day:${schoolId}:${today}`, () => q.schoolAttendanceOn(db, schoolId, today));
  const active = students.filter((s) => s.active);

  const month = today.slice(0, 7);
  const monthTotal = payments.filter((p) => p.date.startsWith(month)).reduce((s, p) => s + p.amount, 0);
  const todayTotal = payments.filter((p) => p.date === today).reduce((s, p) => s + p.amount, 0);

  const risk = useMemo(
    () =>
      active
        .map((s) => ({ s, f: computeStudentFinance(s, fees, payments, today) }))
        .filter((x) => x.f.alerts[0]?.level === 'danger'),
    [active, fees, payments, today],
  );

  const absent = attendance.data.filter((a) => a.status === 'absent');
  const late = attendance.data.filter((a) => a.status === 'late');
  const doneClasses = new Set(attendance.data.map((a) => a.classId));

  return (
    <div>
      <PageHeader title={school?.name ?? 'Tableau de bord'} description={formatLongCap(today)} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Élèves inscrits" value={active.length} sub={`${classes.length} classes`} />
        <StatTile
          label="Absents aujourd'hui"
          value={absent.length}
          tone="danger"
          sub={`${late.length} retard${late.length > 1 ? 's' : ''} · appel fait dans ${doneClasses.size}/${classes.length} classes`}
        />
        <StatTile label="Encaissé ce mois" value={formatMoney(monthTotal, currency)} sub={`Aujourd'hui : ${formatMoney(todayTotal, currency)}`} />
        <StatTile label="Risque de renvoi" value={risk.length} tone="warn" sub="élèves sous le seuil, échéance proche" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Appel du jour</h2>
            <a href="#/appel" className="text-sm font-bold text-brand">
              Faire l'appel
            </a>
          </div>
          <ul className="flex flex-col divide-y divide-line-soft">
            {classes.map((c) => {
              const recs = attendance.data.filter((a) => a.classId === c.id);
              const abs = recs.filter((a) => a.status === 'absent').length;
              return (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-[15px] font-semibold">{c.name}</span>
                  {recs.length === 0 ? (
                    <Badge tone="neutral">Pas encore fait</Badge>
                  ) : abs ? (
                    <Badge tone="danger">
                      {abs} absent{abs > 1 ? 's' : ''}
                    </Badge>
                  ) : (
                    <Badge tone="brand">Tous présents</Badge>
                  )}
                </li>
              );
            })}
            {classes.length === 0 && <li className="py-2 text-sm text-ink-3">Créez d'abord vos classes.</li>}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Élèves à risque de renvoi</h2>
            <a href="#/recouvrement" className="text-sm font-bold text-brand">
              Tout voir
            </a>
          </div>
          <ul className="flex flex-col divide-y divide-line-soft">
            {risk.slice(0, 8).map(({ s, f }) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="flex flex-col">
                  <span className="text-[15px] font-semibold">{fullName(s)}</span>
                  <span className="text-[13px] text-ink-3">
                    {s.className} · {f.alerts[0].fee.name}
                  </span>
                </span>
                <span className="text-[15px] font-bold text-danger-ink">{formatMoney(f.alerts[0].status.missing, currency)}</span>
              </li>
            ))}
            {risk.length === 0 && <li className="py-2 text-sm text-ink-3">Aucun élève en situation de renvoi pour le moment.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
