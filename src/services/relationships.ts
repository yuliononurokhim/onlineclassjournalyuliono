import { Student, UserAccount } from '../types';

export function getLinkedStudentsForParent(
  user: UserAccount | null,
  students: Student[]
): Student[] {
  if (!user || user.role !== 'orangtua') return [];

  const directlyLinkedStudent = user.studentId
    ? students.find((student) => student.id === user.studentId)
    : undefined;
  if (directlyLinkedStudent) {
    return [directlyLinkedStudent];
  }

  const username = user.username.trim().toLowerCase();
  return students.filter(
    (student) => student.parentUsername.trim().toLowerCase() === username
  );
}

export function getParentAccountForStudent(
  users: UserAccount[],
  student: Student
): UserAccount | undefined {
  const parentUsers = users.filter(
    (user) => user.role === 'orangtua' && user.status !== 'nonaktif'
  );
  return (
    parentUsers.find((user) => user.studentId === student.id) ||
    parentUsers.find(
      (user) =>
        user.username.trim().toLowerCase() === student.parentUsername.trim().toLowerCase()
    )
  );
}
