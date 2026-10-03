export type UserRole = 'superadmin' | 'school_admin' | 'agent' | 'parent';

export type AgentFunction = 'surveillant' | 'professeur' | 'caissier';

export interface AppUser {
  email: string;
  name: string;
  role: UserRole;
  schoolId?: string; // If school_admin or agent
  agentFunction?: AgentFunction; // If agent
  avatar?: string;
}

export interface School {
  id: string;
  name: string;
  adminEmail: string;
  adminName: string;
  phone: string;
  address: string;
  currency: string; // e.g., '$' or 'FC'
  createdAt: string;
  active: boolean;
  password?: string; // Access code / password
}

export interface SchoolAgent {
  id: string;
  schoolId: string;
  email: string;
  name: string;
  roleType: AgentFunction;
  assignedClassIds?: string[]; // for teachers or titulaire
  isTitulaire?: boolean;
  phone?: string;
  active: boolean;
  password?: string; // Access code / password
}

export interface ClassRoom {
  id: string;
  schoolId: string;
  name: string; // e.g. "6ème Primaire A", "3ème Scientifique"
  level: string; // "Primaire", "Secondaire", etc.
  titulaireAgentId?: string; // Assigned teacher
  titulaireName?: string;
  studentCount?: number;
}

export interface Student {
  id: string; // unique ID
  matricule: string; // Secure / encrypted student ID for parent access (e.g. "PE-HOR-2026-X49")
  schoolId: string;
  classId: string;
  className: string;
  firstName: string;
  lastName: string;
  gender: 'M' | 'F';
  birthDate?: string;
  parentName: string;
  parentEmail?: string;
  parentPhone?: string;
  hasTransport: boolean;
  hasCantine: boolean;
  hasInternat: boolean;
  customFeeIds: string[]; // additional specific fees assigned
  createdAt: string;
}

export interface FeeInstallment {
  id: string;
  name: string; // e.g., "1ère Tranche", "2ème Tranche"
  amount: number;
  dueDate: string; // YYYY-MM-DD
  cutoffRecoveryDate: string; // Date de recouvrement / renvoi
  minimumCumulativeRequired: number; // e.g. At date X, student must have paid at least this amount or face renvoi
}

export interface FeeCategory {
  id: string;
  schoolId: string;
  name: string; // e.g., "Minerval Régulier", "Transport Scolaire", "Cantine", "Frais d'Examen"
  type: 'tuition' | 'transport' | 'cantine' | 'special';
  totalAmount: number;
  isOptional: boolean;
  applicableClassIds?: string[]; // Empty means all classes
  installments: FeeInstallment[];
}

export interface PaymentRecord {
  id: string;
  schoolId: string;
  studentId: string;
  studentMatricule: string;
  studentName: string;
  className: string;
  feeCategoryId: string;
  feeCategoryName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'Espèces' | 'Mobile Money' | 'Virement Bancaire' | 'Chèque';
  referenceNumber: string;
  recordedByAgentEmail: string;
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  schoolId: string;
  classId: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  studentName: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  reason?: string;
  recordedByAgentEmail: string;
  recordedAt: string;
}

export interface Homework {
  id: string;
  schoolId: string;
  classId: string;
  className: string;
  subject: string;
  title: string;
  description: string;
  dueDate: string; // Date de remise
  dueTime?: string;
  createdByAgentEmail: string;
  teacherName: string;
  createdAt: string;
}

export interface ConductReport {
  id: string;
  schoolId: string;
  studentId: string;
  studentName: string;
  className: string;
  type: 'Avertissement' | 'Observation' | 'Félicitation' | 'Retard récurrent' | 'Absence injustifiée' | 'Exclusion temporaire';
  severity: 'info' | 'warning' | 'danger' | 'success';
  title: string;
  comment: string;
  date: string;
  reportedByTeacher: string;
}

export interface Announcement {
  id: string;
  schoolId: string;
  title: string;
  content: string;
  category: 'Général' | 'Urgent' | 'Pédagogique' | 'Financier' | 'Congés';
  targetClassIds?: string[]; // Empty = entire school
  publishDate: string;
  author: string;
}

export interface SchoolEvent {
  id: string;
  schoolId: string;
  title: string;
  date: string;
  category: 'Examen' | 'Réunion' | 'Congé' | 'Activité';
  description?: string;
}
