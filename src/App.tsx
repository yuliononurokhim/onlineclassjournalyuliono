import React, { useState } from 'react';
import { useEduStore } from './services/store';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { GuruKelasDashboard } from './components/guru-kelas/GuruKelasDashboard';
import { GuruBkDashboard } from './components/guru-bk/GuruBkDashboard';
import { GuruPaiDashboard } from './components/guru-pai/GuruPaiDashboard';
import { OrangTuaDashboard } from './components/orangtua/OrangTuaDashboard';
import { School, Heart, Shield, BookOpen, Sparkles, Users } from 'lucide-react';

export default function App() {
  const { currentUser, schoolProfile } = useEduStore();
  const [activeView, setActiveView] = useState<string>('landing');
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  const handleLoginSuccess = () => {
    setActiveView('dashboard');
    setShowLoginModal(false);
  };

  // Determine which dashboard to render based on user role
  const renderDashboard = () => {
    if (!currentUser) {
      return <LandingPage onLoginSuccess={handleLoginSuccess} />;
    }

    switch (currentUser.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'guru_kelas':
        return <GuruKelasDashboard />;
      case 'guru_bk':
        return <GuruBkDashboard />;
      case 'guru_pai':
        return <GuruPaiDashboard />;
      case 'orangtua':
        return <OrangTuaDashboard />;
      default:
        return <LandingPage onLoginSuccess={handleLoginSuccess} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onOpenLoginModal={() => {
          setActiveView('landing');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeView === 'landing' || activeView === 'pengumuman' || activeView === 'kontak' ? (
          <LandingPage onLoginSuccess={handleLoginSuccess} />
        ) : (
          renderDashboard()
        )}
      </main>

      {/* Footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-8 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <School className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-slate-900">{schoolProfile.name}</span>
            <span>·</span>
            <span>SIM Jurnal Kelas Online {schoolProfile.classGrade}</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>TA {schoolProfile.academicYear} ({schoolProfile.semester})</span>
            <span>·</span>
            <span>NPSN {schoolProfile.npsn}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
