declare type HttpProperties = {
  parentUrl: string;

  urls: Array<string>;

  requestBody?: Record<string | number, unknown>;

  requestParams?: Record<string | number, unknown>;

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

declare type ParamsProcessor = {
  stringify: (params: Record<string | number, any>) => string;
  parse: (query: string) => Record<string | number, any>;
};

declare type BaseRestConfig = {
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

export declare type RequestConfig = BaseRestConfig & {
  params?: Record<string | number, any>;
  body?: Record<string | number, any>;
  method?: Method;
};

export declare type Request = (
  url: string,
  requestConfig: RequestConfig
) => Promise<ResponseData>;

export declare type RestConfig = BaseRestConfig & {
  request?: Request;
  throwErrorResponse?: boolean;
};

declare type PromiseValue<T = any> = Promise<T> & {
  response: () => Promise<ResponseData<T>>;
};

declare type HttpType = {
  path(url: string): HttpType;

  setConfig(restConfig: RestConfig | ((c: RestConfig) => RestConfig)): HttpType;

  setBody<B extends Record<string, any> | Record<number, any>>(
    requestBody: B
  ): HttpType;

  setParams<P extends Record<string, any> | Record<number, any>>(
    requestParams: P
  ): HttpType;

  get<T>(
    config?: RestConfig | ((baseConfig: RestConfig) => RestConfig)
  ): PromiseValue<T>;

  post<T>(
    config?: RestConfig | ((baseConfig: RestConfig) => RestConfig)
  ): PromiseValue<T>;

  put<T>(
    config?: RestConfig | ((baseConfig: RestConfig) => RestConfig)
  ): PromiseValue<T>;

  delete<T>(
    config?: RestConfig | ((baseConfig: RestConfig) => RestConfig)
  ): PromiseValue<T>;
};

export declare type RuntimeRestConfig = RestConfig & {
  params?: Record<string | number, any>;
  body?: Record<string | number, any>;
  method?: Method;
};

export declare type Client = {
  rest(basePath: string): HttpType;
  config(cg: RestConfig | ((c: RestConfig) => RestConfig)): void;
  configRuntime(cg: (c: RuntimeRestConfig) => RuntimeRestConfig): void;
};

export declare function rest(url: string | HttpProperties): HttpType;

export declare function client(
  config?: RestConfig | ((c: RestConfig) => RestConfig)
): Client;

export declare const defaults: {
  request: Request;
  headers: Record<string, any>;
};
