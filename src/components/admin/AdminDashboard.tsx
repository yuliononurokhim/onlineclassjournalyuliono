import React, { useState, useEffect, useRef } from 'react';
import { useEduStore } from '../../services/store';
import { ImpersonateModal } from '../common/ImpersonateModal';
import { SchoolProfile, SubjectItem, LearningObjective, UserAccount, UserRole, Student } from '../../types';
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
  AlertCircle,
  Users,
  UserPlus,
  Phone,
  Mail,
  Share2,
  ExternalLink,
  Eye,
  EyeOff,
  Check,
  X,
  Filter,
  AlertTriangle,
  BadgeCheck,
  Info
} from 'lucide-react';

const LANDING_FEATURES: {
  key: keyof NonNullable<SchoolProfile['landingFeatures']>;
  label: string;
}[] = [
  { key: 'dailyReports', label: 'Laporan harian/mingguan' },
  { key: 'gallery', label: 'Galeri foto & video' },
  { key: 'agenda', label: 'Agenda & tugas' },
];

interface AdminDashboardProps {
  currentTab?: string;
  onTabChange?: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentTab, onTabChange }) => {
  const {
    version,
    schoolProfile,
    updateSchoolProfile,
    subjects,
    addSubject,
    updateSubject,
    deleteSubject,
    learningObjectives,
    addLearningObjective,
    updateLearningObjective,
    deleteLearningObjective,
    users,
    addUser,
    updateUser,
    deleteUser,
    currentUser,
    students,
    resetUserPassword,
    journalEntries,
    internalGrades,
    caseRecords,
    paiAssessments,
    starAwards,
    impersonateUser,
  } = useEduStore();

  const [showImpersonateModal, setShowImpersonateModal] = useState(false);
  const [activeTab, setActiveTabState] = useState<'profil' | 'kurikulum' | 'guru' | 'password' | 'laporan'>(
    (currentTab as any) || 'profil'
  );

  // Sub-view toggle inside Teacher Management & Credential Center
  const [teacherSubTab, setTeacherSubTab] = useState<'guru' | 'password'>('guru');

  useEffect(() => {
    if (currentTab && ['profil', 'kurikulum', 'guru', 'password', 'laporan'].includes(currentTab)) {
      setActiveTabState((prev) => (prev !== currentTab ? (currentTab as any) : prev));
      if (currentTab === 'password') {
        setTeacherSubTab((prev) => (prev !== 'password' ? 'password' : prev));
      } else if (currentTab === 'guru') {
        setTeacherSubTab((prev) => (prev !== 'guru' ? 'guru' : prev));
      }
    }
  }, [currentTab]);

  const setActiveTab = (tab: 'profil' | 'kurikulum' | 'guru' | 'password' | 'laporan') => {
    setActiveTabState(tab);
    if (onTabChange) onTabChange(tab);
  };

  const [profileForm, setProfileForm] = useState<SchoolProfile>(() => ({ ...schoolProfile }));
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const isProfileDirtyRef = useRef(false);
  const lastProfileJsonRef = useRef(JSON.stringify(schoolProfile));

  // Sync profileForm only when schoolProfile is externally updated AND form is not dirty
  useEffect(() => {
    const currentJson = JSON.stringify(schoolProfile);
    if (currentJson !== lastProfileJsonRef.current) {
      lastProfileJsonRef.current = currentJson;
      if (!isProfileDirtyRef.current) {
        setProfileForm({ ...schoolProfile });
      }
    }
  }, [schoolProfile]);

  // Subject Modal / Form
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjCode, setNewSubjCode] = useState('');
  const [newSubjTeacher, setNewSubjTeacher] = useState('');

  // Subject Edit Modal / Form
  const [showEditSubjectModal, setShowEditSubjectModal] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState<SubjectItem | null>(null);
  const [editSubjName, setEditSubjName] = useState('');
  const [editSubjCode, setEditSubjCode] = useState('');
  const [editSubjTeacher, setEditSubjTeacher] = useState('');

  // Learning Objective (CP & TP) Add Form
  const [showAddLoModal, setShowAddLoModal] = useState(false);
  const [loSubjectId, setLoSubjectId] = useState(subjects[0]?.id || '');
  const [loCp, setLoCp] = useState('');
  const [loTp, setLoTp] = useState('');
  const [loSemester, setLoSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');

  // Learning Objective (CP & TP) Edit Form
  const [showEditLoModal, setShowEditLoModal] = useState(false);
  const [loToEdit, setLoToEdit] = useState<LearningObjective | null>(null);
  const [editLoSubjectId, setEditLoSubjectId] = useState('');
  const [editLoCp, setEditLoCp] = useState('');
  const [editLoTp, setEditLoTp] = useState('');
  const [editLoSemester, setEditLoSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');

  // Teacher Management State
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherRoleFilter, setTeacherRoleFilter] = useState<'all' | 'guru_kelas' | 'guru_bk' | 'guru_pai' | 'admin'>('all');
  const [teacherStatusFilter, setTeacherStatusFilter] = useState<'all' | 'aktif' | 'nonaktif'>('all');

  // Modals for Teacher CRUD
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [showEditTeacherModal, setShowEditTeacherModal] = useState(false);
  const [teacherToEdit, setTeacherToEdit] = useState<UserAccount | null>(null);
  const [showDeleteTeacherModal, setShowDeleteTeacherModal] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<UserAccount | null>(null);

  // Form State for Add / Edit Teacher
  const [teacherFormData, setTeacherFormData] = useState({
    name: '',
    nip: '',
    role: 'guru_kelas' as UserRole,
    title: '',
    subjectAssignment: '',
    username: '',
    password: '',
    phone: '',
    email: '',
    status: 'aktif' as 'aktif' | 'nonaktif',
  });

  // Password search & reset feedback state
  const [userSearch, setUserSearch] = useState('');
  const [accountCategoryFilter, setAccountCategoryFilter] = useState<'all' | 'guru' | 'ortu'>('all');
  const [recentResetPassword, setRecentResetPassword] = useState<{ userId: string; pass: string } | null>(null);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // Reset Password Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<UserAccount | null>(null);
  const [resetMode, setResetMode] = useState<'auto' | 'custom'>('auto');
  const [customPasswordInput, setCustomPasswordInput] = useState('');
  const [resetSuccessModalData, setResetSuccessModalData] = useState<{ user: UserAccount; pass: string } | null>(null);

  // Credential Slip Print Modal State
  const [showCredentialSlipModal, setShowCredentialSlipModal] = useState(false);
  const [slipTargetUser, setSlipTargetUser] = useState<UserAccount | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolProfile(profileForm);
    isProfileDirtyRef.current = false;
    lastProfileJsonRef.current = JSON.stringify(profileForm);
    showToast('Identitas dan Kop Surat Sekolah berhasil disimpan ke database!');
  };

  const handleDiscardProfileEdits = () => {
    isProfileDirtyRef.current = false;
    setProfileForm({ ...schoolProfile });
    showToast('Perubahan formulir dibatalkan.');
  };

  const handleProfileFieldChange = <K extends keyof SchoolProfile>(field: K, value: SchoolProfile[K]) => {
    isProfileDirtyRef.current = true;
    setProfileForm((prev) => ({ ...prev, [field]: value }));
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

  // Open Edit Subject Modal
  const handleOpenEditSubject = (subj: SubjectItem) => {
    setSubjectToEdit(subj);
    setEditSubjName(subj.name);
    setEditSubjCode(subj.code);
    setEditSubjTeacher(subj.teacherName);
    setShowEditSubjectModal(true);
  };

  // Save Edit Subject
  const handleSaveEditSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectToEdit || !editSubjName.trim() || !editSubjCode.trim()) return;
    updateSubject(subjectToEdit.id, {
      name: editSubjName.trim(),
      code: editSubjCode.trim().toUpperCase(),
      teacherName: editSubjTeacher.trim() || 'Guru Pengampu',
    });
    setShowEditSubjectModal(false);
    setSubjectToEdit(null);
    showToast(`Mata pelajaran "${editSubjName}" berhasil diperbarui!`);
  };

  // Open Edit CP & TP Modal
  const handleOpenEditLo = (lo: LearningObjective) => {
    setLoToEdit(lo);
    setEditLoSubjectId(lo.subjectId);
    setEditLoCp(lo.capaianPembelajaran);
    setEditLoTp(lo.tujuanPembelajaran);
    setEditLoSemester(lo.semester);
    setShowEditLoModal(true);
  };

  // Save Edit CP & TP
  const handleSaveEditLo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loToEdit || !editLoCp.trim() || !editLoTp.trim()) return;
    const subj = subjects.find((s) => s.id === editLoSubjectId);
    updateLearningObjective(loToEdit.id, {
      subjectId: editLoSubjectId,
      subjectName: subj ? subj.name : loToEdit.subjectName,
      capaianPembelajaran: editLoCp.trim(),
      tujuanPembelajaran: editLoTp.trim(),
      semester: editLoSemester,
    });
    setShowEditLoModal(false);
    setLoToEdit(null);
    showToast('Capaian (CP) & Tujuan Pembelajaran (TP) berhasil diperbarui!');
  };

  // Helper to generate a clean username from name and role
  const generateSuggestedUsername = (name: string, role: string) => {
    const clean = name
      .toLowerCase()
      .replace(/dr[s\.]|hj\.|h\.|s\.pd|s\.kom|m\.pd|m\.psi|s\.or|s\.pd\.i|ust\.|ibu|bpk\./gi, '')
      .replace(/[^a-z0-9]/g, '_')
      .split('_')
      .filter(Boolean)
      .slice(0, 2)
      .join('_');
    const suffix = role === 'guru_kelas' ? 'kelas' : role === 'guru_bk' ? 'bk' : role === 'guru_pai' ? 'pai' : 'guru';
    return clean ? `${clean}_${suffix}` : `guru_${Math.floor(100 + Math.random() * 900)}`;
  };

  // Open Add Teacher Modal
  const handleOpenAddTeacher = () => {
    setTeacherFormData({
      name: '',
      nip: '',
      role: 'guru_kelas',
      title: 'Wali Kelas 4-A',
      subjectAssignment: 'Tematik & Mapel Umum',
      username: '',
      password: `GURU-${Math.floor(1000 + Math.random() * 9000)}`,
      phone: '',
      email: '',
      status: 'aktif',
    });
    setShowAddTeacherModal(true);
  };

  // Open Edit Teacher Modal
  const handleOpenEditTeacher = (teacher: UserAccount) => {
    setTeacherToEdit(teacher);
    setTeacherFormData({
      name: teacher.name,
      nip: teacher.nip || '',
      role: teacher.role,
      title: teacher.title,
      subjectAssignment: teacher.subjectAssignment || '',
      username: teacher.username,
      password: teacher.password,
      phone: teacher.phone || '',
      email: teacher.email || '',
      status: teacher.status || 'aktif',
    });
    setShowEditTeacherModal(true);
  };

  // Save New Teacher
  const handleSaveAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherFormData.name.trim() || !teacherFormData.username.trim() || !teacherFormData.password.trim()) {
      showToast('Harap lengkapi nama, username, dan kata sandi!');
      return;
    }

    // Check username uniqueness
    const exists = users.some(
      (u) => u.username.toLowerCase() === teacherFormData.username.trim().toLowerCase()
    );
    if (exists) {
      showToast(`Username "${teacherFormData.username}" sudah digunakan akun lain. Gunakan username berbeda.`);
      return;
    }

    addUser({
      name: teacherFormData.name.trim(),
      nip: teacherFormData.nip.trim() || '-',
      role: teacherFormData.role,
      title: teacherFormData.title.trim() || 'Tenaga Pendidik',
      subjectAssignment: teacherFormData.subjectAssignment.trim() || undefined,
      username: teacherFormData.username.trim(),
      password: teacherFormData.password.trim(),
      phone: teacherFormData.phone.trim() || undefined,
      email: teacherFormData.email.trim() || undefined,
      status: teacherFormData.status,
    });

    setShowAddTeacherModal(false);
    showToast(`Guru ${teacherFormData.name} berhasil ditambahkan ke sistem!`);
  };

  // Save Edit Teacher
  const handleSaveEditTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherToEdit) return;
    if (!teacherFormData.name.trim() || !teacherFormData.username.trim()) {
      showToast('Harap lengkapi nama dan username!');
      return;
    }

    // Check username uniqueness if changed
    if (teacherFormData.username.trim().toLowerCase() !== teacherToEdit.username.toLowerCase()) {
      const exists = users.some(
        (u) => u.id !== teacherToEdit.id && u.username.toLowerCase() === teacherFormData.username.trim().toLowerCase()
      );
      if (exists) {
        showToast(`Username "${teacherFormData.username}" sudah digunakan akun lain.`);
        return;
      }
    }

    updateUser(teacherToEdit.id, {
      name: teacherFormData.name.trim(),
      nip: teacherFormData.nip.trim() || '-',
      role: teacherFormData.role,
      title: teacherFormData.title.trim() || 'Tenaga Pendidik',
      subjectAssignment: teacherFormData.subjectAssignment.trim() || undefined,
      username: teacherFormData.username.trim(),
      password: teacherFormData.password.trim(),
      phone: teacherFormData.phone.trim() || undefined,
      email: teacherFormData.email.trim() || undefined,
      status: teacherFormData.status,
    });

    setShowEditTeacherModal(false);
    setTeacherToEdit(null);
    showToast(`Data guru ${teacherFormData.name} berhasil diperbarui!`);
  };

  // Open Delete Teacher Confirmation
  const handleOpenDeleteTeacher = (teacher: UserAccount) => {
    setTeacherToDelete(teacher);
    setShowDeleteTeacherModal(true);
  };

  // Confirm Delete Teacher
  const handleConfirmDeleteTeacher = () => {
    if (!teacherToDelete) return;

    if (currentUser && teacherToDelete.id === currentUser.id) {
      showToast('Gagal: Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif login.');
      setShowDeleteTeacherModal(false);
      return;
    }

    deleteUser(teacherToDelete.id);
    setShowDeleteTeacherModal(false);
    showToast(`Data guru ${teacherToDelete.name} berhasil dihapus dari sistem.`);
    setTeacherToDelete(null);
  };

  // Open Reset Password Dialog
  const handleOpenResetModal = (user: UserAccount) => {
    setResetTargetUser(user);
    setResetMode('auto');
    setCustomPasswordInput('');
    setResetSuccessModalData(null);
    setShowResetModal(true);
  };

  // Execute Password Reset
  const handleExecuteResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) return;

    let targetNewPass = '';
    if (resetMode === 'custom') {
      if (!customPasswordInput.trim()) {
        showToast('Harap masukkan password baru!');
        return;
      }
      targetNewPass = customPasswordInput.trim();
    } else {
      const prefix = resetTargetUser.role === 'orangtua' ? 'ORTU' : 'GURU';
      targetNewPass = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const finalPass = resetUserPassword(resetTargetUser.id, targetNewPass);
    setRecentResetPassword({ userId: resetTargetUser.id, pass: finalPass });
    setResetSuccessModalData({ user: resetTargetUser, pass: finalPass });
    showToast(`Password untuk ${resetTargetUser.name} berhasil direset menjadi: ${finalPass}`);
  };

  // WhatsApp share link generator
  const createWhatsAppLink = (user: UserAccount, pass: string) => {
    const rawPhone = user.phone ? user.phone.replace(/[^0-9]/g, '') : '';
    const cleanPhone = rawPhone.startsWith('0') ? '62' + rawPhone.slice(1) : rawPhone;
    const student = students.find((s) => s.id === user.studentId);
    const roleText = student ? `Wali Murid dari ${student.name}` : user.title;

    const message = `*SIM SEKOLAH - INFORMASI AKSES RESMI*
Sekolah: ${schoolProfile.name}
Penerima: ${user.name} (${roleText})

Yth. Bapak/Ibu,
Berikut adalah informasi kredensial akun login Anda pada Portal SIM Jurnal Sekolah:
👤 *Username* : ${user.username}
🔑 *Password* : ${pass}
🌐 *Website*  : ${window.location.origin}

Mohon simpan kata sandi ini dengan aman. Apabila membutuhkan bantuan lebih lanjut, silakan hubungi bagian Administrator Sekolah.
Terima kasih.`;

    const encoded = encodeURIComponent(message);
    return cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
  };

  // Open official credential slip modal
  const handleOpenSlipModal = (user: UserAccount) => {
    setSlipTargetUser(user);
    setShowCredentialSlipModal(true);
  };

  // Filtered teachers list (excluding parents)
  const teacherUsers = users.filter((u) => u.role !== 'orangtua');
  const filteredTeachers = teacherUsers.filter((u) => {
    const q = teacherSearch.toLowerCase();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.title.toLowerCase().includes(q) ||
      (u.nip && u.nip.toLowerCase().includes(q)) ||
      (u.subjectAssignment && u.subjectAssignment.toLowerCase().includes(q)) ||
      (u.phone && u.phone.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q));

    const matchesRole = teacherRoleFilter === 'all' || u.role === teacherRoleFilter;
    const matchesStatus =
      teacherStatusFilter === 'all' ||
      (teacherStatusFilter === 'aktif' ? u.status !== 'nonaktif' : u.status === 'nonaktif');

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Filtered users for Password Reset tab (teachers and parents)
  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    const student = students.find((s) => s.id === u.studentId);

    const matchesCategory =
      accountCategoryFilter === 'all' ||
      (accountCategoryFilter === 'guru' && u.role !== 'orangtua') ||
      (accountCategoryFilter === 'ortu' && u.role === 'orangtua');

    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.title.toLowerCase().includes(q) ||
      (u.phone && u.phone.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (student && (student.name.toLowerCase().includes(q) || student.nisn.toLowerCase().includes(q)));

    return matchesCategory && matchesSearch;
  });

  // Export teachers to CSV
  const handleExportTeachersCsv = () => {
    let csv = `DATA TENAGA PENDIDIK & GURU SEKOLAH\n`;
    csv += `Sekolah:,"${schoolProfile.name}"\n`;
    csv += `NPSN:,"${schoolProfile.npsn}"\n`;
    csv += `Tanggal Unduh:,"${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}"\n\n`;
    csv += `No,Nama Lengkap,NIP,Peran,Jabatan / Penugasan,Mata Pelajaran,Username,Status,No HP/WhatsApp,Email\n`;

    teacherUsers.forEach((t, i) => {
      csv += `${i + 1},"${t.name}","${t.nip || '-'}","${t.role}","${t.title}","${t.subjectAssignment || '-'}","${t.username}","${t.status || 'aktif'}","${t.phone || '-'}","${t.email || '-'}"\n`;
    });

    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daftar_Guru_${schoolProfile.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Data guru berhasil diunduh ke format CSV!');
  };

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
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
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
              Kelola profil umum, master kurikulum (CP & TP), manajemen data guru & hak akses, serta pusat reset kata sandi
            </p>
          </div>
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
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kota / Kabupaten</label>
                  <input
                    type="text"
                    value={profileForm.city || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                    placeholder="Contoh: Jakarta Selatan"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kecamatan / Distrik</label>
                  <input
                    type="text"
                    value={profileForm.district || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, district: e.target.value })}
                    placeholder="Contoh: Kebayoran Baru"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Telepon Resmi Sekolah</label>
                  <input
                    type="text"
                    value={profileForm.phone || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="(021) 7890123"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Resmi Sekolah</label>
                  <input
                    type="email"
                    value={profileForm.email || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="info@sdnnusantara01.sch.id"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Website Resmi</label>
                  <input
                    type="text"
                    value={profileForm.website || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                    placeholder="https://sdnnusantara01.sch.id"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-200"
                  />
                </div>
              </div>

              {/* Section: Pengaturan Paragraf & Teks Halaman Depan */}
              <div className="pt-5 border-t border-slate-200 space-y-4">
                <div className="bg-indigo-50/80 p-4 rounded-xl border border-indigo-200">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider mb-1">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Sumber Paragraf & Sambutan Halaman Depan (Landing Page)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Paragraf dan judul di bawah ini adalah teks utama yang tampil di bagian atas (Hero Banner) pada landing page portal. Anda dapat mengeditnya secara bebas kapan saja:
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tagline Kecil Halaman Depan
                  </label>
                  <input
                    type="text"
                    value={profileForm.heroTagline || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, heroTagline: e.target.value })}
                    placeholder="Contoh: Portal Jurnal Belajar & Karakter Siswa Real-Time"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Judul Utama Sambutan (Hero Title)
                  </label>
                  <input
                    type="text"
                    value={profileForm.heroTitle || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, heroTitle: e.target.value })}
                    placeholder="Contoh: Kolaborasi Harmonis Guru & Orang Tua untuk Kemajuan Putra-Putri Kita"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Paragraf Sambutan & Deskripsi Sekolah (Hero Description)
                  </label>
                  <textarea
                    rows={4}
                    value={profileForm.heroDescription || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, heroDescription: e.target.value })}
                    placeholder="Tuliskan sambutan kepala sekolah atau pengantar tujuan portal digital ini..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                  />
                </div>

                <fieldset className="space-y-2 rounded-xl border border-slate-200 p-4">
                  <legend className="px-1 text-xs font-bold text-slate-700">
                    Fitur yang Ditampilkan di Halaman Depan
                  </legend>
                  {LANDING_FEATURES.map((feature) => (
                    <label key={feature.key} className="flex items-center gap-2 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={profileForm.landingFeatures?.[feature.key] ?? true}
                        onChange={(event) =>
                          setProfileForm({
                            ...profileForm,
                            landingFeatures: {
                              dailyReports: profileForm.landingFeatures?.dailyReports ?? true,
                              gallery: profileForm.landingFeatures?.gallery ?? true,
                              agenda: profileForm.landingFeatures?.agenda ?? true,
                              [feature.key]: event.target.checked,
                            },
                          })
                        }
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      {feature.label}
                    </label>
                  ))}
                </fieldset>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleDiscardProfileEdits}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors"
                >
                  Reset Formulir
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Identitas</span>
                </button>
              </div>
            </form>
          </div>

          {/* Pratinjau Kop Surat */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Printer className="w-4 h-4 text-indigo-600" />
                <span>Pratinjau Live Kop Surat Resmi</span>
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Pratinjau tampilan kop surat yang akan dicetak pada seluruh dokumen dinas sekolah:
              </p>

              <div className="p-5 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 text-center space-y-1">
                <p className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                  {profileForm.kopLine1 || 'DINAS PENDIDIKAN'}
                </p>
                <p className="text-sm font-black tracking-wide text-slate-900 uppercase">
                  {profileForm.kopLine2 || profileForm.name}
                </p>
                <p className="text-[10px] text-slate-500 leading-tight pt-1">
                  {profileForm.kopSubtext || profileForm.address}
                </p>
                <div className="border-b-2 border-black pt-3"></div>
                <div className="border-b border-black pt-0.5"></div>
              </div>
            </div>

            {/* Pratinjau Tampilan Hero Landing Page */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Pratinjau Hero Landing Page</span>
              </h3>
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white space-y-2">
                <span className="text-[10px] font-bold tracking-wider uppercase text-amber-300 block">
                  {profileForm.heroTagline || 'Tagline Sekolah'}
                </span>
                <h4 className="text-sm font-extrabold leading-snug">
                  {profileForm.heroTitle || 'Judul Sambutan'}
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">
                  {profileForm.heroDescription || 'Deskripsi pengantar sekolah...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Master Kurikulum (CP & TP) */}
      {activeTab === 'kurikulum' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* List Mata Pelajaran */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Mata Pelajaran</h3>
                  <p className="text-xs text-slate-500">Daftar mapel yang diajarkan pada kurikulum</p>
                </div>
                <button
                  onClick={() => setShowAddSubjectModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Mapel</span>
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {subjects.map((sub) => (
                  <div key={sub.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {sub.code}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">{sub.name}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">Pengampu: {sub.teacherName}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditSubject(sub)}
                        className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                        title="Edit Mata Pelajaran"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus mata pelajaran "${sub.name}"?`)) {
                            deleteSubject(sub.id);
                            showToast(`Mapel ${sub.name} berhasil dihapus.`);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Hapus Mapel"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* List Capaian & Tujuan Pembelajaran */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Master Capaian (CP) & Tujuan Pembelajaran (TP)
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
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditLo(lo)}
                        className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                        title="Edit CP / TP"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Hapus butir CP/TP ini?')) {
                            deleteLearningObjective(lo.id);
                            showToast('Butir CP/TP berhasil dihapus.');
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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

      {/* Tab 3: MANAJEMEN GURU SECARA NYATA & PUSAT RESET KATA SANDI */}
      {(activeTab === 'guru' || activeTab === 'password') && (
        <div className="space-y-6">
          {/* Sub-Tab Navigation Header */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold mb-1">
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                <span>MODUL ADMINISTRASI SUMBER DAYA & KREDENSIAL</span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Manajemen Guru & Pusat Akses Kredensial
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Hak akses admin penuh untuk menambah, mengedit, dan menghapus guru, serta pusat bantuan reset kata sandi resmi bagi guru dan orang tua murid.
              </p>
            </div>

            {/* Sub-View Switcher Pills */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl self-start md:self-auto border border-slate-200/60">
              <button
                onClick={() => {
                  setTeacherSubTab('guru');
                  setActiveTabState('guru');
                  if (onTabChange) onTabChange('guru');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  teacherSubTab === 'guru'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Data & Kelola Guru</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-800 font-mono">
                  {teacherUsers.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setTeacherSubTab('password');
                  setActiveTabState('password');
                  if (onTabChange) onTabChange('password');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  teacherSubTab === 'password'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>Pusat Reset Sandi</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-mono">
                  {users.length}
                </span>
              </button>
            </div>
          </div>

          {/* SUB-VIEW 1: MANAJEMEN GURU (CRUD LENGKAP & KONTROL HAK AKSES) */}
          {teacherSubTab === 'guru' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-xs font-semibold">Total Tenaga Pendidik</span>
                    <Users className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    {teacherUsers.length}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium">Terdaftar di SIM Sekolah</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-xs font-semibold">Guru Kelas / Wali</span>
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-2xl font-black text-indigo-950 font-mono">
                    {teacherUsers.filter((u) => u.role === 'guru_kelas').length}
                  </div>
                  <span className="text-[10px] text-slate-500">Pengampu Kelas Binaan</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-xs font-semibold">Guru Bimbingan (BK)</span>
                    <HeartHandshake className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="text-2xl font-black text-rose-950 font-mono">
                    {teacherUsers.filter((u) => u.role === 'guru_bk').length}
                  </div>
                  <span className="text-[10px] text-slate-500">Konseling Karakter</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-xs font-semibold">Guru PAI & Mapel</span>
                    <Sparkles className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="text-2xl font-black text-teal-950 font-mono">
                    {teacherUsers.filter((u) => u.role === 'guru_pai').length}
                  </div>
                  <span className="text-[10px] text-slate-500">Pembiasaan Ibadah</span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                  {/* Search Input */}
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Cari guru, NIP, username, mata pelajaran..."
                      value={teacherSearch}
                      onChange={(e) => setTeacherSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    {teacherSearch && (
                      <button
                        onClick={() => setTeacherSearch('')}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Role Filter */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={teacherRoleFilter}
                      onChange={(e) => setTeacherRoleFilter(e.target.value as any)}
                      className="px-2.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                    >
                      <option value="all">Semua Peran Guru</option>
                      <option value="guru_kelas">Guru Kelas (Wali)</option>
                      <option value="guru_bk">Guru BK</option>
                      <option value="guru_pai">Guru PAI</option>
                      <option value="admin">Administrator SIM</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <select
                    value={teacherStatusFilter}
                    onChange={(e) => setTeacherStatusFilter(e.target.value as any)}
                    className="px-2.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="all">Semua Status</option>
                    <option value="aktif">Status Aktif</option>
                    <option value="nonaktif">Status Nonaktif</option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto shrink-0">
                  <button
                    onClick={handleExportTeachersCsv}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                    title="Unduh Data Guru ke Spreadsheet"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ekspor CSV</span>
                  </button>

                  <button
                    onClick={handleOpenAddTeacher}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Tambah Guru Baru</span>
                  </button>
                </div>
              </div>

              {/* Teachers Roster List / Cards */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3.5 px-4">Nama Guru & NIP</th>
                        <th className="py-3.5 px-4">Peran & Penugasan</th>
                        <th className="py-3.5 px-4">Akun Login</th>
                        <th className="py-3.5 px-4">Kontak Resmi</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                        <th className="py-3.5 px-4 text-right">Tindakan Administrator</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTeachers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-500">
                            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="font-semibold">Tidak ada data guru yang cocok dengan filter pencarian.</p>
                            <button
                              onClick={() => {
                                setTeacherSearch('');
                                setTeacherRoleFilter('all');
                                setTeacherStatusFilter('all');
                              }}
                              className="mt-2 text-xs text-indigo-600 hover:underline font-bold"
                            >
                              Reset Filter
                            </button>
                          </td>
                        </tr>
                      ) : (
                        filteredTeachers.map((teacher) => {
                          const isCurrentUser = currentUser?.id === teacher.id;
                          const isRecentlyReset = recentResetPassword?.userId === teacher.id;

                          return (
                            <tr key={teacher.id} className="hover:bg-slate-50/70 transition-colors">
                              {/* Name & NIP */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                                      teacher.role === 'admin'
                                        ? 'bg-slate-800 text-white'
                                        : teacher.role === 'guru_kelas'
                                        ? 'bg-indigo-600 text-white'
                                        : teacher.role === 'guru_bk'
                                        ? 'bg-rose-500 text-white'
                                        : 'bg-teal-600 text-white'
                                    }`}
                                  >
                                    {teacher.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                      <span>{teacher.name}</span>
                                      {isCurrentUser && (
                                        <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-semibold border border-slate-300">
                                          Anda
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[11px] font-mono text-slate-500 block">
                                      NIP: {teacher.nip || '-'}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Role & Assignment */}
                              <td className="py-3.5 px-4">
                                <div className="space-y-1">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                      teacher.role === 'admin'
                                        ? 'bg-slate-100 text-slate-800 border border-slate-200'
                                        : teacher.role === 'guru_kelas'
                                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                        : teacher.role === 'guru_bk'
                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                        : 'bg-teal-50 text-teal-700 border border-teal-200'
                                    }`}
                                  >
                                    {teacher.role === 'admin'
                                      ? 'ADMINISTRATOR'
                                      : teacher.role === 'guru_kelas'
                                      ? 'GURU KELAS'
                                      : teacher.role === 'guru_bk'
                                      ? 'GURU BK'
                                      : 'GURU PAI'}
                                  </span>
                                  <div className="text-[11px] font-medium text-slate-700">{teacher.title}</div>
                                  {teacher.subjectAssignment && (
                                    <div className="text-[10px] text-slate-500">
                                      Mapel: <span className="font-semibold">{teacher.subjectAssignment}</span>
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Username & Password */}
                              <td className="py-3.5 px-4">
                                <div className="space-y-1">
                                  <div className="font-mono text-xs font-semibold text-slate-800">
                                    @{teacher.username}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`font-mono px-2 py-0.5 rounded text-[11px] ${
                                        isRecentlyReset
                                          ? 'bg-emerald-100 text-emerald-800 font-bold'
                                          : 'bg-slate-100 text-slate-700'
                                      }`}
                                    >
                                      {showPasswordMap[teacher.id]
                                        ? teacher.password
                                        : '••••••••'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setShowPasswordMap((prev) => ({
                                          ...prev,
                                          [teacher.id]: !prev[teacher.id],
                                        }))
                                      }
                                      className="text-slate-400 hover:text-slate-600 p-0.5"
                                      title={showPasswordMap[teacher.id] ? 'Sembunyikan' : 'Tampilkan'}
                                    >
                                      {showPasswordMap[teacher.id] ? (
                                        <EyeOff className="w-3.5 h-3.5" />
                                      ) : (
                                        <Eye className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(teacher.password);
                                        showToast(`Password ${teacher.username} disalin!`);
                                      }}
                                      className="text-slate-400 hover:text-slate-700 p-0.5"
                                      title="Salin Password"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  {isRecentlyReset && (
                                    <span className="text-[10px] text-emerald-600 font-bold block">
                                      Baru direset!
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Contacts */}
                              <td className="py-3.5 px-4">
                                <div className="space-y-1 text-[11px]">
                                  {teacher.phone ? (
                                    <a
                                      href={`https://wa.me/${teacher.phone.replace(/[^0-9]/g, '')}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-indigo-600 hover:text-indigo-800 font-mono flex items-center gap-1 hover:underline"
                                    >
                                      <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                                      <span>{teacher.phone}</span>
                                    </a>
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                  {teacher.email && (
                                    <div className="text-slate-500 truncate max-w-[160px] flex items-center gap-1">
                                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span className="truncate">{teacher.email}</span>
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Status */}
                              <td className="py-3.5 px-4 text-center">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    teacher.status === 'nonaktif'
                                      ? 'bg-slate-100 text-slate-500'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      teacher.status === 'nonaktif' ? 'bg-slate-400' : 'bg-emerald-500'
                                    }`}
                                  />
                                  <span>{teacher.status === 'nonaktif' ? 'Nonaktif' : 'Aktif'}</span>
                                </span>
                              </td>

                              {/* Admin Actions */}
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Share via WhatsApp */}
                                  <a
                                    href={createWhatsAppLink(teacher, teacher.password)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                                    title="Bagikan Akun ke WhatsApp Guru"
                                  >
                                    <Share2 className="w-4 h-4" />
                                  </a>

                                  {/* Print Credential Slip */}
                                  <button
                                    onClick={() => handleOpenSlipModal(teacher)}
                                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                                    title="Cetak Slip Login Resmi"
                                  >
                                    <Printer className="w-4 h-4" />
                                  </button>

                                  {/* Reset Password */}
                                  <button
                                    onClick={() => handleOpenResetModal(teacher)}
                                    className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                                    title="Reset Password Guru"
                                  >
                                    <RotateCw className="w-4 h-4" />
                                  </button>

                                  {/* Edit Teacher */}
                                  <button
                                    onClick={() => handleOpenEditTeacher(teacher)}
                                    className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                                    title="Edit Data Guru"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>

                                  {/* Delete Teacher */}
                                  <button
                                    onClick={() => handleOpenDeleteTeacher(teacher)}
                                    disabled={isCurrentUser}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      isCurrentUser
                                        ? 'text-slate-300 cursor-not-allowed'
                                        : 'text-rose-600 hover:bg-rose-50'
                                    }`}
                                    title={isCurrentUser ? 'Tidak dapat menghapus akun Anda sendiri' : 'Hapus Guru'}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: PUSAT BANTUAN RESET KATA SANDI (GURU & ORANG TUA) */}
          {teacherSubTab === 'password' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-amber-500" />
                    <span>Pusat Bantuan Kredensial & Reset Kata Sandi</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Layanan resmi Administrator sekolah untuk mereset kata sandi guru, staf pendidik, serta wali murid yang mengalami kendala login
                  </p>
                </div>

                {/* Search & Category Filter */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
                    <button
                      onClick={() => setAccountCategoryFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        accountCategoryFilter === 'all'
                          ? 'bg-white text-slate-900 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Semua ({users.length})
                    </button>
                    <button
                      onClick={() => setAccountCategoryFilter('guru')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        accountCategoryFilter === 'guru'
                          ? 'bg-white text-indigo-900 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Guru ({users.filter((u) => u.role !== 'orangtua').length})
                    </button>
                    <button
                      onClick={() => setAccountCategoryFilter('ortu')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        accountCategoryFilter === 'ortu'
                          ? 'bg-white text-amber-900 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Wali Murid ({users.filter((u) => u.role === 'orangtua').length})
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowImpersonateModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
                      title="Beralih dan masuk ke akun pengguna lain secara langsung"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Beralih Akun (Impersonate)</span>
                    </button>

                    <div className="relative w-full sm:w-56">
                      <input
                        type="text"
                        placeholder="Cari nama, username, NISN..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* User Accounts Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Nama Pengguna & Peran</th>
                      <th className="py-3 px-4">Username Akun</th>
                      <th className="py-3 px-4">Password Aktif</th>
                      <th className="py-3 px-4">Kontak / Tautan Siswa</th>
                      <th className="py-3 px-4 text-right">Tindakan Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          Tidak ada akun yang sesuai dengan pencarian.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const student = students.find((s) => s.id === u.studentId);
                        const isRecentlyReset = recentResetPassword?.userId === u.id;
                        const isCurrent = currentUser?.id === u.id;

                        return (
                          <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{u.name}</div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                    u.role === 'admin'
                                      ? 'bg-slate-800 text-white'
                                      : u.role === 'guru_kelas'
                                      ? 'bg-indigo-100 text-indigo-700'
                                      : u.role === 'guru_bk'
                                      ? 'bg-rose-100 text-rose-700'
                                      : u.role === 'guru_pai'
                                      ? 'bg-teal-100 text-teal-700'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
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
                                <span
                                  className={`font-mono px-2 py-0.5 rounded text-[11px] ${
                                    isRecentlyReset
                                      ? 'bg-emerald-100 text-emerald-800 font-bold'
                                      : 'bg-slate-100 text-slate-800'
                                  }`}
                                >
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
                              <div className="inline-flex items-center gap-1.5">
                                {!isCurrent && (
                                  <button
                                    onClick={() => impersonateUser(u)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs transition-colors shadow-2xs border border-emerald-200"
                                    title={`Masuk dan gunakan aplikasi sebagai ${u.name}`}
                                  >
                                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Masuk Akun</span>
                                  </button>
                                )}

                                <a
                                  href={createWhatsAppLink(u, u.password)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                                  title="Kirim ke WhatsApp Pengguna"
                                >
                                  <Share2 className="w-4 h-4" />
                                </a>

                                <button
                                  onClick={() => handleOpenSlipModal(u)}
                                  className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                                  title="Cetak Slip Kredensial"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => handleOpenResetModal(u)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors shadow-2xs"
                                >
                                  <RotateCw className="w-3 h-3" />
                                  <span>Reset Sandi</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Rekap Eksekutif & Unduh Dokumen Sekolah */}
      {activeTab === 'laporan' && (
        <div className="space-y-6">
          {/* Header Action Bar */}
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
                Pusat pengunduhan laporan resmi seluruh kegiatan jurnal mengajar, data guru, rekap bimbingan konseling, penilaian PAI, dan data siswa dengan format cetak standar dinas pendidikan.
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

                  csv += `=== 1. DAFTAR TENAGA PENDIDIK & GURU ===\n`;
                  csv += `No,Nama Guru,NIP,Peran,Jabatan,Mapel,Username,Status\n`;
                  teacherUsers.forEach((t, i) => {
                    csv += `${i + 1},"${t.name}","${t.nip || '-'}","${t.role}","${t.title}","${t.subjectAssignment || '-'}","${t.username}","${t.status || 'aktif'}"\n`;
                  });

                  csv += `\n=== 2. REKAP JURNAL KELAS ===\n`;
                  csv += `No,Tanggal,Jam,Mata Pelajaran,Tujuan Pembelajaran,Aktivitas,Hadir,Sakit,Izin,Alpa,Guru Pengajar\n`;
                  journalEntries.forEach((j, i) => {
                    csv += `${i + 1},"${j.date}","${j.timeSlot}","${j.subjectName}","${j.tpDescription.replace(/"/g, '""')}","${j.activityDescription.replace(/"/g, '""')}",${j.attendancePresent},${j.attendanceSick},${j.attendancePermit},${j.attendanceAbsent},"${j.teacherName}"\n`;
                  });

                  csv += `\n=== 3. REKAP KASUS & KONSELING BK ===\n`;
                  csv += `No,Tanggal,Siswa,Kategori,Tingkat,Status,Konselor\n`;
                  caseRecords.forEach((c, i) => {
                    csv += `${i + 1},"${c.date}","${c.studentName}","${c.category}","${c.severity}","${c.status}","${c.counselorName}"\n`;
                  });

                  csv += `\n=== 4. REKAP PENILAIAN PAI ===\n`;
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
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold shadow-md shadow-slate-200 transition-colors"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Cetak Rekap Resmi</span>
              </button>
            </div>
          </div>

          {/* Printable Report Preview */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div className="text-center pb-4 border-b-2 border-black space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-800">
                {schoolProfile.kopLine1}
              </p>
              <h2 className="text-base font-black uppercase text-slate-950">
                {schoolProfile.kopLine2}
              </h2>
              <p className="text-[11px] text-slate-600">
                {schoolProfile.kopSubtext}
              </p>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                REKAPITULASI DOKUMEN SISTEM INFORMASI & EVALUASI TERPADU
              </h3>
              <p className="text-xs text-slate-600">
                Tahun Ajaran {schoolProfile.academicYear} · Semester {schoolProfile.semester} · {schoolProfile.classGrade}
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span>1. Rekapitulasi Tenaga Pendidik & Guru Pengampu</span>
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 font-bold border-b border-slate-300">
                    <tr>
                      <th className="py-2 px-3 border-r border-slate-300 w-10 text-center">No</th>
                      <th className="py-2 px-3 border-r border-slate-300">Nama Guru & Gelar</th>
                      <th className="py-2 px-3 border-r border-slate-300">NIP</th>
                      <th className="py-2 px-3 border-r border-slate-300">Jabatan & Penugasan</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                    {teacherUsers.map((t, idx) => (
                      <tr key={t.id}>
                        <td className="py-2 px-3 border-r border-slate-200 text-center">{idx + 1}</td>
                        <td className="py-2 px-3 border-r border-slate-200 font-sans font-semibold text-slate-900">
                          {t.name}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200">{t.nip || '-'}</td>
                        <td className="py-2 px-3 border-r border-slate-200 font-sans">{t.title}</td>
                        <td className="py-2 px-3 text-center font-sans">
                          {t.status === 'nonaktif' ? 'Nonaktif' : 'Aktif'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Principal Signature Area */}
            <div className="pt-8 flex justify-end">
              <div className="w-64 text-center space-y-16">
                <div className="text-xs text-slate-800">
                  <p>{schoolProfile.city}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="font-semibold">Kepala {schoolProfile.name}</p>
                </div>
                <div>
                  <p className="text-xs font-bold underline text-slate-900">{schoolProfile.principalName}</p>
                  <p className="text-[11px] font-mono text-slate-600">NIP. {schoolProfile.principalNip}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: TAMBAH GURU BARU */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tambah Tenaga Pendidik / Guru Baru</h3>
                  <p className="text-[11px] text-slate-500">Berikan hak akses administrator dan peran resmi sistem</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddTeacherModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAddTeacher} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap & Gelar Akademik <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ibu Ratna Kumalasari, S.Pd. atau Drs. Ahmad Fauzi"
                    value={teacherFormData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setTeacherFormData((prev) => ({
                        ...prev,
                        name,
                        username: prev.username ? prev.username : generateSuggestedUsername(name, prev.role),
                      }));
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Induk Pegawai (NIP)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 19890620 201101 2 008 (atau - jika Non-PNS)"
                    value={teacherFormData.nip}
                    onChange={(e) => setTeacherFormData({ ...teacherFormData, nip: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Peran / Hak Akses Sistem <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={teacherFormData.role}
                    onChange={(e) => {
                      const role = e.target.value as UserRole;
                      let defaultTitle = 'Wali Kelas 4-A';
                      if (role === 'guru_bk') defaultTitle = 'Guru Bimbingan Konseling (BK)';
                      if (role === 'guru_pai') defaultTitle = 'Guru Pendidikan Agama Islam (PAI)';
                      if (role === 'admin') defaultTitle = 'Administrator SIM';

                      setTeacherFormData((prev) => ({
                        ...prev,
                        role,
                        title: defaultTitle,
                        username: generateSuggestedUsername(prev.name, role),
                      }));
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="guru_kelas">Guru Kelas (Wali Kelas)</option>
                    <option value="guru_bk">Guru Bimbingan Konseling (BK)</option>
                    <option value="guru_pai">Guru PAI & Pembiasaan</option>
                    <option value="admin">Administrator SIM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jabatan / Penugasan Spesifik
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Wali Kelas 4-B atau Guru PJOK"
                    value={teacherFormData.title}
                    onChange={(e) => setTeacherFormData({ ...teacherFormData, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mata Pelajaran yang Diampu
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: IPAS, Matematika atau PJOK"
                    value={teacherFormData.subjectAssignment}
                    onChange={(e) => setTeacherFormData({ ...teacherFormData, subjectAssignment: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username Akun Login <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      required
                      placeholder="Contoh: ratna_kelas"
                      value={teacherFormData.username}
                      onChange={(e) => setTeacherFormData({ ...teacherFormData, username: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setTeacherFormData((prev) => ({
                          ...prev,
                          username: generateSuggestedUsername(prev.name, prev.role),
                        }))
                      }
                      className="px-2 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-600 text-[10px] shrink-0 font-medium"
                      title="Saran Username"
                    >
                      Saran
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kata Sandi Awal <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      required
                      value={teacherFormData.password}
                      onChange={(e) => setTeacherFormData({ ...teacherFormData, password: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono font-bold text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setTeacherFormData((prev) => ({
                          ...prev,
                          password: `GURU-${Math.floor(1000 + Math.random() * 9000)}`,
                        }))
                      }
                      className="px-2 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-indigo-600 text-[10px] shrink-0 font-bold"
                      title="Acak Sandi"
                    >
                      Acak
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 0812-3456-7890"
                    value={teacherFormData.phone}
                    onChange={(e) => setTeacherFormData({ ...teacherFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Resmi Sekolah
                  </label>
                  <input
                    type="email"
                    placeholder="guru@sdnnusantara01.sch.id"
                    value={teacherFormData.email}
                    onChange={(e) => setTeacherFormData({ ...teacherFormData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Kepegawaian
                  </label>
                  <select
                    value={teacherFormData.status}
                    onChange={(e) => setTeacherFormData({ ...teacherFormData, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="aktif">Aktif Mengajar & Memiliki Hak Akses</option>
                    <option value="nonaktif">Nonaktif / Cuti (Akses Ditangguhkan)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddTeacherModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Simpan Data Guru</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT DATA GURU */}
      {showEditTeacherModal && teacherToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Perbarui Data Tenaga Pendidik / Guru</h3>
                  <p className="text-[11px] text-slate-500">Ubah peran, penugasan, kontak, atau kata sandi</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditTeacherModal(false);
                  setTeacherToEdit(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTeacher} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap & Gelar Akademik <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={teacherFormData.name}
                    onChange={(e) => setTeacherFormData({ ...teacherFormData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Induk Pegawai (NIP)
                  </label>
                  <input
                    type="text"
                    value={teacherFormData.nip}
                    onChange={(e) => setTeacherFormData({ ...teacherFormData, nip: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Peran / Hak Akses Sistem <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={teacherFormData.role}
                    onChange={(e) => setTeacherFormData({ ...teacherFormData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="guru_kelas">Guru Kelas (Wali Kelas)</option>
                    <option value="guru_bk">Guru Bimbingan Konseling (BK)</option>
                    <option value="guru_pai">Guru PAI & Pembiasaan</option>
                    <option value="admin">Administrator SIM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jabatan / Penugasan Spesifik
                  </label>
                  <input
                    type="text"
                    value={teacherFormData.title}
                    onChange={(e) => setTeacherFormData({ ...teacherFormData, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mata Pelajaran yang Diampu
                  </label>
                  <input
                    type="text"
                    value={teacherFormData.subjectAssignment}
                    onChange={(e) => setTeacherFormData({ ...teacherFormData, subjectAssignment: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username Akun Login <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={teacherFormData.username}
                    onChange={(e) => setTeacherFormData({ ...teacherFormData, username: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kata Sandi Akun <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      required
                      value={teacherFormData.password}
                      onChange={(e) => setTeacherFormData({ ...teacherFormData, password: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono font-bold"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setTeacherFormData((prev) => ({
                          ...prev,
                          password: `GURU-${Math.floor(1000 + Math.random() * 9000)}`,
                        }))
                      }
                      className="px-2 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-indigo-600 text-[10px] shrink-0 font-bold"
                      title="Acak Sandi Baru"
                    >
                      Acak
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    value={teacherFormData.phone}
                    onChange={(e) => setTeacherFormData({ ...teacherFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Resmi
                  </label>
                  <input
                    type="email"
                    value={teacherFormData.email}
                    onChange={(e) => setTeacherFormData({ ...teacherFormData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Kepegawaian
                  </label>
                  <select
                    value={teacherFormData.status}
                    onChange={(e) => setTeacherFormData({ ...teacherFormData, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="aktif">Aktif Mengajar & Memiliki Hak Akses</option>
                    <option value="nonaktif">Nonaktif / Cuti (Akses Ditangguhkan)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditTeacherModal(false);
                    setTeacherToEdit(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: KONFIRMASI HAPUS GURU */}
      {showDeleteTeacherModal && teacherToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">
                Hapus Data Tenaga Pendidik?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Apakah Anda yakin ingin menghapus data dan akses akun untuk guru berikut:
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <div className="font-bold text-slate-900 text-sm">{teacherToDelete.name}</div>
              <div className="text-slate-500">NIP: <span className="font-mono font-medium">{teacherToDelete.nip || '-'}</span></div>
              <div className="text-slate-500">Peran: <span className="font-semibold text-indigo-700">{teacherToDelete.title}</span></div>
              <div className="text-slate-500">Username: <span className="font-mono">@{teacherToDelete.username}</span></div>
            </div>

            {currentUser && teacherToDelete.id === currentUser.id ? (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Perhatian:</strong> Ini adalah akun Anda yang sedang aktif digunakan saat ini. Demi alasan keamanan, akun aktif tidak dapat dihapus.
                </span>
              </div>
            ) : (
              <p className="text-[11px] text-rose-600 text-center font-medium">
                Tindakan ini akan mencabut akses login guru bersangkutan secara permanen.
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteTeacherModal(false);
                  setTeacherToDelete(null);
                }}
                className="w-full py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={currentUser?.id === teacherToDelete.id}
                onClick={handleConfirmDeleteTeacher}
                className={`w-full py-2 text-xs font-bold text-white rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm ${
                  currentUser?.id === teacherToDelete.id
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Guru</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: RESET PASSWORD RESMI GURU & ORANG TUA */}
      {showResetModal && resetTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <RotateCw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Pusat Reset Kata Sandi Resmi</h3>
                  <p className="text-[11px] text-slate-500">Perbarui kata sandi guru atau wali murid</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setResetTargetUser(null);
                  setResetSuccessModalData(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Account Info */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{resetTargetUser.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {resetTargetUser.role.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="text-slate-500 font-mono text-[11px]">
                Username: <span className="font-bold text-slate-800">@{resetTargetUser.username}</span>
              </div>
              <div className="text-slate-500 text-[11px]">
                Jabatan/Keterangan: <span className="font-medium text-slate-700">{resetTargetUser.title}</span>
              </div>
            </div>

            {!resetSuccessModalData ? (
              <form onSubmit={handleExecuteResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">Pilih Metode Reset:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setResetMode('auto')}
                      className={`p-3 rounded-xl border text-left text-xs transition-all ${
                        resetMode === 'auto'
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold shadow-2xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-amber-500 mb-1" />
                      <div>Otomatis Acak</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">Format aman & mudah diingat</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setResetMode('custom')}
                      className={`p-3 rounded-xl border text-left text-xs transition-all ${
                        resetMode === 'custom'
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold shadow-2xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <Edit2 className="w-4 h-4 text-indigo-600 mb-1" />
                      <div>Ketik Manual</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">Tentukan password sendiri</div>
                    </button>
                  </div>
                </div>

                {resetMode === 'custom' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Ketik Password Baru
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Masukkan kata sandi baru..."
                      value={customPasswordInput}
                      onChange={(e) => setCustomPasswordInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono font-bold"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetModal(false);
                      setResetTargetUser(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <RotateCw className="w-4 h-4" />
                    <span>Terapkan Password Baru</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Success View after Reset */
              <div className="space-y-4 pt-1">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    Kata Sandi Berhasil Direset!
                  </h4>
                  <div className="py-2 px-3 rounded-lg bg-white border border-emerald-300 font-mono text-base font-extrabold text-emerald-800 tracking-wider inline-block">
                    {resetSuccessModalData.pass}
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Kata sandi telah aktif di database dan siap digunakan oleh pengguna.
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(resetSuccessModalData.pass);
                      showToast('Password baru disalin ke clipboard!');
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Salin Password ke Clipboard</span>
                  </button>

                  <a
                    href={createWhatsAppLink(resetSuccessModalData.user, resetSuccessModalData.pass)}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Kirim Kredensial via WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setShowResetModal(false);
                      handleOpenSlipModal(resetSuccessModalData.user);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Slip Akses Kredensial</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 5: CETAK SLIP KREDENSIAL RESMI SEKOLAH */}
      {showCredentialSlipModal && slipTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="no-print flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Slip Kredensial Akses Login Resmi</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Slip</span>
                </button>
                <button
                  onClick={() => {
                    setShowCredentialSlipModal(false);
                    setSlipTargetUser(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Official Printable Slip Layout */}
            <div className="p-6 border-2 border-slate-800 rounded-2xl space-y-4 bg-white text-slate-900">
              {/* Official Kop */}
              <div className="text-center pb-3 border-b-2 border-black space-y-0.5">
                <p className="text-[10px] font-bold tracking-widest uppercase text-slate-700">
                  {schoolProfile.kopLine1}
                </p>
                <h4 className="text-sm font-black uppercase text-slate-950">
                  {schoolProfile.kopLine2}
                </h4>
                <p className="text-[9px] text-slate-500">
                  {schoolProfile.kopSubtext}
                </p>
              </div>

              <div className="text-center py-1">
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-950 underline">
                  SURAT PEMBERITAHUAN KREDENSIAL LOGIN SISTEM INFORMASI MADRASAH/SEKOLAH
                </h5>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Tahun Ajaran {schoolProfile.academicYear} · {schoolProfile.classGrade}
                </p>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                Diberitahukan kepada Yth. <strong>{slipTargetUser.name}</strong>, berikut adalah informasi akses resmi akun Anda pada Sistem Informasi Manajemen Jurnal & Evaluasi Siswa:
              </p>

              {/* Credential Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500 font-sans">Nama Lengkap</span>
                  <span className="font-bold text-slate-900 font-sans">{slipTargetUser.name}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500 font-sans">Peran Akun</span>
                  <span className="font-bold text-indigo-800 font-sans">{slipTargetUser.title}</span>
                </div>
                {slipTargetUser.nip && slipTargetUser.nip !== '-' && (
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500 font-sans">NIP Pegawai</span>
                    <span className="font-bold text-slate-800">{slipTargetUser.nip}</span>
                  </div>
                )}
                {slipTargetUser.studentId && (
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500 font-sans">Murid Binaan</span>
                    <span className="font-bold text-slate-900 font-sans">
                      {students.find((s) => s.id === slipTargetUser.studentId)?.name || '-'}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 bg-indigo-50/50 p-1.5 rounded">
                  <span className="text-indigo-900 font-sans font-bold">Username Login</span>
                  <span className="font-black text-indigo-950 text-sm">{slipTargetUser.username}</span>
                </div>
                <div className="flex items-center justify-between bg-amber-50/50 p-1.5 rounded">
                  <span className="text-amber-900 font-sans font-bold">Kata Sandi (Password)</span>
                  <span className="font-black text-amber-950 text-sm tracking-wider">{slipTargetUser.password}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-500 font-sans">Alamat Website Portal</span>
                  <span className="font-bold text-slate-700">{window.location.origin}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">Petunjuk Penggunaan:</p>
                <ol className="list-decimal pl-4 space-y-0.5 text-[10px]">
                  <li>Buka peramban (Chrome / Safari / Firefox) pada ponsel atau komputer Anda.</li>
                  <li>Kunjungi alamat portal di atas, klik tombol <strong>"Masuk Akun"</strong> pada pojok kanan atas.</li>
                  <li>Masukkan Username dan Password di atas secara teliti.</li>
                  <li>Simpan dan jaga kerahasiaan kata sandi Anda. Hubungi administrator bila memerlukan bantuan.</li>
                </ol>
              </div>

              {/* Signature block */}
              <div className="pt-4 flex justify-between items-end text-xs">
                <div className="text-[10px] text-slate-400">
                  Dicetak pada: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div className="text-center w-52 space-y-12">
                  <p className="text-[11px] font-medium text-slate-700">Kepala {schoolProfile.name}</p>
                  <div>
                    <p className="font-bold text-xs underline text-slate-900">{schoolProfile.principalName}</p>
                    <p className="text-[10px] font-mono text-slate-500">NIP. {schoolProfile.principalNip}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH MATA PELAJARAN */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Tambah Mata Pelajaran Baru</h3>
              <button
                onClick={() => setShowAddSubjectModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Mata Pelajaran
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pendidikan Jasmani & Kesehatan (PJOK)"
                  value={newSubjName}
                  onChange={(e) => setNewSubjName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Singkat (3-4 Huruf)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: PJK"
                  maxLength={5}
                  value={newSubjCode}
                  onChange={(e) => setNewSubjCode(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Guru Pengampu Utama
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Bpk. Hendra Gunawan, S.Or."
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

      {/* MODAL TAMBAH CP / TP */}
      {showAddLoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Tambah Capaian (CP) & Tujuan Pembelajaran (TP)
              </h3>
              <button
                onClick={() => setShowAddLoModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLo} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mata Pelajaran
                  </label>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Semester
                  </label>
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

      {/* MODAL EDIT MATA PELAJARAN */}
      {showEditSubjectModal && subjectToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Edit Mata Pelajaran</h3>
                  <p className="text-[11px] text-slate-500">Perbarui nama, kode mapel, atau guru pengampu</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditSubjectModal(false);
                  setSubjectToEdit(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSubject} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Mata Pelajaran
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pendidikan Jasmani & Kesehatan (PJOK)"
                  value={editSubjName}
                  onChange={(e) => setEditSubjName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Singkat (3-4 Huruf)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: PJK"
                  maxLength={5}
                  value={editSubjCode}
                  onChange={(e) => setEditSubjCode(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono uppercase transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Guru Pengampu Utama
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Bpk. Hendra Gunawan, S.Or."
                  value={editSubjTeacher}
                  onChange={(e) => setEditSubjTeacher(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditSubjectModal(false);
                    setSubjectToEdit(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT CP / TP */}
      {showEditLoModal && loToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Edit Capaian (CP) & Tujuan Pembelajaran (TP)
                  </h3>
                  <p className="text-[11px] text-slate-500">Perbarui kompetensi materi atau tujuan spesifik pembelajaran</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditLoModal(false);
                  setLoToEdit(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditLo} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mata Pelajaran
                  </label>
                  <select
                    value={editLoSubjectId}
                    onChange={(e) => setEditLoSubjectId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium transition-all duration-200"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Semester
                  </label>
                  <select
                    value={editLoSemester}
                    onChange={(e) => setEditLoSemester(e.target.value as 'Ganjil' | 'Genap')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium transition-all duration-200"
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
                  value={editLoCp}
                  onChange={(e) => setEditLoCp(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tujuan Pembelajaran (TP)
                </label>
                <textarea
                  rows={2}
                  placeholder="Tujuan spesifik yang ditargetkan dalam pertemuan..."
                  value={editLoTp}
                  onChange={(e) => setEditLoTp(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed transition-all duration-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditLoModal(false);
                    setLoToEdit(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Impersonate Modal for Admin */}
      <ImpersonateModal
        isOpen={showImpersonateModal}
        onClose={() => setShowImpersonateModal(false)}
      />
    </div>
  );
};
