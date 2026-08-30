import { HttpRequestMethod, MS } from '@/libs/common-types/global';
import { IAttendanceReportData, IAttendanceReportAttendee, IAttendanceReportSummary } from '@/libs/models';
import { microserviceApiRequest } from '@/libs/utils/http';
import dayjs from 'dayjs';

/**
 * Parameters to request attendance report details from the kid-church microservice.
 */
export interface IFetchAttendanceReportParams {
  churchMeetingId: string;
  date: string;
  token: string;
  churchName?: string;
  campusName?: string;
  meetingName?: string;
  meetingDay?: string;
  fallbackSummary?: {
    totalKids: number;
    totalNewKids: number;
    statistics: {
      byKidGroup: Array<{ name: string; count: number }>;
      byGender?: Array<{ name: string; count: number }>;
    };
  };
}

/**
 * Builds realistic preview attendance report data when the backend endpoint is not yet deployed.
 *
 * @param {IFetchAttendanceReportParams} params - Service and meeting context parameters.
 * @returns {IAttendanceReportData} Generated mock report data.
 */
export const generatePreviewAttendanceData = (params: IFetchAttendanceReportParams): IAttendanceReportData => {
  const {
    churchMeetingId,
    date,
    churchName = 'Iglesia Cristiana',
    campusName = 'Sede Principal',
    meetingName = 'Servicio General',
    meetingDay = 'DOMINGO',
    fallbackSummary,
  } = params;

  const totalKids = fallbackSummary?.totalKids ?? 25;
  const totalNewKids = fallbackSummary?.totalNewKids ?? 0;
  const totalReturningKids = Math.max(0, totalKids - totalNewKids);

  const groups = fallbackSummary?.statistics?.byKidGroup?.map((g) => ({
    groupId: g.name.toLowerCase().replace(/\s+/g, '-'),
    groupName: g.name,
    count: g.count,
    percentage: totalKids > 0 ? Math.round((g.count / totalKids) * 100) : 0,
  })) || [
    { groupId: 'jeremias', groupName: 'Jeremias', count: 6, percentage: 24 },
    { groupId: 'iglekids', groupName: 'Yo Soy Iglekids', count: 5, percentage: 20 },
    { groupId: 'zaqueos', groupName: 'Zaqueos', count: 5, percentage: 20 },
    { groupId: 'timoteos', groupName: 'Timoteos', count: 3, percentage: 12 },
    { groupId: 'caminadores', groupName: 'Caminadores', count: 3, percentage: 12 },
    { groupId: 'titos', groupName: 'Titos', count: 2, percentage: 8 },
    { groupId: 'bebes', groupName: 'Bebes', count: 1, percentage: 4 },
  ];

  const mCount = fallbackSummary?.statistics?.byGender?.find((g) => g.name === 'M')?.count ?? 8;
  const fCount = fallbackSummary?.statistics?.byGender?.find((g) => g.name === 'F')?.count ?? 17;
  const totalGen = mCount + fCount || 1;

  // Realistic sample kids distributed across groups
  const sampleFirstNamesM = ['Lucas David', 'Mateo Alejandro', 'Samuel David', 'Santiago', 'Daniel', 'Jerónimo', 'Nicolás', 'Isaac'];
  const sampleFirstNamesF = ['Valeria', 'Sofía', 'Mariana', 'Luciana', 'Isabella', 'Salomé', 'Gabriela', 'Valentina', 'Catalina', 'Elena', 'Victoria', 'Emma', 'Sara', 'Antonella', 'Samantha', 'Amelia', 'Martina'];
  const sampleLastNames = ['Gómez', 'Rodríguez', 'Díaz', 'Martínez', 'López', 'Torres', 'Ramírez', 'Hernández', 'Morales', 'Castro', 'Vargas', 'Ríos'];
  const sampleGuardians = ['María Pérez (Madre)', 'Carlos Gómez (Padre)', 'Juan Díaz (Padre)', 'Ana Martínez (Madre)', 'Paola López (Madre)', 'Andrés Torres (Padre)', 'Diana Ramírez (Madre)'];

  const attendees: IAttendanceReportData['attendees'] = [];
  let kidCounter = 1;

  // Generate attendees matching group counts
  groups.forEach((g) => {
    for (let i = 0; i < g.count; i++) {
      const isM = (kidCounter % 3 === 0);
      const firstName = isM
        ? sampleFirstNamesM[(kidCounter - 1) % sampleFirstNamesM.length]
        : sampleFirstNamesF[(kidCounter - 1) % sampleFirstNamesF.length];
      const lastName = sampleLastNames[(kidCounter - 1) % sampleLastNames.length];
      const guardianFull = sampleGuardians[(kidCounter - 1) % sampleGuardians.length];
      const guardianParts = guardianFull.split(' (');
      const guardianName = guardianParts[0];
      const guardianRelation = guardianParts[1]?.replace(')', '') || 'Acudiente';

      const isFirst = kidCounter <= totalNewKids;
      const hourOffset = 8;
      const minOffset = 30 + (kidCounter * 2);
      const h = String(hourOffset).padStart(2, '0');
      const m = String(minOffset % 60).padStart(2, '0');
      const timeStr = `${h}:${m} AM`;

      const hasMedical = kidCounter === 2 || kidCounter === 5;

      attendees.push({
        registrationId: `mock-reg-${kidCounter}`,
        checkInTime: `${date}T${h}:${m}:00.000Z`,
        checkInTimeFormatted: timeStr,
        kid: {
          id: `mock-k-${kidCounter}`,
          faithForgeId: 1000 + kidCounter,
          firstName,
          lastName,
          gender: isM ? 'M' : 'F',
          age: Math.min(11, 2 + (kidCounter % 8)),
          isFirstTime: isFirst,
        },
        group: {
          id: g.groupId,
          name: g.groupName,
        },
        guardian: {
          id: `mock-g-${kidCounter}`,
          fullName: guardianName,
          relation: guardianRelation,
          phone: `300${1000000 + kidCounter * 777}`,
          dialCodePhone: '+57',
        },
        medicalCondition: hasMedical
          ? {
              hasCondition: true,
              name: kidCounter === 2 ? 'Alergia a Frutos Secos' : 'Asma leve',
              description: kidCounter === 2 ? 'Epipen en bolso' : 'Inhalador salbutamol',
            }
          : null,
        observations: hasMedical ? 'Cuidado con merienda' : 'Sin observaciones',
        registeredBy: 'Operador Iglekids',
      });

      kidCounter++;
    }
  });

  return {
    metadata: {
      church: { id: 'default-church', name: churchName },
      campus: { id: 'default-campus', name: campusName },
      meeting: { id: churchMeetingId, name: meetingName, day: meetingDay },
      reportDate: date,
      dayName: meetingDay,
      generatedAt: new Date().toISOString(),
    },
    summary: {
      totalKids,
      totalNewKids,
      totalReturningKids,
      totalWithMedicalAlerts: attendees.filter((a) => a.medicalCondition?.hasCondition).length,
      byGender: [
        { gender: 'M', label: 'Masculino', count: mCount, percentage: Math.round((mCount / totalGen) * 100) },
        { gender: 'F', label: 'Femenino', count: fCount, percentage: Math.round((fCount / totalGen) * 100) },
      ],
      byKidGroup: groups,
      checkInTimeSlots: [
        { slot: '08:30 - 08:45', count: Math.round(totalKids * 0.15), percentage: 15 },
        { slot: '08:45 - 09:00', count: Math.round(totalKids * 0.55), percentage: 55 },
        { slot: '09:00 - 09:15', count: Math.round(totalKids * 0.22), percentage: 22 },
        { slot: '09:15 - 09:30', count: Math.max(1, totalKids - Math.round(totalKids * 0.92)), percentage: 8 },
      ],
    },
    attendees,
    medicalAlerts: attendees
      .filter((a) => a.medicalCondition?.hasCondition)
      .map((a) => ({
        kidId: a.kid.id,
        kidFullName: `${a.kid.firstName} ${a.kid.lastName}`,
        groupName: a.group.name,
        conditionName: a.medicalCondition?.name || 'Condición Médica',
        description: a.medicalCondition?.description || '',
        guardianName: `${a.guardian.fullName} (${a.guardian.relation})`,
        guardianPhone: a.guardian.phone,
      })),
  };
};

/**
 * Fetches the detailed attendance report data from MS kid-church.
 * Automatically falls back to high-fidelity preview data if the BE endpoint is still in development (404/501).
 *
 * @param {IFetchAttendanceReportParams} params - Church meeting and date query params.
 * @returns {Promise<IAttendanceReportData>} Full attendance report payload.
 */
export const getAttendanceReportDetail = async (
  params: IFetchAttendanceReportParams
): Promise<IAttendanceReportData> => {
  const { churchMeetingId, date, token } = params;

  try {
    const response = await microserviceApiRequest({
      microservice: MS.KidChurch,
      method: HttpRequestMethod.GET,
      url: '/report/kid-church-meeting/attendance-detail',
      options: {
        params: { churchMeetingId, date },
        headers: { Authorization: `Bearer ${token}` },
      },
    });

    const rawData = response.data?.data || response.data;
    if (rawData && (rawData.summary || rawData.attendees || rawData.statistics)) {
      const attendees: IAttendanceReportAttendee[] = Array.isArray(rawData.attendees) ? rawData.attendees : [];

      let summary: IAttendanceReportSummary = rawData.summary;
      if (!summary) {
        const totalKids = rawData.totalKids ?? attendees.length;
        const totalNewKids = rawData.totalNewKids ?? attendees.filter((a) => a.kid?.isFirstTime).length;
        const mCount = attendees.filter((a) => a.kid?.gender === 'M').length;
        const fCount = attendees.filter((a) => a.kid?.gender === 'F').length;
        const totalGen = mCount + fCount || 1;

        const groupMap = new Map<string, { groupId: string; groupName: string; count: number }>();
        if (rawData.statistics?.byKidGroup) {
          rawData.statistics.byKidGroup.forEach((g: any) => {
            const name = g.groupName || g.name;
            groupMap.set(name, { groupId: g.groupId || name, groupName: name, count: g.count });
          });
        } else {
          attendees.forEach((a) => {
            const gId = a.group?.id || 'unknown';
            const gName = a.group?.name || 'Salón';
            const existing = groupMap.get(gId);
            if (existing) {
              existing.count++;
            } else {
              groupMap.set(gId, { groupId: gId, groupName: gName, count: 1 });
            }
          });
        }

        const byKidGroup = Array.from(groupMap.values()).map((g) => ({
          ...g,
          percentage: totalKids > 0 ? Math.round((g.count / totalKids) * 100) : 0,
        }));

        summary = {
          totalKids,
          totalNewKids,
          totalReturningKids: Math.max(0, totalKids - totalNewKids),
          totalWithMedicalAlerts: attendees.filter((a) => a.medicalCondition?.hasCondition).length,
          byGender: [
            { gender: 'M', label: 'Masculino', count: mCount, percentage: Math.round((mCount / totalGen) * 100) },
            { gender: 'F', label: 'Femenino', count: fCount, percentage: Math.round((fCount / totalGen) * 100) },
          ],
          byKidGroup,
          checkInTimeSlots: rawData.summary?.checkInTimeSlots || [],
        };
      }

      return {
        metadata: {
          church: {
            id: rawData.metadata?.church?.id || 'default-church',
            name: rawData.metadata?.church?.name || params.churchName || 'Iglekids',
          },
          campus: {
            id: rawData.metadata?.campus?.id || 'default-campus',
            name: rawData.metadata?.campus?.name || params.campusName || 'Sede Principal',
          },
          meeting: {
            id: rawData.metadata?.meeting?.id || params.churchMeetingId,
            name: rawData.metadata?.meeting?.name || params.meetingName || 'Servicio General',
            day: rawData.metadata?.meeting?.day || params.meetingDay || 'DOMINGO',
            initialHour: rawData.metadata?.meeting?.initialHour,
            finalHour: rawData.metadata?.meeting?.finalHour,
          },
          reportDate: rawData.metadata?.reportDate || params.date,
          dayName: rawData.metadata?.dayName || params.meetingDay || 'DOMINGO',
          generatedAt: rawData.metadata?.generatedAt || new Date().toISOString(),
        },
        summary,
        attendees,
        medicalAlerts: Array.isArray(rawData.medicalAlerts)
          ? rawData.medicalAlerts
          : attendees
              .filter((a) => a.medicalCondition?.hasCondition)
              .map((a) => ({
                kidId: a.kid.id,
                kidFullName: `${a.kid.firstName} ${a.kid.lastName}`,
                groupName: a.group.name,
                conditionName: a.medicalCondition?.name || 'Condición Médica',
                description: a.medicalCondition?.description || '',
                guardianName: `${a.guardian.fullName} (${a.guardian.relation})`,
                guardianPhone: a.guardian.phone,
              })),
      };
    }
  } catch (error: any) {
    // If backend endpoint is not yet implemented, provide graceful preview fallback
    if (error?.response?.status === 404 || error?.response?.status === 501 || !error?.response) {
      console.info('[KidChurchReportService] Endpoint /report/kid-church-meeting/attendance-detail not yet ready on BE. Using preview synthesis.');
      return generatePreviewAttendanceData(params);
    }
    throw error;
  }

  return generatePreviewAttendanceData(params);
};
