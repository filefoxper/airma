import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PromiseResult, SideEffectCallback, ResponseType } from './type';

function useSafeState<T>(defaultState: T): [T, (s: T | ((d: T) => T)) => void] {
  const [state, setState] = useState(defaultState);
  const mountingRef = useRef(true);
  const set = useCallback(
    (s: T | ((d: T) => T)) => {
      if (!mountingRef.current) {
        return;
      }
      setState(s);
    },
    [setState]
  );
  useEffect(() => {
    return () => {
      mountingRef.current = false;
    };
  }, []);
  return [state, set];
}

export function useSideEffect<T, C extends SideEffectCallback<T>>(
  callback: C,
  defaultState: T,
  config?: { deps?: any[]; manual?: boolean } | any[]
): [T, () => ReturnType<C>, { destroy: () => any }] {
  const c = config || {};
  const isArrayConfig = Array.isArray(c);
  const effectDeps = isArrayConfig ? c : c.deps || [];
  const manual = isArrayConfig ? false : c.manual;
  const [state, setState] = useSafeState<T>(defaultState);
  const caller = () => callback(setState);
  const destroyRef = useRef<null | (() => any)>(null);
  const callbackRef = useRef(caller);
  callbackRef.current = caller;

  const destroy = useCallback(() => {
    if (destroyRef.current != null) {
      destroyRef.current();
    }
  }, []);

  const sideEffectCallback = useCallback<typeof caller>(() => {
    if (destroyRef.current != null) {
      destroyRef.current();
    }
    const result = callbackRef.current();
    if (typeof result === 'function') {
      destroyRef.current = result;
    } else {
      destroyRef.current = null;
    }
    return result;
  }, []);

  useEffect(() => {
    if (manual) {
      return;
    }
    sideEffectCallback();
  }, effectDeps);

  useEffect(() => {
    return () => {
      const des = destroyRef.current;
      if (des == null) {
        return;
      }
      des();
    };
  }, []);

  return [state, sideEffectCallback, { destroy }];
}

export function useQuery<T>(
  callback: () => Promise<T>,
  config?: { deps?: any[]; manual?: boolean } | any[]
): [PromiseResult<T>, () => Promise<PromiseResult<T>>] {
  const defaultState: PromiseResult<T> = useMemo(
    () => ({
      data: undefined,
      isError: false,
      isFetching: false,
      abandon: false
    }),
    []
  );

  const versionRef = useRef(0);

  const resolver = (
    response: ResponseType<PromiseResult<T>>
  ): Promise<PromiseResult<T>> => {
    response(d => ({ ...(d || defaultState), isFetching: true }));
    const result = callback();
    if (!result || typeof result.then !== 'function') {
      throw new Error('The callback have to return a promise object.');
    }
    const nextVersion = versionRef.current + 1;
    versionRef.current = nextVersion;
    return result.then(
      d => {
        const r = {
          data: d,
          isError: false,
          isFetching: false,
          abandon: nextVersion !== versionRef.current
        };
        if (!r.abandon) {
          response(r);
        }
        return r;
      },
      e => {
        const r = {
          error: e,
          isError: true,
          isFetching: false,
          abandon: nextVersion !== versionRef.current
        };
        if (!r.abandon) {
          response(d => ({
            ...(d || defaultState),
            ...r
          }));
        }
        return { ...r, data: undefined };
      }
    );
  };

  const [state, call] = useSideEffect(resolver, defaultState, config);
  return [state, call];
}

export function useMutation<T, C extends (...params: any[]) => Promise<T>>(
  callback: C,
  config?: { after?: (r: PromiseResult<T>) => any; repeatable?: boolean }
): [
  PromiseResult<T>,
  (...params: Parameters<typeof callback>) => Promise<PromiseResult<T>>
] {
  const defaultState: PromiseResult<T> = useMemo(
    () => ({
      data: undefined,
      isError: false,
      isFetching: false,
      abandon: false
    }),
    []
  );
  const { after = () => undefined, repeatable = true } = config || {};
  const savingRef = useRef(false);
  const [state, setState] = useSafeState<PromiseResult<T>>(defaultState);
  const mutate = useCallback((...params: Parameters<typeof callback>) => {
    if (savingRef.current) {
      return Promise.resolve({ ...state, abandon: true });
    }
    savingRef.current = true;
    setState(d => ({ ...d, isFetching: true }));
    const result = callback(...params).then();
    return result.then(
      d => {
        const r = {
          data: d,
          isError: false,
          isFetching: false,
          abandon: false
        };
        if (!r.abandon) {
          setState(r);
          after(r);
        }
        savingRef.current = !repeatable;
        return r;
      },
      e => {
        const r = {
          error: e,
          isError: true,
          isFetching: false,
          abandon: false
        };
        if (!r.abandon) {
          setState(d => ({
            ...(d || defaultState),
            ...r
          }));
          after({ ...r, data: undefined });
        }
        savingRef.current = false;
        return { ...r, data: undefined };
      }
    );
  }, []);
  return [state, mutate];
}
