import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  School as SchoolIcon,
  Users,
  GraduationCap,
  CreditCard,
  Calendar,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  ShieldCheck,
  UserCheck,
  Megaphone,
  QrCode,
  Copy,
  ExternalLink,
  Lock,
  Building2,
} from 'lucide-react';
import { AgentFunction, FeeCategory, Student } from '../../types';

export const SchoolAdminView: React.FC = () => {
  const {
    currentUser,
    schools,
    agents,
    classes,
    students,
    fees,
    payments,
    announcements,
    events,
    createAgent,
    deleteAgent,
    createClass,
    createStudent,
    deleteStudent,
    createOrUpdateFee,
    deleteFee,
    addAnnouncement,
    addEvent,
    getStudentFinancialStatus,
  } = useApp();

  const currentSchool = schools.find((s) => s.id === currentUser?.schoolId) || schools[0];
  const schoolCurrency = currentSchool?.currency || '$';

  // Tabs
  type TabKey = 'overview' | 'agents' | 'classes_students' | 'fees_recovery' | 'announcements';
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Modal controls
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [selectedStudentForMatricule, setSelectedStudentForMatricule] = useState<Student | null>(null);
  const [copiedMatricule, setCopiedMatricule] = useState<string | null>(null);

  // Filters & Search
  const [studentSearch, setStudentSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [financialFilter, setFinancialFilter] = useState<'all' | 'at_risk' | 'safe'>('all');

  // Agent form state
  const [agentName, setAgentName] = useState('');
  const [agentEmail, setAgentEmail] = useState('');
  const [agentPassword, setAgentPassword] = useState('1234');
  const [agentRole, setAgentRole] = useState<AgentFunction>('surveillant');
  const [agentPhone, setAgentPhone] = useState('');
  const [agentAssignedClass, setAgentAssignedClass] = useState('');

  // Class form state
  const [className, setClassName] = useState('');
  const [classLevel, setClassLevel] = useState('Secondaire');
  const [classTitulaireAgentId, setClassTitulaireAgentId] = useState('');

  // Student form state
  const [stFirstName, setStFirstName] = useState('');
  const [stLastName, setStLastName] = useState('');
  const [stGender, setStGender] = useState<'M' | 'F'>('M');
  const [stClassId, setStClassId] = useState('');
  const [stParentName, setStParentName] = useState('');
  const [stParentEmail, setStParentEmail] = useState('');
  const [stParentPhone, setStParentPhone] = useState('');
  const [stHasTransport, setStHasTransport] = useState(false);
  const [stHasCantine, setStHasCantine] = useState(false);

  // Fee form state
  const [feeName, setFeeName] = useState('');
  const [feeType, setFeeType] = useState<'tuition' | 'transport' | 'cantine' | 'special'>('special');
  const [feeTotalAmount, setFeeTotalAmount] = useState<number>(50);
  const [feeIsOptional, setFeeIsOptional] = useState(false);
  const [installment1Amount, setInstallment1Amount] = useState<number>(50);
  const [installment1DueDate, setInstallment1DueDate] = useState('2026-11-15');
  const [installment1Cutoff, setInstallment1Cutoff] = useState('2026-11-25');

  // Announcement form state
  const [annTitle, setAnnTitle] = useState('');
  const [annCategory, setAnnCategory] = useState<'Général' | 'Urgent' | 'Pédagogique' | 'Financier'>('Financier');
  const [annContent, setAnnContent] = useState('');

  // School specific data
  const schoolAgents = agents.filter((a) => a.schoolId === currentSchool.id);
  const schoolClasses = classes.filter((c) => c.schoolId === currentSchool.id);
  const schoolStudents = students.filter((s) => s.schoolId === currentSchool.id);
  const schoolFees = fees.filter((f) => f.schoolId === currentSchool.id);
  const schoolAnnouncements = announcements.filter((a) => a.schoolId === currentSchool.id);

  // Financial Stats for School
  let totalSchoolExpected = 0;
  let totalSchoolCollected = 0;
  let totalAtRiskOfRecovery = 0;

  schoolStudents.forEach((st) => {
    const fin = getStudentFinancialStatus(st.id);
    totalSchoolExpected += fin.totalApplicableFees;
    totalSchoolCollected += fin.totalPaid;
    if (fin.isAtRiskOfRecovery) {
      totalAtRiskOfRecovery += 1;
    }
  });

  const handleCreateAgentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentName || !agentEmail) return;

    createAgent({
      schoolId: currentSchool.id,
      name: agentName.trim(),
      email: agentEmail.trim().toLowerCase(),
      roleType: agentRole,
      password: agentPassword.trim() || '1234',
      phone: agentPhone.trim(),
      assignedClassIds: agentAssignedClass ? [agentAssignedClass] : [],
      isTitulaire: agentRole === 'professeur' && !!agentAssignedClass,
    });

    setAgentName('');
    setAgentEmail('');
    setAgentPassword('1234');
    setAgentPhone('');
    setAgentAssignedClass('');
    setShowAgentModal(false);
  };

  const handleCreateClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className) return;

    const assignedAgent = schoolAgents.find((a) => a.id === classTitulaireAgentId);

    createClass({
      schoolId: currentSchool.id,
      name: className.trim(),
      level: classLevel,
      titulaireAgentId: classTitulaireAgentId || undefined,
      titulaireName: assignedAgent ? assignedAgent.name : undefined,
    });

    setClassName('');
    setClassTitulaireAgentId('');
    setShowClassModal(false);
  };

  const handleCreateStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stFirstName || !stLastName || !stClassId) return;

    const chosenClass = schoolClasses.find((c) => c.id === stClassId);

    const newStudent = createStudent({
      schoolId: currentSchool.id,
      classId: stClassId,
      className: chosenClass ? chosenClass.name : 'Classe',
      firstName: stFirstName.trim(),
      lastName: stLastName.trim(),
      gender: stGender,
      parentName: stParentName.trim() || 'Parent Responsable',
      parentEmail: stParentEmail.trim().toLowerCase(),
      parentPhone: stParentPhone.trim(),
      hasTransport: stHasTransport,
      hasCantine: stHasCantine,
      hasInternat: false,
      customFeeIds: [],
    });

    setSelectedStudentForMatricule(newStudent);
    setStFirstName('');
    setStLastName('');
    setStParentName('');
    setStParentEmail('');
    setStParentPhone('');
    setStHasTransport(false);
    setStHasCantine(false);
    setShowStudentModal(false);
  };

  const handleCreateFeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeName || feeTotalAmount <= 0) return;

    const newFee: FeeCategory = {
      id: `fee-${Date.now()}`,
      schoolId: currentSchool.id,
      name: feeName.trim(),
      type: feeType,
      totalAmount: Number(feeTotalAmount),
      isOptional: feeIsOptional,
      installments: [
        {
          id: `inst-${Date.now()}`,
          name: 'Tranche Principale',
          amount: Number(installment1Amount),
          dueDate: installment1DueDate,
          cutoffRecoveryDate: installment1Cutoff,
          minimumCumulativeRequired: Number(installment1Amount),
        },
      ],
    };

    createOrUpdateFee(newFee);
    setFeeName('');
    setFeeTotalAmount(50);
    setShowFeeModal(false);
  };

  const handleCreateAnnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;

    addAnnouncement({
      schoolId: currentSchool.id,
      title: annTitle.trim(),
      category: annCategory,
      content: annContent.trim(),
      author: `Direction - ${currentSchool.adminName}`,
    });

    setAnnTitle('');
    setAnnContent('');
    setShowAnnModal(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMatricule(text);
    setTimeout(() => setCopiedMatricule(null), 2500);
  };

  return (
    <div className="space-y-6 pb-24 sm:pb-8">
      {/* School Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 backdrop-blur-md border border-blue-400/30 flex items-center justify-center text-blue-300">
              <SchoolIcon className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  Administration Établissement
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
                {currentSchool.name}
              </h1>
              <p className="text-sm text-blue-200 mt-1">
                Directeur : <strong>{currentSchool.adminName}</strong> ({currentSchool.adminEmail})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setShowStudentModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Inscrire un Élève</span>
            </button>
            <button
              onClick={() => setShowAgentModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 transition"
            >
              <Users className="w-4 h-4" />
              <span>Ajouter un Agent</span>
            </button>
          </div>
        </div>

        {/* Global Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-blue-500/20">
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3.5 border border-white/10">
            <div className="text-xs text-blue-200 font-medium">Élèves Inscrits</div>
            <div className="text-2xl font-bold mt-0.5">{schoolStudents.length}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3.5 border border-white/10">
            <div className="text-xs text-blue-200 font-medium">Agents & Rôles</div>
            <div className="text-2xl font-bold mt-0.5">{schoolAgents.length}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3.5 border border-white/10">
            <div className="text-xs text-blue-200 font-medium">Fonds Encaissés</div>
            <div className="text-2xl font-bold mt-0.5 text-emerald-400">
              {totalSchoolCollected.toLocaleString()} {schoolCurrency}
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3.5 border border-white/10">
            <div className="text-xs text-blue-200 font-medium">Élèves sous Seuil (Avis de renvoi)</div>
            <div className={`text-2xl font-bold mt-0.5 ${totalAtRiskOfRecovery > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
              {totalAtRiskOfRecovery}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Desktop & Tablet) */}
      <div className="hidden sm:flex border-b border-slate-200 gap-2 overflow-x-auto bg-white p-2 rounded-xl shadow-2xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Vue d'Ensemble & Indicateurs
        </button>

        <button
          onClick={() => setActiveTab('agents')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'agents'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Agents & Permissions ({schoolAgents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('classes_students')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'classes_students'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Classes & Élèves ({schoolStudents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('fees_recovery')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'fees_recovery'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Frais, Tranches & Recouvrements</span>
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'announcements'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>Communiqués & Agenda</span>
        </button>
      </div>

      {/* Mobile Bottom Navigation Bar (Flutter / Native App Style for School Admin) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex justify-around items-center safe-bottom shadow-xl">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer ${
            activeTab === 'overview' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Building2 className={`w-5 h-5 ${activeTab === 'overview' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Aperçu</span>
        </button>

        <button
          onClick={() => setActiveTab('classes_students')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer ${
            activeTab === 'classes_students' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <GraduationCap className={`w-5 h-5 ${activeTab === 'classes_students' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Élèves</span>
        </button>

        <button
          onClick={() => setActiveTab('agents')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer ${
            activeTab === 'agents' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <UserCheck className={`w-5 h-5 ${activeTab === 'agents' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Agents</span>
        </button>

        <button
          onClick={() => setActiveTab('fees_recovery')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer ${
            activeTab === 'fees_recovery' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <CreditCard className={`w-5 h-5 ${activeTab === 'fees_recovery' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Finances</span>
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer ${
            activeTab === 'announcements' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Megaphone className={`w-5 h-5 ${activeTab === 'announcements' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Avis</span>
        </button>
      </nav>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recovery and Warning Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Suivi des Seuils de Recouvrement (Renvoi Scolaire)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Élèves ayant payé moins que le seuil de recouvrement exigé à l'échéance
                    </p>
                  </div>
                </div>

                <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
                  {totalAtRiskOfRecovery} élève(s) concerné(s)
                </span>
              </div>

              {totalAtRiskOfRecovery === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700">Tous les élèves sont à jour avec les seuils actuels !</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {schoolStudents.map((st) => {
                    const fin = getStudentFinancialStatus(st.id);
                    if (!fin.isAtRiskOfRecovery) return null;

                    return (
                      <div key={st.id} className="py-3.5 flex items-center justify-between gap-4">
                        <div>
                          <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                            <span>{st.firstName} {st.lastName}</span>
                            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm">
                              {st.className}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Parent : {st.parentName} ({st.parentPhone || 'Aucun numéro'}) | Matricule :{' '}
                            <code className="bg-slate-100 px-1 rounded text-indigo-600 font-semibold">{st.matricule}</code>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-bold text-rose-600">
                            Payé : {fin.totalPaid} {schoolCurrency} / {fin.recoveryRequiredAmount} {schoolCurrency} requis
                          </div>
                          <div className="text-[11px] text-amber-700 mt-0.5">
                            Date de recouvrement : <strong>{fin.recoveryWarningDate}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Classes Overview */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base text-slate-900">Classes Actives & Professeurs Titulaires</h3>
                <button
                  onClick={() => setShowClassModal(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Nouvelle classe
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {schoolClasses.map((c) => {
                  const classStudents = schoolStudents.filter((s) => s.classId === c.id);
                  return (
                    <div key={c.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{c.name}</span>
                        <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          {classStudents.length} élèves
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-2">
                        Titulaire : <strong>{c.titulaireName || 'Non assigné'}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Quick Agent Roster & Fast Switch */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base text-slate-900">Personnel & Agents</h3>
                <button
                  onClick={() => setShowAgentModal(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Ajouter
                </button>
              </div>

              <div className="space-y-3">
                {schoolAgents.map((ag) => (
                  <div key={ag.id} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-900">{ag.name}</div>
                      <div className="text-[11px] text-slate-500">{ag.email}</div>
                      <span className="inline-block mt-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {ag.roleType}
                      </span>
                    </div>

                    <div className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-slate-500" />
                      <span>{ag.password || '1234'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 p-6 text-indigo-900">
              <h4 className="font-bold text-sm">Système de Matricules Sécurisés</h4>
              <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
                Chaque élève créé reçoit automatiquement un identifiant sécurisé unique.
                Les parents peuvent l'utiliser pour se connecter et suivre leur enfant sans mot de passe complexe.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Agents Management */}
      {activeTab === 'agents' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-slate-900">Agents & Fonctions de l'École</h3>
              <p className="text-xs text-slate-500">
                L'administrateur crée les comptes agents (Surveillants pour les présences, Professeurs pour devoirs/conduite, Caissiers pour paiements).
              </p>
            </div>
            <button
              onClick={() => setShowAgentModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Créer un Nouvel Agent</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nom de l'Agent</th>
                  <th className="py-3 px-4">Email de Connexion</th>
                  <th className="py-3 px-4">Fonction / Rôle</th>
                  <th className="py-3 px-4">Affectation</th>
                  <th className="py-3 px-4">Code d'accès</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schoolAgents.map((ag) => (
                  <tr key={ag.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{ag.name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">{ag.email}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full font-semibold uppercase text-[10px] ${
                        ag.roleType === 'surveillant'
                          ? 'bg-amber-100 text-amber-800'
                          : ag.roleType === 'professeur'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-cyan-100 text-cyan-800'
                      }`}>
                        {ag.roleType === 'surveillant'
                          ? 'Surveillant (Présences)'
                          : ag.roleType === 'professeur'
                          ? 'Professeur / Titulaire'
                          : 'Caissier (Paiements)'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {ag.isTitulaire ? (
                        <span className="font-semibold text-emerald-700">Titulaire de classe</span>
                      ) : (
                        'Général'
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 font-mono text-xs px-2 py-0.5 rounded border border-slate-200 font-bold">
                        <Lock className="w-3 h-3 text-slate-500" />
                        {ag.password || '1234'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => deleteAgent(ag.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Supprimer l'agent"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Classes & Students Management */}
      {activeTab === 'classes_students' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Effectifs des Élèves & Classes</h3>
                <p className="text-xs text-slate-500">
                  Visualisez les matricules sécurisés créés pour chaque élève et partagez-les aux parents.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowClassModal(true)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-300 transition"
                >
                  <Plus className="w-3.5 h-3.5 inline mr-1" /> Créer une Classe
                </button>
                <button
                  onClick={() => setShowStudentModal(true)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5 inline mr-1" /> Inscrire un Élève
                </button>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Recherche par nom, prénom ou matricule..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Toutes les classes ({schoolClasses.length})</option>
                  {schoolClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={financialFilter}
                  onChange={(e) => setFinancialFilter(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tous statuts financiers</option>
                  <option value="at_risk">Élèves sous seuil de renvoi</option>
                  <option value="safe">Élèves en règle</option>
                </select>
              </div>
            </div>

            {/* Table of Students */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Élève</th>
                    <th className="py-3 px-4">Matricule Sécurisé (ID)</th>
                    <th className="py-3 px-4">Classe</th>
                    <th className="py-3 px-4">Parent & Contact</th>
                    <th className="py-3 px-4">Options (Transport/Cantine)</th>
                    <th className="py-3 px-4">Statut Financier</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schoolStudents
                    .filter((st) => {
                      const matchSearch =
                        st.firstName.toLowerCase().includes(studentSearch.toLowerCase()) ||
                        st.lastName.toLowerCase().includes(studentSearch.toLowerCase()) ||
                        st.matricule.toLowerCase().includes(studentSearch.toLowerCase());
                      const matchClass = classFilter === 'all' || st.classId === classFilter;
                      const fin = getStudentFinancialStatus(st.id);
                      const matchFin =
                        financialFilter === 'all' ||
                        (financialFilter === 'at_risk' && fin.isAtRiskOfRecovery) ||
                        (financialFilter === 'safe' && !fin.isAtRiskOfRecovery);
                      return matchSearch && matchClass && matchFin;
                    })
                    .map((st) => {
                      const fin = getStudentFinancialStatus(st.id);
                      return (
                        <tr key={st.id} className="hover:bg-slate-50/70">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">
                              {st.firstName} {st.lastName}
                            </div>
                            <div className="text-[10px] text-slate-400">Genre : {st.gender}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <code className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-mono font-bold text-xs border border-indigo-200">
                                {st.matricule}
                              </code>
                              <button
                                onClick={() => copyToClipboard(st.matricule)}
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded transition"
                                title="Copier le matricule"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {copiedMatricule === st.matricule && (
                              <span className="text-[10px] text-emerald-600 font-semibold">Copié !</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">{st.className}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-800">{st.parentName}</div>
                            <div className="text-[11px] text-slate-500">{st.parentEmail || st.parentPhone || 'Non renseigné'}</div>
                          </td>
                          <td className="py-3.5 px-4 space-x-1">
                            {st.hasTransport && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-200">
                                Transport
                              </span>
                            )}
                            {st.hasCantine && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold border border-amber-200">
                                Cantine
                              </span>
                            )}
                            {!st.hasTransport && !st.hasCantine && (
                              <span className="text-[11px] text-slate-400">Standard</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {fin.isAtRiskOfRecovery ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                                <AlertTriangle className="w-3 h-3" /> Sous seuil ({fin.totalPaid}/{fin.recoveryRequiredAmount} {schoolCurrency})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> En règle ({fin.totalPaid} {schoolCurrency})
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setSelectedStudentForMatricule(st)}
                              className="px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 mr-2"
                              title="Voir la fiche matricule parent"
                            >
                              Fiche ID
                            </button>
                            <button
                              onClick={() => deleteStudent(st.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            >
                              <Trash2 className="w-4 h-4 inline" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Fees, Tranches & Recovery Configuration */}
      {activeTab === 'fees_recovery' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Structure des Frais Scolaires & Dates de Recouvrement</h3>
                <p className="text-xs text-slate-500">
                  Définissez le minerval de base, les tranches avec dates butoirs de recouvrement/renvoi, et les frais additionnels (transport, cantine).
                </p>
              </div>
              <button
                onClick={() => setShowFeeModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter une Catégorie de Frais</span>
              </button>
            </div>

            {/* Fees list */}
            <div className="space-y-4">
              {schoolFees.map((fee) => (
                <div key={fee.id} className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base text-slate-900">{fee.name}</h4>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            fee.isOptional ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {fee.isOptional ? 'Optionnel / Abonnement' : 'Obligatoire (Tous)'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Montant total annuel : <strong className="text-slate-900">{fee.totalAmount} {schoolCurrency}</strong>
                        </p>
                      </div>
                    </div>

                    {fee.type !== 'tuition' && (
                      <button
                        onClick={() => deleteFee(fee.id)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 self-end sm:self-auto"
                      >
                        Supprimer ce frais
                      </button>
                    )}
                  </div>

                  {/* Tranches details */}
                  <div className="bg-white rounded-lg p-3 border border-slate-200 overflow-x-auto">
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Échéancier des Tranches & Règles de Recouvrement (Renvoi)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {fee.installments.map((inst, i) => (
                        <div key={inst.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                          <div className="font-bold text-xs text-indigo-900">{inst.name}</div>
                          <div className="text-sm font-bold text-slate-900 mt-1">
                            {inst.amount} {schoolCurrency}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">
                            Date limite normale : <strong>{inst.dueDate}</strong>
                          </div>
                          <div className="text-[11px] text-rose-700 font-semibold mt-1 bg-rose-50 p-1.5 rounded border border-rose-200">
                            Jour de renvoi : {inst.cutoffRecoveryDate}
                            <div className="text-[10px] text-rose-600 font-normal">
                              Seuil requis : &ge; {inst.minimumCumulativeRequired} {schoolCurrency}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Announcements & Agenda */}
      {activeTab === 'announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-900">Communiqués Officiels aux Parents</h3>
              <button
                onClick={() => setShowAnnModal(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Publier un communiqué
              </button>
            </div>

            <div className="space-y-4">
              {schoolAnnouncements.map((ann) => (
                <div key={ann.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{ann.title}</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {ann.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{ann.content}</p>
                  <div className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
                    <span>Par : {ann.author}</span>
                    <span>Date : {ann.publishDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="font-bold text-base text-slate-900 mb-4">Événements & Dates Clés</h3>
            <div className="space-y-3">
              {events
                .filter((e) => e.schoolId === currentSchool.id)
                .map((ev) => (
                  <div key={ev.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{ev.title}</span>
                      <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">
                        {ev.category}
                      </span>
                    </div>
                    <div className="text-xs text-indigo-600 font-semibold mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{ev.date}</span>
                    </div>
                    {ev.description && (
                      <p className="text-[11px] text-slate-500 mt-1">{ev.description}</p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Agent */}
      {showAgentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-5 text-white">
              <h3 className="text-lg font-bold">Ajouter un Compte Agent</h3>
              <p className="text-xs text-blue-200 mt-0.5">
                Attribuez un rôle opérationnel pour cette école.
              </p>
            </div>

            <form onSubmit={handleCreateAgentSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nom Complet de l'Agent *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Paul Mukendi"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email de Connexion *
                </label>
                <input
                  type="email"
                  required
                  placeholder="agent@gmail.com"
                  value={agentEmail}
                  onChange={(e) => setAgentEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mot de Passe / Code d'Accès de l'Agent *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Code d'accès sécurisé"
                    value={agentPassword}
                    onChange={(e) => setAgentPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  L'agent devra saisir ce code lors de sa connexion pour accéder à ses fonctions.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Fonction / Mission *
                </label>
                <select
                  value={agentRole}
                  onChange={(e) => setAgentRole(e.target.value as AgentFunction)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="surveillant">Surveillant (Gestion express des présences/absences)</option>
                  <option value="professeur">Professeur / Enseignant (Devoirs, conduite, titulaire)</option>
                  <option value="caissier">Caissier / Comptable (Encaissement et reçus de paiement)</option>
                </select>
              </div>

              {agentRole === 'professeur' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Titulaire de la classe (Optionnel)
                  </label>
                  <select
                    value={agentAssignedClass}
                    onChange={(e) => setAgentAssignedClass(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Aucune classe titulaire attitrée</option>
                    {schoolClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Numéro de Téléphone
                </label>
                <input
                  type="text"
                  placeholder="+243 00 000 0000"
                  value={agentPhone}
                  onChange={(e) => setAgentPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAgentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Enregistrer l'agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Class */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-5 text-white">
              <h3 className="text-lg font-bold">Créer une Nouvelle Classe</h3>
              <p className="text-xs text-blue-200 mt-0.5">
                Organisez les sections et associez un professeur titulaire.
              </p>
            </div>

            <form onSubmit={handleCreateClassSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nom de la Classe *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: 4ème Scientifique B"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Niveau Scolaire
                </label>
                <select
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Maternelle">Maternelle</option>
                  <option value="Primaire">Primaire</option>
                  <option value="Secondaire">Secondaire</option>
                  <option value="Humanités">Humanités</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Professeur Titulaire (Agent)
                </label>
                <select
                  value={classTitulaireAgentId}
                  onChange={(e) => setClassTitulaireAgentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Aucun titulaire assigné</option>
                  {schoolAgents
                    .filter((a) => a.roleType === 'professeur')
                    .map((prof) => (
                      <option key={prof.id} value={prof.id}>
                        {prof.name} ({prof.email})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Créer la classe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Enroll Student */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-5 text-white">
              <h3 className="text-lg font-bold">Inscrire un Nouvel Élève</h3>
              <p className="text-xs text-blue-200 mt-0.5">
                Un matricule sécurisé unique sera automatiquement généré pour le parent.
              </p>
            </div>

            <form onSubmit={handleCreateStudentSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Jonathan"
                    value={stFirstName}
                    onChange={(e) => setStFirstName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nom de Famille *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Kalala"
                    value={stLastName}
                    onChange={(e) => setStLastName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Genre
                  </label>
                  <select
                    value={stGender}
                    onChange={(e) => setStGender(e.target.value as 'M' | 'F')}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="M">Masculin (M)</option>
                    <option value="F">Féminin (F)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Classe *
                  </label>
                  <select
                    required
                    value={stClassId}
                    onChange={(e) => setStClassId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner une classe</option>
                    {schoolClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Informations du Parent
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nom complet du parent (ex: M. & Mme Kalala)"
                    value={stParentName}
                    onChange={(e) => setStParentName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="email"
                      placeholder="Email du parent"
                      value={stParentEmail}
                      onChange={(e) => setStParentEmail(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                      type="text"
                      placeholder="Téléphone du parent"
                      value={stParentPhone}
                      onChange={(e) => setStParentPhone(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Abonnements et Options Spécifiques
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={stHasTransport}
                      onChange={(e) => setStHasTransport(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Transport Scolaire (+45 $)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={stHasCantine}
                      onChange={(e) => setStHasCantine(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Cantine Scolaire (+60 $)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Inscrire et générer matricule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Fee Category */}
      {showFeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-5 text-white">
              <h3 className="text-lg font-bold">Nouvelle Catégorie de Frais</h3>
              <p className="text-xs text-blue-200 mt-0.5">
                Créez des frais personnalisés (Travaux pratiques, assurance, etc.) avec date de recouvrement.
              </p>
            </div>

            <form onSubmit={handleCreateFeeSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Intitulé du Frais *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Travaux Pratiques Informatique"
                  value={feeName}
                  onChange={(e) => setFeeName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Montant Total ({schoolCurrency}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={feeTotalAmount}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFeeTotalAmount(val);
                      setInstallment1Amount(val);
                    }}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nature
                  </label>
                  <select
                    value={feeIsOptional ? 'optional' : 'mandatory'}
                    onChange={(e) => setFeeIsOptional(e.target.value === 'optional')}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="mandatory">Obligatoire pour tous</option>
                    <option value="optional">Optionnel / Par abonnement</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Paramètres de Recouvrement
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Date limite paiement
                    </label>
                    <input
                      type="date"
                      value={installment1DueDate}
                      onChange={(e) => setInstallment1DueDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-rose-700 mb-1">
                      Jour de Renvoi / Recouvrement
                    </label>
                    <input
                      type="date"
                      value={installment1Cutoff}
                      onChange={(e) => setInstallment1Cutoff(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-rose-50 border border-rose-300 rounded-lg text-rose-900"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFeeModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Enregistrer ce frais
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Announcement */}
      {showAnnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-5 text-white">
              <h3 className="text-lg font-bold">Publier un Communiqué</h3>
              <p className="text-xs text-blue-200 mt-0.5">
                Sera immédiatement affiché sur l'espace de tous les parents.
              </p>
            </div>

            <form onSubmit={handleCreateAnnSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Titre du Communiqué *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Rappel échéance 1ère tranche"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Catégorie
                </label>
                <select
                  value={annCategory}
                  onChange={(e) => setAnnCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Financier">Financier / Recouvrement</option>
                  <option value="Général">Général</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Pédagogique">Pédagogique</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Message détaillé *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Texte de l'annonce officielle..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAnnModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Diffuser le communiqué
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Student Matricule Badge Card for Parents */}
      {selectedStudentForMatricule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden animate-in fade-in">
            <div className="bg-gradient-to-r from-indigo-700 to-purple-700 p-5 text-white text-center">
              <div className="w-12 h-12 rounded-xl bg-white/20 mx-auto flex items-center justify-center mb-2">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg">Fiche d'Accès Parent</h3>
              <p className="text-xs text-indigo-200">
                À remettre au parent pour la connexion ParentEcole
              </p>
            </div>

            <div className="p-6 text-center space-y-4">
              <div>
                <div className="font-bold text-lg text-slate-900">
                  {selectedStudentForMatricule.firstName} {selectedStudentForMatricule.lastName}
                </div>
                <div className="text-xs text-slate-500">
                  {selectedStudentForMatricule.className} • {currentSchool.name}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">
                  Identifiant Sécurisé (Matricule)
                </div>
                <div className="text-xl font-mono font-extrabold text-indigo-700 tracking-wider">
                  {selectedStudentForMatricule.matricule}
                </div>
                <button
                  onClick={() => copyToClipboard(selectedStudentForMatricule.matricule)}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 shadow-2xs transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedMatricule === selectedStudentForMatricule.matricule ? 'Copié !' : 'Copier le code'}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-500 text-left bg-indigo-50/70 p-3 rounded-lg border border-indigo-100">
                Le parent n'a qu'à se connecter avec son email habituel sur la page d'accueil de ParentEcole, puis saisir ce matricule pour accéder immédiatement à toutes les informations de son enfant.
              </p>

              <button
                onClick={() => setSelectedStudentForMatricule(null)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
