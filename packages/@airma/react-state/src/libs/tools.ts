function getDescriptors(
  target: any,
  receiver: any,
  ownOrPrototype: any,
  handler: ProxyHandler<any>
) {
  const it = Object.keys(ownOrPrototype);
  const result: Record<string, PropertyDescriptor> = {};
  it.forEach(key => {
    result[key] = {
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
      }
    };
  });
  return result;
}

export const useSimpleProxy = <T extends Record<string, unknown>>(
  target: T,
  handler: ProxyHandler<T>
): T => {
  const proxy = {};
  const own = getDescriptors(target, proxy as T, target, handler);
  const prototype = getDescriptors(
    target,
    proxy as T,
    Object.getPrototypeOf(target),
    handler
  );
  Object.defineProperties(proxy, { ...prototype, ...own });
  return proxy as T;
};

export const createProxy = <T extends Record<string, any>>(
  target: T,
  handler: ProxyHandler<T>
): T => {
  if (typeof Proxy !== 'function') {
    return useSimpleProxy(target, handler);
  }
  return new Proxy(target, handler);
};

function isObject(data: any): data is Record<string, unknown> {
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
  const pre = prev as Record<string, unknown>;
  const curr = current as Record<string, unknown>;
  const hasDiffKey = prevKeys.some(
    key => !Object.prototype.hasOwnProperty.call(curr, key)
  );
  if (hasDiffKey) {
    return false;
  }
  const hasDiffValue = currentKeys.some(key => {
    const currentValue = curr[key];
    const prevValue = pre[key];
    return !Object.is(currentValue, prevValue);
  });
  return !hasDiffValue;
}

export function toMapObject<K extends string, V>(entries: [K, V][]) {
  const data = {} as Record<K, V>;
  entries.forEach(([key, value]) => {
    data[key] = value;
  });
  return {
    get(k: K): V | undefined {
      return data[k];
    }
  };
}

export function noop() {
  /** This is a noop function */
}
