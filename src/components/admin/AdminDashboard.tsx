import React, { useState, useEffect } from 'react';
import { useEduStore } from '../../services/store';
import { SchoolProfile, SubjectItem, LearningObjective } from '../../types';
import {
  School,
  FileText,
  KeyRound,
  Plus,
  Save,
  Trash2,
  Edit2,
  CheckCircle2,
  Copy,
  RotateCw,
  Search,
  BookOpen,
  UserCheck,
  Printer,
  FileSpreadsheet,
  Download,
  Sparkles,
  Shield,
  HeartHandshake,
  Lock,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface AdminDashboardProps {
  currentTab?: string;
  onTabChange?: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentTab, onTabChange }) => {
  const {
    schoolProfile,
    updateSchoolProfile,
    subjects,
    addSubject,
    deleteSubject,
    learningObjectives,
    addLearningObjective,
    deleteLearningObjective,
    users,
    students,
    resetUserPassword,
    journalEntries,
    internalGrades,
    caseRecords,
    paiAssessments,
    starAwards,
  } = useEduStore();

  const [activeTab, setActiveTabState] = useState<'profil' | 'kurikulum' | 'password' | 'laporan'>(
    (currentTab as any) || 'profil'
  );

  useEffect(() => {
    if (currentTab && ['profil', 'kurikulum', 'password', 'laporan'].includes(currentTab)) {
      setActiveTabState(currentTab as any);
    }
  }, [currentTab]);

  const setActiveTab = (tab: 'profil' | 'kurikulum' | 'password' | 'laporan') => {
    setActiveTabState(tab);
    if (onTabChange) onTabChange(tab);
  };

  const [profileForm, setProfileForm] = useState<SchoolProfile>({ ...schoolProfile });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Subject Modal / Form
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjCode, setNewSubjCode] = useState('');
  const [newSubjTeacher, setNewSubjTeacher] = useState('');

  // Learning Objective (CP & TP) Form
  const [showAddLoModal, setShowAddLoModal] = useState(false);
  const [loSubjectId, setLoSubjectId] = useState(subjects[0]?.id || '');
  const [loCp, setLoCp] = useState('');
  const [loTp, setLoTp] = useState('');
  const [loSemester, setLoSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');

  // Password search & reset feedback
  const [userSearch, setUserSearch] = useState('');
  const [recentResetPassword, setRecentResetPassword] = useState<{ userId: string; pass: string } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolProfile(profileForm);
    showToast('Identitas dan Kop Surat Sekolah berhasil disimpan ke database!');
  };

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjName.trim() || !newSubjCode.trim()) return;
    addSubject({
      name: newSubjName.trim(),
      code: newSubjCode.trim().toUpperCase(),
      teacherName: newSubjTeacher.trim() || 'Guru Pengampu',
    });
    setNewSubjName('');
    setNewSubjCode('');
    setNewSubjTeacher('');
    setShowAddSubjectModal(false);
    showToast('Mata Pelajaran berhasil ditambahkan!');
  };

  const handleCreateLo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loCp.trim() || !loTp.trim()) return;
    const subj = subjects.find((s) => s.id === loSubjectId);
    addLearningObjective({
      subjectId: loSubjectId,
      subjectName: subj ? subj.name : 'Mata Pelajaran',
      capaianPembelajaran: loCp.trim(),
      tujuanPembelajaran: loTp.trim(),
      semester: loSemester,
      grade: schoolProfile.classGrade,
    });
    setLoCp('');
    setLoTp('');
    setShowAddLoModal(false);
    showToast('Capaian (CP) & Tujuan Pembelajaran (TP) berhasil ditambahkan!');
  };

  const handleResetPassword = (userId: string, userName: string) => {
    const newPass = resetUserPassword(userId);
    setRecentResetPassword({ userId, pass: newPass });
    navigator.clipboard.writeText(newPass);
    showToast(`Password untuk ${userName} direset menjadi: ${newPass} (Disalin ke clipboard)`);
  };

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.title.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-md shadow-slate-200">
            <School className="w-6 h-6 text-slate-200" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              PANEL ADMINISTRATOR SIM SEKOLAH
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Personalisasi Sekolah & Manajemen Sistem
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola profil umum, kop surat, master kurikulum (CP & TP), dan bantuan lupa password seluruh akun
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto scrollbar-thin">
          <button
            onClick={() => setActiveTab('profil')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'profil' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <School className="w-4 h-4" />
            <span>Profil & Kop</span>
          </button>
          <button
            onClick={() => setActiveTab('kurikulum')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'kurikulum' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Kurikulum CP & TP</span>
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'password' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Bantuan Password ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('laporan')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'laporan' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Rekap Eksekutif & Unduh Dokumen</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Profil & Kop Surat */}
      {activeTab === 'profil' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Pengaturan Identitas & Kop Surat</h3>
            <p className="text-xs text-slate-500 mb-6">
              Data ini akan muncul di kop jurnal kelas, kartu login orang tua, dan dokumen resmi cetak lainnya.
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Resmi Sekolah</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Pokok Sekolah (NPSN)</label>
                  <input
                    type="text"
                    value={profileForm.npsn}
                    onChange={(e) => setProfileForm({ ...profileForm, npsn: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Baris Kop 1 (Instansi / Dinas)</label>
                <input
                  type="text"
                  value={profileForm.kopLine1}
                  onChange={(e) => setProfileForm({ ...profileForm, kopLine1: e.target.value })}
                  placeholder="PEMERINTAH PROVINSI ... · DINAS PENDIDIKAN"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Baris Kop 2 (Nama Satuan Pendidikan)</label>
                <input
                  type="text"
                  value={profileForm.kopLine2}
                  onChange={(e) => setProfileForm({ ...profileForm, kopLine2: e.target.value })}
                  placeholder="SEKOLAH DASAR NEGERI ..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subteks Kop (Akreditasi & Kontak Resmi)</label>
                <input
                  type="text"
                  value={profileForm.kopSubtext}
                  onChange={(e) => setProfileForm({ ...profileForm, kopSubtext: e.target.value })}
                  placeholder="Terakreditasi A · NSS: ... · Alamat lengkap"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kelas Binaan</label>
                  <input
                    type="text"
                    value={profileForm.classGrade}
                    onChange={(e) => setProfileForm({ ...profileForm, classGrade: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun Ajaran</label>
                  <input
                    type="text"
                    value={profileForm.academicYear}
                    onChange={(e) => setProfileForm({ ...profileForm, academicYear: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Semester Aktif</label>
                  <select
                    value={profileForm.semester}
                    onChange={(e) => setProfileForm({ ...profileForm, semester: e.target.value as 'Ganjil' | 'Genap' })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kepala Sekolah</label>
                  <input
                    type="text"
                    value={profileForm.principalName}
                    onChange={(e) => setProfileForm({ ...profileForm, principalName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">NIP Kepala Sekolah</label>
                  <input
                    type="text"
                    value={profileForm.principalNip}
                    onChange={(e) => setProfileForm({ ...profileForm, principalNip: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Lengkap</label>
                <textarea
                  rows={2}
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-colors"
                >
                  <Save className="w-4 h-4 text-emerald-400" />
                  <span>Simpan Perubahan ke Database</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Col: Live Preview Kop Surat */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                LIVE PREVIEW KOP SURAT RESMI
              </span>
              <p className="text-xs text-slate-500 mb-4">
                Berikut pratinjau tampilan kop yang akan dicetak pada kartu login siswa dan dokumen jurnal:
              </p>

              <div className="border border-slate-300 rounded-xl p-5 bg-slate-50/50 text-center font-serif relative">
                <div className="flex items-center justify-center gap-3 border-b-2 border-slate-900 pb-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0">
                    <School className="w-7 h-7" />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-bold tracking-wider text-slate-800 uppercase font-sans">
                      {profileForm.kopLine1 || 'DINAS PENDIDIKAN'}
                    </h5>
                    <h4 className="text-sm font-extrabold text-slate-900 uppercase font-sans tracking-tight">
                      {profileForm.kopLine2 || profileForm.name}
                    </h4>
                    <p className="text-[10px] text-slate-600 font-sans mt-0.5">
                      {profileForm.kopSubtext || profileForm.address}
                    </p>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 font-sans flex justify-between">
                  <span>KELAS: {profileForm.classGrade}</span>
                  <span>TA: {profileForm.academicYear} ({profileForm.semester})</span>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 text-xs text-indigo-950 space-y-2">
              <h4 className="font-bold text-indigo-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                <span>Penyimpanan Terpusat & Real-Time</span>
              </h4>
              <p className="text-indigo-800 leading-relaxed">
                Setiap kali Admin memperbarui data di formulir ini, seluruh modul (Guru Kelas, Guru BK, Guru PAI, dan Kartu Cetak Orang Tua) akan membaca nama sekolah dan kurikulum terbaru secara otomatis.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Kurikulum & Pembelajaran (Mapel, CP & TP) */}
      {activeTab === 'kurikulum' && (
        <div className="space-y-6">
          {/* Section A: Daftar Mata Pelajaran */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Daftar Mata Pelajaran (Mapel)</h3>
                <p className="text-xs text-slate-500">Mata pelajaran yang akan dipilih guru kelas saat mengisi jurnal harian</p>
              </div>
              <button
                onClick={() => setShowAddSubjectModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Mata Pelajaran</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((sub) => (
                <div
                  key={sub.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-2 hover:border-slate-300 transition-colors"
                >
                  <div>
                    <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                      {sub.code}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{sub.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Pengampu: {sub.teacherName}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus mata pelajaran ${sub.name}?`)) {
                        deleteSubject(sub.id);
                        showToast(`Mata pelajaran ${sub.name} dihapus.`);
                      }
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors"
                    title="Hapus Mapel"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section B: Capaian Pembelajaran (CP) & Tujuan Pembelajaran (TP) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Bank Capaian Pembelajaran (CP) & Tujuan Pembelajaran (TP)
                </h3>
                <p className="text-xs text-slate-500">
                  Kurikulum Merdeka: Data ini ditarik langsung oleh Guru Kelas saat membuat Jurnal Harian
                </p>
              </div>
              <button
                onClick={() => setShowAddLoModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah CP / TP Baru</span>
              </button>
            </div>

            <div className="space-y-4">
              {learningObjectives.map((lo) => (
                <div
                  key={lo.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {lo.subjectName}
                      </span>
                      <span className="text-[11px] text-slate-500">Semester {lo.semester} · {lo.grade}</span>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Hapus butir CP/TP ini?')) {
                          deleteLearningObjective(lo.id);
                          showToast('Butir CP/TP berhasil dihapus.');
                        }
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      CAPAIAN PEMBELAJARAN (CP):
                    </span>
                    <p className="text-xs text-slate-800 leading-relaxed font-medium">
                      {lo.capaianPembelajaran}
                    </p>
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">
                      TUJUAN PEMBELAJARAN (TP):
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {lo.tujuanPembelajaran}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Bantuan Lupa Password Seluruh User */}
      {activeTab === 'password' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Pusat Bantuan Kredensial & Reset Kata Sandi
              </h3>
              <p className="text-xs text-slate-500">
                Fitur resmi Admin untuk membantu guru atau orang tua murid yang lupa password akunnya
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Cari nama atau username..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            </div>
          </div>

          {/* User Accounts Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Nama Pengguna & Peran</th>
                  <th className="py-3 px-4">Username Akun</th>
                  <th className="py-3 px-4">Password Saat Ini</th>
                  <th className="py-3 px-4">Kontak / Tautan Siswa</th>
                  <th className="py-3 px-4 text-right">Tindakan Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const student = students.find((s) => s.id === u.studentId);
                  const isRecentlyReset = recentResetPassword?.userId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            u.role === 'admin'
                              ? 'bg-slate-800 text-white'
                              : u.role === 'guru_kelas'
                              ? 'bg-indigo-100 text-indigo-700'
                              : u.role === 'guru_bk'
                              ? 'bg-rose-100 text-rose-700'
                              : u.role === 'guru_pai'
                              ? 'bg-teal-100 text-teal-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {u.role.replace('_', ' ').toUpperCase()}
                          </span>
                          <span>{u.title}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700 font-semibold">
                        {u.username}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono px-2 py-0.5 rounded text-[11px] ${
                            isRecentlyReset ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {u.password}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(u.password);
                              showToast(`Password ${u.username} disalin ke clipboard!`);
                            }}
                            className="text-slate-400 hover:text-slate-700"
                            title="Salin Password"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {isRecentlyReset && (
                          <span className="text-[10px] text-emerald-600 block mt-0.5 font-semibold">
                            Baru saja direset!
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {student ? (
                          <div>
                            <span className="font-semibold text-slate-900">{student.name}</span>
                            <span className="text-[11px] text-slate-400 block font-mono">NISN: {student.nisn}</span>
                          </div>
                        ) : (
                          <span className="font-mono text-slate-500">{u.phone || u.email || '-'}</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleResetPassword(u.id, u.name)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors shadow-2xs"
                        >
                          <RotateCw className="w-3 h-3" />
                          <span>Reset Password</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Rekap Eksekutif & Unduh Dokumen Sekolah */}
      {activeTab === 'laporan' && (
        <div className="space-y-6">
          {/* Header Action Bar (Hidden in Print) */}
          <div className="no-print bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-2">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>ARSIP EKSEKUTIF KEPALA SEKOLAH & ADMINISTRATOR</span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Rekapitulasi Dokumen & Berkas Laporan Terpadu
              </h3>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Pusat pengunduhan laporan resmi seluruh kegiatan jurnal mengajar, rekap bimbingan konseling, penilaian PAI, dan data siswa dengan format cetak standar dinas pendidikan.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-start md:self-auto shrink-0">
              <button
                onClick={() => {
                  let csv = `REKAPITULASI EKSEKUTIF JURNAL DAN KEGIATAN SEKOLAH\n`;
                  csv += `Sekolah:,"${schoolProfile.name}"\n`;
                  csv += `NPSN:,"${schoolProfile.npsn}"\n`;
                  csv += `Tahun Ajaran:,"${schoolProfile.academicYear} (${schoolProfile.semester})"\n`;
                  csv += `Kelas Binaan:,"${schoolProfile.classGrade}"\n`;
                  csv += `Tanggal Ekspor:,"${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}"\n\n`;

                  csv += `=== 1. REKAP JURNAL KELAS ===\n`;
                  csv += `No,Tanggal,Jam,Mata Pelajaran,Tujuan Pembelajaran,Aktivitas,Hadir,Sakit,Izin,Alpa,Guru Pengajar\n`;
                  journalEntries.forEach((j, i) => {
                    csv += `${i + 1},"${j.date}","${j.timeSlot}","${j.subjectName}","${j.tpDescription.replace(/"/g, '""')}","${j.activityDescription.replace(/"/g, '""')}",${j.attendancePresent},${j.attendanceSick},${j.attendancePermit},${j.attendanceAbsent},"${j.teacherName}"\n`;
                  });

                  csv += `\n=== 2. REKAP KASUS & KONSELING BK ===\n`;
                  csv += `No,Tanggal,Siswa,Kategori,Tingkat,Status,Konselor\n`;
                  caseRecords.forEach((c, i) => {
                    csv += `${i + 1},"${c.date}","${c.studentName}","${c.category}","${c.severity}","${c.status}","${c.counselorName}"\n`;
                  });

                  csv += `\n=== 3. REKAP PENILAIAN PAI ===\n`;
                  csv += `No,Nama Penilaian,Aspek,Tanggal,Jumlah Sub-Indikator\n`;
                  paiAssessments.forEach((p, i) => {
                    csv += `${i + 1},"${p.title}","${p.aspectCategory}","${p.date}",${p.subIndicators.length}\n`;
                  });

                  const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csv);
                  const link = document.createElement('a');
                  link.setAttribute('href', encodedUri);
                  link.setAttribute(
                    'download',
                    `Rekap_Eksekutif_Sekolah_${schoolProfile.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
                  );
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  showToast('Berkas eksekutif sekolah berhasil diunduh ke CSV!');
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-semibold transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Unduh Rekap CSV</span>
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Berkas Laporan (PDF)</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar (Hidden in Print) */}
          <div className="no-print grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium">Siswa Terdaftar</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{students.length}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium">Jurnal Harian</span>
              <p className="text-2xl font-black text-indigo-700 mt-1">{journalEntries.length}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium">Buku Nilai Guru</span>
              <p className="text-2xl font-black text-amber-700 mt-1">{internalGrades.length}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium">Layanan BK</span>
              <p className="text-2xl font-black text-rose-700 mt-1">{caseRecords.length}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium">Asesmen PAI</span>
              <p className="text-2xl font-black text-teal-700 mt-1">{paiAssessments.length}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium">Catatan Bintang</span>
              <p className="text-2xl font-black text-amber-500 mt-1">{starAwards.length}</p>
            </div>
          </div>

          {/* Printable Official Document Sheet (Optimized for Screen & Print) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 print:p-0 print:border-none print:shadow-none space-y-6">
            {/* Official School Letterhead (KOP SURAT) */}
            <div className="border-b-4 border-double border-slate-900 pb-5 text-center relative">
              <div className="flex items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shrink-0 print:border print:border-slate-800">
                  <School className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold tracking-widest text-slate-700 uppercase">
                    {schoolProfile.kopLine1 || 'PEMERINTAH KABUPATEN / KOTA · DINAS PENDIDIKAN'}
                  </h3>
                  <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-950 uppercase mt-0.5">
                    {schoolProfile.name}
                  </h1>
                  <h4 className="text-xs font-semibold text-slate-800 tracking-wide mt-0.5">
                    {schoolProfile.kopLine2 || 'STATUS TERAKREDITASI "A" · NPSN ' + schoolProfile.npsn}
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-tight font-sans">
                    {schoolProfile.address}, Kec. {schoolProfile.district}, {schoolProfile.city}, Prov. {schoolProfile.province} {schoolProfile.postalCode}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Telp: {schoolProfile.phone} · Surel: {schoolProfile.email} · Website: {schoolProfile.website}
                  </p>
                </div>
              </div>
            </div>

            {/* Document Title Strip */}
            <div className="text-center py-2 space-y-1">
              <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase underline decoration-2 underline-offset-4 tracking-wide">
                LAPORAN EKSEKUTIF REKAPITULASI JURNAL & PEMBELAJARAN
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Tahun Ajaran {schoolProfile.academicYear} · Semester {schoolProfile.semester} · {schoolProfile.classGrade}
              </p>
            </div>

            {/* Section 1: Ringkasan Jurnal Harian Mengajar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>I. Rekapitulasi Jurnal Mengajar Guru Kelas ({journalEntries.length} Sesi Terlaksana)</span>
                </h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 border-y border-slate-300 font-bold">
                      <th className="p-2.5 text-center w-10">No</th>
                      <th className="p-2.5 w-24">Tanggal</th>
                      <th className="p-2.5 w-28">Jam Ke-</th>
                      <th className="p-2.5 w-32">Mata Pelajaran</th>
                      <th className="p-2.5">Tujuan Pembelajaran & Uraian Kegiatan</th>
                      <th className="p-2.5 text-center w-28">Presensi (H/S/I/A)</th>
                      <th className="p-2.5 w-36">Guru Pengampu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {journalEntries.map((j, idx) => (
                      <tr key={j.id} className="hover:bg-slate-50/80">
                        <td className="p-2.5 text-center font-mono">{idx + 1}</td>
                        <td className="p-2.5 font-mono text-[11px] whitespace-nowrap">{j.date}</td>
                        <td className="p-2.5 font-mono text-[11px]">{j.timeSlot}</td>
                        <td className="p-2.5 font-bold text-slate-900">{j.subjectName}</td>
                        <td className="p-2.5">
                          <p className="font-semibold text-slate-800">{j.tpDescription}</p>
                          <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{j.activityDescription}</p>
                        </td>
                        <td className="p-2.5 text-center font-mono text-[11px]">
                          <span className="text-emerald-700 font-bold">{j.attendancePresent}</span>/
                          <span className="text-amber-700">{j.attendanceSick}</span>/
                          <span className="text-blue-700">{j.attendancePermit}</span>/
                          <span className="text-rose-700 font-bold">{j.attendanceAbsent}</span>
                        </td>
                        <td className="p-2.5 text-slate-700 text-[11px]">{j.teacherName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 2: Layanan Bimbingan Konseling & Kasus Siswa */}
            <div className="space-y-3 pt-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-rose-600" />
                  <span>II. Rekapitulasi Layanan Bimbingan Konseling (BK)</span>
                </h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 border-y border-slate-300 font-bold">
                      <th className="p-2.5 text-center w-10">No</th>
                      <th className="p-2.5 w-24">Tanggal</th>
                      <th className="p-2.5 w-40">Nama Siswa</th>
                      <th className="p-2.5 w-36">Kategori Masalah</th>
                      <th className="p-2.5">Uraian Kasus & Tindak Lanjut Konseling</th>
                      <th className="p-2.5 text-center w-28">Status</th>
                      <th className="p-2.5 text-center w-28">Lapor Ortu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {caseRecords.map((c, idx) => (
                      <tr key={c.id} className="hover:bg-slate-50/80">
                        <td className="p-2.5 text-center font-mono">{idx + 1}</td>
                        <td className="p-2.5 font-mono text-[11px]">{c.date}</td>
                        <td className="p-2.5 font-bold text-slate-900">{c.studentName}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 border border-slate-200">
                            {c.category}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <p className="text-slate-800">{c.description}</p>
                          <p className="text-[11px] text-slate-500 italic mt-0.5">Tindak lanjut: {c.followUpAction}</p>
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.status === 'Selesai' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-semibold text-[11px]">
                          {c.isReportedToParent ? 'Tersinkron' : 'Internal'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Official Signatures Verification Area */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-16">
                <div>
                  <p className="text-slate-500">Diverifikasi oleh Administrator SIM,</p>
                  <p className="font-bold text-slate-900 mt-0.5">Admin Pengelola Data Sekolah</p>
                </div>
                <div>
                  <p className="font-bold text-slate-900 underline text-sm">
                    {users.find((u) => u.role === 'admin')?.name || 'Admin SIM Terpadu'}
                  </p>
                  <p className="text-slate-500 font-mono text-[11px]">NIP. 19850312 201001 1 008</p>
                </div>
              </div>

              <div className="space-y-16">
                <div>
                  <p className="text-slate-500">{schoolProfile.city}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="font-bold text-slate-900 mt-0.5">Mengetahui, Kepala Sekolah</p>
                </div>
                <div>
                  <p className="font-bold text-slate-900 underline text-sm">
                    {schoolProfile.principalName}
                  </p>
                  <p className="text-slate-500 font-mono text-[11px]">NIP. {schoolProfile.principalNip}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Mata Pelajaran */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Tambah Mata Pelajaran Baru</h3>
            <p className="text-xs text-slate-500 mb-4">Mata pelajaran akan tersedia di template jurnal guru.</p>

            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Mata Pelajaran</label>
                <input
                  type="text"
                  placeholder="Contoh: Bahasa Inggris"
                  value={newSubjName}
                  onChange={(e) => setNewSubjName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Singkat</label>
                <input
                  type="text"
                  placeholder="Contoh: BING"
                  value={newSubjCode}
                  onChange={(e) => setNewSubjCode(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Guru Pengampu</label>
                <input
                  type="text"
                  placeholder="Nama guru pengampu mapel"
                  value={newSubjTeacher}
                  onChange={(e) => setNewSubjTeacher(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                >
                  Simpan Mapel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah CP / TP */}
      {showAddLoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Tambah Capaian & Tujuan Pembelajaran</h3>
            <p className="text-xs text-slate-500 mb-4">Kurikulum Merdeka {schoolProfile.classGrade}</p>

            <form onSubmit={handleCreateLo} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mata Pelajaran</label>
                  <select
                    value={loSubjectId}
                    onChange={(e) => setLoSubjectId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Semester</label>
                  <select
                    value={loSemester}
                    onChange={(e) => setLoSemester(e.target.value as 'Ganjil' | 'Genap')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Capaian Pembelajaran (CP)
                </label>
                <textarea
                  rows={3}
                  placeholder="Uraikan kompetensi capaian pembelajaran fase / elemen..."
                  value={loCp}
                  onChange={(e) => setLoCp(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tujuan Pembelajaran (TP)
                </label>
                <textarea
                  rows={2}
                  placeholder="Tujuan spesifik yang ditargetkan dalam pertemuan..."
                  value={loTp}
                  onChange={(e) => setLoTp(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddLoModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                >
                  Simpan CP/TP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
