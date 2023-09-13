import { SessionState, StrategyType } from './libs/type';

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
      return store.current.promise;
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

function reduce<T>(
  call: (previous: T | undefined, currentData: T) => T | undefined
): StrategyType {
  return function reduceStrategy(requires): Promise<SessionState> {
    const { runner, current } = requires;
    return runner().then(d => {
      if (d.isError || d.abandon) {
        return d;
      }
      const state = current();
      const newData = call(state.data, d.data);
      return { ...d, data: newData } as SessionState;
    });
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

function effect<T>(callback: (state: SessionState<T>) => void): StrategyType {
  const sc: StrategyType = function sc(value) {
    const { runner } = value;
    return runner();
  };
  sc.effect = callback;
  return sc;
}

effect.success = function effectSuccess<T>(
  process: (data: T, sessionData: SessionState<T>) => any
): StrategyType {
  const sc: StrategyType = function sc(value) {
    const { runner } = value;
    return runner();
  };
  sc.effect = function effectCallback(state) {
    if (state.isError || state.isFetching || !state.sessionLoaded) {
      return;
    }
    process(state.data, state);
  };
  return sc;
};

effect.error = function effectError<T>(
  process: (e: unknown, sessionData: SessionState) => any
): StrategyType {
  const sc: StrategyType = function sc(value) {
    const { runner, runtimeCache } = value;
    runtimeCache.set(error, true);
    return runner();
  };
  sc.effect = function effectCallback(state) {
    if (!state.isError || state.isFetching) {
      return;
    }
    process(state.error, state);
  };
  return sc;
};

export const Strategy = {
  debounce,
  throttle,
  once,
  error,
  success,
  validate,
  memo,
  reduce,
  effect
};
