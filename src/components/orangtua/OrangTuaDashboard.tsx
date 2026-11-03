import React, { useState, useEffect } from 'react';
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

  const [activeTab, setActiveTabState] = useState<'ringkasan' | 'bintang' | 'jurnal' | 'bk' | 'pai' | 'chat'>((currentTab as any) || 'ringkasan');

  useEffect(() => {
    if (currentTab && ['ringkasan', 'bintang', 'jurnal', 'bk', 'pai', 'chat'].includes(currentTab)) {
      setActiveTabState((prev) => (prev !== currentTab ? (currentTab as any) : prev));
    }
  }, [currentTab]);

  const setActiveTab = (tab: 'ringkasan' | 'bintang' | 'jurnal' | 'bk' | 'pai' | 'chat') => {
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

  const student = getLinkedStudentsForParent(currentUser, students)[0] || null;

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
  ).sort((left, right) => left.timestamp - right.timestamp);

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
    <div className="dashboard-page mx-auto max-w-7xl space-y-7 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-white/10 bg-slate-950 px-5 py-3.5 text-xs text-white shadow-2xl shadow-slate-900/20 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Child Identity & Star Honor Strip Banner */}
      <div className="relative overflow-hidden rounded-[1.75rem] border border-indigo-800 bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 p-5 text-white shadow-xl shadow-indigo-950/15 sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-indigo-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-amber-300/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Child Identity */}
          <div className="flex items-center gap-4">
            <div className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-orange-400 text-3xl font-black text-slate-950 shadow-lg shadow-amber-500/20 ring-4 ring-white/10">
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-300">
                  Portal Orang Tua
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-mono text-indigo-100">
                  NISN: {student.nisn}
                </span>
              </div>
              <h2 className="mt-1 text-xl font-extrabold leading-tight tracking-tight text-white sm:text-2xl">
                {student.name}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-indigo-200">
                {schoolProfile.name} · {schoolProfile.classGrade} · Wali: {student.parentName}
              </p>
            </div>
          </div>

          {/* Star Honor Box */}
          <div className="flex flex-col gap-4 rounded-2xl border border-white/15 bg-white/[0.08] p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5">
            <div className="text-center sm:border-r sm:border-white/15 sm:pr-5 sm:text-left">
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-300">
                  TOTAL BINTANG BERSIH
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[9px] text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Sync
                </span>
              </div>
              <div className="mt-1 flex items-center justify-center gap-2.5 sm:justify-start">
                <Star className="h-8 w-8 fill-amber-400 text-amber-300 drop-shadow sm:h-9 sm:w-9" />
                <span className="font-mono text-4xl font-black tabular-nums text-white">
                  {netStars}
                </span>
                <span className="text-xs text-amber-200 font-semibold self-end pb-1">Bintang</span>
              </div>
              <div className="mt-1 flex items-center justify-center gap-2 font-mono text-[11px] font-semibold sm:justify-start">
                <span className="rounded-md border border-emerald-500/30 bg-emerald-950/40 px-2 py-1 text-emerald-300">
                  +{totalRewards} Apresiasi
                </span>
                <span className="rounded-md border border-rose-500/30 bg-rose-950/40 px-2 py-1 text-rose-300">
                  -{totalPenalties} Sanksi
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-xl border border-white/10 bg-white/[0.06] p-2.5">
                <span className="text-[10px] text-indigo-200 block font-medium">Guru Kelas</span>
                <span className="font-bold text-white font-mono tabular-nums block text-sm mt-0.5">
                  {gkStats.net} ★
                </span>
                <span className="text-[10px] text-indigo-300 font-mono">
                  +{gkStats.rewards} / -{gkStats.penalties}
                </span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.06] p-2.5">
                <span className="text-[10px] text-rose-200 block font-medium">Guru BK</span>
                <span className="font-bold text-white font-mono tabular-nums block text-sm mt-0.5">
                  {bkStats.net} ★
                </span>
                <span className="text-[10px] text-rose-300 font-mono">
                  +{bkStats.rewards} / -{bkStats.penalties}
                </span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.06] p-2.5">
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



      {activeTab === 'ringkasan' && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Bintang bersih', value: netStars, detail: `+${totalRewards} apresiasi · -${totalPenalties} sanksi`, icon: Star, tone: 'text-amber-600' },
              { label: 'Catatan BK', value: myReportedCases.length, detail: 'Dibagikan kepada keluarga', icon: HeartHandshake, tone: 'text-rose-600' },
              { label: 'Asesmen PAI', value: paiAssessments.filter((assessment) => Boolean(assessment.results[student.id])).length, detail: 'Memuat hasil untuk anak', icon: BookOpen, tone: 'text-teal-700' },
              { label: 'Pesan belum dibaca', value: messages.filter((message) => message.recipientId === currentUser?.id && !message.isRead).length, detail: 'Dari guru pendamping', icon: MessageCircle, tone: 'text-indigo-600' },
            ].map((item) => (
              <article key={item.label} className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-950/5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500">{item.label}</p>
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 ${item.tone}`}>
                    <item.icon className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">{item.value}</p>
                <p className="mt-1.5 text-[11px] text-slate-500">{item.detail}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div><h4 className="text-sm font-bold text-slate-900">Aktivitas terbaru</h4><p className="mt-0.5 text-[11px] text-slate-500">Apresiasi dan pendampingan untuk {student.name}</p></div>
                <button onClick={() => setActiveTab('bintang')} className="text-xs font-bold text-indigo-600">Lihat semua</button>
              </div>
              <div className="divide-y divide-slate-100">
                {myStars.slice(0, 3).map((award) => (
                  <div key={award.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0"><p className="text-xs font-semibold text-slate-800">{award.category}</p><p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">{award.note}</p></div>
                    <span className="shrink-0 text-[10px] text-slate-500">{award.date}</span>
                  </div>
                ))}
                {myReportedCases.slice(0, 2).map((record) => (
                  <div key={record.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0"><p className="text-xs font-semibold text-slate-800">Pendampingan BK · {record.category}</p><p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">{record.followUpAction}</p></div>
                    <span className="shrink-0 text-[10px] text-slate-500">{record.date}</span>
                  </div>
                ))}
                {myStars.length === 0 && myReportedCases.length === 0 && <p className="py-6 text-center text-xs text-slate-500">Belum ada aktivitas yang dibagikan.</p>}
              </div>
            </section>
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <h4 className="text-sm font-bold text-slate-900">Akses portal anak</h4>
              <p className="mt-1 text-[11px] text-slate-500">Informasi khusus untuk {student.name}.</p>
              <div className="mt-3 grid gap-2">
                {[
                  { label: 'Jurnal harian kelas', tab: 'jurnal', icon: BookOpen },
                  { label: 'Bintang & prestasi', tab: 'bintang', icon: Star },
                  { label: 'Laporan konseling', tab: 'bk', icon: HeartHandshake },
                  { label: 'Capaian ibadah PAI', tab: 'pai', icon: Sparkles },
                  { label: 'Chat guru pendamping', tab: 'chat', icon: MessageCircle },
                ].map((item) => (
                  <button key={item.tab} onClick={() => setActiveTab(item.tab as 'jurnal' | 'bintang' | 'bk' | 'pai' | 'chat')} className="group flex items-center gap-3 rounded-xl border border-slate-200/80 p-3.5 text-left text-xs font-semibold text-slate-800 transition hover:border-indigo-200 hover:bg-indigo-50/60">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 transition group-hover:bg-white">
                      <item.icon className="h-4 w-4" />
                    </span>
                    {item.label}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* Tab 1: Apresiasi & Pengurangan Bintang Murid */}
      {activeTab === 'bintang' && (
        <div className="space-y-6">
          <div className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center">
              <div>
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold tracking-wide text-indigo-700">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>SISTEM EVALUASI PERILAKU & PRESTASI ADIL</span>
                </div>
                <h3 className="text-lg font-bold tracking-tight text-slate-900">
                  Rekapitulasi Bintang Karakter, Prestasi & Penegakan Disiplin
                </h3>
                <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-500">
                  Bintang diberikan oleh Guru Kelas, Guru BK, dan Guru PAI sebagai bentuk apresiasi prestasi (+), serta pengurangan edukatif (-) jika terdapat pelanggaran tata tertib agar anak belajar bertanggung jawab.
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex shrink-0 self-start rounded-xl bg-slate-100 p-1 text-xs font-semibold sm:self-auto">
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
                        className={`space-y-3 rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-md ${
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
          <div className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold tracking-wide text-indigo-700">
                <BookOpen className="h-3.5 w-3.5" /> JURNAL PEMBELAJARAN
              </div>
              <h3 className="text-lg font-bold tracking-tight text-slate-900">
                Jurnal Pembelajaran Kelas {schoolProfile.classGrade}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Informasi materi yang diajarkan, kegiatan praktikum, serta instruksi belajar harian dari guru kelas.
              </p>
            </div>

            <div className="space-y-4">
              {journalEntries.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-10 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-500 shadow-sm">
                    <BookOpen className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-slate-800">Jurnal belum tersedia</p>
                  <p className="mt-1 text-xs text-slate-500">Catatan pembelajaran kelas akan tampil di sini setelah dibagikan oleh guru.</p>
                </div>
              )}
              {journalEntries.map((j) => (
                <div
                  key={j.id}
                  className="space-y-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50/80 to-white p-4 transition-all hover:border-indigo-200 hover:shadow-md sm:p-5"
                >
                  <div className="flex flex-col justify-between gap-2 border-b border-slate-200/70 pb-3 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                        {j.subjectName}
                      </span>
                      <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {j.timeSlot}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">{j.date}</span>
                  </div>

                  <div className="space-y-1.5 rounded-xl border border-indigo-100 bg-white p-4 shadow-sm shadow-indigo-950/[0.02]">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-500">
                      TUJUAN PEMBELAJARAN (TP):
                    </span>
                    <p className="text-xs font-semibold text-slate-900 leading-snug">
                      {j.tpDescription}
                    </p>
                  </div>

                  <div className="px-1">
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      KEGIATAN SISWA DI KELAS:
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {j.activityDescription}
                    </p>
                  </div>

                  {j.notes && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs leading-relaxed text-amber-900">
                      <strong className="block mb-0.5">Catatan Khusus Wali Kelas:</strong>
                      <span>{j.notes}</span>
                    </div>
                  )}

                  <div className="flex flex-col justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500 sm:flex-row sm:items-center">
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
          <div className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-rose-50 p-3 text-rose-600">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight text-slate-900">
                  Laporan Khusus & Catatan Bimbingan Konseling (BK)
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Catatan pendampingan karakter yang dikirimkan secara real-time oleh Guru BK khusus untuk orang tua {student.name}.
                </p>
              </div>
            </div>

            {myReportedCases.length === 0 ? (
              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-8 text-center text-xs text-emerald-800">
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
                    className="space-y-4 rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50/60 to-white p-4 shadow-sm sm:p-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-rose-200 bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800">
                          {cs.category === 'Konseling Khusus' ? 'Konseling Individu' : cs.category}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">Tanggal: {cs.date}</span>
                      </div>
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-[10px] font-bold text-white">
                        Status: {cs.status === 'Dalam Pantauan' ? 'Dalam Bimbingan/Pendampingan' : cs.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 rounded-xl border border-slate-200 bg-white p-4">
                      <span className="text-[10px] font-bold text-rose-800 uppercase block">
                        URAIAN CATATAN GURU BK:
                      </span>
                      <p className="text-xs text-slate-800 leading-relaxed font-medium">
                        {cs.description}
                      </p>
                    </div>

                    <div className="space-y-1.5 rounded-xl border border-slate-200 bg-white p-4">
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
          <div className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[10px] font-bold tracking-wide text-teal-700">
                <Sparkles className="h-3.5 w-3.5" /> IBADAH & PAI
              </div>
              <h3 className="text-lg font-bold tracking-tight text-slate-900">
                Progres Penilaian Harian PAI & Praktik Ibadah
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Rekap ketuntasan indikator thaharah, hafalan surat pendek, sholat fardhu, dan adab islami.
              </p>
            </div>

            <div className="space-y-4">
              {paiAssessments.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-10 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-teal-600 shadow-sm">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-slate-800">Belum ada penilaian PAI</p>
                  <p className="mt-1 text-xs text-slate-500">Progres ibadah dan pembelajaran PAI akan tampil setelah guru membagikan penilaian.</p>
                </div>
              )}
              {paiAssessments.map((ass) => {
                const studentResult = ass.results[student.id] || { completedIndicators: {} };
                const completedCount = ass.subIndicators.filter(
                  (ind) => studentResult.completedIndicators[ind.id] === true
                ).length;
                const isAllDone = completedCount === ass.subIndicators.length && completedCount > 0;

                return (
                  <div
                    key={ass.id}
                    className="space-y-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50/80 to-white p-4 transition-all hover:border-teal-300 hover:shadow-md sm:p-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                      <div>
                        <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[10px] font-bold text-teal-700">
                          {ass.aspectCategory}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">
                          {ass.title}
                        </h4>
                      </div>

                      <div className="text-right">
                        <span className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold ${
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
                            className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 text-xs ${
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
                      <div className="rounded-xl border border-teal-200 bg-teal-50/80 p-3.5 text-xs leading-relaxed text-teal-900">
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
        <div className="grid min-h-[620px] grid-cols-1 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm md:grid-cols-12">
          {/* Left: Choose Teacher */}
          <div className="space-y-3 border-b border-slate-200 bg-slate-50/70 p-4 sm:p-5 md:col-span-4 md:border-b-0 md:border-r">
            <div className="mb-4">
            <span className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-white px-2.5 py-1 text-[10px] font-bold tracking-wide text-indigo-700">
              <MessageCircle className="h-3.5 w-3.5" /> PESAN PRIVAT
            </span>
            <h4 className="text-sm font-bold tracking-tight text-slate-900">
              Pilih Guru Pendamping
            </h4>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              Pilih guru yang ingin Anda hubungi untuk komunikasi dua arah yang aman dan terjaga privasinya:
            </p>
            </div>

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
                    className={`w-full rounded-xl border p-3.5 text-left transition-all ${
                      isSelected
                        ? 'border-indigo-300 bg-white shadow-md shadow-indigo-950/5 ring-2 ring-indigo-100'
                        : 'border-slate-200 bg-white/80 hover:border-indigo-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 text-sm font-bold text-indigo-700">
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
          <div className="flex flex-col justify-between bg-white p-4 sm:p-5 md:col-span-8">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-xs font-bold text-white shadow-sm shadow-indigo-600/20">
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

              <span className="hidden rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[10px] font-semibold text-indigo-700 sm:inline">
                Saluran Privat Dua Arah
              </span>
            </div>

            {/* Messages Body */}
            <div className="my-4 flex-1 space-y-3 overflow-y-auto rounded-2xl bg-slate-50/80 p-4 sm:min-h-[340px]">
              {!currentTeacherObj ? (
                <div className="flex h-full flex-col items-center justify-center py-10 text-xs text-slate-400">
                <MessageCircle className="mb-2 h-9 w-9 text-slate-300" />
                  <p>Chat belum tersedia karena belum ada akun guru yang aktif.</p>
                </div>
              ) : currentChatMessages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-10 text-xs text-slate-400">
                  <MessageCircle className="mb-2 h-9 w-9 text-slate-300" />
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
                        className={`max-w-[85%] rounded-2xl px-4 py-3.5 text-xs leading-relaxed shadow-sm sm:max-w-md ${
                          isMe
                            ? 'rounded-br-md bg-indigo-600 text-white'
                            : 'rounded-bl-md border border-slate-200 bg-white text-slate-900'
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
            <div className="flex items-center gap-2 overflow-x-auto border-t border-slate-100 py-3 text-[11px]">
              <span className="text-slate-400 shrink-0 font-medium">Template Cepat:</span>
              <button
                onClick={() => currentTeacherObj && handleQuickTemplate(`Selamat pagi/siang ${currentTeacherObj.name.split(',')[0]}, mohon izin menanyakan perkembangan ananda ${student.name} di kelas...`)}
                className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50"
              >
                Tanya Perkembangan
              </button>
              <button
                onClick={() => handleQuickTemplate(`Terima kasih banyak atas bimbingan dan kesabarannya mendampingi ${student.name}.`)}
                className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50"
              >
                Ucapkan Terima Kasih
              </button>
              <button
                onClick={() => handleQuickTemplate(`Mohon izin menginfokan bahwa ananda ${student.name} sedang kurang enak badan hari ini...`)}
                className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50"
              >
                Izin Sakit
              </button>
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="flex items-center gap-2 border-t border-slate-100 pt-3">
              <input
                type="text"
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                placeholder={`Tulis pesan untuk ${currentTeacherObj?.name || 'guru pendamping'}...`}
                disabled={!currentTeacherObj}
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
              <button
                type="submit"
                disabled={!currentTeacherObj || !chatInputText.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-sm shadow-indigo-600/20 transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
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
