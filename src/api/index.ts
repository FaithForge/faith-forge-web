import axios, { AxiosResponse } from 'axios';

const API_URL =
  process.env.NODE_ENV === 'production'
    ? 'http://192.168.1.4:8080/api'
    : 'https://faith-forge-ztx8u.ondigitalocean.app/api';

export enum ApiVerbs {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

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
        response = await instance.get(url, { params });
        break;
      case 'POST':
        response = await instance.post(url, data, headers);
        break;
      case 'PUT':
        response = await instance.put(url, data);
        break;
      case 'DELETE':
        response = await instance.delete(url);
        break;
      default:
        throw new Error(`Invalid HTTP verb: ${verb}`);
    }
    return response;
  } catch (error) {
    throw error;
  }
};
