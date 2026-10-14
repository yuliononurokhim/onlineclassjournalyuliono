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
import {
  initFirebaseSync,
  writeFirestoreDoc,
  deleteFirestoreDoc,
} from './firebase';

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
    // Start two-way real-time Firestore sync
    initFirebaseSync();

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
  const students = getStoredItem<Student[]>('students', INITIAL_STUDENTS);
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
    writeFirestoreDoc('settings', 'school_profile', profile);
  }, []);

  // Subjects & Learning Objectives Actions
  const addSubject = useCallback((subject: Omit<SubjectItem, 'id'>) => {
    const current = getStoredItem<SubjectItem[]>('subjects', INITIAL_SUBJECTS);
    const newItem: SubjectItem = {
      ...subject,
      id: 'subj-' + Date.now(),
    };
    setStoredItem('subjects', [...current, newItem]);
    writeFirestoreDoc('subjects', newItem.id, newItem);
  }, []);

  const updateSubject = useCallback((id: string, updated: Partial<SubjectItem>) => {
    const current = getStoredItem<SubjectItem[]>('subjects', INITIAL_SUBJECTS);
    const item = current.find((s) => s.id === id);
    if (item) {
      const merged = { ...item, ...updated };
      setStoredItem(
        'subjects',
        current.map((s) => (s.id === id ? merged : s))
      );
      writeFirestoreDoc('subjects', id, merged);
    }
  }, []);

  const deleteSubject = useCallback((id: string) => {
    const current = getStoredItem<SubjectItem[]>('subjects', INITIAL_SUBJECTS);
    setStoredItem('subjects', current.filter((s) => s.id !== id));
    deleteFirestoreDoc('subjects', id);
  }, []);

  const addLearningObjective = useCallback((lo: Omit<LearningObjective, 'id'>) => {
    const current = getStoredItem<LearningObjective[]>('learning_objectives', INITIAL_LEARNING_OBJECTIVES);
    const newItem: LearningObjective = {
      ...lo,
      id: 'lo-' + Date.now(),
    };
    setStoredItem('learning_objectives', [...current, newItem]);
    writeFirestoreDoc('learning_objectives', newItem.id, newItem);
  }, []);

  const updateLearningObjective = useCallback((id: string, updated: Partial<LearningObjective>) => {
    const current = getStoredItem<LearningObjective[]>('learning_objectives', INITIAL_LEARNING_OBJECTIVES);
    const item = current.find((l) => l.id === id);
    if (item) {
      const merged = { ...item, ...updated };
      setStoredItem(
        'learning_objectives',
        current.map((l) => (l.id === id ? merged : l))
      );
      writeFirestoreDoc('learning_objectives', id, merged);
    }
  }, []);

  const deleteLearningObjective = useCallback((id: string) => {
    const current = getStoredItem<LearningObjective[]>('learning_objectives', INITIAL_LEARNING_OBJECTIVES);
    setStoredItem('learning_objectives', current.filter((l) => l.id !== id));
    deleteFirestoreDoc('learning_objectives', id);
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

    writeFirestoreDoc('students', newStudent.id, newStudent);
    writeFirestoreDoc('users', newParentAccount.id, newParentAccount);
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

      const p: UserAccount = {
        id: `usr-parent-${Date.now()}-${index}`,
        username: parentUsername,
        password: parentPassword,
        role: 'orangtua',
        name: `${item.parentName} (Wali)`,
        title: `Orang Tua dari ${item.name}`,
        studentId: studentId,
        phone: item.parentPhone,
      };
      generatedParents.push(p);

      writeFirestoreDoc('students', s.id, s);
      writeFirestoreDoc('users', p.id, p);
    });

    setStoredItem('students', [...currentStudents, ...generatedStudents]);
    setStoredItem('users', [...currentUsers, ...generatedParents]);
  }, []);

  const updateStudent = useCallback((id: string, updated: Partial<Student>) => {
    const currentStudents = getStoredItem<Student[]>('students', INITIAL_STUDENTS);
    const currentUsers = getStoredItem<UserAccount[]>('users', INITIAL_USERS);

    const targetStudent = currentStudents.find((s) => s.id === id);
    if (targetStudent) {
      const merged = { ...targetStudent, ...updated };
      setStoredItem(
        'students',
        currentStudents.map((s) => (s.id === id ? merged : s))
      );
      writeFirestoreDoc('students', id, merged);
    }

    // Sync parent user account name/phone if changed
    if (updated.parentName || updated.parentPhone) {
      const updatedUsers = currentUsers.map((u) => {
        if (u.studentId === id) {
          const mergedUser = {
            ...u,
            name: updated.parentName ? `${updated.parentName} (Wali)` : u.name,
            phone: updated.parentPhone || u.phone,
          };
          writeFirestoreDoc('users', u.id, mergedUser);
          return mergedUser;
        }
        return u;
      });
      setStoredItem('users', updatedUsers);
    }
  }, []);

  const deleteStudent = useCallback((id: string) => {
    const currentStudents = getStoredItem<Student[]>('students', INITIAL_STUDENTS);
    const currentUsers = getStoredItem<UserAccount[]>('users', INITIAL_USERS);
    setStoredItem('students', currentStudents.filter((s) => s.id !== id));
    deleteFirestoreDoc('students', id);

    const parentUser = currentUsers.find((u) => u.studentId === id);
    if (parentUser) {
      setStoredItem('users', currentUsers.filter((u) => u.studentId !== id));
      deleteFirestoreDoc('users', parentUser.id);
    }
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
        const updated = { ...u, password: generated };
        writeFirestoreDoc('users', u.id, updated);
        return updated;
      }
      return u;
    });

    setStoredItem('users', updatedUsers);

    // If it's a parent user, update student's parentPassword too for consistency in credential cards
    if (targetStudentId) {
      const updatedStudents = currentStudents.map((s) => {
        if (s.id === targetStudentId) {
          const updated = { ...s, parentPassword: generated };
          writeFirestoreDoc('students', s.id, updated);
          return updated;
        }
        return s;
      });
      setStoredItem('students', updatedStudents);
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
    writeFirestoreDoc('journal_entries', newItem.id, newItem);
  }, []);

  const deleteJournalEntry = useCallback((id: string) => {
    const current = getStoredItem<ClassJournalEntry[]>('journal_entries', INITIAL_JOURNAL_ENTRIES);
    setStoredItem('journal_entries', current.filter((j) => j.id !== id));
    deleteFirestoreDoc('journal_entries', id);
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
    writeFirestoreDoc('star_awards', newItem.id, newItem);
  }, []);

  const deleteStarAward = useCallback((id: string) => {
    const current = getStoredItem<StarAward[]>('star_awards', INITIAL_STAR_AWARDS);
    setStoredItem('star_awards', current.filter((s) => s.id !== id));
    deleteFirestoreDoc('star_awards', id);
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
    writeFirestoreDoc('case_records', newItem.id, newItem);
  }, []);

  const updateCaseRecord = useCallback((id: string, updated: Partial<CaseRecord>) => {
    const current = getStoredItem<CaseRecord[]>('case_records', INITIAL_CASE_RECORDS);
    const item = current.find((c) => c.id === id);
    if (item) {
      const merged = { ...item, ...updated };
      setStoredItem(
        'case_records',
        current.map((c) => (c.id === id ? merged : c))
      );
      writeFirestoreDoc('case_records', id, merged);
    }
  }, []);

  const deleteCaseRecord = useCallback((id: string) => {
    const current = getStoredItem<CaseRecord[]>('case_records', INITIAL_CASE_RECORDS);
    setStoredItem('case_records', current.filter((c) => c.id !== id));
    deleteFirestoreDoc('case_records', id);
  }, []);

  // PAI Assessment Actions
  const addPaiAssessment = useCallback((assessment: Omit<PaiAssessment, 'id'>) => {
    const current = getStoredItem<PaiAssessment[]>('pai_assessments', INITIAL_PAI_ASSESSMENTS);
    const newItem: PaiAssessment = {
      ...assessment,
      id: 'pai-ass-' + Date.now(),
    };
    setStoredItem('pai_assessments', [newItem, ...current]);
    writeFirestoreDoc('pai_assessments', newItem.id, newItem);
  }, []);

  const updatePaiAssessment = useCallback((id: string, updated: Partial<PaiAssessment>) => {
    const current = getStoredItem<PaiAssessment[]>('pai_assessments', INITIAL_PAI_ASSESSMENTS);
    const item = current.find((p) => p.id === id);
    if (item) {
      const merged = { ...item, ...updated };
      setStoredItem(
        'pai_assessments',
        current.map((p) => (p.id === id ? merged : p))
      );
      writeFirestoreDoc('pai_assessments', id, merged);
    }
  }, []);

  const deletePaiAssessment = useCallback((id: string) => {
    const current = getStoredItem<PaiAssessment[]>('pai_assessments', INITIAL_PAI_ASSESSMENTS);
    setStoredItem('pai_assessments', current.filter((p) => p.id !== id));
    deleteFirestoreDoc('pai_assessments', id);
  }, []);

  const updatePaiStudentResult = useCallback((assessmentId: string, studentId: string, indicatorId: string, completed: boolean, notes?: string) => {
    const current = getStoredItem<PaiAssessment[]>('pai_assessments', INITIAL_PAI_ASSESSMENTS);
    let targetAssessment: PaiAssessment | null = null;
    const updated = current.map((p) => {
      if (p.id !== assessmentId) return p;
      const existingStudent = p.results[studentId] || { completedIndicators: {} };
      const updatedCompleted = {
        ...existingStudent.completedIndicators,
        [indicatorId]: completed,
      };
      targetAssessment = {
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
      return targetAssessment;
    });
    setStoredItem('pai_assessments', updated);
    if (targetAssessment) {
      writeFirestoreDoc('pai_assessments', assessmentId, targetAssessment);
    }
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
    writeFirestoreDoc('messages', newMsg.id, newMsg);
  }, []);

  const markMessagesAsRead = useCallback((recipientId: string, senderId: string) => {
    const current = getStoredItem<ChatMessage[]>('messages', INITIAL_MESSAGES);
    const updated = current.map((m) => {
      if (m.recipientId === recipientId && m.senderId === senderId) {
        const readMsg = { ...m, isRead: true };
        writeFirestoreDoc('messages', m.id, readMsg);
        return readMsg;
      }
      return m;
    });
    setStoredItem('messages', updated);
  }, []);

  // Announcements
  const addAnnouncement = useCallback((announcement: Omit<SchoolAnnouncement, 'id'>) => {
    const current = getStoredItem<SchoolAnnouncement[]>('announcements', INITIAL_ANNOUNCEMENTS);
    const newItem: SchoolAnnouncement = {
      ...announcement,
      id: 'ann-' + Date.now(),
    };
    setStoredItem('announcements', [newItem, ...current]);
    writeFirestoreDoc('announcements', newItem.id, newItem);
  }, []);

  const deleteAnnouncement = useCallback((id: string) => {
    const current = getStoredItem<SchoolAnnouncement[]>('announcements', INITIAL_ANNOUNCEMENTS);
    setStoredItem('announcements', current.filter((a) => a.id !== id));
    deleteFirestoreDoc('announcements', id);
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
    writeFirestoreDoc('internal_grades', newGrade.id, newGrade);
  }, []);

  const updateInternalGrade = useCallback((id: string, updated: Partial<InternalGradeRecord>) => {
    const current = getStoredItem<InternalGradeRecord[]>('internal_grades', INITIAL_INTERNAL_GRADES);
    const item = current.find((g) => g.id === id);
    if (item) {
      const merged = { ...item, ...updated };
      setStoredItem(
        'internal_grades',
        current.map((g) => (g.id === id ? merged : g))
      );
      writeFirestoreDoc('internal_grades', id, merged);
    }
  }, []);

  const deleteInternalGrade = useCallback((id: string) => {
    const current = getStoredItem<InternalGradeRecord[]>('internal_grades', INITIAL_INTERNAL_GRADES);
    setStoredItem('internal_grades', current.filter((g) => g.id !== id));
    deleteFirestoreDoc('internal_grades', id);
  }, []);

  const updateInternalStudentScore = useCallback((
    gradeId: string,
    studentId: string,
    score: number,
    predicate: 'A' | 'B' | 'C' | 'D',
    notes?: string
  ) => {
    const current = getStoredItem<InternalGradeRecord[]>('internal_grades', INITIAL_INTERNAL_GRADES);
    let targetGrade: InternalGradeRecord | null = null;
    const updated = current.map((g) => {
      if (g.id !== gradeId) return g;
      targetGrade = {
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
      return targetGrade;
    });
    setStoredItem('internal_grades', updated);
    if (targetGrade) {
      writeFirestoreDoc('internal_grades', gradeId, targetGrade);
    }
  }, []);

  // System Reset
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

    // Sync seed to Firestore
    writeFirestoreDoc('settings', 'school_profile', INITIAL_SCHOOL_PROFILE);
    INITIAL_STUDENTS.forEach((s) => writeFirestoreDoc('students', s.id, s));
    INITIAL_USERS.forEach((u) => writeFirestoreDoc('users', u.id, u));
    INITIAL_JOURNAL_ENTRIES.forEach((j) => writeFirestoreDoc('journal_entries', j.id, j));
    INITIAL_INTERNAL_GRADES.forEach((g) => writeFirestoreDoc('internal_grades', g.id, g));
    INITIAL_STAR_AWARDS.forEach((st) => writeFirestoreDoc('star_awards', st.id, st));
    INITIAL_CASE_RECORDS.forEach((c) => writeFirestoreDoc('case_records', c.id, c));
    INITIAL_PAI_ASSESSMENTS.forEach((p) => writeFirestoreDoc('pai_assessments', p.id, p));
    INITIAL_MESSAGES.forEach((m) => writeFirestoreDoc('messages', m.id, m));
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
