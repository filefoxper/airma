import { SessionState, StrategyType } from './type';

export function composeStrategies(
  strategies: (StrategyType | undefined | null)[]
): StrategyType {
  const defaultStrategy: StrategyType = value => value.runner();
  return function strategy(v) {
    const storeSlots = v.store.current as { current: any }[];
    const callback = [...strategies]
      .reverse()
      .reduce((r: StrategyType, c: StrategyType | undefined | null, i) => {
        const storage = storeSlots[i] || { current: undefined };
        return function middle(value) {
          if (c == null) {
            return r(value);
          }
          const nextRunner = () => r(value);
          return c({ ...value, store: storage, runner: nextRunner });
        };
      }, defaultStrategy);
    return callback(v).then(d => {
      const { loaded } = v.current();
      const { abandon, isError, isFetching } = d;
      const currentLoaded = loaded || (!abandon && !isError && !isFetching);
      return {
        ...d,
        loaded: currentLoaded
      };
    });
  };
}

export function latest(): StrategyType {
  return function latestStrategy(requires): Promise<SessionState> {
    const { runner, store } = requires;
    store.current = store.current || 0;
    const version = store.current + 1;
    store.current = version;
    return runner().then(sessionData => {
      if (store.current !== version) {
        return { ...sessionData, abandon: true };
      }
      return sessionData;
    });
  };
}

export function block(): StrategyType {
  return function blockStrategy(requires): Promise<SessionState> {
    const { runner, store } = requires;
    if (store.current) {
      return store.current.then((sessionData: SessionState) => ({
        ...sessionData,
        abandon: true
      }));
    }
    const promise = runner();
    store.current = promise.then((sessionData: SessionState) => {
      store.current = undefined;
      return sessionData;
    });
    return promise;
  };
}

function debounce(op: { duration: number } | number): StrategyType {
  const time = typeof op === 'number' ? op : op.duration;
  return function db(value: {
    current: () => SessionState;
    runner: () => Promise<SessionState>;
    store: {
      current?: {
        id: any;
        resolve: (d: any) => void;
        promise: Promise<SessionState>;
      };
    };
  }): Promise<SessionState> {
    const { current, runner, store } = value;
    if (store.current) {
      const { id, resolve } = store.current;
      clearTimeout(id);
      store.current.id = setTimeout(() => {
        store.current = undefined;
        resolve(runner());
      }, time);
      return store.current.promise.then(d => ({ ...d, abandon: true }));
    }
    const defaultPromise = new Promise<SessionState>(resolve => {
      const currentState = current();
      resolve({ ...currentState, abandon: true });
    });
    const storeRef: {
      id: any;
      resolve: (d: any) => void;
      promise: Promise<SessionState>;
    } = {
      id: null,
      resolve: () => undefined,
      promise: defaultPromise
    };
    const promise = new Promise<SessionState>(resolve => {
      storeRef.id = setTimeout(() => {
        store.current = undefined;
        resolve(runner());
      }, time);
      storeRef.resolve = resolve;
    });
    storeRef.promise = promise;
    store.current = storeRef;
    return promise;
  };
}

function once(): StrategyType {
  return function oc(runtime: {
    current: () => SessionState;
    runner: () => Promise<SessionState>;
    store: { current?: Promise<SessionState> };
  }) {
    const { runner, store } = runtime;
    if (store.current) {
      return store.current.then(d => ({ ...d, abandon: true }));
    }
    store.current = runner().then(d => {
      if (d.isError) {
        store.current = undefined;
      }
      return d;
    });
    return store.current;
  };
}

const stringifyComparator = function comparator(s: any, t: any) {
  if (Object.is(s, t)) {
    return true;
  }
  if (s == null || t == null) {
    return false;
  }
  return JSON.stringify(s) === JSON.stringify(t);
};

function memo<T>(
  equalFn: (source: T | undefined, target: T) => boolean = stringifyComparator
): StrategyType {
  return function mo(value) {
    const { runner, current } = value;
    return runner().then(d => {
      const state = current();
      if (
        typeof equalFn === 'function'
          ? equalFn(state.data, d.data)
          : state.data === d.data
      ) {
        return { ...d, data: state.data };
      }
      return d;
    });
  };
}

function throttle(op: { duration: number } | number): StrategyType {
  const duration = typeof op === 'number' ? op : op.duration;

  function hasChanged(cacheVariables: any[] | undefined, variables: any[]) {
    if (cacheVariables == null) {
      return true;
    }
    const equality = stringifyComparator(cacheVariables, variables);
    return !equality;
  }

  return function th(value) {
    const { current, runner, store, variables = [] } = value;
    store.current = store.current || { timeoutId: null, variables: undefined };
    const storedVariables = store.current.variables;
    const { timeoutId } = store.current;
    if (!hasChanged(storedVariables, variables) && timeoutId != null) {
      return new Promise(resolve => {
        resolve(current());
      });
    }
    store.current.variables = variables;
    if (timeoutId != null) {
      clearTimeout(timeoutId);
    }
    store.current.timeoutId = setTimeout(() => {
      store.current = store.current || {};
      store.current.timeoutId = null;
    }, duration);
    return runner();
  };
}

function error(
  process: (e: unknown, sessionData: SessionState) => any,
  option?: { withAbandoned?: boolean }
): StrategyType {
  const { withAbandoned } = option || {};
  return function er(value) {
    const { runner, runtimeCache, store } = value;
    const hasHigherErrorProcessor = runtimeCache.get(error);
    runtimeCache.set(error, true);
    store.current = process;
    return runner().then(d => {
      const currentProcess = store.current;
      if (
        d.isError &&
        !hasHigherErrorProcessor &&
        currentProcess &&
        (!d.abandon || withAbandoned)
      ) {
        currentProcess(d.error, d);
      }
      return d;
    });
  };
}

function success<T>(
  process: (data: T, sessionData: SessionState) => any,
  option?: { withAbandoned?: boolean }
): StrategyType<T> {
  const { withAbandoned } = option || {};
  return function sc(value: {
    current: () => SessionState<T>;
    runner: () => Promise<SessionState<T>>;
    store: { current?: (data: T, sessionData: SessionState<T>) => any };
  }) {
    const { runner, store } = value;
    store.current = process;
    return runner().then(d => {
      const currentProcess = store.current;
      if (!d.isError && currentProcess && (!d.abandon || withAbandoned)) {
        currentProcess(d.data as T, d);
      }
      return d;
    });
  };
}

function validate(callback: () => boolean): StrategyType {
  return function validStrategy({ runner, current }) {
    const result = callback();
    if (!result) {
      const state = current();
      return new Promise(resolve => {
        resolve({ ...state, abandon: true });
      });
    }
    return runner();
  };
}

export const Strategy = {
  debounce,
  throttle,
  once,
  error,
  success,
  validate,
  memo
};
