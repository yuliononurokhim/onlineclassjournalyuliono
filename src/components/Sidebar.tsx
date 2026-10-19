import React, { useState, useEffect, useMemo } from 'react';
import { useEduStore } from '../services/store';
import { subscribeFirebaseStatus, FirebaseSyncState } from '../services/firebase';
import { ImpersonateModal } from './common/ImpersonateModal';
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
  Award,
  Eye
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
    messages,
    isImpersonating,
    stopImpersonating
  } = useEduStore();

  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showImpersonateModal, setShowImpersonateModal] = useState(false);
  const [showRoleSwitcherDropdown, setShowRoleSwitcherDropdown] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState<FirebaseSyncState>({
    isConnected: false,
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
      setOpenAccordions((prev) => {
        if (prev[currentUser.role]) return prev;
        return {
          ...prev,
          [currentUser.role]: true,
        };
      });
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
          id: 'landing',
          label: 'Pengaturan Landing Page',
          icon: <Eye className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'kurikulum',
          label: 'Kurikulum (CP & TP)',
          icon: <BookOpen className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'guru',
          label: 'Manajemen Guru & Akun',
          icon: <UserCheck className="w-4 h-4 shrink-0" />,
          badge: users.filter((u) => u.role !== 'orangtua').length,
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
      title: 'Guru PAI dan Islamic Literacy',
      roleBadge: 'PAI & Islamic Literacy',
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

  // Identify linked student and stars if role is orangtua
  const linkedStudent = useMemo(() => {
    if (currentUser?.role !== 'orangtua') return null;
    if (currentUser.studentId) {
      const match = students.find((s) => s.id === currentUser.studentId);
      if (match) return match;
    }
    const cleanUser = currentUser.username.toLowerCase().replace(/^ortu_/, '');
    const cleanName = (currentUser.name || '').toLowerCase();

    // Check specific Yuliono student link
    if (cleanUser.includes('yuliono') || cleanName.includes('yuliono')) {
      const yuliMatch = students.find(
        (s) =>
          s.name.toLowerCase().includes('yuliono') ||
          s.parentName.toLowerCase().includes('yuliono') ||
          s.parentUsername.toLowerCase().includes('yuliono')
      );
      if (yuliMatch) return yuliMatch;
    }

    return (
      students.find((s) => s.parentUsername.toLowerCase() === currentUser.username.toLowerCase()) ||
      students.find(
        (s) =>
          s.name.toLowerCase() === cleanUser ||
          s.name.toLowerCase().includes(cleanUser) ||
          cleanUser.includes(s.name.toLowerCase().split(' ')[0]) ||
          (cleanName && s.name.toLowerCase().includes(cleanName.split(' ')[0]))
      ) ||
      students.find(
        (s) =>
          s.parentName.toLowerCase().includes(cleanUser) ||
          cleanUser.includes(s.parentName.toLowerCase()) ||
          (cleanName && (s.parentName.toLowerCase().includes(cleanName) || cleanName.includes(s.parentName.toLowerCase())))
      ) ||
      students.find((s) => s.nisn === currentUser.username) ||
      students[0]
    );
  }, [currentUser, students]);

  const studentStars = linkedStudent
    ? starAwards.filter((s) => s.studentId === linkedStudent.id)
    : [];
  const totalRewards = studentStars
    .filter((s) => s.type !== 'penalty')
    .reduce((sum, s) => sum + s.starsCount, 0);
  const totalPenalties = studentStars
    .filter((s) => s.type === 'penalty')
    .reduce((sum, s) => sum + s.starsCount, 0);
  const netStars = Math.max(0, totalRewards - totalPenalties);

  const handleSubItemClick = (role: UserRole, subItemId: string) => {
    // Only switch role if admin is testing demo roles
    if (currentUser?.role === 'admin' && role !== 'admin') {
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
    requestAnimationFrame(() => {
      if (view === 'landing') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        document.getElementById(view)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    onCloseMobile();
  };

  const rolesDemoList: { role: UserRole; label: string; icon: React.ReactNode }[] = [
    { role: 'admin', label: 'Admin SIM', icon: <Shield className="w-3.5 h-3.5" /> },
    { role: 'guru_kelas', label: 'Guru Kelas', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { role: 'guru_bk', label: 'Guru BK', icon: <HeartHandshake className="w-3.5 h-3.5" /> },
    { role: 'guru_pai', label: 'Guru PAI dan Islamic Literacy', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { role: 'orangtua', label: 'Orang Tua', icon: <Users className="w-3.5 h-3.5" /> },
  ];

  // Find current user's menu group
  const currentUserGroup = currentUser
    ? roleMenuGroups.find((g) => g.role === currentUser.role)
    : null;

  const sidebarContent = (
    <div className="sidebar-panel flex flex-col h-full bg-white text-slate-800 border-r border-slate-200 select-none">
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

      {/* 2. Active User & Role Display Bar */}
      {!isCollapsedDesktop && (
        <div className="p-3 mx-3 my-2 bg-slate-50 rounded-xl border border-slate-200/90">
          {currentUser ? (
            <div className="relative">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      currentUser.role === 'orangtua'
                        ? 'bg-amber-500 text-white'
                        : currentUser.role === 'admin'
                        ? 'bg-slate-800 text-white'
                        : currentUser.role === 'guru_kelas'
                        ? 'bg-indigo-600 text-white'
                        : currentUser.role === 'guru_bk'
                        ? 'bg-rose-600 text-white'
                        : 'bg-teal-600 text-white'
                    }`}
                  >
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate leading-none">
                      {currentUser.name}
                    </p>
                    <p className="text-[11px] text-indigo-700 font-medium truncate mt-0.5">
                      {currentUser.role === 'orangtua' && linkedStudent
                        ? `Wali ${linkedStudent.name.split(' ')[0]}`
                        : currentUser.title}
                    </p>
                  </div>
                </div>

                {/* Impersonate controls */}
                {isImpersonating ? (
                  <button
                    onClick={() => stopImpersonating()}
                    className="px-2 py-1 rounded-md text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors shrink-0 shadow-2xs"
                    title="Kembali ke Akun Administrator"
                  >
                    Kembali Admin
                  </button>
                ) : currentUser.role === 'admin' ? (
                  <button
                    onClick={() => setShowImpersonateModal(true)}
                    className="px-2 py-1 rounded-md text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 transition-colors shrink-0 flex items-center gap-1"
                    title="Beralih ke akun pengguna lain (Impersonate)"
                  >
                    <Users className="w-3 h-3" />
                    <span>Beralih</span>
                  </button>
                ) : null}
              </div>
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

      {/* 3. Navigation Links & Strict Role-Based Portal */}
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

        {/* ROLE CASE 1: ORANG TUA -> ONLY SHOWS THIS STUDENT'S PORTAL */}
        {currentUser?.role === 'orangtua' && linkedStudent && (
          <div className="space-y-2.5">
            {!isCollapsedDesktop && (
              <div className="px-3 flex items-center justify-between mb-1">
                <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                  Portal Siswa & Wali Murid
                </p>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                  Kelas {schoolProfile.classGrade}
                </span>
              </div>
            )}

            {/* Child Profile Highlight Card */}
            {!isCollapsedDesktop && (
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white border border-amber-200/90 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black flex items-center justify-center text-base shadow-sm shrink-0">
                    {linkedStudent.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-slate-900 truncate">
                      {linkedStudent.name}
                    </p>
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                      NISN: <span className="font-bold text-slate-700">{linkedStudent.nisn}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 font-medium">Bintang Karakter:</span>
                  <div className="flex items-center gap-1 font-bold text-amber-900">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span>{netStars} Bintang</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      (+{totalRewards}/-{totalPenalties})
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Student Navigation Items (No Admin, No Guru menus!) */}
            <div className="space-y-1">
              {roleMenuGroups
                .find((g) => g.role === 'orangtua')
                ?.subItems.map((sub) => {
                  const isSubActive =
                    activeView === 'dashboard' && activeSubTab === sub.id;

                  return (
                    <button
                      key={sub.id}
                      onClick={() => handleSubItemClick('orangtua', sub.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isSubActive
                          ? 'bg-amber-500 text-white font-bold shadow-xs'
                          : 'text-slate-700 hover:bg-amber-50/80 hover:text-amber-900'
                      }`}
                      title={sub.label}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className={isSubActive ? 'text-white' : 'text-amber-600'}>
                          {sub.icon}
                        </span>
                        {!isCollapsedDesktop && <span className="truncate">{sub.label}</span>}
                      </div>

                      {sub.badge !== undefined && !isCollapsedDesktop && (
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                            isSubActive
                              ? 'bg-amber-700 text-white'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {sub.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* ROLE CASE 2: TEACHERS & ADMIN (GURU KELAS, GURU BK, GURU PAI, ADMIN) -> STRICTLY THEIR OWN MODULE */}
        {currentUser && currentUser.role !== 'orangtua' && currentUserGroup && (
          <div className="space-y-2">
            {!isCollapsedDesktop && (
              <div className="px-3 flex items-center justify-between mb-1.5">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {currentUserGroup.title.toUpperCase()}
                </p>
                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  {currentUserGroup.roleBadge}
                </span>
              </div>
            )}

            <div className="rounded-xl border border-indigo-200/90 bg-white shadow-2xs overflow-hidden">
              <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                  {currentUserGroup.icon}
                </div>
                {!isCollapsedDesktop && (
                  <div className="min-w-0">
                    <span className="text-xs font-bold block text-slate-900 truncate">
                      Modul {currentUserGroup.title}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Akses Resmi {currentUserGroup.roleBadge}
                    </span>
                  </div>
                )}
              </div>

              {/* Sub-menu Items */}
              <div className="p-1.5 space-y-0.5">
                {currentUserGroup.subItems.map((sub) => {
                  const isSubActive =
                    activeView === 'dashboard' && activeSubTab === sub.id;

                  return (
                    <button
                      key={sub.id}
                      onClick={() => handleSubItemClick(currentUserGroup.role, sub.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                        isSubActive
                          ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                      title={sub.label}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className={isSubActive ? 'text-white' : 'text-slate-400'}>
                          {sub.icon}
                        </span>
                        {!isCollapsedDesktop && <span className="truncate">{sub.label}</span>}
                      </div>

                      {sub.badge !== undefined && !isCollapsedDesktop && (
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
            </div>

            {/* Admin-Only Supervisory Accordion (Only for Admin to audit other roles) */}
            {currentUser.role === 'admin' && !isCollapsedDesktop && (
              <div className="pt-2 border-t border-slate-200/70">
                <button
                  onClick={() => toggleAccordion('supervisi_admin')}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800"
                >
                  <span>Supervisi & Pratinjau Peran</span>
                  {openAccordions['supervisi_admin'] ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>

                {openAccordions['supervisi_admin'] && (
                  <div className="space-y-1 mt-1 p-1 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-[10px] text-slate-400 px-2 py-1">
                      Mode khusus Administrator untuk menginspeksi modul peran lain:
                    </p>
                    {roleMenuGroups
                      .filter((g) => g.role !== 'admin')
                      .map((g) => (
                        <button
                          key={g.role}
                          onClick={() => {
                            switchRole(g.role);
                            setActiveView('dashboard');
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-white hover:text-indigo-700 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {g.icon}
                            <span>{g.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">Pratinjau</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* 4. Bottom Footer & Session Controls */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70 space-y-2">
        {!isCollapsedDesktop && (
          <div className="px-1 py-1 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  firebaseStatus.error
                    ? 'bg-rose-500'
                    : firebaseStatus.isConnected
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-amber-500'
                }`}
              />
              <span className="text-slate-600 font-medium truncate font-mono">
                {firebaseStatus.projectId}
              </span>
            </div>
            <span
              className={`font-bold shrink-0 ${
                firebaseStatus.error
                  ? 'text-rose-700'
                  : firebaseStatus.isConnected
                    ? 'text-emerald-700'
                    : 'text-amber-700'
              }`}
              title={firebaseStatus.error || undefined}
            >
              {firebaseStatus.error ? 'Periksa' : firebaseStatus.isConnected ? 'Realtime' : 'Menyambungkan'}
            </span>
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
        className={`app-sidebar hidden lg:block fixed top-0 bottom-0 left-0 z-40 transition-all duration-200 ease-in-out ${
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
        className={`app-sidebar lg:hidden fixed top-0 bottom-0 left-0 z-50 w-80 max-w-[85vw] transform transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Impersonate Modal */}
      <ImpersonateModal
        isOpen={showImpersonateModal}
        onClose={() => setShowImpersonateModal(false)}
      />
    </>
  );
};
