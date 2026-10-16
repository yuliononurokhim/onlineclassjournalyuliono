import React from 'react';
import { Student } from '../../types';

interface StarAwardBatchFieldsProps {
  students: Student[];
  selectedStudentIds: string[];
  onSelectedStudentIdsChange: (studentIds: string[]) => void;
  category: string;
  onCategoryChange: (category: string) => void;
  categoryOptions: string[];
  newCategory: string;
  onNewCategoryChange: (category: string) => void;
  onAddCategory: () => void;
  categoryLabel: string;
}

export const StarAwardBatchFields: React.FC<StarAwardBatchFieldsProps> = ({
  students,
  selectedStudentIds,
  onSelectedStudentIdsChange,
  category,
  onCategoryChange,
  categoryOptions,
  newCategory,
  onNewCategoryChange,
  onAddCategory,
  categoryLabel,
}) => {
  const selectedCount = students.filter((student) => selectedStudentIds.includes(student.id)).length;
  const allSelected = students.length > 0 && selectedCount === students.length;

  const toggleStudent = (studentId: string) => {
    onSelectedStudentIdsChange(
      selectedStudentIds.includes(studentId)
        ? selectedStudentIds.filter((id) => id !== studentId)
        : [...selectedStudentIds, studentId]
    );
  };

  return (
    <>
      <fieldset>
        <div className="flex items-center justify-between mb-1">
          <legend className="text-xs font-semibold text-slate-700">Pilih Siswa</legend>
          <span className="text-[11px] text-slate-500">{selectedCount} dipilih</span>
        </div>
        <label className="flex items-center gap-2 px-3 py-2 mb-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() =>
              onSelectedStudentIdsChange(allSelected ? [] : students.map((student) => student.id))
            }
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          Pilih semua siswa
        </label>
        <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
          {students.map((student) => (
            <label
              key={student.id}
              className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedStudentIds.includes(student.id)}
                onChange={() => toggleStudent(student.id)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-semibold">{student.name}</span>
              <span className="ml-auto text-slate-400 font-mono">{student.nisn}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">{categoryLabel}</label>
        <select
          required
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
        >
          {categoryOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={newCategory}
            onChange={(event) => onNewCategoryChange(event.target.value)}
            aria-label="Kategori baru"
            placeholder="Tambah kategori baru..."
            className="min-w-0 flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={onAddCategory}
            disabled={!newCategory.trim()}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Tambah
          </button>
        </div>
      </div>
    </>
  );
};
