/**
 * Report types available in the system.
 */
export const ReportType = {
  CHILD_INCIDENT: 'CHILD_INCIDENT',
  GUARDIAN_CALL: 'GUARDIAN_CALL',
} as const;
export type ReportType = (typeof ReportType)[keyof typeof ReportType];

/**
 * Report lifecycle status.
 */
export const ReportStatus = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  INFORMATIVE: 'INFORMATIVE',
} as const;
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

/**
 * Three-tier report priority levels.
 */
export const ReportPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;
export type ReportPriority = (typeof ReportPriority)[keyof typeof ReportPriority];

/**
 * Options for medical attention.
 */
export const MedicalAttentionType = {
  NOT_REQUIRED: 'NOT_REQUIRED',
  NO_DOCTOR_AVAILABLE: 'NO_DOCTOR_AVAILABLE',
  DOCTOR_ATTENDED: 'DOCTOR_ATTENDED',
} as const;
export type MedicalAttentionType =
  (typeof MedicalAttentionType)[keyof typeof MedicalAttentionType];

/**
 * Options for guardian explanation response.
 */
export const GuardianExplanationOption = {
  YES_WELL: 'YES_WELL',
  YES_BAD: 'YES_BAD',
  NO: 'NO',
} as const;
export type GuardianExplanationOption =
  (typeof GuardianExplanationOption)[keyof typeof GuardianExplanationOption];

/**
 * Details contract for child incident reports.
 * Actors (kid and attending doctor) are identified strictly by their IDs without redundant names.
 */
export interface IChildIncidentReportDetails {
  kidId: string;
  description: string;
  medicalAttentionType: MedicalAttentionType;
  attendingDoctorVolunteerId?: string;
  guardianExplanationResponse?: GuardianExplanationOption;
  photos?: string[];
}

/**
 * Details contract for parent/guardian phone calls during church service.
 * Kid and guardian are identified strictly by ID. Person names and phones belong in the user/guardian store.
 */
export interface IGuardianCallReportDetails {
  kidId: string;
  reason: string;
  guardianId: string;
  guardianRelationship?: string;
}

/**
 * Strongly-typed union of report detail payloads.
 */
export type ChurchReportDetails =
  | IChildIncidentReportDetails
  | IGuardianCallReportDetails;

/**
 * Action type for church report history timeline events.
 */
export const ReportHistoryAction = {
  CREATED: 'CREATED',
  UPDATE: 'UPDATE',
  CLOSED: 'CLOSED',
} as const;
export type ReportHistoryAction = (typeof ReportHistoryAction)[keyof typeof ReportHistoryAction];

/**
 * Single event entry in a report's lifecycle history timeline.
 * Person names are never persisted; they are resolved dynamically from memberId.
 */
export interface IChurchReportHistoryEntry {
  id: string;
  churchReportId: string;
  memberId: string;
  action: ReportHistoryAction;
  note?: string;
  churchMeetingId?: string;
  date?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

/**
 * Full public representation of a church operational report.
 */
export interface IChurchReport {
  id: string;
  churchCampusId: string;
  churchMeetingId?: string;
  date: string;
  ministryId?: string;
  serviceAreaGroupId?: string;
  createdByMemberId: string;
  type: ReportType;
  priority: ReportPriority;
  status: ReportStatus;
  details: ChurchReportDetails;
  history: IChurchReportHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Payload to create a church report.
 */
export interface CreateChurchReportPayload {
  churchCampusId: string;
  churchMeetingId?: string;
  date: string;
  ministryId?: string;
  serviceAreaGroupId?: string;
  type: ReportType;
  priority?: ReportPriority;
  status?: ReportStatus;
  details: ChurchReportDetails;
}

/**
 * Payload to update report status (e.g. from OPEN to CLOSED).
 */
export interface UpdateChurchReportStatusPayload {
  id: string;
  status: ReportStatus;
  note?: string;
  closeNotes?: string;
}

/**
 * Payload to append an update note to a report.
 */
export interface AddChurchReportNotePayload {
  id: string;
  note: string;
  churchMeetingId?: string;
  date?: string;
}

/**
 * Query filters to retrieve church reports.
 */
export interface QueryChurchReportsArgs {
  churchCampusId?: string;
  churchMeetingId?: string;
  date?: string;
  ministryId?: string;
  serviceAreaGroupId?: string;
  type?: ReportType;
  statuses?: ReportStatus[];
  excludeClosed?: boolean;
}

/**
 * Request payload for acquiring a presigned Cloudflare R2 upload URL for report photos.
 */
export interface RequestPresignedReportUploadUrlPayload {
  fileName: string;
  contentType: string;
}

/**
 * Presigned URL response containing direct upload endpoint and target public URL.
 */
export interface PresignedUploadUrlResponse {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

