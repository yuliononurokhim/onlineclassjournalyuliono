import React, { useMemo, useState } from 'react';
import { useEduStore } from '../../services/store';
import { ClassJournalEntry } from '../../types';
import { getLocalDateString } from '../../services/date';
import { BookOpen, Plus, Trash2 } from 'lucide-react';

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
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

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
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <h4 className="text-xs font-bold text-slate-800">Rincian jam pelajaran</h4>
                <p className="mt-0.5 text-[10px] text-slate-500">Baris kosong tidak akan disimpan.</p>
              </div>
              <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-bold text-indigo-700">
                {rows.length} baris
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1160px] border-collapse text-left text-xs">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="w-12 border-b border-r border-slate-200 px-3 py-3 text-center font-bold">No</th>
                  <th className="min-w-40 border-b border-r border-slate-200 px-3 py-3 font-bold">Hari/Tanggal</th>
                  <th className="min-w-20 border-b border-r border-slate-200 px-3 py-3 font-bold">Jam</th>
                  <th className="min-w-48 border-b border-r border-slate-200 px-3 py-3 font-bold">Mata Pelajaran</th>
                  <th className="min-w-56 border-b border-r border-slate-200 px-3 py-3 font-bold">Capaian Pembelajaran (CP)</th>
                  <th className="min-w-56 border-b border-r border-slate-200 px-3 py-3 font-bold">Tujuan Pembelajaran / Materi (TP)</th>
                  <th className="min-w-56 border-b border-r border-slate-200 px-3 py-3 font-bold">Kegiatan</th>
                  <th className="w-14 border-b border-slate-200 px-3 py-3 text-center font-bold">Hapus</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const objectives = learningObjectives.filter(
                    (objective) => objective.subjectId === row.subjectId
                  );
                  const selectedObjective = objectives.find((objective) => objective.id === row.objectiveId);
                  return (
                    <tr key={index} className="align-top transition-colors hover:bg-indigo-50/40">
                      <td className="border-b border-r border-slate-200 px-3 py-3 text-center font-semibold text-slate-500">{index + 1}</td>
                      <td className="border-b border-r border-slate-200 px-3 py-3 whitespace-nowrap text-slate-600">{formatJournalDate(date)}</td>
                      <td className="border-b border-r border-slate-200 px-3 py-3">
                        <span className="inline-flex rounded-md bg-indigo-100 px-2 py-1 font-bold text-indigo-700">ke-{index + 1}</span>
                      </td>
                      <td className="border-b border-r border-slate-200 p-2">
                        <select
                          value={row.subjectId}
                          onChange={(event) => updateRow(index, { subjectId: event.target.value, objectiveId: '' })}
                          className="w-full min-w-44 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        >
                          <option value="">Pilih mata pelajaran</option>
                          {availableSubjects.map((subject) => (
                            <option key={subject.id} value={subject.id}>{subject.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="border-b border-r border-slate-200 px-3 py-3 leading-relaxed text-slate-600">
                        <div className={`min-h-12 rounded-lg p-2.5 ${selectedObjective ? 'bg-violet-50 text-slate-700' : 'text-slate-400'}`}>
                          {selectedObjective?.capaianPembelajaran || 'CP dari kurikulum Admin akan tampil setelah TP dipilih.'}
                        </div>
                      </td>
                      <td className="border-b border-r border-slate-200 p-2">
                        <select
                          value={row.objectiveId}
                          onChange={(event) => updateRow(index, { objectiveId: event.target.value })}
                          disabled={!row.subjectId}
                          className="w-full min-w-52 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                        >
                          <option value="">Pilih TP dari kurikulum Admin</option>
                          {objectives.map((objective) => (
                            <option key={objective.id} value={objective.id}>{objective.tujuanPembelajaran}</option>
                          ))}
                        </select>
                      </td>
                      <td className="border-b border-r border-slate-200 p-2">
                        <textarea
                          rows={3}
                          value={row.activity}
                          onChange={(event) => updateRow(index, { activity: event.target.value })}
                          placeholder="Ceritakan kegiatan belajar..."
                          className="w-full min-w-52 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                      </td>
                      <td className="border-b border-slate-200 px-2 py-3 text-center">
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRows((current) => [...current, createJournalRow()])}
            className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3.5 py-2.5 text-xs font-bold text-indigo-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-100"
          >
            <Plus className="h-4 w-4" /> Tambah baris jam pelajaran
          </button>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
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

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md"
          >
            Simpan & Terbitkan Jurnal Terisi
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Riwayat Jurnal Harian ({journalEntries.length})</h3>
          <span className="text-xs text-slate-500">Tersinkron ke dashboard orang tua</span>
        </div>
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
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-sm text-slate-500">
            <BookOpen className="w-6 h-6 mx-auto mb-2 text-slate-400" />
            Belum ada jurnal harian.
          </div>
        )}
      </section>
    </div>
  );
};
