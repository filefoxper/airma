import { stringify, parse } from 'qs';
import type {
  PromiseValue,
  Method,
  RequestConfig,
  ResponseData,
  RestConfig,
  HttpProperties
} from './type';

const defaultHeaders = {
  'Content-Type': 'application/json',
  'X-Requested-With': 'XMLHttpRequest'
};

async function request<T>(
  input: string,
  config: RequestConfig
): Promise<ResponseData<T>> {
  function parseConfig(c: RequestConfig) {
    const { body, headers = defaultHeaders, method = 'GET' } = c;
    const { params, defaultParams, ...d } = c;
    const fetchHeaders = new Headers(headers);
    if (method === 'GET' || body == null) {
      return { ...d, headers: fetchHeaders, body: null };
    }
    const { 'Content-type': contentType } = headers;
    if (contentType === 'application/x-www-form-urlencoded') {
      const formData = new FormData();
      Object.keys(body).forEach(key => {
        const value = body[key];
        formData.append(key, value);
      });
      return { ...d, headers: fetchHeaders, body: formData };
    }
    return { ...d, headers: fetchHeaders, body: JSON.stringify(body) };
  }

  function getResponseData(c: RequestConfig) {
    const { responseType = 'json' } = c;
    return async function processResponse(
      response: Response
    ): Promise<ResponseData> {
      const { ok, status } = response;
      const data = await response[responseType]();
      if (ok) {
        return { data, status, isError: false };
      }
      return {
        error: data,
        status,
        networkError: false,
        isError: true
      };
    };
  }

  try {
    const queryFix = input.indexOf('?');
    const pathname = queryFix > -1 ? input.slice(0, queryFix) : input;
    const urlParamString = queryFix > -1 ? input.slice(queryFix + 1) : '';
    const urlParams = parse(urlParamString);
    const { params = {}, defaultParams = {} } = config;
    const queryParams = { ...defaultParams, ...urlParams, ...params };
    const search = stringify(queryParams, { addQueryPrefix: true });
    const response = await window.fetch(pathname + search, parseConfig(config));
    return getResponseData(config)(response);
  } catch (error: any) {
    return {
      status: null,
      error,
      networkError: true,
      isError: true
    };
  }
}

const defaultRestConfig: RestConfig = {
  headers: defaultHeaders
};

export class Http {
  private parentUrl = '/';

  private urls: Array<string> = [''];

  private requestBody?: Record<string, unknown>;

  private requestParams?: Record<string, unknown>;

  private restConfig: RestConfig = defaultRestConfig;

  private getPath(): string {
    const pathArray = [this.parentUrl, ...this.urls].filter((path: string) =>
      path.trim()
    );
    return pathArray.join('/');
  }

  private run<T>(requestConfig: RequestConfig): PromiseValue<T> {
    const { restConfig } = this;
    const responsePromise: Promise<ResponseData<T>> = (
      restConfig.request || request
    )(this.getPath(), requestConfig);
    const promise: Promise<T> & { response?: Promise<ResponseData<T>> } =
      Promise.resolve(responsePromise).then(res => {
        const { isError } = res;
        if (isError) {
          return Promise.reject(res.error);
        }
        return res.data as T;
      });
    promise.response = responsePromise;
    return promise as PromiseValue<T>;
  }

  private clone() {
    const { urls, parentUrl, requestBody, requestParams, restConfig } = this;
    return new Http({
      urls,
      parentUrl,
      requestBody,
      requestParams,
      restConfig
    });
  }

  constructor(url: string | HttpProperties) {
    if (typeof url === 'string') {
      this.parentUrl = url;
    } else {
      Object.assign(this, url);
    }
  }

  path(url = ''): Http {
    this.urls = this.urls.concat(url.split('/'));
    return this.clone();
  }

  setRestConfig(restConfig: RestConfig): Http {
    this.restConfig = { ...defaultRestConfig, ...restConfig };
    return this.clone();
  }

  mergeRestConfig(restConfig: RestConfig): Http {
    const { headers, ...m } = this.restConfig;
    this.restConfig = {
      ...m,
      ...restConfig,
      headers: { ...headers, ...restConfig.headers }
    };
    return this.clone();
  }

  setRequestBody<B extends Record<string, any>>(requestBody: B): Http {
    this.requestBody = requestBody;
    return this.clone();
  }

  setRequestParams<P extends Record<string, unknown>>(requestParams: P): Http {
    this.requestParams = requestParams;
    return this.clone();
  }

  private setRequestConfig(method: Method, config?: RestConfig): RequestConfig {
    const { requestBody, requestParams, restConfig } = this;
    const { request: omit, ...m } = restConfig;
    const base: RequestConfig = {
      method,
      params: requestParams,
      body: requestBody
    };
    return {
      ...m,
      ...config,
      ...base
    };
  }

  get<T>(config?: RestConfig): PromiseValue<T> {
    return this.run(this.setRequestConfig('GET', config));
  }

  post<T>(config?: RestConfig): PromiseValue<T> {
    return this.run(this.setRequestConfig('POST', config));
  }

  put<T>(config?: RestConfig): PromiseValue<T> {
    return this.run(this.setRequestConfig('PUT', config));
  }

  delete<T>(config?: RestConfig): PromiseValue<T> {
    return this.run(this.setRequestConfig('DELETE', config));
  }
}

function rest(path: string): Http {
  return new Http(path);
}

export function client(
  config: RestConfig = defaultRestConfig
): (basePath: string) => Http {
  return function baseRest(basePath: string) {
    return rest(basePath).setRestConfig(config);
  };
}
