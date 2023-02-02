declare type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

declare type ResponseType =
  | 'json'
  | 'text'
  | 'formData'
  | 'blob'
  | 'arrayBuffer';

export declare type SuccessResponse<T = any> = {
  status: number;
  data: T;
  isError: false;
};

export declare type ErrorResponse = {
  status: number | null;
  error: any;
  networkError: boolean;
  isError: true;
};

export declare type ResponseData<T = any> = SuccessResponse<T> | ErrorResponse;

declare type BaseRestConfig = {
  headers?: Record<string, any>;
  responseType?: ResponseType;
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
  response: Promise<ResponseData<T>>;
};

declare class Http {
  path(url: string): Http;

  setRestConfig(restConfig: RestConfig): Http;

  mergeRestConfig(restConfig: RestConfig): Http;

  setRequestBody<B extends Record<string, any>>(requestBody: B): Http;

  setRequestParams<P extends Record<string, unknown>>(requestParams: P): Http;

  get<T>(config?: RestConfig): PromiseValue<T>;

  post<T>(config?: RestConfig): PromiseValue<T>;

  put<T>(config?: RestConfig): PromiseValue<T>;

  delete<T>(config?: RestConfig): PromiseValue<T>;
}

export declare function client(config?: RestConfig): (basePath: string) => Http;
