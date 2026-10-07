// Modèle de données Firestore de ParentEcole.
//
// Arborescence :
//   superadmins/{email}
//   members/{email}                      personnel d'une école (directeur, agents)
//   schools/{schoolId}
//   schools/{schoolId}/classes/{id}
//   schools/{schoolId}/fees/{id}
//   schools/{schoolId}/announcements/{id}
//   schools/{schoolId}/events/{id}
//   schools/{schoolId}/homework/{id}
//   students/{studentId}
//   students/{studentId}/parents/{uid}     liaison parent ↔ élève
//   students/{studentId}/attendance/{date}
//   students/{studentId}/payments/{id}
//   students/{studentId}/conduct/{id}
//   students/{studentId}/homeworkSeen/{homeworkId}
//   codes/{matricule}                      matricule → élève (lecture par ID uniquement)
//   schoolParents/{schoolId}_{uid}         donne aux parents l'accès aux infos de l'école
//   users/{uid}                            préférences et jetons de notification

export type StaffRole = 'admin' | 'surveillant' | 'professeur' | 'caissier';

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  admin: 'Direction',
  surveillant: 'Surveillant',
  professeur: 'Professeur',
  caissier: 'Caissier',
};

/** Date au format AAAA-MM-JJ. */
export type ISODate = string;

export interface School {
  id: string;
  name: string;
  address: string;
  phone: string;
  /** Symbole affiché après les montants : « $ » ou « FC ». */
  currency: string;
  /** Préfixe des matricules, ex. « HORZ ». */
  codePrefix: string;
  adminEmail: string;
  active: boolean;
  createdAt: string;
}

export interface Member {
  /** E-mail en minuscules, aussi utilisé comme ID du document. */
  email: string;
  schoolId: string;
  role: StaffRole;
  name: string;
  phone?: string;
  /** Classes suivies (professeur, surveillant de section). */
  classIds: string[];
  active: boolean;
  createdAt: string;
}

export interface ClassRoom {
  id: string;
  schoolId: string;
  name: string;
  level: string;
  titulaireEmail?: string;
  titulaireName?: string;
}

export interface Student {
  id: string;
  schoolId: string;
  classId: string;
  className: string;
  firstName: string;
  lastName: string;
  gender: 'M' | 'F';
  birthDate?: ISODate;
  matricule: string;
  parentName: string;
  parentPhone: string;
  /** Second numéro (autre parent ou tuteur), facultatif. */
  parentPhone2?: string;
  /** Numéros autorisés à lier un compte parent (9 derniers chiffres). */
  parentPhoneKeys: string[];
  parentEmail?: string;
  hasTransport: boolean;
  hasCantine: boolean;
  /** Frais « spéciaux » attribués individuellement. */
  customFeeIds: string[];
  active: boolean;
  createdAt: string;
}

export type FeeType = 'tuition' | 'transport' | 'cantine' | 'special';

export const FEE_TYPE_LABELS: Record<FeeType, string> = {
  tuition: 'Minerval',
  transport: 'Transport',
  cantine: 'Cantine',
  special: 'Frais spécial',
};

export interface FeeInstallment {
  id: string;
  name: string;
  amount: number;
  dueDate: ISODate;
  /** Date de renvoi : les élèves sous le seuil sont renvoyés ce jour-là. */
  cutoffDate: ISODate;
  /** Montant cumulé à avoir payé pour cette catégorie à la date de renvoi. */
  minimumCumulative: number;
}

export interface FeeCategory {
  id: string;
  schoolId: string;
  name: string;
  type: FeeType;
  totalAmount: number;
  /** Classes concernées ; vide = toutes les classes. */
  classIds: string[];
  installments: FeeInstallment[];
}

export type PaymentMethod = 'Espèces' | 'Mobile Money' | 'Virement bancaire' | 'Chèque';
export const PAYMENT_METHODS: PaymentMethod[] = ['Espèces', 'Mobile Money', 'Virement bancaire', 'Chèque'];

export interface Payment {
  id: string;
  studentId: string;
  schoolId: string;
  studentName: string;
  className: string;
  feeId: string;
  feeName: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  date: ISODate;
  notes?: string;
  recordedBy: string;
  recordedByName: string;
  createdAt: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  present: 'Présent',
  absent: 'Absent',
  late: 'En retard',
  excused: 'Absence justifiée',
};

export type JustificationStatus = 'pending' | 'accepted' | 'rejected';

export interface Attendance {
  /** = date (un document par élève et par jour). */
  id: ISODate;
  studentId: string;
  schoolId: string;
  classId: string;
  studentName: string;
  date: ISODate;
  status: AttendanceStatus;
  reason?: string;
  recordedBy: string;
  recordedByName: string;
  recordedAt: string;
  /** Justification envoyée par le parent. */
  justification?: string;
  justifiedAt?: string;
  justificationStatus?: JustificationStatus;
}

export interface Homework {
  id: string;
  schoolId: string;
  classId: string;
  className: string;
  subject: string;
  title: string;
  description: string;
  dueDate: ISODate;
  teacherName: string;
  createdBy: string;
  createdAt: string;
}

export type ConductType =
  | 'Félicitation'
  | 'Observation positive'
  | 'Observation'
  | 'Avertissement'
  | 'Retard récurrent'
  | 'Absence injustifiée'
  | 'Exclusion temporaire';

export type ConductSeverity = 'positive' | 'info' | 'warning' | 'danger';

export const CONDUCT_TYPES: { type: ConductType; severity: ConductSeverity }[] = [
  { type: 'Félicitation', severity: 'positive' },
  { type: 'Observation positive', severity: 'positive' },
  { type: 'Observation', severity: 'info' },
  { type: 'Avertissement', severity: 'warning' },
  { type: 'Retard récurrent', severity: 'warning' },
  { type: 'Absence injustifiée', severity: 'warning' },
  { type: 'Exclusion temporaire', severity: 'danger' },
];

export interface Conduct {
  id: string;
  studentId: string;
  schoolId: string;
  classId: string;
  studentName: string;
  type: ConductType;
  severity: ConductSeverity;
  title: string;
  comment: string;
  date: ISODate;
  author: string;
  createdBy: string;
  createdAt: string;
}

export type AnnouncementCategory = 'Général' | 'Urgent' | 'Pédagogique' | 'Financier' | 'Congés';
export const ANNOUNCEMENT_CATEGORIES: AnnouncementCategory[] = ['Général', 'Urgent', 'Pédagogique', 'Financier', 'Congés'];

export interface Announcement {
  id: string;
  schoolId: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  /** Classes visées ; vide = toute l'école. */
  classIds: string[];
  publishedAt: string;
  author: string;
}

export type EventCategory = 'Examen' | 'Réunion' | 'Congé' | 'Activité' | 'Paiement';
export const EVENT_CATEGORIES: EventCategory[] = ['Examen', 'Réunion', 'Congé', 'Activité', 'Paiement'];

export interface SchoolEvent {
  id: string;
  schoolId: string;
  title: string;
  date: ISODate;
  category: EventCategory;
  description?: string;
}

export interface ParentLink {
  uid: string;
  studentId: string;
  schoolId: string;
  /** Les 9 derniers chiffres du téléphone, vérifiés par les règles Firestore. */
  phone: string;
  email: string;
  name: string;
  linkedAt: string;
}

export interface HomeworkSeen {
  homeworkId: string;
  studentId: string;
  schoolId: string;
  classId: string;
  uid: string;
  seenAt: string;
}

export interface StudentCode {
  studentId: string;
  schoolId: string;
}
