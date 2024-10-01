/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-useless-catch */
import axios, { AxiosResponse } from 'axios';

const API_URL =
  process.env.NODE_ENV === 'production'
    ? 'http://faith-forge.com/api'
    : 'https://faith-forge.jucarlospm.com/api';

export enum ApiVerbs {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

export const MS_CHURCH_PATH = 'ms-church';
export const MS_KID_CHURCH_PATH = 'ms-kid-church';
export const MS_USER_PATH = 'ms-user';

export const makeApiRequest = async (
  verb: ApiVerbs,
  url: string,
  options?: {
    params?: any;
    data?: any;
    headers?: any;
  },
): Promise<AxiosResponse<any, any>> => {
  const { params = {}, data = {}, headers = {} } = options ?? {};
  const baseURL = API_URL;
  const instance = axios.create({
    baseURL,
  });
  let response;
  try {
    switch (verb) {
      case 'GET':
        response = await instance.get(url, { params, headers });
        break;
      case 'POST':
        response = await instance.post(url, data, { headers });
        break;
      case 'PUT':
        response = await instance.put(url, data, { headers });
        break;
      case 'DELETE':
        response = await instance.delete(url, { headers });
        break;
      default:
        throw new Error(`Invalid HTTP verb: ${verb}`);
    }
    return response;
  } catch (error) {
    throw error;
  }
};
