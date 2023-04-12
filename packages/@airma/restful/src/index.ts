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
    restConfig: defaultRestConfig,
    meta: { config: defaultRestConfig }
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
    const { restConfig, meta } = properties;
    const responsePromise: Promise<ResponseData<T>> = (
      restConfig.request ||
      meta.config.request ||
      request
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

  const getCurrentRequestConfig = () => {
    const { restConfig, meta } = properties;
    const metaConfig = meta.config;
    return restConfig === defaultRestConfig
      ? metaConfig
      : { ...metaConfig, ...restConfig };
  };

  const setRequestConfig = (
    method: Method,
    config?: RestConfig
  ): RequestConfig => {
    const { requestBody, requestParams } = properties;
    const { request: omit, ...c } = getCurrentRequestConfig();
    const base: RequestConfig = {
      method,
      params: requestParams,
      body: requestBody
    };
    return {
      ...c,
      ...config,
      ...base
    };
  };

  return {
    path(child = ''): HttpType {
      const { urls } = properties;
      return rest({ ...properties, urls: urls.concat(child.split('/')) });
    },
    setMeta(meta: { config: RestConfig }): HttpType {
      return rest({
        ...properties,
        meta
      });
    },
    setConfig(
      restConfig: RestConfig | ((c: RestConfig) => RestConfig)
    ): HttpType {
      const currentConfig = getCurrentRequestConfig();
      if (typeof restConfig === 'function') {
        return rest({
          ...properties,
          restConfig: {
            ...currentConfig,
            ...restConfig(currentConfig)
          }
        });
      }
      return rest({
        ...properties,
        restConfig: { ...currentConfig, ...restConfig }
      });
    },
    setBody<B extends Record<string, any>>(requestBody: B): HttpType {
      return rest({ ...properties, requestBody });
    },
    setParams<P extends Record<string, unknown>>(requestParams: P): HttpType {
      return rest({ ...properties, requestParams });
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
  const meta = { config: restConfig };
  return {
    rest(basePath: string): HttpType {
      return rest(basePath).setMeta(meta);
    },
    config(cg: RestConfig | ((c: RestConfig) => RestConfig)): void {
      const restfulConfig = meta.config;
      if (typeof cg === 'function') {
        meta.config = Object.assign(restfulConfig, cg(restfulConfig));
        return;
      }
      meta.config = Object.assign(restfulConfig, cg);
    }
  };
}
