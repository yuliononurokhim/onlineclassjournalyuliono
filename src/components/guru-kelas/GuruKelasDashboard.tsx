import React, { useState, useRef, useEffect } from 'react';
import { useEduStore } from '../../services/store';
import { Student, ClassJournalEntry, StarActionType } from '../../types';
import { InternalGradesTab } from '../common/InternalGradesTab';
import { TeacherJournalReportView } from '../common/TeacherJournalReportView';
import { StarAwardBatchFields } from '../common/StarAwardBatchFields';
import {
  Users,
  CreditCard,
  BookOpen,
  Sparkles,
  MessageCircle,
  Plus,
  Upload,
  Download,
  Printer,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  Calendar,
  Clock,
  Star,
  Copy,
  FileSpreadsheet,
  QrCode,
  School,
  Send,
  UserCheck,
  MinusCircle,
  AlertTriangle,
  Lock,
  FileText
} from 'lucide-react';

interface GuruKelasDashboardProps {
  currentTab?: string;
  onTabChange?: (tab: string) => void;
}

export const GuruKelasDashboard: React.FC<GuruKelasDashboardProps> = ({ currentTab, onTabChange }) => {
  const {
    schoolProfile,
    subjects,
    learningObjectives,
    students,
    addStudent,
    importStudents,
    updateStudent,
    deleteStudent,
    journalEntries,
    addJournalEntry,
    deleteJournalEntry,
    starAwards,
    addStarAward,
    deleteStarAward,
    messages,
    sendMessage,
    currentUser,
    internalGrades,
  } = useEduStore();

  const [activeTab, setActiveTabState] = useState<'murid' | 'kartu' | 'jurnal' | 'penilaian' | 'bintang' | 'rekap' | 'chat'>(
    (currentTab as any) || 'murid'
  );

  useEffect(() => {
    if (currentTab && ['murid', 'kartu', 'jurnal', 'penilaian', 'bintang', 'rekap', 'chat'].includes(currentTab)) {
      setActiveTabState((prev) => (prev !== currentTab ? (currentTab as any) : prev));
    }
  }, [currentTab]);

  const setActiveTab = (tab: 'murid' | 'kartu' | 'jurnal' | 'penilaian' | 'bintang' | 'rekap' | 'chat') => {
    setActiveTabState(tab);
    if (onTabChange) onTabChange(tab);
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Student Search
  const [studentSearch, setStudentSearch] = useState('');

  // Add Manual Student Modal
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [newNisn, setNewNisn] = useState('');
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState<'L' | 'P'>('L');
  const [newParentName, setNewParentName] = useState('');
  const [newParentPhone, setNewParentPhone] = useState('');

  // Upload Excel / CSV
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [parsedImportRows, setParsedImportRows] = useState<Omit<Student, 'id' | 'parentUsername' | 'parentPassword'>[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Journal Form
  const [journalDate, setJournalDate] = useState(new Date().toISOString().split('T')[0]);
  const [journalTimeSlot, setJournalTimeSlot] = useState('07:30 - 09:00');
  const [journalSubjectId, setJournalSubjectId] = useState(subjects[0]?.id || '');
  const [journalLoId, setJournalLoId] = useState('');
  const [journalActivity, setJournalActivity] = useState('');
  const [journalAttendancePresent, setJournalAttendancePresent] = useState(students.length);
  const [journalAttendanceSick, setJournalAttendanceSick] = useState(0);
  const [journalAttendancePermit, setJournalAttendancePermit] = useState(0);
  const [journalAttendanceAbsent, setJournalAttendanceAbsent] = useState(0);
  const [journalNotes, setJournalNotes] = useState('');

  // Star Award & Penalty Modal
  const [showStarModal, setShowStarModal] = useState(false);
  const [starActionType, setStarActionType] = useState<StarActionType>('reward');
  const [starStudentIds, setStarStudentIds] = useState<string[]>(students[0] ? [students[0].id] : []);
  const [starCategory, setStarCategory] = useState('Keaktifan Belajar');
  const [newStarCategory, setNewStarCategory] = useState('');
  const [customStarCategories, setCustomStarCategories] = useState<Record<StarActionType, string[]>>({
    reward: [],
    penalty: [],
  });
  const [starCount, setStarCount] = useState(3);
  const [starNote, setStarNote] = useState('');

  // Chat with Parents
  const [selectedChatStudentId, setSelectedChatStudentId] = useState<string>(students[0]?.id || '');
  const [chatInputText, setChatInputText] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const baseStarCategories = starActionType === 'reward'
    ? ['Keaktifan Belajar', 'Kedisiplinan', 'Budi Pekerti', 'Kerjasama Kelompok', 'Kreativitas']
    : ['Lupa Membawa Buku / PR', 'Terlambat Masuk Kelas', 'Tidak Tertib / Mengganggu', 'Pelanggaran Seragam', 'Mengabaikan Instruksi Guru'];
  const starCategoryOptions = Array.from(new Set([
    ...baseStarCategories,
    ...starAwards
      .filter((award) => award.awarderRole === 'guru_kelas' && award.type === starActionType)
      .map((award) => award.category),
    ...customStarCategories[starActionType],
  ]));

  const handleAddStarCategory = () => {
    const category = newStarCategory.trim();
    if (!category) return;
    setCustomStarCategories((existing) => ({
      ...existing,
      [starActionType]: [...new Set([...existing[starActionType], category])],
    }));
    setStarCategory(category);
    setNewStarCategory('');
  };

  // Filter CP/TP based on selected subject in journal form
  const availableLoForSubject = learningObjectives.filter((lo) => lo.subjectId === journalSubjectId);

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newNisn.trim()) return;
    const studentDetails = {
      nisn: newNisn.trim(),
      name: newName.trim(),
      gender: newGender,
      parentName: newParentName.trim() || `Orang Tua ${newName.trim()}`,
      parentPhone: newParentPhone.trim() || '0812-0000-0000',
    };

    if (editingStudentId) {
      if (students.some((student) => student.id !== editingStudentId && student.nisn === studentDetails.nisn)) {
        showToast('NISN tersebut sudah digunakan oleh siswa lain.');
        return;
      }
      updateStudent(editingStudentId, studentDetails);
      showToast(`Detail siswa ${studentDetails.name} berhasil diperbarui.`);
    } else {
      if (students.some((student) => student.nisn === studentDetails.nisn)) {
        showToast('NISN tersebut sudah terdaftar.');
        return;
      }
      addStudent(studentDetails);
      showToast(`Siswa ${studentDetails.name} berhasil ditambahkan dan akun orang tua telah dibuat!`);
    }

    setNewNisn('');
    setNewName('');
    setNewParentName('');
    setNewParentPhone('');
    setEditingStudentId(null);
    setShowAddStudentModal(false);
  };

  const openAddStudentModal = () => {
    setEditingStudentId(null);
    setNewNisn('');
    setNewName('');
    setNewGender('L');
    setNewParentName('');
    setNewParentPhone('');
    setShowAddStudentModal(true);
  };

  const openEditStudentModal = (student: Student) => {
    setEditingStudentId(student.id);
    setNewNisn(student.nisn);
    setNewName(student.name);
    setNewGender(student.gender);
    setNewParentName(student.parentName);
    setNewParentPhone(student.parentPhone);
    setShowAddStudentModal(true);
  };

  // Download Sample Excel Template (CSV)
  const handleDownloadTemplate = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'NISN,Nama Siswa,Jenis Kelamin (L/P),Nama Orang Tua,No HP Orang Tua\n' +
      '0142981010,Dimas Anugrah Saputra,L,Bapak Joko Saputra,0812-1111-2222\n' +
      '0142981011,Annisa Rahmawati,P,Ibu Endang Rahma,0813-3333-4444\n' +
      '0142981012,Rafi Pratama,L,Bapak Budi Pratama,0857-5555-6666';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Template_Siswa_${schoolProfile.classGrade.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Template Excel/CSV berhasil diunduh!');
  };

  // Export Credentials Table as CSV
  const handleExportCredentialsCsv = () => {
    let csv = 'NISN,Nama Murid,Jenis Kelamin,Wali Murid,No HP,Username Login,Password Unik\n';
    students.forEach((s) => {
      csv += `"${s.nisn}","${s.name}","${s.gender}","${s.parentName}","${s.parentPhone}","${s.parentUsername}","${s.parentPassword}"\n`;
    });
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Kredensial_Login_OrangTua_${schoolProfile.classGrade.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Tabel kredensial berhasil diekspor ke format spreadsheet CSV!');
  };

  // Handle File Upload Parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
      const rows: Omit<Student, 'id' | 'parentUsername' | 'parentPassword'>[] = [];

      // Skip header if line 0 has keywords
      const startIndex = lines[0].toLowerCase().includes('nisn') ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
        if (cols.length >= 2 && cols[1]) {
          rows.push({
            nisn: cols[0] || `014${Math.floor(1000000 + Math.random() * 8999999)}`,
            name: cols[1],
            gender: (cols[2]?.toUpperCase() === 'P' ? 'P' : 'L') as 'L' | 'P',
            parentName: cols[3] || `Wali dari ${cols[1]}`,
            parentPhone: cols[4] || '0812-0000-0000',
          });
        }
      }

      setParsedImportRows(rows);
      setShowUploadModal(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    if (parsedImportRows.length === 0) return;
    importStudents(parsedImportRows);
    setShowUploadModal(false);
    setParsedImportRows([]);
    showToast(`Berhasil mengimpor ${parsedImportRows.length} siswa dan membuat kartu akun orang tua!`);
  };

  // Print Cards
  const handlePrintCards = () => {
    window.print();
  };

  // Submit Journal
  const handleSaveJournal = (e: React.FormEvent) => {
    e.preventDefault();
    const subj = subjects.find((s) => s.id === journalSubjectId);
    const lo = learningObjectives.find((l) => l.id === journalLoId);

    addJournalEntry({
      date: journalDate,
      timeSlot: journalTimeSlot,
      subjectId: journalSubjectId,
      subjectName: subj ? subj.name : 'Mata Pelajaran',
      learningObjectiveId: journalLoId || undefined,
      cpDescription: lo ? lo.capaianPembelajaran : 'Mengikuti alur capaian kompetensi tematik harian.',
      tpDescription: lo ? lo.tujuanPembelajaran : 'Tujuan pembelajaran harian tercapai sesuai modul ajar.',
      activityDescription: journalActivity,
      attendancePresent: Number(journalAttendancePresent),
      attendanceSick: Number(journalAttendanceSick),
      attendancePermit: Number(journalAttendancePermit),
      attendanceAbsent: Number(journalAttendanceAbsent),
      notes: journalNotes,
      teacherName: currentUser?.name || 'Ibu Ratna Kumalasari, S.Pd.',
    });

    setJournalActivity('');
    setJournalNotes('');
    showToast('Jurnal Harian Kelas berhasil disimpan ke sistem!');
  };

  // Submit Star (Reward or Penalty)
  const handleSaveStar = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedStudents = students.filter((student) => starStudentIds.includes(student.id));
    if (!selectedStudents.length) {
      showToast('Pilih minimal satu siswa.');
      return;
    }

    selectedStudents.forEach((student) => addStarAward({
      studentId: student.id,
      studentName: student.name,
      awarderRole: 'guru_kelas',
      awarderName: currentUser?.name || 'Ibu Ratna Kumalasari, S.Pd.',
      type: starActionType,
      category: starCategory,
      starsCount: starCount,
      note: starNote.trim() || (starActionType === 'penalty' ? 'Konsekuensi atas pelanggaran tata tertib kelas.' : 'Apresiasi perilaku positif dan keaktifan di kelas.'),
      date: new Date().toISOString().split('T')[0],
    }));

    setStarStudentIds(students[0] ? [students[0].id] : []);
    setNewStarCategory('');
    setShowStarModal(false);
    setStarNote('');
    const totalStars = starCount * selectedStudents.length;
    if (starActionType === 'penalty') {
      showToast(`Konsekuensi tercatat untuk ${selectedStudents.length} siswa: -${totalStars} bintang total.`);
    } else {
      showToast(`Berhasil memberikan ${totalStars} bintang kepada ${selectedStudents.length} siswa.`);
    }
  };

  // Send Chat to Parent
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim() || !selectedChatStudentId) return;

    const targetStudent = students.find((s) => s.id === selectedChatStudentId);
    if (!targetStudent) return;

    sendMessage({
      senderId: currentUser?.id || 'usr-guru-kelas',
      senderRole: 'guru_kelas',
      senderName: currentUser?.name || 'Ibu Ratna Kumalasari, S.Pd.',
      recipientId: `usr-parent-${targetStudent.id}`,
      recipientRole: 'orangtua',
      recipientName: `${targetStudent.parentName} (Wali)`,
      studentId: targetStudent.id,
      studentName: targetStudent.name,
      content: chatInputText.trim(),
    });

    setChatInputText('');
    showToast('Pesan terkirim ke orang tua murid.');
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.nisn.includes(studentSearch) ||
      s.parentName.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Selected student chat messages
  const activeStudentChat = messages.filter((m) => m.studentId === selectedChatStudentId);
  const activeChatStudentObj = students.find((s) => s.id === selectedChatStudentId);

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
      <div className="no-print bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-200 shrink-0">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 tracking-wider uppercase">
                RUANG WALI KELAS · {schoolProfile.classGrade}
              </span>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                {schoolProfile.name}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
              Jurnal Kelas, Penilaian & Laporan
            </h2>
            <p className="text-sm text-slate-600 mt-0.5 max-w-2xl">
              Manajemen murid, cetak kartu ortu, jurnal CP/TP harian, buku nilai internal, dan rekap berkas laporan siap cetak.
            </p>
          </div>
        </div>
      </div>



      {/* Tab 1: Daftar Murid (Manual & Excel Import) */}
      {activeTab === 'murid' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Cari murid atau NISN..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                title="Unduh format spreadsheet untuk diisi"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Unduh Template Excel</span>
              </button>

              <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-emerald-700" />
                <span>Upload Excel / CSV</span>
                <input
                  type="file"
                  accept=".csv,.txt"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                onClick={openAddStudentModal}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Siswa Manual</span>
              </button>
            </div>
          </div>

          {/* Students Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">Nama Lengkap & JK</th>
                  <th className="py-3 px-4">NISN</th>
                  <th className="py-3 px-4">Orang Tua / No. HP</th>
                  <th className="py-3 px-4">Username Login Ortu</th>
                  <th className="py-3 px-4">Password Unik</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-10 px-4 text-center text-sm text-slate-500">
                        {students.length === 0
                          ? 'Belum ada data siswa. Tambahkan siswa secara manual atau unggah file Excel / CSV.'
                          : 'Tidak ada siswa yang cocok dengan pencarian.'}
                      </td>
                    </tr>
                  )}
                  {filteredStudents.map((std, idx) => (
                  <tr key={std.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{std.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          std.gender === 'L' ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {std.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {std.nisn}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="font-medium text-slate-800">{std.parentName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{std.parentPhone}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                      {std.parentUsername}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {std.parentPassword}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openEditStudentModal(std)}
                        className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-md hover:bg-indigo-50 transition-colors"
                        title="Edit Detail Murid"
                        aria-label={`Edit detail ${std.name}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus siswa ${std.name}? Data kartu dan relasi akun juga akan dihapus.`)) {
                            deleteStudent(std.id);
                            showToast(`Siswa ${std.name} berhasil dihapus.`);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition-colors"
                        title="Hapus Murid"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Generator Kartu Login Orang Tua */}
      {activeTab === 'kartu' && (
        <div className="space-y-6">
          <div className="no-print bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Kartu Akses Login Orang Tua Murid ({students.length} Kartu)
              </h3>
              <p className="text-xs text-slate-500">
                Dapat dicetak langsung (Print/PDF) untuk digunting dan dibagikan kepada orang tua, atau diekspor sebagai file spreadsheet.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportCredentialsCsv}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Ekspor Tabel (CSV)</span>
              </button>

              <button
                onClick={handlePrintCards}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Semua Kartu (PDF)</span>
              </button>
            </div>
          </div>

          {/* Printable Cards Grid (Optimized for Screen & Print Window) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-4">
            {students.map((std) => (
              <div
                key={std.id}
                className="print-card bg-white rounded-2xl border-2 border-dashed border-slate-300 p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-indigo-400 transition-colors"
              >
                {/* Official Letterhead Strip on Card */}
                <div>
                  <div className="flex items-center gap-3 border-b border-slate-200 pb-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-950 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      <School className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div>
                      <h5 className="text-[11px] font-extrabold text-slate-900 uppercase tracking-tight leading-tight">
                        {schoolProfile.name}
                      </h5>
                      <p className="text-[10px] text-slate-500 leading-none mt-0.5">
                        KARTU AKSES PORTAL JURNAL ORANG TUA · {schoolProfile.classGrade}
                      </p>
                    </div>
                  </div>

                  {/* Student & Parent Info */}
                  <div className="space-y-1.5 mb-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        NAMA SISWA:
                      </span>
                      <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
                        {std.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono">NISN: {std.nisn}</p>
                    </div>

                    <div className="pt-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        WALI / ORANG TUA:
                      </span>
                      <p className="text-xs font-medium text-slate-800">{std.parentName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{std.parentPhone}</p>
                    </div>
                  </div>

                  {/* Highlighted Credentials Box */}
                  <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-900 uppercase">
                        KREDENSIAL LOGIN ANDA
                      </span>
                      <span className="text-[10px] font-medium text-indigo-600 bg-white px-1.5 py-0.2 rounded border border-indigo-200">
                        Privat & Rahasia
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Username:</span>
                        <span className="font-mono font-bold text-indigo-900 select-all">
                          {std.parentUsername}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Kata Sandi:</span>
                        <span className="font-mono font-bold text-indigo-900 select-all">
                          {std.parentPassword}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer with Mock QR Code & Website URL */}
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                  <div className="text-[10px] text-slate-500">
                    <p className="font-medium text-slate-700">Akses Portal Jurnal:</p>
                    <p className="font-mono text-[9px] text-indigo-700 truncate max-w-[170px]">
                      {window.location.origin}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded border border-slate-300 p-0.5 bg-white flex items-center justify-center shrink-0">
                    <QrCode className="w-7 h-7 text-slate-800" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Jurnal Harian Kelas (Data from Admin CP/TP) */}
      {activeTab === 'jurnal' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Jurnal Baru */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Input Jurnal Harian Pembelajaran</h3>
            <p className="text-xs text-slate-500">
              Data mata pelajaran serta capaian pembelajaran ditarik otomatis dari database kurikulum Admin.
            </p>

            <form onSubmit={handleSaveJournal} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={journalDate}
                    onChange={(e) => setJournalDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Pelajaran</label>
                  <input
                    type="text"
                    value={journalTimeSlot}
                    onChange={(e) => setJournalTimeSlot(e.target.value)}
                    placeholder="Contoh: 07:30 - 09:00"
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Mata Pelajaran (Database Admin)
                </label>
                <select
                  value={journalSubjectId}
                  onChange={(e) => {
                    setJournalSubjectId(e.target.value);
                    setJournalLoId('');
                  }}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Capaian & Tujuan Pembelajaran (CP / TP)
                </label>
                <select
                  value={journalLoId}
                  onChange={(e) => setJournalLoId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  <option value="">-- Gunakan TP Umum Modul Ajar --</option>
                  {availableLoForSubject.map((lo) => (
                    <option key={lo.id} value={lo.id}>
                      {lo.tujuanPembelajaran.slice(0, 75)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Uraian Kegiatan Belajar & Praktik di Kelas
                </label>
                <textarea
                  rows={3}
                  value={journalActivity}
                  onChange={(e) => setJournalActivity(e.target.value)}
                  placeholder="Deskripsikan proses pembelajaran, eksperimen, diskusi kelompok, atau presentasi siswa..."
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Attendance Mini Form */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Presensi Kehadiran Siswa (Total: {students.length})
                </span>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <label className="text-[10px] font-semibold text-emerald-700">Hadir</label>
                    <input
                      type="number"
                      value={journalAttendancePresent}
                      onChange={(e) => setJournalAttendancePresent(Number(e.target.value))}
                      className="w-full text-center px-1 py-1 text-xs rounded border border-slate-300 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-amber-700">Sakit</label>
                    <input
                      type="number"
                      value={journalAttendanceSick}
                      onChange={(e) => setJournalAttendanceSick(Number(e.target.value))}
                      className="w-full text-center px-1 py-1 text-xs rounded border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-blue-700">Izin</label>
                    <input
                      type="number"
                      value={journalAttendancePermit}
                      onChange={(e) => setJournalAttendancePermit(Number(e.target.value))}
                      className="w-full text-center px-1 py-1 text-xs rounded border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-rose-700">Alpa</label>
                    <input
                      type="number"
                      value={journalAttendanceAbsent}
                      onChange={(e) => setJournalAttendanceAbsent(Number(e.target.value))}
                      className="w-full text-center px-1 py-1 text-xs rounded border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Refleksi / Pesan untuk Orang Tua (Opsional)
                </label>
                <input
                  type="text"
                  value={journalNotes}
                  onChange={(e) => setJournalNotes(e.target.value)}
                  placeholder="Contoh: Siswa diharapkan mempelajari materi bab 3 halaman 45..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-colors"
              >
                Simpan & Terbitkan Jurnal Harian
              </button>
            </form>
          </div>

          {/* Feed Riwayat Jurnal Kelas */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-slate-900">
                Riwayat Jurnal Harian Kelas ({journalEntries.length})
              </h3>
              <span className="text-xs text-slate-500">Tersinkron ke Dashboard Orang Tua</span>
            </div>

            {journalEntries.map((j) => (
              <div
                key={j.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                      {j.subjectName}
                    </span>
                    <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {j.timeSlot}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">{j.date}</span>
                    <button
                      onClick={() => {
                        if (confirm('Hapus jurnal ini?')) {
                          deleteJournalEntry(j.id);
                          showToast('Jurnal dihapus.');
                        }
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded"
                      title="Hapus Jurnal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <p className="text-[11px] font-bold text-slate-500 uppercase">
                    TUJUAN PEMBELAJARAN (TP):
                  </p>
                  <p className="text-xs font-semibold text-slate-800 leading-snug">
                    {j.tpDescription}
                  </p>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  {j.activityDescription}
                </p>

                {j.notes && (
                  <div className="text-xs bg-amber-50 border border-amber-200 text-amber-900 p-2.5 rounded-lg">
                    <span className="font-bold">Catatan Guru: </span>
                    {j.notes}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-700 font-semibold">Hadir: {j.attendancePresent}</span>
                    <span className="text-amber-700">Sakit: {j.attendanceSick}</span>
                    <span className="text-blue-700">Izin: {j.attendancePermit}</span>
                    <span className="text-rose-700">Alpa: {j.attendanceAbsent}</span>
                  </div>
                  <span>Guru: {j.teacherName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Apresiasi Bintang Murid */}
      {activeTab === 'bintang' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Sistem Apresiasi Bintang Karakter & Akademik
              </h3>
              <p className="text-xs text-slate-500">
                Guru Kelas, Guru BK, dan Guru PAI dapat memberikan bintang yang secara akumulatif tampil membanggakan di dashboard orang tua murid.
              </p>
            </div>

            <button
              onClick={() => setShowStarModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-colors shadow-sm self-start sm:self-auto"
            >
              <Sparkles className="w-4 h-4" />
              <span>Beri Bintang Apresiasi</span>
            </button>
          </div>

          {/* Star Feed & Student Star Tallies */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Star Tally per Student */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h4 className="text-sm font-bold text-slate-900">Peringkat Bintang Kelas</h4>

              <div className="space-y-3">
                {students.map((std) => {
                  const studentStars = starAwards.filter((s) => s.studentId === std.id);
                  const rewards = studentStars.filter((s) => s.type !== 'penalty').reduce((sum, item) => sum + item.starsCount, 0);
                  const penalties = studentStars.filter((s) => s.type === 'penalty').reduce((sum, item) => sum + item.starsCount, 0);
                  const netto = Math.max(0, rewards - penalties);

                  return (
                    <div
                      key={std.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-amber-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                          {std.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{std.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">NISN: {std.nisn}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right hidden sm:block">
                          <span className="text-[10px] text-emerald-700 font-mono font-semibold">+{rewards}</span>
                          <span className="text-[10px] text-slate-300 mx-1">/</span>
                          <span className="text-[10px] text-rose-700 font-mono font-semibold">-{penalties}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                          <span className="font-extrabold text-xs text-amber-950 font-mono tabular-nums">
                            {netto} Bintang
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Star Awards & Penalties History Feed */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h4 className="text-sm font-bold text-slate-900">Histori Apresiasi & Pelanggaran Terkini</h4>

              <div className="space-y-3">
                {starAwards.map((st) => {
                  const isPenalty = st.type === 'penalty';
                  return (
                    <div
                      key={st.id}
                      className={`p-4 rounded-xl border flex items-start justify-between gap-3 ${
                        isPenalty ? 'border-rose-200 bg-rose-50/40' : 'border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-xs text-slate-900">{st.studentName}</span>
                          <span className={`text-[10px] px-2 py-0.2 rounded font-semibold border ${
                            isPenalty
                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                            {isPenalty ? `Pelanggaran: -${st.starsCount} ★` : `Apresiasi: +${st.starsCount} ★`} · {st.category}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{st.date}</span>
                        </div>

                        <div className="flex items-center gap-1 mb-1.5">
                          {Array.from({ length: st.starsCount }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                isPenalty ? 'fill-rose-400 text-rose-500' : 'fill-amber-400 text-amber-500'
                              }`}
                            />
                          ))}
                        </div>

                        <p className={`text-xs leading-relaxed italic ${isPenalty ? 'text-rose-900 font-medium' : 'text-slate-700'}`}>
                          "{st.note}"
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">Oleh: {st.awarderName}</p>
                      </div>

                      <button
                        onClick={() => {
                          deleteStarAward(st.id);
                          showToast('Catatan bintang dihapus.');
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Ruang Chat dengan Orang Tua */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[520px]">
          {/* Left: Parent Contacts */}
          <div className="md:col-span-4 border-r border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Daftar Wali Murid ({students.length})
            </h4>
            <div className="space-y-1.5 overflow-y-auto max-h-[460px]">
              {students.map((std) => {
                const isSelected = selectedChatStudentId === std.id;
                const unreadCount = messages.filter(
                  (m) => m.studentId === std.id && !m.isRead && m.senderRole === 'orangtua'
                ).length;

                return (
                  <button
                    key={std.id}
                    onClick={() => setSelectedChatStudentId(std.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-white text-indigo-900 font-semibold shadow-xs border border-indigo-200'
                        : 'text-slate-700 hover:bg-white hover:text-slate-900'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold leading-tight">{std.name}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{std.parentName}</p>
                    </div>
                    {unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Chat Window */}
          <div className="md:col-span-8 flex flex-col justify-between p-4 bg-white">
            {activeChatStudentObj ? (
              <>
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Percakapan Privat: {activeChatStudentObj.parentName}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Topik Murid: <span className="font-semibold text-indigo-700">{activeChatStudentObj.name}</span>
                    </p>
                  </div>
                  <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                    Saluran Aman & Terbimbing
                  </span>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
                  {activeStudentChat.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-10">
                      <MessageCircle className="w-8 h-8 mb-2 text-slate-300" />
                      <p>Belum ada pesan percakapan dengan wali murid ini.</p>
                      <p className="text-[11px]">Ketik pesan di bawah untuk memulai konsultasi dua arah.</p>
                    </div>
                  ) : (
                    activeStudentChat.map((msg) => {
                      const isMe = msg.senderRole === 'guru_kelas';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <span className="text-[10px] text-slate-400 mb-0.5">
                            {msg.senderName} ({msg.senderRole.replace('_', ' ').toUpperCase()})
                          </span>
                          <div
                            className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                              isMe
                                ? 'bg-indigo-600 text-white rounded-br-xs'
                                : 'bg-slate-100 text-slate-900 rounded-bl-xs border border-slate-200'
                            }`}
                          >
                            {msg.content}
                          </div>
                          <span className="text-[9px] text-slate-400 mt-0.5 font-mono">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendChat} className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInputText}
                    onChange={(e) => setChatInputText(e.target.value)}
                    placeholder={`Tulis pesan untuk ${activeChatStudentObj.parentName}...`}
                    className="flex-1 px-4 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Pilih wali murid dari daftar sebelah kiri.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 6: Form Penilaian Internal Guru Kelas (Buku Nilai Rahasia) */}
      {activeTab === 'penilaian' && (
        <InternalGradesTab
          teacherRole="guru_kelas"
          teacherName={currentUser?.name || 'Ibu Ratna Kumalasari, S.Pd.'}
          roleTitle="Guru Kelas"
          defaultSubjectName={subjects[0]?.name || 'Matematika'}
        />
      )}

      {/* Tab 7: Rekapitulasi & Unduh Berkas Laporan Jurnal Kelas */}
      {activeTab === 'rekap' && (
        <TeacherJournalReportView
          teacherRole="guru_kelas"
          teacherName={currentUser?.name || 'Ibu Ratna Kumalasari, S.Pd.'}
          reportTitle="Laporan Jurnal Harian Pembelajaran Kelas"
          reportSubtitle="Rekapitulasi Jurnal Mengajar, Capaian TP, Presensi & Catatan Guru Kelas"
        />
      )}

      {/* Modal Tambah Siswa Manual */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {editingStudentId ? 'Edit Detail Siswa' : 'Tambah Siswa Baru'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {editingStudentId
                ? 'Perbarui data siswa dan informasi orang tua / wali.'
                : 'Sistem akan otomatis membuat kartu akun login orang tua dengan username & password unik.'}
            </p>

            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  placeholder="Contoh: Bilal Ramadhan"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">NISN (10 Digit)</label>
                  <input
                    type="text"
                    placeholder="Contoh: 0142981015"
                    value={newNisn}
                    onChange={(e) => setNewNisn(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as 'L' | 'P')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Orang Tua / Wali</label>
                <input
                  type="text"
                  placeholder="Contoh: Bapak Usman & Ibu Fatimah"
                  value={newParentName}
                  onChange={(e) => setNewParentName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Kontak WhatsApp / HP</label>
                <input
                  type="text"
                  placeholder="Contoh: 0812-3456-7890"
                  value={newParentPhone}
                  onChange={(e) => setNewParentPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddStudentModal(false);
                    setEditingStudentId(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                >
                  {editingStudentId ? 'Simpan Perubahan' : 'Simpan Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Preview Upload Excel */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Pratinjau Impor Spreadsheet ({parsedImportRows.length} Siswa Terdeteksi)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Periksa data berikut sebelum disimpan ke database kelas:
            </p>

            <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl mb-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="p-2.5">NISN</th>
                    <th className="p-2.5">Nama Siswa</th>
                    <th className="p-2.5">JK</th>
                    <th className="p-2.5">Orang Tua</th>
                    <th className="p-2.5">No HP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {parsedImportRows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-2.5">{row.nisn}</td>
                      <td className="p-2.5 font-sans font-bold text-slate-800">{row.name}</td>
                      <td className="p-2.5">{row.gender}</td>
                      <td className="p-2.5 font-sans">{row.parentName}</td>
                      <td className="p-2.5">{row.parentPhone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setParsedImportRows([]);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
              >
                Simpan & Generate Semua Akun
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Beri Apresiasi / Pengurangan Bintang Pelanggaran */}
      {showStarModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              {starActionType === 'reward' ? (
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Sparkles className="w-5 h-5" />
                </div>
              ) : (
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              )}
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {starActionType === 'reward' ? 'Apresiasi Penambahan Bintang' : 'Konsekuensi Pengurangan Bintang'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Tersinkronisasi secara real-time ke akun orang tua siswa
                </p>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl mb-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setStarActionType('reward');
                  setStarCategory('Keaktifan Belajar');
                }}
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  starActionType === 'reward'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>(+) Apresiasi Bintang</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setStarActionType('penalty');
                  setStarCategory('Lupa Membawa Buku / PR');
                }}
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  starActionType === 'penalty'
                    ? 'bg-rose-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MinusCircle className="w-3.5 h-3.5" />
                <span>(-) Pengurangan Sanksi</span>
              </button>
            </div>

            <form onSubmit={handleSaveStar} className="space-y-4">
              <StarAwardBatchFields
                students={students}
                selectedStudentIds={starStudentIds}
                onSelectedStudentIdsChange={setStarStudentIds}
                category={starCategory}
                onCategoryChange={setStarCategory}
                categoryOptions={starCategoryOptions}
                newCategory={newStarCategory}
                onNewCategoryChange={setNewStarCategory}
                onAddCategory={handleAddStarCategory}
                categoryLabel={starActionType === 'reward' ? 'Kategori Capaian Positif' : 'Jenis Pelanggaran / Tata Tertib'}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {starActionType === 'reward' ? 'Jumlah Bintang Ditambahkan' : 'Jumlah Bintang Dikurangkan'}
                </label>
                <div className="flex items-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setStarCount(num)}
                      className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1 text-xs font-bold transition-all ${
                        starCount >= num
                          ? starActionType === 'reward'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs'
                            : 'bg-rose-100 text-rose-900 border border-rose-300 shadow-2xs'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${
                        starCount >= num
                          ? starActionType === 'reward'
                            ? 'fill-amber-400 text-amber-500'
                            : 'fill-rose-500 text-rose-600'
                          : 'text-slate-300'
                      }`} />
                      <span>{starActionType === 'penalty' ? `-${num}` : `+${num}`}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {starActionType === 'reward' ? 'Catatan Apresiasi Guru' : 'Alasan Sanksi & Catatan untuk Orang Tua'}
                </label>
                <textarea
                  rows={2}
                  value={starNote}
                  onChange={(e) => setStarNote(e.target.value)}
                  placeholder={
                    starActionType === 'reward'
                      ? 'Contoh: Menyelesaikan tugas modul matematika dengan rapi dan membantu teman...'
                      : 'Contoh: Belum mengumpulkan lembar kerja matematika dan asyik berbicara dengan teman...'
                  }
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStarModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors shadow-sm ${
                    starActionType === 'reward'
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                >
                  {starActionType === 'reward' ? 'Kirimkan Apresiasi' : 'Terapkan Pengurangan Bintang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
