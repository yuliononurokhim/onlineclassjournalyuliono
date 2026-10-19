import React, { useEffect, useMemo, useState } from 'react';
import { Download, FileSpreadsheet, RefreshCw, ShieldCheck } from 'lucide-react';
import { useEduStore } from '../../services/store';
import { InternalGradeRecord, UserRole } from '../../types';
import { FirebaseSyncState, subscribeFirebaseStatus } from '../../services/firebase';

type TeacherRole = Extract<UserRole, 'guru_kelas' | 'guru_bk' | 'guru_pai'>;

interface GradeLedgerRow {
  studentId: string;
  studentName: string;
  nisn: string;
  teacherRole: TeacherRole;
  teacherName: string;
  subjectName: string;
  assessmentTitle: string;
  assessmentType: string;
  date: string;
  score: number;
  scoreUnit: '%' | '';
  predicate: string;
  notes: string;
}

interface GradeLedgerTabProps {
  teacherRole?: TeacherRole;
}

const ROLE_LABELS: Record<TeacherRole, string> = {
  guru_kelas: 'Guru Kelas',
  guru_bk: 'Guru BK',
  guru_pai: 'Guru PAI',
};

const emptySyncState: FirebaseSyncState = {
  isConnected: false,
  projectId: 'onlineclassjournalyuliono',
  lastSyncTime: null,
  error: null,
  syncedCollectionsCount: 0,
};

function csvCell(value: string | number): string {
  const safeValue = typeof value === 'string' && /^[=+\-@]/.test(value) ? `'${value}` : String(value);
  return `"${safeValue.replace(/"/g, '""')}"`;
}

function normalizeTeacherName(name: string): string {
  return name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

export const GradeLedgerTab: React.FC<GradeLedgerTabProps> = ({ teacherRole }) => {
  const { students, internalGrades, paiAssessments, users, schoolProfile } = useEduStore();
  const [roleFilter, setRoleFilter] = useState<TeacherRole | 'all'>(teacherRole || 'all');
  const [studentFilter, setStudentFilter] = useState('all');
  const [firebaseStatus, setFirebaseStatus] = useState<FirebaseSyncState>(emptySyncState);

  useEffect(() => subscribeFirebaseStatus(setFirebaseStatus), []);

  const rows = useMemo<GradeLedgerRow[]>(() => {
    const studentById = new Map(students.map((student) => [student.id, student]));
    const resolveTeacherName = (role: TeacherRole, recordedName: string): string => {
      const roleUsers = users.filter((user) => user.role === role);
      const normalizedRecordedName = normalizeTeacherName(recordedName);
      const matchingUser = roleUsers.find(
        (user) => normalizeTeacherName(user.name) === normalizedRecordedName
      );
      if (matchingUser) return matchingUser.name;

      const activeRoleUsers = roleUsers.filter((user) => user.status !== 'nonaktif');
      return activeRoleUsers.length === 1 ? activeRoleUsers[0].name : recordedName;
    };
    const ledgerRows: GradeLedgerRow[] = [];
    const grades = internalGrades.filter(
      (grade) => grade.isInternalOnly && (!teacherRole || grade.teacherRole === teacherRole)
    );

    grades.forEach((grade: InternalGradeRecord) => {
      Object.entries(grade.scores).forEach(([studentId, detail]) => {
        const student = studentById.get(studentId);
        ledgerRows.push({
          studentId,
          studentName: student?.name || `Siswa belum terhubung (${studentId})`,
          nisn: student?.nisn || '-',
          teacherRole: grade.teacherRole,
          teacherName: resolveTeacherName(grade.teacherRole, grade.teacherName),
          subjectName: grade.subjectName,
          assessmentTitle: grade.assessmentTitle,
          assessmentType: grade.assessmentType,
          date: grade.date,
          score: detail.score,
          scoreUnit: '',
          predicate: detail.predicate,
          notes: detail.notes || '-',
        });
      });
    });

    if (!teacherRole || teacherRole === 'guru_pai') {
      const paiTeacherName = users.find((user) => user.role === 'guru_pai' && user.status !== 'nonaktif')?.name || 'Guru PAI';
      paiAssessments.forEach((assessment) => {
        Object.entries(assessment.results).forEach(([studentId, result]) => {
          const student = studentById.get(studentId);
          const indicatorCount = assessment.subIndicators.length;
          const completedCount = assessment.subIndicators.filter(
            (indicator) => result.completedIndicators[indicator.id] === true
          ).length;
          const score = indicatorCount === 0 ? 0 : Math.round((completedCount / indicatorCount) * 100);
          ledgerRows.push({
            studentId,
            studentName: student?.name || `Siswa belum terhubung (${studentId})`,
            nisn: student?.nisn || '-',
            teacherRole: 'guru_pai',
            teacherName: paiTeacherName,
            subjectName: assessment.aspectCategory,
            assessmentTitle: assessment.title,
            assessmentType: 'Ceklist PAI (% ketuntasan)',
            date: assessment.date,
            score,
            scoreUnit: '%',
            predicate: indicatorCount > 0 && completedCount === indicatorCount ? 'Tuntas' : 'Proses',
            notes: result.notes || `${completedCount} dari ${indicatorCount} indikator tuntas`,
          });
        });
      });
    }

    return ledgerRows
      .filter((row) => roleFilter === 'all' || row.teacherRole === roleFilter)
      .filter((row) => studentFilter === 'all' || row.studentId === studentFilter)
      .sort((a, b) => a.studentName.localeCompare(b.studentName, 'id') || b.date.localeCompare(a.date));
  }, [students, internalGrades, paiAssessments, users, teacherRole, roleFilter, studentFilter]);

  const handleDownload = () => {
    const headers = [
      'NISN',
      'Nama Siswa',
      'Peran Guru',
      'Nama Guru',
      'Mata Pelajaran / Aspek',
      'Jenis Penilaian',
      'Nama Penilaian',
      'Tanggal',
      'Nilai',
      'Predikat',
      'Catatan',
    ];
    const data = rows.map((row) => [
      row.nisn,
      row.studentName,
      ROLE_LABELS[row.teacherRole],
      row.teacherName,
      row.subjectName,
      row.assessmentType,
      row.assessmentTitle,
      row.date,
      `${row.score}${row.scoreUnit}`,
      row.predicate,
      row.notes,
    ]);
    const csv = `\uFEFF${[headers, ...data].map((line) => line.map(csvCell).join(',')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `Leger_Nilai_${roleFilter === 'all' ? 'Semua_Guru' : ROLE_LABELS[roleFilter].replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const meanScore = rows.length
    ? (rows.reduce((sum, row) => sum + row.score, 0) / rows.length).toFixed(1)
    : '0.0';

  return (
    <section className="space-y-5" aria-labelledby="grade-ledger-title">
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 shrink-0 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-700">
                Rekap Nilai Terpadu
              </span>
              <h3 id="grade-ledger-title" className="text-xl font-extrabold text-slate-900">
                Leger Nilai {teacherRole ? ROLE_LABELS[teacherRole] : 'Semua Guru'}
              </h3>
              <p className="mt-1 max-w-3xl text-sm text-slate-600">
                Rekap nilai internal guru dan capaian ceklist PAI, bersumber dari data penilaian yang tersinkron ke Firebase.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {!teacherRole && (
              <select
                aria-label="Filter guru"
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value as TeacherRole | 'all')}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="all">Semua Guru</option>
                {Object.entries(ROLE_LABELS).map(([role, label]) => (
                  <option key={role} value={role}>{label}</option>
                ))}
              </select>
            )}
            <select
              aria-label="Filter siswa"
              value={studentFilter}
              onChange={(event) => setStudentFilter(event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="all">Semua Siswa</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>{student.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleDownload}
              disabled={rows.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Unduh Leger CSV
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="rounded-xl bg-indigo-50 px-4 py-2 text-sm text-indigo-900">
            <strong>{rows.length}</strong> catatan nilai
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-2 text-sm text-slate-700">
            Rata-rata nilai: <strong>{meanScore}</strong>
          </div>
          <div
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${
              firebaseStatus.error
                ? 'border-rose-200 bg-rose-50 text-rose-800'
                : firebaseStatus.isConnected
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
            title={firebaseStatus.error || `Proyek Firebase: ${firebaseStatus.projectId}`}
          >
            {firebaseStatus.error ? <RefreshCw className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
            {firebaseStatus.error
              ? 'Sinkronisasi Firebase bermasalah'
              : firebaseStatus.isConnected
                ? `Tersinkron ke Firebase · ${schoolProfile.academicYear}`
                : 'Menghubungkan ke Firebase'}
          </div>
        </div>
        {firebaseStatus.error && (
          <p role="alert" className="mt-2 text-xs text-rose-700">
            {firebaseStatus.error}
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Belum ada data penilaian untuk filter yang dipilih.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1050px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3">Siswa</th>
                  {!teacherRole && <th className="px-4 py-3">Guru</th>}
                  <th className="px-4 py-3">Mapel / Aspek</th>
                  <th className="px-4 py-3">Penilaian</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3 text-center">Nilai</th>
                  <th className="px-4 py-3 text-center">Predikat</th>
                  <th className="px-4 py-3">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, index) => (
                  <tr key={`${row.teacherRole}-${row.studentId}-${row.assessmentTitle}-${row.date}-${index}`} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{row.studentName}</div>
                      <div className="text-xs text-slate-500">NISN {row.nisn}</div>
                    </td>
                    {!teacherRole && (
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{row.teacherName}</div>
                        <div className="text-xs text-slate-500">{ROLE_LABELS[row.teacherRole]}</div>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{row.subjectName}</div>
                      <div className="text-xs text-slate-500">{row.assessmentType}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{row.assessmentTitle}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{row.date}</td>
                    <td className="px-4 py-3 text-center font-bold text-slate-900">{row.score}{row.scoreUnit}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex min-w-8 justify-center rounded-full bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-800">
                        {row.predicate}
                      </span>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-slate-600">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-slate-500">
        Nilai ini bersifat internal untuk tenaga pendidik dan administrator; akses orang tua tidak ditampilkan di menu ini.
      </p>
    </section>
  );
};
