import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Shield,
  School as SchoolIcon,
  Plus,
  Users,
  Building,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
  LogIn,
  Search,
  Sparkles,
  DollarSign,
  Lock,
  KeyRound,
  Check,
} from 'lucide-react';

export const SuperAdminView: React.FC = () => {
  const {
    schools,
    createSchool,
    toggleSchoolStatus,
    students,
    classes,
    agents,
    login,
    superAdminPin,
    updateSuperAdminPin,
  } = useApp();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // SuperAdmin PIN edit state
  const [isEditingPin, setIsEditingPin] = useState(false);
  const [newPinInput, setNewPinInput] = useState(superAdminPin);
  const [pinSavedNotification, setPinSavedNotification] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminPassword, setAdminPassword] = useState('1234');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState('$');

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPinInput.trim()) return;
    updateSuperAdminPin(newPinInput.trim());
    setIsEditingPin(false);
    setPinSavedNotification(true);
    setTimeout(() => setPinSavedNotification(false), 3000);
  };

  const handleCreateSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !adminEmail.trim() || !adminName.trim()) return;

    createSchool({
      name: name.trim(),
      adminEmail: adminEmail.trim(),
      adminName: adminName.trim(),
      password: adminPassword.trim() || '1234',
      phone: phone.trim() || '+243 00 000 0000',
      address: address.trim() || 'Kinshasa / RDC',
      currency,
    });

    // Reset form
    setName('');
    setAdminEmail('');
    setAdminName('');
    setAdminPassword('1234');
    setPhone('');
    setAddress('');
    setShowCreateModal(false);
  };

  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.adminEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.adminName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 backdrop-blur-md border border-purple-400/30 flex items-center justify-center text-purple-300 shadow-inner">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/30">
                  Panel SuperAdministrateur
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
                Gestionnaire Central ParentEcole
              </h1>
              <p className="text-sm text-purple-200 mt-1">
                Connecté avec le compte maître : <strong className="text-white">Mughenyakavale@gmail</strong>
              </p>
            </div>
          </div>

          <button
            id="btn-create-school-modal"
            onClick={() => setShowCreateModal(true)}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Créer une École & Assigner un Directeur</span>
          </button>
        </div>

        {/* Global Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-purple-500/20">
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3.5 border border-white/10">
            <div className="text-xs text-purple-200 font-medium">Écoles Enregistrées</div>
            <div className="text-2xl font-bold mt-0.5">{schools.length}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3.5 border border-white/10">
            <div className="text-xs text-purple-200 font-medium">Directeurs d'Écoles</div>
            <div className="text-2xl font-bold mt-0.5">{schools.filter((s) => s.active).length}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3.5 border border-white/10">
            <div className="text-xs text-purple-200 font-medium">Total Classes Globales</div>
            <div className="text-2xl font-bold mt-0.5">{classes.length}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3.5 border border-white/10">
            <div className="text-xs text-purple-200 font-medium">Total Élèves Suivis</div>
            <div className="text-2xl font-bold mt-0.5">{students.length}</div>
          </div>
        </div>
      </div>

      {/* SuperAdmin Master Security Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Code PIN de Sécurité SuperAdmin</span>
              {pinSavedNotification && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Enregistré !
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ce code confidentiel sécurise l'accès à <span className="font-mono text-slate-700 font-semibold">Mughenyakavale@gmail</span> lors de la connexion Google.
            </p>
          </div>
        </div>

        {isEditingPin ? (
          <form onSubmit={handleUpdatePin} className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              required
              value={newPinInput}
              onChange={(e) => setNewPinInput(e.target.value)}
              placeholder="Nouveau code PIN..."
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-600"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition"
            >
              Enregistrer
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditingPin(false);
                setNewPinInput(superAdminPin);
              }}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Annuler
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs font-bold text-slate-800">
              <Lock className="w-3.5 h-3.5 text-purple-600" />
              <span>{superAdminPin}</span>
            </div>
            <button
              onClick={() => setIsEditingPin(true)}
              className="px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition"
            >
              Modifier le code PIN
            </button>
          </div>
        )}
      </div>

      {/* Schools Management Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Établissements & Administrateurs-École</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Chaque école possède son directeur (admin-école). Lorsqu'il se connecte avec son adresse email, il accède à son espace de gestion dédié.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Rechercher école ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* List of Schools */}
        <div className="divide-y divide-slate-100">
          {filteredSchools.map((school) => {
            const schoolClasses = classes.filter((c) => c.schoolId === school.id);
            const schoolStudents = students.filter((s) => s.schoolId === school.id);
            const schoolAgents = agents.filter((a) => a.schoolId === school.id);

            return (
              <div key={school.id} className="p-5 sm:p-6 hover:bg-slate-50/70 transition">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 font-bold flex items-center justify-center">
                        <Building className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-slate-900">{school.name}</h3>
                          {school.active ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Actif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              <XCircle className="w-3 h-3" /> Suspendu
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            Email Admin : <strong className="text-slate-800">{school.adminEmail}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            Directeur : {school.adminName}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {school.address}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* School Stats Pill */}
                    <div className="flex flex-wrap items-center gap-3 pl-13 pt-1">
                      <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
                        <strong>{schoolClasses.length}</strong> Classes
                      </span>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
                        <strong>{schoolStudents.length}</strong> Élèves inscrits
                      </span>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
                        <strong>{schoolAgents.length}</strong> Agents (Surveillants, Profs, Caissiers)
                      </span>
                      <span className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md border border-purple-200">
                        Devise : <strong>{school.currency}</strong>
                      </span>
                      <span className="text-xs bg-indigo-50 text-indigo-900 font-mono px-2.5 py-1 rounded-md border border-indigo-200 flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-indigo-600" />
                        Code Directeur : <strong>{school.password || '1234'}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Actions for this school */}
                  <div className="flex items-center gap-2 self-end lg:self-center">
                    <button
                      onClick={() => toggleSchoolStatus(school.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                        school.active
                          ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                          : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      {school.active ? 'Désactiver' : 'Réactiver'}
                    </button>

                    <button
                      id={`btn-login-as-${school.id}`}
                      onClick={() => login(school.adminEmail, school.password || '1234', school.adminName)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition"
                      title="Inspecter en tant que directeur de cette école"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Accéder à l'espace école</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredSchools.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              Aucune école ne correspond à votre recherche.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create School & Assign Admin-École */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in">
            <div className="bg-gradient-to-r from-purple-800 to-indigo-800 p-5 text-white">
              <h3 className="text-lg font-bold">Créer une École & Assigner son Directeur</h3>
              <p className="text-xs text-purple-200 mt-0.5">
                L'adresse email choisie deviendra l'identifiant de connexion de l'admin-école.
              </p>
            </div>

            <form onSubmit={handleCreateSchool} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nom de l'établissement *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Collège Frère Alingba"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Admin-École *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="directeur.alingba@gmail.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nom du Directeur *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Prof. Justin Malonda"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mot de Passe / Code d'Accès Directeur *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Mot de passe d'accès"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Transmettez ce mot de passe au directeur pour qu'il puisse déverrouiller son espace école.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Téléphone
                  </label>
                  <input
                    type="text"
                    placeholder="+243 81 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Devise monétaire
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="$">Dollar Américain ($)</option>
                    <option value="FC">Franc Congolais (FC)</option>
                    <option value="€">Euro (€)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Adresse de l'école
                </label>
                <input
                  type="text"
                  placeholder="ex: Blvd Lumumba N° 88, Limete"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm"
                >
                  Créer et enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
