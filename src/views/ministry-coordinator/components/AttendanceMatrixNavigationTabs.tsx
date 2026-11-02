import { APP_ROUTES } from '@/config/routes';
import clsx from 'clsx';
import { Calendar, LayoutGrid } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Top navigation tabs to switch between the single-service attendance report
 * and the multi-event early intervention matrix console.
 *
 * @returns {JSX.Element} Rendered tab switcher.
 */
export const AttendanceMatrixNavigationTabs: React.FC = () => {
  const { t } = useTranslation(['hub', 'common']);
  const navigate = useNavigate();
  const location = useLocation();

  const isMatrixView = location.pathname.includes('/attendance-matrix');

  return (
    <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
      <button
        type="button"
        onClick={() => navigate(APP_ROUTES.ministryCoordinator.attendance)}
        className={clsx(
          'inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer select-none',
          !isMatrixView
            ? 'bg-[#0284c7] text-white shadow-xs'
            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50',
        )}
      >
        <Calendar className="w-3.5 h-3.5" />
        <span>
          {t('hub:attendance_matrix.nav_tab_single', {
            defaultValue: 'Por Servicio',
          })}
        </span>
      </button>

      <button
        type="button"
        onClick={() =>
          navigate(APP_ROUTES.ministryCoordinator.attendanceMatrix)
        }
        className={clsx(
          'inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer select-none',
          isMatrixView
            ? 'bg-[#0284c7] text-white shadow-xs'
            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50',
        )}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        <span>
          {t('hub:attendance_matrix.nav_tab_matrix', {
            defaultValue: 'Matriz Multievento',
          })}
        </span>
      </button>
    </div>
  );
};

export default AttendanceMatrixNavigationTabs;
