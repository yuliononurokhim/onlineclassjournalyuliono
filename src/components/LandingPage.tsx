import React, { useState, useEffect } from 'react';
import { useEduStore } from '../services/store';
import { UserRole } from '../types';
import {
  School,
  Calendar,
  Sparkles,
  BookOpen,
  Shield,
  MessageCircle,
  Phone,
  Mail,
  ClipboardList,
  Images,
  Lock,
  User,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Users,
  Star,
  TrendingUp,
  BarChart3,
  Award,
  LogOut,
  UserCheck
} from 'lucide-react';

interface LandingPageProps {
  activeView?: string;
  onLoginSuccess: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  activeView,
  onLoginSuccess,
}) => {
  const { schoolProfile, announcements, login, logout, currentUser, starAwards, students } = useEduStore();
  const landingFeatures = {
    dailyReports: schoolProfile.landingFeatures?.dailyReports ?? true,
    gallery: schoolProfile.landingFeatures?.gallery ?? true,
    agenda: schoolProfile.landingFeatures?.agenda ?? true,
  };
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Synchronize scrolling when activeView changes from navigation buttons
  useEffect(() => {
    if (activeView === 'pengumuman') {
      const el = document.getElementById('pengumuman');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (activeView === 'kontak') {
      const el = document.getElementById('kontak');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (activeView === 'landing') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeView]);

  // Companion teachers
  const companionTeachers = [
    {
      name: 'Ibu Ratna Kumalasari, S.Pd.',
      role: 'Guru Kelas / Wali Kelas 4-A',
      desc: 'Penanggung jawab kegiatan belajar harian, pencatatan jurnal umum, dan presensi murid.',
      phone: '0813-7722-1133',
      email: 'ratna.k@sdnnusantara01.sch.id',
      avatar: 'R',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      roleKey: 'guru_kelas' as UserRole,
    },
    {
      name: 'Ibu Dian Permatasari, M.Psi.',
      role: 'Guru Bimbingan Konseling (BK)',
      desc: 'Pendampingan psikologis siswa, penanganan kasus khusus, dan pemantauan perkembangan karakter.',
      phone: '0812-5544-7788',
      email: 'dian.bk@sdnnusantara01.sch.id',
      avatar: 'D',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      roleKey: 'guru_bk' as UserRole,
    },
    {
      name: 'Ust. Ahmad Fauzan, S.Pd.I.',
      role: 'Guru Pendidikan Agama Islam (PAI)',
      desc: 'Penilaian praktik ibadah harian, pembiasaan thaharah/sholat, dan hafalan Al-Qur’an Juz 30.',
      phone: '0815-6677-8800',
      email: 'ahmad.fauzan@sdnnusantara01.sch.id',
      avatar: 'A',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
      roleKey: 'guru_pai' as UserRole,
    },
    {
      name: 'Dra. Hj. Siti Nurjanah, M.Pd.',
      role: 'Kepala Sekolah',
      desc: 'Penanggung jawab mutu pendidikan dan kepemimpinan sekolah SDN Nusantara 01.',
      phone: '(021) 7208492',
      email: 'kepsek@sdnnusantara01.sch.id',
      avatar: 'S',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
      roleKey: 'admin' as UserRole,
    },
  ];

  // Current Week's Total Star Distribution Statistics
  const rewardsList = starAwards.filter((s) => s.type !== 'penalty');
  const penaltiesList = starAwards.filter((s) => s.type === 'penalty');

  const totalRewardsThisWeek = rewardsList.reduce((acc, curr) => acc + curr.starsCount, 0);
  const totalPenaltiesThisWeek = penaltiesList.reduce((acc, curr) => acc + curr.starsCount, 0);
  const totalNetStarsThisWeek = Math.max(0, totalRewardsThisWeek - totalPenaltiesThisWeek);

  const studentsWithStars = new Set(starAwards.map((s) => s.studentId)).size;

  const categoryTally = {
    keaktifan: { label: 'Keaktifan & Partisipasi Belajar', count: 0, color: 'bg-indigo-600', textColor: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
    disiplin: { label: 'Kedisiplinan & Kerapian Tugas', count: 0, color: 'bg-blue-600', textColor: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
    ibadah: { label: 'Pembiasaan Ibadah & Doa (PAI)', count: 0, color: 'bg-teal-600', textColor: 'text-teal-700', bg: 'bg-teal-50 border-teal-200' },
    karakter: { label: 'Budi Pekerti, Kejujuran & Empati (BK)', count: 0, color: 'bg-rose-600', textColor: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
    kreativitas: { label: 'Kreativitas & Kerjasama Kelompok', count: 0, color: 'bg-amber-500', textColor: 'text-amber-800', bg: 'bg-amber-50 border-amber-200' },
  };

  rewardsList.forEach((award) => {
    const c = award.category.toLowerCase();
    if (c.includes('disiplin') || c.includes('rapi')) categoryTally.disiplin.count += award.starsCount;
    else if (c.includes('ibadah') || c.includes('sholat') || c.includes('tartil')) categoryTally.ibadah.count += award.starsCount;
    else if (c.includes('empati') || c.includes('jujur') || c.includes('budi') || c.includes('karakter')) categoryTally.karakter.count += award.starsCount;
    else if (c.includes('kreatif') || c.includes('sama') || c.includes('gotong')) categoryTally.kreativitas.count += award.starsCount;
    else categoryTally.keaktifan.count += award.starsCount;
  });

  const roleTally = {
    guru_kelas: starAwards.filter((s) => s.awarderRole === 'guru_kelas' && s.type !== 'penalty').reduce((sum, s) => sum + s.starsCount, 0),
    guru_bk: starAwards.filter((s) => s.awarderRole === 'guru_bk' && s.type !== 'penalty').reduce((sum, s) => sum + s.starsCount, 0),
    guru_pai: starAwards.filter((s) => s.awarderRole === 'guru_pai' && s.type !== 'penalty').reduce((sum, s) => sum + s.starsCount, 0),
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!username.trim() || !password.trim()) {
      setLoginError('Harap masukkan username dan password.');
      return;
    }

    const success = login(username, password);
    if (success) {
      onLoginSuccess();
    } else {
      setLoginError('Username atau password tidak sesuai. Cek kembali atau hubungi Administrator.');
    }
  };

  return (
    <div className="landing-page min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Hero Section with Official School Header */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 text-slate-900 pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-indigo-100">
        <div className="max-w-7xl mx-auto">
          {/* Official Letterhead / Kop Surat Mockup */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-indigo-100 mb-10 shadow-sm">
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center p-3 text-indigo-900 shadow-sm shrink-0">
                <School className="w-12 h-12 text-indigo-700" />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-widest text-indigo-600 font-semibold mb-1">
                  {schoolProfile.kopLine1}
                </p>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {schoolProfile.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                  {schoolProfile.address}, {schoolProfile.district}, {schoolProfile.city} · NPSN: {schoolProfile.npsn}
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3 text-xs text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-indigo-500" /> {schoolProfile.phone}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-500" /> {schoolProfile.email}
                  </span>
                  <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200">
                    Akreditasi A Unggul
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Hero Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Col: Portal Highlights & Values */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{schoolProfile.heroTagline || 'Portal Jurnal Belajar & Karakter Siswa Real-Time'}</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight text-balance">
                {schoolProfile.heroTitle || 'Pantau Tumbuh Kembang dan Aktivitas Belajar Si Kecil Setiap Hari'}
              </h2>
              {/* Hero Description */}
              <div className="space-y-2">
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl">
                  {schoolProfile.heroDescription ||
                    'Jurnal digital interaktif dari guru untuk menghubungkan sekolah dan rumah dengan mudah. Lihat laporan belajar, perkembangan anak, dan agenda sekolah melalui satu portal.'}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Teks sambutan resmi dikelola oleh Admin SIM (dapat diubah di panel admin)</span>
                </div>
              </div>

              {/* Parent portal feature overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {landingFeatures.dailyReports && (
                  <div className="bg-white border border-indigo-100 rounded-2xl p-4 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2.5">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">Laporan Harian/Mingguan</h4>
                    <p className="text-xs text-slate-500 mt-1">Catatan aktivitas belajar dan perkembangan anak di kelas.</p>
                  </div>
                )}
                {landingFeatures.gallery && (
                  <div className="bg-white border border-rose-100 rounded-2xl p-4 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-2.5">
                      <Images className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">Galeri Foto & Video</h4>
                    <p className="text-xs text-slate-500 mt-1">Momen belajar dan kegiatan anak yang dibagikan guru.</p>
                  </div>
                )}
                {landingFeatures.agenda && (
                  <div className="bg-white border border-teal-100 rounded-2xl p-4 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center mb-2.5">
                      <ClipboardList className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">Agenda & Tugas</h4>
                    <p className="text-xs text-slate-500 mt-1">Informasi kegiatan sekolah, jadwal, dan tugas yang akan datang.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Interactive Login Box or Active Session Card */}
            <div className="lg:col-span-5 bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-100">
              {currentUser ? (
                /* Authenticated Active Session Box */
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Sesi Aktif Terverifikasi
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      ID: {currentUser.username}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-base text-white shadow-sm shrink-0 ${
                          currentUser.role === 'orangtua'
                            ? 'bg-amber-500'
                            : currentUser.role === 'admin'
                            ? 'bg-slate-800'
                            : currentUser.role === 'guru_kelas'
                            ? 'bg-indigo-600'
                            : currentUser.role === 'guru_bk'
                            ? 'bg-rose-600'
                            : 'bg-teal-600'
                        }`}
                      >
                        {currentUser.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-extrabold text-slate-900 truncate">
                          {currentUser.name}
                        </h4>
                        <p className="text-xs text-indigo-700 font-semibold mt-0.5">
                          {currentUser.title}
                        </p>
                      </div>
                    </div>

                    {currentUser.role === 'orangtua' && (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                        <span className="font-bold block">✓ Portal Siswa Terhubung</span>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          Sidebar dan seluruh modul hanya menampilkan data capaian anak Anda secara aman.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      onClick={onLoginSuccess}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition-all group"
                    >
                      <span>Masuk ke Dashboard</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={() => logout()}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-rose-600 text-xs font-semibold transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar / Ganti Akun Pengguna</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Clean Official Login Box (Demo buttons removed) */
                <div id="login-form-container" className="scroll-mt-24 space-y-4">
                  <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-indigo-600" />
                        <span>Masuk ke Akun Anak</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Orang tua dapat masuk dengan username dan password. Guru dan admin juga dapat menggunakan akun resmi.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleManualLogin} className="space-y-4">
                    {loginError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-in fade-in">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span className="font-medium">{loginError}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Username / NISN Siswa <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="login-username-input"
                          type="text"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Masukkan username atau NISN siswa..."
                          className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
                        />
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Contoh: Username Guru/Admin, NISN Murid (10 digit), atau username orang tua.
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">
                          Kata Sandi Akun <span className="text-rose-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowForgotModal(true)}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
                        >
                          Lupa Sandi?
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Masukkan kata sandi akun..."
                          className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
                        />
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-indigo-950 font-extrabold text-sm shadow-lg shadow-indigo-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Login Orang Tua / Masuk ke Akun Anak</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Membutuhkan bantuan login?</span>
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="text-indigo-600 hover:underline font-bold"
                      >
                        Pusat Bantuan Akses &rarr;
                      </button>
                    </div>
                  </form>
                </div>
          )}
        </div>
          </div>
        </div>
      </section>

      {/* Parent access steps */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="text-center mb-6">
            <h3 className="text-xl font-extrabold text-slate-900">Cara Mengakses Jurnal Anak</h3>
            <p className="text-sm text-slate-500 mt-1">Tiga langkah mudah untuk mulai memantau aktivitas belajar si kecil.</p>
          </div>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <li className="flex md:flex-col items-center md:text-center gap-4 md:gap-3 p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
              <span className="w-10 h-10 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center shrink-0">1</span>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Klik tombol Login</h4>
                <p className="text-xs text-slate-600 mt-1">Gunakan tombol kontras “Login Orang Tua / Masuk ke Akun Anak” di atas.</p>
              </div>
            </li>
            <li className="flex md:flex-col items-center md:text-center gap-4 md:gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-100">
              <span className="w-10 h-10 rounded-full bg-rose-600 text-white font-black flex items-center justify-center shrink-0">2</span>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Masukkan username & password</h4>
                <p className="text-xs text-slate-600 mt-1">Pakai kredensial akun orang tua yang diberikan oleh sekolah.</p>
              </div>
            </li>
            <li className="flex md:flex-col items-center md:text-center gap-4 md:gap-3 p-4 rounded-2xl bg-teal-50 border border-teal-100">
              <span className="w-10 h-10 rounded-full bg-teal-600 text-white font-black flex items-center justify-center shrink-0">3</span>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Pantau jurnal belajar anak</h4>
                <p className="text-xs text-slate-600 mt-1">Lihat informasi dan perkembangan anak melalui akun pribadi Anda.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* Summary Section: Current Week's Total Star Distribution Across Classes */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-md">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span>PAPAN TRANSPARANSI APRESIASI SISWA</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Distribusi Perolehan Bintang Pekan Ini ({schoolProfile.classGrade})
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Grafik visual akumulasi penghargaan bintang karakter, ibadah, dan akademik yang diberikan oleh Guru Kelas, Guru BK, dan Guru PAI untuk memantau kemajuan positif siswa.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 self-start md:self-auto">
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-sm shrink-0">
                <Star className="w-6 h-6 fill-slate-950 text-slate-950" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  TOTAL BINTANG BERSIH PEKAN INI
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 font-mono tabular-nums leading-none">
                    {totalNetStarsThisWeek} ★
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold">
                    <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      +{totalRewardsThisWeek}
                    </span>
                    <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      -{totalPenaltiesThisWeek}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {studentsWithStars} dari {students.length} murid terpantau aktif
                </p>
              </div>
            </div>
          </div>

          {/* Grid Layout: Visual Chart (Left) + Role Breakdown & Mini-Feed (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Bar Chart of Categories */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  <span>Grafik Distribusi Berdasarkan Dimensi Karakter</span>
                </h4>
                <span className="text-xs text-slate-400 font-mono">100% Kumulatif</span>
              </div>

              <div className="space-y-3.5 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
                {Object.entries(categoryTally).map(([key, item]) => {
                  const percentage = totalRewardsThisWeek > 0 ? Math.round((item.count / totalRewardsThisWeek) * 100) : 0;
                  return (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <span>{item.label}</span>
                        </span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-slate-500 text-[11px] font-semibold">{percentage}%</span>
                          <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${item.bg}`}>
                            {item.count} Bintang
                          </span>
                        </div>
                      </div>

                      {/* Visual Bar with Track */}
                      <div className="w-full h-3 bg-slate-200/80 rounded-full overflow-hidden p-0.5">
                        <div
                          className={`h-full rounded-full ${item.color} transition-all duration-500`}
                          style={{ width: `${Math.max(percentage, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Informative Note for Parents */}
              <div className="text-[11px] text-slate-600 flex items-start gap-2.5 bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Sistem Apresiasi & Disiplin Berkeadilan:</strong> Selain apresiasi penambahan bintang (+), guru juga menerapkan pengurangan bintang terukur (-) saat terjadi pelanggaran tata tertib demi menanamkan tanggung jawab sejak dini. Semua rekam jejak terhubung real-time ke <strong>Dashboard Orang Tua</strong>.
                </span>
              </div>
            </div>

            {/* Right: Teacher Role Share & Recent Accolades */}
            <div className="lg:col-span-5 space-y-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Kontribusi Guru Penilai & Apresiasi Terbaru</span>
              </h4>

              {/* Proportional Segmented Progress Strip */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  KONTRIBUSI TIGA PILAR GURU:
                </span>
                <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex">
                  <div
                    style={{ width: `${totalRewardsThisWeek > 0 ? (roleTally.guru_kelas / totalRewardsThisWeek) * 100 : 33}%` }}
                    className="bg-indigo-600 h-full"
                    title={`Guru Kelas: ${roleTally.guru_kelas} Bintang`}
                  />
                  <div
                    style={{ width: `${totalRewardsThisWeek > 0 ? (roleTally.guru_bk / totalRewardsThisWeek) * 100 : 33}%` }}
                    className="bg-rose-500 h-full"
                    title={`Guru BK: ${roleTally.guru_bk} Bintang`}
                  />
                  <div
                    style={{ width: `${totalRewardsThisWeek > 0 ? (roleTally.guru_pai / totalRewardsThisWeek) * 100 : 34}%` }}
                    className="bg-teal-500 h-full"
                    title={`Guru PAI: ${roleTally.guru_pai} Bintang`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Guru Kelas</span>
                    <span className="font-bold text-indigo-700 font-mono text-sm">{roleTally.guru_kelas} ★</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Guru BK</span>
                    <span className="font-bold text-rose-700 font-mono text-sm">{roleTally.guru_bk} ★</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Guru PAI</span>
                    <span className="font-bold text-teal-700 font-mono text-sm">{roleTally.guru_pai} ★</span>
                  </div>
                </div>
              </div>

              {/* Accolades Ticker Preview */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  3 APRESIASI TERBARU PEKAN INI:
                </span>
                {starAwards.slice(0, 3).map((st) => (
                  <div
                    key={st.id}
                    className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs text-xs space-y-1 hover:border-amber-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">Siswa</span>
                        <span className="text-[10px] text-amber-700 font-mono font-bold bg-amber-50 px-1.5 py-0.2 rounded">
                          +{st.starsCount} ★
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{st.date}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 italic line-clamp-1">
                      "{st.note}"
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Oleh: <span className="font-medium text-slate-700">{st.awarderName}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Announcements Board (Pengumuman Sekolah) */}
      <section id="pengumuman" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Papan Informasi & Pengumuman Sekolah</h3>
            <p className="text-xs text-slate-500">Agenda akademik, kegiatan proyek P5, dan pemberitahuan resmi untuk wali murid</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-indigo-700 font-semibold bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
            <Calendar className="w-4 h-4" />
            <span>Tahun Ajaran {schoolProfile.academicYear} · Semester {schoolProfile.semester}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className={`px-2.5 py-0.5 rounded-full font-semibold ${
                    ann.category === 'Akademik'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : ann.category === 'Kegiatan'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {ann.category}
                  </span>
                  <span className="text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" /> {ann.date}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-2 leading-snug">
                  {ann.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">
                  {ann.content}
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 text-[11px] text-slate-400">
                Penerbit: <span className="font-medium text-slate-600">{ann.author}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Companion Teachers Transparent Contact */}
      <section id="kontak" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Kontak Terbuka Guru Pendamping Kelas</h3>
          <p className="text-xs text-slate-500">
            Transparansi narahubung guru pendamping untuk memudahkan konsultasi dan sinergi bersama wali murid
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {companionTeachers.map((tch, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg mb-3">
                  {tch.avatar}
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border inline-block mb-2 ${tch.badgeColor}`}>
                  {tch.role}
                </span>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  {tch.name}
                </h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {tch.desc}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2 text-xs">
                <a
                  href={`tel:${tch.phone.replace(/[^0-9]/g, '')}`}
                  className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">{tch.phone}</span>
                </a>
                <a
                  href={`mailto:${tch.email}`}
                  className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors truncate"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{tch.email}</span>
                </a>
                <a
                  href={`mailto:${tch.email}?subject=${encodeURIComponent(`Konsultasi dengan ${tch.name}`)}`}
                  className="w-full mt-2 py-1.5 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Kirim Pesan</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-16 bg-slate-950 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h3 className="text-sm font-bold text-white">Bantuan Akses Orang Tua</h3>
            <p className="text-xs text-slate-400 mt-1">Untuk bantuan lupa password atau kendala akun, hubungi Humas sekolah.</p>
            <a
              href={`mailto:${schoolProfile.email}?subject=${encodeURIComponent('Bantuan akses akun orang tua')}`}
              className="inline-flex items-center gap-2 mt-3 text-sm font-semibold text-indigo-300 hover:text-white"
            >
              <Mail className="w-4 h-4" />
              {schoolProfile.email}
            </a>
            {schoolProfile.phone && (
              <a
                href={`tel:${schoolProfile.phone.replace(/[^0-9+]/g, '')}`}
                className="inline-flex items-center gap-2 mt-2 sm:ml-5 text-sm font-semibold text-indigo-300 hover:text-white"
              >
                <Phone className="w-4 h-4" />
                {schoolProfile.phone}
              </a>
            )}
          </div>
          <div className="text-xs text-slate-400 sm:text-right">
            <p className="font-semibold text-slate-200">© {new Date().getFullYear()} Yuliono Nurokhim</p>
            <p className="mt-1">{schoolProfile.name} · {schoolProfile.classGrade}</p>
          </div>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center gap-3 text-indigo-600 mb-3">
              <div className="p-2.5 rounded-xl bg-indigo-50">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Bantuan Lupa Kata Sandi Akun</h3>
                <p className="text-xs text-slate-500">Layanan Pemulihan Akses SIM Sekolah</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="font-semibold text-slate-800">
                Untuk menjaga keamanan data siswa dan sekolah:
              </p>
              <ul className="list-disc pl-4 space-y-1.5">
                <li>
                  <span className="font-semibold text-slate-700">Orang Tua Murid:</span> Anda dapat meminta kartu cetak kredensial baru kepada <strong>Wali Kelas ({schoolProfile.classGrade})</strong> atau meminta reset instan ke <strong>Admin SIM Sekolah</strong>.
                </li>
                <li>
                  <span className="font-semibold text-slate-700">Guru & Tenaga Kependidikan:</span> Hubungi Admin SIM melalui panel administrator sekolah.
                </li>
              </ul>
              <div className="pt-2 border-t border-slate-200 mt-2">
                <p className="text-[11px] text-slate-500">
                  Kontak Layanan Admin: <span className="font-mono font-semibold text-slate-800">admin@sdnnusantara01.sch.id</span> atau WhatsApp Admin: <span className="font-mono font-semibold text-slate-800">0812-9999-0001</span>.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <a
                href={`mailto:${schoolProfile.email}?subject=${encodeURIComponent('Bantuan akses akun SIM Sekolah')}`}
                className="text-xs text-indigo-700 hover:underline font-semibold"
              >
                Hubungi Admin SIM &rarr;
              </a>
              <button
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
