import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  GraduationCap,
  Wifi,
  WifiOff,
  User,
  LogOut,
  Shield,
  School as SchoolIcon,
  UserCheck,
  Heart,
  Plus,
} from 'lucide-react';

interface HeaderProps {
  onOpenLogin: () => void;
  onOpenAddChild?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenLogin, onOpenAddChild }) => {
  const {
    currentUser,
    logout,
    isOnline,
    lastSyncTime,
    schools,
    linkedStudentIds,
    students,
    activeStudentId,
    setActiveStudentId,
  } = useApp();

  // Current school name if applicable
  const currentSchool = currentUser?.schoolId
    ? schools.find((s) => s.id === currentUser.schoolId)
    : null;

  // Active child for parent
  const activeStudent = activeStudentId ? students.find((s) => s.id === activeStudentId) : null;
  const linkedStudents = students.filter((s) => linkedStudentIds.includes(s.id));

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">ParentEcole</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {currentUser?.role === 'superadmin'
                    ? 'SuperAdmin'
                    : currentUser?.role === 'school_admin'
                    ? 'Admin École'
                    : currentUser?.role === 'agent'
                    ? `Agent (${currentUser.agentFunction})`
                    : currentUser
                    ? 'Espace Parent'
                    : 'Portail Éducatif'}
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                {currentSchool ? currentSchool.name : 'Suivi scolaire & recouvrement en temps réel'}
              </p>
            </div>
          </div>

          {/* Center: Subtle connection indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Connecté à l'établissement</span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* User Session Info or Sign In button */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-800 leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                    {currentUser.email}
                  </div>
                </div>

                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-semibold text-sm shadow-xs border border-white">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>

                <button
                  id="btn-logout"
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Se déconnecter"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="btn-open-login"
                onClick={onOpenLogin}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
              >
                <User className="w-4 h-4" />
                <span>Connexion Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Parent Child Switcher Bar if current user is a Parent */}
        {currentUser?.role === 'parent' && linkedStudents.length > 0 && (
          <div className="py-2 border-t border-slate-100 flex items-center justify-between gap-3 overflow-x-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                Vos enfants suivis :
              </span>
              <div className="flex items-center gap-1.5">
                {linkedStudents.map((child) => {
                  const isActive = child.id === activeStudentId;
                  return (
                    <button
                      key={child.id}
                      onClick={() => setActiveStudentId(child.id)}
                      className={`px-3 py-1 text-xs rounded-full font-medium transition-all flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>{child.firstName}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-600'}`}>
                        {child.className}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {onOpenAddChild && (
              <button
                onClick={onOpenAddChild}
                className="shrink-0 flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-full transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un enfant (ID)</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
