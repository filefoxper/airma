import type { AirModel } from './type';

function isFunctionPrototype(prototype: Record<string, unknown>): boolean {
  // class extends
  if (Object.getPrototypeOf(prototype) !== Object.prototype) {
    return false;
  }
  // no class methods
  const names = Object.getOwnPropertyNames(prototype);
  if (!names.length) {
    return true;
  }
  return names.length === 1 && names[0] === 'constructor';
}

export function isFunctionModel<S, T extends AirModel<S>>(
  model: T | { new (): T } | ((state: S) => T)
): model is (state: S) => T {
  if (typeof model !== 'function') {
    return false;
  }
  const { prototype } = model;
  if (prototype == null) {
    return true;
  }
  return isFunctionPrototype(prototype);
}

function getDescriptors(
    target: any,
    receiver: any,
    ownOrPrototype: any,
    handler: ProxyHandler<any>,
) {
    const owns = Object.getOwnPropertyDescriptors(ownOrPrototype);
    const it = Object.keys(owns);
    const newOwns: Array<[string, PropertyDescriptor]> = it.map((key) => {
        const newDesc: PropertyDescriptor = {
            get: (): any => {
                if (!handler.get) {
                    return target[key];
                }
                return handler.get(target, key, receiver);
            },
            set: (v: any) => {
                if (!handler.set) {
                    target[key] = v;
                    return;
                }
                const valid = handler.set(target, key, v, receiver);
                if (!valid) {
                    throw new Error(`${key} in proxy target is not mutable`);
                }
            },
        };
        return [key, newDesc];
    });
    return newOwns.reduce((res, [key, desc]) => ({ ...res, [key]: desc }), {});
}

export const useSimpleProxy = <T extends Record<string, unknown>>(
    target: T,
    handler: ProxyHandler<T>,
): T => {
    const proxy = {};
    const own = getDescriptors(target, proxy as T, target, handler);
    const prototype = getDescriptors(
        target,
        proxy as T,
        Object.getPrototypeOf(target),
        handler,
    );
    Object.defineProperties(proxy, { ...prototype, ...own });
    return proxy as T;
};

export const createProxy = <T extends Record<string, any>>(
    target: T,
    handler: ProxyHandler<T>,
): T => {
    if (typeof Proxy !== 'function') {
        return useSimpleProxy(target, handler);
    }
    return new Proxy(target, handler);
};

function isObject<T>(data: T): boolean {
    return data && typeof data === 'object';
}

export function shallowEqual<R>(prev: R, current: R): boolean {
    if (Object.is(prev, current)) {
        return true;
    }
    if (!isObject(prev) || !isObject(current)) {
        return false;
    }
    const prevKeys = Object.keys(prev);
    const currentKeys = Object.keys(current);
    if (prevKeys.length !== currentKeys.length) {
        return false;
    }
    const pre = (prev as Record<string, unknown>);
    const curr = (current as Record<string, unknown>);
    const hasDiffKey = prevKeys.some((key) => !Object.prototype.hasOwnProperty.call(curr, key));
    if (hasDiffKey) {
        return false;
    }
    const hasDiffValue = currentKeys.some((key) => {
        const currentValue = curr[key];
        const prevValue = pre[key];
        return !Object.is(currentValue, prevValue);
    });
    return !hasDiffValue;
}

