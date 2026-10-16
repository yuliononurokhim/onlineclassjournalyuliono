import React, { useState, useMemo } from 'react';
import { useEduStore } from '../../services/store';
import { UserAccount, UserRole } from '../../types';
import {
  Users,
  Search,
  X,
  Shield,
  BookOpen,
  HeartHandshake,
  Sparkles,
  ArrowRight,
  UserCheck,
  CheckCircle2
} from 'lucide-react';

interface ImpersonateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser?: (user: UserAccount) => void;
}

export const ImpersonateModal: React.FC<ImpersonateModalProps> = ({
  isOpen,
  onClose,
  onSelectUser,
}) => {
  const { users, students, currentUser, isImpersonating, impersonateUser } = useEduStore();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'teachers' | 'parents'>('all');

  // Build complete searchable list of users
  // Ensure all students have a parent entry represented
  const allAccounts = useMemo(() => {
    const list: Array<UserAccount & { studentName?: string; studentNisn?: string }> = [];

    users.forEach((u) => {
      const student = u.studentId
        ? students.find((s) => s.id === u.studentId)
        : students.find((s) => s.parentUsername.toLowerCase() === u.username.toLowerCase());

      list.push({
        ...u,
        studentName: student?.name,
        studentNisn: student?.nisn,
      });
    });

    // Also include any students whose parent account wasn't explicitly in users list yet
    students.forEach((st) => {
      if (!list.some((u) => u.studentId === st.id || u.username.toLowerCase() === st.parentUsername.toLowerCase())) {
        list.push({
          id: `usr-parent-${st.id}`,
          username: st.parentUsername,
          password: st.parentPassword,
          role: 'orangtua',
          name: `${st.parentName} (Wali)`,
          title: `Orang Tua dari ${st.name}`,
          studentId: st.id,
          phone: st.parentPhone,
          studentName: st.name,
          studentNisn: st.nisn,
        });
      }
    });

    return list;
  }, [users, students]);

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    return allAccounts.filter((acc) => {
      // Role filter
      if (roleFilter === 'teachers' && acc.role === 'orangtua') return false;
      if (roleFilter === 'parents' && acc.role !== 'orangtua') return false;

      // Search query
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        acc.name.toLowerCase().includes(q) ||
        acc.username.toLowerCase().includes(q) ||
        (acc.title && acc.title.toLowerCase().includes(q)) ||
        (acc.studentName && acc.studentName.toLowerCase().includes(q)) ||
        (acc.studentNisn && acc.studentNisn.toLowerCase().includes(q)) ||
        (acc.phone && acc.phone.includes(q))
      );
    });
  }, [allAccounts, roleFilter, search]);

  if (!isOpen || (currentUser?.role !== 'admin' && !isImpersonating)) return null;

  const handleImpersonate = (target: UserAccount) => {
    impersonateUser(target);
    if (onSelectUser) onSelectUser(target);
    onClose();
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-slate-700" />;
      case 'guru_kelas':
        return <BookOpen className="w-4 h-4 text-indigo-700" />;
      case 'guru_bk':
        return <HeartHandshake className="w-4 h-4 text-rose-700" />;
      case 'guru_pai':
        return <Sparkles className="w-4 h-4 text-teal-700" />;
      case 'orangtua':
        return <Users className="w-4 h-4 text-amber-700" />;
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'guru_kelas':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'guru_bk':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'guru_pai':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'orangtua':
        return 'bg-amber-50 text-amber-900 border-amber-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-md shadow-indigo-100">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Mode Beralih Akun (Impersonasi Admin)
              </h3>
              <p className="text-xs text-slate-500">
                Akses penuh admin untuk masuk langsung ke akun guru atau wali murid manapun
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Tabs */}
        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama guru, wali murid, nama anak, NISN, atau username..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                roleFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Akun ({allAccounts.length})
            </button>
            <button
              onClick={() => setRoleFilter('teachers')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                roleFilter === 'teachers'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Guru & Tendik ({allAccounts.filter((a) => a.role !== 'orangtua').length})
            </button>
            <button
              onClick={() => setRoleFilter('parents')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                roleFilter === 'parents'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Wali Murid ({allAccounts.filter((a) => a.role === 'orangtua').length})
            </button>
          </div>
        </div>

        {/* Accounts List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[50vh] scrollbar-thin">
          {filteredAccounts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Tidak ada akun yang sesuai dengan pencarian Anda.
            </div>
          ) : (
            filteredAccounts.map((acc) => {
              const isCurrent = currentUser?.id === acc.id || currentUser?.username === acc.username;

              return (
                <div
                  key={acc.id + '-' + acc.username}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-indigo-50/70 border-indigo-300'
                      : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                      {getRoleIcon(acc.role)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {acc.name}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.2 rounded-full border font-semibold ${getRoleBadge(
                            acc.role
                          )}`}
                        >
                          {acc.role === 'admin'
                            ? 'Admin'
                            : acc.role === 'guru_kelas'
                            ? 'Guru Kelas'
                            : acc.role === 'guru_bk'
                            ? 'Guru BK'
                            : acc.role === 'guru_pai'
                            ? 'Guru PAI dan Islamic Literacy'
                            : 'Orang Tua'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        Username: <span className="font-mono font-bold text-slate-700">{acc.username}</span>
                        {acc.studentName && (
                          <span className="ml-2 text-indigo-700 font-medium">
                            · Anak: <strong>{acc.studentName}</strong> ({acc.studentNisn || '-'})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 sm:mt-0 flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {isCurrent ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-100 px-3 py-1.5 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Akun Aktif</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleImpersonate(acc)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors"
                      >
                        <span>Masuk Sebagai Ini</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Note */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            💡 Admin dapat kembali ke akun admin kapan saja melalui tombol banner di atas layar.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
