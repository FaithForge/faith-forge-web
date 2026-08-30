/**
 * Types and models for the Iglekids Service Attendance Report.
 */

export interface IAttendanceReportKid {
  id: string;
  faithForgeId?: number;
  firstName: string;
  lastName: string;
  gender: 'M' | 'F';
  age: number;
  isFirstTime: boolean;
  birthday?: string;
}

export interface IAttendanceReportGroup {
  id: string;
  name: string;
}

export interface IAttendanceReportGuardian {
  id: string;
  fullName: string;
  relation: string;
  phone: string;
  dialCodePhone: string;
}

export interface IAttendanceReportMedicalCondition {
  hasCondition: boolean;
  name: string;
  description?: string;
}

export interface IAttendanceReportAttendee {
  registrationId: string;
  checkInTime: string;
  checkInTimeFormatted: string;
  kid: IAttendanceReportKid;
  group: IAttendanceReportGroup;
  guardian: IAttendanceReportGuardian;
  medicalCondition?: IAttendanceReportMedicalCondition | null;
  observations?: string;
  registeredBy?: string;
}

export interface IAttendanceReportMedicalAlert {
  kidId: string;
  kidFullName: string;
  groupName: string;
  conditionName: string;
  description?: string;
  guardianName: string;
  guardianPhone: string;
}

export interface IAttendanceReportGenderStat {
  gender: string;
  label: string;
  count: number;
  percentage: number;
}

export interface IAttendanceReportGroupStat {
  groupId: string;
  groupName: string;
  count: number;
  percentage: number;
}

export interface IAttendanceReportTimeSlot {
  slot: string;
  count: number;
  percentage: number;
}

export interface IAttendanceReportSummary {
  totalKids: number;
  totalNewKids: number;
  totalReturningKids: number;
  totalWithMedicalAlerts: number;
  byGender: IAttendanceReportGenderStat[];
  byKidGroup: IAttendanceReportGroupStat[];
  checkInTimeSlots: IAttendanceReportTimeSlot[];
}

export interface IAttendanceReportMetadata {
  church: {
    id: string;
    name: string;
  };
  campus: {
    id: string;
    name: string;
  };
  meeting: {
    id: string;
    name: string;
    day?: string;
    initialHour?: string;
    finalHour?: string;
  };
  reportDate: string;
  dayName: string;
  generatedAt: string;
}

export interface IAttendanceReportData {
  metadata: IAttendanceReportMetadata;
  summary: IAttendanceReportSummary;
  medicalAlerts: IAttendanceReportMedicalAlert[];
  attendees: IAttendanceReportAttendee[];
}
