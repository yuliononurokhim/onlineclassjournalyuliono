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
    () => Array.from({ length: 6 }, createJournalRow)
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

    setRows((current) => current.map((row) => ({ ...row, activity: '' })));
    setNotes('');
    setSavedMessage(`${populatedRows.length} jurnal berhasil disimpan; sinkronisasi otomatis berjalan.`);
  };

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Input Bulk Jurnal Harian Pembelajaran</h3>
          <p className="text-xs text-slate-500 mt-1">
            Isi mata pelajaran dan kegiatan tiap jam. CP dan TP diambil dari kurikulum Admin sesuai mata pelajaran.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
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

          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Hari efektif / tanggal</label>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">Satu tanggal berlaku untuk seluruh baris jurnal.</p>
          </div>

          <div className="overflow-x-auto border border-slate-300 rounded-xl">
            <table className="w-full min-w-[1100px] border-collapse text-left text-xs">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="border border-slate-300 px-2 py-2 w-10">No</th>
                  <th className="border border-slate-300 px-2 py-2 min-w-36">Hari/Tanggal</th>
                  <th className="border border-slate-300 px-2 py-2 min-w-20">Jam</th>
                  <th className="border border-slate-300 px-2 py-2 min-w-48">Mata Pelajaran</th>
                  <th className="border border-slate-300 px-2 py-2 min-w-56">Capaian Pembelajaran (CP)</th>
                  <th className="border border-slate-300 px-2 py-2 min-w-56">Tujuan Pembelajaran / Materi (TP)</th>
                  <th className="border border-slate-300 px-2 py-2 min-w-56">Kegiatan</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const objectives = learningObjectives.filter(
                    (objective) => objective.subjectId === row.subjectId
                  );
                  const selectedObjective = objectives.find((objective) => objective.id === row.objectiveId);
                  return (
                    <tr key={index} className="align-top even:bg-slate-50/70">
                      <td className="border border-slate-300 px-2 py-2 text-center">{index + 1}</td>
                      <td className="border border-slate-300 px-2 py-2 whitespace-nowrap">{formatJournalDate(date)}</td>
                      <td className="border border-slate-300 px-2 py-2 font-semibold whitespace-nowrap">ke-{index + 1}</td>
                      <td className="border border-slate-300 p-1.5">
                        <select
                          value={row.subjectId}
                          onChange={(event) => updateRow(index, { subjectId: event.target.value, objectiveId: '' })}
                          className="w-full min-w-44 px-2 py-2 text-xs rounded border border-slate-300 bg-white"
                        >
                          <option value="">Pilih mata pelajaran</option>
                          {availableSubjects.map((subject) => (
                            <option key={subject.id} value={subject.id}>{subject.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="border border-slate-300 px-2 py-2 text-slate-600 leading-relaxed">
                        {selectedObjective?.capaianPembelajaran || 'CP diambil dari data kurikulum Admin setelah TP dipilih.'}
                      </td>
                      <td className="border border-slate-300 p-1.5">
                        <select
                          value={row.objectiveId}
                          onChange={(event) => updateRow(index, { objectiveId: event.target.value })}
                          disabled={!row.subjectId}
                          className="w-full min-w-52 px-2 py-2 text-xs rounded border border-slate-300 bg-white disabled:bg-slate-100"
                        >
                          <option value="">Pilih TP dari kurikulum Admin</option>
                          {objectives.map((objective) => (
                            <option key={objective.id} value={objective.id}>{objective.tujuanPembelajaran}</option>
                          ))}
                        </select>
                      </td>
                      <td className="border border-slate-300 p-1.5">
                        <textarea
                          rows={3}
                          value={row.activity}
                          onChange={(event) => updateRow(index, { activity: event.target.value })}
                          placeholder="Diisi oleh guru"
                          className="w-full min-w-52 px-2 py-2 text-xs rounded border border-slate-300"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={() => setRows((current) => [...current, createJournalRow()])}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            <Plus className="w-4 h-4" /> Tambah jam pelajaran
          </button>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Presensi murid ({students.length})
                </h4>
                <p className="text-[10px] text-slate-500 mt-1">Pilih satu status pada setiap murid. Default: Hadir.</p>
              </div>
              <label className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-indigo-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allPresent}
                  onChange={(event) => setAllAttendance(event.target.checked ? 'hadir' : 'alpa')}
                  className="rounded border-slate-300 text-indigo-600"
                />
                Tandai semua hadir
              </label>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[590px] text-xs">
                <thead>
                  <tr className="text-slate-500">
                    <th className="text-left font-semibold py-2">Nama anak</th>
                    {ATTENDANCE_OPTIONS.map((option) => (
                      <th key={option.value} className="text-center font-semibold px-2 py-2">{option.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
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
