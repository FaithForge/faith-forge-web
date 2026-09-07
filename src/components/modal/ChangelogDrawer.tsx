import React, { useMemo, useState } from 'react';
import { Sparkles, ChevronDown, Clock, CheckCircle2, Info, Layers, Wrench } from 'lucide-react';
import clsx from 'clsx';
import { AppDrawer } from '@/components/ui/AppDrawer';
import { APP_CHANGELOG, APP_VERSION, SEMVER_META, ChangelogItem } from '@/constants/version';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';

interface ChangelogDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ChangelogGroup {
  seriesKey: string;
  latestItem: ChangelogItem;
  baseItem: ChangelogItem;
  patches: ChangelogItem[];
}

/**
 * ChangelogDrawer displays the version history of the application following the SemVer standard.
 * It groups patch releases under their parent minor/major version without creating separate dropdowns,
 * keeping the history organized and clear for end users.
 *
 * @param {ChangelogDrawerProps} props - Component props.
 * @returns {JSX.Element} The rendered drawer.
 */
export const ChangelogDrawer: React.FC<ChangelogDrawerProps> = ({ open, onOpenChange }) => {
  useModalBackClose(open, () => onOpenChange(false));

  // Groups releases by Major.Minor series (e.g. 3.1.x, 3.0.x)
  const groupedReleases: ChangelogGroup[] = useMemo(() => {
    const groupsMap = new Map<string, ChangelogGroup>();

    for (const item of APP_CHANGELOG) {
      const parts = item.version.split('.');
      const seriesKey = parts.length >= 2 ? `${parts[0]}.${parts[1]}` : item.version;

      if (!groupsMap.has(seriesKey)) {
        groupsMap.set(seriesKey, {
          seriesKey,
          latestItem: item,
          baseItem: item,
          patches: [],
        });
      }

      const group = groupsMap.get(seriesKey)!;

      if (item.type === 'patch') {
        group.patches.push(item);
      } else {
        // Base major or minor release
        group.baseItem = item;
      }
    }

    return Array.from(groupsMap.values());
  }, []);

  // Initialize with the most recent series expanded by default
  const [expandedVersions, setExpandedVersions] = useState<string[]>([
    groupedReleases[0]?.seriesKey || '3.1',
  ]);
  // Patches are collapsible and closed by default
  const [expandedPatches, setExpandedPatches] = useState<string[]>([]);
  const [showSemVerGuide, setShowSemVerGuide] = useState<boolean>(false);

  const toggleVersion = (seriesKey: string) => {
    setExpandedVersions((prev) =>
      prev.includes(seriesKey) ? prev.filter((v) => v !== seriesKey) : [...prev, seriesKey]
    );
  };

  const togglePatch = (version: string) => {
    setExpandedPatches((prev) =>
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

        {/* Releases Accordion List (Grouped by Major.Minor) */}
        <div className="space-y-3">
          {groupedReleases.map((group: ChangelogGroup, index: number) => {
            const isExpanded = expandedVersions.includes(group.seriesKey);
            const isLatest = index === 0;
            const baseMeta = SEMVER_META[group.baseItem.type] || SEMVER_META.minor;

            return (
              <div
                key={group.seriesKey}
                className={clsx(
                  'bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-2xs',
                  isLatest ? 'border-primary/30 ring-1 ring-primary/10' : 'border-gray-200'
                )}
              >
                {/* Accordion Trigger Header: shows latest version and title */}
                <button
                  type="button"
                  onClick={() => toggleVersion(group.seriesKey)}
                  className="w-full text-left px-4 py-3.5 flex items-start justify-between gap-3 hover:bg-gray-50/60 transition-colors cursor-pointer select-none"
                  aria-expanded={isExpanded}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-gray-900">
                        v{group.latestItem.version}
                      </span>

                      <span
                        className={clsx(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border',
                          baseMeta.badgeClass
                        )}
                      >
                        <span className={clsx('w-1.5 h-1.5 rounded-full', baseMeta.dotClass)} />
                        {baseMeta.label}
                      </span>

                      {group.patches.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {group.patches.length} {group.patches.length === 1 ? 'parche' : 'parches'}
                        </span>
                      )}

                      {isLatest && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                          Actual
                        </span>
                      )}
                    </div>

                    {/* Title with break-words to ensure it is never cut off */}
                    <p className="font-semibold text-sm text-gray-800 leading-snug break-words">
                      {group.latestItem.title}
                    </p>

                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                      <Clock size={12} />
                      <span>{group.latestItem.dateFormatted}</span>
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
                  <div className="px-4 pb-4 pt-1 border-t border-gray-100 bg-gray-50/40 text-sm space-y-4 animate-in fade-in-50 duration-150">
                    {/* Base Release Details */}
                    {group.baseItem.description && (
                      <p className="text-xs text-gray-600 leading-relaxed pt-1">
                        {group.baseItem.description}
                      </p>
                    )}

                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        {group.patches.length > 0
                          ? `Funcionalidades de la versión v${group.baseItem.version}:`
                          : 'Cambios incluidos:'}
                      </p>
                      <ul className="space-y-2">
                        {group.baseItem.changes.map((change: string, idx: number) => (
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

                    {/* Patches History Section (Newest to Oldest) */}
                    {group.patches.length > 0 && (
                      <div className="pt-3 border-t border-gray-200/80 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                            <Wrench size={13} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                              Historial de Parches
                            </p>
                            <p className="text-[11px] text-gray-500">
                              Correcciones de errores y mejoras en orden reciente
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          {group.patches.map((patch: ChangelogItem) => {
                            const isPatchExpanded = expandedPatches.includes(patch.version);

                            return (
                              <div
                                key={patch.version}
                                className="bg-white rounded-xl border border-emerald-100 shadow-2xs overflow-hidden transition-all duration-150"
                              >
                                {/* Patch Accordion Trigger Header */}
                                <button
                                  type="button"
                                  onClick={() => togglePatch(patch.version)}
                                  className="w-full text-left p-3 flex items-start justify-between gap-2.5 hover:bg-emerald-50/40 transition-colors cursor-pointer select-none"
                                  aria-expanded={isPatchExpanded}
                                >
                                  <div className="space-y-1 flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="font-extrabold text-xs text-gray-900">
                                        v{patch.version}
                                      </span>
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        Parche
                                      </span>
                                    </div>

                                    <p className="text-xs font-bold text-gray-800 leading-snug break-words">
                                      {patch.title}
                                    </p>

                                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                      <Clock size={11} />
                                      <span>{patch.dateFormatted}</span>
                                    </div>
                                  </div>

                                  <div className="pt-0.5 shrink-0">
                                    <div
                                      className={clsx(
                                        'w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 transition-transform duration-200',
                                        isPatchExpanded ? 'rotate-180 bg-emerald-100 text-emerald-700' : ''
                                      )}
                                    >
                                      <ChevronDown size={14} />
                                    </div>
                                  </div>
                                </button>

                                {/* Patch Accordion Body (Collapsible) */}
                                {isPatchExpanded && (
                                  <div className="px-3 pb-3 pt-2 border-t border-emerald-100/80 bg-emerald-50/20 space-y-2 text-xs animate-in fade-in-50 duration-150">
                                    {patch.description && (
                                      <p className="text-[11px] text-gray-600 leading-relaxed">
                                        {patch.description}
                                      </p>
                                    )}

                                    <ul className="space-y-1.5 pt-0.5">
                                      {patch.changes.map((change: string, cIdx: number) => (
                                        <li
                                          key={cIdx}
                                          className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed"
                                        >
                                          <CheckCircle2
                                            size={14}
                                            className="text-emerald-500 shrink-0 mt-0.5"
                                          />
                                          <span>{change}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
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
