import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Heart,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  BookOpen,
  DollarSign,
  UserCheck,
  ShieldAlert,
  Megaphone,
  Plus,
  QrCode,
  WifiOff,
  User,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { Homework, ConductReport } from '../../types';

interface ParentViewProps {
  onOpenAddChild: () => void;
}

export const ParentView: React.FC<ParentViewProps> = ({ onOpenAddChild }) => {
  const {
    currentUser,
    schools,
    students,
    activeStudentId,
    setActiveStudentId,
    linkedStudentIds,
    linkStudentByMatricule,
    getStudentFinancialStatus,
    attendance,
    homeworks,
    conductReports,
    announcements,
    events,
    isOnline,
    lastSyncTime,
  } = useApp();

  // Active child
  const activeStudent = activeStudentId ? students.find((s) => s.id === activeStudentId) : null;
  const childSchool = activeStudent ? schools.find((s) => s.id === activeStudent.schoolId) : null;
  const schoolCurrency = childSchool?.currency || '$';

  // Matricule input if no child is currently linked
  const [matriculeInput, setMatriculeInput] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);

  // Tab within parent space
  type ParentTab = 'finance' | 'attendance' | 'homework' | 'conduct' | 'announcements';
  const [parentTab, setParentTab] = useState<ParentTab>('finance');

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError(null);
    setLinkSuccess(null);

    const res = linkStudentByMatricule(matriculeInput);
    if (res.success) {
      setLinkSuccess(res.message);
      setMatriculeInput('');
    } else {
      setLinkError(res.message);
    }
  };

  // If no child linked yet, show child connection screen
  if (!activeStudent || linkedStudentIds.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-6 sm:py-12 px-4 animate-in fade-in">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden text-center">
          {/* Welcoming Top Card */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md mx-auto flex items-center justify-center mb-3 border border-white/15">
              <Heart className="w-7 h-7 text-indigo-300" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Espace Suivi Parent</h2>
            <p className="text-xs text-indigo-200 max-w-sm mx-auto mt-1.5 leading-relaxed">
              Pour accéder au dossier scolaire de votre enfant, veuillez saisir son ID (matricule) remis par l'école.
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-5">
            {linkError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-2xl flex items-center gap-2.5 text-left animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{linkError}</span>
              </div>
            )}

            <form onSubmit={handleLinkSubmit} className="space-y-4 max-w-md mx-auto">
              <div className="text-left space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  ID (Matricule) de l'enfant *
                </label>
                <div className="relative">
                  <QrCode className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Entrez le matricule"
                    value={matriculeInput}
                    onChange={(e) => setMatriculeInput(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 text-sm font-mono font-bold uppercase tracking-wider bg-slate-50 border border-slate-300 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:bg-white transition"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  L'identifiant confidentiel remis par l'école ou le professeur titulaire de votre enfant.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow-md shadow-indigo-100 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Accéder au dossier de mon enfant</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Child data calculated
  const fin = getStudentFinancialStatus(activeStudent.id);

  // Student specific attendances
  const studentAttendance = attendance.filter((a) => a.studentId === activeStudent.id);
  const studentAbsences = studentAttendance.filter((a) => a.status === 'absent');
  const studentPresents = studentAttendance.filter((a) => a.status === 'present');
  const attendanceRate =
    studentAttendance.length > 0
      ? Math.round((studentPresents.length / studentAttendance.length) * 100)
      : 100;

  // Student specific homework
  const studentHomeworks = homeworks.filter((h) => h.classId === activeStudent.classId);

  // Student specific conduct
  const studentConduct = conductReports.filter((c) => c.studentId === activeStudent.id);

  // School announcements
  const schoolAnnouncements = announcements.filter((a) => a.schoolId === activeStudent.schoolId);

  // Linked student objects
  const allLinkedStudents = students.filter((s) => linkedStudentIds.includes(s.id));

  return (
    <div className="space-y-5 animate-in fade-in pb-24 sm:pb-8">
      {/* Multi-Child Selector (if parent has multiple children) */}
      {allLinkedStudents.length > 1 && (
        <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 pl-1 shrink-0">Mes enfants :</span>
            {allLinkedStudents.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setActiveStudentId(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  st.id === activeStudent.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {st.firstName} ({st.className})
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onOpenAddChild}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl shrink-0 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter un enfant</span>
          </button>
        </div>
      )}

      {/* Child Identity Card - Mobile Friendly & Clean */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-500 flex items-center justify-center text-white text-xl sm:text-2xl font-extrabold shadow-md shrink-0">
              {activeStudent.firstName.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white truncate">
                  {activeStudent.firstName} {activeStudent.lastName}
                </h1>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/15 text-white border border-white/20">
                  {activeStudent.className}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 truncate">
                {childSchool?.name}
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                <span>ID Élève :</span>
                <code className="text-indigo-300 font-mono font-bold">{activeStudent.matricule}</code>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t border-white/10 sm:border-0 justify-between sm:justify-end">
            <button
              type="button"
              onClick={onOpenAddChild}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{allLinkedStudents.length > 1 ? 'Autre enfant (+)' : 'Ajouter un enfant (+)'}</span>
            </button>
          </div>
        </div>

        {/* Financial Recovery Alert Banner */}
        {fin.isAtRiskOfRecovery && (
          <div className="mt-5 p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-rose-100 flex items-start gap-3 animate-in fade-in">
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="font-bold text-xs sm:text-sm text-rose-200 uppercase tracking-wide flex items-center gap-2">
                <span>Avis de Recouvrement Scolaire</span>
                <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-full">Date Butoir</span>
              </div>
              <p className="text-xs text-rose-200 leading-relaxed">
                Date limite fixée au <strong>{fin.recoveryWarningDate}</strong> pour un cumul minimum requis de <strong>{fin.recoveryRequiredAmount} {schoolCurrency}</strong>.
                Total actuellement réglé : <strong>{fin.totalPaid} {schoolCurrency}</strong>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Desktop/Tablet Parent Navigation Tabs */}
      <div className="hidden sm:flex gap-1.5 overflow-x-auto bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs scrollbar-none">
        <button
          type="button"
          onClick={() => setParentTab('finance')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            parentTab === 'finance'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Frais ({fin.remainingBalance} {schoolCurrency} restant)</span>
        </button>

        <button
          type="button"
          onClick={() => setParentTab('attendance')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            parentTab === 'attendance'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Présences ({studentAbsences.length} absence{studentAbsences.length > 1 ? 's' : ''})</span>
        </button>

        <button
          type="button"
          onClick={() => setParentTab('homework')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            parentTab === 'homework'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Devoirs ({studentHomeworks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setParentTab('conduct')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            parentTab === 'conduct'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Conduite ({studentConduct.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setParentTab('announcements')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            parentTab === 'announcements'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>Avis École ({schoolAnnouncements.length})</span>
        </button>
      </div>

      {/* Mobile Bottom Navigation Bar (Flutter / Native App Style) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex justify-around items-center safe-bottom shadow-xl">
        <button
          type="button"
          onClick={() => setParentTab('finance')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer ${
            parentTab === 'finance' ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <DollarSign className={`w-5 h-5 ${parentTab === 'finance' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Finances</span>
        </button>

        <button
          type="button"
          onClick={() => setParentTab('attendance')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer ${
            parentTab === 'attendance' ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <UserCheck className={`w-5 h-5 ${parentTab === 'attendance' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Présences</span>
        </button>

        <button
          type="button"
          onClick={() => setParentTab('homework')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer ${
            parentTab === 'homework' ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <BookOpen className={`w-5 h-5 ${parentTab === 'homework' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Devoirs</span>
        </button>

        <button
          type="button"
          onClick={() => setParentTab('conduct')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer ${
            parentTab === 'conduct' ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ShieldAlert className={`w-5 h-5 ${parentTab === 'conduct' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Conduite</span>
        </button>

        <button
          type="button"
          onClick={() => setParentTab('announcements')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer ${
            parentTab === 'announcements' ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Megaphone className={`w-5 h-5 ${parentTab === 'announcements' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Avis</span>
        </button>
      </nav>

      {/* ---------------------------------------------------- */}
      {/* 1. TAB: FINANCES & RECOUVREMENT */}
      {/* ---------------------------------------------------- */}
      {parentTab === 'finance' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Key Metric Blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total des Frais Annuels
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {fin.totalApplicableFees} {schoolCurrency}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Minerval obligatoire + abonnements actifs
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                Montant Déjà Payé
              </div>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">
                {fin.totalPaid} {schoolCurrency}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Versements enregistrés et validés à la caisse
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
                Reste à Payer
              </div>
              <div className="text-2xl font-extrabold text-rose-600 mt-1">
                {fin.remainingBalance} {schoolCurrency}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Solde global pour l'année scolaire 2026-2027
              </p>
            </div>
          </div>

          {/* Detailed Tranches and Recovery Cutoffs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Échéancier des Tranches & Règles de Recouvrement</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Suivez les dates limites et les seuils minimaux requis pour éviter le renvoi lors des campagnes de recouvrement.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {fin.applicableFeeCategories.flatMap((fee) =>
                fee.installments.map((inst) => {
                  const isSatisfied = fin.totalPaid >= inst.minimumCumulativeRequired;
                  return (
                    <div
                      key={inst.id}
                      className={`p-4 rounded-xl border transition ${
                        isSatisfied
                          ? 'border-emerald-200 bg-emerald-50/50'
                          : 'border-rose-300 bg-rose-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{inst.name}</span>
                        {isSatisfied ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> En règle
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> À régulariser
                          </span>
                        )}
                      </div>

                      <div className="text-lg font-bold text-slate-900 mt-2">
                        {inst.amount} {schoolCurrency}
                      </div>

                      <div className="text-[11px] text-slate-500 mt-1">
                        Échéance normale : <strong>{inst.dueDate}</strong>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200/60 text-xs">
                        <div className="text-rose-900 font-semibold">
                          Jour de Renvoi : {inst.cutoffRecoveryDate}
                        </div>
                        <div className="text-[10px] text-slate-600 mt-0.5">
                          Seuil cumulé exigé : &ge; {inst.minimumCumulativeRequired} {schoolCurrency}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* List of Payments & Receipts */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-3">
                Historique des Reçus de Caisse Enregistrés ({fin.studentPayments.length})
              </h4>

              {fin.studentPayments.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  Aucun paiement n'a encore été enregistré pour cet élève.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {fin.studentPayments.map((p) => (
                    <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                      <div>
                        <div className="font-bold text-sm text-slate-900">
                          {p.feeCategoryName} — <span className="text-emerald-700">+{p.amount} {schoolCurrency}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Mode : {p.paymentMethod} • Date : {p.paymentDate} • Réf : <code className="font-bold text-indigo-700">{p.referenceNumber}</code>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        Validé à la caisse
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. TAB: ATTENDANCE & ABSENCES */}
      {/* ---------------------------------------------------- */}
      {parentTab === 'attendance' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Taux d'Assiduité
              </div>
              <div className="text-3xl font-extrabold text-indigo-600 mt-1">
                {attendanceRate}%
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Calculé sur l'ensemble des journées d'appel
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                Présences Confirmées
              </div>
              <div className="text-3xl font-extrabold text-emerald-600 mt-1">
                {studentPresents.length}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Validées automatiquement ou manuellement
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
                Absences Constatées
              </div>
              <div className="text-3xl font-extrabold text-rose-600 mt-1">
                {studentAbsences.length}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Signalées par le surveillant général
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Journal Détaillé des Présences & Absences</h3>

            {studentAttendance.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                Aucune absence signalée. L'élève est assidu à tous ses cours !
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {studentAttendance.map((rec) => (
                  <div key={rec.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        rec.status === 'absent' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {rec.status === 'absent' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </div>

                      <div>
                        <div className="font-bold text-sm text-slate-900">
                          {rec.date} — {rec.status === 'absent' ? 'Absence constatée' : 'Présent en classe'}
                        </div>
                        {rec.reason && (
                          <div className="text-xs text-slate-500 mt-0.5">
                            Motif : <span className="font-medium text-slate-700">{rec.reason}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      rec.status === 'absent' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {rec.status === 'absent' ? 'Signalement Surveillant' : 'Présence validée'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. TAB: HOMEWORK (DEVOIRS À FAIRE) */}
      {/* ---------------------------------------------------- */}
      {parentTab === 'homework' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 animate-in fade-in">
          <div>
            <h3 className="text-base font-bold text-slate-900">Cahier de Textes & Devoirs à Remettre</h3>
            <p className="text-xs text-slate-500">
              Devoirs donnés par les professeurs pour la classe de <strong>{activeStudent.className}</strong>.
            </p>
          </div>

          {studentHomeworks.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
              Aucun devoir en attente pour le moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studentHomeworks.map((hw) => (
                <div key={hw.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                      {hw.subject}
                    </span>
                    <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Remise : {hw.dueDate}
                    </span>
                  </div>

                  <h4 className="font-bold text-base text-slate-900">{hw.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                    {hw.description}
                  </p>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                    <span>Professeur : {hw.teacherName}</span>
                    <span>Donné le {hw.createdAt}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. TAB: CONDUCT & TEACHER OBSERVATIONS */}
      {/* ---------------------------------------------------- */}
      {parentTab === 'conduct' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 animate-in fade-in">
          <div>
            <h3 className="text-base font-bold text-slate-900">Discipline, Conduite & Constats Pédagogiques</h3>
            <p className="text-xs text-slate-500">
              Observations directes enregistrées par les professeurs et le surveillant.
            </p>
          </div>

          {studentConduct.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
              Aucun incident ni avertissement noté. Comportement exemplaire !
            </div>
          ) : (
            <div className="space-y-3">
              {studentConduct.map((c) => (
                <div
                  key={c.id}
                  className={`p-4 rounded-xl border transition ${
                    c.severity === 'success'
                      ? 'border-emerald-200 bg-emerald-50/60'
                      : c.severity === 'warning'
                      ? 'border-amber-200 bg-amber-50/60'
                      : c.severity === 'danger'
                      ? 'border-rose-200 bg-rose-50/60'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{c.title}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      c.severity === 'success'
                        ? 'bg-emerald-200 text-emerald-900'
                        : c.severity === 'warning'
                        ? 'bg-amber-200 text-amber-900'
                        : c.severity === 'danger'
                        ? 'bg-rose-200 text-rose-900'
                        : 'bg-slate-200 text-slate-800'
                    }`}>
                      {c.type}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 mt-2 leading-relaxed">{c.comment}</p>

                  <div className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
                    <span>Signalé par : {c.reportedByTeacher}</span>
                    <span>Date : {c.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 5. TAB: ANNOUNCEMENTS & IMPORTANT DATES */}
      {/* ---------------------------------------------------- */}
      {parentTab === 'announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Communiqués Officiels de l'École</h3>
            <div className="space-y-4">
              {schoolAnnouncements.map((ann) => (
                <div key={ann.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{ann.title}</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                      {ann.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                    <span>Émetteur : {ann.author}</span>
                    <span>Publié le {ann.publishDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Dates Importantes & Échéances</h3>
            <div className="space-y-3">
              {events
                .filter((e) => e.schoolId === activeStudent.schoolId)
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
    </div>
  );
};
