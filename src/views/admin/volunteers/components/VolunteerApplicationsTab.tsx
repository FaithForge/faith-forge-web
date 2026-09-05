import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  X,
  Search,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Layers,
  Users,
  Shield,
  Loader2,
  Inbox,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import dayjs from 'dayjs';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { CellListSkeleton } from '@/components/ui/DetailSkeleton';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
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

const ROLE_LABEL_SHORT: Record<VolunteerRole, string> = {
  [VolunteerRole.MINISTRY_GENERAL_COORDINATOR]: 'Coord. General',
  [VolunteerRole.AREA_GENERAL_COORDINATOR]: 'Coord. Área',
  [VolunteerRole.GROUP_COORDINATOR]: 'Coord. Grupo',
  [VolunteerRole.SUPERVISOR]: 'Supervisor',
  [VolunteerRole.VOLUNTEER]: 'Servidor',
};

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
export const VolunteerApplicationsTab: React.FC = () => {
  const dispatch = useAppDispatch();

  const {
    applications: { data: applications, loading, currentPage, totalPages },
    actionLoadingId,
  } = useAppSelector((state) => state.volunteerApplicationSlice);

  const campuses = useAppSelector((state) => state.churchCampusSlice.data);
  const { areasByMinistry } = useAppSelector((state) => state.ministrySlice);

  const [statusFilter, setStatusFilter] = useState<VolunteerApplicationStatus | 'ALL'>(
    VolunteerApplicationStatus.PENDING
  );
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCampusFilter, setSelectedCampusFilter] = useState('ALL');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState('ALL');

  // Approval modal state
  const [applicationToApprove, setApplicationToApprove] = useState<IVolunteerApplication | null>(
    null
  );

  // Rejection modal state
  const [applicationToReject, setApplicationToReject] = useState<IVolunteerApplication | null>(
    null
  );
  const [rejectionReason, setRejectionReason] = useState('');

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
      dispatch(
        GetVolunteerApplications({
          page,
          limit: 30,
          status: statusFilter,
          search: debouncedSearch || undefined,
          churchCampusId: selectedCampusFilter !== 'ALL' ? selectedCampusFilter : undefined,
          ministryAreaId: selectedAreaFilter !== 'ALL' ? selectedAreaFilter : undefined,
        })
      );
    },
    [dispatch, statusFilter, debouncedSearch, selectedCampusFilter, selectedAreaFilter]
  );

  useEffect(() => {
    fetchApplications(1);
  }, [fetchApplications]);

  // Handle Approve
  const handleConfirmApprove = async () => {
    if (!applicationToApprove) return;
    try {
      await dispatch(ApproveVolunteerApplication(applicationToApprove.id)).unwrap();
      toast.success('Postulación aprobada y servidor asignado correctamente');
      setApplicationToApprove(null);
      fetchApplications(currentPage);
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
      fetchApplications(currentPage);
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : err?.message || 'Error al rechazar la postulación';
      toast.error(msg);
    }
  };

  // Calculate age helper
  const calculateAge = (birthday?: string | Date) => {
    if (!birthday) return null;
    const dateStr = typeof birthday === 'string' ? birthday.substring(0, 10) : dayjs(birthday).format('YYYY-MM-DD');
    const birth = dayjs.utc(dateStr);
    if (!birth.isValid()) return null;
    return dayjs().diff(birth, 'year');
  };

  const pendingCount = useMemo(() => {
    if (statusFilter === VolunteerApplicationStatus.PENDING) {
      return applications.length;
    }
    return 0;
  }, [statusFilter, applications]);

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-gray-100 space-y-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {STATUS_TABS.map((tab) => {
            const isSelected = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={clsx(
                  'px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5',
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search and Secondary Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="relative sm:col-span-1">
            <Input
              placeholder="Buscar por nombre o cédula..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="text-xs"
            />
          </div>

          {campuses && campuses.length > 1 && (
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
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="default"
              onClick={() => fetchApplications(1)}
              className="h-10 px-3 text-xs text-gray-600 rounded-xl"
              title="Recargar postulaciones"
            >
              <RotateCcw size={14} className={clsx(loading && 'animate-spin text-emerald-600')} />
            </Button>
          </div>
        </div>
      </div>

      {/* Applications List */}
      {loading && applications.length === 0 ? (
        <CellListSkeleton count={4} />
      ) : applications.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white rounded-2xl border border-gray-100">
          <Inbox size={44} className="mx-auto text-gray-300 mb-2" />
          <h3 className="text-base font-bold text-gray-700">No hay postulaciones registradas</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            {statusFilter === VolunteerApplicationStatus.PENDING
              ? 'No tienes postulaciones pendientes por revisar en este momento.'
              : 'No se encontraron postulaciones con los filtros seleccionados.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const applicantUser = app.user;
            const applicantName = applicantUser
              ? `${applicantUser.firstName || ''} ${applicantUser.lastName || ''}`.trim()
              : 'Postulante sin nombre';
            const age = calculateAge(applicantUser?.birthday);
            const isProcessing = actionLoadingId === app.id;

            return (
              <div
                key={app.id}
                className={clsx(
                  'bg-white rounded-2xl p-4 sm:p-5 shadow-xs border transition-all space-y-3',
                  app.status === VolunteerApplicationStatus.PENDING
                    ? 'border-amber-200/70 bg-amber-50/20'
                    : app.status === VolunteerApplicationStatus.APPROVED
                    ? 'border-emerald-200/70'
                    : 'border-rose-200/70'
                )}
              >
                {/* Header: Name, Age, Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-snug">
                        {applicantName}
                      </h3>
                      {age !== null && (
                        <span className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {age} años
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 font-medium mt-0.5">
                      {applicantUser?.nationalIdType || 'DOC'} {applicantUser?.nationalId || 'S/N'}
                      {applicantUser?.gender && (
                        <span className="ml-2 text-gray-400">
                          • {applicantUser.gender === 'F' ? 'Femenino' : 'Masculino'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {app.status === VolunteerApplicationStatus.PENDING && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                        <Clock size={12} />
                        Pendiente
                      </span>
                    )}
                    {app.status === VolunteerApplicationStatus.APPROVED && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={12} />
                        Aprobada
                      </span>
                    )}
                    {app.status === VolunteerApplicationStatus.REJECTED && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                        <XCircle size={12} />
                        Rechazada
                      </span>
                    )}
                  </div>
                </div>

                {/* Service Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs py-2 px-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <span className="text-gray-400 block text-[10px] font-medium">Sede</span>
                    <span className="font-semibold text-gray-800 truncate block">
                      {app.churchCampus?.name || 'Sede asignada'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] font-medium">Área</span>
                    <span className="font-semibold text-gray-800 truncate block">
                      {app.ministryArea?.name || 'Área'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] font-medium">Grupo</span>
                    <span className="font-semibold text-gray-800 truncate block">
                      {app.ministryGroupConfig?.name || 'Grupo'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] font-medium">Rol solicitado</span>
                    <span className="font-bold text-emerald-700 truncate block">
                      {ROLE_LABEL_SHORT[app.requestedRole] || app.requestedRole}
                    </span>
                  </div>
                </div>

                {/* Contact & Date Info */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                  {applicantUser?.phone && (
                    <a
                      href={`tel:${applicantUser.phone}`}
                      className="flex items-center gap-1 text-emerald-600 hover:underline"
                    >
                      <Phone size={12} />
                      {applicantUser.phone}
                    </a>
                  )}
                  {applicantUser?.email && (
                    <a
                      href={`mailto:${applicantUser.email}`}
                      className="flex items-center gap-1 text-gray-600 hover:underline"
                    >
                      <Mail size={12} />
                      {applicantUser.email}
                    </a>
                  )}
                  <span className="flex items-center gap-1 text-gray-400 text-[11px] ml-auto">
                    <Calendar size={12} />
                    Postulado: {dayjs(app.createdAt).format('DD/MM/YYYY, hh:mm a')}
                  </span>
                </div>

                {/* Audit Trace Info (if approved or rejected) */}
                {app.status !== VolunteerApplicationStatus.PENDING && (
                  <div className="text-xs pt-1 border-t border-gray-100 flex flex-wrap justify-between items-center gap-2 text-gray-500">
                    <div>
                      {app.status === VolunteerApplicationStatus.APPROVED ? (
                        <span className="text-emerald-700 font-medium">
                          Aprobado por:{' '}
                          <strong className="text-gray-800">
                            {app.reviewedByUser?.firstName || 'Coordinador'}
                          </strong>{' '}
                          el {dayjs(app.reviewedAt).format('DD/MM/YYYY, hh:mm a')}
                        </span>
                      ) : (
                        <span className="text-rose-700 font-medium">
                          Rechazado por:{' '}
                          <strong className="text-gray-800">
                            {app.reviewedByUser?.firstName || 'Coordinador'}
                          </strong>{' '}
                          el {dayjs(app.reviewedAt).format('DD/MM/YYYY, hh:mm a')}
                        </span>
                      )}
                    </div>
                    {app.rejectionReason && (
                      <div className="w-full text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100">
                        <span className="font-bold">Motivo:</span> {app.rejectionReason}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions for PENDING */}
                {app.status === VolunteerApplicationStatus.PENDING && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setApplicationToReject(app)}
                      disabled={isProcessing}
                      className="text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      <X size={14} className="mr-1" />
                      Rechazar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setApplicationToApprove(app)}
                      loading={isProcessing}
                      className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                    >
                      <Check size={14} className="mr-1" />
                      Aprobar Servidor
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
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
          ROLE_LABEL_SHORT[applicationToApprove?.requestedRole as VolunteerRole] ||
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
                className="w-full text-xs p-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 transition-colors resize-none"
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
    </div>
  );
};
