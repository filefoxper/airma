import type {
  PromiseValue,
  Method,
  RequestConfig,
  ResponseData,
  RestConfig,
  HttpProperties,
  Client,
  HttpType
} from './type';
import { defaultRestConfig } from './constant';
import { request } from './request';

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

export function client(
  config: RestConfig | ((c: RestConfig) => RestConfig) = defaultRestConfig
): Client {
  const restConfig =
    typeof config === 'function' ? config(defaultRestConfig) : config;
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
