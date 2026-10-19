import React, { useMemo, useState } from 'react';
import { useEduStore } from '../../services/store';
import { ClassJournalEntry } from '../../types';
import { getLocalDateString } from '../../services/date';
import { BookOpen, Clock, Plus, Trash2 } from 'lucide-react';

type AttendanceStatus = NonNullable<ClassJournalEntry['attendanceByStudent']>[string];
type JournalSlot = { start: string; end: string };

interface ClassJournalTabProps {
  subjectScope?: 'all' | 'pai';
}

const TIME_OPTIONS = Array.from({ length: 96 }, (_, index) => {
  const hour = Math.floor(index / 4).toString().padStart(2, '0');
  const minute = ((index % 4) * 15).toString().padStart(2, '0');
  return `${hour}:${minute}`;
});

function isEffectiveWeekday(date: string): boolean {
  const day = new Date(`${date}T12:00:00`).getDay();
  return day !== 0 && day !== 6;
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
      /pai|islamic|literacy|keislaman/i.test(`${subject.name} ${subject.code}`)
    );
    return paiSubjects.length ? paiSubjects : subjects;
  }, [subjectScope, subjects]);
  const initialSubject = availableSubjects[0]?.id || '';
  const [date, setDate] = useState(getLocalDateString());
  const [subjectId, setSubjectId] = useState(initialSubject);
  const [objectiveId, setObjectiveId] = useState('');
  const [tpDescription, setTpDescription] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [slots, setSlots] = useState<JournalSlot[]>([{ start: '07:30', end: '09:00' }]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [formError, setFormError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

  const objectives = learningObjectives.filter((objective) => objective.subjectId === subjectId);
  const allPresent = students.length > 0 && students.every(
    (student) => (attendance[student.id] || 'hadir') === 'hadir'
  );

  const setAllAttendance = (status: AttendanceStatus) => {
    setAttendance(Object.fromEntries(students.map((student) => [student.id, status])));
  };

  const updateAttendance = (studentId: string, status: AttendanceStatus) => {
    setAttendance((current) => ({ ...current, [studentId]: status }));
  };

  const updateSlot = (index: number, field: keyof JournalSlot, value: string) => {
    setSlots((current) => current.map((slot, slotIndex) =>
      slotIndex === index ? { ...slot, [field]: value } : slot
    ));
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');
    setSavedMessage('');
    if (!isEffectiveWeekday(date)) {
      setFormError('Pilih tanggal hari efektif sekolah (Senin–Jumat).');
      return;
    }
    if (!availableSubjects.some((subject) => subject.id === subjectId)) {
      setFormError('Pilih mata pelajaran yang tersedia.');
      return;
    }
    if (students.length === 0) {
      setFormError('Daftar murid kelas belum tersedia. Jurnal belum dapat disimpan.');
      return;
    }
    if (!activityDescription.trim() || !tpDescription.trim()) {
      setFormError('TP dan materi/kegiatan pembelajaran wajib diisi.');
      return;
    }
    if (slots.some((slot) => slot.start >= slot.end)) {
      setFormError('Jam selesai harus lebih besar daripada jam mulai pada setiap sesi.');
      return;
    }

    const subject = availableSubjects.find((item) => item.id === subjectId)!;
    const objective = objectives.find((item) => item.id === objectiveId);
    const attendanceByStudent = Object.fromEntries(
      students.map((student) => [student.id, attendance[student.id] || 'hadir'])
    ) as Record<string, AttendanceStatus>;
    const counts = {
      attendancePresent: Object.values(attendanceByStudent).filter((status) => status === 'hadir').length,
      attendanceSick: Object.values(attendanceByStudent).filter((status) => status === 'sakit').length,
      attendancePermit: Object.values(attendanceByStudent).filter((status) => status === 'izin').length,
      attendanceAbsent: Object.values(attendanceByStudent).filter((status) => status === 'alpa').length,
    };

    addJournalEntries(slots.map((slot) => ({
      date,
      timeSlot: `${slot.start} - ${slot.end}`,
      subjectId: subject.id,
      subjectName: subject.name,
      learningObjectiveId: objectiveId || undefined,
      cpDescription: objective?.capaianPembelajaran || 'Capaian pembelajaran sesuai kurikulum yang berlaku.',
      tpDescription: tpDescription.trim(),
      activityDescription: activityDescription.trim(),
      ...counts,
      attendanceByStudent,
      notes: notes.trim() || undefined,
      teacherName: currentUser?.name || 'Guru',
    })));

    setActivityDescription('');
    setNotes('');
    setFormError('');
    setSavedMessage(`${slots.length} jurnal berhasil disimpan; sinkronisasi otomatis berjalan.`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <section className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Input Jurnal Harian Pembelajaran</h3>
          <p className="text-xs text-slate-500 mt-1">
            Isi satu kali untuk beberapa sesi; setiap sesi disimpan dan disinkronkan ke jurnal kelas.
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Hari efektif / tanggal</label>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">Jurnal hanya dapat disimpan untuk hari sekolah Senin–Jumat.</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">Jam pelajaran (format 24 jam)</label>
              <button
                type="button"
                onClick={() => setSlots((current) => [...current, { start: '09:00', end: '10:00' }])}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah sesi
              </button>
            </div>
            <div className="space-y-2">
              {slots.map((slot, index) => (
                <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                  <label className="text-[10px] text-slate-500">
                    Mulai
                    <select
                      value={slot.start}
                      onChange={(event) => updateSlot(index, 'start', event.target.value)}
                      className="mt-1 w-full px-2 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                    >
                      {TIME_OPTIONS.map((time) => <option key={time} value={time}>{time}</option>)}
                    </select>
                  </label>
                  <label className="text-[10px] text-slate-500">
                    Selesai
                    <select
                      value={slot.end}
                      onChange={(event) => updateSlot(index, 'end', event.target.value)}
                      className="mt-1 w-full px-2 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                    >
                      {TIME_OPTIONS.map((time) => <option key={time} value={time}>{time}</option>)}
                    </select>
                  </label>
                  <button
                    type="button"
                    disabled={slots.length === 1}
                    onClick={() => setSlots((current) => current.filter((_, slotIndex) => slotIndex !== index))}
                    aria-label="Hapus sesi"
                    className="p-2 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mata pelajaran</label>
            <select
              value={subjectId}
              onChange={(event) => {
                setSubjectId(event.target.value);
                setObjectiveId('');
                setTpDescription('');
              }}
              required
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
            >
              {availableSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name} ({subject.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Acuan CP / TP kurikulum (opsional)</label>
            <select
              value={objectiveId}
              onChange={(event) => {
                const id = event.target.value;
                setObjectiveId(id);
                const selected = objectives.find((objective) => objective.id === id);
                if (selected) setTpDescription(selected.tujuanPembelajaran);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
            >
              <option value="">-- Isi TP / materi secara manual --</option>
              {objectives.map((objective) => (
                <option key={objective.id} value={objective.id}>{objective.tujuanPembelajaran}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">TP / materi pembelajaran</label>
            <textarea
              rows={3}
              value={tpDescription}
              onChange={(event) => setTpDescription(event.target.value)}
              required
              placeholder="Tuliskan tujuan pembelajaran atau materi yang diajarkan..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Kegiatan belajar di kelas</label>
            <textarea
              rows={3}
              value={activityDescription}
              onChange={(event) => setActivityDescription(event.target.value)}
              required
              placeholder="Uraikan proses belajar, praktik, diskusi, atau tugas siswa..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                Presensi seluruh murid ({students.length})
              </span>
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
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-200">
              {students.map((student) => {
                const status = attendance[student.id] || 'hadir';
                return (
                  <div key={student.id} className="py-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      aria-label={`Tandai ${student.name} hadir`}
                      checked={status === 'hadir'}
                      onChange={(event) => updateAttendance(student.id, event.target.checked ? 'hadir' : 'alpa')}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    <span className="flex-1 min-w-0 text-xs text-slate-700 truncate">{student.name}</span>
                    <select
                      aria-label={`Status kehadiran ${student.name}`}
                      value={status}
                      onChange={(event) => updateAttendance(student.id, event.target.value as AttendanceStatus)}
                      className="px-2 py-1 text-[11px] rounded border border-slate-300 bg-white"
                    >
                      <option value="hadir">Hadir</option>
                      <option value="sakit">Sakit</option>
                      <option value="izin">Izin</option>
                      <option value="alpa">Alpa</option>
                    </select>
                  </div>
                );
              })}
              {students.length === 0 && <p className="text-xs text-slate-500 py-2">Belum ada data murid di kelas.</p>}
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
            Simpan & Terbitkan {slots.length > 1 ? `${slots.length} Jurnal` : 'Jurnal'}
          </button>
        </form>
      </section>

      <section className="lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Riwayat Jurnal Harian ({journalEntries.length})</h3>
          <span className="text-xs text-slate-500">Tersinkron ke dashboard orang tua</span>
        </div>
        {journalEntries.map((entry) => (
          <article key={entry.id} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">{entry.subjectName}</span>
                <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {entry.timeSlot}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">{entry.date}</span>
            </div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Tujuan pembelajaran (TP)</p>
            <p className="text-xs font-semibold text-slate-800">{entry.tpDescription}</p>
            <p className="text-xs text-slate-700 leading-relaxed">{entry.activityDescription}</p>
            {entry.notes && (
              <p className="text-xs bg-amber-50 border border-amber-200 text-amber-900 p-2.5 rounded-lg">{entry.notes}</p>
            )}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
              <span className="flex flex-wrap gap-3">
                <span className="text-emerald-700 font-semibold">Hadir: {entry.attendancePresent}</span>
                <span className="text-amber-700">Sakit: {entry.attendanceSick}</span>
                <span className="text-blue-700">Izin: {entry.attendancePermit}</span>
                <span className="text-rose-700">Alpa: {entry.attendanceAbsent}</span>
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
                Hapus jurnal
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
