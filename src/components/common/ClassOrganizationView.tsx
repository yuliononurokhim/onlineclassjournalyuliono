import React, { useState } from 'react';
import { useEduStore } from '../../services/store';
import { Student } from '../../types';
import {
  Crown,
  Award,
  Shield,
  Users,
  CheckCircle2,
  Printer,
  Sparkles,
  BookOpen,
  HeartHandshake,
  DollarSign,
  FileText,
  Search,
  School,
  Edit3,
  X,
  Save,
  Info,
  ChevronRight,
  UserCheck
} from 'lucide-react';

interface ClassOrganizationViewProps {
  /** If provided, highlights this specific student's role (e.g. child in parent dashboard) */
  highlightStudentId?: string;
  /** Whether the user can edit or reassign class roles (Guru Kelas or Admin) */
  canEdit?: boolean;
  /** Optional title override */
  customTitle?: string;
  /** Optional container style variant: 'standalone' (for pages/tabs) or 'embed' (for landing page) */
  variant?: 'standalone' | 'embed';
}

const DEFAULT_ROLE_OPTIONS = [
  { role: 'Ketua Kelas', defaultDuty: 'Memimpin barisan, membuka doa belajar bersama, mengkoordinir teman-teman sekelas, dan mewakili kelas dalam musyawarah bersama wali kelas.' },
  { role: 'Wakil Ketua Kelas', defaultDuty: 'Membantu ketua kelas, menjaga ketertiban suasana belajar, dan mengoordinasikan kegiatan kelas saat ketua berhalangan hadir.' },
  { role: 'Sekretaris 1', defaultDuty: 'Mencatat agenda harian kelas di papan informasi, mengarsipkan jadwal piket, dan mencatat rekap absensi harian bersama ketua.' },
  { role: 'Sekretaris 2', defaultDuty: 'Membantu notula kesepakatan kelas, mengelola mading kelas ceria, serta mendokumentasikan karya teman-teman sekelas.' },
  { role: 'Bendahara 1', defaultDuty: 'Mencatat kas paguyuban murid (infak sukarela/kas kelas ceria) dan melaporkan pembukuan secara transparan kepada wali kelas.' },
  { role: 'Bendahara 2', defaultDuty: 'Membantu pencatatan kas kelas, pengadaan ATK darurat (spidol, penghapus, kapur), dan menyimpan kuitansi pengeluaran kelas.' },
  { role: 'Koordinator Seksi Kebersihan & Keindahan', defaultDuty: 'Memimpin regu piket harian kelas, memastikan tempat sampah terpilah, dan merawat tanaman hias di teras kelas.' },
  { role: 'Koordinator Seksi Keagamaan & Adab', defaultDuty: 'Mempersiapkan sarana ibadah sholat dzuhur berjamaah, memimpin doa sehari-hari, dan mengingatkan adab sopan santun.' },
  { role: 'Koordinator Seksi Keamanan & Ketertiban', defaultDuty: 'Membantu menjaga suasana kelas tetap kondusif saat pergantian jam pelajaran dan saat jam istirahat.' },
  { role: 'Koordinator Seksi Upacara & Olahraga', defaultDuty: 'Mempersiapkan perlengkapan olahraga bersama, membariskan kelas saat upacara bendera hari Senin.' },
  { role: 'Koordinator Seksi Mading & Pojok Baca', defaultDuty: 'Merawat koleksi buku pojok literasi kelas dan menata pajangan karya puisi, gambar, serta kliping kelas.' },
  { role: 'Anggota Kelas', defaultDuty: 'Berpartisipasi aktif dalam kegiatan belajar mengajar, menjaga kebersihan kelas, dan saling tolong-menolong sesama teman.' },
];

export const ClassOrganizationView: React.FC<ClassOrganizationViewProps> = ({
  highlightStudentId,
  canEdit = false,
  customTitle,
  variant = 'standalone',
}) => {
  const { schoolProfile, students, updateStudent } = useEduStore();

  const [activeTabMode, setActiveTabMode] = useState<'bagan' | 'daftar'>('bagan');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<Student | null>(null);

  // Edit Role Modal State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editRoleName, setEditRoleName] = useState('');
  const [editDutyText, setEditDutyText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Identify high-lighted student if provided
  const highlightedStudent = highlightStudentId
    ? students.find((s) => s.id === highlightStudentId)
    : null;

  // Group students by functional roles
  const ketua = students.find((s) => s.classRole?.toLowerCase().includes('ketua') && !s.classRole?.toLowerCase().includes('wakil'));
  const wakil = students.find((s) => s.classRole?.toLowerCase().includes('wakil'));
  const sekretarisList = students.filter((s) => s.classRole?.toLowerCase().includes('sekretaris'));
  const bendaharaList = students.filter((s) => s.classRole?.toLowerCase().includes('bendahara'));
  const seksiList = students.filter(
    (s) =>
      s.classRole?.toLowerCase().includes('seksi') ||
      s.classRole?.toLowerCase().includes('koordinator')
  );
  const anggotaLainnya = students.filter(
    (s) =>
      s.id !== ketua?.id &&
      s.id !== wakil?.id &&
      !sekretarisList.some((x) => x.id === s.id) &&
      !bendaharaList.some((x) => x.id === s.id) &&
      !seksiList.some((x) => x.id === s.id)
  );

  const handleOpenEdit = (std: Student) => {
    setEditingStudent(std);
    setEditRoleName(std.classRole || 'Anggota Kelas');
    setEditDutyText(std.classRoleDuty || '');
  };

  const handleRolePresetChange = (roleName: string) => {
    setEditRoleName(roleName);
    const foundPreset = DEFAULT_ROLE_OPTIONS.find((r) => r.role === roleName);
    if (foundPreset && (!editDutyText || editDutyText.trim() === '')) {
      setEditDutyText(foundPreset.defaultDuty);
    }
  };

  const handleSaveEditRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    updateStudent(editingStudent.id, {
      classRole: editRoleName.trim() || 'Anggota Kelas',
      classRoleDuty: editDutyText.trim() || 'Menjaga kerukunan dan aktif belajar bersama teman sekelas.',
    });

    showToast(`Jabatan ${editingStudent.name} berhasil diperbarui menjadi ${editRoleName}.`);
    setEditingStudent(null);
  };

  const handlePrintBagan = () => {
    window.print();
  };

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.classRole && s.classRole.toLowerCase().includes(q)) ||
      (s.classRoleDuty && s.classRoleDuty.toLowerCase().includes(q)) ||
      s.nisn.includes(q)
    );
  });

  // Helper for role styling
  const getRoleBadgeStyle = (roleName?: string) => {
    const r = (roleName || '').toLowerCase();
    if (r.includes('ketua') && !r.includes('wakil')) {
      return {
        bg: 'bg-amber-500 text-slate-950 border-amber-400 font-bold',
        cardBorder: 'border-amber-400 bg-gradient-to-b from-amber-50/80 to-white ring-2 ring-amber-400/30',
        icon: <Crown className="w-4 h-4 text-amber-900 fill-amber-400" />,
        badgeText: 'bg-amber-100 text-amber-900 border-amber-300',
      };
    }
    if (r.includes('wakil')) {
      return {
        bg: 'bg-indigo-600 text-white border-indigo-500 font-bold',
        cardBorder: 'border-indigo-300 bg-gradient-to-b from-indigo-50/70 to-white',
        icon: <Award className="w-4 h-4 text-indigo-600" />,
        badgeText: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      };
    }
    if (r.includes('sekretaris')) {
      return {
        bg: 'bg-teal-600 text-white border-teal-500 font-semibold',
        cardBorder: 'border-teal-300 bg-gradient-to-b from-teal-50/60 to-white',
        icon: <FileText className="w-4 h-4 text-teal-600" />,
        badgeText: 'bg-teal-100 text-teal-800 border-teal-200',
      };
    }
    if (r.includes('bendahara')) {
      return {
        bg: 'bg-emerald-600 text-white border-emerald-500 font-semibold',
        cardBorder: 'border-emerald-300 bg-gradient-to-b from-emerald-50/60 to-white',
        icon: <DollarSign className="w-4 h-4 text-emerald-600" />,
        badgeText: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };
    }
    if (r.includes('seksi') || r.includes('koordinator')) {
      return {
        bg: 'bg-sky-600 text-white border-sky-500 font-semibold',
        cardBorder: 'border-sky-300 bg-gradient-to-b from-sky-50/60 to-white',
        icon: <Shield className="w-4 h-4 text-sky-600" />,
        badgeText: 'bg-sky-100 text-sky-800 border-sky-200',
      };
    }
    return {
      bg: 'bg-slate-700 text-white border-slate-600',
      cardBorder: 'border-slate-200 bg-white',
      icon: <Users className="w-4 h-4 text-slate-500" />,
      badgeText: 'bg-slate-100 text-slate-700 border-slate-200',
    };
  };

  // Reusable Card for Student in Org Chart
  const renderStudentCard = (std: Student, subtitleLabel?: string, isLeader = false) => {
    const isMe = highlightStudentId === std.id;
    const style = getRoleBadgeStyle(std.classRole);

    return (
      <div
        key={std.id}
        onClick={() => setSelectedStudentDetail(std)}
        className={`relative group cursor-pointer rounded-2xl p-4 transition-all duration-200 shadow-xs hover:shadow-md border text-center flex flex-col justify-between ${
          style.cardBorder
        } ${
          isMe
            ? 'ring-3 ring-amber-400 ring-offset-2 shadow-amber-200/50 scale-[1.02]'
            : 'hover:border-indigo-400'
        }`}
      >
        {/* Child Marker for Parent */}
        {isMe && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md flex items-center gap-1 border border-amber-300 animate-pulse whitespace-nowrap">
            <Sparkles className="w-3 h-3 fill-amber-950 text-amber-950" />
            <span>🌟 Posisi Ananda Anda</span>
          </div>
        )}

        {/* Edit Button for Authorized Teacher */}
        {canEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEdit(std);
            }}
            className="no-print absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-500 hover:text-indigo-600 transition-colors shadow-xs"
            title="Ubah Jabatan Siswa"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        )}

        <div>
          {/* Avatar with initial */}
          <div className="relative mx-auto w-14 h-14 mb-2.5">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-lg shadow-sm border border-black/5 ${
                std.avatarBgColor || 'bg-indigo-100 text-indigo-700'
              }`}
            >
              {std.name.charAt(0)}
            </div>
            {isLeader && (
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs border border-white">
                <Crown className="w-3.5 h-3.5 fill-amber-900 text-amber-900" />
              </span>
            )}
          </div>

          {/* Role Pill */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border mb-1.5 max-w-full truncate shadow-xs">
            <span className={style.badgeText}>
              {std.classRole || 'Anggota Kelas'}
            </span>
          </div>

          {/* Student Name */}
          <h4 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
            {std.name}
          </h4>

          {/* NISN & Gender */}
          <p className="text-[11px] text-slate-600 font-mono mt-0.5">
            NISN: {std.nisn} · {std.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
          </p>

          {/* Duty Preview */}
          {std.classRoleDuty && (
            <p className="text-[11px] text-slate-600 mt-2 line-clamp-2 leading-relaxed bg-white/80 p-2 rounded-lg border border-slate-100 text-left">
              <span className="font-semibold text-slate-700">Tupoksi:</span> {std.classRoleDuty}
            </p>
          )}
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform">
          <span>Lihat rincian tugas</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${variant === 'embed' ? 'w-full' : ''}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Special Highlight Banner if Child has a Role (for Parents) */}
      {highlightedStudent && (
        <div className="bg-gradient-to-r from-amber-50 via-amber-100/70 to-orange-50 border-2 border-amber-300 rounded-3xl p-5 sm:p-7 shadow-md relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-amber-200/50 rounded-full blur-2xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shadow-amber-300/60 shrink-0 border-2 border-white">
                <Crown className="w-8 h-8 fill-amber-950 text-amber-950" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-200 text-amber-900 text-xs font-black uppercase tracking-wider mb-1 border border-amber-300">
                  <Sparkles className="w-3.5 h-3.5 fill-amber-700 text-amber-700" />
                  <span>AMANAH & JABATAN RESMI ANANDA</span>
                </div>
                <h3 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  {highlightedStudent.name} mengemban amanah sebagai{' '}
                  <span className="text-amber-700 underline decoration-amber-400 decoration-wavy underline-offset-4">
                    {highlightedStudent.classRole || 'Anggota Kelas'}
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 mt-1.5 leading-relaxed max-w-2xl">
                  <strong>Tugas Pokok & Tanggung Jawab:</strong> {highlightedStudent.classRoleDuty || 'Aktif mengikuti kegiatan kelas dengan tertib dan gotong royong.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-col items-stretch gap-2 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => setSelectedStudentDetail(highlightedStudent)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-xs transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                <span>Rincian Tupoksi Ananda</span>
              </button>
              <button
                onClick={handlePrintBagan}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-amber-50 text-slate-700 text-xs font-semibold border border-amber-300 transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Cetak Bagan Kelas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Section Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-1.5">
              <School className="w-3.5 h-3.5 text-indigo-600" />
              <span>KEPENGURUSAN KELAS FORMAL {schoolProfile.classGrade}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {customTitle || `Struktur Organisasi ${schoolProfile.classGrade}`}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Bagan kepengurusan kelas resmi untuk melatih jiwa kepemimpinan, kemandirian, tanggung jawab sosial, dan gotong royong peserta didik di bawah bimbingan Wali Kelas.
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveTabMode('bagan')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTabMode === 'bagan'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>Bagan Hierarki</span>
              </button>
              <button
                onClick={() => setActiveTabMode('daftar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTabMode === 'daftar'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                <span>Daftar Siswa ({students.length})</span>
              </button>
            </div>

            <button
              onClick={handlePrintBagan}
              className="no-print flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
              title="Cetak Bagan Struktur Organisasi Kelas Resmi"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Cetak Bagan</span>
            </button>
          </div>
        </div>

        {/* Search Bar for Quick Filtering */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Cari nama murid, jabatan, atau tupoksi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <div className="text-slate-600 flex items-center gap-3">
            <span>
              Wali Kelas: <strong className="text-slate-800">Ibu Ratna Kumalasari, S.Pd.</strong>
            </span>
            <span>·</span>
            <span>
              Total Murid: <strong className="text-slate-800 font-mono">{students.length} Siswa</strong>
            </span>
          </div>
        </div>

        {/* Printable Letterhead (visible in print) */}
        <div className="hidden print:block text-center border-b-2 border-slate-900 pb-4 mb-6">
          <h2 className="text-base font-bold uppercase">{schoolProfile.kopLine1}</h2>
          <h1 className="text-lg font-black uppercase">{schoolProfile.kopLine2}</h1>
          <p className="text-xs">{schoolProfile.kopSubtext}</p>
          <div className="mt-3 inline-block px-4 py-1 border border-black font-bold text-sm uppercase">
            STRUKTUR ORGANISASI KEPENGURUSAN {schoolProfile.classGrade} · TA {schoolProfile.academicYear}
          </div>
        </div>

        {/* VIEW MODE 1: BAGAN HIERARKI INTERAKTIF */}
        {activeTabMode === 'bagan' && (
          <div className="space-y-10 py-4">
            {/* LEVEL 1: WALI KELAS (PEMBINA & PENASIHAT) */}
            <div className="flex flex-col items-center">
              <div className="bg-gradient-to-b from-indigo-900 to-slate-900 text-white rounded-3xl p-5 border-2 border-indigo-700 shadow-lg text-center max-w-sm w-full relative">
                <div className="w-14 h-14 rounded-2xl bg-white text-indigo-900 flex items-center justify-center font-black text-xl mx-auto mb-2.5 shadow-md">
                  R
                </div>
                <span className="inline-block px-3 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 text-[11px] font-bold border border-indigo-400/30 mb-1">
                  PEMBINA & WALI KELAS
                </span>
                <h4 className="text-base font-bold text-white">
                  Ibu Ratna Kumalasari, S.Pd.
                </h4>
                <p className="text-xs text-indigo-200 font-mono mt-0.5">
                  NIP: 19890620 201101 2 008
                </p>
                <p className="text-[11px] text-indigo-300 mt-2 leading-relaxed border-t border-indigo-800/80 pt-2">
                  Penasihat umum dan pembimbing kegiatan kepemimpinan peserta didik {schoolProfile.classGrade}
                </p>
              </div>

              {/* Connecting Vertical Line */}
              <div className="w-0.5 h-8 bg-slate-300 my-0" />
            </div>

            {/* LEVEL 2: PIMPINAN KELAS (KETUA & WAKIL KETUA) */}
            <div>
              <div className="text-center mb-3">
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                  Pimpinan Eksekutif Kelas
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {ketua && renderStudentCard(ketua, 'Ketua Kelas', true)}
                {wakil && renderStudentCard(wakil, 'Wakil Ketua Kelas')}
              </div>
            </div>

            {/* Connecting Vertical Line */}
            <div className="flex justify-center">
              <div className="w-0.5 h-6 bg-slate-300" />
            </div>

            {/* LEVEL 3: ADMINISTRASI & FINANSIAL (SEKRETARIS & BENDAHARA) */}
            <div>
              <div className="text-center mb-3">
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
                  Administrasi & Finansial Kelas
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
                {sekretarisList.map((std) => renderStudentCard(std, std.classRole))}
                {bendaharaList.map((std) => renderStudentCard(std, std.classRole))}
              </div>
            </div>

            {/* Connecting Vertical Line */}
            <div className="flex justify-center">
              <div className="w-0.5 h-6 bg-slate-300" />
            </div>

            {/* LEVEL 4: SEKSI-SEKSI / KOORDINATOR BIDANG */}
            <div>
              <div className="text-center mb-3">
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1 rounded-full">
                  Seksi Bidang & Pelayanan Kelas
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
                {seksiList.map((std) => renderStudentCard(std, std.classRole))}
              </div>
            </div>

            {/* LEVEL 5: ANGGOTA SELURUH SISWA (JIKA ADA LAINNYA) */}
            {anggotaLainnya.length > 0 && (
              <div className="pt-6 border-t border-slate-200">
                <div className="text-center mb-3">
                  <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                    Anggota & Kerjasama Siswa ({anggotaLainnya.length} Siswa)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
                  {anggotaLainnya.map((std) => renderStudentCard(std, 'Anggota'))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW MODE 2: DAFTAR KARTU JABATAN & TUPOKSI LENGKAP */}
        {activeTabMode === 'daftar' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredStudents.map((std) => {
              const isMe = highlightStudentId === std.id;
              const style = getRoleBadgeStyle(std.classRole);
              return (
                <div
                  key={std.id}
                  onClick={() => setSelectedStudentDetail(std)}
                  className={`bg-white rounded-2xl p-5 border cursor-pointer hover:shadow-md transition-all flex flex-col justify-between ${
                    style.cardBorder
                  } ${isMe ? 'ring-2 ring-amber-400' : ''}`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base ${
                            std.avatarBgColor || 'bg-indigo-100 text-indigo-700'
                          }`}
                        >
                          {std.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block ${style.badgeText}`}>
                              {std.classRole || 'Anggota Kelas'}
                            </span>
                            {isMe && (
                              <span className="text-[9px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded">
                                Ananda
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 mt-1">
                            {std.name}
                          </h4>
                          <p className="text-[11px] text-slate-600 font-mono">
                            NISN: {std.nisn} · {std.gender === 'L' ? 'L' : 'P'}
                          </p>
                        </div>
                      </div>

                      {canEdit && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(std);
                          }}
                          className="no-print p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
                          title="Ubah Jabatan"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                      <p className="text-xs text-slate-700 leading-relaxed">
                        <strong className="text-slate-900 block mb-0.5">Tugas Pokok & Fungsi (Tupoksi):</strong>
                        {std.classRoleDuty || 'Aktif mengikuti kegiatan belajar dan menjaga kerukunan kelas.'}
                      </p>
                      <div className="text-[11px] text-slate-600">
                        Wali: <span className="font-medium text-slate-700">{std.parentName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-indigo-600 font-semibold">
                    <span>Lihat kartu jabatan lengkap</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Notes on Leadership Character */}
        <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800">
                Pendidikan Karakter & Tanggung Jawab Kelas (Profil Pelajar Pancasila)
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                Struktur organisasi ini dievaluasi secara berkala oleh Wali Kelas untuk memberikan kesempatan belajar kepemimpinan secara bergiliran dan adil bagi seluruh siswa.
              </p>
            </div>
          </div>
          {canEdit && (
            <p className="text-[11px] text-indigo-700 font-semibold shrink-0">
              * Mode Guru Aktif: Anda dapat mengubah jabatan siswa kapan saja.
            </p>
          )}
        </div>
      </div>

      {/* DETAIL MODAL: DETAIL JABATAN SISWA */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl ${
                    selectedStudentDetail.avatarBgColor || 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {selectedStudentDetail.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                      {selectedStudentDetail.classRole || 'Anggota Kelas'}
                    </span>
                    {highlightStudentId === selectedStudentDetail.id && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                        ⭐ Ananda
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                    {selectedStudentDetail.name}
                  </h3>
                  <p className="text-xs text-slate-600 font-mono">
                    NISN: {selectedStudentDetail.nisn} · {schoolProfile.classGrade}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Tugas Pokok & Tanggung Jawab (Tupoksi)</span>
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed font-normal">
                  {selectedStudentDetail.classRoleDuty ||
                    'Menjaga ketertiban suasana kelas, aktif belajar dan bekerja sama dalam seluruh tugas kelompok.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
                  <span className="text-slate-600 block text-[11px]">Nama Orang Tua / Wali</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">
                    {selectedStudentDetail.parentName}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
                  <span className="text-slate-600 block text-[11px]">No. Narahubung Orang Tua</span>
                  <span className="font-bold text-slate-900 font-mono mt-0.5 block">
                    {selectedStudentDetail.parentPhone}
                  </span>
                </div>
              </div>

              {highlightStudentId === selectedStudentDetail.id && (
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs text-amber-900">
                  <p className="font-bold mb-1 flex items-center gap-1">
                    <HeartHandshake className="w-4 h-4 text-amber-700" />
                    <span>Pesan Bimbingan untuk Ayah & Bunda:</span>
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    Amanah ini merupakan sarana melatih karakter kepemimpinan dan empati ananda. Mohon selalu beri apresiasi di rumah dan dorong ananda untuk ramah serta jujur.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
              {canEdit ? (
                <button
                  onClick={() => {
                    handleOpenEdit(selectedStudentDetail);
                    setSelectedStudentDetail(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Ubah Jabatan Siswa</span>
                </button>
              ) : (
                <span className="text-[11px] text-slate-600">SIM Sekolah Terpadu</span>
              )}

              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ROLE MODAL: UNTUK GURU KELAS & ADMIN */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Ubah Jabatan Struktur Kelas
                </h3>
                <p className="text-xs text-slate-500">
                  Perbarui jabatan dan tupoksi untuk <strong className="text-slate-800">{editingStudent.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditRole} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Format Jabatan Cepat (Preset)
                </label>
                <select
                  value={editRoleName}
                  onChange={(e) => handleRolePresetChange(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  {DEFAULT_ROLE_OPTIONS.map((opt) => (
                    <option key={opt.role} value={opt.role}>
                      {opt.role}
                    </option>
                  ))}
                  <option value="Kustom">-- Tulis Jabatan Lainnya --</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Jabatan Resmi di Kelas
                </label>
                <input
                  type="text"
                  value={editRoleName}
                  onChange={(e) => setEditRoleName(e.target.value)}
                  placeholder="Contoh: Ketua Kelas, Seksi Kebersihan..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi Tugas Pokok & Fungsi (Tupoksi)
                </label>
                <textarea
                  rows={3}
                  value={editDutyText}
                  onChange={(e) => setEditDutyText(e.target.value)}
                  placeholder="Jelaskan peran tanggung jawab siswa ini agar terbaca jelas oleh orang tua..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
                <p className="text-[11px] text-slate-600 mt-1">
                  Deskripsi ini akan langsung tampil di dashboard orang tua anak terkait.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
