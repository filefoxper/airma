import { stringify, parse } from 'qs';
import type {
  PromiseValue,
  Method,
  RequestConfig,
  ResponseData,
  RestConfig,
  HttpProperties,
  Client,
  ErrorResponse,
  HttpType
} from './type';

const defaultHeaders = {
  'Content-Type': 'application/json',
  'X-Requested-With': 'XMLHttpRequest'
};

function request<T>(
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
    const { responseType } = c;

    function autoProcessResponse(response: Response) {
      const cloned = response.clone();
      return response.json().then(
        d => d,
        () => cloned.text()
      );
    }

    return function processResponse(response: Response): Promise<ResponseData> {
      const { ok, status, headers } = response;
      const dataPromise: Promise<any> = responseType
        ? response[responseType]()
        : autoProcessResponse(response);
      if (ok) {
        return dataPromise.then(data => ({
          data,
          status,
          headers,
          isError: false
        }));
      }
      return dataPromise.then(data => ({
        error: data,
        data,
        headers,
        status,
        networkError: false,
        isError: true
      }));
    };
  }

  function intercept(
    d: ResponseData,
    responseInterceptor: (d: ResponseData) => ResponseData | undefined
  ) {
    const result = responseInterceptor(d);
    if (result == null) {
      return d;
    }
    return result;
  }

  const { responseInterceptor = (d: ResponseData) => undefined } = config;
  const queryFix = input.indexOf('?');
  const pathname = queryFix > -1 ? input.slice(0, queryFix) : input;
  const urlParamString = queryFix > -1 ? input.slice(queryFix + 1) : '';
  const urlParams = parse(urlParamString);
  const { params = {}, defaultParams = {} } = config;
  const queryParams = { ...defaultParams, ...urlParams, ...params };
  const search = stringify(queryParams, { addQueryPrefix: true });
  return window.fetch(pathname + search, parseConfig(config)).then(
    response => {
      return getResponseData(config)(response).then(data =>
        intercept(data, responseInterceptor)
      );
    },
    error => {
      const networkErrorRes = {
        status: null,
        data: error,
        error,
        networkError: true,
        isError: true
      } as ErrorResponse;
      return intercept(networkErrorRes, responseInterceptor);
    }
  );
}

const defaultRestConfig: RestConfig = {
  headers: defaultHeaders
};

export function rest(url: string | HttpProperties): HttpType {
  const defaultHttpProperties = {
    parentUrl: '/',
    urls: [''],
    restConfig: defaultRestConfig
  };
  const properties: HttpProperties =
    typeof url === 'string'
      ? { ...defaultHttpProperties, parentUrl: url }
      : { ...defaultHttpProperties, ...url };

  const getPath = (): string => {
    const { parentUrl, urls } = properties;
    const pathArray = [parentUrl, ...urls].filter((path: string) =>
      path.trim()
    );
    return pathArray.join('/');
  };

  const run = <T>(requestConfig: RequestConfig): PromiseValue<T> => {
    let ignoreDataPromise = false;
    const { restConfig } = properties;
    const responsePromise: Promise<ResponseData<T>> = (
      restConfig.request || request
    )(getPath(), requestConfig);
    const promise: Promise<T> & { response?: () => Promise<ResponseData<T>> } =
      Promise.resolve(responsePromise).then(res => {
        if (ignoreDataPromise) {
          return null as T;
        }
        const { isError } = res;
        if (isError) {
          return Promise.reject(res.error);
        }
        return res.data as T;
      });
    promise.response = () => {
      ignoreDataPromise = true;
      return responsePromise;
    };
    return promise as PromiseValue<T>;
  };

  const setRequestConfig = (
    method: Method,
    config?: RestConfig
  ): RequestConfig => {
    const { requestBody, requestParams, restConfig } = properties;
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
  };

  const clone = () => {
    return rest(properties);
  };

  return {
    path(child = ''): HttpType {
      const { urls } = properties;
      properties.urls = urls.concat(child.split('/'));
      return clone();
    },
    setConfig(restConfig: RestConfig): HttpType {
      properties.restConfig = { ...defaultRestConfig, ...restConfig };
      return clone();
    },
    setBody<B extends Record<string, any>>(requestBody: B): HttpType {
      properties.requestBody = requestBody;
      return clone();
    },
    setParams<P extends Record<string, unknown>>(requestParams: P): HttpType {
      properties.requestParams = requestParams;
      return clone();
    },
    get<T>(config?: RestConfig): PromiseValue<T> {
      return run(setRequestConfig('GET', config));
    },
    post<T>(config?: RestConfig): PromiseValue<T> {
      return run(setRequestConfig('POST', config));
    },
    put<T>(config?: RestConfig): PromiseValue<T> {
      return run(setRequestConfig('PUT', config));
    },
    delete<T>(config?: RestConfig): PromiseValue<T> {
      return run(setRequestConfig('DELETE', config));
    }
  };
}

export function client(config: RestConfig = defaultRestConfig): Client {
  const restConfig = config;
  return {
    rest(basePath: string): HttpType {
      return rest(basePath).setConfig(restConfig);
    },
    config(cg: RestConfig | ((c: RestConfig) => RestConfig)): void {
      if (typeof cg === 'function') {
        Object.assign(restConfig, cg(restConfig));
        return;
      }
      Object.assign(restConfig, cg);
    }
  };
}
