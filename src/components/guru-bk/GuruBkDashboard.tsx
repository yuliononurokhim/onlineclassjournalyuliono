import React, { useState, useEffect } from 'react';
import { useEduStore } from '../../services/store';
import { CaseRecord, StarActionType } from '../../types';
import { InternalGradesTab } from '../common/InternalGradesTab';
import { TeacherJournalReportView } from '../common/TeacherJournalReportView';
import { StarAwardBatchFields } from '../common/StarAwardBatchFields';
import {
  HeartHandshake,
  AlertCircle,
  Sparkles,
  MessageCircle,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Star,
  Search,
  UserCheck,
  MinusCircle,
  AlertTriangle,
  Lock,
  FileText
} from 'lucide-react';

interface GuruBkDashboardProps {
  currentTab?: string;
  onTabChange?: (tab: string) => void;
}

export const GuruBkDashboard: React.FC<GuruBkDashboardProps> = ({ currentTab, onTabChange }) => {
  const {
    students,
    caseRecords,
    addCaseRecord,
    updateCaseRecord,
    deleteCaseRecord,
    starAwards,
    addStarAward,
    deleteStarAward,
    messages,
    sendMessage,
    currentUser,
  } = useEduStore();

  const [activeTab, setActiveTabState] = useState<'kasus' | 'bintang' | 'penilaian' | 'rekap' | 'chat'>(
    (currentTab as any) || 'kasus'
  );

  useEffect(() => {
    if (currentTab && ['kasus', 'bintang', 'penilaian', 'rekap', 'chat'].includes(currentTab)) {
      setActiveTabState((prev) => (prev !== currentTab ? (currentTab as any) : prev));
    }
  }, [currentTab]);

  const setActiveTab = (tab: 'kasus' | 'bintang' | 'penilaian' | 'rekap' | 'chat') => {
    setActiveTabState(tab);
    if (onTabChange) onTabChange(tab);
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Case Form
  const [showAddCaseModal, setShowAddCaseModal] = useState(false);
  const [caseStudentId, setCaseStudentId] = useState(students[0]?.id || '');
  const [caseDate, setCaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [caseCategory, setCaseCategory] = useState<CaseRecord['category']>('Perlu Perhatian');
  const [caseSeverity, setCaseSeverity] = useState<CaseRecord['severity']>('Ringan');
  const [caseDescription, setCaseDescription] = useState('');
  const [caseFollowUp, setCaseFollowUp] = useState('');
  const [caseIsReported, setCaseIsReported] = useState(true); // Default true for realtime parent report!
  const [caseStatus, setCaseStatus] = useState<CaseRecord['status']>('Dalam Bimbingan/Pendampingan');

  // Star Modal (Apresiasi & Pengurangan Sanksi BK)
  const [showStarModal, setShowStarModal] = useState(false);
  const [starActionType, setStarActionType] = useState<StarActionType>('reward');
  const [starStudentIds, setStarStudentIds] = useState<string[]>(students[0] ? [students[0].id] : []);
  const [starCategory, setStarCategory] = useState('Empati & Kejujuran');
  const [newStarCategory, setNewStarCategory] = useState('');
  const [customStarCategories, setCustomStarCategories] = useState<Record<StarActionType, string[]>>({
    reward: [],
    penalty: [],
  });
  const [starCount, setStarCount] = useState(3);
  const [starNote, setStarNote] = useState('');

  // Chat
  const [selectedChatStudentId, setSelectedChatStudentId] = useState(students[0]?.id || '');
  const [chatInputText, setChatInputText] = useState('');

  // Filter
  const [filterStudentId, setFilterStudentId] = useState('all');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const baseStarCategories = starActionType === 'reward'
    ? ['Empati & Kejujuran', 'Kesantunan & Sikap Hormat', 'Tanggung Jawab', 'Penyelesaian Masalah Positif']
    : ['Perilaku Tidak Santun / Membantah', 'Mengejek / Intimidasi Teman', 'Berbohong / Tidak Jujur', 'Pertengkaran / Tindakan Agresif', 'Pelanggaran Tata Tertib Berat'];
  const starCategoryOptions = Array.from(new Set([
    ...baseStarCategories,
    ...starAwards
      .filter((award) => award.awarderRole === 'guru_bk' && award.type === starActionType)
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

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find((s) => s.id === caseStudentId);
    if (!st || !caseDescription.trim()) return;

    addCaseRecord({
      studentId: st.id,
      studentName: st.name,
      date: caseDate,
      category: caseCategory,
      severity: caseSeverity,
      description: caseDescription.trim(),
      followUpAction: caseFollowUp.trim() || 'Pemantauan berkala dan pendampingan di kelas.',
      isReportedToParent: caseIsReported,
      status: caseStatus,
      counselorName: currentUser?.name || 'Ibu Dian Permatasari, M.Psi.',
    });

    setShowAddCaseModal(false);
    setCaseDescription('');
    setCaseFollowUp('');
    showToast(`Catatan kasus untuk ${st.name} berhasil disimpan ${caseIsReported ? 'dan dilaporkan real-time ke orang tua' : '(internal BK)'}!`);
  };

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
      awarderRole: 'guru_bk',
      awarderName: currentUser?.name || 'Ibu Dian Permatasari, M.Psi.',
      type: starActionType,
      category: starCategory,
      starsCount: starCount,
      note: starNote.trim() || (starActionType === 'penalty' ? 'Konsekuensi BK atas pelanggaran perilaku/sikap.' : 'Apresiasi perilaku empati dan budi pekerti luhur.'),
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
      showToast(`Berhasil memberikan ${totalStars} bintang karakter kepada ${selectedStudents.length} siswa.`);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim() || !selectedChatStudentId) return;

    const targetStudent = students.find((s) => s.id === selectedChatStudentId);
    if (!targetStudent) return;

    sendMessage({
      senderId: currentUser?.id || 'usr-guru-bk',
      senderRole: 'guru_bk',
      senderName: currentUser?.name || 'Ibu Dian Permatasari, M.Psi.',
      recipientId: `usr-parent-${targetStudent.id}`,
      recipientRole: 'orangtua',
      recipientName: `${targetStudent.parentName} (Wali)`,
      studentId: targetStudent.id,
      studentName: targetStudent.name,
      content: chatInputText.trim(),
    });

    setChatInputText('');
    showToast('Pesan konseling terkirim ke wali murid.');
  };

  const filteredCases = caseRecords.filter((c) => {
    if (filterStudentId === 'all') return true;
    return c.studentId === filterStudentId;
  });

  const activeStudentChat = messages.filter((m) => m.studentId === selectedChatStudentId);
  const activeChatStudentObj = students.find((s) => s.id === selectedChatStudentId);

  return (
    <div className="dashboard-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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
          <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-md shadow-rose-200">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
              RUANG BIMBINGAN KONSELING & PENDAMPINGAN KARAKTER
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Jurnal Kasus Siswa & Pemantauan Real-Time
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Catat perkembangan perilaku, solusi tindak lanjut, pelaporan langsung ke wali murid, dan bintang empati
            </p>
          </div>
        </div>
      </div>

      {/* Tab 1: Catatan Kasus & Real-time Pelaporan ke Ortu */}
      {activeTab === 'kasus' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700">Filter Siswa:</span>
              <select
                value={filterStudentId}
                onChange={(e) => setFilterStudentId(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white font-medium"
              >
                <option value="all">Semua Siswa ({students.length})</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowAddCaseModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Kasus / Konseling Baru</span>
            </button>
          </div>

          {/* Cases Feed */}
          <div className="space-y-4">
            {filteredCases.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400 text-xs">
                Belum ada catatan kasus untuk filter siswa yang dipilih.
              </div>
            ) : (
              filteredCases.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4 hover:border-rose-200 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 font-bold flex items-center justify-center text-sm">
                        {rec.studentName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {rec.studentName}
                        </h4>
                        <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Tanggal: {rec.date} · Konselor: {rec.counselorName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Real-time parent report indicator badge */}
                      {rec.isReportedToParent ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Dilaporkan ke Ortu (Realtime)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                          <span>Catatan Internal BK</span>
                        </span>
                      )}

                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        rec.status === 'Selesai'
                          ? 'bg-blue-50 text-blue-800'
                          : 'bg-amber-50 text-amber-800'
                      }`}>
                        {rec.status === 'Dalam Pantauan' ? 'Dalam Bimbingan/Pendampingan' : rec.status}
                      </span>

                      <button
                        onClick={() => {
                          if (confirm('Hapus catatan kasus ini?')) {
                            deleteCaseRecord(rec.id);
                            showToast('Catatan kasus dihapus.');
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1.5"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block mb-1">
                        KONDISI / KASUS YANG TERJADI:
                      </span>
                      <p className="text-xs text-slate-800 leading-relaxed font-medium">
                        {rec.description}
                      </p>
                    </div>

                    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                        TINDAK LANJUT & BIMBINGAN KONSELING:
                      </span>
                      <p className="text-xs text-slate-800 leading-relaxed">
                        {rec.followUpAction}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <button
                      onClick={() => {
                        updateCaseRecord(rec.id, { isReportedToParent: !rec.isReportedToParent });
                        showToast(`Status laporan ke orang tua diubah menjadi: ${!rec.isReportedToParent ? 'Tampil' : 'Sembunyi'}`);
                      }}
                      className="text-slate-500 hover:text-slate-800 text-[11px] font-semibold underline"
                    >
                      {rec.isReportedToParent ? 'Sembunyikan dari dashboard orang tua' : 'Tampilkan di dashboard orang tua sekarang'}
                    </button>

                    <button
                      onClick={() => {
                        const isOngoing = rec.status === 'Dalam Pantauan' || rec.status === 'Dalam Bimbingan/Pendampingan';
                        const nextStatus: CaseRecord['status'] = isOngoing ? 'Selesai' : 'Dalam Bimbingan/Pendampingan';
                        updateCaseRecord(rec.id, { status: nextStatus });
                        showToast(`Status kasus diperbarui: ${nextStatus}`);
                      }}
                      className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
                    >
                      Ubah Status ({rec.status === 'Dalam Pantauan' || rec.status === 'Dalam Bimbingan/Pendampingan' ? 'Tandai Selesai' : 'Tandai Dalam Bimbingan/Pendampingan'})
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Apresiasi Bintang Karakter */}
      {activeTab === 'bintang' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Pemberian Bintang Karakter oleh Guru BK
              </h3>
              <p className="text-xs text-slate-500">
                Apresiasi untuk perubahan perilaku positif, kejujuran, empati, dan resolusi konflik mandiri siswa.
              </p>
            </div>

            <button
              onClick={() => setShowStarModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-colors shadow-sm self-start sm:self-auto"
            >
              <Sparkles className="w-4 h-4" />
              <span>Beri Bintang Karakter</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {starAwards
              .filter((s) => s.awarderRole === 'guru_bk')
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
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                          isPenalty
                            ? 'bg-rose-100 text-rose-800 border-rose-200'
                            : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
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

                      <p className={`text-xs leading-relaxed italic ${isPenalty ? 'text-rose-900 font-medium' : 'text-slate-700'}`}>
                        "{st.note}"
                      </p>
                      <p className="text-[10px] text-slate-400 mt-2 font-mono">{st.date}</p>
                    </div>

                    <button
                      onClick={() => {
                        deleteStarAward(st.id);
                        showToast('Bintang dihapus.');
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
      )}

      {/* Tab 3: Chat Konseling Privat */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[520px]">
          <div className="md:col-span-4 border-r border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Wali Murid Konseling ({students.length})
            </h4>
            <div className="space-y-1.5 overflow-y-auto max-h-[460px]">
              {students.map((std) => {
                const isSelected = selectedChatStudentId === std.id;
                const hasCase = caseRecords.some((c) => c.studentId === std.id);

                return (
                  <button
                    key={std.id}
                    onClick={() => setSelectedChatStudentId(std.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-white text-rose-900 font-semibold shadow-xs border border-rose-200'
                        : 'text-slate-700 hover:bg-white hover:text-slate-900'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold leading-tight">{std.name}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{std.parentName}</p>
                    </div>
                    {hasCase && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                        Ada Kasus
                      </span>
                    )}
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
                      Sesi Konseling: {activeChatStudentObj.parentName}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Siswa: <span className="font-semibold text-rose-700">{activeChatStudentObj.name}</span>
                    </p>
                  </div>
                  <span className="text-[11px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded font-semibold">
                    Kerahasiaan Terjaga (Kode Etik BK)
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
                  {activeStudentChat.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-10">
                      <MessageCircle className="w-8 h-8 mb-2 text-slate-300" />
                      <p>Belum ada riwayat obrolan dengan wali murid ini.</p>
                      <p className="text-[11px]">Kirim pesan untuk koordinasi pendampingan putra/putri beliau.</p>
                    </div>
                  ) : (
                    activeStudentChat.map((msg) => {
                      const isMe = msg.senderRole === 'guru_bk';
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
                                ? 'bg-rose-600 text-white rounded-br-xs'
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
                    placeholder={`Tulis pesan pendampingan untuk ${activeChatStudentObj.parentName}...`}
                    className="flex-1 px-4 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Pilih wali murid di panel kiri.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Form Penilaian Internal Guru BK (Asesmen Sikap, Non-Kognitif & Karakter) */}
      {activeTab === 'penilaian' && (
        <InternalGradesTab
          teacherRole="guru_bk"
          teacherName={currentUser?.name || 'Ibu Dian Permatasari, M.Psi.'}
          roleTitle="Guru Bimbingan Konseling"
          defaultSubjectName="Bimbingan Konseling (BK)"
        />
      )}

      {/* Tab 5: Rekapitulasi & Unduh Berkas Laporan Layanan BK */}
      {activeTab === 'rekap' && (
        <TeacherJournalReportView
          teacherRole="guru_bk"
          teacherName={currentUser?.name || 'Ibu Dian Permatasari, M.Psi.'}
          reportTitle="Laporan Layanan Bimbingan Konseling & Kasus Siswa"
          reportSubtitle="Rekapitulasi Layanan BK, Pemantauan Siswa & Riwayat Konseling"
        />
      )}

      {/* Modal Tambah Kasus BK */}
      {showAddCaseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Catat Kasus & Bimbingan Baru</h3>
            <p className="text-xs text-slate-500 mb-4">
              Laporan dapat disetel untuk langsung tampil secara real-time di dashboard orang tua siswa.
            </p>

            <form onSubmit={handleCreateCase} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Siswa</label>
                  <select
                    value={caseStudentId}
                    onChange={(e) => setCaseStudentId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white font-semibold"
                  >
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.nisn})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Kejadian</label>
                  <input
                    type="date"
                    value={caseDate}
                    onChange={(e) => setCaseDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Kondisi</label>
                  <select
                    value={caseCategory}
                    onChange={(e) => setCaseCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white"
                  >
                    <option value="Perlu Perhatian">Perlu Perhatian</option>
                    <option value="Pelanggaran Ringan">Pelanggaran Ringan</option>
                    <option value="Konseling Individu">Konseling Individu</option>
                    <option value="Apresiasi Karakter Positif">Apresiasi Karakter Positif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status Penanganan</label>
                  <select
                    value={caseStatus}
                    onChange={(e) => setCaseStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="Dalam Bimbingan/Pendampingan">Dalam Bimbingan/Pendampingan</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Jadwal Pertemuan Orang Tua">Jadwal Pertemuan Orang Tua</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Uraian Kejadian / Kondisi Siswa
                </label>
                <textarea
                  rows={3}
                  value={caseDescription}
                  onChange={(e) => setCaseDescription(e.target.value)}
                  placeholder="Deskripsikan fakta kejadian, observasi perilaku, atau hasil wawancara konseling..."
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tindak Lanjut & Arahan untuk Orang Tua
                </label>
                <textarea
                  rows={2}
                  value={caseFollowUp}
                  onChange={(e) => setCaseFollowUp(e.target.value)}
                  placeholder="Solusi bimbingan, komitmen siswa, atau saran pendampingan di rumah..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              {/* CRITICAL REALTIME TOGGLE */}
              <div className="bg-rose-50/80 p-3.5 rounded-xl border border-rose-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-rose-950">
                    Laporkan Real-Time ke Dashboard Orang Tua?
                  </p>
                  <p className="text-[11px] text-rose-700">
                    Jika aktif, catatan ini akan langsung dapat dibaca oleh wali murid bersangkutan saat login.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={caseIsReported}
                  onChange={(e) => setCaseIsReported(e.target.checked)}
                  className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddCaseModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm"
                >
                  Simpan Catatan Kasus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Beri Apresiasi / Pengurangan Bintang Karakter BK */}
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
                  {starActionType === 'reward' ? 'Apresiasi Karakter BK (+)' : 'Pengurangan Sanksi Sikap BK (-)'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Laporan tercatat dan tersinkronisasi langsung ke dashboard orang tua
                </p>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl mb-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setStarActionType('reward');
                  setStarCategory('Empati & Kejujuran');
                }}
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  starActionType === 'reward'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>(+) Apresiasi Karakter</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setStarActionType('penalty');
                  setStarCategory('Perilaku Tidak Santun / Membantah');
                }}
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  starActionType === 'penalty'
                    ? 'bg-rose-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MinusCircle className="w-3.5 h-3.5" />
                <span>(-) Sanksi Pelanggaran</span>
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
                categoryLabel={starActionType === 'reward' ? 'Kategori Budi Pekerti' : 'Jenis Pelanggaran Sikap'}
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
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-rose-100 text-rose-900 border border-rose-300'
                          : 'bg-slate-100 text-slate-400'
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
                  {starActionType === 'reward' ? 'Catatan Konselor' : 'Alasan Sanksi & Arahan untuk Orang Tua'}
                </label>
                <textarea
                  rows={2}
                  value={starNote}
                  onChange={(e) => setStarNote(e.target.value)}
                  placeholder={
                    starActionType === 'reward'
                      ? 'Catatan apresiasi sikap baik siswa...'
                      : 'Catatan bimbingan khusus terkait sikap negatif siswa...'
                  }
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none"
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
                  {starActionType === 'reward' ? 'Kirim Apresiasi Bintang' : 'Terapkan Pengurangan Sanksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
