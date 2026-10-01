import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Check,
  X,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Calendar,
  Inbox,
  AlertCircle,
  Loader2,
  ChevronDown,
  ArrowUp,
} from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import dayjs from 'dayjs';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { CellListSkeleton } from '@/components/ui/DetailSkeleton';
import EndOfListFunnyBadge from '@/components/ui/EndOfListFunnyBadge';
import { useInfiniteScroll } from '@/libs/hooks/useInfiniteScroll';
import { formatDateTime } from '@/libs/utils/date';
import { capitalizeWords } from '@/libs/utils/text';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { useChurchTerm } from '@/libs/hooks/useTerm';
import { FaWhatsapp } from 'react-icons/fa6';
import {
  ApproveVolunteerApplication,
  GetVolunteerApplications,
  RejectVolunteerApplication,
} from '@/libs/state/redux/thunks/church/volunteerApplication.thunk';
import {
  IVolunteerApplication,
  VolunteerApplicationStatus,
  VolunteerRole,
} from '@/libs/models';

const STATUS_TABS: { label: string; value: VolunteerApplicationStatus | 'ALL' }[] = [
  { label: 'Pendientes', value: VolunteerApplicationStatus.PENDING },
  { label: 'Aprobadas', value: VolunteerApplicationStatus.APPROVED },
  { label: 'Rechazadas', value: VolunteerApplicationStatus.REJECTED },
  { label: 'Todas', value: 'ALL' },
];

/**
 * Tab component for coordinators and admins to review, approve, and reject volunteer applications.
 * Maintains full visual trace of approvals and rejections according to hierarchy scope.
 *
 * @returns {JSX.Element} Rendered applications review tab.
 */
export interface VolunteerApplicationsTabProps {
  initialCampusId?: string;
  initialGroupId?: string;
  lockGroup?: boolean;
  onApplicationProcessed?: () => void;
}

/**
 * Tab component for coordinators and admins to review, approve, and reject volunteer applications.
 * Maintains full visual trace of approvals and rejections according to hierarchy scope.
 *
 * @param {VolunteerApplicationsTabProps} props - Component properties.
 * @returns {JSX.Element} Rendered applications review tab.
 */
export const VolunteerApplicationsTab: React.FC<VolunteerApplicationsTabProps> = ({
  initialCampusId,
  initialGroupId,
  lockGroup = false,
  onApplicationProcessed,
}) => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.authSlice.user);
  const volunteerTerm = useChurchTerm('volunteer');

  const roleLabelShort: Record<VolunteerRole, string> = {
    [VolunteerRole.MINISTRY_GENERAL_COORDINATOR]: 'Coord. General',
    [VolunteerRole.AREA_GENERAL_COORDINATOR]: 'Coord. Área',
    [VolunteerRole.GROUP_COORDINATOR]: 'Coord. Grupo',
    [VolunteerRole.SUPERVISOR]: 'Supervisor',
    [VolunteerRole.VOLUNTEER]: volunteerTerm,
  };

  const {
    applications: { data: applications, loading, currentPage, totalPages },
    pendingCount,
    actionLoadingId,
  } = useAppSelector((state) => state.volunteerApplicationSlice);

  const campuses = useAppSelector((state) => state.churchCampusSlice.data);
  const { areasByMinistry } = useAppSelector((state) => state.ministrySlice);

  const [statusFilter, setStatusFilter] = useState<VolunteerApplicationStatus | 'ALL'>(
    VolunteerApplicationStatus.PENDING
  );
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCampusFilter, setSelectedCampusFilter] = useState(initialCampusId || 'ALL');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState('ALL');

  // Keep campus filter synchronized if initialCampusId changes
  useEffect(() => {
    if (initialCampusId) {
      setSelectedCampusFilter(initialCampusId);
    }
  }, [initialCampusId]);

  // Approval modal state
  const [applicationToApprove, setApplicationToApprove] = useState<IVolunteerApplication | null>(
    null
  );

  // Rejection modal state
  const [applicationToReject, setApplicationToReject] = useState<IVolunteerApplication | null>(
    null
  );
  const [rejectionReason, setRejectionReason] = useState('');

  const location = useLocation();
  const isInsideAdmin = location.pathname.startsWith('/admin');

  const [showScrollTop, setShowScrollTop] = useState(false);

  // Monitor scroll position on viewport and main element
  useEffect(() => {
    const handleScroll = () => {
      const mainEl = document.querySelector('main');
      const scrollPos = Math.max(
        mainEl?.scrollTop || 0,
        window.scrollY || 0,
        document.documentElement?.scrollTop || 0,
        document.body?.scrollTop || 0,
      );
      setShowScrollTop(scrollPos > 180);
    };

    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.addEventListener('scroll', handleScroll, { passive: true });
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });

    handleScroll();

    return () => {
      if (mainEl) {
        mainEl.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
    };
  }, []);

  /**
   * Scrolls the viewport smoothly back to the top.
   *
   * @returns {void}
   */
  const handleScrollToTop = (): void => {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement?.scrollTo({ top: 0, behavior: 'smooth' });
    document.body?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Fetch applications
  const fetchApplications = useCallback(
    (page = 1) => {
      const effectiveCampusId = lockGroup && initialCampusId
        ? initialCampusId
        : selectedCampusFilter !== 'ALL'
        ? selectedCampusFilter
        : undefined;

      const effectiveGroupId = lockGroup && initialGroupId ? initialGroupId : undefined;

      return dispatch(
        GetVolunteerApplications({
          page,
          limit: 20,
          status: statusFilter,
          search: debouncedSearch || undefined,
          churchCampusId: effectiveCampusId,
          ministryGroupConfigId: effectiveGroupId,
          ministryAreaId: selectedAreaFilter !== 'ALL' ? selectedAreaFilter : undefined,
        })
      );
    },
    [
      dispatch,
      statusFilter,
      debouncedSearch,
      selectedCampusFilter,
      selectedAreaFilter,
      lockGroup,
      initialCampusId,
      initialGroupId,
    ]
  );

  useEffect(() => {
    fetchApplications(1);
  }, [fetchApplications]);

  const hasMore = currentPage < totalPages;

  // Infinite Scroll: Load more applications when scrolling down
  const handleLoadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    try {
      await fetchApplications(currentPage + 1);
    } catch {
      // ignore
    }
  }, [loading, hasMore, fetchApplications, currentPage]);

  const { sentinelRef, loadingMore, triggerLoadMore } = useInfiniteScroll({
    onLoadMore: handleLoadMore,
    hasMore,
    isLoading: loading && applications.length === 0,
    threshold: 250,
    cooldownMs: 800,
  });

  // Handle Approve
  const handleConfirmApprove = async () => {
    if (!applicationToApprove) return;
    try {
      await dispatch(ApproveVolunteerApplication(applicationToApprove.id)).unwrap();
      toast.success(`Postulación aprobada y ${volunteerTerm.toLowerCase()} asignado(a) correctamente`);
      setApplicationToApprove(null);
      fetchApplications(1);
      onApplicationProcessed?.();
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : err?.message || 'Error al aprobar la postulación';
      toast.error(msg);
    }
  };

  // Handle Reject
  const handleConfirmReject = async () => {
    if (!applicationToReject) return;
    try {
      await dispatch(
        RejectVolunteerApplication({
          id: applicationToReject.id,
          reason: rejectionReason.trim() || undefined,
        })
      ).unwrap();
      toast.success('Postulación rechazada');
      setApplicationToReject(null);
      setRejectionReason('');
      fetchApplications(1);
      onApplicationProcessed?.();
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : err?.message || 'Error al rechazar la postulación';
      toast.error(msg);
    }
  };

  /**
   * Calculates user age in full years based on birthday.
   *
   * @param {string | Date} [birthday] - The user birthday.
   * @returns {number | null} Age in years, or null if invalid or not specified.
   */
  const calculateAge = (birthday?: string | Date): number | null => {
    if (!birthday) return null;
    const dateStr = typeof birthday === 'string' ? birthday.substring(0, 10) : dayjs(birthday).format('YYYY-MM-DD');
    const birth = dayjs.utc(dateStr);
    if (!birth.isValid()) return null;
    return dayjs().diff(birth, 'year');
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-3.5 shadow-2xs border border-slate-200/80 space-y-3">
        {/* Status Tabs - Full-width 4-column segmented control (no scroll / no drag) */}
        <div className="grid grid-cols-4 gap-1 sm:gap-1.5 w-full">
          {STATUS_TABS.map((tab) => {
            const isSelected = statusFilter === tab.value;
            const isPendingTab = tab.value === VolunteerApplicationStatus.PENDING;
            const showCount = isPendingTab && pendingCount > 0 ? pendingCount : undefined;

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={clsx(
                  'w-full py-1.5 px-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer text-center shadow-2xs',
                  isSelected
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                )}
              >
                <span className="truncate">{tab.label}</span>
                {showCount !== undefined && (
                  <span
                    className={clsx(
                      'px-1.5 py-0.2 rounded-full text-[10px] font-extrabold shrink-0',
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-amber-200 text-amber-900'
                    )}
                  >
                    {showCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search, Campus, and Refresh in a single cohesive row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Buscar postulante..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="text-xs placeholder:text-gray-400"
            />
          </div>

          {!lockGroup && campuses && campuses.length > 1 && (
            <div className="sm:w-44 shrink-0">
              <Select
                value={selectedCampusFilter}
                onChange={(e) => setSelectedCampusFilter(e.target.value)}
                className="text-xs"
              >
                <option value="ALL">Todas las sedes</option>
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <button
            type="button"
            onClick={() => fetchApplications(1)}
            disabled={loading}
            className="h-10 px-3.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 shadow-2xs transition-all active:scale-95 shrink-0 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Recargar postulaciones"
          >
            <RotateCcw size={14} className={clsx(loading && 'animate-spin text-primary')} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Applications List */}
      {loading && applications.length === 0 ? (
        <CellListSkeleton count={4} />
      ) : applications.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-1">
            <Inbox size={26} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No hay postulaciones registradas</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {statusFilter === VolunteerApplicationStatus.PENDING
              ? 'No tienes postulaciones pendientes por revisar en este momento.'
              : 'No se encontraron postulaciones con los filtros seleccionados.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const applicantUser = app.user;
            const firstName = applicantUser?.firstName || '';
            const lastName = applicantUser?.lastName || '';
            const applicantName = capitalizeWords(`${firstName} ${lastName}`.trim()) || 'Postulante';
            const age = calculateAge(applicantUser?.birthday);
            const isProcessing = actionLoadingId === app.id;
            const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'SV';

            const phone = applicantUser?.phone;
            const dialCode = applicantUser?.dialCodePhone || '+57';
            const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
            const fullPhone = cleanPhone ? `${dialCode}${cleanPhone}`.replace('+', '') : '';

            return (
              <div
                key={app.id}
                className={clsx(
                  'bg-white rounded-2xl border shadow-2xs hover:shadow-xs transition-all p-3.5 sm:p-4 space-y-2.5',
                  app.status === VolunteerApplicationStatus.PENDING
                    ? 'border-amber-200/90 bg-amber-50/10'
                    : 'border-slate-200/80'
                )}
              >
                {/* Header: Avatar, Name + Age/Gender, Postulation Date, Status Badge */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className={clsx(
                        'w-10 h-10 rounded-xl font-bold flex items-center justify-center shrink-0 text-xs shadow-2xs overflow-hidden',
                        app.status === VolunteerApplicationStatus.PENDING
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : app.status === VolunteerApplicationStatus.APPROVED
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      )}
                    >
                      {applicantUser?.photoUrl ? (
                        <img
                          src={applicantUser.photoUrl}
                          alt={applicantName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        initials
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">
                          {applicantName}
                        </h3>
                        {age !== null && (
                          <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-md">
                            {age} años
                          </span>
                        )}
                      </div>

                      {/* Gender and Top Contact Actions (WhatsApp and Phone) */}
                      <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400 font-medium mt-1">
                        {applicantUser?.gender && (
                          <span>{applicantUser.gender === 'F' ? 'Femenino' : 'Masculino'}</span>
                        )}

                        {phone && fullPhone ? (
                          <div className="flex items-center gap-1.5">
                            {applicantUser?.gender && <span className="text-slate-300">•</span>}
                            <a
                              href={`https://wa.me/${fullPhone}?text=${encodeURIComponent(
                                `¡Hola ${firstName}! Te saluda ${
                                  currentUser?.firstName
                                    ? capitalizeWords(currentUser.firstName.split(' ')[0])
                                    : 'el equipo de coordinación'
                                } respecto a tu postulación como ${volunteerTerm.toLowerCase()}.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-bold text-[11px] border border-emerald-200/80 transition-all active:scale-95 shadow-2xs"
                              title="Enviar WhatsApp"
                            >
                              <FaWhatsapp size={12} />
                              <span>WhatsApp</span>
                            </a>
                            <a
                              href={`tel:${dialCode}${cleanPhone}`}
                              className="p-1 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200/70 transition-all active:scale-95 shadow-2xs"
                              title={`Llamar a ${phone}`}
                            >
                              <Phone size={12} />
                            </a>
                          </div>
                        ) : (
                          <>
                            {applicantUser?.gender && <span className="text-slate-300">•</span>}
                            <span className="italic text-[11px] text-slate-400">Sin teléfono</span>
                          </>
                        )}

                        {applicantUser?.email && (
                          <a
                            href={`mailto:${applicantUser.email}`}
                            className="hidden md:inline truncate text-[11px] text-slate-400 hover:text-slate-700 max-w-[160px]"
                            title={applicantUser.email}
                          >
                            • {applicantUser.email}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    {app.status === VolunteerApplicationStatus.PENDING && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
                        <Clock size={11} className="text-amber-500" />
                        Pendiente
                      </span>
                    )}
                    {app.status === VolunteerApplicationStatus.APPROVED && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                        <CheckCircle2 size={11} className="text-emerald-500" />
                        Aprobada
                      </span>
                    )}
                    {app.status === VolunteerApplicationStatus.REJECTED && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
                        <XCircle size={11} className="text-rose-500" />
                        Rechazada
                      </span>
                    )}
                  </div>
                </div>

                {/* Clear Assignment Details Grid (Sede, Área, Grupo, Rol) */}
                <div className="bg-slate-50/90 rounded-xl p-2.5 border border-slate-200/70 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Sede</span>
                    <span className="font-semibold text-slate-800 truncate block mt-0.5" title={app.churchCampus?.name || 'Sede asignada'}>
                      {app.churchCampus?.name || 'Sede asignada'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Área</span>
                    <span className="font-semibold text-slate-800 truncate block mt-0.5">
                      {app.ministryArea?.name || 'No aplica'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Grupo</span>
                    <span className="font-semibold text-slate-800 truncate block mt-0.5">
                      {app.ministryGroupConfig?.name || 'Grupo'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Rol solicitado</span>
                    <span className="inline-block px-1.5 py-0.2 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 truncate max-w-full mt-0.5">
                      {roleLabelShort[app.requestedRole] || app.requestedRole}
                    </span>
                  </div>
                </div>

                {/* Footer: Postulation info (abajo) + Decision Actions */}
                <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100 text-xs">
                  {/* Left: Fecha de postulación (abajo) */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                    <Calendar size={12} className="text-slate-400 shrink-0" />
                    <span>Postulado: {formatDateTime(app.createdAt, 'DD MMM YYYY, HH:mm')}</span>
                  </div>

                  {/* Right: Decision Actions or Reviewed timestamp */}
                  {app.status === VolunteerApplicationStatus.PENDING && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setApplicationToReject(app)}
                        disabled={isProcessing}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200/90 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                      >
                        Rechazar
                      </button>
                      <button
                        type="button"
                        onClick={() => setApplicationToApprove(app)}
                        disabled={isProcessing}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                      >
                        {isProcessing ? (
                          <RotateCcw size={13} className="animate-spin" />
                        ) : (
                          <Check size={13} />
                        )}
                        <span>Aprobar</span>
                      </button>
                    </div>
                  )}

                  {app.status !== VolunteerApplicationStatus.PENDING && app.reviewedAt && (
                    <span className="text-[11px] text-slate-400 font-medium">
                      Revisado: {formatDateTime(app.reviewedAt, 'DD MMM YYYY, HH:mm')}
                    </span>
                  )}
                </div>

                {/* Admin notes (rejection reason) */}
                {app.rejectionReason && (
                  <div className="p-2.5 rounded-xl bg-rose-50/80 border border-rose-100 text-xs text-rose-700 space-y-0.5">
                    <span className="font-bold text-rose-800">Motivo de rechazo: </span>
                    {app.rejectionReason}
                  </div>
                )}
              </div>
            );
          })}

          {/* Infinite Scroll Sentinel & Load More Spinner */}
          {!loading && applications.length > 0 && (
            <div ref={sentinelRef} className="py-4 flex flex-col items-center justify-center">
              {loadingMore && (
                <div className="flex items-center gap-2 py-2 px-4 bg-white rounded-full border border-gray-100 shadow-2xs text-xs font-semibold text-gray-500">
                  <Loader2 size={16} className="animate-spin text-primary" />
                  <span>Cargando más postulaciones...</span>
                </div>
              )}
              {!loadingMore && hasMore && (
                <button
                  type="button"
                  onClick={() => triggerLoadMore()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 bg-white hover:bg-gray-50 border border-gray-200/80 rounded-full shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  <ChevronDown size={14} />
                  <span>Cargar más postulaciones</span>
                </button>
              )}
              {!loadingMore && !hasMore && (
                <EndOfListFunnyBadge type="volunteers" />
              )}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for Approval */}
      <ConfirmModal
        open={Boolean(applicationToApprove)}
        onOpenChange={(open) => !open && setApplicationToApprove(null)}
        title="Aprobar Postulación"
        description={`¿Estás seguro de aprobar a ${
          applicationToApprove?.user?.firstName || 'este solicitante'
        } como ${
          roleLabelShort[applicationToApprove?.requestedRole as VolunteerRole] ||
          applicationToApprove?.requestedRole
        } en el área ${applicationToApprove?.ministryArea?.name || ''}? Se creará su asignación de servicio inmediatamente.`}
        confirmText="Aprobar y Asignar"
        cancelText="Cancelar"
        type="info"
        onConfirm={handleConfirmApprove}
      />

      {/* Rejection Modal with Reason */}
      {applicationToReject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-gray-100 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Rechazar Postulación</h3>
                <p className="text-xs text-gray-500">
                  {applicationToReject.user?.firstName} {applicationToReject.user?.lastName}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600">
              El usuario permanecerá registrado en la base de datos de usuarios, pero no se le asignará rol de servicio en la iglesia.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block">
                Motivo del rechazo (opcional):
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ej. Cupos completos en este grupo / Falta disponibilidad de horario"
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 transition-colors resize-none placeholder:text-gray-400"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setApplicationToReject(null);
                  setRejectionReason('');
                }}
                className="flex-1 text-xs"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmReject}
                className="flex-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                Confirmar Rechazo
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Floating Scroll To Top Button */}
      <button
        type="button"
        onClick={handleScrollToTop}
        aria-label="Volver arriba"
        title="Volver arriba"
        className={clsx(
          'fixed right-4 sm:right-6 z-50 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/95 text-slate-700 border border-slate-200/90 shadow-lg hover:shadow-xl hover:text-primary hover:border-primary/40 flex items-center justify-center transition-all duration-300 active:scale-90 cursor-pointer backdrop-blur-xs',
          isInsideAdmin ? 'bottom-6 sm:bottom-8' : 'bottom-20 sm:bottom-24',
          showScrollTop
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-75 pointer-events-none',
        )}
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
};
