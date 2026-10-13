import { useState, useEffect, useCallback } from 'react';
import {
  SchoolProfile,
  SubjectItem,
  LearningObjective,
  UserAccount,
  Student,
  ClassJournalEntry,
  StarAward,
  CaseRecord,
  PaiAssessment,
  ChatMessage,
  SchoolAnnouncement,
  UserRole,
  InternalGradeRecord,
} from '../types';
import {
  INITIAL_SCHOOL_PROFILE,
  INITIAL_SUBJECTS,
  INITIAL_LEARNING_OBJECTIVES,
  INITIAL_STUDENTS,
  INITIAL_USERS,
  INITIAL_JOURNAL_ENTRIES,
  INITIAL_STAR_AWARDS,
  INITIAL_CASE_RECORDS,
  INITIAL_PAI_ASSESSMENTS,
  INITIAL_MESSAGES,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_INTERNAL_GRADES,
} from './mockData';

const STORAGE_KEY_PREFIX = 'edujournal_sd_v1_';

function getStoredItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading localStorage for key', key, e);
    return defaultValue;
  }
}

function setStoredItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
    // Trigger custom window event so all components react immediately
    window.dispatchEvent(new Event('edujournal_storage_change'));
  } catch (e) {
    console.error('Error saving localStorage for key', key, e);
  }
}

export function useEduStore() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const handleStorageChange = () => {
      setVersion((v) => v + 1);
    };
    window.addEventListener('edujournal_storage_change', handleStorageChange);
    return () => {
      window.removeEventListener('edujournal_storage_change', handleStorageChange);
    };
  }, []);

  // Data Getters
  const schoolProfile = getStoredItem<SchoolProfile>('school_profile', INITIAL_SCHOOL_PROFILE);
  const subjects = getStoredItem<SubjectItem[]>('subjects', INITIAL_SUBJECTS);
  const learningObjectives = getStoredItem<LearningObjective[]>('learning_objectives', INITIAL_LEARNING_OBJECTIVES);
  const rawStudents = getStoredItem<Student[]>('students', INITIAL_STUDENTS);
  const students = rawStudents.map((s) => {
    if (!s.classRole) {
      const match = INITIAL_STUDENTS.find((init) => init.id === s.id);
      if (match && match.classRole) {
        return { ...s, classRole: match.classRole, classRoleDuty: match.classRoleDuty };
      }
      return { ...s, classRole: 'Anggota Kelas', classRoleDuty: 'Aktif belajar dan bergotong royong di kelas.' };
    }
    return s;
  });
  const users = getStoredItem<UserAccount[]>('users', INITIAL_USERS);
  const currentUser = getStoredItem<UserAccount | null>('current_user', null);
  const journalEntries = getStoredItem<ClassJournalEntry[]>('journal_entries', INITIAL_JOURNAL_ENTRIES);
  const starAwards = getStoredItem<StarAward[]>('star_awards', INITIAL_STAR_AWARDS);
  const caseRecords = getStoredItem<CaseRecord[]>('case_records', INITIAL_CASE_RECORDS);
  const paiAssessments = getStoredItem<PaiAssessment[]>('pai_assessments', INITIAL_PAI_ASSESSMENTS);
  const messages = getStoredItem<ChatMessage[]>('messages', INITIAL_MESSAGES);
  const announcements = getStoredItem<SchoolAnnouncement[]>('announcements', INITIAL_ANNOUNCEMENTS);
  const internalGrades = getStoredItem<InternalGradeRecord[]>('internal_grades', INITIAL_INTERNAL_GRADES);

  // Authentication & Role Switcher
  const login = useCallback((username: string, password?: string): boolean => {
    const allUsers = getStoredItem<UserAccount[]>('users', INITIAL_USERS);
    // Find matching user (case insensitive username)
    const found = allUsers.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (!found) return false;

    // In demo mode or if password matches
    if (!password || found.password === password) {
      setStoredItem('current_user', found);
      return true;
    }
    return false;
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    const allUsers = getStoredItem<UserAccount[]>('users', INITIAL_USERS);
    const targetUser = allUsers.find((u) => u.role === role);
    if (targetUser) {
      setStoredItem('current_user', targetUser);
    }
  }, []);

  const logout = useCallback(() => {
    setStoredItem('current_user', null);
  }, []);

  // School Profile Actions
  const updateSchoolProfile = useCallback((profile: SchoolProfile) => {
    setStoredItem('school_profile', profile);
  }, []);

  // Subjects & Learning Objectives Actions
  const addSubject = useCallback((subject: Omit<SubjectItem, 'id'>) => {
    const current = getStoredItem<SubjectItem[]>('subjects', INITIAL_SUBJECTS);
    const newItem: SubjectItem = {
      ...subject,
      id: 'subj-' + Date.now(),
    };
    setStoredItem('subjects', [...current, newItem]);
  }, []);

  const updateSubject = useCallback((id: string, updated: Partial<SubjectItem>) => {
    const current = getStoredItem<SubjectItem[]>('subjects', INITIAL_SUBJECTS);
    setStoredItem(
      'subjects',
      current.map((s) => (s.id === id ? { ...s, ...updated } : s))
    );
  }, []);

  const deleteSubject = useCallback((id: string) => {
    const current = getStoredItem<SubjectItem[]>('subjects', INITIAL_SUBJECTS);
    setStoredItem('subjects', current.filter((s) => s.id !== id));
  }, []);

  const addLearningObjective = useCallback((lo: Omit<LearningObjective, 'id'>) => {
    const current = getStoredItem<LearningObjective[]>('learning_objectives', INITIAL_LEARNING_OBJECTIVES);
    const newItem: LearningObjective = {
      ...lo,
      id: 'lo-' + Date.now(),
    };
    setStoredItem('learning_objectives', [...current, newItem]);
  }, []);

  const updateLearningObjective = useCallback((id: string, updated: Partial<LearningObjective>) => {
    const current = getStoredItem<LearningObjective[]>('learning_objectives', INITIAL_LEARNING_OBJECTIVES);
    setStoredItem(
      'learning_objectives',
      current.map((l) => (l.id === id ? { ...l, ...updated } : l))
    );
  }, []);

  const deleteLearningObjective = useCallback((id: string) => {
    const current = getStoredItem<LearningObjective[]>('learning_objectives', INITIAL_LEARNING_OBJECTIVES);
    setStoredItem('learning_objectives', current.filter((l) => l.id !== id));
  }, []);

  // Student Actions
  const addStudent = useCallback((data: Omit<Student, 'id' | 'parentUsername' | 'parentPassword'>) => {
    const currentStudents = getStoredItem<Student[]>('students', INITIAL_STUDENTS);
    const currentUsers = getStoredItem<UserAccount[]>('users', INITIAL_USERS);
    
    // Generate clean username & unique password
    const cleanFirstName = data.name.trim().toLowerCase().split(' ')[0].replace(/[^a-z0-9]/g, '');
    const parentUsername = `ortu_${cleanFirstName}_${Math.floor(10 + Math.random() * 89)}`;
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const parentPassword = `${cleanFirstName.toUpperCase().slice(0, 4)}-${randomCode}`;
    const studentId = 'std-' + Date.now();

    const newStudent: Student = {
      ...data,
      id: studentId,
      parentUsername,
      parentPassword,
      avatarBgColor: 'bg-indigo-100 text-indigo-700',
    };

    // Auto-create parent user account
    const newParentAccount: UserAccount = {
      id: 'usr-parent-' + Date.now(),
      username: parentUsername,
      password: parentPassword,
      role: 'orangtua',
      name: `${data.parentName} (Wali)`,
      title: `Orang Tua dari ${data.name}`,
      studentId: studentId,
      phone: data.parentPhone,
    };

    setStoredItem('students', [...currentStudents, newStudent]);
    setStoredItem('users', [...currentUsers, newParentAccount]);
  }, []);

  const importStudents = useCallback((newList: Omit<Student, 'id' | 'parentUsername' | 'parentPassword'>[]) => {
    const currentStudents = getStoredItem<Student[]>('students', INITIAL_STUDENTS);
    const currentUsers = getStoredItem<UserAccount[]>('users', INITIAL_USERS);

    const generatedStudents: Student[] = [];
    const generatedParents: UserAccount[] = [];

    newList.forEach((item, index) => {
      const cleanFirstName = item.name.trim().toLowerCase().split(' ')[0].replace(/[^a-z0-9]/g, '') || `siswa${index}`;
      const parentUsername = `ortu_${cleanFirstName}_${Math.floor(10 + Math.random() * 89)}`;
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const parentPassword = `${cleanFirstName.toUpperCase().slice(0, 4)}-${randomCode}`;
      const studentId = `std-${Date.now()}-${index}`;

      const s: Student = {
        ...item,
        id: studentId,
        parentUsername,
        parentPassword,
        avatarBgColor: index % 2 === 0 ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700',
      };
      generatedStudents.push(s);

      generatedParents.push({
        id: `usr-parent-${Date.now()}-${index}`,
        username: parentUsername,
        password: parentPassword,
        role: 'orangtua',
        name: `${item.parentName} (Wali)`,
        title: `Orang Tua dari ${item.name}`,
        studentId: studentId,
        phone: item.parentPhone,
      });
    });

    setStoredItem('students', [...currentStudents, ...generatedStudents]);
    setStoredItem('users', [...currentUsers, ...generatedParents]);
  }, []);

  const updateStudent = useCallback((id: string, updated: Partial<Student>) => {
    const currentStudents = getStoredItem<Student[]>('students', INITIAL_STUDENTS);
    const currentUsers = getStoredItem<UserAccount[]>('users', INITIAL_USERS);

    setStoredItem(
      'students',
      currentStudents.map((s) => (s.id === id ? { ...s, ...updated } : s))
    );

    // Sync parent user account name/phone if changed
    if (updated.parentName || updated.parentPhone) {
      setStoredItem(
        'users',
        currentUsers.map((u) => {
          if (u.studentId === id) {
            return {
              ...u,
              name: updated.parentName ? `${updated.parentName} (Wali)` : u.name,
              phone: updated.parentPhone || u.phone,
            };
          }
          return u;
        })
      );
    }
  }, []);

  const deleteStudent = useCallback((id: string) => {
    const currentStudents = getStoredItem<Student[]>('students', INITIAL_STUDENTS);
    const currentUsers = getStoredItem<UserAccount[]>('users', INITIAL_USERS);
    setStoredItem('students', currentStudents.filter((s) => s.id !== id));
    setStoredItem('users', currentUsers.filter((u) => u.studentId !== id));
  }, []);

  // Admin User & Password Assistance Actions
  const resetUserPassword = useCallback((userId: string, newPassword?: string) => {
    const currentUsers = getStoredItem<UserAccount[]>('users', INITIAL_USERS);
    const currentStudents = getStoredItem<Student[]>('students', INITIAL_STUDENTS);
    const generated = newPassword || `RESET-${Math.floor(1000 + Math.random() * 9000)}`;

    let targetStudentId: string | undefined;

    const updatedUsers = currentUsers.map((u) => {
      if (u.id === userId) {
        targetStudentId = u.studentId;
        return { ...u, password: generated };
      }
      return u;
    });

    setStoredItem('users', updatedUsers);

    // If it's a parent user, update student's parentPassword too for consistency in credential cards
    if (targetStudentId) {
      setStoredItem(
        'students',
        currentStudents.map((s) => (s.id === targetStudentId ? { ...s, parentPassword: generated } : s))
      );
    }

    return generated;
  }, []);

  // Journal Actions
  const addJournalEntry = useCallback((entry: Omit<ClassJournalEntry, 'id'>) => {
    const current = getStoredItem<ClassJournalEntry[]>('journal_entries', INITIAL_JOURNAL_ENTRIES);
    const newItem: ClassJournalEntry = {
      ...entry,
      id: 'jrn-' + Date.now(),
    };
    setStoredItem('journal_entries', [newItem, ...current]);
  }, []);

  const deleteJournalEntry = useCallback((id: string) => {
    const current = getStoredItem<ClassJournalEntry[]>('journal_entries', INITIAL_JOURNAL_ENTRIES);
    setStoredItem('journal_entries', current.filter((j) => j.id !== id));
  }, []);

  // Star Rewards Actions
  const addStarAward = useCallback((award: Omit<StarAward, 'id' | 'timestamp'>) => {
    const current = getStoredItem<StarAward[]>('star_awards', INITIAL_STAR_AWARDS);
    const newItem: StarAward = {
      ...award,
      id: 'star-' + Date.now(),
      timestamp: Date.now(),
    };
    setStoredItem('star_awards', [newItem, ...current]);
  }, []);

  const deleteStarAward = useCallback((id: string) => {
    const current = getStoredItem<StarAward[]>('star_awards', INITIAL_STAR_AWARDS);
    setStoredItem('star_awards', current.filter((s) => s.id !== id));
  }, []);

  // BK Case Records Actions
  const addCaseRecord = useCallback((record: Omit<CaseRecord, 'id' | 'timestamp'>) => {
    const current = getStoredItem<CaseRecord[]>('case_records', INITIAL_CASE_RECORDS);
    const newItem: CaseRecord = {
      ...record,
      id: 'case-' + Date.now(),
      timestamp: Date.now(),
    };
    setStoredItem('case_records', [newItem, ...current]);
  }, []);

  const updateCaseRecord = useCallback((id: string, updated: Partial<CaseRecord>) => {
    const current = getStoredItem<CaseRecord[]>('case_records', INITIAL_CASE_RECORDS);
    setStoredItem(
      'case_records',
      current.map((c) => (c.id === id ? { ...c, ...updated } : c))
    );
  }, []);

  const deleteCaseRecord = useCallback((id: string) => {
    const current = getStoredItem<CaseRecord[]>('case_records', INITIAL_CASE_RECORDS);
    setStoredItem('case_records', current.filter((c) => c.id !== id));
  }, []);

  // PAI Assessment Actions
  const addPaiAssessment = useCallback((assessment: Omit<PaiAssessment, 'id'>) => {
    const current = getStoredItem<PaiAssessment[]>('pai_assessments', INITIAL_PAI_ASSESSMENTS);
    const newItem: PaiAssessment = {
      ...assessment,
      id: 'pai-ass-' + Date.now(),
    };
    setStoredItem('pai_assessments', [newItem, ...current]);
  }, []);

  const updatePaiAssessment = useCallback((id: string, updated: Partial<PaiAssessment>) => {
    const current = getStoredItem<PaiAssessment[]>('pai_assessments', INITIAL_PAI_ASSESSMENTS);
    setStoredItem(
      'pai_assessments',
      current.map((p) => (p.id === id ? { ...p, ...updated } : p))
    );
  }, []);

  const deletePaiAssessment = useCallback((id: string) => {
    const current = getStoredItem<PaiAssessment[]>('pai_assessments', INITIAL_PAI_ASSESSMENTS);
    setStoredItem('pai_assessments', current.filter((p) => p.id !== id));
  }, []);

  const updatePaiStudentResult = useCallback((assessmentId: string, studentId: string, indicatorId: string, completed: boolean, notes?: string) => {
    const current = getStoredItem<PaiAssessment[]>('pai_assessments', INITIAL_PAI_ASSESSMENTS);
    const updated = current.map((p) => {
      if (p.id !== assessmentId) return p;
      const existingStudent = p.results[studentId] || { completedIndicators: {} };
      const updatedCompleted = {
        ...existingStudent.completedIndicators,
        [indicatorId]: completed,
      };
      return {
        ...p,
        results: {
          ...p.results,
          [studentId]: {
            ...existingStudent,
            completedIndicators: updatedCompleted,
            notes: notes !== undefined ? notes : existingStudent.notes,
            evaluatedAt: new Date().toISOString().split('T')[0],
          },
        },
      };
    });
    setStoredItem('pai_assessments', updated);
  }, []);

  // Chat Actions
  const sendMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp' | 'isRead'>) => {
    const current = getStoredItem<ChatMessage[]>('messages', INITIAL_MESSAGES);
    const newMsg: ChatMessage = {
      ...msg,
      id: 'msg-' + Date.now(),
      timestamp: Date.now(),
      isRead: false,
    };
    setStoredItem('messages', [...current, newMsg]);
  }, []);

  const markMessagesAsRead = useCallback((recipientId: string, senderId: string) => {
    const current = getStoredItem<ChatMessage[]>('messages', INITIAL_MESSAGES);
    setStoredItem(
      'messages',
      current.map((m) => {
        if (m.recipientId === recipientId && m.senderId === senderId) {
          return { ...m, isRead: true };
        }
        return m;
      })
    );
  }, []);

  // Announcements
  const addAnnouncement = useCallback((announcement: Omit<SchoolAnnouncement, 'id'>) => {
    const current = getStoredItem<SchoolAnnouncement[]>('announcements', INITIAL_ANNOUNCEMENTS);
    const newItem: SchoolAnnouncement = {
      ...announcement,
      id: 'ann-' + Date.now(),
    };
    setStoredItem('announcements', [newItem, ...current]);
  }, []);

  const deleteAnnouncement = useCallback((id: string) => {
    const current = getStoredItem<SchoolAnnouncement[]>('announcements', INITIAL_ANNOUNCEMENTS);
    setStoredItem('announcements', current.filter((a) => a.id !== id));
  }, []);

  // Internal Grade Records Actions (Internal Teacher Only - Hidden from Parents)
  const addInternalGrade = useCallback((grade: Omit<InternalGradeRecord, 'id' | 'timestamp'>) => {
    const current = getStoredItem<InternalGradeRecord[]>('internal_grades', INITIAL_INTERNAL_GRADES);
    const newGrade: InternalGradeRecord = {
      ...grade,
      id: 'grade-' + Date.now(),
      timestamp: Date.now(),
      isInternalOnly: true,
    };
    setStoredItem('internal_grades', [newGrade, ...current]);
  }, []);

  const updateInternalGrade = useCallback((id: string, updated: Partial<InternalGradeRecord>) => {
    const current = getStoredItem<InternalGradeRecord[]>('internal_grades', INITIAL_INTERNAL_GRADES);
    setStoredItem(
      'internal_grades',
      current.map((g) => (g.id === id ? { ...g, ...updated } : g))
    );
  }, []);

  const deleteInternalGrade = useCallback((id: string) => {
    const current = getStoredItem<InternalGradeRecord[]>('internal_grades', INITIAL_INTERNAL_GRADES);
    setStoredItem('internal_grades', current.filter((g) => g.id !== id));
  }, []);

  const updateInternalStudentScore = useCallback((
    gradeId: string,
    studentId: string,
    score: number,
    predicate: 'A' | 'B' | 'C' | 'D',
    notes?: string
  ) => {
    const current = getStoredItem<InternalGradeRecord[]>('internal_grades', INITIAL_INTERNAL_GRADES);
    const updated = current.map((g) => {
      if (g.id !== gradeId) return g;
      return {
        ...g,
        scores: {
          ...g.scores,
          [studentId]: {
            score,
            predicate,
            notes: notes !== undefined ? notes : g.scores[studentId]?.notes,
          },
        },
      };
    });
    setStoredItem('internal_grades', updated);
  }, []);

  // System Reset & Export/Import
  const resetToDefaultData = useCallback(() => {
    setStoredItem('school_profile', INITIAL_SCHOOL_PROFILE);
    setStoredItem('subjects', INITIAL_SUBJECTS);
    setStoredItem('learning_objectives', INITIAL_LEARNING_OBJECTIVES);
    setStoredItem('students', INITIAL_STUDENTS);
    setStoredItem('users', INITIAL_USERS);
    setStoredItem('journal_entries', INITIAL_JOURNAL_ENTRIES);
    setStoredItem('star_awards', INITIAL_STAR_AWARDS);
    setStoredItem('case_records', INITIAL_CASE_RECORDS);
    setStoredItem('pai_assessments', INITIAL_PAI_ASSESSMENTS);
    setStoredItem('internal_grades', INITIAL_INTERNAL_GRADES);
    setStoredItem('messages', INITIAL_MESSAGES);
    setStoredItem('announcements', INITIAL_ANNOUNCEMENTS);
    setStoredItem('current_user', null);
  }, []);

  return {
    version,
    schoolProfile,
    updateSchoolProfile,
    subjects,
    addSubject,
    updateSubject,
    deleteSubject,
    learningObjectives,
    addLearningObjective,
    updateLearningObjective,
    deleteLearningObjective,
    students,
    addStudent,
    importStudents,
    updateStudent,
    deleteStudent,
    users,
    currentUser,
    login,
    switchRole,
    logout,
    resetUserPassword,
    journalEntries,
    addJournalEntry,
    deleteJournalEntry,
    starAwards,
    addStarAward,
    deleteStarAward,
    caseRecords,
    addCaseRecord,
    updateCaseRecord,
    deleteCaseRecord,
    paiAssessments,
    addPaiAssessment,
    updatePaiAssessment,
    deletePaiAssessment,
    updatePaiStudentResult,
    internalGrades,
    addInternalGrade,
    updateInternalGrade,
    deleteInternalGrade,
    updateInternalStudentScore,
    messages,
    sendMessage,
    markMessagesAsRead,
    announcements,
    addAnnouncement,
    deleteAnnouncement,
    resetToDefaultData,
  };
}
