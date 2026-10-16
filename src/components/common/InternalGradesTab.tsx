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
  Calendar,
  Save,
  HelpCircle,
  FileText
} from 'lucide-react';

type BkPredicate = 'SB' | 'B' | 'C' | 'PB';

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

  const isBk = teacherRole === 'guru_bk';

  const BK_FIELDS = [
    'Bimbingan Pribadi & Emosi',
    'Bimbingan Sosial & Relasi Teman',
    'Bimbingan Belajar & Motivasi',
    'Bimbingan Karakter & Kedisiplinan',
  ];

  const BK_TYPES: AssessmentType[] = [
    'Formatif Harian', // underlying type compatibility
    'Tugas / Modul Proyek',
    'Praktik & Unjuk Kerja',
  ];

  const BK_TYPE_LABELS: Record<string, string> = {
    'Formatif Harian': 'Observasi Sikap Harian',
    'Sumatif Lingkup Materi': 'Asesmen Kebutuhan Non-Kognitif',
    'Sumatif Akhir Semester': 'Evaluasi Periodik Konseling',
    'Tugas / Modul Proyek': 'Sosiometri & Dinamika Kelompok',
    'Praktik & Unjuk Kerja': 'Praktik Bimbingan Klasikal',
  };

  const BK_PREDICATES: { code: BkPredicate; label: string; score: number }[] = [
    { code: 'SB', label: 'Sangat Baik (SB)', score: 95 },
    { code: 'B', label: 'Baik / Berkembang (B)', score: 85 },
    { code: 'C', label: 'Cukup / Mulai Tampak (C)', score: 70 },
    { code: 'PB', label: 'Perlu Bimbingan (PB)', score: 55 },
  ];

  // Filter grades created by this teacher role
  const activeSubjectNames = new Set(
    subjects.map((subject) => subject.name.trim().toLocaleLowerCase())
  );
  const roleGrades = internalGrades.filter(
    (grade) =>
      grade.teacherRole === teacherRole &&
      (teacherRole !== 'guru_kelas' ||
        activeSubjectNames.has(grade.subjectName.trim().toLocaleLowerCase()))
  );

  const [selectedGradeId, setSelectedGradeId] = useState<string>(
    roleGrades[0]?.id || ''
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Grade Sheet Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState(
    isBk ? (defaultSubjectName || BK_FIELDS[0]) : (defaultSubjectName || subjects[0]?.name || 'Matematika')
  );
  const [newType, setNewType] = useState<AssessmentType>('Formatif Harian');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newKkm, setNewKkm] = useState(isBk ? 0 : 75);
  const [newTpDesc, setNewTpDesc] = useState('');

  const normalizeBkPredicate = (predicate?: InternalGradeRecord['scores'][string]['predicate']): BkPredicate => {
    if (predicate === 'A' || predicate === 'SB') return 'SB';
    if (predicate === 'C') return 'C';
    if (predicate === 'D' || predicate === 'PB') return 'PB';
    return 'B';
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const activeGradeSheet =
    roleGrades.find((g) => g.id === selectedGradeId) || roleGrades[0];

  const handleCreateGradeSheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Initialize all students with default entries
    const initialScores: InternalGradeRecord['scores'] = {};
    students.forEach((s) => {
      initialScores[s.id] = {
        score: isBk ? 85 : (Number(newKkm) || 75),
        predicate: isBk ? 'B' : ((Number(newKkm) || 75) >= 85 ? 'A' : (Number(newKkm) || 75) >= 75 ? 'B' : 'C'),
        notes: isBk ? 'Berkembang sesuai harapan.' : 'Selesai tepat waktu',
      };
    });

    addInternalGrade({
      teacherRole,
      teacherName,
      subjectName: newSubject,
      assessmentTitle: newTitle.trim(),
      assessmentType: newType,
      date: newDate,
      kkmScore: isBk ? 0 : (Number(newKkm) || 75),
      tpDescription:
        newTpDesc.trim() ||
        (isBk
          ? 'Pemantauan perkembangan sikap, kemandirian, dan dinamika interaksi sosial murid.'
          : 'Tercapai sesuai indikator tujuan pembelajaran modul ajar.'),
      scores: initialScores,
      isInternalOnly: true,
    });

    setShowAddModal(false);
    setNewTitle('');
    setNewTpDesc('');
    showToast(
      isBk
        ? 'Lembar observasi perkembangan BK berhasil dibuat!'
        : 'Lembar penilaian internal berhasil dibuat! Data tersimpan rahasia untuk guru.'
    );
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

  const handleBkPredicateChange = (
    gradeId: string,
    studentId: string,
    predCode: BkPredicate,
    notesVal?: string
  ) => {
    const found = BK_PREDICATES.find((p) => p.code === predCode);
    const scoreVal = found ? found.score : 80;
    const currentNotes = notesVal !== undefined ? notesVal : (activeGradeSheet?.scores[studentId]?.notes || '');
    updateInternalStudentScore(gradeId, studentId, scoreVal, predCode, currentNotes);
  };

  // Export current grade matrix to CSV
  const handleExportCsv = () => {
    if (!activeGradeSheet) return;

    if (isBk) {
      let csv = `LEMBAR OBSERVASI & ASESMEN NON-KOGNITIF GURU BK\n`;
      csv += `Bidang Layanan BK:,"${activeGradeSheet.subjectName}"\n`;
      csv += `Judul Asesmen:,"${activeGradeSheet.assessmentTitle}"\n`;
      csv += `Jenis Layanan:,"${BK_TYPE_LABELS[activeGradeSheet.assessmentType] || activeGradeSheet.assessmentType}"\n`;
      csv += `Tanggal:,"${activeGradeSheet.date}"\n`;
      csv += `Guru Konselor:,"${activeGradeSheet.teacherName}"\n`;
      csv += `Sekolah:,"${schoolProfile.name}"\n\n`;
      csv += `No,NISN,Nama Siswa,Tingkat Perkembangan Karakter,Catatan Rekomendasi Guru BK\n`;

      students.forEach((s, idx) => {
        const entry = activeGradeSheet.scores[s.id] || { score: 85, predicate: 'B', notes: '-' };
        const predObj = BK_PREDICATES.find((p) => p.code === normalizeBkPredicate(entry.predicate));
        const predLabel = predObj ? predObj.label : 'Baik / Berkembang (B)';
        csv += `${idx + 1},"${s.nisn}","${s.name}","${predLabel}","${entry.notes || '-'}"\n`;
      });

      const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csv);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `Observasi_BK_${activeGradeSheet.subjectName.replace(/\s+/g, '_')}_${activeGradeSheet.date}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Data observasi BK berhasil diekspor ke spreadsheet CSV!');
      return;
    }

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

  // BK-specific qualitative counts
  const bkSbCount = students.filter(
    (s) => normalizeBkPredicate(activeGradeSheet?.scores[s.id]?.predicate) === 'SB'
  ).length;
  const bkBCount = students.filter(
    (s) => normalizeBkPredicate(activeGradeSheet?.scores[s.id]?.predicate) === 'B'
  ).length;
  const bkCCount = students.filter(
    (s) => normalizeBkPredicate(activeGradeSheet?.scores[s.id]?.predicate) === 'C'
  ).length;
  const bkPbCount = students.filter(
    (s) => normalizeBkPredicate(activeGradeSheet?.scores[s.id]?.predicate) === 'PB'
  ).length;

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
            {isBk ? 'Form Observasi Perkembangan Siswa' : 'Form Penilaian Internal & Rekap Nilai Siswa'}
          </h3>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            {isBk
              ? <>Pencatatan observasi kualitatif perkembangan sikap dan karakter oleh {roleTitle}. Catatan ini bersifat internal dan <strong>tidak dipublikasikan</strong> ke akun orang tua siswa.</>
              : <>Pencatatan nilai formatif, tugas modul, unjuk kerja, dan sumatif lingkup materi oleh {roleTitle}. Nilai angka ini disimpan ke database sebagai berkas portofolio guru dan secara khusus <strong>tidak dipublikasikan</strong> ke akun orang tua siswa.</>}
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
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0 flex-1">
              <label
                htmlFor="assessment-sheet-selector"
                className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0"
              >
                PILIH INSTRUMEN NILAI:
              </label>
              <select
                id="assessment-sheet-selector"
                value={activeGradeSheet?.id || ''}
                onChange={(event) => setSelectedGradeId(event.target.value)}
                className="w-full sm:max-w-2xl px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {roleGrades.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.subjectName} · {grade.assessmentTitle}
                  </option>
                ))}
              </select>
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
                        {isBk
                          ? (BK_TYPE_LABELS[activeGradeSheet.assessmentType] || activeGradeSheet.assessmentType)
                          : activeGradeSheet.assessmentType}
                      </span>
                      <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {activeGradeSheet.date}
                      </span>
                      {!isBk && (
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-mono">
                          KKM: {activeGradeSheet.kkmScore}
                        </span>
                      )}
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

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                    {isBk ? (
                      <>
                        <div className="text-center px-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">Sangat Baik</span>
                          <span className="text-lg font-black text-emerald-700 leading-tight">{bkSbCount}</span>
                        </div>
                        <div className="text-center px-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">Baik / Berkembang</span>
                          <span className="text-lg font-black text-blue-700 leading-tight">{bkBCount}</span>
                        </div>
                        <div className="text-center px-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">Mulai Tampak</span>
                          <span className="text-lg font-black text-amber-700 leading-tight">{bkCCount}</span>
                        </div>
                        <div className="text-center px-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">Perlu Bimbingan</span>
                          <span className="text-lg font-black text-rose-700 leading-tight">{bkPbCount}</span>
                        </div>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>
                </div>

                {/* Internal assessment matrix */}
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-xs tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4 w-12 text-center">No</th>
                        <th className="py-3.5 px-4 min-w-[200px]">Nama Siswa & NISN</th>
                        {isBk ? (
                          <>
                            <th className="py-3.5 px-4 min-w-[210px]">Perkembangan Sikap</th>
                            <th className="py-3.5 px-4 min-w-[260px]">Catatan Rekomendasi Guru BK</th>
                          </>
                        ) : (
                          <>
                            <th className="py-3.5 px-4 w-36 text-center">Nilai Angka (0-100)</th>
                            <th className="py-3.5 px-4 w-28 text-center">Predikat</th>
                            <th className="py-3.5 px-4 w-32 text-center">Status Ketuntasan</th>
                            <th className="py-3.5 px-4 min-w-[260px]">Catatan Evaluasi Internal Guru</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.map((std, idx) => {
                        const entry = activeGradeSheet.scores[std.id] || {
                          score: isBk ? 85 : activeGradeSheet.kkmScore,
                          predicate: 'B',
                          notes: '',
                        };
                        const isPassed = entry.score >= activeGradeSheet.kkmScore;
                        const bkPredicate = normalizeBkPredicate(entry.predicate);

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
                            {isBk ? (
                              <>
                                <td className="py-3 px-4">
                                  <select
                                    value={bkPredicate}
                                    onChange={(event) =>
                                      handleBkPredicateChange(
                                        activeGradeSheet.id,
                                        std.id,
                                        event.target.value as BkPredicate,
                                        entry.notes
                                      )
                                    }
                                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                                  >
                                    {BK_PREDICATES.map((predicate) => (
                                      <option key={predicate.code} value={predicate.code}>
                                        {predicate.label}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-3 px-4">
                                  <input
                                    type="text"
                                    defaultValue={entry.notes || ''}
                                    onBlur={(event) =>
                                      handleBkPredicateChange(
                                        activeGradeSheet.id,
                                        std.id,
                                        bkPredicate,
                                        event.target.value
                                      )
                                    }
                                    placeholder="Catatan perkembangan dan tindak lanjut..."
                                    className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white"
                                  />
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="py-3 px-4 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={entry.score}
                                    onChange={(event) =>
                                      handleScoreChange(
                                        activeGradeSheet.id,
                                        std.id,
                                        Number(event.target.value),
                                        entry.notes
                                      )
                                    }
                                    className="w-20 px-2.5 py-1.5 text-center text-base font-extrabold font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                  />
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
                                    onBlur={(event) =>
                                      handleScoreChange(
                                        activeGradeSheet.id,
                                        std.id,
                                        entry.score,
                                        event.target.value
                                      )
                                    }
                                    placeholder="Catatan internal guru..."
                                    className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                                  />
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{isBk ? 'Perubahan observasi otomatis tersimpan saat diubah.' : 'Perubahan nilai otomatis tersimpan langsung ke sistem saat diubah.'}</span>
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
              {isBk
                ? 'Buat lembar observasi sikap dan karakter siswa. Hasil tersimpan sebagai catatan rahasia khusus guru BK.'
                : 'Buat lembar penilaian formatif atau sumatif baru untuk mencatat nilai angka siswa. Nilai tersimpan rahasia khusus guru.'}
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
                  {isBk ? 'Bidang Layanan BK' : 'Mata Pelajaran'}
                </label>
                <select
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                >
                  {isBk ? (
                    <option value={defaultSubjectName || BK_FIELDS[0]}>
                      {defaultSubjectName || BK_FIELDS[0]}
                    </option>
                  ) : (
                    <>
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.name}>
                          {sub.name} ({sub.code})
                        </option>
                      ))}
                      {defaultSubjectName && !subjects.some((s) => s.name === defaultSubjectName) && (
                        <option value={defaultSubjectName}>{defaultSubjectName}</option>
                      )}
                    </>
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
                    {isBk ? 'Jenis Observasi / Layanan' : 'Jenis Penilaian'}
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as AssessmentType)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    {(isBk ? BK_TYPES : [
                      'Formatif Harian',
                      'Sumatif Lingkup Materi',
                      'Sumatif Akhir Semester',
                      'Tugas / Modul Proyek',
                      'Praktik & Unjuk Kerja',
                    ] as AssessmentType[]).map((assessmentType) => (
                      <option key={assessmentType} value={assessmentType}>
                        {isBk ? BK_TYPE_LABELS[assessmentType] : assessmentType}
                      </option>
                    ))}
                  </select>
                </div>

                {!isBk && (
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
                )}
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
                  placeholder={isBk
                    ? 'Indikator sikap, kemandirian, atau perkembangan sosial yang diamati...'
                    : 'Deskripsi kompetensi yang diujikan dalam penilaian ini...'}
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
