import { noop, shallowEqual } from '@airma/core';
import { useEffect, useRef } from 'react';

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

function useUpdate<T extends any[]>(
  callback: (prevDeps: undefined | T) => (() => void) | void,
  deps?: T
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
