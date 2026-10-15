/**
 * EduJournal SD - Type Definitions
 */

export type UserRole = 'admin' | 'guru_kelas' | 'guru_bk' | 'guru_pai' | 'orangtua';

export interface UserAccount {
  id: string;
  username: string;
  password: string; // Plaintext for school demo & admin recovery
  role: UserRole;
  name: string;
  title: string; // e.g. "Wali Kelas 4-A", "Guru BK", "Orang Tua dari Adam"
  studentId?: string; // Tautan ke anak (hanya untuk orang tua)
  nip?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  status?: 'aktif' | 'nonaktif';
  subjectAssignment?: string;
}

export interface SubjectItem {
  id: string;
  name: string;
  code: string;
  teacherName: string;
}

export interface LearningObjective {
  id: string;
  subjectId: string;
  subjectName: string;
  capaianPembelajaran: string; // CP
  tujuanPembelajaran: string; // TP
  semester: 'Ganjil' | 'Genap';
  grade: string;
}

export interface SchoolProfile {
  name: string;
  npsn: string;
  address: string;
  district: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
  website: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  classGrade: string;
  kopLine1: string;
  kopLine2: string;
  kopSubtext: string;
  principalName: string;
  principalNip: string;
  logoUrl?: string;
  heroTagline?: string;
  heroTitle?: string;
  heroDescription?: string;
}

export interface Student {
  id: string;
  nisn: string;
  name: string;
  gender: 'L' | 'P';
  parentName: string;
  parentPhone: string;
  parentUsername: string;
  parentPassword: string;
  avatarBgColor?: string;
  classRole?: string;
  classRoleDuty?: string;
}

export interface ClassJournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "07:30 - 09:00"
  subjectId: string;
  subjectName: string;
  learningObjectiveId?: string;
  cpDescription: string;
  tpDescription: string;
  activityDescription: string;
  attendancePresent: number;
  attendanceSick: number;
  attendancePermit: number;
  attendanceAbsent: number;
  notes?: string;
  teacherName: string;
}

export type StarActionType = 'reward' | 'penalty';

export interface StarAward {
  id: string;
  studentId: string;
  studentName: string;
  awarderRole: 'guru_kelas' | 'guru_bk' | 'guru_pai';
  awarderName: string;
  type: StarActionType; // 'reward' = (+) apresiasi, 'penalty' = (-) pengurangan pelanggaran
  category: string; // e.g. 'Keaktifan Belajar' or 'Pelanggaran Disiplin'
  starsCount: number; // 1 to 5
  note: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
}

export interface CaseRecord {
  id: string;
  studentId: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  category: 'Perlu Perhatian' | 'Pelanggaran Ringan' | 'Konseling Khusus' | 'Apresiasi Karakter Positif';
  severity: 'Ringan' | 'Sedang' | 'Perlu Perhatian';
  description: string;
  followUpAction: string;
  isReportedToParent: boolean;
  status: 'Dalam Pantauan' | 'Selesai' | 'Jadwal Pertemuan Orang Tua';
  counselorName: string;
  timestamp: number;
}

export interface PaiSubIndicator {
  id: string;
  name: string;
}

export interface PaiAssessment {
  id: string;
  title: string; // Nama Penilaian, e.g. "Praktik Tata Cara Wudhu & Doa"
  aspectCategory: string; // Aspek Penilaian, e.g. "Fiqih Ibadah", "Al-Qur'an Hadits", "Akhlakul Karimah"
  date: string;
  subIndicators: PaiSubIndicator[];
  results: {
    [studentId: string]: {
      completedIndicators: { [subIndicatorId: string]: boolean };
      notes?: string;
      evaluatedAt?: string;
    };
  };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderRole: UserRole;
  senderName: string;
  recipientId: string;
  recipientRole: UserRole;
  recipientName: string;
  studentId: string; // Topik murid yang dibahas
  studentName: string;
  content: string;
  timestamp: number;
  isRead: boolean;
}

export interface SchoolAnnouncement {
  id: string;
  title: string;
  content: string;
  date: string;
  category: 'Akademik' | 'Kegiatan' | 'Libur' | 'Penting';
  author: string;
}

export type AssessmentType =
  | 'Formatif Harian'
  | 'Sumatif Lingkup Materi'
  | 'Sumatif Akhir Semester'
  | 'Tugas / Modul Proyek'
  | 'Praktik & Unjuk Kerja';

export interface InternalScoreDetail {
  score: number; // 0 - 100
  predicate: 'A' | 'B' | 'C' | 'D';
  notes?: string;
}

export interface InternalGradeRecord {
  id: string;
  teacherRole: 'guru_kelas' | 'guru_bk' | 'guru_pai';
  teacherName: string;
  subjectName: string;
  assessmentTitle: string;
  assessmentType: AssessmentType;
  date: string;
  kkmScore: number; // e.g. 75
  learningObjectiveId?: string;
  tpDescription?: string;
  scores: {
    [studentId: string]: InternalScoreDetail;
  };
  isInternalOnly: boolean; // Flag verifying this is confidential & excluded from parent view
  timestamp: number;
}

