/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  API_BASE_URL,
  HttpRequestMethod,
  MicroserviceEnum,
} from '@faith-forge-web/common-types/global';
import axios, { AxiosResponse } from 'axios';

interface ApiRequestOptions {
  params?: any;
  data?: any;
  headers?: any;
}

/**
 * Executes an API request using the specified method, URL, and options.
 *
 * @param {string} baseURL - The base URL of the API.
 * @param {HttpRequestMethod} method - The HTTP method to use for the request.
 * @param {string} url - The endpoint URL relative to the base URL.
 * @param {ApiRequestOptions} [options={}] - The optional parameters, data, and headers for the request.
 * @returns {Promise<AxiosResponse<any, any>>} - A promise that resolves with the Axios response.
 * @throws {Error} If an invalid HTTP method is provided.
 */
const executeApiRequest = async (
  baseURL: string,
  method: HttpRequestMethod,
  url: string,
  options: ApiRequestOptions = {}
): Promise<AxiosResponse<any, any>> => {
  const { params = {}, data = {}, headers = {} } = options;
  const instance = axios.create({ baseURL });

  switch (method) {
    case HttpRequestMethod.GET:
      return await instance.get(url, { params, headers });
    case HttpRequestMethod.POST:
      return await instance.post(url, data, { headers });
    case HttpRequestMethod.PATCH:
      return await instance.patch(url, data, { headers });
    case HttpRequestMethod.PUT:
      return await instance.put(url, data, { headers });
    case HttpRequestMethod.DELETE:
      return await instance.delete(url, { headers });
    default:
      throw new Error(`Invalid HTTP verb: ${method}`);
  }
};

/**
 * Makes an API request to a specific microservice.
 *
 * @param {Object} payload - The payload object containing details for the request.
 * @param {MicroserviceEnum} payload.microservice - The microservice to target.
 * @param {HttpRequestMethod} payload.method - The HTTP method to use.
 * @param {string} payload.url - The endpoint URL relative to the microservice.
 * @param {ApiRequestOptions} [payload.options] - Optional request parameters, data, and headers.
 * @returns {Promise<AxiosResponse<any, any>>} - A promise that resolves with the Axios response.
 */
export const microserviceApiRequest = async (payload: {
  microservice: MicroserviceEnum;
  method: HttpRequestMethod;
  url: string;
  options?: ApiRequestOptions;
}): Promise<AxiosResponse<any, any>> => {
  const { microservice, method, url, options } = payload;
  const baseURL = `${API_BASE_URL}/ms-${microservice}`;
  return executeApiRequest(baseURL, method, url, options);
};

/**
 * Makes a general API request to the base API URL.
 *
 * @param {HttpRequestMethod} method - The HTTP method to use.
 * @param {string} url - The endpoint URL relative to the base API URL.
 * @param {ApiRequestOptions} [options] - Optional request parameters, data, and headers.
 * @returns {Promise<AxiosResponse<any, any>>} - A promise that resolves with the Axios response.
 */
export const makeApiRequest = async (
  method: HttpRequestMethod,
  url: string,
  options?: ApiRequestOptions
): Promise<AxiosResponse<any, any>> => {
  const baseURL = API_BASE_URL;
  return executeApiRequest(baseURL, method, url, options);
};
