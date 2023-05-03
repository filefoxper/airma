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

function useUpdate(callback: () => (() => void) | void, deps?: any[]) {
  const depsRef = useRef<undefined | { deps: any[] }>(undefined);

  useEffect(() => {
    const { current } = depsRef;
    depsRef.current = { deps: deps || [] };
    if (!current) {
      return noop;
    }
    if (shallowEqual(current.deps, deps || [])) {
      return noop;
    }
    const result = callback();
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
