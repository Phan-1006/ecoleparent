import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  BookOpen,
  Calendar,
  Plus,
  Search,
  Receipt,
  FileText,
  DollarSign,
  Printer,
  ChevronRight,
  Sparkles,
  ShieldAlert,
  UserPlus,
  Send,
  Lock,
  Shield,
  Copy,
  Check,
  X,
  User,
} from 'lucide-react';
import { PaymentRecord, Student } from '../../types';

export const AgentView: React.FC = () => {
  const {
    currentUser,
    schools,
    classes,
    agents,
    students,
    fees,
    payments,
    homeworks,
    conductReports,
    recordClassAttendance,
    attendance,
    addHomework,
    deleteHomework,
    addConductReport,
    recordPayment,
    createStudent,
    getStudentFinancialStatus,
  } = useApp();

  const currentSchool = schools.find((s) => s.id === currentUser?.schoolId) || schools[0];
  const schoolCurrency = currentSchool?.currency || '$';
  const schoolClasses = classes.filter((c) => c.schoolId === currentSchool.id);
  const schoolStudents = students.filter((s) => s.schoolId === currentSchool.id);

  // Strict role isolation: Agent is locked to their assigned roleType
  const agentRole = currentUser?.agentFunction || 'surveillant';

  // ----------------------------------------------------
  // 1. SURVEILLANT STATE (Fast Attendance)
  // ----------------------------------------------------
  const [selectedClassId, setSelectedClassId] = useState<string>(
    schoolClasses.length > 0 ? schoolClasses[0].id : ''
  );
  const [attendanceDate, setAttendanceDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  // Map of studentId -> { absent: boolean, reason: string }
  const [absentMap, setAbsentMap] = useState<Record<string, { absent: boolean; reason: string }>>({});
  const [attendanceSuccessMessage, setAttendanceSuccessMessage] = useState<string | null>(null);

  const currentClassStudents = schoolStudents.filter((s) => s.classId === selectedClassId);

  const toggleStudentAbsent = (studentId: string) => {
    setAbsentMap((prev) => {
      const current = prev[studentId];
      if (current?.absent) {
        // Unmark absent
        const copy = { ...prev };
        delete copy[studentId];
        return copy;
      } else {
        return {
          ...prev,
          [studentId]: { absent: true, reason: 'Absence constatée' },
        };
      }
    });
  };

  const updateAbsentReason = (studentId: string, reason: string) => {
    setAbsentMap((prev) => ({
      ...prev,
      [studentId]: { absent: true, reason },
    }));
  };

  const handleSaveAttendance = () => {
    const absentList: { studentId: string; reason?: string }[] = [];
    Object.entries(absentMap).forEach(([stId, data]) => {
      if (data.absent) {
        absentList.push({ studentId: stId, reason: data.reason });
      }
    });

    recordClassAttendance(selectedClassId, attendanceDate, absentList);

    const presentCount = currentClassStudents.length - absentList.length;
    setAttendanceSuccessMessage(
      `Appel validé avec succès ! ${absentList.length} absent(s) notifié(s), et ${presentCount} élève(s) automatiquement marqués présents.`
    );
    setTimeout(() => setAttendanceSuccessMessage(null), 5000);
  };

  // ----------------------------------------------------
  // 2. PROFESSEUR STATE (Devoirs, Conduite, Titulaire)
  // ----------------------------------------------------
  const [hwClassId, setHwClassId] = useState<string>(
    schoolClasses.length > 0 ? schoolClasses[0].id : ''
  );
  const [hwSubject, setHwSubject] = useState('');
  const [hwTitle, setHwTitle] = useState('');
  const [hwDesc, setHwDesc] = useState('');
  const [hwDueDate, setHwDueDate] = useState('');
  const [hwSuccessMsg, setHwSuccessMsg] = useState<string | null>(null);

  // Conduct state
  const [condStudentId, setCondStudentId] = useState<string>('');
  const [condType, setCondType] = useState<any>('Observation');
  const [condTitle, setCondTitle] = useState('');
  const [condComment, setCondComment] = useState('');
  const [condSuccessMsg, setCondSuccessMsg] = useState<string | null>(null);

  // Titulaire add student form
  const currentAgent = agents.find(
    (a) => a.email.toLowerCase() === currentUser?.email?.toLowerCase()
  );
  const titulaireAssignedClassId = currentAgent?.assignedClassIds?.[0];

  const [titClassId, setTitClassId] = useState<string>(
    titulaireAssignedClassId || (schoolClasses.length > 0 ? schoolClasses[0].id : '')
  );
  const [titFirstName, setTitFirstName] = useState('');
  const [titLastName, setTitLastName] = useState('');
  const [titGender, setTitGender] = useState<'M' | 'F'>('M');
  const [titParentName, setTitParentName] = useState('');
  const [titParentPhone, setTitParentPhone] = useState('');
  const [titSuccessMsg, setTitSuccessMsg] = useState<{ name: string; matricule: string } | null>(null);
  const [copiedMatricule, setCopiedMatricule] = useState<string | null>(null);

  const handleAddHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hwSubject || !hwTitle || !hwDueDate) return;

    const chosenClass = schoolClasses.find((c) => c.id === hwClassId);

    addHomework({
      schoolId: currentSchool.id,
      classId: hwClassId,
      className: chosenClass ? chosenClass.name : 'Classe',
      subject: hwSubject.trim(),
      title: hwTitle.trim(),
      description: hwDesc.trim(),
      dueDate: hwDueDate,
      dueTime: '08:00',
      createdByAgentEmail: currentUser?.email || 'professeur',
      teacherName: currentUser?.name || 'Professeur',
    });

    setHwSubject('');
    setHwTitle('');
    setHwDesc('');
    setHwDueDate('');
    setHwSuccessMsg('Devoir publié avec succès ! Les parents recevront l’échéance.');
    setTimeout(() => setHwSuccessMsg(null), 4000);
  };

  const handleAddConduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!condStudentId || !condTitle || !condComment) return;

    const targetStudent = schoolStudents.find((s) => s.id === condStudentId);
    if (!targetStudent) return;

    let severity: 'info' | 'warning' | 'danger' | 'success' = 'info';
    if (condType === 'Avertissement' || condType === 'Retard récurrent') severity = 'warning';
    if (condType === 'Exclusion temporaire' || condType === 'Absence injustifiée') severity = 'danger';
    if (condType === 'Félicitation') severity = 'success';

    addConductReport({
      schoolId: currentSchool.id,
      studentId: targetStudent.id,
      studentName: `${targetStudent.firstName} ${targetStudent.lastName}`,
      className: targetStudent.className,
      date: new Date().toISOString().split('T')[0],
      type: condType,
      severity,
      title: condTitle.trim(),
      comment: condComment.trim(),
      reportedByTeacher: currentUser?.name || 'Enseignant',
    });

    setCondTitle('');
    setCondComment('');
    setCondSuccessMsg(`Signalement de conduite enregistré pour ${targetStudent.firstName} !`);
    setTimeout(() => setCondSuccessMsg(null), 4000);
  };

  const copyMatriculeToClipboard = (mat: string) => {
    navigator.clipboard.writeText(mat);
    setCopiedMatricule(mat);
    setTimeout(() => setCopiedMatricule(null), 2500);
  };

  const handleTitulaireAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const targetClassId = titClassId || hwClassId || schoolClasses[0]?.id;
    if (!titFirstName || !titLastName || !targetClassId) return;

    const chosenClass = schoolClasses.find((c) => c.id === targetClassId);

    const newSt = createStudent({
      schoolId: currentSchool.id,
      classId: targetClassId,
      className: chosenClass ? chosenClass.name : 'Classe',
      firstName: titFirstName.trim(),
      lastName: titLastName.trim(),
      gender: titGender,
      parentName: titParentName.trim() || 'Parent',
      parentPhone: titParentPhone.trim(),
      hasTransport: false,
      hasCantine: false,
      hasInternat: false,
      customFeeIds: [],
    });

    setTitFirstName('');
    setTitLastName('');
    setTitParentName('');
    setTitParentPhone('');
    setTitSuccessMsg({
      name: `${newSt.firstName} ${newSt.lastName}`,
      matricule: newSt.matricule,
    });
  };

  // ----------------------------------------------------
  // 3. CAISSIER STATE (Paiements, Reçus, Recouvrement)
  // ----------------------------------------------------
  const [payStudentSearch, setPayStudentSearch] = useState('');
  const [payClassFilter, setPayClassFilter] = useState('all');
  const [payStudentId, setPayStudentId] = useState<string>('');
  const [payFeeCategoryId, setPayFeeCategoryId] = useState<string>('');
  const [payAmount, setPayAmount] = useState<number>(150);
  const [payMethod, setPayMethod] = useState<'Espèces' | 'Mobile Money' | 'Virement Bancaire'>('Mobile Money');
  const [payNotes, setPayNotes] = useState('');
  const [generatedReceipt, setGeneratedReceipt] = useState<PaymentRecord | null>(null);

  const selectedPaymentStudent = schoolStudents.find((s) => s.id === payStudentId);
  const studentFin = selectedPaymentStudent ? getStudentFinancialStatus(selectedPaymentStudent.id) : null;
  const schoolFees = fees.filter((f) => f.schoolId === currentSchool.id);

  // Filter students for the cashier by search query and class
  const filteredCashierStudents = schoolStudents.filter((s) => {
    const matchesClass = payClassFilter === 'all' || s.classId === payClassFilter;
    if (!matchesClass) return false;
    if (!payStudentSearch.trim()) return true;
    const q = payStudentSearch.trim().toLowerCase();
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const reverseFullName = `${s.lastName} ${s.firstName}`.toLowerCase();
    const matricule = (s.matricule || '').toLowerCase();
    const className = (s.className || '').toLowerCase();
    const parentName = (s.parentName || '').toLowerCase();
    return (
      fullName.includes(q) ||
      reverseFullName.includes(q) ||
      matricule.includes(q) ||
      className.includes(q) ||
      parentName.includes(q)
    );
  });

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentStudent || payAmount <= 0) return;

    const feeCat = schoolFees.find((f) => f.id === payFeeCategoryId) || schoolFees[0];

    const newPayment = recordPayment({
      schoolId: currentSchool.id,
      studentId: selectedPaymentStudent.id,
      studentMatricule: selectedPaymentStudent.matricule,
      studentName: `${selectedPaymentStudent.firstName} ${selectedPaymentStudent.lastName}`,
      className: selectedPaymentStudent.className,
      feeCategoryId: feeCat ? feeCat.id : 'fee-1',
      feeCategoryName: feeCat ? feeCat.name : 'Frais Scolaires',
      amount: Number(payAmount),
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: payMethod,
      recordedByAgentEmail: currentUser?.email || 'caissier',
      notes: payNotes.trim() || 'Versement enregistré à la caisse',
    });

    setGeneratedReceipt(newPayment);
    setPayNotes('');
  };

  return (
    <div className="space-y-6 pb-24 sm:pb-8">
      {/* Agent Workspace Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 backdrop-blur-md border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                Espace Opérationnel Agent
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
                Portail des Fonctions Scolaires
              </h1>
              <p className="text-xs text-indigo-200 mt-0.5">
                Connecté en tant que : <strong>{currentUser?.name}</strong> ({currentUser?.email}) • {currentSchool.name}
              </p>
            </div>
          </div>

          {/* Role Status Badge (Strict Access Control) */}
          <div className="flex items-center gap-3 bg-white/10 px-4 py-2.5 rounded-xl border border-white/20 self-start sm:self-auto shadow-inner">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-white">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">
                Accès Sécurisé & Verrouillé
              </div>
              <div className="text-xs font-bold text-white">
                {agentRole === 'surveillant' && 'Surveillant Général (Appel Express)'}
                {agentRole === 'professeur' && 'Professeur Titulaire (Devoirs & Conduite)'}
                {agentRole === 'caissier' && 'Caissier Scolaire (Caisse & Reçus)'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 1. SURVEILLANT VIEW: FAST ATTENDANCE SHEET */}
      {/* ---------------------------------------------------- */}
      {agentRole === 'surveillant' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-lg text-slate-900">Appel Express par Sélection des Absents</h2>
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    Automatique
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  <strong>Règle de rapidité :</strong> Cliquez uniquement sur les élèves absents. Tous les autres élèves seront automatiquement enregistrés présents d'un seul clic !
                </p>
              </div>

              {/* Class and Date Selectors */}
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Classe</label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => {
                      setSelectedClassId(e.target.value);
                      setAbsentMap({});
                    }}
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-semibold"
                  >
                    {schoolClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Date</label>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Success feedback */}
            {attendanceSuccessMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{attendanceSuccessMessage}</span>
              </div>
            )}

            {/* Students Attendance Grid */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Élèves de la classe ({currentClassStudents.length})</span>
                <span className="text-slate-500 font-normal">
                  Cochez les absents ci-dessous :
                </span>
              </div>

              {currentClassStudents.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Aucun élève inscrit dans cette classe pour le moment.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {currentClassStudents.map((student) => {
                    const isAbsent = !!absentMap[student.id]?.absent;
                    const reason = absentMap[student.id]?.reason || '';

                    return (
                      <div
                        key={student.id}
                        className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                          isAbsent ? 'bg-rose-50/80 border-l-4 border-rose-600' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleStudentAbsent(student.id)}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition ${
                              isAbsent
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'border-2 border-slate-300 hover:border-slate-400'
                            }`}
                          >
                            {isAbsent && <XCircle className="w-4 h-4" />}
                          </button>

                          <div>
                            <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                              <span>{student.firstName} {student.lastName}</span>
                              <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                                {student.matricule}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              Parent : {student.parentName} ({student.parentPhone || 'N/A'})
                            </div>
                          </div>
                        </div>

                        {/* Status Toggle & Reason Input if Absent */}
                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          {isAbsent ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Motif d'absence (ex: Maladie déclarée)..."
                                value={reason}
                                onChange={(e) => updateAbsentReason(student.id, e.target.value)}
                                className="px-3 py-1 text-xs bg-white border border-rose-300 rounded-lg text-rose-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500 w-52 sm:w-64"
                              />
                              <span className="px-2.5 py-1 bg-rose-600 text-white text-[11px] font-bold rounded-lg shadow-2xs">
                                Absent
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Présent (Par défaut)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Submit Action */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-600">
                Total sélectionné : <strong className="text-rose-600">{Object.keys(absentMap).length} absent(s)</strong> |{' '}
                <strong className="text-emerald-700">
                  {Math.max(0, currentClassStudents.length - Object.keys(absentMap).length)} présent(s) automatiquement
                </strong>
              </div>

              <button
                onClick={handleSaveAttendance}
                disabled={currentClassStudents.length === 0}
                className="w-full sm:w-auto px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Valider l'Appel & Notifier l'Espace Parent</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. PROFESSEUR VIEW: DEVOIRS, CONDUITE & TITULAIRE */}
      {/* ---------------------------------------------------- */}
      {agentRole === 'professeur' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
          {/* Section A: Devoirs à Faire */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Publier un Devoir à Faire</h3>
                <p className="text-xs text-slate-500">
                  Visible instantanément par les parents avec date de remise.
                </p>
              </div>
            </div>

            {hwSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{hwSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddHomework} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Classe</label>
                  <select
                    value={hwClassId}
                    onChange={(e) => setHwClassId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    {schoolClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Matière</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Mathématiques"
                    value={hwSubject}
                    onChange={(e) => setHwSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Titre du Devoir</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Exercices page 45 - Équations"
                  value={hwTitle}
                  onChange={(e) => setHwTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Consignes Détaillées</label>
                <textarea
                  rows={3}
                  placeholder="Instructions à suivre, matériel nécessaire..."
                  value={hwDesc}
                  onChange={(e) => setHwDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-emerald-700 mb-1">Date de Remise Obligatoire</label>
                <input
                  type="date"
                  required
                  value={hwDueDate}
                  onChange={(e) => setHwDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-950 font-semibold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Assigner et publier le devoir
              </button>
            </form>
          </div>

          {/* Section B: Signalement de Conduite & Constats */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Cahier de Conduite & Constats</h3>
                <p className="text-xs text-slate-500">
                  Enregistrez observations, félicitations ou avertissements comportementaux.
                </p>
              </div>
            </div>

            {condSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{condSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddConduct} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Sélectionner l'Élève</label>
                <select
                  required
                  value={condStudentId}
                  onChange={(e) => setCondStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-semibold"
                >
                  <option value="">-- Choisir un élève --</option>
                  {schoolStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.className})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Type de Constat</label>
                <select
                  value={condType}
                  onChange={(e) => setCondType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Observation">Observation générale</option>
                  <option value="Avertissement">Avertissement de discipline</option>
                  <option value="Félicitation">Félicitation / Tableau d'Honneur</option>
                  <option value="Retard récurrent">Retard récurrent aux cours</option>
                  <option value="Exclusion temporaire">Exclusion temporaire</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Objet</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Bavardage répété ou Excellence en devoir"
                  value={condTitle}
                  onChange={(e) => setCondTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Remarque du Professeur</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explication factuelle pour le parent..."
                  value={condComment}
                  onChange={(e) => setCondComment(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Enregistrer la mention de conduite
              </button>
            </form>
          </div>

          {/* Section C: Titulaire Student Registration (As prompt noted) */}
          <div className="lg:col-span-2 bg-gradient-to-br from-indigo-50/70 to-slate-50 rounded-2xl border border-indigo-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-indigo-950">
                    Inscription d'Élèves & Génération d'ID (Professeur Titulaire)
                  </h4>
                  <p className="text-xs text-indigo-700">
                    À chaque élève inscrit, un ID (matricule) unique est généré pour permettre au parent de se connecter.
                  </p>
                </div>
              </div>

              {/* Class filter for titulaire */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-900">Classe :</span>
                <select
                  value={titClassId}
                  onChange={(e) => setTitClassId(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold bg-white border border-indigo-300 rounded-xl text-indigo-950 focus:ring-2 focus:ring-indigo-500"
                >
                  {schoolClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {titSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
                <div>
                  <div className="font-bold text-sm flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Élève inscrit avec succès !</span>
                  </div>
                  <p className="mt-1">
                    Élève : <strong>{titSuccessMsg.name}</strong> • ID généré :{' '}
                    <strong className="font-mono bg-emerald-100 px-2 py-0.5 rounded text-emerald-950">
                      {titSuccessMsg.matricule}
                    </strong>
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Transmettez cet ID au parent pour qu'il débloque l'accès au dossier scolaire de son enfant.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => copyMatriculeToClipboard(titSuccessMsg.matricule)}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition cursor-pointer"
                >
                  {copiedMatricule === titSuccessMsg.matricule ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier l'ID</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <form onSubmit={handleTitulaireAddStudent} className="grid grid-cols-1 sm:grid-cols-6 gap-3">
              <input
                type="text"
                required
                placeholder="Prénom de l'élève *"
                value={titFirstName}
                onChange={(e) => setTitFirstName(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
              />
              <input
                type="text"
                required
                placeholder="Nom de l'élève *"
                value={titLastName}
                onChange={(e) => setTitLastName(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
              />
              <select
                value={titGender}
                onChange={(e) => setTitGender(e.target.value as 'M' | 'F')}
                className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
              >
                <option value="M">Garçon (M)</option>
                <option value="F">Fille (F)</option>
              </select>
              <input
                type="text"
                placeholder="Nom du parent"
                value={titParentName}
                onChange={(e) => setTitParentName(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
              />
              <input
                type="text"
                placeholder="Tél ou WhatsApp parent"
                value={titParentPhone}
                onChange={(e) => setTitParentPhone(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Inscrire & Créer ID</span>
              </button>
            </form>

            {/* List of existing students in this class with their IDs */}
            <div className="mt-4 pt-4 border-t border-indigo-100 space-y-2">
              <div className="flex items-center justify-between text-xs text-indigo-900 font-bold">
                <span>Élèves inscrits dans cette classe ({schoolStudents.filter((s) => s.classId === (titClassId || schoolClasses[0]?.id)).length}) :</span>
                <span className="text-[11px] text-indigo-600 font-normal">IDs à communiquer aux parents</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                {schoolStudents
                  .filter((s) => s.classId === (titClassId || schoolClasses[0]?.id))
                  .map((st) => (
                    <div
                      key={st.id}
                      className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate">
                          {st.firstName} {st.lastName}
                        </div>
                        <div className="text-[11px] font-mono font-bold text-indigo-600 truncate">
                          {st.matricule}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => copyMatriculeToClipboard(st.matricule)}
                        title="Copier le code pour le parent"
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 transition shrink-0 cursor-pointer"
                      >
                        {copiedMatricule === st.matricule ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. CAISSIER VIEW: PAIEMENTS, REÇUS & RECOUVREMENT */}
      {/* ---------------------------------------------------- */}
      {agentRole === 'caissier' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
          {/* Payment Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Enregistrement de Versement & Caisse</h3>
                <p className="text-xs text-slate-500">
                  Calcule automatiquement le reste à payer et met à jour l'éligibilité face à la date de recouvrement/renvoi.
                </p>
              </div>
            </div>

            {/* Search Bar & Student Selection */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Recherche & Sélection de l'Élève *
                </label>
                <span className="text-[11px] text-cyan-800 font-medium">
                  {filteredCashierStudents.length} élève(s) trouvé(s) sur {schoolStudents.length}
                </span>
              </div>

              {/* Search Bar with filter by class */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="relative sm:col-span-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, prénom, matricule ou classe..."
                    value={payStudentSearch}
                    onChange={(e) => setPayStudentSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-cyan-500 font-medium"
                  />
                  {payStudentSearch && (
                    <button
                      type="button"
                      onClick={() => setPayStudentSearch('')}
                      className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                      title="Effacer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div>
                  <select
                    value={payClassFilter}
                    onChange={(e) => setPayClassFilter(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-cyan-500 font-semibold text-slate-700"
                  >
                    <option value="all">Toutes les classes ({schoolClasses.length})</option>
                    {schoolClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* If no student selected, display searchable results list */}
              {!selectedPaymentStudent && (
                <div className="border border-slate-200 rounded-xl bg-slate-50/50 p-2 space-y-1.5 max-h-64 overflow-y-auto">
                  {filteredCashierStudents.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      Aucun élève ne correspond à votre recherche. Modifiez le nom ou la classe.
                    </div>
                  ) : (
                    filteredCashierStudents.map((st) => {
                      const stFin = getStudentFinancialStatus(st.id);
                      return (
                        <div
                          key={st.id}
                          onClick={() => {
                            setPayStudentId(st.id);
                            if (stFin && stFin.remainingBalance > 0) {
                              setPayAmount(stFin.remainingBalance);
                            }
                          }}
                          className="p-2.5 bg-white hover:bg-cyan-50/70 border border-slate-200 hover:border-cyan-300 rounded-xl flex items-center justify-between gap-3 transition cursor-pointer shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-cyan-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {st.firstName.charAt(0)}
                              {st.lastName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {st.firstName} {st.lastName}
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                <span className="font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                                  {st.className}
                                </span>
                                <span className="font-mono text-slate-600 font-bold">{st.matricule}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 flex items-center gap-3">
                            <div className="hidden sm:block">
                              <div className="text-[10px] uppercase font-bold text-slate-400">Reste dû</div>
                              <div
                                className={`text-xs font-bold ${
                                  stFin?.remainingBalance && stFin.remainingBalance > 0
                                    ? 'text-rose-600'
                                    : 'text-emerald-600'
                                }`}
                              >
                                {stFin ? stFin.remainingBalance : 0} {schoolCurrency}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-lg shadow-xs transition"
                            >
                              Sélectionner
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Selected Student Banner Card */}
              {selectedPaymentStudent && (
                <div className="p-3.5 bg-cyan-50/80 border border-cyan-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-700 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                      {selectedPaymentStudent.firstName.charAt(0)}
                      {selectedPaymentStudent.lastName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs uppercase font-bold text-cyan-800 tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />
                        <span>Élève sélectionné pour paiement</span>
                      </div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">
                        {selectedPaymentStudent.firstName} {selectedPaymentStudent.lastName}
                      </div>
                      <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="font-semibold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                          {selectedPaymentStudent.className}
                        </span>
                        <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {selectedPaymentStudent.matricule}
                        </span>
                        {selectedPaymentStudent.parentPhone && (
                          <span className="text-[11px] text-slate-500">
                            Tél: {selectedPaymentStudent.parentPhone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPayStudentId('')}
                    className="px-3 py-1.5 text-xs font-semibold text-cyan-800 hover:text-cyan-950 bg-white hover:bg-cyan-100/70 border border-cyan-300 rounded-xl transition cursor-pointer self-start sm:self-auto"
                  >
                    Changer d'élève
                  </button>
                </div>
              )}
            </div>

            {/* Financial Status Summary for this student if selected */}
            {selectedPaymentStudent && studentFin && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Situation Financière de {selectedPaymentStudent.firstName}</span>
                  <span className="font-mono text-indigo-700">{selectedPaymentStudent.matricule}</span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="text-[11px] text-slate-500">Total Annuel Dû</div>
                    <div className="text-base font-bold text-slate-900">
                      {studentFin.totalApplicableFees} {schoolCurrency}
                    </div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="text-[11px] text-slate-500">Déjà Encaissé</div>
                    <div className="text-base font-bold text-emerald-600">
                      {studentFin.totalPaid} {schoolCurrency}
                    </div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="text-[11px] text-slate-500">Reste à Payer</div>
                    <div className="text-base font-bold text-rose-600">
                      {studentFin.remainingBalance} {schoolCurrency}
                    </div>
                  </div>
                </div>

                {studentFin.isAtRiskOfRecovery ? (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <div>
                        <strong>Avis de renvoi au {studentFin.recoveryWarningDate} :</strong> Seuil requis ={' '}
                        {studentFin.recoveryRequiredAmount} {schoolCurrency}.
                      </div>
                    </div>
                    <span className="font-bold text-rose-700">Manque : {studentFin.recoveryRequiredAmount - studentFin.totalPaid} {schoolCurrency}</span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Élève en règle avec le seuil actuel de recouvrement.</span>
                  </div>
                )}
              </div>
            )}

            {/* Payment Form Fields */}
            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
              {/* Payment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Affectation du Frais *
                  </label>
                  <select
                    value={payFeeCategoryId}
                    onChange={(e) => setPayFeeCategoryId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  >
                    {schoolFees.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.totalAmount} {schoolCurrency})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Mode de Paiement
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="Mobile Money">Mobile Money (M-Pesa, Airtel, Orange)</option>
                    <option value="Espèces">Espèces (Cash Caisse)</option>
                    <option value="Virement Bancaire">Virement Bancaire</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase text-cyan-900">
                    Montant à Encaisser ({schoolCurrency}) *
                  </label>
                  {studentFin && studentFin.remainingBalance > 0 && (
                    <button
                      type="button"
                      onClick={() => setPayAmount(studentFin.remainingBalance)}
                      className="text-[11px] font-semibold text-cyan-700 hover:text-cyan-900 underline cursor-pointer"
                    >
                      Payer la totalité du solde ({studentFin.remainingBalance} {schoolCurrency})
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  min="1"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 text-base font-bold bg-cyan-50 border border-cyan-300 rounded-xl focus:ring-2 focus:ring-cyan-500 text-cyan-950"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Observations / Référence externe
                </label>
                <input
                  type="text"
                  placeholder="Référence ou observation du versement"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <button
                type="submit"
                disabled={!selectedPaymentStudent}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                <DollarSign className="w-4 h-4" />
                <span>Enregistrer le Paiement & Générer Reçu Officiel</span>
              </button>
            </form>
          </div>

          {/* Right Column: Recent Payments Feed */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h4 className="font-bold text-sm text-slate-900">Derniers Versements Encaissés</h4>
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto space-y-2">
              {payments
                .filter((p) => p.schoolId === currentSchool.id)
                .slice(0, 8)
                .map((p) => (
                  <div key={p.id} className="pt-2 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{p.studentName}</span>
                      <span className="text-emerald-600 font-mono">+{p.amount} {schoolCurrency}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between mt-0.5">
                      <span>{p.paymentMethod} • {p.referenceNumber}</span>
                      <span>{p.paymentDate}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {generatedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in">
            <div className="bg-gradient-to-r from-cyan-700 to-blue-700 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Reçu de Paiement Scolaire</h3>
                <p className="text-xs text-cyan-200">{currentSchool.name}</p>
              </div>
              <Printer className="w-6 h-6 text-cyan-200" />
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Numéro de Reçu :</span>
                <span className="font-mono font-bold text-slate-900">{generatedReceipt.referenceNumber}</span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Élève :</span>
                <span className="font-bold text-slate-900">{generatedReceipt.studentName}</span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Matricule Sécurisé :</span>
                <span className="font-mono font-bold text-indigo-700">{generatedReceipt.studentMatricule}</span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Motif :</span>
                <span className="font-semibold text-slate-900">{generatedReceipt.feeCategoryName}</span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Mode :</span>
                <span className="font-semibold text-slate-900">{generatedReceipt.paymentMethod}</span>
              </div>

              <div className="bg-cyan-50 p-4 rounded-xl border border-cyan-200 text-center">
                <div className="text-xs uppercase font-bold text-cyan-800">Montant Reçu</div>
                <div className="text-2xl font-extrabold text-cyan-950 mt-1">
                  {generatedReceipt.amount} {schoolCurrency}
                </div>
                <div className="text-[11px] text-cyan-700 mt-1">
                  Encaissé le {generatedReceipt.paymentDate}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setGeneratedReceipt(null)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition"
                >
                  Fermer & Terminer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
