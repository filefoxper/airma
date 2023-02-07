declare type HttpProperties = {
  parentUrl: string;

  urls: Array<string>;

  requestBody?: Record<string, unknown>;

  requestParams?: Record<string, unknown>;

  restConfig: RestConfig;
};

declare type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

declare type ResponseType =
  | 'json'
  | 'text'
  | 'formData'
  | 'blob'
  | 'arrayBuffer';

export declare type SuccessResponse<T = any> = {
  status: number;
  headers?: Record<string, any>;
  data: T;
  isError: false;
};

export declare type ErrorResponse = {
  status: number | null;
  error: any;
  data: any;
  headers?: Record<string, any>;
  networkError?: boolean;
  isError: true;
};

export declare type ResponseData<T = any> = SuccessResponse<T> | ErrorResponse;

declare type BaseRestConfig = {
  headers?: Record<string, any>;
  responseType?: ResponseType;
  responseInterceptor?: (data: ResponseData) => ResponseData | undefined;
  defaultParams?: Record<string, any>;
};

export declare type RequestConfig = BaseRestConfig & {
  params?: Record<string, any>;
  body?: Record<string, any>;
  method?: Method;
};

export declare type Request = (
  url: string,
  requestConfig: RequestConfig
) => Promise<ResponseData>;

export declare type RestConfig = BaseRestConfig & { request?: Request };

declare type PromiseValue<T = any> = Promise<T> & {
  response: () => Promise<ResponseData<T>>;
};

declare type HttpType = {
  path(url: string): HttpType;

  setConfig(restConfig: RestConfig): HttpType;

  setBody<B extends Record<string, any>>(requestBody: B): HttpType;

  setParams<P extends Record<string, unknown>>(requestParams: P): HttpType;

  get<T>(config?: RestConfig): PromiseValue<T>;

  post<T>(config?: RestConfig): PromiseValue<T>;

  put<T>(config?: RestConfig): PromiseValue<T>;

  delete<T>(config?: RestConfig): PromiseValue<T>;
};

export declare type Client = {
  rest(basePath: string): HttpType;
  config(cg: RestConfig | ((c: RestConfig) => RestConfig)): void;
};

export declare function rest(url: string | HttpProperties): HttpType;

export declare function client(config?: RestConfig): Client;
