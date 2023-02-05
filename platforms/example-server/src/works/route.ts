import { Router } from 'express';

declare type MethodType = 'get' | 'post' | 'delete' | 'put';

export interface RouterHolder {
  _router?: Router;
  _routerHolder?: [string, Router];
}

export const request = (url: string) => {
  return <T>(Target: { new (): T & RouterHolder }) => {
    const router = Router();
    const { prototype } = Target;
    prototype._router = router;
    prototype._routerHolder = [url, router];
    return Target;
  };
};

export const invoke = (method: MethodType, url: string) => {
  return <T>(
    target: T & RouterHolder,
    property: string,
    desc: PropertyDescriptor
  ) => {
    const callback: (...args: any[]) => any = desc.value;
    desc.value = function () {
      const router = target._router;
      if (!router) {
        return;
      }
      router[method](url, callback.bind(this));
    };
    desc.enumerable = true;
    desc.value.isRoute = true;
  };
};

export const post = (url: string, option?: any) => invoke('post', url);

export const get = (url: string, option?: any) => invoke('get', url);

export const remove = (url: string, option?: any) => invoke('delete', url);

export const put = (url: string, option?: any) => invoke('put', url);

export const generateRoutes = (
  holders: Array<{ new (): any & RouterHolder }>
): Array<[string, Router]> => {
  const routers = holders.map((Holder: { new (): RouterHolder }) => {
    return new Holder();
  });
  routers.forEach((router: any) => {
    const keys = Object.keys(Object.getPrototypeOf(router));
    keys.forEach((key: string) => {
      const value = router[key];
      if (typeof value === 'function' && value.isRoute) {
        value.call(router);
      }
    });
  });
  return routers
    .map(({ _routerHolder }: RouterHolder) => {
      return _routerHolder;
    })
    .filter((_routerHolder: [string, Router] | undefined) => {
      return _routerHolder;
    }) as Array<[string, Router]>;
};
