import { formatDayMonth, formatMoney, type FinanceAlert, type Student } from '@pe/shared';

/** Accord selon le genre de l'élève : accord(s, 'présent', 'présente'). */
export const accord = (s: Pick<Student, 'gender'>, m: string, f: string) => (s.gender === 'F' ? f : m);

export function alertTitle(a: FinanceAlert): string {
  const { state, installment } = a.status;
  if (state === 'renvoi') return `Date de renvoi dépassée (${formatDayMonth(installment.cutoffDate)})`;
  if (state === 'overdue') return `Échéance dépassée, renvoi le ${formatDayMonth(installment.cutoffDate)}`;
  if (a.level === 'danger') return `Risque de renvoi le ${formatDayMonth(installment.cutoffDate)}`;
  return `Prochaine échéance : ${installment.name}`;
}

export function alertText(a: FinanceAlert, currency: string): string {
  const { installment, missing, required, paidTowards } = a.status;
  const fee = a.fee.name.toLowerCase();
  if (a.level === 'danger') {
    return `Il manque ${formatMoney(missing, currency)} pour atteindre le seuil de ${formatMoney(required, currency)} (${installment.name}, ${fee}). Déjà payé sur cette tranche : ${formatMoney(paidTowards, currency)}.`;
  }
  return `${formatMoney(missing, currency)} à payer avant le ${formatDayMonth(installment.dueDate)} (${fee}).`;
}

/** Résumé court pour l'alerte d'un autre enfant : « 70 $ à payer avant le 25 octobre ». */
export function alertShort(a: FinanceAlert, currency: string): string {
  return `${formatMoney(a.status.missing, currency)} à payer avant le ${formatDayMonth(a.status.installment.cutoffDate)}`;
}
