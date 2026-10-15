import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useEduStore } from '../services/store';
import { subscribeFirebaseStatus, FirebaseSyncState } from '../services/firebase';
import { UserRole } from '../types';
import {
  Menu,
  School,
  UserCheck,
  ChevronRight,
  Shield,
  BookOpen,
  HeartHandshake,
  Sparkles,
  Users,
  LogOut,
  ChevronDown,
  Cloud,
  Bell,
  Star,
  ShieldAlert,
  Megaphone,
  CheckCheck,
  Clock,
  ExternalLink,
  X,
  Award,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface TopHeaderProps {
  onToggleMobileMenu: () => void;
  activeView: string;
  setActiveView: (view: string) => void;
  activeSubTab?: string;
  setActiveSubTab?: (tab: string) => void;
  onOpenLoginModal?: () => void;
}

interface NotificationItem {
  id: string;
  type: 'star' | 'case' | 'announcement';
  title: string;
  description: string;
  detail?: string;
  dateStr: string;
  relativeTime: string;
  timestamp: number;
  category: string;
  actorName?: string;
  studentName?: string;
  starsCount?: number;
  starType?: 'reward' | 'penalty';
  severity?: 'Ringan' | 'Sedang' | 'Perlu Perhatian';
  targetView: string;
  targetSubTab?: string;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onToggleMobileMenu,
  activeView,
  setActiveView,
  activeSubTab,
  setActiveSubTab,
  onOpenLoginModal,
}) => {
  const {
    schoolProfile,
    currentUser,
    logout,
    students,
    starAwards,
    caseRecords,
    announcements,
  } = useEduStore();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'star' | 'case' | 'announcement'>('all');

  const [firebaseStatus, setFirebaseStatus] = useState<FirebaseSyncState>({
    isConnected: true,
    projectId: 'onlineclassjournalyuliono',
    lastSyncTime: null,
    error: null,
    syncedCollectionsCount: 0,
  });

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Read notifications stored in localStorage
  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('edujournal_read_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    return subscribeFirebaseStatus((status) => setFirebaseStatus(status));
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotificationPanel(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format relative time helper
  const getRelativeTime = (timestamp: number, dateStr: string): string => {
    const diffMs = Date.now() - timestamp;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Baru saja';
    if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return dateStr;
  };

  // Compile role-filtered notifications
  const notifications: NotificationItem[] = useMemo(() => {
    const list: NotificationItem[] = [];

    // Identify linked student if orang tua
    const linkedStudent =
      currentUser?.role === 'orangtua'
        ? students.find((s) => s.id === currentUser.studentId) ||
          students.find((s) => s.parentUsername === currentUser.username)
        : null;

    // 1. Star Awards
    starAwards.forEach((star) => {
      // If Orang Tua, only include stars for their child
      if (currentUser?.role === 'orangtua') {
        if (linkedStudent && star.studentId !== linkedStudent.id && star.studentName !== linkedStudent.name) {
          return;
        }
      }

      const isReward = star.type === 'reward';
      list.push({
        id: `star-${star.id}`,
        type: 'star',
        title: isReward
          ? `Apresiasi Bintang: ${star.studentName}`
          : `Catatan Disiplin Bintang: ${star.studentName}`,
        description: star.note,
        detail: `${isReward ? '+' : '-'}${star.starsCount} ⭐ (${star.category})`,
        dateStr: star.date,
        relativeTime: getRelativeTime(star.timestamp || Date.now(), star.date),
        timestamp: star.timestamp || new Date(star.date).getTime(),
        category: star.category,
        actorName: star.awarderName,
        studentName: star.studentName,
        starsCount: star.starsCount,
        starType: star.type,
        targetView: 'dashboard',
        targetSubTab: 'bintang',
      });
    });

    // 2. BK Cases
    caseRecords.forEach((c) => {
      // If Orang Tua, only include if reported to parent and matches child
      if (currentUser?.role === 'orangtua') {
        if (!c.isReportedToParent) return;
        if (linkedStudent && c.studentId !== linkedStudent.id && c.studentName !== linkedStudent.name) {
          return;
        }
      }

      list.push({
        id: `case-${c.id}`,
        type: 'case',
        title: `Layanan BK: ${c.studentName}`,
        description: c.description,
        detail: `[${c.severity}] ${c.category} • Status: ${c.status}`,
        dateStr: c.date,
        relativeTime: getRelativeTime(c.timestamp || Date.now(), c.date),
        timestamp: c.timestamp || new Date(c.date).getTime(),
        category: c.category,
        actorName: c.counselorName,
        studentName: c.studentName,
        severity: c.severity,
        targetView: 'dashboard',
        targetSubTab: currentUser?.role === 'orangtua' ? 'bk' : 'kasus',
      });
    });

    // 3. School Announcements
    announcements.forEach((ann) => {
      // Approximate timestamp for announcements
      const annTimestamp = new Date(ann.date).getTime() || Date.now() - 86400000;
      list.push({
        id: `ann-${ann.id}`,
        type: 'announcement',
        title: `Pengumuman: ${ann.title}`,
        description: ann.content,
        detail: `Kategori: ${ann.category} • Oleh ${ann.author}`,
        dateStr: ann.date,
        relativeTime: getRelativeTime(annTimestamp, ann.date),
        timestamp: annTimestamp,
        category: ann.category,
        actorName: ann.author,
        targetView: 'pengumuman',
      });
    });

    // Sort by latest timestamp
    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [starAwards, caseRecords, announcements, currentUser, students]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    if (notificationFilter === 'all') return notifications;
    return notifications.filter((n) => n.type === notificationFilter);
  }, [notifications, notificationFilter]);

  // Unread count
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !readNotifIds.includes(n.id)).length;
  }, [notifications, readNotifIds]);

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadNotifIds(allIds);
    try {
      localStorage.setItem('edujournal_read_notifications', JSON.stringify(allIds));
    } catch (e) {
      console.warn('Could not save read notifications', e);
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    // Mark as read
    if (!readNotifIds.includes(item.id)) {
      const updated = [...readNotifIds, item.id];
      setReadNotifIds(updated);
      try {
        localStorage.setItem('edujournal_read_notifications', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save read notifications', e);
      }
    }

    // Navigate to target
    if (item.targetView) {
      setActiveView(item.targetView);
    }
    if (item.targetSubTab && setActiveSubTab) {
      setActiveSubTab(item.targetSubTab);
    }

    setShowNotificationPanel(false);
  };

  const getBreadcrumbTitle = () => {
    if (activeView === 'landing') return 'Halaman Utama';
    if (activeView === 'pengumuman') return 'Pengumuman Resmi Sekolah';
    if (activeView === 'kontak') return 'Kontak Guru & Tenaga Kependidikan';

    if (activeView === 'dashboard' && currentUser) {
      const roleMap: Record<UserRole, string> = {
        admin: 'Admin SIM',
        guru_kelas: 'Guru Kelas 4-A',
        guru_bk: 'Bimbingan Konseling (BK)',
        guru_pai: 'Pendidikan Agama Islam (PAI)',
        orangtua: 'Portal Wali Murid',
      };

      const tabLabels: Record<string, string> = {
        profil: 'Profil & Kop Sekolah',
        kurikulum: 'Kurikulum CP & TP',
        guru: 'Manajemen Guru & Akun',
        password: 'Reset Password',
        laporan: 'Rekap Eksekutif',
        murid: 'Daftar Murid',
        kartu: 'Kartu Akses Login Ortu',
        jurnal: 'Jurnal Harian Mengajar',
        penilaian: 'Buku Nilai Guru',
        bintang: 'Apresiasi & Sanksi Bintang',
        rekap: 'Rekap Berkas Laporan',
        chat: 'Ruang Chat Konsultasi',
        kasus: 'Jurnal Kasus BK',
        nilai_internal: 'Buku Nilai PAI',
        bk: 'Catatan Kasus & Konseling',
        pai: 'Capaian Ibadah PAI',
      };

      const roleName = roleMap[currentUser.role] || 'Dasbor';
      const tabName = activeSubTab ? tabLabels[activeSubTab] || activeSubTab : 'Dasbor';
      return `${roleName} / ${tabName}`;
    }

    return 'EduJournal SD';
  };

  return (
    <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 py-2.5 sm:py-3 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Mobile Menu Toggle & Title / Breadcrumb */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors shrink-0"
            aria-label="Buka Menu Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="hidden md:inline font-bold text-slate-900 truncate">
                {schoolProfile.name}
              </span>
              <span className="hidden md:inline text-slate-300" aria-hidden="true">
                /
              </span>
              <span className="truncate text-slate-700 font-semibold">
                {getBreadcrumbTitle()}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Live Sync, Notification Bell, User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Firebase Live Realtime Indicator */}
          <div
            className={`hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              firebaseStatus.isConnected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
            title={`Sinkronisasi Realtime: ${firebaseStatus.projectId} (${
              firebaseStatus.isConnected ? 'Aktif' : 'Mencoba Terhubung...'
            })`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                firebaseStatus.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="font-mono text-[11px]">
              Live: <span className="font-bold">{firebaseStatus.projectId}</span>
            </span>
          </div>

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotificationPanel(!showNotificationPanel);
                setShowUserDropdown(false);
              }}
              className={`relative p-2 sm:p-2.5 rounded-xl border transition-all ${
                showNotificationPanel
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 ring-2 ring-indigo-200/60'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/80 hover:bg-slate-100 text-slate-700'
              }`}
              title="Notifikasi & Pembaruan Terkini"
              aria-label="Lihat Notifikasi"
            >
              <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-700" />

              {/* Unread Badge */}
              {unreadCount > 0 && (
                <>
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping opacity-75" />
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-white shadow-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showNotificationPanel && (
              <div className="absolute right-0 mt-2 w-[92vw] sm:w-[420px] max-w-[430px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-0 z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                {/* Panel Header */}
                <div className="px-4 py-3.5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                      <Bell className="w-4 h-4 text-amber-300" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold leading-tight flex items-center gap-1.5">
                        Kabar & Pembaruan Terkini
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white">
                            {unreadCount} baru
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-slate-300 leading-tight">
                        {currentUser?.role === 'orangtua'
                          ? 'Pembaruan bintang, catatan BK anak, & pengumuman'
                          : 'Apresiasi bintang, kasus BK, & pengumuman sekolah'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[11px] text-indigo-200 hover:text-white px-2 py-1 rounded-md hover:bg-white/10 transition-colors flex items-center gap-1 font-semibold"
                        title="Tandai semua sudah dibaca"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Tandai Baca</span>
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotificationPanel(false)}
                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      aria-label="Tutup Panel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border-b border-slate-200 overflow-x-auto text-[11px]">
                  <button
                    onClick={() => setNotificationFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors whitespace-nowrap ${
                      notificationFilter === 'all'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-200/70'
                    }`}
                  >
                    Semua ({notifications.length})
                  </button>
                  <button
                    onClick={() => setNotificationFilter('star')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors whitespace-nowrap flex items-center gap-1 ${
                      notificationFilter === 'star'
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-200/70'
                    }`}
                  >
                    <Star className="w-3 h-3 text-amber-300 fill-amber-300" />
                    Bintang ({notifications.filter((n) => n.type === 'star').length})
                  </button>
                  <button
                    onClick={() => setNotificationFilter('case')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors whitespace-nowrap flex items-center gap-1 ${
                      notificationFilter === 'case'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-200/70'
                    }`}
                  >
                    <ShieldAlert className="w-3 h-3" />
                    Kasus BK ({notifications.filter((n) => n.type === 'case').length})
                  </button>
                  <button
                    onClick={() => setNotificationFilter('announcement')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors whitespace-nowrap flex items-center gap-1 ${
                      notificationFilter === 'announcement'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-200/70'
                    }`}
                  >
                    <Megaphone className="w-3 h-3" />
                    Pengumuman ({notifications.filter((n) => n.type === 'announcement').length})
                  </button>
                </div>

                {/* Notification Items List */}
                <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                  {filteredNotifications.length === 0 ? (
                    <div className="py-12 px-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">Tidak ada notifikasi baru</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Semua kabar sekolah dan pembaruan akan otomatis tampil di sini.
                      </p>
                    </div>
                  ) : (
                    filteredNotifications.map((item) => {
                      const isUnread = !readNotifIds.includes(item.id);

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleNotificationClick(item)}
                          className={`p-3.5 transition-all cursor-pointer hover:bg-indigo-50/40 relative group ${
                            isUnread ? 'bg-indigo-50/20' : 'bg-white'
                          }`}
                        >
                          {/* Left unread indicator bar */}
                          {isUnread && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600" />
                          )}

                          <div className="flex items-start gap-3">
                            {/* Type Icon Badge */}
                            <div className="shrink-0 mt-0.5">
                              {item.type === 'star' && (
                                <div
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-xs ${
                                    item.starType === 'reward'
                                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                      : 'bg-rose-100 text-rose-700 border border-rose-200'
                                  }`}
                                >
                                  {item.starType === 'reward' ? (
                                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                                  ) : (
                                    <TrendingDown className="w-4 h-4 text-rose-600" />
                                  )}
                                </div>
                              )}
                              {item.type === 'case' && (
                                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center shadow-xs">
                                  <ShieldAlert className="w-4 h-4" />
                                </div>
                              )}
                              {item.type === 'announcement' && (
                                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center shadow-xs">
                                  <Megaphone className="w-4 h-4" />
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <h5
                                  className={`text-xs font-bold truncate ${
                                    isUnread ? 'text-slate-900 font-extrabold' : 'text-slate-800'
                                  }`}
                                >
                                  {item.title}
                                </h5>
                                <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0 flex items-center gap-0.5 font-medium">
                                  <Clock className="w-2.5 h-2.5" />
                                  {item.relativeTime}
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                                {item.description}
                              </p>

                              {/* Meta Tags */}
                              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                                {item.detail && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                                    {item.detail}
                                  </span>
                                )}
                                {item.actorName && (
                                  <span className="text-slate-500 truncate max-w-[180px]">
                                    {item.actorName}
                                  </span>
                                )}
                                <span className="ml-auto text-indigo-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                                  Buka <ChevronRight className="w-3 h-3" />
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Panel Footer */}
                <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-500">
                  <span>Data tersinkronisasi otomatis dengan server sekolah SDN Nusantara 01.</span>
                </div>
              </div>
            )}
          </div>

          {/* User Profile / Login */}
          {currentUser ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => {
                  setShowUserDropdown(!showUserDropdown);
                  setShowNotificationPanel(false);
                }}
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/80 hover:bg-slate-100 transition-colors shadow-2xs"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 leading-none truncate max-w-[120px]">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-indigo-700 font-medium leading-tight mt-0.5 truncate max-w-[120px]">
                    {currentUser.title}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* Dropdown */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-[11px] text-slate-400">Masuk sebagai:</p>
                    <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                    <p className="text-[11px] text-indigo-600 font-medium">{currentUser.title}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Username: {currentUser.username}
                    </p>
                  </div>

                  <div className="p-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        logout();
                        setShowUserDropdown(false);
                        setActiveView('landing');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar Sesi</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenLoginModal}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors whitespace-nowrap"
            >
              <UserCheck className="w-4 h-4" />
              <span>Masuk Aplikasi</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
