// Notifications push vers l'app des parents (Firebase Cloud Messaging).
// Facultatif : exige le plan Blaze de Firebase et google-services.json dans l'APK.
// Déploiement : `npm --prefix functions install && firebase deploy --only functions`.
import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onDocumentCreated, onDocumentWritten } from 'firebase-functions/v2/firestore';

initializeApp();
// Même région que la base Firestore (voir README).
setGlobalOptions({ region: 'europe-west1', maxInstances: 5 });

const db = getFirestore();

const firstName = (full: string) => (full || '').trim().split(/\s+/)[0] || 'Votre enfant';

/** Envoie une notification à tous les comptes parents liés à un élève. */
async function notifyParentsOf(studentId: string, title: string, body: string, kind: string) {
  const links = await db.collection(`students/${studentId}/parents`).get();
  await Promise.all(links.docs.map((l) => notifyUser(l.id, title, body, { kind, studentId })));
}

async function notifyUser(uid: string, title: string, body: string, data: Record<string, string>) {
  const user = await db.doc(`users/${uid}`).get();
  const tokens: string[] = user.get('fcmTokens') ?? [];
  if (tokens.length === 0) return;
  const res = await getMessaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    data,
    android: { priority: 'high', notification: { color: '#1E4A38' } },
  });
  // Jetons expirés (app désinstallée) : on les retire.
  const stale = res.responses
    .map((r, i) => (!r.success && /registration-token-not-registered|invalid-registration-token/.test(r.error?.code ?? '') ? tokens[i] : null))
    .filter((t): t is string => t !== null);
  if (stale.length) await user.ref.update({ fcmTokens: FieldValue.arrayRemove(...stale) });
}

export const onAttendance = onDocumentWritten('students/{studentId}/attendance/{date}', async (event) => {
  const after = event.data?.after.data();
  const before = event.data?.before.data();
  if (!after || before?.status === after.status) return;
  if (after.status !== 'absent' && after.status !== 'late') return;
  const name = firstName(after.studentName);
  await notifyParentsOf(
    event.params.studentId,
    after.status === 'absent' ? `Absence de ${name}` : `Retard de ${name}`,
    after.reason || `Signalé par ${after.recordedByName} lors de l'appel.`,
    'attendance',
  );
});

export const onPayment = onDocumentCreated('students/{studentId}/payments/{id}', async (event) => {
  const p = event.data?.data();
  if (!p) return;
  const school = await db.doc(`schools/${p.schoolId}`).get();
  const currency = school.get('currency') ?? '$';
  await notifyParentsOf(event.params.studentId, `Paiement reçu : ${p.amount} ${currency}`, `${p.feeName} · reçu ${p.reference}`, 'payment');
});

export const onConduct = onDocumentCreated('students/{studentId}/conduct/{id}', async (event) => {
  const c = event.data?.data();
  if (!c) return;
  await notifyParentsOf(event.params.studentId, `${c.type} · ${firstName(c.studentName)}`, c.title, 'conduct');
});

export const onHomework = onDocumentCreated('schools/{schoolId}/homework/{id}', async (event) => {
  const h = event.data?.data();
  if (!h) return;
  const students = await db.collection('students').where('schoolId', '==', event.params.schoolId).where('classId', '==', h.classId).get();
  await Promise.all(students.docs.map((s) => notifyParentsOf(s.id, `Nouveau devoir de ${h.subject}`, h.title, 'homework')));
});

export const onAnnouncement = onDocumentCreated('schools/{schoolId}/announcements/{id}', async (event) => {
  const a = event.data?.data();
  if (!a) return;
  const classIds: string[] = a.classIds ?? [];
  const parents = await db.collection('schoolParents').where('schoolId', '==', event.params.schoolId).get();
  const sent = new Set<string>();
  for (const p of parents.docs) {
    const uid: string = p.get('uid');
    if (sent.has(uid)) continue;
    if (classIds.length) {
      // Communiqué ciblé : seulement les parents d'élèves des classes visées.
      const links = await db.collectionGroup('parents').where('uid', '==', uid).get();
      const studentIds = links.docs.map((l) => l.get('studentId') as string);
      const kids = await Promise.all(studentIds.map((id) => db.doc(`students/${id}`).get()));
      if (!kids.some((k) => classIds.includes(k.get('classId')))) continue;
    }
    sent.add(uid);
    await notifyUser(uid, a.category === 'Urgent' ? `Urgent : ${a.title}` : a.title, String(a.content).slice(0, 180), { kind: 'announcement' });
  }
});
