import { describe, expect, it } from 'vitest';
import { generateMatricule, isMatriculeFormat, normalizeMatricule, phoneKey, schoolCodePrefix } from './codes';
import { buildClassStatuses, summarizeAttendance } from './attendance';

describe('codes', () => {
  it('génère des matricules au bon format et différents', () => {
    const a = generateMatricule('CSH', 2026);
    const b = generateMatricule('CSH', 2026);
    expect(isMatriculeFormat(a)).toBe(true);
    expect(a).toMatch(/^PE-CSH-2026-[A-Z0-9]{6}$/);
    expect(a).not.toBe(b);
  });

  it('remet en forme un matricule saisi à la main', () => {
    expect(normalizeMatricule('  pe horz 2026 dk89 ')).toBe('PE-HORZ-2026-DK89');
    expect(normalizeMatricule('pe--csh-2026-k7p2qm')).toBe('PE-CSH-2026-K7P2QM');
  });

  it('tire un préfixe du nom de l’école', () => {
    expect(schoolCodePrefix('Complexe Scolaire Horizon')).toBe('CSH');
    expect(schoolCodePrefix('Lycée Saint-Joseph')).toBe('LSJ');
    expect(schoolCodePrefix('Horizon')).toBe('HORI');
  });

  it('ramène les numéros congolais aux 9 derniers chiffres', () => {
    expect(phoneKey('+243 812 345 678')).toBe('812345678');
    expect(phoneKey('0812345678')).toBe('812345678');
    expect(phoneKey('00243-81-234-5678')).toBe('812345678');
  });
});

describe('attendance', () => {
  it('marque présents tous les élèves non cochés', () => {
    const r = buildClassStatuses(['a', 'b', 'c'], { b: { status: 'absent', reason: '  ' }, c: { status: 'late', reason: 'Bus' } });
    expect(r).toEqual([
      { studentId: 'a', status: 'present' },
      { studentId: 'b', status: 'absent', reason: undefined },
      { studentId: 'c', status: 'late', reason: 'Bus' },
    ]);
  });

  it('compte les absences non justifiées', () => {
    const s = summarizeAttendance([
      { status: 'present' },
      { status: 'absent' },
      { status: 'absent', justificationStatus: 'accepted' },
      { status: 'late' },
    ]);
    expect(s).toEqual({ present: 1, absent: 2, late: 1, excused: 0, unjustified: 1 });
  });
});
