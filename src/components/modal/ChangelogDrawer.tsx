import React, { useState } from 'react';
import { Sparkles, ChevronDown, Clock, CheckCircle2, Info, Layers } from 'lucide-react';
import clsx from 'clsx';
import { AppDrawer } from '@/components/ui/AppDrawer';
import { APP_CHANGELOG, APP_VERSION, SEMVER_META, ChangelogItem } from '@/constants/version';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';

interface ChangelogDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * ChangelogDrawer displays the version history of the application following the SemVer standard.
 * It provides users with a friendly, non-technical explanation of changes release by release.
 *
 * @param {ChangelogDrawerProps} props - Component props.
 * @returns {JSX.Element} The rendered drawer.
 */
export const ChangelogDrawer: React.FC<ChangelogDrawerProps> = ({ open, onOpenChange }) => {
  useModalBackClose(open, () => onOpenChange(false));

  // Initialize with the most recent version expanded by default
  const [expandedVersions, setExpandedVersions] = useState<string[]>([APP_VERSION]);
  const [showSemVerGuide, setShowSemVerGuide] = useState<boolean>(false);

  const toggleVersion = (version: string) => {
    setExpandedVersions((prev) =>
      prev.includes(version) ? prev.filter((v) => v !== version) : [...prev, version]
    );
  };

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Novedades de Iglekids"
      icon={<Sparkles size={18} className="text-amber-500" />}
      maxHeight="max-h-[85dvh]"
      contentClassName="max-w-xl mx-auto"
      bodyClassName="p-4 space-y-4 overflow-y-auto"
    >
      <div className="space-y-4 pb-6">
        {/* Current Version Banner */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-primary/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                  Versión actual
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  v{APP_VERSION}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                Historial completo de cambios y actualizaciones de la app.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSemVerGuide(!showSemVerGuide)}
            className="text-xs text-primary font-medium hover:underline shrink-0 flex items-center gap-1 cursor-pointer bg-white/70 px-2.5 py-1.5 rounded-lg border border-gray-200 shadow-2xs"
            title="¿Cómo funciona el versionado SemVer?"
          >
            <Info size={14} />
            <span className="hidden sm:inline">¿Cómo se lee?</span>
          </button>
        </div>

        {/* SemVer Educational Helper (Collapsible) */}
        {showSemVerGuide && (
          <div className="bg-white border border-gray-200 rounded-xl p-3.5 text-xs text-gray-600 space-y-2 shadow-2xs animate-in fade-in duration-150">
            <div className="flex items-center justify-between font-semibold text-gray-800">
              <span className="flex items-center gap-1.5">
                <Layers size={14} className="text-primary" />
                Estándar de Versionado Semántico (MAYOR.MENOR.PARCHE)
              </span>
              <button
                type="button"
                onClick={() => setShowSemVerGuide(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <div className="p-2 rounded-lg bg-rose-50/70 border border-rose-100">
                <p className="font-bold text-rose-700 mb-0.5">🔴 MAYOR (X.0.0)</p>
                <p className="text-[11px] text-gray-600">Rediseño general o cambios estructurales grandes.</p>
              </div>
              <div className="p-2 rounded-lg bg-sky-50/70 border border-sky-100">
                <p className="font-bold text-sky-700 mb-0.5">🔵 MENOR (3.X.0)</p>
                <p className="text-[11px] text-gray-600">Nuevas pantallas, herramientas y funcionalidades.</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100">
                <p className="font-bold text-emerald-700 mb-0.5">🟢 PARCHE (3.0.X)</p>
                <p className="text-[11px] text-gray-600">Corrección de fallos, mejoras visuales y rapidez.</p>
              </div>
            </div>
          </div>
        )}

        {/* Releases Accordion List */}
        <div className="space-y-3">
          {APP_CHANGELOG.map((release: ChangelogItem, index: number) => {
            const isExpanded = expandedVersions.includes(release.version);
            const isLatest = index === 0;
            const meta = SEMVER_META[release.type] || SEMVER_META.patch;

            return (
              <div
                key={release.version}
                className={clsx(
                  'bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-2xs',
                  isLatest ? 'border-primary/30 ring-1 ring-primary/10' : 'border-gray-200'
                )}
              >
                {/* Accordion Trigger Header */}
                <button
                  type="button"
                  onClick={() => toggleVersion(release.version)}
                  className="w-full text-left px-4 py-3.5 flex items-start justify-between gap-3 hover:bg-gray-50/60 transition-colors cursor-pointer select-none"
                  aria-expanded={isExpanded}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-gray-900">
                        v{release.version}
                      </span>

                      <span
                        className={clsx(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border',
                          meta.badgeClass
                        )}
                      >
                        <span className={clsx('w-1.5 h-1.5 rounded-full', meta.dotClass)} />
                        {meta.label}
                      </span>

                      {isLatest && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                          Actual
                        </span>
                      )}
                    </div>

                    <p className="font-semibold text-sm text-gray-800 leading-snug truncate">
                      {release.title}
                    </p>

                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                      <Clock size={12} />
                      <span>{release.dateFormatted}</span>
                    </div>
                  </div>

                  <div className="pt-1 shrink-0">
                    <div
                      className={clsx(
                        'w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 transition-transform duration-200',
                        isExpanded ? 'rotate-180 bg-primary/10 text-primary' : ''
                      )}
                    >
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </button>

                {/* Accordion Body */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-gray-100 bg-gray-50/40 text-sm space-y-3 animate-in fade-in-50 duration-150">
                    {release.description && (
                      <p className="text-xs text-gray-600 leading-relaxed pt-1">
                        {release.description}
                      </p>
                    )}

                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        Cambios incluidos:
                      </p>
                      <ul className="space-y-2">
                        {release.changes.map((change: string, idx: number) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2.5 text-xs text-gray-700 leading-relaxed"
                          >
                            <CheckCircle2
                              size={15}
                              className="text-emerald-500 shrink-0 mt-0.5"
                            />
                            <span>{change}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppDrawer>
  );
};

export default ChangelogDrawer;
