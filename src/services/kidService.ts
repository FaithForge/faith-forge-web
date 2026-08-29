import { HttpRequestMethod, MS } from '@/libs/common-types/global';
import { IKid } from '@/libs/models';
import { RootState } from '@/libs/state/redux';
import { microserviceApiRequest } from '@/libs/utils/http';
import { parseEntitySearchParams } from '@/libs/utils/text';
import { createAsyncThunk } from '@reduxjs/toolkit';

export const ReprintRegisterLabelKid = createAsyncThunk(
  'kid/reprintRegisterLabelKid',
  async (
    payload: {
      kidId: string;
    },
    { getState },
  ) => {
    const state = getState() as RootState;
    const churchCampus = state.churchCampusSlice.current;
    const churchPrinter = state.churchCampusSlice.current;

    const churchMeeting = state.churchMeetingSlice.current;
    const { kidId } = payload;

    const response = (
      await microserviceApiRequest({
        microservice: MS.KidChurch,
        method: HttpRequestMethod.POST,
        url: `/registration/reprint`,
        options: {
          data: {
            kidId,
            churchId: churchCampus?.id,
            churchMeetingId: churchMeeting?.id,
            churchPrinterId: churchPrinter?.name,
          },
        },
      })
    ).data;

    return response;
  },
);

export const TestPrintLabel = createAsyncThunk(
  'kid/testPrintLabel',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const churchPrinter = state.churchCampusSlice.current;
    const churchMeeting = state.churchMeetingSlice.current;

    const response = (
      await microserviceApiRequest({
        microservice: MS.KidChurch,
        method: HttpRequestMethod.POST,
        url: `/registration/testPrint`,
        options: {
          data: {
            churchMeetingId: churchMeeting?.id,
            churchPrinterId: churchPrinter?.name,
          },
        },
      })
    ).data;

    return response;
  },
);

/**
 * Searches kids matching a search query (name or numeric ID) for data transfer purposes.
 *
 * @param {string} findText - Search input text (child name or numeric code).
 * @param {string} token - Authentication bearer token.
 * @param {string} [meetingId] - Optional current church meeting ID for registration context.
 * @returns {Promise<IKid[]>} Resolves with the list of matching kids.
 */
export const searchKidsForTransfer = async (
  findText: string,
  token: string,
  meetingId?: string,
): Promise<IKid[]> => {
  const { filterByFirstName, filterByLastName, numericId } = parseEntitySearchParams(findText);

  const response = (
    await microserviceApiRequest({
      microservice: MS.KidChurch,
      method: HttpRequestMethod.GET,
      url: '/kids',
      options: {
        params: {
          limit: 15,
          page: 1,
          registrationChurchMeetingId: meetingId,
          filterByFirstName,
          filterByLastName,
          filterByFaithForge: numericId,
        },
        headers: { Authorization: `Bearer ${token}` },
      },
    })
  ).data;

  return response?.data || [];
};
