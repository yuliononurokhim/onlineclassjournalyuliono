import React, { useEffect, useMemo, useState } from 'react';
import { useEduStore } from '../../services/store';
import { ClassJournalEntry, WeeklyScheduleDay } from '../../types';
import { getLocalDateString } from '../../services/date';
import { BookOpen, CalendarDays, ChevronDown, Plus, Save, Trash2 } from 'lucide-react';

type AttendanceStatus = NonNullable<ClassJournalEntry['attendanceByStudent']>[string];

interface ClassJournalTabProps {
  subjectScope?: 'all' | 'pai';
}

interface JournalRow {
  subjectId: string;
  objectiveId: string;
  activity: string;
}

const createJournalRow = (): JournalRow => ({
  subjectId: '',
  objectiveId: '',
  activity: '',
});

const ATTENDANCE_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: 'hadir', label: 'Hadir' },
  { value: 'sakit', label: 'Sakit' },
  { value: 'izin', label: 'Izin' },
  { value: 'alpa', label: 'Alpha' },
];

const WEEKDAYS: WeeklyScheduleDay[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

function getWeekday(date: string): WeeklyScheduleDay | null {
  const dayIndex = new Date(`${date}T12:00:00`).getDay();
  return WEEKDAYS[dayIndex - 1] || null;
}

function isEffectiveWeekday(date: string): boolean {
  const day = new Date(`${date}T12:00:00`).getDay();
  return day !== 0 && day !== 6;
}

function formatJournalDate(date: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`));
}

export const ClassJournalTab: React.FC<ClassJournalTabProps> = ({ subjectScope = 'all' }) => {
  const {
    subjects,
    learningObjectives,
    students,
    journalEntries,
    addJournalEntries,
    deleteJournalEntry,
    weeklySchedule,
    replaceWeeklyScheduleDay,
    currentUser,
  } = useEduStore();
  const availableSubjects = useMemo(() => {
    if (subjectScope !== 'pai') return subjects;
    const paiSubjects = subjects.filter((subject) =>
      /pai|islam|literasi|literacy|keislaman/i.test(`${subject.name} ${subject.code}`)
    );
    return paiSubjects;
  }, [subjectScope, subjects]);
  const [date, setDate] = useState(getLocalDateString());
  const [rows, setRows] = useState<JournalRow[]>(
    () => [createJournalRow()]
  );
  const [selectedScheduleDay, setSelectedScheduleDay] = useState<WeeklyScheduleDay>('Senin');
  const [scheduleRows, setScheduleRows] = useState<JournalRow[]>([createJournalRow()]);
  const [scheduleMessage, setScheduleMessage] = useState('');
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

  const savedRowsForSelectedDay = weeklySchedule
    .filter((entry) => entry.scope === subjectScope && entry.day === selectedScheduleDay)
    .map(({ subjectId, objectiveId, activity }) => ({ subjectId, objectiveId, activity }));
  const scheduleEditorSyncKey = `${subjectScope}:${selectedScheduleDay}:${JSON.stringify(savedRowsForSelectedDay)}`;

  useEffect(() => {
    setScheduleRows(savedRowsForSelectedDay.length > 0 ? savedRowsForSelectedDay : [createJournalRow()]);
  }, [scheduleEditorSyncKey]);

  const updateScheduleRow = (index: number, patch: Partial<JournalRow>) => {
    setScheduleRows((current) => current.map((row, rowIndex) =>
      rowIndex === index ? { ...row, ...patch } : row
    ));
  };

  const handleSaveWeeklySchedule = (event: React.FormEvent) => {
    event.preventDefault();
    setScheduleMessage('');

    const populatedRows = scheduleRows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => row.subjectId || row.objectiveId || row.activity.trim());
    if (populatedRows.length === 0) {
      setScheduleMessage('Isi minimal satu jam pelajaran sebelum menyimpan jadwal.');
      return;
    }

    for (const { row, index } of populatedRows) {
      if (!availableSubjects.some((subject) => subject.id === row.subjectId)) {
        setScheduleMessage(`Jam ke-${index + 1}: pilih mata pelajaran.`);
        return;
      }
      const objective = learningObjectives.find(
        (item) => item.id === row.objectiveId && item.subjectId === row.subjectId
      );
      if (!objective) {
        setScheduleMessage(`Jam ke-${index + 1}: pilih TP sesuai mata pelajaran.`);
        return;
      }
      if (!row.activity.trim()) {
        setScheduleMessage(`Jam ke-${index + 1}: isi kegiatan pembelajaran.`);
        return;
      }
    }

    replaceWeeklyScheduleDay(
      subjectScope,
      selectedScheduleDay,
      populatedRows.map(({ row }, index) => ({
        period: index + 1,
        subjectId: row.subjectId,
        subjectName: subjects.find((subject) => subject.id === row.subjectId)?.name || '',
        objectiveId: row.objectiveId,
        activity: row.activity.trim(),
      }))
    );
    setScheduleMessage(`Jadwal hari ${selectedScheduleDay} berhasil disimpan.`);
  };

  const handleClearWeeklySchedule = () => {
    if (!window.confirm(`Hapus semua jadwal pembelajaran hari ${selectedScheduleDay}?`)) return;
    replaceWeeklyScheduleDay(subjectScope, selectedScheduleDay, []);
    setScheduleRows([createJournalRow()]);
    setScheduleMessage(`Jadwal hari ${selectedScheduleDay} berhasil dikosongkan.`);
  };

  const handleLoadScheduleToJournal = () => {
    const weekday = getWeekday(date);
    if (!weekday) {
      setFormError('Jadwal hanya tersedia untuk hari sekolah Senin–Jumat.');
      return;
    }
    const savedRows = weeklySchedule
      .filter((entry) => entry.scope === subjectScope && entry.day === weekday)
      .map(({ subjectId, objectiveId, activity }) => ({ subjectId, objectiveId, activity }));
    if (savedRows.length === 0) {
      setFormError(`Belum ada jadwal tersimpan untuk hari ${weekday}.`);
      return;
    }
    setRows(savedRows);
    setFormError('');
    setSavedMessage(`Jadwal hari ${weekday} dimuat ke formulir jurnal. Lengkapi presensi, lalu simpan jurnal.`);
  };

  const updateRow = (index: number, patch: Partial<JournalRow>) => {
    setRows((current) => current.map((row, rowIndex) =>
      rowIndex === index ? { ...row, ...patch } : row
    ));
  };

  const setAllAttendance = (status: AttendanceStatus) => {
    setAttendance(Object.fromEntries(students.map((student) => [student.id, status])));
  };

  const updateAttendance = (studentId: string, status: AttendanceStatus) => {
    setAttendance((current) => ({ ...current, [studentId]: status }));
  };

  const allPresent = students.length > 0 && students.every(
    (student) => (attendance[student.id] || 'hadir') === 'hadir'
  );

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');
    setSavedMessage('');
    if (students.length === 0) {
      setFormError('Daftar murid kelas belum tersedia. Jurnal belum dapat disimpan.');
      return;
    }

    const populatedRows = rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => row.subjectId || row.objectiveId || row.activity.trim());
    if (populatedRows.length === 0) {
      setFormError('Isi minimal satu baris jurnal.');
      return;
    }

    if (!isEffectiveWeekday(date)) {
      setFormError('Pilih tanggal hari efektif sekolah (Senin–Jumat).');
      return;
    }

    for (const { row, index } of populatedRows) {
      if (!availableSubjects.some((subject) => subject.id === row.subjectId)) {
        setFormError(`Baris ${index + 1}: pilih mata pelajaran.`);
        return;
      }
      const objective = learningObjectives.find(
        (item) => item.id === row.objectiveId && item.subjectId === row.subjectId
      );
      if (!objective) {
        setFormError(`Baris ${index + 1}: pilih TP dari kurikulum Admin sesuai mata pelajaran.`);
        return;
      }
      if (!row.activity.trim()) {
        setFormError(`Baris ${index + 1}: isi kegiatan pembelajaran.`);
        return;
      }
    }

    const attendanceByStudent = Object.fromEntries(
      students.map((student) => [student.id, attendance[student.id] || 'hadir'])
    ) as Record<string, AttendanceStatus>;
    const counts = {
      attendancePresent: Object.values(attendanceByStudent).filter((status) => status === 'hadir').length,
      attendanceSick: Object.values(attendanceByStudent).filter((status) => status === 'sakit').length,
      attendancePermit: Object.values(attendanceByStudent).filter((status) => status === 'izin').length,
      attendanceAbsent: Object.values(attendanceByStudent).filter((status) => status === 'alpa').length,
    };

    addJournalEntries(populatedRows.map(({ row, index }) => {
      const subject = availableSubjects.find((item) => item.id === row.subjectId)!;
      const objective = learningObjectives.find((item) => item.id === row.objectiveId)!;
      return {
        date,
        timeSlot: `ke-${index + 1}`,
        subjectId: subject.id,
        subjectName: subject.name,
        learningObjectiveId: objective.id,
        cpDescription: objective.capaianPembelajaran,
        tpDescription: objective.tujuanPembelajaran,
        activityDescription: row.activity.trim(),
        ...counts,
        attendanceByStudent,
        notes: notes.trim() || undefined,
        teacherName: currentUser?.name || 'Guru',
      };
    }));

    setRows((current) => current.map(() => createJournalRow()));
    setNotes('');
    setSavedMessage(`${populatedRows.length} jurnal berhasil disimpan; sinkronisasi otomatis berjalan.`);
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 px-5 py-5 sm:px-6 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-100">Jurnal Pembelajaran</p>
              <h3 className="text-lg font-extrabold tracking-tight">Input Jurnal Harian</h3>
              <p className="mt-1 text-xs text-indigo-100">
                Tambahkan baris sesuai jumlah jam mengajar. CP dan TP terhubung ke kurikulum Admin.
              </p>
            </div>
          </div>
        </div>

        <section className="border-b border-slate-200 bg-slate-50/70 p-4 sm:p-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Jadwal Pembelajaran Mingguan</h4>
                <p className="mt-1 text-[11px] text-slate-500">
                  Pilih tab hari, atur jam pelajaran, lalu simpan sebagai jadwal rutin mingguan.
                </p>
              </div>
              <span className="text-[10px] font-medium text-slate-500">Jadwal ini terpisah dari jurnal harian bertanggal.</span>
            </div>

            <div role="tablist" aria-label="Hari jadwal pembelajaran" className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
              {WEEKDAYS.map((day) => {
                const dayCount = weeklySchedule.filter(
                  (entry) => entry.scope === subjectScope && entry.day === day
                ).length;
                const isSelected = selectedScheduleDay === day;
                return (
                  <button
                    key={day}
                    id={`schedule-tab-${subjectScope}-${day}`}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    aria-controls={`schedule-panel-${subjectScope}`}
                    onClick={() => {
                      setSelectedScheduleDay(day);
                      setScheduleMessage('');
                    }}
                    className={`flex min-w-20 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition ${
                      isSelected
                        ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200'
                        : 'text-slate-600 hover:bg-white/70 hover:text-indigo-700'
                    }`}
                  >
                    {day}
                    {dayCount > 0 && (
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>
                        {dayCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <form
              id={`schedule-panel-${subjectScope}`}
              role="tabpanel"
              aria-labelledby={`schedule-tab-${subjectScope}-${selectedScheduleDay}`}
              onSubmit={handleSaveWeeklySchedule}
              className="space-y-3"
            >
              {scheduleMessage && (
                <p role="status" className={`rounded-lg border p-3 text-xs ${scheduleMessage.includes('berhasil') || scheduleMessage.includes('dimuat') ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                  {scheduleMessage}
                </p>
              )}
              {scheduleRows.map((row, index) => {
                const objectives = learningObjectives.filter(
                  (objective) => objective.subjectId === row.subjectId
                );
                return (
                  <article key={index} className="rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2">
                      <span className="text-xs font-bold text-slate-800">Jam ke-{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => setScheduleRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}
                        aria-label={`Hapus jadwal jam ke-${index + 1}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="grid gap-3 p-3 sm:grid-cols-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        Mata pelajaran
                        <select
                          value={row.subjectId}
                          onChange={(event) => updateScheduleRow(index, { subjectId: event.target.value, objectiveId: '' })}
                          className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-normal normal-case tracking-normal text-slate-700 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        >
                          <option value="">Pilih mata pelajaran</option>
                          {availableSubjects.map((subject) => (
                            <option key={subject.id} value={subject.id}>{subject.name}</option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        Tujuan pembelajaran / materi
                        <select
                          value={row.objectiveId}
                          onChange={(event) => updateScheduleRow(index, { objectiveId: event.target.value })}
                          disabled={!row.subjectId}
                          className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-normal normal-case tracking-normal text-slate-700 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                        >
                          <option value="">Pilih TP dari kurikulum Admin</option>
                          {objectives.map((objective) => (
                            <option key={objective.id} value={objective.id}>{objective.tujuanPembelajaran}</option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 sm:col-span-2">
                        Kegiatan pembelajaran
                        <textarea
                          rows={2}
                          value={row.activity}
                          onChange={(event) => updateScheduleRow(index, { activity: event.target.value })}
                          placeholder="Tuliskan kegiatan yang direncanakan pada jam ini..."
                          className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-normal normal-case tracking-normal text-slate-700 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                      </label>
                    </div>
                  </article>
                );
              })}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setScheduleRows((current) => [...current, createJournalRow()])}
                  className="inline-flex items-center gap-2 rounded-lg border border-dashed border-indigo-300 bg-indigo-50/60 px-3 py-2 text-xs font-bold text-indigo-700 transition hover:border-indigo-400 hover:bg-indigo-50"
                >
                  <Plus className="h-4 w-4" /> Tambah jam
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  {savedRowsForSelectedDay.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearWeeklySchedule}
                      className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2.5 text-xs font-bold text-rose-700 transition hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Hapus jadwal
                    </button>
                  )}
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700"
                  >
                    <Save className="h-4 w-4" /> Simpan jadwal {selectedScheduleDay}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>

        <form onSubmit={handleSave} className="space-y-5 p-4 sm:p-6">
          {formError && (
            <p role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
              {formError}
            </p>
          )}
          {savedMessage && (
            <p role="status" className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              {savedMessage}
            </p>
          )}

          <div className="flex flex-col gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <label htmlFor="class-journal-date" className="block text-xs font-bold text-slate-800">Hari efektif / tanggal</label>
              <p className="mt-1 text-[11px] text-slate-500">Tanggal ini digunakan untuk seluruh baris jurnal.</p>
            </div>
            <input
              id="class-journal-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
              className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 sm:w-56"
            />
            <button
              type="button"
              onClick={handleLoadScheduleToJournal}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-2.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-50 sm:w-auto"
            >
              <CalendarDays className="h-4 w-4" /> Muat jadwal hari ini
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800">Rincian jam pelajaran</h4>
                <p className="mt-0.5 text-[10px] text-slate-500">Baris kosong tidak akan disimpan.</p>
              </div>
              <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-bold text-indigo-700">
                {rows.length} baris
              </span>
            </div>

            {rows.map((row, index) => {
              const objectives = learningObjectives.filter(
                (objective) => objective.subjectId === row.subjectId
              );
              const selectedObjective = objectives.find((objective) => objective.id === row.objectiveId);
              return (
                <article key={index} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-indigo-200">
                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-3 py-2.5 sm:px-4">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-[11px] font-extrabold text-white">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Jam ke-{index + 1}</p>
                        <p className="text-[10px] text-slate-500">{formatJournalDate(date)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={rows.length === 1}
                      onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}
                      aria-label={`Hapus baris jam ke-${index + 1}`}
                      title={rows.length === 1 ? 'Minimal harus ada satu baris' : 'Hapus baris'}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-4">
                    <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Mata pelajaran
                      <select
                        value={row.subjectId}
                        onChange={(event) => updateRow(index, { subjectId: event.target.value, objectiveId: '' })}
                        className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-normal normal-case tracking-normal text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      >
                        <option value="">Pilih mata pelajaran</option>
                        {availableSubjects.map((subject) => (
                          <option key={subject.id} value={subject.id}>{subject.name}</option>
                        ))}
                      </select>
                    </label>

                    <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Tujuan pembelajaran / materi
                      <select
                        value={row.objectiveId}
                        onChange={(event) => updateRow(index, { objectiveId: event.target.value })}
                        disabled={!row.subjectId}
                        className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-normal normal-case tracking-normal text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                      >
                        <option value="">Pilih TP dari kurikulum Admin</option>
                        {objectives.map((objective) => (
                          <option key={objective.id} value={objective.id}>{objective.tujuanPembelajaran}</option>
                        ))}
                      </select>
                    </label>

                    <div className="rounded-lg bg-violet-50/80 p-3 sm:col-span-2">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-violet-700">Capaian Pembelajaran (CP)</p>
                      <p className={`text-xs leading-relaxed ${selectedObjective ? 'text-slate-700' : 'text-slate-400'}`}>
                        {selectedObjective?.capaianPembelajaran || 'CP otomatis tampil setelah TP dipilih.'}
                      </p>
                    </div>

                    <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 sm:col-span-2">
                      Kegiatan pembelajaran
                      <textarea
                        rows={2}
                        value={row.activity}
                        onChange={(event) => updateRow(index, { activity: event.target.value })}
                        placeholder="Tuliskan kegiatan pembelajaran pada jam ini..."
                        className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-normal normal-case tracking-normal text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                    </label>
                  </div>
                </article>
              );
            })}

            <button
              type="button"
              onClick={() => setRows((current) => [...current, createJournalRow()])}
              className="inline-flex items-center gap-2 rounded-lg border border-dashed border-indigo-300 bg-indigo-50/60 px-3.5 py-2.5 text-xs font-bold text-indigo-700 transition hover:border-indigo-400 hover:bg-indigo-50"
            >
              <Plus className="h-4 w-4" /> Tambah jam pelajaran
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-800">
                  Presensi murid ({students.length})
                </h4>
                <p className="text-[10px] text-slate-500 mt-1">Pilih satu status pada setiap murid. Default: Hadir.</p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-bold text-emerald-800 transition hover:bg-emerald-100">
                <input
                  type="checkbox"
                  checked={allPresent}
                  onChange={(event) => setAllAttendance(event.target.checked ? 'hadir' : 'alpa')}
                  className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                />
                Tandai semua hadir
              </label>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[590px] text-xs">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr className="text-slate-500">
                    <th className="text-left font-semibold py-2">Nama anak</th>
                    {ATTENDANCE_OPTIONS.map((option) => (
                      <th key={option.value} className="text-center font-semibold px-2 py-2">{option.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => {
                    const status = attendance[student.id] || 'hadir';
                    return (
                      <tr key={student.id}>
                        <td className="py-2 pr-3 text-slate-700">{student.name}</td>
                        {ATTENDANCE_OPTIONS.map((option) => (
                          <td key={option.value} className="text-center px-2 py-2">
                            <input
                              type="checkbox"
                              aria-label={`${option.label}: ${student.name}`}
                              checked={status === option.value}
                              onChange={() => updateAttendance(student.id, option.value)}
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                  {students.length === 0 && (
                    <tr><td colSpan={5} className="py-3 text-slate-500">Belum ada data murid di kelas.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan untuk orang tua (opsional)</label>
            <input
              type="text"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
            />
          </div>

          <div className="sticky bottom-3 z-10 flex justify-end rounded-xl border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 sm:min-w-56"
            >
              <BookOpen className="h-4 w-4" />
              Simpan Jurnal Terisi
            </button>
          </div>
        </form>
      </section>

      <details className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 transition hover:bg-slate-50 sm:px-5 [&::-webkit-details-marker]:hidden">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Riwayat Jurnal Harian</h3>
            <p className="mt-0.5 text-[11px] text-slate-500">{journalEntries.length} catatan · tersinkron ke dashboard orang tua</p>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 transition group-open:rotate-180" />
        </summary>
        <section className="space-y-3 border-t border-slate-100 p-3 sm:p-4">
        {journalEntries.map((entry) => (
          <article key={entry.id} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">{entry.subjectName}</span>
                <span className="text-xs text-slate-500 font-mono">{entry.timeSlot}</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">{entry.date}</span>
            </div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Capaian Pembelajaran (CP)</p>
            <p className="text-xs text-slate-700">{entry.cpDescription}</p>
            <p className="text-[11px] font-bold text-indigo-600 uppercase">Tujuan Pembelajaran / Materi (TP)</p>
            <p className="text-xs font-semibold text-slate-800">{entry.tpDescription}</p>
            <p className="text-xs text-slate-700 leading-relaxed">{entry.activityDescription}</p>
            {entry.notes && <p className="text-xs bg-amber-50 border border-amber-200 text-amber-900 p-2.5 rounded-lg">{entry.notes}</p>}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
              <span className="flex flex-wrap gap-3">
                <span className="text-emerald-700 font-semibold">Hadir: {entry.attendancePresent}</span>
                <span className="text-amber-700">Sakit: {entry.attendanceSick}</span>
                <span className="text-blue-700">Izin: {entry.attendancePermit}</span>
                <span className="text-rose-700">Alpha: {entry.attendanceAbsent}</span>
              </span>
              <span>Guru: {entry.teacherName}</span>
            </div>
            {entry.teacherName === currentUser?.name && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Hapus jurnal ini?')) deleteJournalEntry(entry.id);
                }}
                className="text-[11px] text-slate-400 hover:text-rose-600"
              >
                <Trash2 className="inline w-3.5 h-3.5 mr-1" />Hapus jurnal
              </button>
            )}
          </article>
        ))}
        {journalEntries.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            <BookOpen className="w-6 h-6 mx-auto mb-2 text-slate-400" />
            Belum ada jurnal harian.
          </div>
        )}
        </section>
      </details>
    </div>
  );
};
