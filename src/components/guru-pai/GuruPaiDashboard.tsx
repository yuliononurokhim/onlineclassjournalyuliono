import React, { useState, useEffect } from 'react';
import { useEduStore } from '../../services/store';
import { PaiAssessment, PaiSubIndicator, StarActionType } from '../../types';
import { InternalGradesTab } from '../common/InternalGradesTab';
import { TeacherJournalReportView } from '../common/TeacherJournalReportView';
import {
  Sparkles,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Edit2,
  Star,
  MessageCircle,
  Send,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Calendar,
  Layers,
  Search,
  BookOpen,
  MinusCircle,
  AlertCircle,
  Lock,
  FileText
} from 'lucide-react';

interface GuruPaiDashboardProps {
  currentTab?: string;
  onTabChange?: (tab: string) => void;
}

export const GuruPaiDashboard: React.FC<GuruPaiDashboardProps> = ({ currentTab, onTabChange }) => {
  const {
    students,
    paiAssessments,
    addPaiAssessment,
    updatePaiAssessment,
    deletePaiAssessment,
    updatePaiStudentResult,
    starAwards,
    addStarAward,
    deleteStarAward,
    messages,
    sendMessage,
    currentUser,
  } = useEduStore();

  const [activeTab, setActiveTabState] = useState<'penilaian' | 'nilai_internal' | 'bintang' | 'rekap' | 'chat'>(
    (currentTab as any) || 'penilaian'
  );

  useEffect(() => {
    if (currentTab && ['penilaian', 'nilai_internal', 'bintang', 'rekap', 'chat'].includes(currentTab)) {
      setActiveTabState((prev) => (prev !== currentTab ? (currentTab as any) : prev));
    }
  }, [currentTab]);

  const setActiveTab = (tab: 'penilaian' | 'nilai_internal' | 'bintang' | 'rekap' | 'chat') => {
    setActiveTabState(tab);
    if (onTabChange) onTabChange(tab);
  };

  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(paiAssessments[0]?.id || '');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Flexible Assessment Modal
  const [showNewAssModal, setShowNewAssModal] = useState(false);
  const [assTitle, setAssTitle] = useState('');
  const [assAspect, setAssAspect] = useState('Fiqih Ibadah');
  const [assDate, setAssDate] = useState(new Date().toISOString().split('T')[0]);
  const [dynamicIndicators, setDynamicIndicators] = useState<string[]>([
    'Rukun & Tertib Gerakan',
    'Kefasihan Bacaan & Doa',
    'Kekhusyukan & Kemandirian',
  ]);
  const [newIndicatorInput, setNewIndicatorInput] = useState('');

  // Star Modal
  const [showStarModal, setShowStarModal] = useState(false);
  const [starActionType, setStarActionType] = useState<StarActionType>('reward');
  const [starStudentId, setStarStudentId] = useState(students[0]?.id || '');
  const [starCategory, setStarCategory] = useState('Ibadah & Sholat');
  const [starCount, setStarCount] = useState(3);
  const [starNote, setStarNote] = useState('');

  // Chat
  const [selectedChatStudentId, setSelectedChatStudentId] = useState(students[0]?.id || '');
  const [chatInputText, setChatInputText] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const activeAssessment = paiAssessments.find((a) => a.id === selectedAssessmentId) || paiAssessments[0];

  const handleAddIndicatorField = () => {
    if (!newIndicatorInput.trim()) return;
    setDynamicIndicators([...dynamicIndicators, newIndicatorInput.trim()]);
    setNewIndicatorInput('');
  };

  const handleRemoveIndicatorField = (index: number) => {
    if (dynamicIndicators.length <= 1) return;
    setDynamicIndicators(dynamicIndicators.filter((_, i) => i !== index));
  };

  const handleCreateAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assTitle.trim() || dynamicIndicators.length === 0) return;

    const subIndicators: PaiSubIndicator[] = dynamicIndicators.map((ind, i) => ({
      id: `ind-${Date.now()}-${i}`,
      name: ind,
    }));

    // Initialize clean results for all students
    const initialResults: PaiAssessment['results'] = {};
    students.forEach((st) => {
      initialResults[st.id] = {
        completedIndicators: {},
        notes: '',
        evaluatedAt: assDate,
      };
    });

    addPaiAssessment({
      title: assTitle.trim(),
      aspectCategory: assAspect,
      date: assDate,
      subIndicators,
      results: initialResults,
    });

    setShowNewAssModal(false);
    setAssTitle('');
    setDynamicIndicators(['Rukun & Tertib Gerakan', 'Kefasihan Bacaan & Doa']);
    showToast('Instrumen Penilaian Harian PAI baru berhasil dibuat!');
  };

  const handleToggleChecklist = (studentId: string, indicatorId: string, currentStatus: boolean) => {
    if (!activeAssessment) return;
    updatePaiStudentResult(activeAssessment.id, studentId, indicatorId, !currentStatus);
  };

  const handleSaveStudentNotes = (studentId: string, notes: string) => {
    if (!activeAssessment) return;
    const existing = activeAssessment.results[studentId] || { completedIndicators: {} };
    updatePaiStudentResult(
      activeAssessment.id,
      studentId,
      Object.keys(existing.completedIndicators)[0] || 'ind-default',
      existing.completedIndicators[Object.keys(existing.completedIndicators)[0]] ?? true,
      notes
    );
  };

  const handleSaveStar = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find((s) => s.id === starStudentId);
    if (!st) return;

    addStarAward({
      studentId: st.id,
      studentName: st.name,
      awarderRole: 'guru_pai',
      awarderName: currentUser?.name || 'Ust. Ahmad Fauzan, S.Pd.I.',
      type: starActionType,
      category: starCategory,
      starsCount: starCount,
      note: starNote.trim() || (starActionType === 'penalty' ? 'Konsekuensi atas pelanggaran adab islami dan tata tertib ibadah.' : 'Apresiasi pembiasaan ibadah dan doa harian.'),
      date: new Date().toISOString().split('T')[0],
    });

    setShowStarModal(false);
    setStarNote('');
    if (starActionType === 'penalty') {
      showToast(`Pengurangan -${starCount} Bintang pada ${st.name} (Tersinkron real-time ke orang tua)`);
    } else {
      showToast(`Berhasil memberikan +${starCount} Bintang Ibadah kepada ${st.name}!`);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim() || !selectedChatStudentId) return;

    const targetStudent = students.find((s) => s.id === selectedChatStudentId);
    if (!targetStudent) return;

    sendMessage({
      senderId: currentUser?.id || 'usr-guru-pai',
      senderRole: 'guru_pai',
      senderName: currentUser?.name || 'Ust. Ahmad Fauzan, S.Pd.I.',
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

  const activeStudentChat = messages.filter((m) => m.studentId === selectedChatStudentId);
  const activeChatStudentObj = students.find((s) => s.id === selectedChatStudentId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-teal-200">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">
              RUANG GURU PENDIDIKAN AGAMA ISLAM (PAI) & BUDI PEKERTI
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Penilaian Harian Khusus & Pembiasaan Ibadah
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Format fleksibel: Nama Penilaian · Sub Indikator / Aspek · Ceklist Ketuntasan Siswa & Bintang Ibadah
            </p>
          </div>
        </div>
      </div>

      {/* Tab 1: Matriks Penilaian Harian Khusus Fleksibel */}
      {activeTab === 'penilaian' && (
        <div className="space-y-6">
          {/* Top Control Bar: Assessment Picker & Create New */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-xs font-bold text-slate-700">Pilih Instrumen Penilaian:</span>
              <select
                value={selectedAssessmentId}
                onChange={(e) => setSelectedAssessmentId(e.target.value)}
                className="px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white font-semibold text-slate-900"
              >
                {paiAssessments.map((ass) => (
                  <option key={ass.id} value={ass.id}>
                    [{ass.aspectCategory}] {ass.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNewAssModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Format Penilaian Baru</span>
              </button>
            </div>
          </div>

          {activeAssessment ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
              {/* Assessment Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                      Aspek: {activeAssessment.aspectCategory}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Tanggal: {activeAssessment.date}</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    {activeAssessment.title}
                  </h3>
                </div>

                <button
                  onClick={() => {
                    if (confirm(`Hapus instrumen penilaian "${activeAssessment.title}"?`)) {
                      deletePaiAssessment(activeAssessment.id);
                      showToast('Penilaian dihapus.');
                    }
                  }}
                  className="text-slate-400 hover:text-rose-600 p-1.5 text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Instrumen</span>
                </button>
              </div>

              {/* Sub-Indicators Legend */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  DAFTAR SUB-INDIKATOR PENILAIAN / ASPEK CEKLIST:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {activeAssessment.subIndicators.map((ind, i) => (
                    <div key={ind.id} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                      <span className="font-bold text-teal-700 block mb-0.5">Indikator #{i + 1}:</span>
                      <span className="text-slate-700 leading-snug">{ind.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checklist Ketuntasan Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-semibold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Nama Siswa</th>
                      {activeAssessment.subIndicators.map((ind, idx) => (
                        <th key={ind.id} className="py-3 px-4 text-center">
                          Indikator #{idx + 1}
                        </th>
                      ))}
                      <th className="py-3 px-4 text-center">Status Tuntas</th>
                      <th className="py-3 px-4">Catatan Evaluasi Guru</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((std) => {
                      const studentResult = activeAssessment.results[std.id] || { completedIndicators: {} };
                      const completedCount = activeAssessment.subIndicators.filter(
                        (ind) => studentResult.completedIndicators[ind.id] === true
                      ).length;
                      const isAllDone = completedCount === activeAssessment.subIndicators.length && completedCount > 0;

                      return (
                        <tr key={std.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{std.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">NISN: {std.nisn}</span>
                          </td>

                          {activeAssessment.subIndicators.map((ind) => {
                            const isChecked = studentResult.completedIndicators[ind.id] === true;
                            return (
                              <td key={ind.id} className="py-3 px-4 text-center">
                                <button
                                  onClick={() => handleToggleChecklist(std.id, ind.id, isChecked)}
                                  className={`p-2 rounded-lg transition-all inline-flex items-center justify-center ${
                                    isChecked
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold'
                                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200 border border-slate-200'
                                  }`}
                                  title={isChecked ? 'Tuntas (Klik untuk batal)' : 'Belum Tuntas (Klik untuk checklist)'}
                                >
                                  {isChecked ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                  ) : (
                                    <Square className="w-5 h-5 text-slate-300" />
                                  )}
                                </button>
                              </td>
                            );
                          })}

                          <td className="py-3 px-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              isAllDone
                                ? 'bg-emerald-100 text-emerald-800'
                                : completedCount > 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {isAllDone
                                ? 'TUNTAS SEMPURNA'
                                : `${completedCount}/${activeAssessment.subIndicators.length} TUNTAS`}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <input
                              type="text"
                              defaultValue={studentResult.notes || ''}
                              onBlur={(e) => handleSaveStudentNotes(std.id, e.target.value)}
                              placeholder="Catatan perkembangan ibadah..."
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400 text-xs">
              Belum ada instrumen penilaian. Klik "Buat Format Penilaian Baru" di atas.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Apresiasi & Pengurangan Bintang Ibadah */}
      {activeTab === 'bintang' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>SISTEM BINTANG IBADAH BERKEADILAN</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Apresiasi Ibadah & Penegakan Adab Islami Murid
              </h3>
              <p className="text-xs text-slate-500">
                Memberikan bintang untuk ketertiban ibadah (+), serta pengurangan terukur jika terjadi pelanggaran adab/ketertiban ibadah (-) yang terhubung real-time ke orang tua.
              </p>
            </div>

            <button
              onClick={() => {
                setStarActionType('reward');
                setStarCategory('Ibadah & Sholat');
                setShowStarModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors shadow-sm self-start sm:self-auto"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Input Bintang / Pelanggaran</span>
            </button>
          </div>

          {/* Star Rank and Feed Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Star Tally per Student for PAI */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>Rekap Bintang Ibadah Siswa</span>
                <span className="text-[11px] text-slate-400 font-normal">Guru PAI</span>
              </h4>

              <div className="space-y-3">
                {students.map((std) => {
                  const paiStars = starAwards.filter((s) => s.studentId === std.id && s.awarderRole === 'guru_pai');
                  const rewards = paiStars.filter((s) => s.type !== 'penalty').reduce((sum, item) => sum + item.starsCount, 0);
                  const penalties = paiStars.filter((s) => s.type === 'penalty').reduce((sum, item) => sum + item.starsCount, 0);
                  const netto = Math.max(0, rewards - penalties);

                  return (
                    <div
                      key={std.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-teal-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
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
                        <div className="flex items-center gap-1.5 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
                          <Star className="w-4 h-4 fill-teal-500 text-teal-600" />
                          <span className="font-extrabold text-xs text-teal-950 font-mono tabular-nums">
                            {netto} ★
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
              <h4 className="text-sm font-bold text-slate-900">
                Histori Apresiasi & Pelanggaran Ibadah Terkini
              </h4>

              <div className="space-y-3">
                {starAwards
                  .filter((s) => s.awarderRole === 'guru_pai')
                  .map((st) => {
                    const isPenalty = st.type === 'penalty';
                    return (
                      <div
                        key={st.id}
                        className={`rounded-2xl p-5 border shadow-xs flex items-start justify-between gap-3 ${
                          isPenalty ? 'border-rose-200 bg-rose-50/40' : 'bg-white border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="font-bold text-xs text-slate-900">{st.studentName}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                                isPenalty
                                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                                  : 'bg-teal-50 text-teal-700 border-teal-200'
                              }`}
                            >
                              {isPenalty ? `Pelanggaran: -${st.starsCount} ★` : `Apresiasi: +${st.starsCount} ★`} · {st.category}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 mb-2">
                            {Array.from({ length: st.starsCount }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  isPenalty ? 'fill-rose-500 text-rose-600' : 'fill-amber-400 text-amber-500'
                                }`}
                              />
                            ))}
                          </div>

                          <p
                            className={`text-xs leading-relaxed italic ${
                              isPenalty ? 'text-rose-900 font-medium' : 'text-slate-700'
                            }`}
                          >
                            "{st.note}"
                          </p>
                          <p className="text-[10px] text-slate-400 mt-2 font-mono">{st.date}</p>
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

      {/* Tab 3: Chat Konsultasi PAI */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[520px]">
          <div className="md:col-span-4 border-r border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Wali Murid ({students.length})
            </h4>
            <div className="space-y-1.5 overflow-y-auto max-h-[460px]">
              {students.map((std) => {
                const isSelected = selectedChatStudentId === std.id;
                return (
                  <button
                    key={std.id}
                    onClick={() => setSelectedChatStudentId(std.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-white text-teal-900 font-semibold shadow-xs border border-teal-200'
                        : 'text-slate-700 hover:bg-white hover:text-slate-900'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold leading-tight">{std.name}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{std.parentName}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="md:col-span-8 flex flex-col justify-between p-4 bg-white">
            {activeChatStudentObj ? (
              <>
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Konsultasi Keagamaan: {activeChatStudentObj.parentName}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Siswa: <span className="font-semibold text-teal-700">{activeChatStudentObj.name}</span>
                    </p>
                  </div>
                  <span className="text-[11px] bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded font-semibold">
                    Saluran Diskusi Ibadah & Al-Qur'an
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
                  {activeStudentChat.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-10">
                      <MessageCircle className="w-8 h-8 mb-2 text-slate-300" />
                      <p>Belum ada obrolan dengan wali murid ini.</p>
                      <p className="text-[11px]">Kirim saran pembiasaan sholat atau hafalan untuk anak.</p>
                    </div>
                  ) : (
                    activeStudentChat.map((msg) => {
                      const isMe = msg.senderRole === 'guru_pai';
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
                                ? 'bg-teal-600 text-white rounded-br-xs'
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

                <form onSubmit={handleSendChat} className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInputText}
                    onChange={(e) => setChatInputText(e.target.value)}
                    placeholder={`Kirim pesan pembiasaan PAI untuk ${activeChatStudentObj.parentName}...`}
                    className="flex-1 px-4 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Pilih wali murid di sebelah kiri.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Form Penilaian Internal Guru PAI (Buku Nilai Mata Pelajaran PAI) */}
      {activeTab === 'nilai_internal' && (
        <InternalGradesTab
          teacherRole="guru_pai"
          teacherName={currentUser?.name || 'Ust. Ahmad Fauzan, S.Pd.I.'}
          roleTitle="Guru Pendidikan Agama Islam"
          defaultSubjectName="Pendidikan Agama Islam (PAI)"
        />
      )}

      {/* Tab 5: Rekapitulasi & Unduh Berkas Laporan Jurnal & Penilaian PAI */}
      {activeTab === 'rekap' && (
        <TeacherJournalReportView
          teacherRole="guru_pai"
          teacherName={currentUser?.name || 'Ust. Ahmad Fauzan, S.Pd.I.'}
          reportTitle="Laporan Jurnal & Penilaian Pendidikan Agama Islam"
          reportSubtitle="Rekapitulasi Capaian Fiqih Ibadah, Al-Qur'an Hadits & Pembiasaan Sholat"
        />
      )}

      {/* Modal Format Penilaian Fleksibel Baru */}
      {showNewAssModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Buat Format Penilaian Harian Khusus PAI
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Format fleksibel: Tentukan nama penilaian, aspek bidang, dan tambah sub-indikator ceklist sesuai kebutuhan materi.
            </p>

            <form onSubmit={handleCreateAssessment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  1. Nama Penilaian
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Praktik Sholat Jenazah / Hafalan Surat Pendek"
                  value={assTitle}
                  onChange={(e) => setAssTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    2. Aspek Penilaian
                  </label>
                  <select
                    value={assAspect}
                    onChange={(e) => setAssAspect(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="Fiqih Ibadah">Fiqih Ibadah & Praktik</option>
                    <option value="Al-Qur’an Hadits">Al-Qur’an Hadits & Tartil</option>
                    <option value="Akidah Akhlak">Akidah Akhlak & Budi Pekerti</option>
                    <option value="Sejarah Kebudayaan Islam">Sejarah Kebudayaan Islam (SKI)</option>
                    <option value="Bahasa Arab Dasar">Bahasa Arab Dasar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={assDate}
                    onChange={(e) => setAssDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Dynamic Sub-Indicators List */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    3. Sub-Indikator Ceklist Ketuntasan ({dynamicIndicators.length})
                  </label>
                  <span className="text-[10px] text-slate-500">Fleksibel & Dinamis</span>
                </div>

                <div className="space-y-2">
                  {dynamicIndicators.map((ind, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-teal-700 font-bold w-5">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        value={ind}
                        onChange={(e) => {
                          const updated = [...dynamicIndicators];
                          updated[idx] = e.target.value;
                          setDynamicIndicators(updated);
                        }}
                        required
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                      {dynamicIndicators.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveIndicatorField(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Tambah sub-indikator penilaian baru..."
                    value={newIndicatorInput}
                    onChange={(e) => setNewIndicatorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddIndicatorField();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddIndicatorField}
                    className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewAssModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-sm"
                >
                  Simpan Format & Buka Matriks
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Beri Bintang / Pengurangan Sanksi PAI */}
      {showStarModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {starActionType === 'reward' ? 'Beri Bintang Apresiasi Ibadah' : 'Pengurangan Bintang Pelanggaran Adab'}
                </h3>
                <p className="text-xs text-slate-500">
                  {starActionType === 'reward' ? 'Apresiasi pembiasaan ibadah dan akhlak santun.' : 'Konsekuensi edukatif atas pelanggaran adab islami.'}
                </p>
              </div>
              <span className="text-[10px] bg-teal-50 text-teal-700 font-semibold px-2 py-0.5 rounded border border-teal-200">
                Live ke Ortu
              </span>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl mb-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setStarActionType('reward');
                  setStarCategory('Ibadah & Sholat');
                }}
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  starActionType === 'reward'
                    ? 'bg-teal-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>(+) Apresiasi Ibadah</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setStarActionType('penalty');
                  setStarCategory('Bercanda Saat Sholat Berjamaah');
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
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Siswa</label>
                <select
                  value={starStudentId}
                  onChange={(e) => setStarStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white font-semibold"
                >
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.nisn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {starActionType === 'reward' ? 'Kategori Ibadah & Adab' : 'Jenis Pelanggaran Adab Islami'}
                </label>
                <select
                  value={starCategory}
                  onChange={(e) => setStarCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
                >
                  {starActionType === 'reward' ? (
                    <>
                      <option value="Ibadah & Sholat">Sholat Berjamaah & Tepat Waktu</option>
                      <option value="Tartil Al-Qur'an">Kelancaran & Tartil Membaca Al-Qur'an</option>
                      <option value="Adab & Budi Pekerti">Adab Santun & Doa Harian</option>
                      <option value="Infak & Sedekah">Kepedulian Sosial & Infak Subuh</option>
                      <option value="Hafalan Surat Pendek">Hafalan Surat Pendek Juz 30</option>
                    </>
                  ) : (
                    <>
                      <option value="Bercanda Saat Sholat Berjamaah">Bercanda / Gaduh Saat Sholat Berjamaah</option>
                      <option value="Tidak Membawa Perlengkapan Sholat">Tidak Membawa Perlengkapan Sholat / Mukena</option>
                      <option value="Main Air Saat Wudhu">Bercanda & Bermain Air Saat Berwudhu</option>
                      <option value="Melanggar Adab Islami">Berkata Kasar / Melanggar Adab Islami</option>
                      <option value="Mengabaikan Tugas Mengaji">Mengabaikan Bimbingan Mengaji / Hafalan</option>
                    </>
                  )}
                </select>
              </div>

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
                            ? 'bg-teal-100 text-teal-900 border border-teal-300 shadow-2xs'
                            : 'bg-rose-100 text-rose-900 border border-rose-300 shadow-2xs'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          starCount >= num
                            ? starActionType === 'reward'
                              ? 'fill-teal-500 text-teal-600'
                              : 'fill-rose-500 text-rose-600'
                            : 'text-slate-300'
                        }`}
                      />
                      <span>{starActionType === 'penalty' ? `-${num}` : `+${num}`}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {starActionType === 'reward' ? 'Catatan Apresiasi Guru PAI' : 'Alasan Sanksi & Nasihat untuk Orang Tua'}
                </label>
                <textarea
                  rows={2}
                  value={starNote}
                  onChange={(e) => setStarNote(e.target.value)}
                  placeholder={
                    starActionType === 'reward'
                      ? 'Contoh: Sangat khusyuk saat sholat dhuha dan melafalkan doa dengan tartil...'
                      : 'Contoh: Bercanda mendorong teman saat baris sholat berjamaah di musholla...'
                  }
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
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
                      ? 'bg-teal-600 hover:bg-teal-700 text-white'
                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                >
                  {starActionType === 'reward' ? 'Kirimkan Apresiasi Ibadah' : 'Terapkan Pengurangan Sanksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
