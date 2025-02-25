import { useEffect, useRef } from 'react';
import { Promisify } from './type';

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
  const persistRef = useRef(function proxy(...args: any[]): any {
    return dispatchRef.current(...args);
  });
  Object.assign(persistRef.current, callback);
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

function useDebounceFn<F extends (...args: any[]) => any>(
  fn: F,
  option: number | { lead?: boolean; ms: number }
): Promisify<F> {
  const ref = useRef<{
    executor:
      | {
          promise: Promise<any>;
          resolve: (data: any) => any;
          reject: (data: any) => any;
        }
      | undefined;
    timeoutHandler: any;
  }>({ executor: undefined, timeoutHandler: undefined });
  const ms = typeof option === 'number' ? option : option.ms;
  const lead = typeof option === 'number' ? false : !!option.lead;
  function createExecutor() {
    const executor: {
      promise: Promise<any>;
      resolve: (data: any) => any;
      reject: (data: any) => any;
    } = {} as any;
    executor.promise = new Promise((resolve, reject) => {
      executor.resolve = resolve;
      executor.reject = reject;
    });
    return executor;
  }
  const persistFn = usePersistFn((...args: any[]) => {
    function normal() {
      if (ref.current.timeoutHandler != null) {
        clearTimeout(ref.current.timeoutHandler);
        ref.current.timeoutHandler = undefined;
      }
      ref.current.executor = ref.current.executor || createExecutor();
      ref.current.timeoutHandler = setTimeout(() => {
        const { executor } = ref.current;
        if (executor == null) {
          return;
        }
        try {
          const result = fn(...args);
          executor.resolve(result);
        } catch (e) {
          executor.reject(e);
        }
        ref.current.timeoutHandler = undefined;
        ref.current.executor = undefined;
      }, ms);
      return ref.current.executor.promise;
    }

    function leading() {
      if (ref.current.timeoutHandler != null) {
        clearTimeout(ref.current.timeoutHandler);
        ref.current.timeoutHandler = undefined;
      }
      ref.current.timeoutHandler = setTimeout(() => {
        ref.current.timeoutHandler = undefined;
        ref.current.executor = undefined;
      }, ms);
      if (ref.current.executor != null) {
        return ref.current.executor.promise;
      }
      ref.current.executor = createExecutor();
      const { executor } = ref.current;
      try {
        const result = fn(...args);
        executor.resolve(result);
      } catch (e) {
        executor.reject(e);
      }
      return ref.current.executor.promise;
    }
    return lead ? leading() : normal();
  });
  return persistFn as Promisify<F>;
}

export { usePersistFn, useMount, useUnmount, useUpdate, useDebounceFn };
