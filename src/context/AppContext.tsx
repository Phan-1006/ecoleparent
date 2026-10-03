import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AppUser,
  School,
  SchoolAgent,
  ClassRoom,
  Student,
  FeeCategory,
  PaymentRecord,
  AttendanceRecord,
  Homework,
  ConductReport,
  Announcement,
  SchoolEvent,
  UserRole,
} from '../types';
import {
  SUPERADMIN_EMAIL,
  SUPERADMIN_DEFAULT_PIN,
  INITIAL_SCHOOLS,
  INITIAL_AGENTS,
  INITIAL_CLASSES,
  INITIAL_FEES,
  INITIAL_STUDENTS,
  INITIAL_PAYMENTS,
  INITIAL_ATTENDANCE,
  INITIAL_HOMEWORK,
  INITIAL_CONDUCT,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_EVENTS,
} from '../data/initialData';
import { logoutFirebase } from '../firebase';

const STORAGE_KEY = 'PARENTECOLE_DATA_V1';
const USER_STORAGE_KEY = 'PARENTECOLE_USER_V1';
const PARENT_LINKS_KEY = 'PARENTECOLE_PARENT_LINKS_V1';
const SUPERADMIN_PIN_KEY = 'PARENTECOLE_SUPERADMIN_PIN_V1';

interface AppContextType {
  // Current user & auth
  currentUser: AppUser | null;
  login: (email: string, password?: string, name?: string, avatar?: string) => { success: boolean; message: string; role?: UserRole };
  logout: () => void;
  checkEmailAccountType: (email: string) => {
    isStaffOrAdmin: boolean;
    role?: UserRole;
    roleLabel?: string;
    agentFunction?: string;
    schoolName?: string;
  };
  superAdminPin: string;
  updateSuperAdminPin: (newPin: string) => void;

  // Offline / Cache
  isOnline: boolean;
  lastSyncTime: string;

  // Data Collections
  schools: School[];
  agents: SchoolAgent[];
  classes: ClassRoom[];
  students: Student[];
  fees: FeeCategory[];
  payments: PaymentRecord[];
  attendance: AttendanceRecord[];
  homeworks: Homework[];
  conductReports: ConductReport[];
  announcements: Announcement[];
  events: SchoolEvent[];

  // Parent State
  linkedStudentIds: string[];
  activeStudentId: string | null;
  linkStudentByMatricule: (matricule: string) => { success: boolean; message: string; student?: Student };
  setActiveStudentId: (id: string | null) => void;
  unlinkStudent: (id: string) => void;

  // Financial Helpers
  getStudentFinancialStatus: (studentId: string) => {
    totalApplicableFees: number;
    totalPaid: number;
    remainingBalance: number;
    isAtRiskOfRecovery: boolean;
    recoveryWarningDate: string | null;
    recoveryRequiredAmount: number;
    nextInstallmentName: string | null;
    nextInstallmentDueDate: string | null;
    applicableFeeCategories: FeeCategory[];
    studentPayments: PaymentRecord[];
  };

  // SuperAdmin operations
  createSchool: (data: { name: string; adminEmail: string; adminName: string; password?: string; phone: string; address: string; currency?: string }) => void;
  toggleSchoolStatus: (schoolId: string) => void;

  // School Admin operations
  createAgent: (data: Omit<SchoolAgent, 'id' | 'active'>) => void;
  updateAgent: (agentId: string, updates: Partial<SchoolAgent>) => void;
  deleteAgent: (agentId: string) => void;
  createClass: (data: Omit<ClassRoom, 'id' | 'studentCount'>) => void;
  createStudent: (data: Omit<Student, 'id' | 'matricule' | 'createdAt'>) => Student;
  updateStudent: (studentId: string, updates: Partial<Student>) => void;
  deleteStudent: (studentId: string) => void;
  createOrUpdateFee: (fee: FeeCategory) => void;
  deleteFee: (feeId: string) => void;
  addAnnouncement: (data: Omit<Announcement, 'id' | 'publishDate'>) => void;
  addEvent: (data: Omit<SchoolEvent, 'id'>) => void;

  // Agent Operations
  recordClassAttendance: (
    classId: string,
    date: string,
    absentList: { studentId: string; reason?: string }[],
    lateList?: { studentId: string; reason?: string }[]
  ) => void;
  addHomework: (data: Omit<Homework, 'id' | 'createdAt'>) => void;
  deleteHomework: (id: string) => void;
  addConductReport: (data: Omit<ConductReport, 'id'>) => void;
  recordPayment: (data: Omit<PaymentRecord, 'id' | 'referenceNumber'>) => PaymentRecord;

  // System
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Network detection
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => new Date().toLocaleTimeString('fr-FR'));

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Persistent Collections State
  const [schools, setSchools] = useState<School[]>(() => {
    const cached = localStorage.getItem(STORAGE_KEY + '_schools');
    return cached ? JSON.parse(cached) : INITIAL_SCHOOLS;
  });

  const [agents, setAgents] = useState<SchoolAgent[]>(() => {
    const cached = localStorage.getItem(STORAGE_KEY + '_agents');
    return cached ? JSON.parse(cached) : INITIAL_AGENTS;
  });

  const [classes, setClasses] = useState<ClassRoom[]>(() => {
    const cached = localStorage.getItem(STORAGE_KEY + '_classes');
    return cached ? JSON.parse(cached) : INITIAL_CLASSES;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const cached = localStorage.getItem(STORAGE_KEY + '_students');
    return cached ? JSON.parse(cached) : INITIAL_STUDENTS;
  });

  const [fees, setFees] = useState<FeeCategory[]>(() => {
    const cached = localStorage.getItem(STORAGE_KEY + '_fees');
    return cached ? JSON.parse(cached) : INITIAL_FEES;
  });

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const cached = localStorage.getItem(STORAGE_KEY + '_payments');
    return cached ? JSON.parse(cached) : INITIAL_PAYMENTS;
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const cached = localStorage.getItem(STORAGE_KEY + '_attendance');
    return cached ? JSON.parse(cached) : INITIAL_ATTENDANCE;
  });

  const [homeworks, setHomeworks] = useState<Homework[]>(() => {
    const cached = localStorage.getItem(STORAGE_KEY + '_homeworks');
    return cached ? JSON.parse(cached) : INITIAL_HOMEWORK;
  });

  const [conductReports, setConductReports] = useState<ConductReport[]>(() => {
    const cached = localStorage.getItem(STORAGE_KEY + '_conductReports');
    return cached ? JSON.parse(cached) : INITIAL_CONDUCT;
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const cached = localStorage.getItem(STORAGE_KEY + '_announcements');
    return cached ? JSON.parse(cached) : INITIAL_ANNOUNCEMENTS;
  });

  const [events, setEvents] = useState<SchoolEvent[]>(() => {
    const cached = localStorage.getItem(STORAGE_KEY + '_events');
    return cached ? JSON.parse(cached) : INITIAL_EVENTS;
  });

  // Current logged in user
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const cached = localStorage.getItem(USER_STORAGE_KEY);
    return cached ? JSON.parse(cached) : null;
  });

  // SuperAdmin Secret PIN
  const [superAdminPin, setSuperAdminPin] = useState<string>(() => {
    return localStorage.getItem(SUPERADMIN_PIN_KEY) || SUPERADMIN_DEFAULT_PIN;
  });

  const updateSuperAdminPin = (newPin: string) => {
    const trimmed = newPin.trim();
    if (trimmed) {
      setSuperAdminPin(trimmed);
      localStorage.setItem(SUPERADMIN_PIN_KEY, trimmed);
    }
  };

  // Parent Linked Children (stored uniquely per parent email so new users are never linked to another student)
  const getParentLinksKey = (email?: string) => {
    return email ? `${PARENT_LINKS_KEY}_${email.trim().toLowerCase()}` : PARENT_LINKS_KEY;
  };

  const [linkedStudentIds, setLinkedStudentIds] = useState<string[]>(() => {
    try {
      const cachedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (cachedUser) {
        const user: AppUser = JSON.parse(cachedUser);
        if (user.role === 'parent') {
          const userSaved = localStorage.getItem(getParentLinksKey(user.email));
          if (userSaved) return JSON.parse(userSaved);
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const [activeStudentId, setActiveStudentId] = useState<string | null>(() => {
    return linkedStudentIds.length > 0 ? linkedStudentIds[0] : null;
  });

  // Sync to LocalStorage (Offline Cache)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY + '_schools', JSON.stringify(schools));
      localStorage.setItem(STORAGE_KEY + '_agents', JSON.stringify(agents));
      localStorage.setItem(STORAGE_KEY + '_classes', JSON.stringify(classes));
      localStorage.setItem(STORAGE_KEY + '_students', JSON.stringify(students));
      localStorage.setItem(STORAGE_KEY + '_fees', JSON.stringify(fees));
      localStorage.setItem(STORAGE_KEY + '_payments', JSON.stringify(payments));
      localStorage.setItem(STORAGE_KEY + '_attendance', JSON.stringify(attendance));
      localStorage.setItem(STORAGE_KEY + '_homeworks', JSON.stringify(homeworks));
      localStorage.setItem(STORAGE_KEY + '_conductReports', JSON.stringify(conductReports));
      localStorage.setItem(STORAGE_KEY + '_announcements', JSON.stringify(announcements));
      localStorage.setItem(STORAGE_KEY + '_events', JSON.stringify(events));
      setLastSyncTime(new Date().toLocaleTimeString('fr-FR'));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [schools, agents, classes, students, fees, payments, attendance, homeworks, conductReports, announcements, events]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
      if (currentUser.role === 'parent') {
        try {
          const userSaved = localStorage.getItem(getParentLinksKey(currentUser.email));
          const parsed = userSaved ? JSON.parse(userSaved) : [];
          setLinkedStudentIds(Array.isArray(parsed) ? parsed : []);
        } catch {
          setLinkedStudentIds([]);
        }
      } else {
        setLinkedStudentIds([]);
        setActiveStudentId(null);
      }
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
      setLinkedStudentIds([]);
      setActiveStudentId(null);
    }
  }, [currentUser?.email, currentUser?.role]);

  useEffect(() => {
    if (currentUser && currentUser.role === 'parent') {
      const userKey = getParentLinksKey(currentUser.email);
      localStorage.setItem(userKey, JSON.stringify(linkedStudentIds));
    }
    if (linkedStudentIds.length > 0 && (!activeStudentId || !linkedStudentIds.includes(activeStudentId))) {
      setActiveStudentId(linkedStudentIds[0]);
    } else if (linkedStudentIds.length === 0) {
      setActiveStudentId(null);
    }
  }, [linkedStudentIds, activeStudentId, currentUser?.email, currentUser?.role]);

  // Helper to inspect email privileges safely (does not leak email or passwords)
  const checkEmailAccountType = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { isStaffOrAdmin: false };
    }

    const isSuperAdmin =
      cleanEmail === SUPERADMIN_EMAIL ||
      cleanEmail === 'mughenyakavale@gmail.com' ||
      cleanEmail === 'mughenyakavale@gmail' ||
      cleanEmail === 'p9695009@gmail.com';

    if (isSuperAdmin) {
      return {
        isStaffOrAdmin: true,
        role: 'superadmin' as UserRole,
        roleLabel: 'Super Administrateur de la Plateforme',
      };
    }

    const matchedSchool = schools.find(
      (s) => s.adminEmail.toLowerCase() === cleanEmail || s.adminEmail.toLowerCase() === cleanEmail + '.com'
    );
    if (matchedSchool) {
      return {
        isStaffOrAdmin: true,
        role: 'school_admin' as UserRole,
        roleLabel: `Directeur d'établissement (${matchedSchool.name})`,
        schoolName: matchedSchool.name,
      };
    }

    const matchedAgent = agents.find((a) => a.email.toLowerCase() === cleanEmail && a.active);
    if (matchedAgent) {
      const school = schools.find((s) => s.id === matchedAgent.schoolId);
      const roleName =
        matchedAgent.roleType === 'surveillant'
          ? 'Surveillant Général'
          : matchedAgent.roleType === 'professeur'
          ? 'Professeur Titulaire'
          : 'Caissier';

      return {
        isStaffOrAdmin: true,
        role: 'agent' as UserRole,
        roleLabel: `${roleName} • ${school?.name || 'Établissement'}`,
        agentFunction: matchedAgent.roleType,
        schoolName: school?.name,
      };
    }

    return {
      isStaffOrAdmin: false,
      role: 'parent' as UserRole,
      roleLabel: "Espace Parent d'Élève",
    };
  };

  // Secure Login handler with verification
  const login = (
    rawEmail: string,
    password?: string,
    customName?: string,
    customAvatar?: string
  ): { success: boolean; message: string; role?: UserRole } => {
    const cleanEmail = rawEmail.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: 'Veuillez saisir votre adresse e-mail.' };
    }

    // 1. Check SuperAdmin
    const isSuperAdmin =
      cleanEmail === SUPERADMIN_EMAIL ||
      cleanEmail === 'mughenyakavale@gmail.com' ||
      cleanEmail === 'mughenyakavale@gmail' ||
      cleanEmail === 'p9695009@gmail.com';

    if (isSuperAdmin) {
      const trimmedPass = (password || '').trim();
      if (!trimmedPass || trimmedPass !== superAdminPin) {
        return {
          success: false,
          message: "Code de sécurité SuperAdmin incorrect. Accès non autorisé.",
        };
      }

      const user: AppUser = {
        email: cleanEmail,
        name: customName || 'Mughenya Kavale (SuperAdmin)',
        role: 'superadmin',
        avatar: customAvatar,
      };
      setCurrentUser(user);
      return { success: true, message: 'Connexion SuperAdmin autorisée.', role: 'superadmin' };
    }

    // 2. Check School Admin (Directeur)
    const matchedSchool = schools.find(
      (s) => s.adminEmail.toLowerCase() === cleanEmail || s.adminEmail.toLowerCase() === cleanEmail + '.com'
    );
    if (matchedSchool) {
      const requiredPass = matchedSchool.password || '1234';
      const trimmedPass = (password || '').trim();
      if (!trimmedPass || trimmedPass !== requiredPass) {
        return {
          success: false,
          message: `Mot de passe directeur incorrect pour ${matchedSchool.name}. Accès refusé.`,
        };
      }

      const user: AppUser = {
        email: cleanEmail,
        name: customName || matchedSchool.adminName,
        role: 'school_admin',
        schoolId: matchedSchool.id,
        avatar: customAvatar,
      };
      setCurrentUser(user);
      return { success: true, message: `Bienvenue, ${matchedSchool.adminName}`, role: 'school_admin' };
    }

    // 3. Check School Agent (Surveillant, Professeur, Caissier)
    const matchedAgent = agents.find((a) => a.email.toLowerCase() === cleanEmail && a.active);
    if (matchedAgent) {
      const requiredPass = matchedAgent.password || '1234';
      const trimmedPass = (password || '').trim();
      if (!trimmedPass || trimmedPass !== requiredPass) {
        return {
          success: false,
          message: `Mot de passe agent scolaire (${matchedAgent.roleType}) incorrect. Accès refusé.`,
        };
      }

      const user: AppUser = {
        email: cleanEmail,
        name: customName || matchedAgent.name,
        role: 'agent',
        schoolId: matchedAgent.schoolId,
        agentFunction: matchedAgent.roleType,
        avatar: customAvatar,
      };
      setCurrentUser(user);
      return { success: true, message: `Connexion agent (${matchedAgent.roleType}) réussie.`, role: 'agent' };
    }

    // 4. Default: Recognized as Parent
    // Normal parents have no administrative features.
    // They start clean and access their child's account by entering the child's ID (matricule).
    let existingLinked: string[] = [];
    try {
      const userSaved = localStorage.getItem(getParentLinksKey(cleanEmail));
      if (userSaved) {
        const parsed = JSON.parse(userSaved);
        if (Array.isArray(parsed)) existingLinked = parsed;
      }
    } catch {
      existingLinked = [];
    }

    setLinkedStudentIds(existingLinked);
    if (existingLinked.length > 0) {
      setActiveStudentId(existingLinked[0]);
    } else {
      setActiveStudentId(null);
    }

    const user: AppUser = {
      email: cleanEmail,
      name: customName || cleanEmail.split('@')[0].replace('.', ' ').toUpperCase(),
      role: 'parent',
      avatar: customAvatar,
    };
    setCurrentUser(user);
    return { success: true, message: 'Connexion Espace Parent réussie.', role: 'parent' };
  };

  const logout = () => {
    setCurrentUser(null);
    logoutFirebase().catch(() => {});
  };

  // Parent student linking by matricule
  const linkStudentByMatricule = (rawMatricule: string) => {
    const cleanMatricule = rawMatricule.trim().toUpperCase();
    if (!cleanMatricule) {
      return { success: false, message: "Veuillez saisir l'identifiant (matricule) de l'élève." };
    }

    const student = students.find((s) => s.matricule.toUpperCase() === cleanMatricule);
    if (!student) {
      return {
        success: false,
        message: `Aucun élève trouvé avec l'identifiant sécurisé "${cleanMatricule}". Vérifiez le code remis par l'école.`,
      };
    }

    if (linkedStudentIds.includes(student.id)) {
      setActiveStudentId(student.id);
      return {
        success: true,
        message: `L'élève ${student.firstName} ${student.lastName} est déjà lié à votre compte.`,
        student,
      };
    }

    setLinkedStudentIds((prev) => [...prev, student.id]);
    setActiveStudentId(student.id);
    return {
      success: true,
      message: `Élève ${student.firstName} ${student.lastName} (${student.className}) lié avec succès !`,
      student,
    };
  };

  const unlinkStudent = (id: string) => {
    setLinkedStudentIds((prev) => prev.filter((sId) => sId !== id));
  };

  // Financial Status calculation for student
  const getStudentFinancialStatus = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) {
      return {
        totalApplicableFees: 0,
        totalPaid: 0,
        remainingBalance: 0,
        isAtRiskOfRecovery: false,
        recoveryWarningDate: null,
        recoveryRequiredAmount: 0,
        nextInstallmentName: null,
        nextInstallmentDueDate: null,
        applicableFeeCategories: [],
        studentPayments: [],
      };
    }

    // Filter applicable fees:
    // Base tuition applies to all; Transport and Cantine apply if student has flag enabled
    const applicableFeeCategories = fees.filter((fee) => {
      if (fee.schoolId !== student.schoolId) return false;
      if (fee.type === 'tuition') return true;
      if (fee.type === 'transport' && student.hasTransport) return true;
      if (fee.type === 'cantine' && student.hasCantine) return true;
      if (student.customFeeIds && student.customFeeIds.includes(fee.id)) return true;
      return false;
    });

    const totalApplicableFees = applicableFeeCategories.reduce((sum, f) => sum + f.totalAmount, 0);

    const studentPayments = payments.filter((p) => p.studentId === studentId);
    const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0);
    const remainingBalance = Math.max(0, totalApplicableFees - totalPaid);

    // Evaluate Recovery Cutoff & Tranche thresholds
    // Prompt rule: "par exemple si l'ecole chasse un jour x tous ceux qui n'ont pas encore atteint Y somme,
    // tous ceux qui ont < y , auront le recouvrement (renvoie) marque sur le jour x"
    let isAtRiskOfRecovery = false;
    let recoveryWarningDate: string | null = null;
    let recoveryRequiredAmount = 0;
    let nextInstallmentName: string | null = null;
    let nextInstallmentDueDate: string | null = null;

    const tuitionFee = applicableFeeCategories.find((f) => f.type === 'tuition');
    if (tuitionFee && tuitionFee.installments.length > 0) {
      // Find the first installment where cumulative paid is insufficient
      for (const inst of tuitionFee.installments) {
        if (totalPaid < inst.minimumCumulativeRequired) {
          isAtRiskOfRecovery = true;
          recoveryWarningDate = inst.cutoffRecoveryDate;
          recoveryRequiredAmount = inst.minimumCumulativeRequired;
          nextInstallmentName = inst.name;
          nextInstallmentDueDate = inst.dueDate;
          break;
        }
      }
    }

    return {
      totalApplicableFees,
      totalPaid,
      remainingBalance,
      isAtRiskOfRecovery,
      recoveryWarningDate,
      recoveryRequiredAmount,
      nextInstallmentName,
      nextInstallmentDueDate,
      applicableFeeCategories,
      studentPayments,
    };
  };

  // SuperAdmin Operations
  const createSchool = (data: {
    name: string;
    adminEmail: string;
    adminName: string;
    password?: string;
    phone: string;
    address: string;
    currency?: string;
  }) => {
    const newSchool: School = {
      id: `school-${Date.now()}`,
      name: data.name,
      adminEmail: data.adminEmail.trim().toLowerCase(),
      adminName: data.adminName,
      password: data.password || '1234',
      phone: data.phone,
      address: data.address,
      currency: data.currency || '$',
      createdAt: new Date().toISOString().split('T')[0],
      active: true,
    };
    setSchools((prev) => [...prev, newSchool]);

    // Also seed default tuition fee for this new school
    const defaultTuition: FeeCategory = {
      id: `fee-tuition-${Date.now()}`,
      schoolId: newSchool.id,
      name: 'Frais Scolaires Annuels (Minerval)',
      type: 'tuition',
      totalAmount: 450,
      isOptional: false,
      installments: [
        {
          id: `inst-1-${Date.now()}`,
          name: '1ère Tranche',
          amount: 150,
          dueDate: '2026-10-15',
          cutoffRecoveryDate: '2026-10-25',
          minimumCumulativeRequired: 150,
        },
        {
          id: `inst-2-${Date.now()}`,
          name: '2ème Tranche',
          amount: 150,
          dueDate: '2026-12-15',
          cutoffRecoveryDate: '2026-12-28',
          minimumCumulativeRequired: 300,
        },
        {
          id: `inst-3-${Date.now()}`,
          name: '3ème Tranche',
          amount: 150,
          dueDate: '2027-02-28',
          cutoffRecoveryDate: '2027-03-10',
          minimumCumulativeRequired: 450,
        },
      ],
    };
    setFees((prev) => [...prev, defaultTuition]);
  };

  const toggleSchoolStatus = (schoolId: string) => {
    setSchools((prev) =>
      prev.map((s) => (s.id === schoolId ? { ...s, active: !s.active } : s))
    );
  };

  // School Admin Operations
  const createAgent = (data: Omit<SchoolAgent, 'id' | 'active'>) => {
    const newAgent: SchoolAgent = {
      ...data,
      email: data.email.trim().toLowerCase(),
      id: `agent-${Date.now()}`,
      active: true,
    };
    setAgents((prev) => [...prev, newAgent]);
  };

  const updateAgent = (agentId: string, updates: Partial<SchoolAgent>) => {
    setAgents((prev) => prev.map((a) => (a.id === agentId ? { ...a, ...updates } : a)));
  };

  const deleteAgent = (agentId: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== agentId));
  };

  const createClass = (data: Omit<ClassRoom, 'id' | 'studentCount'>) => {
    const newClass: ClassRoom = {
      ...data,
      id: `class-${Date.now()}`,
      studentCount: 0,
    };
    setClasses((prev) => [...prev, newClass]);
  };

  const createStudent = (data: Omit<Student, 'id' | 'matricule' | 'createdAt'>): Student => {
    // Generate secure matricule: e.g., PE-HORZ-2026-X89B
    const school = schools.find((s) => s.id === data.schoolId);
    const prefix = school ? school.name.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() : 'SCH';
    const randCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const matricule = `PE-${prefix}-2026-${randCode}`;

    const newStudent: Student = {
      ...data,
      id: `stud-${Date.now()}`,
      matricule,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setStudents((prev) => [...prev, newStudent]);
    // update class count
    setClasses((prev) =>
      prev.map((c) => (c.id === data.classId ? { ...c, studentCount: (c.studentCount || 0) + 1 } : c))
    );

    return newStudent;
  };

  const updateStudent = (studentId: string, updates: Partial<Student>) => {
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, ...updates } : s)));
  };

  const deleteStudent = (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
  };

  const createOrUpdateFee = (fee: FeeCategory) => {
    setFees((prev) => {
      const idx = prev.findIndex((f) => f.id === fee.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = fee;
        return copy;
      }
      return [...prev, fee];
    });
  };

  const deleteFee = (feeId: string) => {
    setFees((prev) => prev.filter((f) => f.id !== feeId));
  };

  const addAnnouncement = (data: Omit<Announcement, 'id' | 'publishDate'>) => {
    const newAnn: Announcement = {
      ...data,
      id: `ann-${Date.now()}`,
      publishDate: new Date().toISOString().split('T')[0],
    };
    setAnnouncements((prev) => [newAnn, ...prev]);
  };

  const addEvent = (data: Omit<SchoolEvent, 'id'>) => {
    const newEv: SchoolEvent = {
      ...data,
      id: `ev-${Date.now()}`,
    };
    setEvents((prev) => [...prev, newEv]);
  };

  // Agent Operations: Surveillant Fast Attendance
  // "dans un classe il suffit de selectionner seulements les absents, de telle sorte que le systeme envoie les absences aux concernes et tous les autres seront automatiquement presents"
  const recordClassAttendance = (
    classId: string,
    date: string,
    absentList: { studentId: string; reason?: string }[],
    lateList: { studentId: string; reason?: string }[] = []
  ) => {
    const classStudents = students.filter((s) => s.classId === classId);
    const recordedBy = currentUser?.email || 'agent';

    const absentIds = new Set(absentList.map((a) => a.studentId));
    const lateIds = new Set(lateList.map((l) => l.studentId));

    const newRecords: AttendanceRecord[] = classStudents.map((stud) => {
      let status: 'present' | 'absent' | 'late' = 'present';
      let reason: string | undefined = undefined;

      if (absentIds.has(stud.id)) {
        status = 'absent';
        reason = absentList.find((a) => a.studentId === stud.id)?.reason || 'Absence signalée par le surveillant';
      } else if (lateIds.has(stud.id)) {
        status = 'late';
        reason = lateList.find((l) => l.studentId === stud.id)?.reason || 'Retard signalé';
      }

      return {
        id: `att-${Date.now()}-${stud.id}`,
        schoolId: stud.schoolId,
        classId,
        date,
        studentId: stud.id,
        studentName: `${stud.firstName} ${stud.lastName}`,
        status,
        reason,
        recordedByAgentEmail: recordedBy,
        recordedAt: new Date().toISOString(),
      };
    });

    // Remove old records for this class & date, then add new
    setAttendance((prev) => [
      ...prev.filter((a) => !(a.classId === classId && a.date === date)),
      ...newRecords,
    ]);
  };

  // Professeur operations
  const addHomework = (data: Omit<Homework, 'id' | 'createdAt'>) => {
    const newHw: Homework = {
      ...data,
      id: `hw-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setHomeworks((prev) => [newHw, ...prev]);
  };

  const deleteHomework = (id: string) => {
    setHomeworks((prev) => prev.filter((h) => h.id !== id));
  };

  const addConductReport = (data: Omit<ConductReport, 'id'>) => {
    const newReport: ConductReport = {
      ...data,
      id: `cond-${Date.now()}`,
    };
    setConductReports((prev) => [newReport, ...prev]);
  };

  // Caissier operations
  const recordPayment = (data: Omit<PaymentRecord, 'id' | 'referenceNumber'>): PaymentRecord => {
    const randRef = `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPayment: PaymentRecord = {
      ...data,
      id: `pay-${Date.now()}`,
      referenceNumber: randRef,
    };
    setPayments((prev) => [newPayment, ...prev]);
    return newPayment;
  };

  // Reset to initial demo data
  const resetAllData = () => {
    setSchools(INITIAL_SCHOOLS);
    setAgents(INITIAL_AGENTS);
    setClasses(INITIAL_CLASSES);
    setStudents(INITIAL_STUDENTS);
    setFees(INITIAL_FEES);
    setPayments(INITIAL_PAYMENTS);
    setAttendance(INITIAL_ATTENDANCE);
    setHomeworks(INITIAL_HOMEWORK);
    setConductReports(INITIAL_CONDUCT);
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
    setEvents(INITIAL_EVENTS);
    setLinkedStudentIds([]);
    setActiveStudentId(null);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        login,
        logout,
        checkEmailAccountType,
        superAdminPin,
        updateSuperAdminPin,
        isOnline,
        lastSyncTime,
        schools,
        agents,
        classes,
        students,
        fees,
        payments,
        attendance,
        homeworks,
        conductReports,
        announcements,
        events,
        linkedStudentIds,
        activeStudentId,
        linkStudentByMatricule,
        setActiveStudentId,
        unlinkStudent,
        getStudentFinancialStatus,
        createSchool,
        toggleSchoolStatus,
        createAgent,
        updateAgent,
        deleteAgent,
        createClass,
        createStudent,
        updateStudent,
        deleteStudent,
        createOrUpdateFee,
        deleteFee,
        addAnnouncement,
        addEvent,
        recordClassAttendance,
        addHomework,
        deleteHomework,
        addConductReport,
        recordPayment,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
