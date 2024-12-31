import type {
  PromiseValue,
  Method,
  RequestConfig,
  ResponseData,
  RestConfig,
  HttpProperties,
  Client,
  HttpType,
  Meta,
  RuntimeRestConfig
} from './type';
import { defaultHeaders, defaultRestConfig } from './constant';
import { request } from './request';

export function rest(url: string | HttpProperties): HttpType {
  const defaultHttpProperties = {
    parentUrl: '/',
    urls: [''],
    restConfig: defaultRestConfig,
    meta: { config: defaultRestConfig, runtimeConfig: null }
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

  const run = <T>(rcg: RuntimeRestConfig): PromiseValue<T> => {
    let ignoreDataPromise = false;
    const { request: currentRequest, ...requestConfig } = rcg;
    const { restConfig } = properties;
    const interceptor = rcg.responseInterceptor;
    const responsePromise: Promise<ResponseData<T>> = (
      currentRequest ||
      restConfig.request ||
      request
    )(getPath(), requestConfig).then(res => {
      if (typeof interceptor !== 'function') {
        return res;
      }
      const result = interceptor(res);
      if (result == null) {
        return res;
      }
      return result;
    });
    const promise: Promise<T> & { response?: () => Promise<ResponseData<T>> } =
      Promise.resolve(responsePromise).then(res => {
        if (ignoreDataPromise) {
          return null as T;
        }
        const { isError } = res;
        if (!isError) {
          return res.data as T;
        }
        if (requestConfig.throwErrorResponse) {
          return Promise.reject(res);
        }
        return Promise.reject(res.error);
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

  const getCurrentRequestConfigByRuntime = (
    config: RuntimeRestConfig
  ): RuntimeRestConfig => {
    const { restConfig, meta } = properties;
    const metaConfig = meta.runtimeConfig
      ? meta.runtimeConfig({
          request,
          ...meta.config,
          ...restConfig,
          ...config
        })
      : meta.config;
    return restConfig === defaultRestConfig
      ? { ...metaConfig, ...config }
      : { ...metaConfig, ...restConfig, ...config };
  };

  const setRequestConfig = (
    method: Method,
    config?: RestConfig | ((baseConfig: RestConfig) => RestConfig)
  ): RuntimeRestConfig => {
    const { requestBody, requestParams } = properties;
    const base: RequestConfig = {
      method,
      params: requestParams,
      body: requestBody
    };
    return getCurrentRequestConfigByRuntime(
      typeof config === 'function' ? config(base) : { ...base, ...config }
    );
  };

  return {
    path(child = ''): HttpType {
      const { urls } = properties;
      return rest({ ...properties, urls: urls.concat(child.split('/')) });
    },
    setMeta(meta: Meta): HttpType {
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
    get<T>(
      config?: RestConfig | ((baseConfig: RestConfig) => RestConfig)
    ): PromiseValue<T> {
      return run(setRequestConfig('GET', config));
    },
    post<T>(
      config?: RestConfig | ((baseConfig: RestConfig) => RestConfig)
    ): PromiseValue<T> {
      return run(setRequestConfig('POST', config));
    },
    put<T>(
      config?: RestConfig | ((baseConfig: RestConfig) => RestConfig)
    ): PromiseValue<T> {
      return run(setRequestConfig('PUT', config));
    },
    delete<T>(
      config?: RestConfig | ((baseConfig: RestConfig) => RestConfig)
    ): PromiseValue<T> {
      return run(setRequestConfig('DELETE', config));
    }
  };
}

export function client(
  config: RestConfig | ((c: RestConfig) => RestConfig) = defaultRestConfig
): Client {
  const restConfig =
    typeof config === 'function'
      ? config({ request, ...defaultRestConfig })
      : config;
  const meta: Meta = { config: restConfig, runtimeConfig: null };
  return {
    rest(basePath: string): HttpType {
      return rest(basePath).setMeta(meta);
    },
    config(cg: RestConfig | ((c: RestConfig) => RestConfig)): void {
      const restfulConfig = meta.config;
      if (typeof cg === 'function') {
        meta.config = Object.assign(
          restfulConfig,
          cg({ request, ...restfulConfig })
        );
        return;
      }
      meta.config = Object.assign(restfulConfig, cg);
    },
    configRuntime(cg: (c: RuntimeRestConfig) => RuntimeRestConfig): void {
      meta.runtimeConfig = cg;
    }
  };
}

export const defaults = { request, headers: defaultHeaders };
