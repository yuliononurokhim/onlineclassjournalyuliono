import React, { useState, useEffect } from 'react';
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
  Cloud
} from 'lucide-react';

interface TopHeaderProps {
  onToggleMobileMenu: () => void;
  activeView: string;
  setActiveView: (view: string) => void;
  activeSubTab?: string;
  onOpenLoginModal?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onToggleMobileMenu,
  activeView,
  setActiveView,
  activeSubTab,
  onOpenLoginModal,
}) => {
  const { schoolProfile, currentUser, switchRole, logout } = useEduStore();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
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

  const getBreadcrumbTitle = () => {
    if (activeView === 'landing') return 'Halaman Utama & Profil Sekolah';
    if (activeView === 'pengumuman') return 'Pengumuman Resmi Sekolah';
    if (activeView === 'kontak') return 'Kontak Guru & Tenaga Kependidikan';

    if (activeView === 'dashboard' && currentUser) {
      const roleMap: Record<UserRole, string> = {
        admin: 'Admin SIM',
        guru_kelas: 'Guru Kelas',
        guru_bk: 'Guru BK',
        guru_pai: 'Guru PAI',
        orangtua: 'Portal Orang Tua',
      };

      const tabLabels: Record<string, string> = {
        profil: 'Profil & Kop Sekolah',
        kurikulum: 'Kurikulum CP & TP',
        password: 'Bantuan Reset Password',
        laporan: 'Rekap Eksekutif & Unduh Dokumen',
        murid: 'Daftar Murid Kelas',
        kartu: 'Kartu Akses Login Orang Tua',
        jurnal: 'Jurnal Harian Mengajar',
        penilaian: 'Buku Nilai Guru (Internal)',
        bintang: 'Apresiasi & Sanksi Bintang',
        rekap: 'Rekapitulasi Berkas Laporan',
        chat: 'Ruang Chat Konsultasi',
        kasus: 'Jurnal Kasus & Bimbingan Konseling',
        nilai_internal: 'Buku Nilai Internal PAI',
        bk: 'Catatan Kasus & Konseling',
        pai: 'Capaian Ibadah PAI',
      };

      const roleName = roleMap[currentUser.role] || 'Dasbor';
      const tabName = activeSubTab ? tabLabels[activeSubTab] || activeSubTab : 'Umum';
      return `${roleName} / ${tabName}`;
    }

    return 'EduJournal SD';
  };

  return (
    <header className="lg:hidden no-print sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Mobile Menu Toggle & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleMobileMenu}
            className="p-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors shrink-0"
            aria-label="Buka Menu Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="hidden sm:inline font-bold text-slate-900">{schoolProfile.name}</span>
              <span className="hidden sm:inline" aria-hidden="true">·</span>
              <span className="truncate text-slate-700 font-semibold">{getBreadcrumbTitle()}</span>
            </div>
          </div>
        </div>

        {/* Right: Quick Role Switcher Pills & User Controls */}
        {/* Right: Firebase Live Status & User Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">

          {/* Firebase Live Realtime Indicator */}
          <div
            className={`hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              firebaseStatus.isConnected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
            title={`Proyek Firebase: ${firebaseStatus.projectId} (${firebaseStatus.isConnected ? 'Realtime Aktif Dua Arah' : 'Mencoba Terhubung...'})`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                firebaseStatus.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="font-mono text-[11px]">
              Firebase: <span className="font-bold">{firebaseStatus.projectId}</span>
            </span>
          </div>

          {/* User Profile / Login */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/80 hover:bg-slate-100 transition-colors shadow-2xs"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
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
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">Username: {currentUser.username}</p>
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
