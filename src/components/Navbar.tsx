import React, { useState } from 'react';
import { useEduStore } from '../services/store';
import { UserRole } from '../types';
import {
  School,
  UserCheck,
  LogOut,
  RotateCcw,
  Shield,
  BookOpen,
  HeartHandshake,
  Sparkles,
  Users,
  ChevronDown,
  Info,
  Menu,
  X,
  Crown
} from 'lucide-react';

interface NavbarProps {
  onOpenLoginModal?: () => void;
  activeView?: string;
  setActiveView?: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenLoginModal, activeView, setActiveView }) => {
  const { schoolProfile, currentUser, switchRole, logout, resetToDefaultData } = useEduStore();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);

  const rolesList: { role: UserRole; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
    {
      role: 'admin',
      label: 'Admin SIM',
      desc: 'Personalisasi sekolah, CP/TP & reset sandi',
      icon: <Shield className="w-4 h-4" />,
      color: 'bg-slate-800 text-white',
    },
    {
      role: 'guru_kelas',
      label: 'Guru Kelas',
      desc: 'Daftar murid, cetak kartu, jurnal & bintang',
      icon: <BookOpen className="w-4 h-4" />,
      color: 'bg-indigo-600 text-white',
    },
    {
      role: 'guru_bk',
      label: 'Guru BK',
      desc: 'Catat kasus siswa, bintang & laporan ortu',
      icon: <HeartHandshake className="w-4 h-4" />,
      color: 'bg-rose-600 text-white',
    },
    {
      role: 'guru_pai',
      label: 'Guru PAI',
      desc: 'Penilaian fleksibel, ceklist & bintang ibadah',
      icon: <Sparkles className="w-4 h-4" />,
      color: 'bg-teal-600 text-white',
    },
    {
      role: 'orangtua',
      label: 'Orang Tua',
      desc: 'Monitoring anak & chat privat 2 arah',
      icon: <Users className="w-4 h-4" />,
      color: 'bg-amber-600 text-white',
    },
  ];

  const handleRoleSelect = (role: UserRole) => {
    switchRole(role);
    setShowRoleMenu(false);
  };

  const handleReset = () => {
    resetToDefaultData();
    setShowConfirmReset(false);
  };

  return (
    <>
      {/* Top Demo Bar for Easy 5-Role Testing */}
      <div className="no-print bg-slate-900 text-slate-300 text-xs border-b border-slate-800 px-4 py-1.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-amber-400">DEMO MULTI-PERAN:</span>
          <span className="text-slate-400 hidden sm:inline">Pilih peran untuk langsung mencoba sistem:</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {rolesList.map((item) => {
            const isActive = currentUser?.role === item.role;
            return (
              <button
                key={item.role}
                onClick={() => handleRoleSelect(item.role)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
                title={item.desc}
              >
                {item.icon}
                <span>{item.label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-slate-950 ml-0.5" />}
              </button>
            );
          })}
          <button
            onClick={() => setShowConfirmReset(true)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800/80 hover:bg-rose-900/60 text-slate-400 hover:text-rose-200 text-xs transition-colors ml-1"
            title="Reset data ke bawaan contoh"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden md:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Main School Header */}
      <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 lg:px-8 py-3.5 transition-shadow">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Zone 1: School Brand & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-700 to-indigo-900 flex items-center justify-center text-white shadow-md shadow-indigo-200/50 shrink-0">
              <School className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight whitespace-nowrap">
                  {schoolProfile.name}
                </h1>
                <span className="text-[11px] font-semibold text-indigo-800 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                  {schoolProfile.classGrade}
                </span>
              </div>
              <p className="text-xs text-slate-700">
                Jurnal Kelas Online Terpadu · TA {schoolProfile.academicYear}
              </p>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-700">
            <button
              onClick={() => setActiveView && setActiveView('landing')}
              className={`hover:text-indigo-600 transition-colors whitespace-nowrap ${
                activeView === 'landing' ? 'text-indigo-600 font-semibold' : ''
              }`}
            >
              Halaman Utama
            </button>
            {currentUser && (
              <button
                onClick={() => setActiveView && setActiveView('dashboard')}
                className={`hover:text-indigo-600 transition-colors whitespace-nowrap ${
                  activeView === 'dashboard' ? 'text-indigo-600 font-semibold' : ''
                }`}
              >
                Dashboard {currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'orangtua' ? 'Orang Tua' : 'Guru'}
              </button>
            )}
            <button
              onClick={() => {
                if (setActiveView) {
                  setActiveView('landing');
                  setTimeout(() => {
                    const el = document.getElementById('organisasi');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 80);
                }
              }}
              className="hover:text-indigo-600 transition-colors whitespace-nowrap flex items-center gap-1.5"
            >
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>Struktur Kelas</span>
            </button>
            <button
              onClick={() => setActiveView && setActiveView('pengumuman')}
              className={`hover:text-indigo-600 transition-colors whitespace-nowrap ${
                activeView === 'pengumuman' ? 'text-indigo-600 font-semibold' : ''
              }`}
            >
              Pengumuman
            </button>
            <button
              onClick={() => setActiveView && setActiveView('kontak')}
              className={`hover:text-indigo-600 transition-colors whitespace-nowrap ${
                activeView === 'kontak' ? 'text-indigo-600 font-semibold' : ''
              }`}
            >
              Kontak Guru
            </button>
          </nav>

          {/* Zone 3: Account Controls */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/80 hover:bg-slate-100 text-slate-800 text-xs transition-all shadow-sm"
                >
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="font-semibold text-slate-900 leading-none truncate max-w-[130px]">
                      {currentUser.name}
                    </p>
                    <p className="text-[11px] text-slate-700 leading-tight mt-0.5">
                      {currentUser.title}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showRoleMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs text-slate-400">Masuk sebagai:</p>
                      <p className="text-sm font-bold text-slate-900">{currentUser.name}</p>
                      <p className="text-xs text-indigo-600 font-medium">{currentUser.title}</p>
                      <p className="text-[11px] text-slate-400 mt-1">Username: {currentUser.username}</p>
                    </div>

                    <div className="px-2 py-1.5">
                      <p className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                        Ganti Akun Demo
                      </p>
                      {rolesList.map((r) => (
                        <button
                          key={r.role}
                          onClick={() => handleRoleSelect(r.role)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                            currentUser.role === r.role
                              ? 'bg-indigo-50 text-indigo-700 font-semibold'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          {r.icon}
                          <span className="flex-1 text-left">{r.label}</span>
                          {currentUser.role === r.role && (
                            <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded">Aktif</span>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-slate-100 px-2 pt-1.5">
                      <button
                        onClick={() => {
                          logout();
                          setShowRoleMenu(false);
                          if (setActiveView) setActiveView('landing');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-600 hover:bg-rose-50 transition-colors font-medium"
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
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
              >
                <UserCheck className="w-4 h-4" />
                <span>Masuk Aplikasi</span>
              </button>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setShowMobileNav(!showMobileNav)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {showMobileNav ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {showMobileNav && (
          <div className="lg:hidden border-t border-slate-200 bg-white/98 backdrop-blur-md px-4 py-3 space-y-2 animate-in fade-in slide-in-from-top-2">
            <button
              onClick={() => {
                if (setActiveView) setActiveView('landing');
                setShowMobileNav(false);
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-sm font-semibold transition-colors ${
                activeView === 'landing' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>Halaman Utama</span>
              {activeView === 'landing' && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
            </button>

            {currentUser && (
              <button
                onClick={() => {
                  if (setActiveView) setActiveView('dashboard');
                  setShowMobileNav(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeView === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Dashboard ({currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'orangtua' ? 'Orang Tua' : 'Guru'})</span>
                {activeView === 'dashboard' && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
              </button>
            )}

            <button
              onClick={() => {
                if (setActiveView) {
                  setActiveView('landing');
                  setTimeout(() => {
                    const el = document.getElementById('organisasi');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 80);
                }
                setShowMobileNav(false);
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl text-sm font-semibold transition-colors text-slate-700 hover:bg-slate-50"
            >
              <span className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <span>Struktur Organisasi Kelas 4-A</span>
              </span>
            </button>

            <button
              onClick={() => {
                if (setActiveView) setActiveView('pengumuman');
                setShowMobileNav(false);
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-sm font-semibold transition-colors ${
                activeView === 'pengumuman' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>Pengumuman Sekolah</span>
              {activeView === 'pengumuman' && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
            </button>

            <button
              onClick={() => {
                if (setActiveView) setActiveView('kontak');
                setShowMobileNav(false);
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-sm font-semibold transition-colors ${
                activeView === 'kontak' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>Kontak Guru & Tenaga Pendidik</span>
              {activeView === 'kontak' && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
            </button>
          </div>
        )}
      </header>

      {/* Confirm Reset Data Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <div className="p-2 rounded-xl bg-amber-50">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Reset Data Demo?</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Tindakan ini akan mengembalikan semua data sekolah, daftar siswa, kartu login, catatan jurnal, riwayat BK, dan nilai PAI ke contoh awal bawaan.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-sm"
              >
                Ya, Kembalikan Data Awal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
