import { Http } from './index';

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type ResponseType =
  | 'json'
  | 'text'
  | 'formData'
  | 'blob'
  | 'arrayBuffer';

export type SuccessResponse<T = any> = {
  status: number;
  data: T;
  headers?: Record<string, any>;
  isError: false;
};

export type ErrorResponse = {
  status: number | null;
  error: any;
  data: any;
  headers?: Record<string, any>;
  networkError: boolean;
  isError: true;
};

export type ResponseData<T = any> = SuccessResponse<T> | ErrorResponse;

export type HttpProperties = {
  parentUrl: string;

  urls: Array<string>;

  requestBody?: Record<string, unknown>;

  requestParams?: Record<string, unknown>;

  restConfig: RestConfig;
};

export type Request = (
  url: string,
  requestConfig: RequestConfig
) => Promise<ResponseData>;

export type BaseRestConfig = {
  headers?: Record<string, any>;
  responseType?: ResponseType;
  responseInterceptor?: (data: ResponseData) => ResponseData | undefined;
  defaultParams?: Record<string, any>;
};

export type RequestConfig = BaseRestConfig & {
  params?: Record<string, any>;
  body?: Record<string, any>;
  method?: Method;
};

export type RestConfig = BaseRestConfig & { request?: Request };

export type PromiseValue<T = any> = Promise<T> & {
  response: () => Promise<ResponseData<T>>;
};

export type Client = {
  rest(basePath: string): Http;
  config(cg: RestConfig | ((c: RestConfig) => RestConfig)): void;
};
