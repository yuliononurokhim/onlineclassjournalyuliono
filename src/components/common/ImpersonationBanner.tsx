import React from 'react';
import { useEduStore } from '../../services/store';
import { UserCheck, RotateCcw, Shield } from 'lucide-react';

export const ImpersonationBanner: React.FC = () => {
  const { currentUser, isImpersonating, stopImpersonating } = useEduStore();

  if (!isImpersonating || !currentUser) return null;

  return (
    <aside aria-label="Mode Impersonasi" className="no-print bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white px-4 py-2 text-xs shadow-md border-b border-amber-900/40 z-40 relative">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1 rounded-md bg-white/20 text-white shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="truncate">
            <span className="font-bold tracking-tight">Mode Impersonasi Aktif:</span>{' '}
            <span className="text-amber-100">
              Anda sedang melihat aplikasi sebagai <strong>{currentUser.name}</strong> ({currentUser.title || currentUser.role})
            </span>
          </div>
        </div>

        <button
          onClick={stopImpersonating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-slate-900 font-extrabold text-xs hover:bg-amber-50 transition-all shadow-sm shrink-0"
        >
          <Shield className="w-3.5 h-3.5 text-indigo-700" />
          <span>Kembali ke Akun Admin</span>
          <RotateCcw className="w-3 h-3 text-slate-500" />
        </button>
      </div>
    </aside>
  );
};
