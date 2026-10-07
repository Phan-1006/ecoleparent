import type { Attendance, AttendanceStatus } from './types';

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  excused: number;
  /** Absences sans justification acceptée. */
  unjustified: number;
}

export function summarizeAttendance(records: Pick<Attendance, 'status' | 'justificationStatus'>[]): AttendanceSummary {
  const s: AttendanceSummary = { present: 0, absent: 0, late: 0, excused: 0, unjustified: 0 };
  for (const r of records) {
    s[r.status] += 1;
    if (r.status === 'absent' && r.justificationStatus !== 'accepted') s.unjustified += 1;
  }
  return s;
}

/**
 * Appel express : seuls les absents et les retards sont cochés,
 * tous les autres élèves de la classe sont marqués présents.
 */
export function buildClassStatuses(
  studentIds: string[],
  marks: Record<string, { status: Exclude<AttendanceStatus, 'present'>; reason?: string }>,
): { studentId: string; status: AttendanceStatus; reason?: string }[] {
  return studentIds.map((studentId) => {
    const mark = marks[studentId];
    if (!mark) return { studentId, status: 'present' };
    return { studentId, status: mark.status, reason: mark.reason?.trim() || undefined };
  });
}
