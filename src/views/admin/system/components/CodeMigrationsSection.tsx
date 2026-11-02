import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Sparkles,
  Terminal,
  ShieldAlert,
  ArrowRight,
  History,
  Trash2,
  Layers,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { usePermissions } from '@/libs/hooks/usePermissions';
import { useRunCodeMigrationMutation } from '@/libs/state/redux/api/churchApi';
import {
  AVAILABLE_CODE_MIGRATIONS,
  CodeMigrationMicroservice,
  IAvailableCodeMigration,
  ICodeMigrationResult,
  IRunCodeMigrationResponse,
} from '@/libs/models';
import { DATE_TIME_FORMAT_ISO } from '@/libs/common-types/constants';

/**
 * Section for executing backend code migrations under demand.
 * Provides a cheat-sheet of existing migrations, a custom form, force flag controls,
 * a safety confirmation modal, and rich feedback for all 4 execution statuses.
 *
 * @returns {JSX.Element} Rendered code migrations section.
 */
export const CodeMigrationsSection: React.FC = () => {
  const { t } = useTranslation(['admin', 'common']);
  const { can } = usePermissions();
  const canRunMigrations = can('admin:run-code-migrations');

  const [runMigrationMutation, { isLoading: isRunning }] =
    useRunCodeMigrationMutation();

  const [selectedMicroservice, setSelectedMicroservice] =
    useState<CodeMigrationMicroservice>('kid-church');
  const [migrationName, setMigrationName] = useState<string>(
    'MigrateExistingKidsToUsers1792100001000'
  );
  const [force, setForce] = useState<boolean>(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);

  // Active result and session history
  const [currentResult, setCurrentResult] =
    useState<ICodeMigrationResult | null>(null);
  const [history, setHistory] = useState<ICodeMigrationResult[]>([]);

  /**
   * Sets up parameters in the form from a cheat-sheet card item.
   *
   * @param {IAvailableCodeMigration} item - Predefined migration.
   */
  const handleSelectCheatSheet = (item: IAvailableCodeMigration) => {
    setSelectedMicroservice(item.microservice);
    setMigrationName(item.migrationName);
    setForce(false);
  };

  /**
   * Prepares execution and opens confirmation dialog.
   *
   * @param {React.FormEvent} e - Form event.
   */
  const handlePromptExecution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!migrationName.trim() || !selectedMicroservice) {
      toast.error(
        t('admin:system_operations.migrations.notifications.validation_error')
      );
      return;
    }
    setConfirmModalOpen(true);
  };

  /**
   * Executes the code migration via RTK Query mutation.
   * Gracefully handles 200 envelopes and 4xx/5xx error structures.
   */
  const handleExecuteMigration = async () => {
    const toastId = toast.loading(
      t('admin:system_operations.migrations.notifications.started')
    );

    try {
      const response: IRunCodeMigrationResponse = await runMigrationMutation({
        microservice: selectedMicroservice,
        migrationName: migrationName.trim(),
        force,
      }).unwrap();

      const result = response.result;
      setCurrentResult(result);
      setHistory((prev) => [result, ...prev.filter((h) => h.name !== result.name || h.executedAt !== result.executedAt)]);

      if (result.status === 'EXECUTED') {
        toast.success(
          t('admin:system_operations.migrations.notifications.executed_success'),
          { id: toastId }
        );
      } else if (result.status === 'ALREADY_COMPLETED') {
        toast.info(
          t('admin:system_operations.migrations.notifications.already_completed'),
          { id: toastId }
        );
      } else if (result.status === 'NOT_FOUND') {
        toast.warning(
          t('admin:system_operations.migrations.notifications.not_found'),
          { id: toastId }
        );
      } else {
        toast.error(
          t('admin:system_operations.migrations.notifications.failed'),
          { id: toastId }
        );
      }
    } catch (err: unknown) {
      // In case backend rejects with HTTP 4xx/5xx, extract response body envelope
      const errorObj = err as {
        data?: { success?: boolean; result?: ICodeMigrationResult };
        message?: string;
      };

      if (errorObj?.data?.result) {
        const errorResult = errorObj.data.result;
        setCurrentResult(errorResult);
        setHistory((prev) => [errorResult, ...prev]);

        if (errorResult.status === 'NOT_FOUND') {
          toast.warning(
            t('admin:system_operations.migrations.notifications.not_found'),
            { id: toastId }
          );
        } else {
          toast.error(
            t('admin:system_operations.migrations.notifications.failed'),
            { id: toastId }
          );
        }
      } else {
        const genericFailure: ICodeMigrationResult = {
          name: migrationName.trim(),
          microservice: selectedMicroservice,
          status: 'FAILED',
          message: errorObj?.message || 'Error inesperado al ejecutar migración',
          error: String(err),
        };
        setCurrentResult(genericFailure);
        setHistory((prev) => [genericFailure, ...prev]);
        toast.error(
          t('admin:system_operations.migrations.notifications.failed'),
          { id: toastId }
        );
      }
    }
  };

  /**
   * Helper to load an already completed migration and toggle force to true for immediate re-execution.
   */
  const handlePrepareForceRetry = () => {
    if (!currentResult) return;
    setSelectedMicroservice(currentResult.microservice);
    setMigrationName(currentResult.name);
    setForce(true);
    toast.info('Parámetro force activado. Puedes confirmar para re-ejecutar.');
  };

  /**
   * Helper to format timestamps using standard ISO date/time format.
   *
   * @param {string} [timestamp] - ISO timestamp string.
   * @returns {string} Formatted date/time.
   */
  const formatExecutedAt = (timestamp?: string): string => {
    if (!timestamp) return '—';
    const parsed = dayjs(timestamp);
    if (!parsed.isValid()) return timestamp;
    return parsed.format(DATE_TIME_FORMAT_ISO);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Informative Header Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 shadow-2xs">
            <Terminal size={20} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-0.5">
              <Sparkles size={12} />
              <span>{t('admin:system_operations.migrations.title')}</span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              {t('admin:system_operations.migrations.title')}
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {t('admin:system_operations.migrations.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Cheat-Sheet Predefined Migrations */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {t('admin:system_operations.migrations.cheat_sheet_title')}
            </h3>
            <p className="text-xs text-slate-500">
              {t('admin:system_operations.migrations.cheat_sheet_subtitle')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {AVAILABLE_CODE_MIGRATIONS.map((item) => {
            const isSelected =
              selectedMicroservice === item.microservice &&
              migrationName === item.migrationName;

            const microserviceBadgeColor =
              item.microservice === 'church'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : item.microservice === 'user'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200';

            return (
              <div
                key={item.migrationName}
                onClick={() => handleSelectCheatSheet(item)}
                className={clsx(
                  'group p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 text-left',
                  isSelected
                    ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-white border-slate-200/80 shadow-2xs hover:border-slate-300 hover:shadow-xs'
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={clsx(
                        'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                        microserviceBadgeColor
                      )}
                    >
                      {item.microservice}
                    </span>
                    <span className="text-slate-400 group-hover:text-indigo-600 transition-colors">
                      <ArrowRight size={14} />
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-mono font-bold text-slate-900 break-all leading-snug">
                    {item.migrationName}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    {t(item.descriptionKey, { defaultValue: item.defaultDescription })}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-indigo-600">
                  <span>{isSelected ? '✓ Seleccionada' : 'Usar esta migración'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Execution Form Card */}
      <form
        onSubmit={handlePromptExecution}
        className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col gap-5"
      >
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Layers size={18} className="text-indigo-600" />
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
            Configuración y Ejecución
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Microservice Selector */}
          <div>
            <Select
              label={t('admin:system_operations.migrations.form.microservice_label')}
              value={selectedMicroservice}
              onChange={(e) =>
                setSelectedMicroservice(e.target.value as CodeMigrationMicroservice)
              }
              disabled={isRunning || !canRunMigrations}
              required
            >
              <option value="church">church</option>
              <option value="user">user</option>
              <option value="kid-church">kid-church</option>
            </Select>
          </div>

          {/* Migration Name Input */}
          <div className="sm:col-span-2">
            <Input
              label={t('admin:system_operations.migrations.form.migration_name_label')}
              placeholder="placeholder:text-gray-400"
              value={migrationName}
              onChange={(e) => setMigrationName(e.target.value)}
              disabled={isRunning || !canRunMigrations}
              required
            />
          </div>
        </div>

        {/* Force Option Switch */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={clsx(
                'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
                force ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
              )}
            >
              {force ? <AlertTriangle size={16} /> : <Info size={16} />}
            </div>
            <div>
              <label
                htmlFor="force-toggle"
                className="text-xs font-bold text-slate-800 cursor-pointer block"
              >
                {t('admin:system_operations.migrations.form.force_label')}
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                {t('admin:system_operations.migrations.form.force_hint')}
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer select-none self-end sm:self-center">
            <input
              id="force-toggle"
              type="checkbox"
              checked={force}
              onChange={(e) => setForce(e.target.checked)}
              disabled={isRunning || !canRunMigrations}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={isRunning}
            disabled={!canRunMigrations || !migrationName.trim()}
            className="w-full sm:w-auto px-6"
          >
            <Play size={16} className="mr-1.5 fill-current" />
            <span>
              {isRunning
                ? t('admin:system_operations.migrations.form.running_btn')
                : t('admin:system_operations.migrations.form.submit_btn')}
            </span>
          </Button>
        </div>
      </form>

      {/* Execution Result Banner */}
      {currentResult && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-600" />
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                {t('admin:system_operations.migrations.results.title')}
              </h3>
            </div>
            <span
              className={clsx(
                'text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider',
                currentResult.status === 'EXECUTED' &&
                  'bg-emerald-100 text-emerald-800 border border-emerald-200',
                currentResult.status === 'ALREADY_COMPLETED' &&
                  'bg-amber-100 text-amber-800 border border-amber-200',
                currentResult.status === 'NOT_FOUND' &&
                  'bg-rose-100 text-rose-800 border border-rose-200',
                currentResult.status === 'FAILED' &&
                  'bg-red-100 text-red-800 border border-red-200'
              )}
            >
              {currentResult.status === 'EXECUTED' && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  {t('admin:system_operations.migrations.results.status_executed')}
                </span>
              )}
              {currentResult.status === 'ALREADY_COMPLETED' && (
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {t('admin:system_operations.migrations.results.status_already_completed')}
                </span>
              )}
              {currentResult.status === 'NOT_FOUND' && (
                <span className="flex items-center gap-1">
                  <AlertTriangle size={12} />
                  {t('admin:system_operations.migrations.results.status_not_found')}
                </span>
              )}
              {currentResult.status === 'FAILED' && (
                <span className="flex items-center gap-1">
                  <XCircle size={12} />
                  {t('admin:system_operations.migrations.results.status_failed')}
                </span>
              )}
            </span>
          </div>

          {/* Details Table / Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                Migración
              </span>
              <span className="font-mono font-bold text-slate-900 break-all">
                {currentResult.name}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                Microservicio
              </span>
              <span className="font-semibold text-slate-900">
                {currentResult.microservice}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                {t('admin:system_operations.migrations.results.duration')} / Fecha
              </span>
              <span className="font-semibold text-slate-700">
                {currentResult.durationMs !== undefined ? `${currentResult.durationMs}ms · ` : ''}
                {formatExecutedAt(currentResult.executedAt)}
              </span>
            </div>
          </div>

          {/* Message Banner */}
          <div
            className={clsx(
              'p-4 rounded-2xl text-xs leading-relaxed border',
              currentResult.status === 'EXECUTED' &&
                'bg-emerald-50/80 border-emerald-200 text-emerald-900',
              currentResult.status === 'ALREADY_COMPLETED' &&
                'bg-amber-50/80 border-amber-200 text-amber-900',
              currentResult.status === 'NOT_FOUND' &&
                'bg-rose-50/80 border-rose-200 text-rose-900',
              currentResult.status === 'FAILED' &&
                'bg-red-50/80 border-red-200 text-red-900'
            )}
          >
            <p className="font-medium">{currentResult.message}</p>

            {currentResult.status === 'ALREADY_COMPLETED' && (
              <div className="mt-3 pt-2.5 border-t border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[11px] text-amber-800">
                  {t('admin:system_operations.migrations.results.status_already_completed_hint')}
                </span>
                <button
                  type="button"
                  onClick={handlePrepareForceRetry}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-2xs transition-colors cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
                >
                  <RotateCcw size={12} />
                  <span>{t('admin:system_operations.migrations.results.force_retry_btn')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Available migrations list if NOT_FOUND */}
          {currentResult.availableMigrations && currentResult.availableMigrations.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-bold text-slate-800 block mb-2">
                {t('admin:system_operations.migrations.results.available_migrations')}
              </span>
              <ul className="space-y-1">
                {currentResult.availableMigrations.map((m) => (
                  <li
                    key={m}
                    onClick={() => {
                      setMigrationName(m);
                      setForce(false);
                    }}
                    className="font-mono text-xs text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer flex items-center gap-1.5"
                  >
                    <span>•</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Error traceback if FAILED */}
          {currentResult.error && (
            <div className="p-4 rounded-2xl bg-red-950 text-red-200 font-mono text-[11px] overflow-x-auto border border-red-900 leading-relaxed">
              <span className="text-red-400 font-bold block mb-1">
                {t('admin:system_operations.migrations.results.error_details')}
              </span>
              <pre className="whitespace-pre-wrap">{currentResult.error}</pre>
            </div>
          )}
        </div>
      )}

      {/* Session History Log */}
      {history.length > 0 && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <History size={16} className="text-slate-500" />
              <h3 className="text-sm font-bold text-slate-800">
                {t('admin:system_operations.migrations.history.title')} ({history.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setHistory([])}
              className="text-xs font-semibold text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
              <span>{t('admin:system_operations.migrations.history.clear_history')}</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 overflow-hidden">
            {history.map((item, idx) => (
              <div
                key={`${item.name}-${item.executedAt || idx}`}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-slate-50/60 px-2 rounded-xl transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={clsx(
                        'w-2 h-2 rounded-full shrink-0',
                        item.status === 'EXECUTED' && 'bg-emerald-500',
                        item.status === 'ALREADY_COMPLETED' && 'bg-amber-500',
                        item.status === 'NOT_FOUND' && 'bg-rose-500',
                        item.status === 'FAILED' && 'bg-red-500'
                      )}
                    />
                    <span className="font-mono font-bold text-slate-900 truncate">
                      {item.name}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {item.microservice}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {item.message}
                  </p>
                </div>

                <div className="shrink-0 text-right text-[11px] text-slate-400">
                  <span>{item.durationMs !== undefined ? `${item.durationMs}ms · ` : ''}</span>
                  <span>{formatExecutedAt(item.executedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety Confirmation Dialog */}
      <ConfirmModal
        open={confirmModalOpen}
        onOpenChange={setConfirmModalOpen}
        type={force ? 'danger' : 'warning'}
        title={t('admin:system_operations.migrations.confirm.title')}
        description={`${t('admin:system_operations.migrations.confirm.desc', {
          name: migrationName.trim(),
          microservice: selectedMicroservice,
        })} ${
          force
            ? t('admin:system_operations.migrations.confirm.force_warning')
            : ''
        }`}
        confirmText={t('admin:system_operations.migrations.confirm.confirm_btn')}
        cancelText={t('admin:system_operations.migrations.confirm.cancel_btn')}
        onConfirm={handleExecuteMigration}
      />
    </div>
  );
};

export default CodeMigrationsSection;
