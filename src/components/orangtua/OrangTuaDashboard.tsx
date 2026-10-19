import React, { useState, useEffect, useMemo } from 'react';
import { useEduStore } from '../../services/store';
import { UserAccount, UserRole } from '../../types';
import { getLinkedStudentsForParent } from '../../services/relationships';
import {
  Star,
  Sparkles,
  BookOpen,
  HeartHandshake,
  CheckCircle2,
  Clock,
  MessageCircle,
  Send,
  User,
  Shield,
  AlertCircle,
  CheckSquare,
  School,
  XCircle,
  Phone,
  Mail,
  UserCheck,
  MinusCircle,
  TrendingDown,
  TrendingUp,
  Info
} from 'lucide-react';

interface OrangTuaDashboardProps {
  currentTab?: string;
  onTabChange?: (tab: string) => void;
}

export const OrangTuaDashboard: React.FC<OrangTuaDashboardProps> = ({ currentTab, onTabChange }) => {
  const {
    schoolProfile,
    currentUser,
    students,
    users,
    journalEntries,
    starAwards,
    caseRecords,
    paiAssessments,
    messages,
    sendMessage,
    markMessagesAsRead,
  } = useEduStore();

  const [activeTab, setActiveTabState] = useState<'bintang' | 'jurnal' | 'bk' | 'pai' | 'chat'>((currentTab as any) || 'bintang');

  useEffect(() => {
    if (currentTab && ['bintang', 'jurnal', 'bk', 'pai', 'chat'].includes(currentTab)) {
      setActiveTabState((prev) => (prev !== currentTab ? (currentTab as any) : prev));
    }
  }, [currentTab]);

  const setActiveTab = (tab: 'bintang' | 'jurnal' | 'bk' | 'pai' | 'chat') => {
    setActiveTabState(tab);
    if (onTabChange) onTabChange(tab);
  };

  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [chatInputText, setChatInputText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [starFilter, setStarFilter] = useState<'all' | 'reward' | 'penalty'>('all');

  const linkedStudents = useMemo(
    () => getLinkedStudentsForParent(currentUser, students),
    [students, currentUser]
  );
  const resolvedLinkedStudent = linkedStudents[0] || null;

  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    try {
      if (currentUser?.id) {
        return localStorage.getItem(`edujournal_parent_student_${currentUser.id}`) || '';
      }
    } catch {
      // fallback
    }
    return '';
  });

  const handleSelectStudent = (newId: string) => {
    if (!linkedStudents.some((linkedStudent) => linkedStudent.id === newId)) return;
    setSelectedStudentId(newId);
    try {
      if (currentUser?.id) {
        localStorage.setItem(`edujournal_parent_student_${currentUser.id}`, newId);
      }
    } catch {
      // ignore
    }
    const found = students.find((s) => s.id === newId);
    if (found) {
      showToast(`Beralih ke pemantauan putra/putri: ${found.name}`);
    }
  };

  // Active student for this parent portal
  const student =
    linkedStudents.find((linkedStudent) => linkedStudent.id === selectedStudentId) ||
    resolvedLinkedStudent;

  // Filter ONLY this student's data!
  const myStars = starAwards.filter((s) => s.studentId === student?.id);
  const myRewards = myStars.filter((s) => s.type !== 'penalty');
  const myPenalties = myStars.filter((s) => s.type === 'penalty');

  const totalRewards = myRewards.reduce((sum, item) => sum + item.starsCount, 0);
  const totalPenalties = myPenalties.reduce((sum, item) => sum + item.starsCount, 0);
  const netStars = Math.max(0, totalRewards - totalPenalties);

  const getTeacherStats = (role: 'guru_kelas' | 'guru_bk' | 'guru_pai') => {
    const rewards = myStars.filter((s) => s.awarderRole === role && s.type !== 'penalty').reduce((sum, item) => sum + item.starsCount, 0);
    const penalties = myStars.filter((s) => s.awarderRole === role && s.type === 'penalty').reduce((sum, item) => sum + item.starsCount, 0);
    const net = Math.max(0, rewards - penalties);
    return { rewards, penalties, net };
  };

  const gkStats = getTeacherStats('guru_kelas');
  const bkStats = getTeacherStats('guru_bk');
  const paiStats = getTeacherStats('guru_pai');

  // ONLY reported BK cases for this child
  const myReportedCases = caseRecords.filter(
    (c) => c.studentId === student?.id && c.isReportedToParent === true
  );

  const teacherMetadata = {
    guru_kelas: {
      title: 'Guru Kelas',
      desc: 'Konsultasi kegiatan belajar harian, tugas, dan presensi.',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    guru_bk: {
      title: 'Guru Bimbingan Konseling (BK)',
      desc: 'Konsultasi pendampingan emosi, perilaku, dan perkembangan anak.',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    guru_pai: {
      title: 'Guru PAI & Budi Pekerti',
      desc: 'Konsultasi ibadah, akhlak, dan pembelajaran agama.',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    },
  } as const;

  const teachers = users
    .filter(
      (user): user is UserAccount & { role: keyof typeof teacherMetadata } =>
        user.role in teacherMetadata && user.status !== 'nonaktif'
    )
    .map((user) => ({
      ...user,
      title: user.title.trim() || teacherMetadata[user.role].title,
      desc: user.subjectAssignment?.trim() || teacherMetadata[user.role].desc,
      avatar: user.name.trim().charAt(0).toUpperCase() || '?',
      badgeColor: teacherMetadata[user.role].badgeColor,
    }));
  const currentTeacherObj =
    teachers.find((teacher) => teacher.id === selectedTeacherId) || teachers[0] || null;

  useEffect(() => {
    if (activeTab === 'chat' && student && currentUser && currentTeacherObj) {
        markMessagesAsRead(student.id, currentUser.id, currentTeacherObj.id);
    }
  }, [activeTab, student?.id, currentUser?.id, currentTeacherObj?.id, markMessagesAsRead]);

  // Chat filter: messages concerning this student and this teacher
  const currentChatMessages = messages.filter(
    (m) =>
      m.studentId === student?.id &&
      currentUser !== null &&
      currentTeacherObj !== null &&
      ((m.senderId === currentUser.id && m.recipientId === currentTeacherObj.id) ||
        (m.senderId === currentTeacherObj.id && m.recipientId === currentUser.id))
  );

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim() || !student || !currentUser || !currentTeacherObj) return;

    sendMessage({
      senderId: currentUser.id,
      senderRole: 'orangtua',
      senderName: currentUser.name,
      recipientId: currentTeacherObj.id,
      recipientRole: currentTeacherObj.role,
      recipientName: currentTeacherObj.name,
      studentId: student.id,
      studentName: student.name,
      content: chatInputText.trim(),
    });

    setChatInputText('');
    showToast(`Pesan terkirim secara aman ke ${currentTeacherObj.name}.`);
  };

  const handleQuickTemplate = (text: string) => {
    setChatInputText(text);
  };

  if (!student) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-slate-500">
        Akun orang tua ini belum ditautkan ke data siswa. Hubungi administrator sekolah.
      </div>
    );
  }

  return (
    <div className="dashboard-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Child Identity & Star Honor Strip Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Child Identity */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-amber-300">
                  DASHBOARD ORANG TUA SISWA
                </span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full text-indigo-100 font-mono">
                  NISN: {student.nisn}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight mt-0.5">
                {student.name}
              </h2>
              <p className="text-xs text-indigo-200 mt-1">
                {schoolProfile.name} · {schoolProfile.classGrade} · Wali: {student.parentName}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-white/10">
                <span className="text-[11px] text-amber-200 font-medium">Beralih Profil Anak:</span>
                <select
                  value={student.id}
                  onChange={(e) => handleSelectStudent(e.target.value)}
                  className="bg-white/10 hover:bg-white/15 text-white text-xs font-semibold px-2.5 py-1 rounded-lg border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors cursor-pointer"
                >
                  {linkedStudents.map((s) => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                      {s.name} ({s.nisn}) — Wali: {s.parentName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Star Honor Box */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
            <div className="text-center sm:text-left pr-4 sm:border-r sm:border-white/15">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="text-[10px] uppercase tracking-wider font-bold text-amber-300">
                  TOTAL BINTANG BERSIH
                </span>
                <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Sync
                </span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2.5 mt-0.5">
                <Star className="w-8 h-8 fill-amber-400 text-amber-300" />
                <span className="text-3xl sm:text-4xl font-black text-white font-mono tabular-nums">
                  {netStars}
                </span>
                <span className="text-xs text-amber-200 font-semibold self-end pb-1">Bintang</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-1 text-[11px] font-mono font-semibold">
                <span className="text-emerald-300 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  +{totalRewards} Apresiasi
                </span>
                <span className="text-rose-300 bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-500/30">
                  -{totalPenalties} Sanksi
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
              <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                <span className="text-[10px] text-indigo-200 block font-medium">Guru Kelas</span>
                <span className="font-bold text-white font-mono tabular-nums block text-sm mt-0.5">
                  {gkStats.net} ★
                </span>
                <span className="text-[10px] text-indigo-300 font-mono">
                  +{gkStats.rewards} / -{gkStats.penalties}
                </span>
              </div>
              <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                <span className="text-[10px] text-rose-200 block font-medium">Guru BK</span>
                <span className="font-bold text-white font-mono tabular-nums block text-sm mt-0.5">
                  {bkStats.net} ★
                </span>
                <span className="text-[10px] text-rose-300 font-mono">
                  +{bkStats.rewards} / -{bkStats.penalties}
                </span>
              </div>
              <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                <span className="text-[10px] text-teal-200 block font-medium">Guru PAI</span>
                <span className="font-bold text-white font-mono tabular-nums block text-sm mt-0.5">
                  {paiStats.net} ★
                </span>
                <span className="text-[10px] text-teal-300 font-mono">
                  +{paiStats.rewards} / -{paiStats.penalties}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Tab 1: Apresiasi & Pengurangan Bintang Murid */}
      {activeTab === 'bintang' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>SISTEM EVALUASI PERILAKU & PRESTASI ADIL</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Rekapitulasi Bintang Karakter, Prestasi & Penegakan Disiplin
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bintang diberikan oleh Guru Kelas, Guru BK, dan Guru PAI sebagai bentuk apresiasi prestasi (+), serta pengurangan edukatif (-) jika terdapat pelanggaran tata tertib agar anak belajar bertanggung jawab.
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto shrink-0">
                <button
                  onClick={() => setStarFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    starFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({myStars.length})
                </button>
                <button
                  onClick={() => setStarFilter('reward')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                    starFilter === 'reward'
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Apresiasi (+{totalRewards})</span>
                </button>
                <button
                  onClick={() => setStarFilter('penalty')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                    starFilter === 'penalty'
                      ? 'bg-rose-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-rose-700'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Pelanggaran (-{totalPenalties})</span>
                </button>
              </div>
            </div>

            {/* Filtered Stars Grid */}
            {(() => {
              const filteredList = myStars.filter((s) => {
                if (starFilter === 'reward') return s.type !== 'penalty';
                if (starFilter === 'penalty') return s.type === 'penalty';
                return true;
              });

              if (filteredList.length === 0) {
                return (
                  <div className="text-center py-12 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    Tidak ada catatan bintang pada kategori yang dipilih.
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredList.map((st) => {
                    const isPenalty = st.type === 'penalty';
                    return (
                      <div
                        key={st.id}
                        className={`p-5 rounded-2xl border transition-all space-y-3 ${
                          isPenalty
                            ? 'border-rose-200 bg-rose-50/40 hover:border-rose-300'
                            : 'border-slate-200 bg-amber-50/20 hover:border-amber-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                              isPenalty
                                ? 'bg-rose-100 text-rose-800 border-rose-200'
                                : 'bg-amber-100 text-amber-900 border border-amber-200'
                            }`}
                          >
                            {isPenalty ? `Pelanggaran: -${st.starsCount} ★` : `Apresiasi: +${st.starsCount} ★`} · {st.category}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">{st.date}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {Array.from({ length: st.starsCount }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                isPenalty ? 'fill-rose-500 text-rose-600' : 'fill-amber-400 text-amber-500'
                              }`}
                            />
                          ))}
                          <span
                            className={`font-extrabold text-sm font-mono ml-1 ${
                              isPenalty ? 'text-rose-800' : 'text-amber-950'
                            }`}
                          >
                            {isPenalty ? `-${st.starsCount} Bintang Dikurangkan` : `+${st.starsCount} Bintang Ditambahkan`}
                          </span>
                        </div>

                        <p
                          className={`text-xs leading-relaxed italic p-3 rounded-xl border ${
                            isPenalty
                              ? 'bg-white border-rose-100 text-rose-950 font-medium'
                              : 'bg-white border-slate-100 text-slate-700'
                          }`}
                        >
                          "{st.note}"
                        </p>

                        {isPenalty && (
                          <div className="bg-rose-100/70 p-2.5 rounded-xl border border-rose-200/80 text-[11px] text-rose-900 flex items-start gap-2">
                            <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <span>
                              <strong>Catatan Pembinaan Rumah:</strong> Pengurangan bintang ini bertujuan mendidik kedisiplinan dan tanggung jawab ananda. Mohon dampingi dan beri arahan dengan kasih sayang di rumah.
                            </span>
                          </div>
                        )}

                        <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100/60">
                          <span>
                            Diberikan oleh: <strong className="text-slate-800">{st.awarderName}</strong>
                          </span>
                          <span className="capitalize text-slate-400">
                            ({st.awarderRole.replace('_', ' ')})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Tab 2: Jurnal Harian Kelas */}
      {activeTab === 'jurnal' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Jurnal Pembelajaran Kelas {schoolProfile.classGrade}
              </h3>
              <p className="text-xs text-slate-500">
                Informasi materi yang diajarkan, kegiatan praktikum, serta instruksi belajar harian dari guru kelas.
              </p>
            </div>

            <div className="space-y-4">
              {journalEntries.map((j) => (
                <div
                  key={j.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                        {j.subjectName}
                      </span>
                      <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {j.timeSlot}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">{j.date}</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      TUJUAN PEMBELAJARAN (TP):
                    </span>
                    <p className="text-xs font-semibold text-slate-900 leading-snug">
                      {j.tpDescription}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      KEGIATAN SISWA DI KELAS:
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {j.activityDescription}
                    </p>
                  </div>

                  {j.notes && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs">
                      <strong className="block mb-0.5">Catatan Khusus Wali Kelas:</strong>
                      <span>{j.notes}</span>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                    <span>Guru Pengampu: {j.teacherName}</span>
                    <span className="text-emerald-700 font-semibold">Kehadiran Kelas: {j.attendancePresent} Murid Hadir</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Laporan Khusus BK (Realtime) */}
      {activeTab === 'bk' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Laporan Khusus & Catatan Bimbingan Konseling (BK)
                </h3>
                <p className="text-xs text-slate-500">
                  Catatan pendampingan karakter yang dikirimkan secara real-time oleh Guru BK khusus untuk orang tua {student.name}.
                </p>
              </div>
            </div>

            {myReportedCases.length === 0 ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center text-emerald-800 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                <p className="font-bold text-sm">Alhamdulillah, Tidak Ada Kasus Pelanggaran</p>
                <p className="mt-1 text-emerald-700">
                  Perkembangan perilaku ananda terpantau kondusif dan tertib di lingkungan sekolah.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {myReportedCases.map((cs) => (
                  <div
                    key={cs.id}
                    className="p-5 rounded-2xl border border-rose-200 bg-rose-50/20 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                          {cs.category === 'Konseling Khusus' ? 'Konseling Individu' : cs.category}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">Tanggal: {cs.date}</span>
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-white">
                        Status: {cs.status === 'Dalam Pantauan' ? 'Dalam Bimbingan/Pendampingan' : cs.status}
                      </span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-rose-800 uppercase block">
                        URAIAN CATATAN GURU BK:
                      </span>
                      <p className="text-xs text-slate-800 leading-relaxed font-medium">
                        {cs.description}
                      </p>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                        SARAN TINDAK LANJUT BERSAMA ORANG TUA:
                      </span>
                      <p className="text-xs text-slate-800 leading-relaxed">
                        {cs.followUpAction}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Konselor: <strong>{cs.counselorName}</strong></span>
                      <button
                        onClick={() => {
                          const bkTeacher = teachers.find((teacher) => teacher.role === 'guru_bk');
                          if (bkTeacher) setSelectedTeacherId(bkTeacher.id);
                          setActiveTab('chat');
                          setChatInputText(
                            `Selamat siang${bkTeacher ? ` ${bkTeacher.name.split(',')[0]}` : ''}, menanggapi catatan bimbingan tanggal ${cs.date}...`
                          );
                        }}
                        className="text-rose-700 hover:text-rose-900 font-semibold underline flex items-center gap-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Diskusikan di Chat dengan Guru BK &rarr;</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Penilaian Ibadah PAI (Checklist Ketuntasan) */}
      {activeTab === 'pai' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Progres Penilaian Harian PAI & Praktik Ibadah
              </h3>
              <p className="text-xs text-slate-500">
                Rekap ketuntasan indikator thaharah, hafalan surat pendek, sholat fardhu, dan adab islami.
              </p>
            </div>

            <div className="space-y-4">
              {paiAssessments.map((ass) => {
                const studentResult = ass.results[student.id] || { completedIndicators: {} };
                const completedCount = ass.subIndicators.filter(
                  (ind) => studentResult.completedIndicators[ind.id] === true
                ).length;
                const isAllDone = completedCount === ass.subIndicators.length && completedCount > 0;

                return (
                  <div
                    key={ass.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/40 hover:border-teal-300 transition-colors space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                      <div>
                        <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                          {ass.aspectCategory}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">
                          {ass.title}
                        </h4>
                      </div>

                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${
                          isAllDone
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isAllDone ? 'TUNTAS SEMPURNA' : `${completedCount}/${ass.subIndicators.length} TUNTAS`}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">{ass.date}</span>
                      </div>
                    </div>

                    {/* Sub-Indicators Checklist Breakdown for this child */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {ass.subIndicators.map((ind, i) => {
                        const isDone = studentResult.completedIndicators[ind.id] === true;
                        return (
                          <div
                            key={ind.id}
                            className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                              isDone
                                ? 'bg-emerald-50/50 border-emerald-200 text-slate-800'
                                : 'bg-white border-slate-200 text-slate-500'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <XCircle className="w-4 h-4 text-slate-300 shrink-0" />
                              )}
                              <span>{ind.name}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {isDone ? 'Tuntas' : 'Perlu Latihan'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {studentResult.notes && (
                      <div className="bg-teal-50 border border-teal-200 text-teal-900 p-3 rounded-xl text-xs">
                        <strong>Catatan Guru PAI: </strong>
                        <span>{studentResult.notes}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Chat Privat Dua Arah dengan Guru Pilihan */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[540px]">
          {/* Left: Choose Teacher */}
          <div className="md:col-span-4 border-r border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Pilih Guru Pendamping
            </h4>
            <p className="text-[11px] text-slate-500 leading-snug">
              Pilih guru yang ingin Anda hubungi untuk komunikasi dua arah yang aman dan terjaga privasinya:
            </p>

            <div className="space-y-2 pt-1">
              {teachers.length === 0 && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  Belum ada akun guru aktif. Hubungi administrator sekolah untuk mengatur akun pendamping.
                </p>
              )}
              {teachers.map((tch) => {
                const isSelected = currentTeacherObj?.id === tch.id;
                return (
                  <button
                    key={tch.id}
                    onClick={() => setSelectedTeacherId(tch.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all border ${
                      isSelected
                        ? 'bg-white border-indigo-500 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-sm shrink-0">
                        {tch.avatar}
                      </div>
                      <div className="flex-1">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border inline-block mb-0.5 ${tch.badgeColor}`}>
                          {tch.title}
                        </span>
                        <p className="text-xs font-bold text-slate-900 leading-tight">
                          {tch.name}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {tch.desc}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Chat Window */}
          <div className="md:col-span-8 flex flex-col justify-between p-4 bg-white">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                  {currentTeacherObj?.avatar || '?'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 leading-tight">
                    {currentTeacherObj?.name || 'Pilih guru pendamping'}
                  </h4>
                  <p className="text-xs text-slate-500 leading-tight">
                    {currentTeacherObj?.title || 'Tidak ada guru aktif'} · Topik: <span className="font-semibold text-indigo-700">{student.name}</span>
                  </p>
                </div>
              </div>

              <span className="text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-semibold hidden sm:inline">
                Saluran Privat Dua Arah
              </span>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
              {!currentTeacherObj ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-10">
                  <MessageCircle className="w-8 h-8 mb-2 text-slate-300" />
                  <p>Chat belum tersedia karena belum ada akun guru yang aktif.</p>
                </div>
              ) : currentChatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-10">
                  <MessageCircle className="w-8 h-8 mb-2 text-slate-300" />
                  <p>Belum ada percakapan dengan {currentTeacherObj.name}.</p>
                  <p className="text-[11px]">Silakan ketik sapaan atau pilih template di bawah untuk memulai obrolan.</p>
                </div>
              ) : (
                currentChatMessages.map((msg) => {
                  const isMe = msg.senderRole === 'orangtua';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] text-slate-400 mb-0.5">
                        {msg.senderName}
                      </span>
                      <div
                        className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
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

            {/* Fast Quick Templates */}
            <div className="py-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <span className="text-slate-400 shrink-0 font-medium">Template Cepat:</span>
              <button
                onClick={() => currentTeacherObj && handleQuickTemplate(`Selamat pagi/siang ${currentTeacherObj.name.split(',')[0]}, mohon izin menanyakan perkembangan ananda ${student.name} di kelas...`)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-700 whitespace-nowrap transition-colors"
              >
                Tanya Perkembangan
              </button>
              <button
                onClick={() => handleQuickTemplate(`Terima kasih banyak atas bimbingan dan kesabarannya mendampingi ${student.name}.`)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-700 whitespace-nowrap transition-colors"
              >
                Ucapkan Terima Kasih
              </button>
              <button
                onClick={() => handleQuickTemplate(`Mohon izin menginfokan bahwa ananda ${student.name} sedang kurang enak badan hari ini...`)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-700 whitespace-nowrap transition-colors"
              >
                Izin Sakit
              </button>
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="pt-2 flex items-center gap-2">
              <input
                type="text"
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                placeholder={`Tulis pesan untuk ${currentTeacherObj?.name || 'guru pendamping'}...`}
                disabled={!currentTeacherObj}
                className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!currentTeacherObj || !chatInputText.trim()}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
