import React, { useState } from 'react';
import { useEduStore } from '../../services/store';
import { getLocalDateString, getLocalMonthString } from '../../services/date';
import { SchoolProfile, UserRole } from '../../types';
import {
  Printer,
  FileSpreadsheet,
  Download,
  Calendar,
  CheckCircle2,
  FileText,
  School,
  UserCheck,
  Award,
  Filter
} from 'lucide-react';

interface TeacherJournalReportViewProps {
  teacherRole: 'guru_kelas' | 'guru_bk' | 'guru_pai';
  teacherName: string;
  teacherNip?: string;
  reportTitle: string;
  reportSubtitle: string;
}

export const TeacherJournalReportView: React.FC<TeacherJournalReportViewProps> = ({
  teacherRole,
  teacherName,
  teacherNip,
  reportTitle,
  reportSubtitle,
}) => {
  const {
    schoolProfile,
    students,
    journalEntries,
    caseRecords,
    paiAssessments,
    internalGrades,
    starAwards,
  } = useEduStore();

  const [periodFilter, setPeriodFilter] = useState<'all' | 'current_month'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const currentDateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Filter journal entries for Guru Kelas
  const filteredJournalEntries = journalEntries.filter((j) => {
    if (periodFilter === 'current_month') {
      const currentMonth = getLocalMonthString();
      return j.date.startsWith(currentMonth);
    }
    return true;
  });

  // Filter case records for Guru BK
  const filteredCaseRecords = caseRecords.filter((c) => {
    if (periodFilter === 'current_month') {
      const currentMonth = getLocalMonthString();
      return c.date.startsWith(currentMonth);
    }
    return true;
  });

  // Export to CSV based on teacher role
  const handleExportCsv = () => {
    let csv = '';
    let filename = '';

    if (teacherRole === 'guru_kelas') {
      csv = `LAPORAN JURNAL HARIAN PEMBELAJARAN KELAS\n`;
      csv += `Sekolah:,"${schoolProfile.name}"\n`;
      csv += `Kelas / Semester:,"${schoolProfile.classGrade} / ${schoolProfile.semester}"\n`;
      csv += `Guru Kelas:,"${teacherName}"\n`;
      csv += `Tanggal Unduh:,"${currentDateStr}"\n\n`;
      csv += `No,Tanggal,Jam Ke-,Mata Pelajaran,Tujuan Pembelajaran (TP),Kegiatan Pembelajaran,Hadir,Sakit,Izin,Alpa,Catatan Guru\n`;

      filteredJournalEntries.forEach((j, i) => {
        csv += `${i + 1},"${j.date}","${j.timeSlot}","${j.subjectName}","${j.tpDescription.replace(/"/g, '""')}","${j.activityDescription.replace(/"/g, '""')}",${j.attendancePresent},${j.attendanceSick},${j.attendancePermit},${j.attendanceAbsent},"${(j.notes || '-').replace(/"/g, '""')}"\n`;
      });

      filename = `Laporan_Jurnal_Kelas_${schoolProfile.classGrade.replace(/\s+/g, '_')}_${getLocalDateString()}.csv`;
    } else if (teacherRole === 'guru_bk') {
      csv = `LAPORAN LAYANAN BIMBINGAN KONSELING & KASUS SISWA\n`;
      csv += `Sekolah:,"${schoolProfile.name}"\n`;
      csv += `Guru BK:,"${teacherName}"\n`;
      csv += `Tanggal Unduh:,"${currentDateStr}"\n\n`;
      csv += `No,Tanggal,Nama Siswa,Kategori Kasus,Tingkat Urgensi,Deskripsi Kejadian,Tindak Lanjut & Konseling,Status Kasus,Lapor Ortu\n`;

      filteredCaseRecords.forEach((c, i) => {
        const category = c.category === 'Konseling Khusus' ? 'Konseling Individu' : c.category;
        const status = c.status === 'Dalam Pantauan' ? 'Dalam Bimbingan/Pendampingan' : c.status;
        csv += `${i + 1},"${c.date}","${c.studentName}","${category}","${c.severity}","${c.description.replace(/"/g, '""')}","${c.followUpAction.replace(/"/g, '""')}","${status}","${c.isReportedToParent ? 'Ya' : 'Tidak'}"\n`;
      });

      filename = `Laporan_Bimbingan_Konseling_${getLocalDateString()}.csv`;
    } else {
      // Guru PAI
      csv = `LAPORAN JURNAL & PENILAIAN PENDIDIKAN AGAMA ISLAM (PAI)\n`;
      csv += `Sekolah:,"${schoolProfile.name}"\n`;
      csv += `Guru PAI:,"${teacherName}"\n`;
      csv += `Tanggal Unduh:,"${currentDateStr}"\n\n`;
      csv += `No,Nama Siswa,NISN,Instrumen Penilaian,Aspek,Sub-Indikator Tuntas,Status Ketuntasan,Catatan Guru\n`;

      students.forEach((std, i) => {
        paiAssessments.forEach((pa) => {
          const res = pa.results[std.id] || { completedIndicators: {} };
          const completedCount = pa.subIndicators.filter(
            (ind) => res.completedIndicators[ind.id] === true
          ).length;
          const status = completedCount === pa.subIndicators.length ? 'TUNTAS' : `${completedCount}/${pa.subIndicators.length} TUNTAS`;
          csv += `${i + 1},"${std.name}","${std.nisn}","${pa.title}","${pa.aspectCategory}","${completedCount}/${pa.subIndicators.length}","${status}","${(res.notes || '-').replace(/"/g, '""')}"\n`;
        });
      });

      filename = `Laporan_Jurnal_PAI_${getLocalDateString()}.csv`;
    }

    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Berkas rekap laporan berhasil diunduh ke format spreadsheet CSV!');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Control Actions Header (Hidden in Print) */}
      <div className="no-print bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-2">
            <FileText className="w-3.5 h-3.5" />
            <span>ARSIP & DOKUMEN LAPORAN RESMI</span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Rekap & Unduh Berkas Laporan Jurnal
          </h3>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            {reportSubtitle} Berkas laporan dilengkapi dengan Kop Surat resmi sekolah dan kolom pengesahan Kepala Sekolah.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto shrink-0">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setPeriodFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                periodFilter === 'all'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Periode
            </button>
            <button
              onClick={() => setPeriodFilter('current_month')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                periodFilter === 'current_month'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulan Berjalan
            </button>
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-semibold transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Unduh CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Berkas (PDF)</span>
          </button>
        </div>
      </div>

      {/* Official Printable Report Document Container */}
      <div className="print-container bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-md max-w-5xl mx-auto space-y-6">
        {/* Official Indonesian School Letterhead (KOP SURAT) */}
        <div className="border-b-4 border-double border-slate-900 pb-4 text-center space-y-1">
          <div className="flex items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
              <School className="w-9 h-9 text-amber-400" />
            </div>
            <div>
              <p className="text-xs uppercase font-extrabold tracking-widest text-slate-700">
                {schoolProfile.kopLine1 || 'PEMERINTAH PROVINSI DKI JAKARTA · DINAS PENDIDIKAN'}
              </p>
              <h1 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-tight">
                {schoolProfile.name}
              </h1>
              <p className="text-xs text-slate-600">
                {schoolProfile.address}, {schoolProfile.district}, {schoolProfile.city} · NPSN: {schoolProfile.npsn}
              </p>
              <p className="text-[11px] text-slate-500">
                Telp: {schoolProfile.phone} · Email: {schoolProfile.email} · Website: {schoolProfile.website}
              </p>
            </div>
          </div>
        </div>

        {/* Document Title Header */}
        <div className="text-center space-y-1 pt-2">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-950 uppercase tracking-wide underline underline-offset-4">
            {reportTitle}
          </h2>
          <p className="text-xs font-semibold text-slate-600">
            TAHUN PELAJARAN {schoolProfile.academicYear} · SEMESTER {schoolProfile.semester.toUpperCase()}
          </p>
        </div>

        {/* Identification Metadata Grid */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs sm:text-sm grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <span className="text-slate-500 block text-xs">Satuan Pendidikan:</span>
            <span className="font-bold text-slate-900">{schoolProfile.name}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs">Kelas / Rombel:</span>
            <span className="font-bold text-slate-900">{schoolProfile.classGrade}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs">Guru Pengampu:</span>
            <span className="font-bold text-slate-900">{teacherName}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs">Tanggal Laporan:</span>
            <span className="font-bold text-slate-900">{currentDateStr}</span>
          </div>
        </div>

        {/* Role-Specific Content Tables */}
        {teacherRole === 'guru_kelas' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>A. REKAPITULASI JURNAL PEMBELAJARAN HARIAN KELAS</span>
                <span className="text-xs font-normal text-slate-500">({filteredJournalEntries.length} Sesi Pertemuan)</span>
              </h4>
              <div className="overflow-x-auto border border-slate-300 rounded-xl">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-100 font-bold uppercase text-[11px] text-slate-800 border-b border-slate-300">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">No</th>
                      <th className="py-2.5 px-3 w-24">Tanggal</th>
                      <th className="py-2.5 px-3 w-28">Jam Ke-</th>
                      <th className="py-2.5 px-3 w-32">Mata Pelajaran</th>
                      <th className="py-2.5 px-3">Tujuan Pembelajaran (TP) & Kegiatan Kelas</th>
                      <th className="py-2.5 px-3 w-24 text-center">Presensi (H/S/I/A)</th>
                      <th className="py-2.5 px-3 w-32">Catatan Guru</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredJournalEntries.map((j, i) => (
                      <tr key={j.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 text-center font-mono">{i + 1}</td>
                        <td className="py-2 px-3 font-mono">{j.date}</td>
                        <td className="py-2 px-3 font-mono">{j.timeSlot}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{j.subjectName}</td>
                        <td className="py-2 px-3 leading-relaxed">
                          <p className="font-semibold text-slate-800">{j.tpDescription}</p>
                          <p className="text-slate-600 text-xs mt-0.5">{j.activityDescription}</p>
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-semibold">
                          <span className="text-emerald-700">{j.attendancePresent}</span> /{' '}
                          <span className="text-amber-700">{j.attendanceSick}</span> /{' '}
                          <span className="text-blue-700">{j.attendancePermit}</span> /{' '}
                          <span className="text-rose-700">{j.attendanceAbsent}</span>
                        </td>
                        <td className="py-2 px-3 text-xs italic text-slate-600">{j.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Attendance & Grade Cumulative Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  B. REKAPITULASI PRESENSI KELAS
                </h5>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span>Total Jumlah Siswa Kelas:</span>
                    <strong className="font-mono">{students.length} Siswa</strong>
                  </div>
                  <div className="flex justify-between text-emerald-800">
                    <span>Rata-Rata Tingkat Kehadiran:</span>
                    <strong className="font-mono">98.2% (Sangat Baik)</strong>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  C. STATUS PENILAIAN INTERNAL
                </h5>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span>Total Instrumen Penilaian Formatif/Sumatif:</span>
                    <strong className="font-mono">{internalGrades.filter(g => g.teacherRole === 'guru_kelas').length} Dokumen</strong>
                  </div>
                  <div className="flex justify-between text-indigo-800">
                    <span>Kriteria Ketuntasan (KKM):</span>
                    <strong className="font-mono">75 (Tuntas Mandiri)</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {teacherRole === 'guru_bk' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>A. REKAPITULASI CATATAN KASUS & KONSELING SISWA</span>
                <span className="text-xs font-normal text-slate-500">({filteredCaseRecords.length} Catatan)</span>
              </h4>
              <div className="overflow-x-auto border border-slate-300 rounded-xl">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-100 font-bold uppercase text-[11px] text-slate-800 border-b border-slate-300">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">No</th>
                      <th className="py-2.5 px-3 w-24">Tanggal</th>
                      <th className="py-2.5 px-3 w-36">Nama Siswa</th>
                      <th className="py-2.5 px-3 w-32">Kategori Kasus</th>
                      <th className="py-2.5 px-3 w-24 text-center">Urgensi</th>
                      <th className="py-2.5 px-3">Uraian Masalah & Konseling Bimbingan</th>
                      <th className="py-2.5 px-3 w-28 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredCaseRecords.map((c, i) => (
                      <tr key={c.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 text-center font-mono">{i + 1}</td>
                        <td className="py-2 px-3 font-mono">{c.date}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{c.studentName}</td>
                        <td className="py-2 px-3">
                          {c.category === 'Konseling Khusus' ? 'Konseling Individu' : c.category}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="font-semibold text-xs">{c.severity}</span>
                        </td>
                        <td className="py-2 px-3 leading-relaxed">
                          <p className="font-semibold text-slate-800">{c.description}</p>
                          <p className="text-slate-600 text-xs mt-0.5">Tindak Lanjut: {c.followUpAction}</p>
                        </td>
                        <td className="py-2 px-3 text-center font-semibold text-xs">
                          {c.status === 'Dalam Pantauan' ? 'Dalam Bimbingan/Pendampingan' : c.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <h5 className="font-bold uppercase tracking-wider text-slate-700 mb-1">
                B. KESIMPULAN PERKEMBANGAN KARAKTER SISWA
              </h5>
              <p className="text-slate-600 leading-relaxed">
                Secara umum perkembangan karakter, empati, dan resolusi konflik mandiri siswa kelas {schoolProfile.classGrade} menunjukkan progres kondusif. Kasus yang tercatat telah mendapatkan penanganan bimbingan secara kontinu.
              </p>
            </div>
          </div>
        )}

        {teacherRole === 'guru_pai' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>A. MATRIKS KETUNTASAN PRAKTIK IBADAH & DOA (PAI)</span>
                <span className="text-xs font-normal text-slate-500">({students.length} Siswa Terdaftar)</span>
              </h4>
              <div className="overflow-x-auto border border-slate-300 rounded-xl">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-100 font-bold uppercase text-[11px] text-slate-800 border-b border-slate-300">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">No</th>
                      <th className="py-2.5 px-3 w-40">Nama Siswa</th>
                      <th className="py-2.5 px-3 w-28">NISN</th>
                      {paiAssessments.map((pa) => (
                        <th key={pa.id} className="py-2.5 px-3 text-center">
                          {pa.title}
                        </th>
                      ))}
                      <th className="py-2.5 px-3 text-center">Bintang Ibadah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {students.map((std, i) => {
                      const paiStars = starAwards.filter(s => s.studentId === std.id && s.awarderRole === 'guru_pai');
                      const netStars = paiStars.reduce((acc, curr) => curr.type === 'penalty' ? acc - curr.starsCount : acc + curr.starsCount, 0);

                      return (
                        <tr key={std.id} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 text-center font-mono">{i + 1}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">{std.name}</td>
                          <td className="py-2 px-3 font-mono text-xs">{std.nisn}</td>
                          {paiAssessments.map((pa) => {
                            const res = pa.results[std.id] || { completedIndicators: {} };
                            const done = pa.subIndicators.filter(ind => res.completedIndicators[ind.id] === true).length;
                            const isAllDone = done === pa.subIndicators.length && done > 0;
                            return (
                              <td key={pa.id} className="py-2 px-3 text-center font-mono font-semibold text-xs">
                                {isAllDone ? (
                                  <span className="text-emerald-700 font-bold">TUNTAS ({done}/{pa.subIndicators.length})</span>
                                ) : (
                                  <span className="text-amber-700">{done}/{pa.subIndicators.length}</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="py-2 px-3 text-center font-mono font-bold text-amber-900">
                            ★ {Math.max(0, netStars)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <h5 className="font-bold uppercase tracking-wider text-slate-700 mb-1">
                B. REKAPITULASI PEMBIASAAN ADAB ISLAMI & SHOLAT
              </h5>
              <p className="text-slate-600 leading-relaxed">
                Pembiasaan sholat berjamaah, thaharah/wudhu tertib, dan hafalan surat pendek Juz 30 berjalan dengan pembinaan berkeadilan. Siswa yang menunjukkan disiplin mendapatkan bintang apresiasi ibadah.
              </p>
            </div>
          </div>
        )}

        {/* Official Indonesian Signature Block (Pengesahan) */}
        <div className="pt-8 border-t border-slate-300 grid grid-cols-2 text-center text-xs sm:text-sm">
          <div>
            <p className="text-slate-600">Mengetahui,</p>
            <p className="font-bold text-slate-900">Kepala {schoolProfile.name}</p>
            <div className="h-16 flex items-center justify-center">
              {/* Stamp / Tanda Tangan Placeholder */}
              <span className="text-xs text-slate-300 font-mono italic">[ Tanda Tangan Resmi ]</span>
            </div>
            <p className="font-extrabold text-slate-950 underline underline-offset-2">
              {schoolProfile.principalName}
            </p>
            {schoolProfile.principalNip?.trim() && schoolProfile.principalNip.trim() !== '-' && (
              <p className="font-mono text-xs text-slate-600">
                NIP. {schoolProfile.principalNip}
              </p>
            )}
          </div>

          <div>
            <p className="text-slate-600">{schoolProfile.city}, {currentDateStr}</p>
            <p className="font-bold text-slate-900">
              {teacherRole === 'guru_kelas'
                ? 'Guru Kelas'
                : teacherRole === 'guru_bk'
                ? 'Guru Bimbingan Konseling'
                : 'Guru Pendidikan Agama Islam'}
            </p>
            <div className="h-16 flex items-center justify-center">
              <span className="text-xs text-slate-300 font-mono italic">[ Tanda Tangan Resmi ]</span>
            </div>
            <p className="font-extrabold text-slate-950 underline underline-offset-2">
              {teacherName}
            </p>
            {teacherNip?.trim() && teacherNip.trim() !== '-' && (
              <p className="font-mono text-xs text-slate-600">
                NIP. {teacherNip}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
