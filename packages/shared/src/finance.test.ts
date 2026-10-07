import { describe, expect, it } from 'vitest';
import { applicableFees, computeStudentFinance } from './finance';
import type { FeeCategory, Payment } from './types';

const minerval: FeeCategory = {
  id: 'minerval',
  schoolId: 's1',
  name: 'Minerval',
  type: 'tuition',
  totalAmount: 450,
  classIds: [],
  installments: [
    { id: 't1', name: '1re tranche', amount: 150, dueDate: '2026-10-15', cutoffDate: '2026-10-25', minimumCumulative: 150 },
    { id: 't2', name: '2e tranche', amount: 150, dueDate: '2026-12-15', cutoffDate: '2026-12-28', minimumCumulative: 300 },
    { id: 't3', name: '3e tranche', amount: 150, dueDate: '2027-02-28', cutoffDate: '2027-03-10', minimumCumulative: 450 },
  ],
};

const transport: FeeCategory = {
  id: 'transport',
  schoolId: 's1',
  name: 'Transport',
  type: 'transport',
  totalAmount: 90,
  classIds: [],
  installments: [
    { id: 'tr1', name: 'Trimestre 1', amount: 45, dueDate: '2026-10-10', cutoffDate: '2026-10-20', minimumCumulative: 0 },
    { id: 'tr2', name: 'Trimestre 2', amount: 45, dueDate: '2027-01-10', cutoffDate: '2027-01-20', minimumCumulative: 0 },
  ],
};

const examen: FeeCategory = {
  id: 'examen',
  schoolId: 's1',
  name: "Frais d'examen d'État",
  type: 'special',
  totalAmount: 60,
  classIds: ['c-terminale'],
  installments: [],
};

const student = {
  id: 'david',
  schoolId: 's1',
  classId: 'c-3sci',
  hasTransport: true,
  hasCantine: false,
  customFeeIds: [] as string[],
};

const pay = (feeId: string, amount: number, studentId = 'david'): Payment => ({
  id: `${feeId}-${amount}`,
  studentId,
  schoolId: 's1',
  studentName: 'X',
  className: 'Y',
  feeId,
  feeName: feeId,
  amount,
  method: 'Espèces',
  reference: 'REC',
  date: '2026-09-12',
  recordedBy: 'caisse@ecole.cd',
  recordedByName: 'Caisse',
  createdAt: '2026-09-12T08:00:00Z',
});

describe('applicableFees', () => {
  it('applique le minerval à tous, le transport seulement aux abonnés', () => {
    expect(applicableFees(student, [minerval, transport, examen]).map((f) => f.id)).toEqual(['minerval', 'transport']);
    expect(applicableFees({ ...student, hasTransport: false }, [minerval, transport]).map((f) => f.id)).toEqual(['minerval']);
  });

  it('applique un frais spécial attribué individuellement, même hors classe', () => {
    expect(applicableFees({ ...student, customFeeIds: ['examen'] }, [examen]).map((f) => f.id)).toEqual(['examen']);
  });

  it("ignore les frais d'une autre école", () => {
    expect(applicableFees({ ...student, schoolId: 's2' }, [minerval])).toEqual([]);
  });
});

describe('computeStudentFinance', () => {
  it('ne compte pas le transport payé dans le seuil du minerval', () => {
    // 100 $ de minerval + 45 $ de transport : l'ancienne logique additionnait 145 $
    // pour le seuil de 150 $ du minerval.
    const f = computeStudentFinance(student, [minerval, transport], [pay('minerval', 100), pay('transport', 45)], '2026-10-07');
    const min = f.fees.find((x) => x.fee.id === 'minerval')!;
    expect(min.paid).toBe(100);
    expect(min.next?.installment.id).toBe('t1');
    expect(min.next?.missing).toBe(50);
    expect(f.paid).toBe(145);
    expect(f.total).toBe(540);
    expect(f.remaining).toBe(350 + 45);
  });

  it('cas David : 1re tranche payée, prochaine échéance en décembre, pas d’alerte rouge', () => {
    const f = computeStudentFinance(student, [minerval, transport], [pay('minerval', 150), pay('transport', 45)], '2026-10-07');
    const min = f.fees.find((x) => x.fee.id === 'minerval')!;
    expect(min.installments[0].state).toBe('paid');
    expect(min.next?.installment.id).toBe('t2');
    expect(f.alerts.every((a) => a.level !== 'danger')).toBe(true);
    expect(f.alerts[0].level).toBe('info');
  });

  it('cas Sarah : 80 $ sur 150 $ à 8 jours de l’échéance → alerte rouge, il manque 70 $', () => {
    const sarah = { ...student, id: 'sarah', hasTransport: false };
    const f = computeStudentFinance(sarah, [minerval], [pay('minerval', 80, 'sarah')], '2026-10-07');
    expect(f.alerts[0].level).toBe('danger');
    expect(f.alerts[0].status.missing).toBe(70);
    expect(f.alerts[0].status.installment.cutoffDate).toBe('2026-10-25');
    expect(f.alerts[0].status.paidTowards).toBe(80);
  });

  it('passe en « renvoi » après la date de renvoi', () => {
    const f = computeStudentFinance(student, [minerval], [pay('minerval', 80)], '2026-10-26');
    expect(f.fees[0].next?.state).toBe('renvoi');
  });

  it('passe en « overdue » entre l’échéance et le renvoi', () => {
    const f = computeStudentFinance(student, [minerval], [], '2026-10-20');
    expect(f.fees[0].next?.state).toBe('overdue');
  });

  it('calcule les seuils cumulés quand l’école ne les a pas saisis', () => {
    const f = computeStudentFinance(student, [transport], [pay('transport', 50)], '2026-10-07');
    const tr = f.fees[0];
    expect(tr.installments.map((i) => i.required)).toEqual([45, 90]);
    expect(tr.installments[0].state).toBe('paid');
    expect(tr.installments[1].paidTowards).toBe(5);
  });

  it('isole les paiements d’un frais qui ne s’applique plus', () => {
    const f = computeStudentFinance({ ...student, hasTransport: false }, [minerval, transport], [pay('transport', 45)], '2026-10-07');
    expect(f.unallocated).toBe(45);
  });

  it('ignore les paiements des autres élèves', () => {
    const f = computeStudentFinance(student, [minerval], [pay('minerval', 150, 'autre')], '2026-10-07');
    expect(f.paid).toBe(0);
  });
});
