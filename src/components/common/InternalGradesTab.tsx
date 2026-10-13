import React, { useState } from 'react';
import { useEduStore } from '../../services/store';
import { AssessmentType, InternalGradeRecord, UserRole } from '../../types';
import {
  Lock,
  Plus,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Award,
  Search,
  BookOpen,
  Calendar,
  Save,
  HelpCircle,
  FileText
} from 'lucide-react';

interface InternalGradesTabProps {
  teacherRole: 'guru_kelas' | 'guru_bk' | 'guru_pai';
  teacherName: string;
  defaultSubjectName?: string;
  roleTitle: string;
}

export const InternalGradesTab: React.FC<InternalGradesTabProps> = ({
  teacherRole,
  teacherName,
  defaultSubjectName,
  roleTitle,
}) => {
  const {
    students,
    subjects,
    learningObjectives,
    internalGrades,
    addInternalGrade,
    deleteInternalGrade,
    updateInternalStudentScore,
    schoolProfile,
  } = useEduStore();

  // Filter grades created by this teacher role
  const roleGrades = internalGrades.filter((g) => g.teacherRole === teacherRole);

  const [selectedGradeId, setSelectedGradeId] = useState<string>(
    roleGrades[0]?.id || ''
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Grade Sheet Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState(defaultSubjectName || subjects[0]?.name || 'Matematika');
  const [newType, setNewType] = useState<AssessmentType>('Formatif Harian');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newKkm, setNewKkm] = useState(75);
  const [newTpDesc, setNewTpDesc] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const activeGradeSheet =
    roleGrades.find((g) => g.id === selectedGradeId) || roleGrades[0];

  const handleCreateGradeSheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Initialize all students with default empty scores
    const initialScores: InternalGradeRecord['scores'] = {};
    students.forEach((s) => {
      initialScores[s.id] = {
        score: newKkm,
        predicate: newKkm >= 85 ? 'A' : newKkm >= 75 ? 'B' : 'C',
        notes: 'Selesai tepat waktu',
      };
    });

    addInternalGrade({
      teacherRole,
      teacherName,
      subjectName: newSubject,
      assessmentTitle: newTitle.trim(),
      assessmentType: newType,
      date: newDate,
      kkmScore: Number(newKkm) || 75,
      tpDescription: newTpDesc.trim() || 'Tercapai sesuai indikator tujuan pembelajaran modul ajar.',
      scores: initialScores,
      isInternalOnly: true,
    });

    setShowAddModal(false);
    setNewTitle('');
    setNewTpDesc('');
    showToast('Lembar penilaian internal berhasil dibuat! Data tersimpan rahasia untuk guru.');
  };

  const handleScoreChange = (
    gradeId: string,
    studentId: string,
    scoreVal: number,
    notesVal?: string
  ) => {
    const validScore = Math.max(0, Math.min(100, Number(scoreVal) || 0));
    let predicate: 'A' | 'B' | 'C' | 'D' = 'D';
    if (validScore >= 85) predicate = 'A';
    else if (validScore >= 75) predicate = 'B';
    else if (validScore >= 65) predicate = 'C';

    updateInternalStudentScore(gradeId, studentId, validScore, predicate, notesVal);
  };

  // Export current grade matrix to CSV
  const handleExportCsv = () => {
    if (!activeGradeSheet) return;
    let csv = `LEMBAR PENILAIAN INTERNAL GURU (${roleTitle.toUpperCase()})\n`;
    csv += `Mata Pelajaran:,"${activeGradeSheet.subjectName}"\n`;
    csv += `Nama Penilaian:,"${activeGradeSheet.assessmentTitle}"\n`;
    csv += `Jenis Penilaian:,"${activeGradeSheet.assessmentType}"\n`;
    csv += `KKM:,"${activeGradeSheet.kkmScore}"\n`;
    csv += `Tanggal:,"${activeGradeSheet.date}"\n`;
    csv += `Guru Penilai:,"${activeGradeSheet.teacherName}"\n\n`;
    csv += `No,NISN,Nama Siswa,Nilai (0-100),Predikat,Status Ketuntasan,Catatan Internal Guru\n`;

    students.forEach((s, idx) => {
      const entry = activeGradeSheet.scores[s.id] || { score: 0, predicate: 'D', notes: '-' };
      const isPassed = entry.score >= activeGradeSheet.kkmScore;
      csv += `${idx + 1},"${s.nisn}","${s.name}",${entry.score},"${entry.predicate}","${isPassed ? 'TUNTAS' : 'REMEDIAL'}","${entry.notes || '-'}"\n`;
    });

    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Nilai_Internal_${activeGradeSheet.subjectName.replace(/\s+/g, '_')}_${activeGradeSheet.date}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Data nilai internal berhasil diekspor ke format spreadsheet CSV!');
  };

  // Calculate statistics for active grade sheet
  const gradeScores = activeGradeSheet
    ? students.map((s) => activeGradeSheet.scores[s.id]?.score || 0)
    : [];
  const avgScore = gradeScores.length > 0
    ? Math.round((gradeScores.reduce((a, b) => a + b, 0) / gradeScores.length) * 10) / 10
    : 0;
  const maxScore = gradeScores.length > 0 ? Math.max(...gradeScores) : 0;
  const minScore = gradeScores.length > 0 ? Math.min(...gradeScores) : 0;
  const passedCount = activeGradeSheet
    ? students.filter((s) => (activeGradeSheet.scores[s.id]?.score || 0) >= activeGradeSheet.kkmScore).length
    : 0;
  const passPercentage = students.length > 0 ? Math.round((passedCount / students.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner with Strict Confidentiality Badge */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold mb-2 shadow-xs">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>ARSIP RAHASIA GURU (TIDAK TAMPIL DI HALAMAN ORANG TUA)</span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Form Penilaian Internal & Rekap Nilai Siswa
          </h3>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Pencatatan nilai formatif, tugas modul, unjuk kerja, dan sumatif lingkup materi oleh {roleTitle}. Nilai angka ini disimpan ke database sebagai berkas portofolio guru dan secara khusus <strong>tidak dipublikasikan</strong> ke akun orang tua siswa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
          {activeGradeSheet && (
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-semibold transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Ekspor CSV</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat Lembar Nilai Baru</span>
          </button>
        </div>
      </div>

      {/* Sheet Selector & Class Overview */}
      {roleGrades.length > 0 ? (
        <div className="space-y-6">
          {/* Assessment Sheets Selector Row */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
                PILIH INSTRUMEN NILAI:
              </span>
              {roleGrades.map((g) => {
                const isSelected = activeGradeSheet?.id === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGradeId(g.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{g.subjectName} · {g.assessmentTitle}</span>
                  </button>
                );
              })}
            </div>

            {activeGradeSheet && (
              <button
                onClick={() => {
                  if (confirm(`Hapus lembar penilaian "${activeGradeSheet.assessmentTitle}"?`)) {
                    deleteInternalGrade(activeGradeSheet.id);
                    showToast('Lembar penilaian internal berhasil dihapus.');
                  }
                }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors self-end sm:self-auto shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Lembar Ini</span>
              </button>
            )}
          </div>

          {activeGradeSheet && (
            <>
              {/* Active Assessment Meta & Statistical Insights Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {activeGradeSheet.subjectName}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {activeGradeSheet.assessmentType}
                      </span>
                      <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {activeGradeSheet.date}
                      </span>
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-mono">
                        KKM: {activeGradeSheet.kkmScore}
                      </span>
                    </div>

                    <h4 className="text-lg font-extrabold text-slate-900 leading-snug">
                      {activeGradeSheet.assessmentTitle}
                    </h4>

                    {activeGradeSheet.tpDescription && (
                      <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
                        <strong className="text-slate-800">Tujuan Pembelajaran (TP):</strong> {activeGradeSheet.tpDescription}
                      </p>
                    )}
                  </div>

                  {/* 4 Statistics Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                    <div className="text-center px-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Rata-Rata</span>
                      <span className="text-lg font-black text-slate-900 font-mono tabular-nums leading-tight">{avgScore}</span>
                    </div>
                    <div className="text-center px-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Tertinggi</span>
                      <span className="text-lg font-black text-emerald-700 font-mono tabular-nums leading-tight">{maxScore}</span>
                    </div>
                    <div className="text-center px-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Terendah</span>
                      <span className="text-lg font-black text-rose-700 font-mono tabular-nums leading-tight">{minScore}</span>
                    </div>
                    <div className="text-center px-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Ketuntasan</span>
                      <span className="text-lg font-black text-indigo-700 font-mono tabular-nums leading-tight">{passPercentage}%</span>
                    </div>
                  </div>
                </div>

                {/* Score Input Matrix Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-xs tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4 w-12 text-center">No</th>
                        <th className="py-3.5 px-4 min-w-[200px]">Nama Siswa & NISN</th>
                        <th className="py-3.5 px-4 w-36 text-center">Nilai Angka (0-100)</th>
                        <th className="py-3.5 px-4 w-28 text-center">Predikat</th>
                        <th className="py-3.5 px-4 w-32 text-center">Status Ketuntasan</th>
                        <th className="py-3.5 px-4 min-w-[260px]">Catatan Evaluasi Internal Guru</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.map((std, idx) => {
                        const entry = activeGradeSheet.scores[std.id] || {
                          score: activeGradeSheet.kkmScore,
                          predicate: 'B',
                          notes: '',
                        };
                        const isPassed = entry.score >= activeGradeSheet.kkmScore;

                        return (
                          <tr key={std.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 text-center text-slate-500 font-mono font-medium">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-900 block leading-snug">
                                {std.name}
                              </span>
                              <span className="text-xs text-slate-500 font-mono">
                                NISN: {std.nisn} · Wali: {std.parentName}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="inline-flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={entry.score}
                                  onChange={(e) =>
                                    handleScoreChange(
                                      activeGradeSheet.id,
                                      std.id,
                                      Number(e.target.value),
                                      entry.notes
                                    )
                                  }
                                  className="w-20 px-2.5 py-1.5 text-center text-base font-extrabold font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                />
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`inline-block px-3 py-1 rounded-lg text-xs font-black font-mono ${
                                  entry.predicate === 'A'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : entry.predicate === 'B'
                                    ? 'bg-blue-100 text-blue-800'
                                    : entry.predicate === 'C'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {entry.predicate}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                  isPassed
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {isPassed ? 'TUNTAS' : 'REMEDIAL'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="text"
                                defaultValue={entry.notes || ''}
                                onBlur={(e) =>
                                  handleScoreChange(
                                    activeGradeSheet.id,
                                    std.id,
                                    entry.score,
                                    e.target.value
                                  )
                                }
                                placeholder="Catatan internal guru (cth: Perlu pengayaan pada rumus luas)..."
                                className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Perubahan nilai otomatis tersimpan langsung ke sistem saat diubah.</span>
                  </div>
                  <span>Total Siswa Dinilai: {students.length} Anak</span>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">Belum Ada Lembar Penilaian Internal</h4>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              Buat lembar penilaian formatif atau sumatif baru untuk mencatat nilai angka siswa. Nilai tersimpan rahasia khusus guru.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-xs inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Lembar Penilaian Pertama</span>
          </button>
        </div>
      )}

      {/* Modal Buat Lembar Nilai Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-xs font-bold mb-2">
                <Lock className="w-3 h-3 text-amber-400" />
                <span>FORM NILAI INTERNAL GURU</span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Buat Instrumen Penilaian Baru</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Nilai yang disimpan pada form ini tidak akan dipublikasikan ke halaman orang tua.
              </p>
            </div>

            <form onSubmit={handleCreateGradeSheet} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Mata Pelajaran
                </label>
                <select
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.name}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                  {defaultSubjectName && !subjects.some((s) => s.name === defaultSubjectName) && (
                    <option value={defaultSubjectName}>{defaultSubjectName}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Judul Penilaian / Materi Uji
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Formatif Bab 3 Bilangan Bulat / Sumatif Akhir Semester"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Jenis Penilaian
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as AssessmentType)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="Formatif Harian">Formatif Harian</option>
                    <option value="Sumatif Lingkup Materi">Sumatif Lingkup Materi</option>
                    <option value="Sumatif Akhir Semester">Sumatif Akhir Semester</option>
                    <option value="Tugas / Modul Proyek">Tugas / Proyek</option>
                    <option value="Praktik & Unjuk Kerja">Praktik & Unjuk Kerja</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    KKM / Nilai Ketercapaian
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    required
                    value={newKkm}
                    onChange={(e) => setNewKkm(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-sm font-mono font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tanggal Pelaksanaan
                </label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tujuan Pembelajaran / Indikator (TP)
                </label>
                <textarea
                  rows={2}
                  value={newTpDesc}
                  onChange={(e) => setNewTpDesc(e.target.value)}
                  placeholder="Deskripsi kompetensi yang diujikan dalam penilaian ini..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm"
                >
                  Simpan & Buka Matriks Nilai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
