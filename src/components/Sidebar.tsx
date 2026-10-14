import React, { useState, useEffect } from 'react';
import { useEduStore } from '../services/store';
import { subscribeFirebaseStatus, FirebaseSyncState } from '../services/firebase';
import { UserRole } from '../types';
import {
  School,
  Home,
  Bell,
  Phone,
  Shield,
  BookOpen,
  HeartHandshake,
  Sparkles,
  Users,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  X,
  LogOut,
  RotateCcw,
  UserCheck,
  CreditCard,
  Lock,
  FileText,
  KeyRound,
  CheckSquare,
  MessageCircle,
  Award
} from 'lucide-react';

interface SubMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
}

interface RoleMenuGroup {
  role: UserRole;
  title: string;
  roleBadge: string;
  color: string;
  icon: React.ReactNode;
  subItems: SubMenuItem[];
}

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsedDesktop: boolean;
  onToggleCollapseDesktop: () => void;
  activeView: string;
  setActiveView: (view: string) => void;
  activeSubTab?: string;
  setActiveSubTab?: (tab: string) => void;
  onOpenLoginModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpenMobile,
  onCloseMobile,
  isCollapsedDesktop,
  onToggleCollapseDesktop,
  activeView,
  setActiveView,
  activeSubTab,
  setActiveSubTab,
  onOpenLoginModal,
}) => {
  const {
    schoolProfile,
    currentUser,
    switchRole,
    logout,
    resetToDefaultData,
    students,
    journalEntries,
    internalGrades,
    caseRecords,
    paiAssessments,
    users,
    starAwards,
    messages
  } = useEduStore();

  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showRoleSwitcherDropdown, setShowRoleSwitcherDropdown] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState<FirebaseSyncState>({
    isConnected: true,
    projectId: 'onlineclassjournalyuliono',
    lastSyncTime: null,
    error: null,
    syncedCollectionsCount: 0,
  });

  useEffect(() => {
    return subscribeFirebaseStatus((status) => setFirebaseStatus(status));
  }, []);

  // Accordion open/close state for each role
  // Default open the active user's role accordion
  const [openAccordions, setOpenAccordions] = useState<{ [roleKey: string]: boolean }>({
    admin: true,
    guru_kelas: true,
    guru_bk: false,
    guru_pai: false,
    orangtua: false,
  });

  // Whenever currentUser changes, ensure their role accordion is open
  useEffect(() => {
    if (currentUser?.role) {
      setOpenAccordions((prev) => ({
        ...prev,
        [currentUser.role]: true,
      }));
    }
  }, [currentUser?.role]);

  const toggleAccordion = (roleKey: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [roleKey]: !prev[roleKey],
    }));
  };

  // Structured Role Navigation Groups
  const roleMenuGroups: RoleMenuGroup[] = [
    {
      role: 'admin',
      title: 'Admin SIM',
      roleBadge: 'Administrator',
      color: 'text-slate-900 bg-slate-100 border-slate-300',
      icon: <Shield className="w-4 h-4 text-slate-800 shrink-0" />,
      subItems: [
        {
          id: 'profil',
          label: 'Profil & Kop Sekolah',
          icon: <School className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'kurikulum',
          label: 'Kurikulum (CP & TP)',
          icon: <BookOpen className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'password',
          label: 'Bantuan Reset Sandi',
          icon: <KeyRound className="w-4 h-4 shrink-0" />,
          badge: users.length,
        },
        {
          id: 'laporan',
          label: 'Rekap Eksekutif Sekolah',
          icon: <FileText className="w-4 h-4 shrink-0" />,
        },
      ],
    },
    {
      role: 'guru_kelas',
      title: 'Guru Kelas',
      roleBadge: 'Wali Kelas',
      color: 'text-indigo-900 bg-indigo-50 border-indigo-200',
      icon: <BookOpen className="w-4 h-4 text-indigo-700 shrink-0" />,
      subItems: [
        {
          id: 'murid',
          label: 'Daftar Murid Kelas',
          icon: <Users className="w-4 h-4 shrink-0" />,
          badge: students.length,
        },
        {
          id: 'kartu',
          label: 'Kartu Akses Login Ortu',
          icon: <CreditCard className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'jurnal',
          label: 'Jurnal Harian Mengajar',
          icon: <BookOpen className="w-4 h-4 shrink-0" />,
          badge: journalEntries.length,
        },
        {
          id: 'penilaian',
          label: 'Buku Nilai Guru (Internal)',
          icon: <Lock className="w-4 h-4 text-amber-600 shrink-0" />,
        },
        {
          id: 'bintang',
          label: 'Apresiasi & Sanksi Bintang',
          icon: <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />,
        },
        {
          id: 'rekap',
          label: 'Rekap & Unduh Berkas',
          icon: <FileText className="w-4 h-4 text-emerald-600 shrink-0" />,
        },
        {
          id: 'chat',
          label: 'Chat Konsultasi Ortu',
          icon: <MessageCircle className="w-4 h-4 shrink-0" />,
          badge: messages.filter((m) => !m.isRead && m.senderRole === 'orangtua').length || undefined,
        },
      ],
    },
    {
      role: 'guru_bk',
      title: 'Guru BK',
      roleBadge: 'Bimbingan Konseling',
      color: 'text-rose-900 bg-rose-50 border-rose-200',
      icon: <HeartHandshake className="w-4 h-4 text-rose-600 shrink-0" />,
      subItems: [
        {
          id: 'kasus',
          label: 'Jurnal Kasus & Konseling',
          icon: <HeartHandshake className="w-4 h-4 shrink-0" />,
          badge: caseRecords.length,
        },
        {
          id: 'bintang',
          label: 'Apresiasi & Sanksi Sikap',
          icon: <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />,
        },
        {
          id: 'penilaian',
          label: 'Nilai Sikap & Minat Bakat',
          icon: <Lock className="w-4 h-4 text-amber-600 shrink-0" />,
        },
        {
          id: 'rekap',
          label: 'Rekap & Unduh Berkas BK',
          icon: <FileText className="w-4 h-4 text-emerald-600 shrink-0" />,
        },
        {
          id: 'chat',
          label: 'Konseling Chat Ortu',
          icon: <MessageCircle className="w-4 h-4 shrink-0" />,
        },
      ],
    },
    {
      role: 'guru_pai',
      title: 'Guru PAI',
      roleBadge: 'Pendidikan Agama Islam',
      color: 'text-teal-900 bg-teal-50 border-teal-200',
      icon: <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />,
      subItems: [
        {
          id: 'penilaian',
          label: 'Matriks Penilaian Fleksibel',
          icon: <CheckSquare className="w-4 h-4 shrink-0" />,
          badge: paiAssessments.length,
        },
        {
          id: 'nilai_internal',
          label: 'Buku Nilai Internal PAI',
          icon: <Lock className="w-4 h-4 text-amber-600 shrink-0" />,
        },
        {
          id: 'bintang',
          label: 'Apresiasi & Sanksi Ibadah',
          icon: <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />,
        },
        {
          id: 'rekap',
          label: 'Rekap & Unduh Berkas PAI',
          icon: <FileText className="w-4 h-4 text-emerald-600 shrink-0" />,
        },
        {
          id: 'chat',
          label: 'Chat Pembiasaan Ibadah',
          icon: <MessageCircle className="w-4 h-4 shrink-0" />,
        },
      ],
    },
    {
      role: 'orangtua',
      title: 'Orang Tua',
      roleBadge: 'Wali Murid',
      color: 'text-amber-900 bg-amber-50 border-amber-200',
      icon: <Users className="w-4 h-4 text-amber-600 shrink-0" />,
      subItems: [
        {
          id: 'bintang',
          label: 'Bintang & Prestasi Anak',
          icon: <Award className="w-4 h-4 text-amber-500 shrink-0" />,
        },
        {
          id: 'jurnal',
          label: 'Jurnal Harian Kelas',
          icon: <BookOpen className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'bk',
          label: 'Catatan Kasus & Konseling',
          icon: <HeartHandshake className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'pai',
          label: 'Capaian Ibadah PAI',
          icon: <Sparkles className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'chat',
          label: 'Chat Guru Pendamping',
          icon: <MessageCircle className="w-4 h-4 shrink-0" />,
        },
      ],
    },
  ];

  const handleSubItemClick = (role: UserRole, subItemId: string) => {
    // If not logged in as this role, switch demo role so the user immediately sees the requested view
    if (currentUser?.role !== role) {
      switchRole(role);
    }
    setActiveView('dashboard');
    if (setActiveSubTab) {
      setActiveSubTab(subItemId);
    }
    onCloseMobile();
  };

  const handleGeneralViewClick = (view: string) => {
    setActiveView(view);
    onCloseMobile();
  };

  const rolesDemoList: { role: UserRole; label: string; icon: React.ReactNode }[] = [
    { role: 'admin', label: 'Admin SIM', icon: <Shield className="w-3.5 h-3.5" /> },
    { role: 'guru_kelas', label: 'Guru Kelas', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { role: 'guru_bk', label: 'Guru BK', icon: <HeartHandshake className="w-3.5 h-3.5" /> },
    { role: 'guru_pai', label: 'Guru PAI', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { role: 'orangtua', label: 'Orang Tua', icon: <Users className="w-3.5 h-3.5" /> },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-slate-800 border-r border-slate-200 select-none">
      {/* 1. School Header Strip */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3 bg-gradient-to-b from-slate-50/80 to-white">
        <div
          onClick={() => handleGeneralViewClick('landing')}
          className="flex items-center gap-3 cursor-pointer min-w-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-700 to-indigo-950 flex items-center justify-center text-white shadow-md shadow-indigo-100 shrink-0">
            <School className="w-5 h-5 text-indigo-100" />
          </div>
          {!isCollapsedDesktop && (
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-slate-900 leading-tight truncate">
                {schoolProfile.name}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                <span className="font-semibold text-indigo-700">{schoolProfile.classGrade}</span>
                <span aria-hidden="true">·</span>
                <span>TA {schoolProfile.academicYear}</span>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          aria-label="Tutup Menu"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapseDesktop}
          className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title={isCollapsedDesktop ? 'Perluas Sidebar' : 'Kecilkan Sidebar'}
        >
          {isCollapsedDesktop ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* 2. Active User & Role Switcher Bar */}
      {!isCollapsedDesktop && (
        <div className="p-3 mx-3 my-2 bg-slate-50 rounded-xl border border-slate-200/90">
          {currentUser ? (
            <div className="relative">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate leading-none">
                      {currentUser.name}
                    </p>
                    <p className="text-[11px] text-indigo-700 font-medium truncate mt-0.5">
                      {currentUser.title}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowRoleSwitcherDropdown(!showRoleSwitcherDropdown)}
                  className="px-2 py-1 rounded-md text-[11px] font-bold bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 hover:text-indigo-700 transition-colors shrink-0"
                  title="Ganti Peran Pengguna"
                >
                  Ganti
                </button>
              </div>

              {/* Quick Switch Dropdown */}
              {showRoleSwitcherDropdown && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                    Ganti Peran Demo
                  </p>
                  <div className="space-y-1">
                    {rolesDemoList.map((r) => {
                      const isCurrent = currentUser.role === r.role;
                      return (
                        <button
                          key={r.role}
                          onClick={() => {
                            switchRole(r.role);
                            setShowRoleSwitcherDropdown(false);
                            setActiveView('dashboard');
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            isCurrent
                              ? 'bg-indigo-600 text-white'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {r.icon}
                            <span>{r.label}</span>
                          </div>
                          {isCurrent && <span className="text-[10px]">Aktif</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenLoginModal}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <UserCheck className="w-4 h-4" />
              <span>Masuk Aplikasi</span>
            </button>
          )}
        </div>
      )}

      {/* 3. Navigation Links & Role Accordions */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 scrollbar-thin">
        {/* Main General Section */}
        <div>
          {!isCollapsedDesktop && (
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Menu Utama
            </p>
          )}
          <div className="space-y-1">
            <button
              onClick={() => handleGeneralViewClick('landing')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeView === 'landing'
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title="Halaman Utama"
            >
              <Home className="w-4 h-4 shrink-0 text-slate-500" />
              {!isCollapsedDesktop && <span>Halaman Utama</span>}
            </button>

            <button
              onClick={() => handleGeneralViewClick('pengumuman')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeView === 'pengumuman'
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title="Pengumuman Sekolah"
            >
              <Bell className="w-4 h-4 shrink-0 text-slate-500" />
              {!isCollapsedDesktop && <span>Pengumuman Sekolah</span>}
            </button>

            <button
              onClick={() => handleGeneralViewClick('kontak')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeView === 'kontak'
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title="Kontak Guru"
            >
              <Phone className="w-4 h-4 shrink-0 text-slate-500" />
              {!isCollapsedDesktop && <span>Kontak Guru & Tendik</span>}
            </button>
          </div>
        </div>

        {/* Role-Based Accordions */}
        <div>
          {!isCollapsedDesktop && (
            <div className="px-3 flex items-center justify-between mb-1.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Modul Peran Pengguna
              </p>
              <span className="text-[10px] text-slate-400 font-medium">Dropdown</span>
            </div>
          )}

          <div className="space-y-2">
            {roleMenuGroups.map((group) => {
              const isRoleActive = currentUser?.role === group.role;
              const isOpen = openAccordions[group.role] ?? false;

              return (
                <div
                  key={group.role}
                  className={`rounded-xl border transition-colors ${
                    isRoleActive
                      ? 'border-indigo-200 bg-white shadow-2xs'
                      : 'border-slate-200/80 bg-slate-50/40'
                  }`}
                >
                  {/* Accordion Header / Role Parent Button */}
                  <button
                    onClick={() => {
                      if (isCollapsedDesktop) {
                        onToggleCollapseDesktop();
                      }
                      toggleAccordion(group.role);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors ${
                      isRoleActive ? 'text-indigo-950 font-bold' : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-lg ${isRoleActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200/70 text-slate-700'}`}>
                        {group.icon}
                      </div>
                      {!isCollapsedDesktop && (
                        <div className="min-w-0">
                          <span className="text-xs font-bold block truncate leading-snug">
                            {group.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {group.roleBadge}
                          </span>
                        </div>
                      )}
                    </div>

                    {!isCollapsedDesktop && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isRoleActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Peran Aktif Saat Ini" />
                        )}
                        {isOpen ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    )}
                  </button>

                  {/* Sub-menu Items (Dropdown/Accordion Content) */}
                  {!isCollapsedDesktop && isOpen && (
                    <div className="px-2 pb-2 pt-1 border-t border-slate-100 space-y-0.5 animate-in fade-in slide-in-from-top-1">
                      {group.subItems.map((sub) => {
                        const isSubActive =
                          activeView === 'dashboard' &&
                          currentUser?.role === group.role &&
                          activeSubTab === sub.id;

                        return (
                          <button
                            key={sub.id}
                            onClick={() => handleSubItemClick(group.role, sub.id)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              isSubActive
                                ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className={isSubActive ? 'text-white' : 'text-slate-400'}>
                                {sub.icon}
                              </span>
                              <span className="truncate">{sub.label}</span>
                            </div>

                            {sub.badge !== undefined && (
                              <span
                                className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                                  isSubActive
                                    ? 'bg-indigo-800 text-indigo-100'
                                    : 'bg-slate-200/70 text-slate-600'
                                }`}
                              >
                                {sub.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Bottom Footer & Session Controls */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70 space-y-2">
        {!isCollapsedDesktop && (
          <div className="px-1 py-1 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  firebaseStatus.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="text-slate-600 font-medium truncate font-mono">
                {firebaseStatus.projectId}
              </span>
            </div>
            <span className="text-emerald-700 font-bold shrink-0">Realtime</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs">
          <button
            onClick={() => setShowConfirmReset(true)}
            className="flex items-center gap-1.5 text-slate-500 hover:text-rose-700 transition-colors p-1 rounded-md"
            title="Kembalikan data ke contoh awal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {!isCollapsedDesktop && <span className="text-[11px] font-medium">Reset Data Demo</span>}
          </button>

          {currentUser && (
            <button
              onClick={() => {
                logout();
                setActiveView('landing');
              }}
              className="flex items-center gap-1.5 text-rose-600 hover:text-rose-800 transition-colors p-1 rounded-md font-semibold"
              title="Keluar Sesi"
            >
              <LogOut className="w-3.5 h-3.5" />
              {!isCollapsedDesktop && <span className="text-[11px]">Keluar</span>}
            </button>
          )}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-amber-600 mb-2">
              <RotateCcw className="w-5 h-5" />
              <h4 className="font-bold text-slate-900 text-sm">Kembalikan Data Demo?</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Semua perubahan jurnal, bintang, dan nilai akan di-reset ke data bawaan awal aplikasi.
            </p>
            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  resetToDefaultData();
                  setShowConfirmReset(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold"
              >
                Ya, Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar: Fixed on the left */}
      <aside
        className={`hidden lg:block fixed top-0 bottom-0 left-0 z-40 transition-all duration-200 ease-in-out ${
          isCollapsedDesktop ? 'w-20' : 'w-72'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* Mobile Off-canvas Drawer */}
      <aside
        className={`lg:hidden fixed top-0 bottom-0 left-0 z-50 w-80 max-w-[85vw] transform transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
