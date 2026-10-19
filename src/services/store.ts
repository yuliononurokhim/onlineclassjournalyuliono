import { useState, useEffect, useCallback, useMemo } from 'react';
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
  deleteStudentFirestoreRecords,
} from './firebase';
import { getLocalDateString } from './date';

const STORAGE_KEY_PREFIX = 'edujournal_sd_v1_';

function createRecordId(prefix: string): string {
  const uniqueId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${uniqueId}`;
}

function createUniqueParentUsername(name: string, reservedUsernames: Set<string>): string {
  const firstName = name
    .trim()
    .split(/\s+/)[0]
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') || 'wali';
  const base = `ortu_${firstName}`;
  let username = base;
  let suffix = 2;
  while (reservedUsernames.has(username.toLowerCase())) {
    username = `${base}_${suffix}`;
    suffix += 1;
  }
  reservedUsernames.add(username.toLowerCase());
  return username;
}

function createParentPassword(name: string): string {
  const firstName = name
    .trim()
    .split(/\s+/)[0]
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4) || 'WALI';
  return `${firstName}-${Math.floor(1000 + Math.random() * 9000)}`;
}

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

let storeDispatchTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleStoreDispatch() {
  if (storeDispatchTimer) return;
  storeDispatchTimer = setTimeout(() => {
    storeDispatchTimer = null;
    window.dispatchEvent(new Event('edujournal_storage_change'));
  }, 25);
}

function setStoredItem<T>(key: string, value: T): void {
  try {
    const serialized = JSON.stringify(value);
    const existing = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (existing === serialized) {
      return; // No change in payload
    }
    localStorage.setItem(STORAGE_KEY_PREFIX + key, serialized);
    scheduleStoreDispatch();
  } catch (e) {
    console.error('Error saving localStorage for key', key, e);
  }
}

function hasOriginalAdminSession(): boolean {
  const raw = sessionStorage.getItem('edujournal_original_admin');
  if (!raw) return false;
  try {
    const originalAdmin = JSON.parse(raw) as UserAccount;
    return originalAdmin.role === 'admin';
  } catch (error) {
    console.warn('Failed validating impersonation session', error);
    sessionStorage.removeItem('edujournal_original_admin');
    return false;
  }
}

export function useEduStore() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    // Start two-way real-time Firestore sync
    initFirebaseSync();

    let rafId: number | null = null;
    const handleStorageChange = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setVersion((v) => v + 1);
      });
    };
    window.addEventListener('edujournal_storage_change', handleStorageChange);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('edujournal_storage_change', handleStorageChange);
    };
  }, []);

  // Data Getters (Memoized with version so references are stable across re-renders)
  const schoolProfile = useMemo(() => getStoredItem<SchoolProfile>('school_profile', INITIAL_SCHOOL_PROFILE), [version]);
  const subjects = useMemo(() => getStoredItem<SubjectItem[]>('subjects', INITIAL_SUBJECTS), [version]);
  const learningObjectives = useMemo(() => getStoredItem<LearningObjective[]>('learning_objectives', INITIAL_LEARNING_OBJECTIVES), [version]);
  const students = useMemo(() => getStoredItem<Student[]>('students', INITIAL_STUDENTS), [version]);
  const users = useMemo(() => getStoredItem<UserAccount[]>('users', INITIAL_USERS), [version]);
  const currentUser = useMemo(() => getStoredItem<UserAccount | null>('current_user', null), [version]);
  const journalEntries = useMemo(() => getStoredItem<ClassJournalEntry[]>('journal_entries', INITIAL_JOURNAL_ENTRIES), [version]);
  const starAwards = useMemo(() => getStoredItem<StarAward[]>('star_awards', INITIAL_STAR_AWARDS), [version]);
  const caseRecords = useMemo(() => getStoredItem<CaseRecord[]>('case_records', INITIAL_CASE_RECORDS), [version]);
  const paiAssessments = useMemo(() => getStoredItem<PaiAssessment[]>('pai_assessments', INITIAL_PAI_ASSESSMENTS), [version]);
  const messages = useMemo(() => getStoredItem<ChatMessage[]>('messages', INITIAL_MESSAGES), [version]);
  const announcements = useMemo(() => getStoredItem<SchoolAnnouncement[]>('announcements', INITIAL_ANNOUNCEMENTS), [version]);
  const internalGrades = useMemo(() => getStoredItem<InternalGradeRecord[]>('internal_grades', INITIAL_INTERNAL_GRADES), [version]);

  // Authentication & Role Switcher
  const login = useCallback((identifier: string, password?: string): boolean => {
    const allUsers = getStoredItem<UserAccount[]>('users', INITIAL_USERS);
    const allStudents = getStoredItem<Student[]>('students', INITIAL_STUDENTS);

    const cleanInput = identifier.trim().toLowerCase();
    const cleanPass = password || '';
    if (!cleanInput || !cleanPass) return false;

    const matchedStudent = allStudents.find(
      (student) =>
        student.nisn.trim().toLowerCase() === cleanInput ||
        student.parentUsername.trim().toLowerCase() === cleanInput
    );
    let matchedUser = allUsers.find(
      (u) =>
        u.username.trim().toLowerCase() === cleanInput ||
        (u.phone && u.phone.trim().toLowerCase() === cleanInput) ||
        (u.email && u.email.trim().toLowerCase() === cleanInput) ||
        (matchedStudent &&
          u.role === 'orangtua' &&
          (u.studentId === matchedStudent.id ||
            u.username.trim().toLowerCase() === matchedStudent.parentUsername.trim().toLowerCase()))
    );

    let isLegacyParentAccount = false;
    if (!matchedUser && matchedStudent) {
      matchedUser = {
        id: createRecordId('usr-parent'),
        username: matchedStudent.parentUsername,
        password: matchedStudent.parentPassword,
        role: 'orangtua',
        name: `${matchedStudent.parentName} (Wali Murid)`,
        title: `Orang Tua dari ${matchedStudent.name}`,
        studentId: matchedStudent.id,
        phone: matchedStudent.parentPhone,
      };
      isLegacyParentAccount = true;
    }

    if (!matchedUser || matchedUser.status === 'nonaktif' || matchedUser.password !== cleanPass) return false;

    if (isLegacyParentAccount) {
      setStoredItem('users', [...allUsers, matchedUser]);
      writeFirestoreDoc('users', matchedUser.id, matchedUser);
    }
    setStoredItem('current_user', matchedUser);
    return true;
  }, []);

  const switchRole = useCallback((role: UserRole, studentIdOrUserId?: string) => {
    const current = getStoredItem<UserAccount | null>('current_user', null);
    if (!current || (current.role !== 'admin' && !hasOriginalAdminSession())) {
      console.error('Only an administrator can switch to another account.');
      return;
    }
    if (current.role === 'admin' && !hasOriginalAdminSession()) {
      sessionStorage.setItem('edujournal_original_admin', JSON.stringify(current));
    }

    const allUsers = getStoredItem<UserAccount[]>('users', INITIAL_USERS);
    let targetUser: UserAccount | undefined;
    if (studentIdOrUserId) {
      targetUser = allUsers.find(
        (u) =>
          u.id === studentIdOrUserId ||
          u.studentId === studentIdOrUserId ||
          u.username === studentIdOrUserId
      );
    }
    if (!targetUser) {
      targetUser = allUsers.find((u) => u.role === role);
    }
    if (targetUser) {
      setStoredItem('current_user', targetUser);
    }
  }, []);

  const impersonateUser = useCallback((targetUser: UserAccount) => {
    const current = getStoredItem<UserAccount | null>('current_user', null);
    if (!current || (current.role !== 'admin' && !hasOriginalAdminSession())) {
      console.error('Only an administrator can impersonate another account.');
      return;
    }
    if (current.role === 'admin' && !hasOriginalAdminSession()) {
      sessionStorage.setItem('edujournal_original_admin', JSON.stringify(current));
    }
    setStoredItem('current_user', targetUser);
  }, []);

  const stopImpersonating = useCallback(() => {
    try {
      const raw = sessionStorage.getItem('edujournal_original_admin');
      if (raw) {
        const originalAdmin = JSON.parse(raw) as UserAccount;
        if (originalAdmin.role !== 'admin') {
          throw new Error('Stored impersonation account is not an administrator.');
        }
        sessionStorage.removeItem('edujournal_original_admin');
        setStoredItem('current_user', originalAdmin);
        return;
      }
    } catch (e) {
      console.warn('Failed restoring admin', e);
    }
    const allUsers = getStoredItem<UserAccount[]>('users', INITIAL_USERS);
    const adminUser = allUsers.find((u) => u.role === 'admin') || INITIAL_USERS[0];
    sessionStorage.removeItem('edujournal_original_admin');
    setStoredItem('current_user', adminUser);
  }, []);

  const isImpersonating = useMemo(() => {
    return typeof window !== 'undefined' && hasOriginalAdminSession();
  }, [version]);

  const logout = useCallback(() => {
    sessionStorage.removeItem('edujournal_original_admin');
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
      id: createRecordId('subj'),
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
      id: createRecordId('lo'),
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
  const addStudent = useCallback((data: Omit<Student, 'id' | 'parentUsername' | 'parentPassword'>): boolean => {
    const currentStudents = getStoredItem<Student[]>('students', INITIAL_STUDENTS);
    const currentUsers = getStoredItem<UserAccount[]>('users', INITIAL_USERS);
    const nisn = data.nisn.trim();
    if (
      !nisn ||
      !data.name.trim() ||
      currentStudents.some((student) => student.nisn.trim().toLowerCase() === nisn.toLowerCase())
    ) {
      return false;
    }
    const reservedUsernames = new Set([
      ...currentUsers.map((user) => user.username.trim().toLowerCase()),
      ...currentStudents.map((student) => student.parentUsername.trim().toLowerCase()),
    ]);
    const parentUsername = createUniqueParentUsername(data.name, reservedUsernames);
    const parentPassword = createParentPassword(data.name);
    const studentId = createRecordId('std');

    const newStudent: Student = {
      ...data,
      nisn,
      id: studentId,
      parentUsername,
      parentPassword,
      avatarBgColor: 'bg-indigo-100 text-indigo-700',
    };

    // Auto-create parent user account
    const newParentAccount: UserAccount = {
      id: createRecordId('usr-parent'),
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
    return true;
  }, []);

  const importStudents = useCallback((newList: Omit<Student, 'id' | 'parentUsername' | 'parentPassword'>[]) => {
    const currentStudents = getStoredItem<Student[]>('students', INITIAL_STUDENTS);
    const currentUsers = getStoredItem<UserAccount[]>('users', INITIAL_USERS);

    const generatedStudents: Student[] = [];
    const generatedParents: UserAccount[] = [];
    const seenNisns = new Set(currentStudents.map((student) => student.nisn.trim().toLowerCase()));
    const reservedUsernames = new Set([
      ...currentUsers.map((user) => user.username.trim().toLowerCase()),
      ...currentStudents.map((student) => student.parentUsername.trim().toLowerCase()),
    ]);
    let skipped = 0;

    newList.forEach((item, index) => {
      const nisn = item.nisn.trim();
      const name = item.name.trim();
      const nisnKey = nisn.toLowerCase();
      if (!nisn || !name || seenNisns.has(nisnKey)) {
        skipped += 1;
        return;
      }
      seenNisns.add(nisnKey);
      const parentUsername = createUniqueParentUsername(name, reservedUsernames);
      const parentPassword = createParentPassword(name);
      const studentId = createRecordId(`std-${index}`);

      const s: Student = {
        ...item,
        nisn,
        name,
        id: studentId,
        parentUsername,
        parentPassword,
        avatarBgColor: index % 2 === 0 ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700',
      };
      generatedStudents.push(s);

      const p: UserAccount = {
        id: createRecordId(`usr-parent-${index}`),
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
    return { imported: generatedStudents.length, skipped };
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
    if (updated.name || updated.parentName || updated.parentPhone) {
      const updatedUsers = currentUsers.map((u) => {
        if (
          u.role === 'orangtua' &&
          (u.studentId === id ||
            (targetStudent &&
              u.username.trim().toLowerCase() === targetStudent.parentUsername.trim().toLowerCase()))
        ) {
          const mergedUser = {
            ...u,
            name: updated.parentName ? `${updated.parentName} (Wali)` : u.name,
            title: updated.name ? `Orang Tua dari ${updated.name}` : u.title,
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
    const targetStudent = currentStudents.find((student) => student.id === id);
    setStoredItem('students', currentStudents.filter((s) => s.id !== id));

    const parentUsers = currentUsers.filter(
      (user) =>
        user.role === 'orangtua' &&
        (user.studentId === id ||
          (!user.studentId &&
            targetStudent &&
            user.username.trim().toLowerCase() === targetStudent.parentUsername.trim().toLowerCase()))
    );
    const parentUserIds = new Set(parentUsers.map((user) => user.id));
    setStoredItem('users', currentUsers.filter((user) => !parentUserIds.has(user.id)));
    const currentUser = getStoredItem<UserAccount | null>('current_user', null);
    if (currentUser && parentUserIds.has(currentUser.id)) {
      sessionStorage.removeItem('edujournal_original_admin');
      setStoredItem('current_user', null);
    }
    deleteStudentFirestoreRecords(id, parentUsers.map((user) => user.id));
  }, []);

  // Admin User & Teacher Management Actions
  const addUser = useCallback((newUser: Omit<UserAccount, 'id'>) => {
    const currentUsers = getStoredItem<UserAccount[]>('users', INITIAL_USERS);
    const id = createRecordId(`usr-${newUser.role}`);
    const userWithId: UserAccount = {
      ...newUser,
      id,
      status: newUser.status || 'aktif',
    };
    const updatedUsers = [...currentUsers, userWithId];
    setStoredItem('users', updatedUsers);
    writeFirestoreDoc('users', id, userWithId);
    return userWithId;
  }, []);

  const updateUser = useCallback((userId: string, updated: Partial<UserAccount>) => {
    const currentUsers = getStoredItem<UserAccount[]>('users', INITIAL_USERS);
    const currentStudents = getStoredItem<Student[]>('students', INITIAL_STUDENTS);
    const targetUser = currentUsers.find((user) => user.id === userId);
    const updatedUsers = currentUsers.map((u) => {
      if (u.id === userId) {
        const merged = { ...u, ...updated };
        writeFirestoreDoc('users', u.id, merged);
        return merged;
      }
      return u;
    });
    setStoredItem('users', updatedUsers);

    if (targetUser?.role === 'orangtua') {
      const linkedStudent =
        currentStudents.find((student) => student.id === targetUser.studentId) ||
        currentStudents.find(
          (student) =>
            student.parentUsername.trim().toLowerCase() === targetUser.username.trim().toLowerCase()
        );
      if (linkedStudent) {
        const parentName = updated.name
          ?.trim()
          .replace(/\s*\((?:wali(?: murid)?)\)\s*$/i, '')
          .trim();
        const updatedStudent: Student = {
          ...linkedStudent,
          parentUsername: updated.username?.trim() || linkedStudent.parentUsername,
          parentPassword: updated.password ?? linkedStudent.parentPassword,
          parentPhone: updated.phone ?? linkedStudent.parentPhone,
          parentName: parentName || linkedStudent.parentName,
        };
        setStoredItem(
          'students',
          currentStudents.map((student) => student.id === linkedStudent.id ? updatedStudent : student)
        );
        writeFirestoreDoc('students', updatedStudent.id, updatedStudent);
      }
    }

    // If current logged-in user is updated, update current_user too
    const current = getStoredItem<UserAccount | null>('current_user', null);
    if (current && current.id === userId) {
      if (updated.status === 'nonaktif') {
        sessionStorage.removeItem('edujournal_original_admin');
        setStoredItem('current_user', null);
      } else {
        setStoredItem('current_user', { ...current, ...updated });
      }
    }
  }, []);

  const deleteUser = useCallback((userId: string) => {
    const currentUsers = getStoredItem<UserAccount[]>('users', INITIAL_USERS);
    const updatedUsers = currentUsers.filter((u) => u.id !== userId);
    setStoredItem('users', updatedUsers);
    deleteFirestoreDoc('users', userId);
    const current = getStoredItem<UserAccount | null>('current_user', null);
    if (current?.id === userId) {
      sessionStorage.removeItem('edujournal_original_admin');
      setStoredItem('current_user', null);
    }
  }, []);

  const resetUserPassword = useCallback((userId: string, newPassword?: string) => {
    const currentUsers = getStoredItem<UserAccount[]>('users', INITIAL_USERS);
    const currentStudents = getStoredItem<Student[]>('students', INITIAL_STUDENTS);
    const generated = newPassword?.trim() ? newPassword.trim() : `RESET-${Math.floor(1000 + Math.random() * 9000)}`;

    let targetStudentId: string | undefined;
    const targetUser = currentUsers.find((user) => user.id === userId);
    if (targetUser?.role === 'orangtua') {
      targetStudentId =
        currentStudents.find((student) => student.id === targetUser.studentId)?.id ||
        currentStudents.find(
          (student) =>
            student.parentUsername.trim().toLowerCase() === targetUser.username.trim().toLowerCase()
        )?.id;
    }

    const updatedUsers = currentUsers.map((u) => {
      if (u.id === userId) {
        targetStudentId = u.studentId || targetStudentId;
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
      id: createRecordId('jrn'),
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
      id: createRecordId('star'),
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
      id: createRecordId('case'),
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
      id: createRecordId('pai-ass'),
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
            evaluatedAt: getLocalDateString(),
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
      id: createRecordId('msg'),
      timestamp: Date.now(),
      isRead: false,
    };
    setStoredItem('messages', [...current, newMsg]);
    writeFirestoreDoc('messages', newMsg.id, newMsg);
  }, []);

  const markMessagesAsRead = useCallback((
    studentId: string,
    recipientId: string,
    senderId: string
  ) => {
    const current = getStoredItem<ChatMessage[]>('messages', INITIAL_MESSAGES);
    const updated = current.map((m) => {
      if (
        !m.isRead &&
        m.studentId === studentId &&
        m.recipientId === recipientId &&
        m.senderId === senderId
      ) {
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
      id: createRecordId('ann'),
    };
    setStoredItem('announcements', [newItem, ...current]);
    writeFirestoreDoc('announcements', newItem.id, newItem);
  }, []);

  const updateAnnouncement = useCallback((id: string, updates: Omit<SchoolAnnouncement, 'id'>) => {
    const current = getStoredItem<SchoolAnnouncement[]>('announcements', INITIAL_ANNOUNCEMENTS);
    const updated = current.map((announcement) =>
      announcement.id === id ? { ...announcement, ...updates, id } : announcement
    );
    setStoredItem('announcements', updated);
    writeFirestoreDoc('announcements', id, { ...updates, id });
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
      id: createRecordId('grade'),
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
    predicate: 'A' | 'B' | 'C' | 'D' | 'SB' | 'PB',
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
    addUser,
    updateUser,
    deleteUser,
    currentUser,
    login,
    switchRole,
    impersonateUser,
    stopImpersonating,
    isImpersonating,
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
    updateAnnouncement,
    deleteAnnouncement,
    resetToDefaultData,
  };
}
