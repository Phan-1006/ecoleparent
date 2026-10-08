import { deleteDoc, getDoc, runTransaction, updateDoc, writeBatch, doc, type Firestore } from 'firebase/firestore';
import { generateMatricule, normalizeMatricule, phoneKey } from '../codes';
import type { ParentLink, School, Student, StudentCode } from '../types';
import { clean, fromDoc, nowISO, refs } from './refs';

export type StudentInput = Omit<Student, 'id' | 'matricule' | 'parentPhoneKeys' | 'createdAt' | 'active'>;

function phoneKeys(s: Pick<Student, 'parentPhone' | 'parentPhone2'>): string[] {
  return [...new Set([s.parentPhone, s.parentPhone2].filter(Boolean).map((p) => phoneKey(p!)))].filter((k) => k.length === 9);
}

/**
 * Inscrit un élève et réserve son matricule (codes/{matricule}) dans la même transaction,
 * en recommençant si le matricule tiré existe déjà.
 */
export async function createStudent(db: Firestore, school: Pick<School, 'id' | 'codePrefix'>, input: StudentInput): Promise<Student> {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 5; attempt++) {
    const matricule = generateMatricule(school.codePrefix, year);
    const studentRef = doc(refs.students(db));
    const student: Student = clean({
      ...input,
      id: studentRef.id,
      schoolId: school.id,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      parentName: input.parentName.trim(),
      parentPhone: input.parentPhone.trim(),
      parentPhone2: input.parentPhone2?.trim() || undefined,
      parentPhoneKeys: phoneKeys(input),
      matricule,
      active: true,
      createdAt: nowISO(),
    });
    const created = await runTransaction(db, async (tx) => {
      const codeSnap = await tx.get(refs.code(db, matricule));
      if (codeSnap.exists()) return false;
      const { id: _id, ...data } = student;
      tx.set(studentRef, data);
      tx.set(refs.code(db, matricule), { studentId: student.id, schoolId: school.id } satisfies StudentCode);
      return true;
    });
    if (created) return student;
  }
  throw new Error('Impossible de générer un matricule unique. Réessayez.');
}

export async function updateStudent(db: Firestore, student: Student, patch: Partial<StudentInput>) {
  const merged = { ...student, ...patch };
  await updateDoc(
    refs.student(db, student.id),
    clean({ ...patch, parentPhone2: merged.parentPhone2 ?? '', parentPhoneKeys: phoneKeys(merged) }),
  );
}

export async function setStudentActive(db: Firestore, studentId: string, active: boolean) {
  await updateDoc(refs.student(db, studentId), { active });
}

/** Supprime l'élève et libère son matricule (l'historique reste en base mais n'est plus accessible). */
export async function deleteStudent(db: Firestore, student: Pick<Student, 'id' | 'matricule'>) {
  const batch = writeBatch(db);
  batch.delete(refs.student(db, student.id));
  batch.delete(refs.code(db, student.matricule));
  await batch.commit();
}

// ── Liaison parent ↔ élève ─────────────────────────────────────────────────

export async function lookupCode(db: Firestore, rawCode: string): Promise<StudentCode | null> {
  const snap = await getDoc(refs.code(db, normalizeMatricule(rawCode)));
  return snap.exists() ? (snap.data() as StudentCode) : null;
}

export interface LinkChildInput {
  uid: string;
  email: string;
  name: string;
  code: string;
  phone: string;
}

/**
 * Lie le compte du parent à un élève. Les règles Firestore vérifient que le téléphone
 * fait partie des numéros enregistrés par l'école pour cet élève.
 */
export async function linkChild(db: Firestore, input: LinkChildInput): Promise<ParentLink> {
  const code = await lookupCode(db, input.code);
  if (!code) throw new Error('Code élève introuvable. Vérifiez le code remis par l’école.');

  const linkRef = refs.studentSubDoc(db, code.studentId, 'parents', input.uid);
  const existing = await getDoc(linkRef);
  if (existing.exists()) return fromDoc<ParentLink>(existing)!;

  const link: ParentLink = {
    uid: input.uid,
    studentId: code.studentId,
    schoolId: code.schoolId,
    phone: phoneKey(input.phone),
    email: input.email,
    name: input.name,
    linkedAt: nowISO(),
  };
  const batch = writeBatch(db);
  batch.set(linkRef, link);
  batch.set(refs.schoolParent(db, code.schoolId, input.uid), {
    uid: input.uid,
    schoolId: code.schoolId,
    studentId: code.studentId,
  });
  try {
    await batch.commit();
  } catch (e) {
    if ((e as { code?: string }).code === 'permission-denied') {
      throw new Error('Ce numéro ne correspond pas à celui donné à l’école pour cet élève.');
    }
    throw e;
  }
  return link;
}

export async function unlinkChild(db: Firestore, link: ParentLink, otherLinks: ParentLink[]) {
  await deleteDoc(refs.studentSubDoc(db, link.studentId, 'parents', link.uid));
  const sameSchool = otherLinks.some((l) => l.schoolId === link.schoolId && l.studentId !== link.studentId);
  if (!sameSchool) await deleteDoc(refs.schoolParent(db, link.schoolId, link.uid)).catch(() => undefined);
}
