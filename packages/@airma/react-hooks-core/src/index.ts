import { useEffect, useRef } from 'react';

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

function noop() {
  /** This is a noop function */
}

function usePersistFn<T extends (...args: any[]) => any>(callback: T): T {
  const dispatchRef = useRef<T>(callback);
  dispatchRef.current = callback;
  const persistRef = useRef((...args: any[]): any =>
    dispatchRef.current(...args)
  );
  return persistRef.current as T;
}

function useMount(callback: () => (() => void) | void) {
  const mountRef = useRef(false);
  useEffect(() => {
    const mounted = mountRef.current;
    mountRef.current = true;
    if (mounted) {
      return noop;
    }
    const result = callback();
    if (typeof result === 'function') {
      return result;
    }
    return noop;
  }, []);
}

function useUpdate<T extends unknown[]>(
  callback: (prevDeps: [...T]) => (() => void) | void,
  deps?: [...T]
) {
  const depsRef = useRef<undefined | { deps: T }>(undefined);

  useEffect(() => {
    const { current } = depsRef;
    depsRef.current = { deps: deps || ([] as unknown as T) };
    if (!current) {
      return noop;
    }
    const prevDeps = current.deps;
    if (shallowEqual(prevDeps, deps || [])) {
      return noop;
    }
    const result = callback(prevDeps);
    if (typeof result === 'function') {
      return result;
    }
    return noop;
  }, deps);
}

export function useRefresh<T extends (...args: any[]) => any>(
  method: T,
  params:
    | Parameters<T>
    | {
        refreshDeps?: any[];
        variables: Parameters<T>;
      }
) {
  const isVariableParams = Array.isArray(params);
  const refreshDeps = (function computeRefreshDeps() {
    if (isVariableParams) {
      return params;
    }
    if (!params) {
      return undefined;
    }
    return params.refreshDeps;
  })();
  const variables = (function computeVariables() {
    if (isVariableParams) {
      return params;
    }
    if (!params) {
      return [];
    }
    return params.variables || [];
  })();
  const fn = usePersistFn(method);
  useEffect(() => {
    const result = fn(...variables);
    if (typeof result === 'function') {
      return result;
    }
    return () => undefined;
  }, refreshDeps);
}

function useUnmount(destroy: () => void): void {
  const mountRef = useRef(false);
  useEffect(() => {
    mountRef.current = true;
    return function des() {
      const mounted = mountRef.current;
      mountRef.current = false;
      if (!mounted) {
        return;
      }
      destroy();
    };
  }, []);
}

export { usePersistFn, useMount, useUnmount, useUpdate };
