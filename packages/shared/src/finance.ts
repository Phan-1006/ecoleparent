import { daysBetween, todayISO } from './dates';
import type { FeeCategory, FeeInstallment, ISODate, Payment, Student } from './types';

export type InstallmentState =
  /** Seuil atteint. */
  | 'paid'
  /** Échéance à venir, rien ou une partie seulement de payé. */
  | 'upcoming'
  /** Échéance passée, seuil pas atteint ; le renvoi n'a pas encore eu lieu. */
  | 'overdue'
  /** Date de renvoi passée sans atteindre le seuil. */
  | 'renvoi';

export interface InstallmentStatus {
  installment: FeeInstallment;
  state: InstallmentState;
  /** Seuil cumulé à atteindre pour cette tranche. */
  required: number;
  /** Part déjà payée sur cette tranche (entre 0 et son montant). */
  paidTowards: number;
  /** Ce qui manque pour atteindre le seuil (0 si payé). */
  missing: number;
  daysToDue: number;
  daysToCutoff: number;
}

export interface FeeStatus {
  fee: FeeCategory;
  paid: number;
  remaining: number;
  installments: InstallmentStatus[];
  /** Première tranche dont le seuil n'est pas atteint. */
  next: InstallmentStatus | null;
}

export type AlertLevel = 'danger' | 'warning' | 'info';

export interface FinanceAlert {
  level: AlertLevel;
  fee: FeeCategory;
  status: InstallmentStatus;
}

export interface StudentFinance {
  fees: FeeStatus[];
  total: number;
  paid: number;
  remaining: number;
  /** Paiements rattachés à aucun frais applicable (frais supprimé, élève changé de classe…). */
  unallocated: number;
  /** Alertes triées de la plus urgente à la moins urgente. */
  alerts: FinanceAlert[];
}

/** Jours avant l'échéance à partir desquels une tranche impayée devient une alerte rouge. */
export const DANGER_DAYS = 10;
/** Jours avant l'échéance à partir desquels une tranche impayée devient une alerte orange. */
export const WARNING_DAYS = 30;

/** Frais qui s'appliquent à un élève selon sa classe et ses options. */
export function applicableFees(student: Pick<Student, 'schoolId' | 'classId' | 'hasTransport' | 'hasCantine' | 'customFeeIds'>, fees: FeeCategory[]): FeeCategory[] {
  return fees.filter((fee) => {
    if (fee.schoolId !== student.schoolId) return false;
    if (student.customFeeIds?.includes(fee.id)) return true;
    if (fee.classIds?.length && !fee.classIds.includes(student.classId)) return false;
    switch (fee.type) {
      case 'tuition':
        return true;
      case 'transport':
        return student.hasTransport;
      case 'cantine':
        return student.hasCantine;
      case 'special':
        return false;
    }
  });
}

/** Seuils cumulés : la valeur saisie par l'école, sinon la somme des tranches précédentes. */
export function cumulativeThresholds(installments: FeeInstallment[]): number[] {
  let sum = 0;
  return installments.map((inst) => {
    sum += inst.amount;
    return inst.minimumCumulative > 0 ? inst.minimumCumulative : sum;
  });
}

export function sortInstallments(installments: FeeInstallment[]): FeeInstallment[] {
  return [...installments].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function computeFeeStatus(fee: FeeCategory, paid: number, today: ISODate): FeeStatus {
  const installments = sortInstallments(fee.installments ?? []);
  const thresholds = cumulativeThresholds(installments);
  const statuses = installments.map((installment, i): InstallmentStatus => {
    const required = thresholds[i];
    const before = required - installment.amount;
    const paidTowards = Math.min(installment.amount, Math.max(0, paid - before));
    const missing = Math.max(0, required - paid);
    const daysToDue = daysBetween(today, installment.dueDate);
    const daysToCutoff = daysBetween(today, installment.cutoffDate || installment.dueDate);
    let state: InstallmentState;
    if (missing === 0) state = 'paid';
    else if (daysToCutoff < 0) state = 'renvoi';
    else if (daysToDue < 0) state = 'overdue';
    else state = 'upcoming';
    return { installment, state, required, paidTowards, missing, daysToDue, daysToCutoff };
  });
  return {
    fee,
    paid,
    remaining: Math.max(0, fee.totalAmount - paid),
    installments: statuses,
    next: statuses.find((s) => s.state !== 'paid') ?? null,
  };
}

export function alertLevel(status: InstallmentStatus): AlertLevel | null {
  if (status.state === 'paid') return null;
  if (status.state === 'renvoi' || status.state === 'overdue') return 'danger';
  if (status.daysToDue <= DANGER_DAYS) return 'danger';
  if (status.daysToDue <= WARNING_DAYS) return 'warning';
  return 'info';
}

const LEVEL_ORDER: Record<AlertLevel, number> = { danger: 0, warning: 1, info: 2 };

/**
 * Situation financière d'un élève. Chaque paiement est compté uniquement pour le frais
 * auquel il est rattaché : payer le transport ne fait pas avancer le minerval.
 */
export function computeStudentFinance(
  student: Pick<Student, 'id' | 'schoolId' | 'classId' | 'hasTransport' | 'hasCantine' | 'customFeeIds'>,
  allFees: FeeCategory[],
  payments: Payment[],
  today: ISODate = todayISO(),
): StudentFinance {
  const fees = applicableFees(student, allFees);
  const own = payments.filter((p) => p.studentId === student.id);
  const paidByFee = new Map<string, number>();
  for (const p of own) paidByFee.set(p.feeId, (paidByFee.get(p.feeId) ?? 0) + p.amount);

  const feeStatuses = fees.map((fee) => computeFeeStatus(fee, paidByFee.get(fee.id) ?? 0, today));
  const feeIds = new Set(fees.map((f) => f.id));
  const unallocated = own.filter((p) => !feeIds.has(p.feeId)).reduce((s, p) => s + p.amount, 0);

  const alerts: FinanceAlert[] = [];
  for (const fs of feeStatuses) {
    if (!fs.next) continue;
    const level = alertLevel(fs.next);
    if (level) alerts.push({ level, fee: fs.fee, status: fs.next });
  }
  alerts.sort(
    (a, b) =>
      LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] ||
      a.status.daysToCutoff - b.status.daysToCutoff ||
      b.status.missing - a.status.missing,
  );

  return {
    fees: feeStatuses,
    total: fees.reduce((s, f) => s + f.totalAmount, 0),
    paid: own.reduce((s, p) => s + p.amount, 0),
    remaining: feeStatuses.reduce((s, f) => s + f.remaining, 0),
    unallocated,
    alerts,
  };
}

/** Vrai si l'élève risque le renvoi (échéance proche ou dépassée, seuil non atteint). */
export function isRenvoiRisk(alert: FinanceAlert | undefined): boolean {
  return !!alert && alert.level === 'danger';
}
