import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlaskConical,
  Server,
  Globe,
  X,
  ChevronUp,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { getEnvironmentInfo } from '@/libs/utils/environment';

/**
 * Visual badge and diagnostic panel rendered in the bottom-right corner of the screen.
 * Displays only in non-production environments (local, dev, staging, preview) to prevent
 * accidental operations across environments.
 *
 * @returns {React.ReactElement | null} The environment badge element, or null if running in production.
 */
const EnvironmentBadge: React.FC = () => {
  const { t } = useTranslation('common');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(() => {
    try {
      return localStorage.getItem('ff_env_badge_minimized') === 'true';
    } catch {
      return false;
    }
  });

  const envInfo = getEnvironmentInfo();

  if (!envInfo.isTestOrLocal) return null;

  /**
   * Toggles the minimized pill state and persists user preference.
   *
   * @param {React.MouseEvent} event - Click event.
   * @returns {void}
   */
  const handleToggleMinimize = (event: React.MouseEvent): void => {
    event.stopPropagation();
    const nextState = !isMinimized;
    setIsMinimized(nextState);
    try {
      localStorage.setItem('ff_env_badge_minimized', String(nextState));
    } catch {
      // Ignore localStorage availability errors
    }
  };

  /**
   * Toggles the diagnostic details popover.
   *
   * @returns {void}
   */
  const handleToggleDetails = (): void => {
    setIsDetailsOpen((prev) => !prev);
  };

  return (
    <div
      className="fixed bottom-20 sm:bottom-4 right-3 sm:right-4 z-[9990] flex flex-col items-end select-none font-sans"
      data-testid="environment-badge-container"
    >
      {/* Diagnostic details popover */}
      {isDetailsOpen && (
        <div
          role="dialog"
          aria-label={t('environment.modal_title')}
          className="mb-2 w-72 sm:w-80 rounded-2xl bg-white p-4 text-slate-800 shadow-2xl border-2 border-orange-400 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <div className="flex items-center justify-between pb-2 border-b border-orange-100">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                <FlaskConical className="h-3.5 w-3.5" />
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-orange-700">
                {t('environment.modal_title')}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setIsDetailsOpen(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              aria-label={t('environment.close')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            {t('environment.modal_description')}
          </p>

          <div className="mt-3 space-y-2 rounded-xl bg-orange-50/60 p-2.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                <Globe className="h-3.5 w-3.5 text-orange-500" />
                {t('environment.host_label')}
              </span>
              <span
                className="max-w-[150px] truncate font-mono text-[11px] font-semibold text-slate-800"
                title={envInfo.hostname || 'localhost'}
              >
                {envInfo.hostname || 'localhost'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                <Server className="h-3.5 w-3.5 text-orange-500" />
                {t('environment.api_label')}
              </span>
              <span
                className="max-w-[150px] truncate font-mono text-[11px] font-semibold text-slate-800"
                title={envInfo.apiBaseUrl}
              >
                {envInfo.apiBaseUrl || 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                <FlaskConical className="h-3.5 w-3.5 text-orange-500" />
                {t('environment.mode_label')}
              </span>
              <span className="font-mono text-[11px] font-semibold uppercase text-orange-700">
                {envInfo.mode}
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleToggleMinimize}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-orange-600 transition-colors"
            >
              {isMinimized ? (
                <>
                  <Maximize2 className="h-3 w-3" />
                  {t('environment.expand')}
                </>
              ) : (
                <>
                  <Minimize2 className="h-3 w-3" />
                  {t('environment.minimize')}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsDetailsOpen(false)}
              className="rounded-lg bg-orange-500 px-3 py-1 text-[11px] font-bold text-white hover:bg-orange-600 transition-colors"
            >
              {t('environment.close')}
            </button>
          </div>
        </div>
      )}

      {/* Flag / Badge trigger */}
      {isMinimized ? (
        <button
          type="button"
          onClick={handleToggleDetails}
          className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/40 border-2 border-white hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
          aria-label={t('environment.badge_tooltip')}
          title={t('environment.badge_tooltip')}
        >
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
          </span>
          <FlaskConical className="h-4 w-4 drop-shadow" />
        </button>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={handleToggleDetails}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleToggleDetails();
            }
          }}
          className="group relative flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 pl-3 pr-2 py-1.5 text-white shadow-xl shadow-orange-500/35 border-2 border-white/80 hover:scale-[1.02] active:scale-98 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
          title={t('environment.badge_tooltip')}
          data-testid="environment-badge-pill"
        >
          {/* Animated beacon dot */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
          </span>

          <FlaskConical className="h-3.5 w-3.5 drop-shadow" />

          <div className="flex items-center gap-1.5 font-bold tracking-wider uppercase text-[11px]">
            <span className="bg-orange-700/50 px-1.5 py-0.5 rounded text-[10px] tracking-widest font-black">
              {envInfo.environmentName}
            </span>
            <span className="hidden sm:inline">
              {t('environment.badge_label')}
            </span>
          </div>

          {/* Quick minimize icon button */}
          <button
            type="button"
            onClick={handleToggleMinimize}
            className="ml-1 rounded-full p-1 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
            aria-label={t('environment.minimize')}
            title={t('environment.minimize')}
          >
            <Minimize2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default EnvironmentBadge;
