import React, { useState, useEffect } from 'react';
import { useEduStore } from './services/store';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { LandingPage } from './components/LandingPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { GuruKelasDashboard } from './components/guru-kelas/GuruKelasDashboard';
import { GuruBkDashboard } from './components/guru-bk/GuruBkDashboard';
import { GuruPaiDashboard } from './components/guru-pai/GuruPaiDashboard';
import { OrangTuaDashboard } from './components/orangtua/OrangTuaDashboard';
import { School } from 'lucide-react';

export default function App() {
  const { currentUser, schoolProfile } = useEduStore();
  const [activeView, setActiveView] = useState<string>('landing');
  const [activeSubTab, setActiveSubTab] = useState<string>('murid');

  // Responsive Sidebar States
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);
  const [isCollapsedDesktop, setIsCollapsedDesktop] = useState<boolean>(false);

  // Synchronize default sub-tab when currentUser role changes
  useEffect(() => {
    if (currentUser?.role) {
      const defaultTabs: Record<string, string> = {
        admin: 'profil',
        guru_kelas: 'murid',
        guru_bk: 'kasus',
        guru_pai: 'penilaian',
        orangtua: 'bintang',
      };
      const target = defaultTabs[currentUser.role];
      if (target) {
        setActiveSubTab((prev) => (prev !== target ? target : prev));
      }
    }
  }, [currentUser?.role]);

  const handleLoginSuccess = () => {
    setActiveView('dashboard');
  };

  const handleOpenLogin = () => {
    setActiveView('landing');
    window.setTimeout(() => {
      const loginForm = document.getElementById('login-form-container');
      if (!loginForm) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      loginForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.getElementById('login-username-input')?.focus({ preventScroll: true });
    }, 0);
  };

  // Determine which dashboard to render based on user role
  const renderDashboard = () => {
    if (!currentUser) {
      return <LandingPage onLoginSuccess={handleLoginSuccess} />;
    }

    switch (currentUser.role) {
      case 'admin':
        return (
          <AdminDashboard
            currentTab={activeSubTab}
            onTabChange={(tab) => setActiveSubTab(tab)}
          />
        );
      case 'guru_kelas':
        return (
          <GuruKelasDashboard
            currentTab={activeSubTab}
            onTabChange={(tab) => setActiveSubTab(tab)}
          />
        );
      case 'guru_bk':
        return (
          <GuruBkDashboard
            currentTab={activeSubTab}
            onTabChange={(tab) => setActiveSubTab(tab)}
          />
        );
      case 'guru_pai':
        return (
          <GuruPaiDashboard
            currentTab={activeSubTab}
            onTabChange={(tab) => setActiveSubTab(tab)}
          />
        );
      case 'orangtua':
        return (
          <OrangTuaDashboard
            currentTab={activeSubTab}
            onTabChange={(tab) => setActiveSubTab(tab)}
          />
        );
      default:
        return <LandingPage onLoginSuccess={handleLoginSuccess} />;
    }
  };

  return (
    <div className="app-shell min-h-screen bg-[#faf8f5] text-[#1e293b] flex font-sans selection:bg-indigo-600 selection:text-white antialiased">
      {/* 1. Left Vertical Sidebar (Desktop Fixed & Mobile Drawer) */}
      <Sidebar
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
        isCollapsedDesktop={isCollapsedDesktop}
        onToggleCollapseDesktop={() => setIsCollapsedDesktop(!isCollapsedDesktop)}
        activeView={activeView}
        setActiveView={setActiveView}
        activeSubTab={activeSubTab}
        setActiveSubTab={setActiveSubTab}
        onOpenLoginModal={handleOpenLogin}
      />

      {/* 2. Main Content Layout (Offset for desktop sidebar) */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out ${
          isCollapsedDesktop ? 'lg:pl-20' : 'lg:pl-72'
        }`}
      >
        {/* Top Header Bar */}
        <TopHeader
          onToggleMobileMenu={() => setIsOpenMobile(!isOpenMobile)}
          activeView={activeView}
          setActiveView={setActiveView}
          activeSubTab={activeSubTab}
          setActiveSubTab={setActiveSubTab}
          onOpenLoginModal={handleOpenLogin}
        />

        {/* Dynamic View Body */}
        <main className="app-main flex-1">
          {activeView === 'landing' || activeView === 'pengumuman' || activeView === 'kontak' ? (
            <LandingPage activeView={activeView} onLoginSuccess={handleLoginSuccess} />
          ) : (
            renderDashboard()
          )}
        </main>

        {/* School Footer */}
        <footer className="app-footer no-print bg-white border-t border-slate-200 py-6 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <School className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-slate-900">{schoolProfile.name}</span>
              <span aria-hidden="true">·</span>
              <span>SIM Jurnal Kelas Online {schoolProfile.classGrade}</span>
            </div>

            <div className="flex items-center gap-4 text-slate-500 font-medium">
              <span>TA {schoolProfile.academicYear} ({schoolProfile.semester})</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">NPSN {schoolProfile.npsn}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
