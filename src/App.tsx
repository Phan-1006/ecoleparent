import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { LoginModal } from './components/auth/LoginModal';
import { SuperAdminView } from './components/superadmin/SuperAdminView';
import { SchoolAdminView } from './components/schooladmin/SchoolAdminView';
import { AgentView } from './components/agent/AgentView';
import { ParentView } from './components/parent/ParentView';
import { AddChildModal } from './components/parent/AddChildModal';
import {
  GraduationCap,
  Shield,
  School,
  UserCheck,
  Heart,
  QrCode,
  DollarSign,
  Calendar,
  BookOpen,
  ArrowRight,
  Sparkles,
  Layers,
  ShieldCheck,
  Megaphone,
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentUser, isOnline, lastSyncTime } = useApp();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);

  // If user is not logged in, show the welcoming Google Sign-In Landing / Portal
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-indigo-100 selection:text-indigo-900">
        {/* Top Minimal Nav */}
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight text-slate-900">ParentEcole</span>
                <span className="ml-2 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Portail Scolaire
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 transition"
              >
                <span>Se connecter</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 flex flex-col items-center justify-center text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold mb-6 animate-in fade-in">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Portail Scolaire & Suivi Parent</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 max-w-3xl leading-tight">
            Le pont numérique sécurisé entre l'école et les parents.
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mt-4 leading-relaxed">
            Consultez les présences et absences en temps réel, l'échéancier des frais scolaires, les devoirs à faire et les remarques de conduite de votre enfant en toute simplicité.
          </p>

          {/* Big Google Connect Card */}
          <div className="mt-8 w-full max-w-md bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl text-left space-y-5">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-slate-900">Connexion Unique Google</h2>
              <p className="text-xs text-slate-500">
                Sélectionnez votre compte Google pour accéder directement à votre espace.
              </p>
            </div>

            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm rounded-xl border border-slate-300 shadow-xs flex items-center justify-center gap-3 transition hover:border-slate-400 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Se connecter via Google</span>
            </button>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Shield className="w-3.5 h-3.5 text-indigo-500" />
              <span>Accès sécurisé & données scolaires protégées</span>
            </div>
          </div>

          {/* Feature Highlights Grid for Parents */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 text-left">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mb-3">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Suivi Financier & Recouvrement</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Consultez l'échéancier des tranches, les acomptes versés, le solde restant et soyez informé en toute transparence des dates butoirs.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Suivi de la Conduite & Discipline</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Suivez les retards, les observations des enseignants, les encouragements ou les avertissements pour accompagner au mieux votre enfant.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold mb-3">
                <Megaphone className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Communication en Temps Réel</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Recevez directement les communiqués officiels de l'établissement, le calendrier des examens et les avis urgents de la direction.
              </p>
            </div>
          </div>
        </main>

        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          ParentEcole © {new Date().getFullYear()} — Système intégré de gestion scolaire & recouvrement
        </footer>

        <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      </div>
    );
  }

  // If user IS logged in, render the corresponding role dashboard
  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col">
      <Header
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenAddChild={() => setIsAddChildModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentUser.role === 'superadmin' && <SuperAdminView />}
        {currentUser.role === 'school_admin' && <SchoolAdminView />}
        {currentUser.role === 'agent' && <AgentView />}
        {currentUser.role === 'parent' && (
          <ParentView onOpenAddChild={() => setIsAddChildModalOpen(true)} />
        )}
      </main>

      <footer className="border-t border-slate-200 py-4 bg-white text-center text-xs text-slate-400">
        ParentEcole — Session active : <strong>{currentUser.email}</strong> ({currentUser.role})
      </footer>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      <AddChildModal
        isOpen={isAddChildModalOpen}
        onClose={() => setIsAddChildModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
