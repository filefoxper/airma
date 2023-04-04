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

  requestBody?: Record<string | number, unknown>;

  requestParams?: Record<string | number, unknown>;

  restConfig: RestConfig;

  meta: { config: RestConfig };
};

export type Request = (
  url: string,
  requestConfig: RequestConfig
) => Promise<ResponseData>;

type ParamsProcessor = {
  stringify: (params: Record<string | number, any>) => string;
  parse: (query: string) => Record<string | number, any>;
};

export type BaseRestConfig = {
  headers?: Record<string, any>;
  responseType?: ResponseType;
  responseInterceptor?: (data: ResponseData) => ResponseData | undefined;
  paramsProcessor?: () => ParamsProcessor;
  defaultParams?: Record<string | number, any>;
  credentials?: 'include' | 'omit' | 'same-origin';
  cache?:
    | 'default'
    | 'force-cache'
    | 'no-cache'
    | 'no-store'
    | 'only-if-cached'
    | 'reload';
  mode?: 'cors' | 'navigate' | 'no-cors' | 'same-origin';
  redirect?: 'error' | 'follow' | 'manual';
  integrity?: string;
  keepalive?: boolean;
  referrer?: string;
  referrerPolicy?:
    | ''
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'origin'
    | 'origin-when-cross-origin'
    | 'same-origin'
    | 'strict-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url';
  window?: null;
};

export type RequestConfig = BaseRestConfig & {
  params?: Record<string | number, any>;
  body?: Record<string | number, any>;
  method?: Method;
};

export type RestConfig = BaseRestConfig & { request?: Request };

export type PromiseValue<T = any> = Promise<T> & {
  response: () => Promise<ResponseData<T>>;
};

export type HttpType = {
  path(url: string): HttpType;

  setConfig(restConfig: RestConfig): HttpType;

  setMeta(meta: { config: RestConfig }): HttpType;

  setBody<B extends Record<string | number, any>>(requestBody: B): HttpType;

  setParams<P extends Record<string | number, unknown>>(
    requestParams: P
  ): HttpType;

  get<T>(config?: RestConfig): PromiseValue<T>;

  post<T>(config?: RestConfig): PromiseValue<T>;

  put<T>(config?: RestConfig): PromiseValue<T>;

  delete<T>(config?: RestConfig): PromiseValue<T>;
};

export type Client = {
  rest(basePath: string): HttpType;
  config(cg: RestConfig | ((c: RestConfig) => RestConfig)): void;
};
