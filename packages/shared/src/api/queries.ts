import { limit, orderBy, query, where, type Firestore } from 'firebase/firestore';
import { refs } from './refs';

// Requêtes de lecture. Les requêtes « groupe de collections » (toute l'école)
// ont besoin des index déclarés dans firestore.indexes.json.

export const q = {
  schools: (db: Firestore) => query(refs.schools(db)),
  members: (db: Firestore, schoolId: string) => query(refs.members(db), where('schoolId', '==', schoolId)),
  classes: (db: Firestore, schoolId: string) => query(refs.schoolSub(db, schoolId, 'classes')),
  fees: (db: Firestore, schoolId: string) => query(refs.schoolSub(db, schoolId, 'fees')),
  announcements: (db: Firestore, schoolId: string) =>
    query(refs.schoolSub(db, schoolId, 'announcements'), orderBy('publishedAt', 'desc'), limit(100)),
  events: (db: Firestore, schoolId: string) => query(refs.schoolSub(db, schoolId, 'events'), orderBy('date')),
  homework: (db: Firestore, schoolId: string) =>
    query(refs.schoolSub(db, schoolId, 'homework'), orderBy('dueDate', 'desc'), limit(300)),
  classHomework: (db: Firestore, schoolId: string, classId: string) =>
    query(refs.schoolSub(db, schoolId, 'homework'), where('classId', '==', classId)),

  students: (db: Firestore, schoolId: string) => query(refs.students(db), where('schoolId', '==', schoolId)),
  classStudents: (db: Firestore, schoolId: string, classId: string) =>
    query(refs.students(db), where('schoolId', '==', schoolId), where('classId', '==', classId)),

  // Toute l'école (groupe de collections)
  schoolPayments: (db: Firestore, schoolId: string, max = 500) =>
    query(refs.group(db, 'payments'), where('schoolId', '==', schoolId), orderBy('date', 'desc'), limit(max)),
  schoolAttendanceOn: (db: Firestore, schoolId: string, date: string) =>
    query(refs.group(db, 'attendance'), where('schoolId', '==', schoolId), where('date', '==', date)),
  pendingJustifications: (db: Firestore, schoolId: string) =>
    query(refs.group(db, 'attendance'), where('schoolId', '==', schoolId), where('justificationStatus', '==', 'pending')),
  schoolConduct: (db: Firestore, schoolId: string, max = 200) =>
    query(refs.group(db, 'conduct'), where('schoolId', '==', schoolId), orderBy('date', 'desc'), limit(max)),
  classHomeworkSeen: (db: Firestore, schoolId: string, classId: string) =>
    query(refs.group(db, 'homeworkSeen'), where('schoolId', '==', schoolId), where('classId', '==', classId)),

  // Un élève
  childAttendance: (db: Firestore, studentId: string) =>
    query(refs.studentSub(db, studentId, 'attendance'), orderBy('date', 'desc'), limit(400)),
  childPayments: (db: Firestore, studentId: string) =>
    query(refs.studentSub(db, studentId, 'payments'), orderBy('date', 'desc')),
  childConduct: (db: Firestore, studentId: string) =>
    query(refs.studentSub(db, studentId, 'conduct'), orderBy('date', 'desc')),
  childHomeworkSeen: (db: Firestore, studentId: string) => query(refs.studentSub(db, studentId, 'homeworkSeen')),

  // Parent : ses enfants liés
  myLinks: (db: Firestore, uid: string) => query(refs.group(db, 'parents'), where('uid', '==', uid)),
};
