import { SessionState, StrategyType } from './libs/type';

function noop() {
  /* noop */
}

function debounce(
  op: { duration: number; lead?: boolean } | number
): StrategyType {
  const time = typeof op === 'number' ? op : op.duration;
  const lead = typeof op === 'number' ? false : !!op.lead;
  return function db(value: {
    getSessionState: () => SessionState;
    runner: () => Promise<SessionState>;
    localCache: {
      current?: {
        id: any;
        version: number;
        resolve: (d: any) => void;
        promise: Promise<SessionState>;
      };
    };
  }): Promise<SessionState> {
    function leading() {
      const { getSessionState: current, runner, localCache: store } = value;
      if (store.current && store.current.id) {
        clearTimeout(store.current.id);
        store.current.id = undefined;
      }
      const timeoutId = setTimeout(() => {
        store.current = undefined;
      }, time);
      if (store.current != null) {
        store.current.id = timeoutId;
        return store.current.promise.then(d => {
          return { ...d, abandon: true };
        });
      }
      const defaultPromise = new Promise<SessionState>(resolve => {
        const currentState = current();
        resolve({ ...currentState, abandon: true });
      });
      const storeRef: {
        id: any;
        version: number;
        resolve: (d: any) => void;
        promise: Promise<SessionState>;
      } = {
        id: timeoutId,
        version: 0,
        resolve: () => undefined,
        promise: defaultPromise
      };
      const promise = new Promise<SessionState>(resolve => {
        resolve(runner());
        storeRef.resolve = resolve;
      });
      storeRef.promise = promise;
      store.current = storeRef;
      return promise;
    }

    function normal() {
      const { getSessionState: current, runner, localCache: store } = value;
      if (store.current) {
        const { id, resolve } = store.current;
        clearTimeout(id);
        store.current.id = setTimeout(() => {
          store.current = undefined;
          resolve(runner());
        }, time);
        store.current.version += 1;
        const cVersion = store.current.version;
        return store.current.promise.then(d =>
          cVersion === store.current?.version || 0 ? d : { ...d, abandon: true }
        );
      }
      const defaultPromise = new Promise<SessionState>(resolve => {
        const currentState = current();
        resolve({ ...currentState, abandon: true });
      });
      const storeRef: {
        id: any;
        version: number;
        resolve: (d: any) => void;
        promise: Promise<SessionState>;
      } = {
        id: null,
        version: 0,
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
      const currentVersion = storeRef.version;
      return promise.then(d =>
        store.current?.version || currentVersion === 0
          ? d
          : { ...d, abandon: true }
      );
    }
    return lead ? leading() : normal();
  };
}

function once(): StrategyType {
  return function oc(runtime: {
    getSessionState: () => SessionState;
    runner: () => Promise<SessionState>;
    localCache: { current?: Promise<SessionState> };
  }) {
    const { runner, localCache: store } = runtime;
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
    const { runner, getSessionState: current } = value;
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

function throttle(op?: { duration: number } | number): StrategyType {
  const duration = (function computeDuration() {
    if (op == null) {
      return undefined;
    }
    return typeof op === 'number' ? op : op.duration;
  })();

  function hasChanged(cacheVariables: any[] | undefined, variables: any[]) {
    if (cacheVariables == null) {
      return true;
    }
    const equality = stringifyComparator(cacheVariables, variables);
    return !equality;
  }

  return function th(value) {
    const {
      getSessionState: current,
      runner,
      localCache: store,
      variables = []
    } = value;
    store.current = store.current || { timeoutId: null, variables: undefined };
    const storedVariables = store.current.variables;
    const { timeoutId } = store.current;
    if (
      !hasChanged(storedVariables, variables) &&
      (timeoutId != null || duration == null)
    ) {
      return new Promise(resolve => {
        resolve(current());
      });
    }
    store.current.variables = variables;
    if (duration == null) {
      return runner();
    }
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
  call: (
    previous: T | undefined,
    currentData: T,
    states: [SessionState<T>, SessionState<T>]
  ) => T | undefined
): StrategyType {
  return function reduceStrategy(requires): Promise<SessionState> {
    const { runner, getSessionState: current } = requires;
    return runner().then(d => {
      if (d.isError || d.abandon) {
        return d;
      }
      const state = current();
      const newData = call(state.data, d.data, [state, d]);
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
    const { runner, executeContext: runtimeCache, localCache: store } = value;
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

function failure(
  process: (e: unknown, sessionData: SessionState) => any,
  option?: { withAbandoned?: boolean }
): StrategyType {
  const { withAbandoned } = option || {};
  const next: StrategyType = function next(value) {
    const { runner, executeContext: runtimeCache, localCache: store } = value;
    return runner().then(d => {
      const isAllProcessed = runtimeCache.get(failure) as boolean | undefined;
      if (d.isError && !isAllProcessed && (!d.abandon || withAbandoned)) {
        try {
          process(d.error, d);
          runtimeCache.set(failure, true);
        } catch (e) {
          runtimeCache.set(failure, false);
        }
      }
      return d;
    });
  };
  return function er(value) {
    const {
      runner,
      executeContext: runtimeCache,
      localCache: store,
      config
    } = value;
    const { experience } = config;
    if (experience === 'next') {
      return next(value);
    }
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
    getSessionState: () => SessionState<T>;
    runner: () => Promise<SessionState<T>>;
    localCache: { current?: (data: T, sessionData: SessionState<T>) => any };
  }) {
    const { runner, localCache: store } = value;
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

function validate(
  callback: (
    variables: any[],
    isOnline: () => boolean
  ) => boolean | Promise<boolean>
): StrategyType {
  return function validStrategy({
    runner,
    getSessionState: current,
    variables
  }) {
    const currentSessionState = current();
    const result = callback(variables, () => current().online);
    if (!result) {
      return new Promise(resolve => {
        resolve({ ...currentSessionState, abandon: true });
      });
    }
    if (typeof result === 'object' && typeof result.then === 'function') {
      return result.then(
        r => {
          if (!r) {
            const state = current();
            return new Promise(resolve => {
              resolve({ ...state, abandon: true });
            });
          }
          return runner();
        },
        () => {
          const state = current();
          return new Promise(resolve => {
            resolve({ ...state, abandon: true });
          });
        }
      );
    }
    return runner();
  };
}

function response<T>(
  callback: (state: SessionState<T>) => void | (() => void)
): StrategyType {
  const sc: StrategyType = function sc(value) {
    const { runner } = value;
    return runner();
  };
  sc.effect = [
    function responseEffect(s: SessionState<T>, p: SessionState<T>) {
      const res = callback(s);
      if (typeof res === 'function') {
        return res;
      }
      return noop;
    },
    (s, p) => s.round !== 0 && s.round !== p.round
  ];
  return sc;
}

response.success = function responseSuccess<T>(
  process: (data: T, sessionData: SessionState<T>) => void | (() => void)
): StrategyType {
  const sc: StrategyType = function sc(value) {
    const { runner } = value;
    return runner();
  };
  sc.effect = [
    function effectCallback(
      state: SessionState<T>,
      prevState: SessionState<T>
    ) {
      if (
        state.round === 0 ||
        state.round === prevState.round ||
        !state.loaded
      ) {
        return noop;
      }
      if (state.isError || state.isFetching || !state.sessionLoaded) {
        return noop;
      }
      const res = process(state.data, state);
      if (typeof res === 'function') {
        return res;
      }
      return noop;
    },
    (state, prevState) => {
      if (
        state.round === 0 ||
        state.round === prevState.round ||
        !state.loaded
      ) {
        return false;
      }
      if (state.isError || state.isFetching || !state.sessionLoaded) {
        return false;
      }
      return true;
    }
  ];
  return sc;
};

response.error = function responseError<T>(
  process: (e: unknown, sessionData: SessionState) => void | (() => void)
): StrategyType {
  const sc: StrategyType = function sc(value) {
    const { runner, executeContext: runtimeCache } = value;
    runtimeCache.set(error, true);
    return runner();
  };
  sc.effect = [
    function effectCallback(
      state: SessionState<T>,
      prevState: SessionState<T>
    ) {
      if (state.round === 0 || state.round === prevState.round) {
        return noop;
      }
      if (!state.isError || state.isFetching) {
        return noop;
      }
      const res = process(state.error, state);
      if (typeof res === 'function') {
        return res;
      }
      return noop;
    },
    (state, prevState) => {
      if (state.round === 0 || state.round === prevState.round) {
        return false;
      }
      if (!state.isError || state.isFetching) {
        return false;
      }
      return true;
    }
  ];
  return sc;
};

response.failure = function responseFailure<T>(
  process: (e: unknown, sessionData: SessionState) => void | (() => void)
): StrategyType {
  const sc: StrategyType = function sc(value) {
    const { runner, executeContext: runtimeCache, config } = value;
    if (config.experience === 'next') {
      return runner();
    }
    runtimeCache.set(error, true);
    return runner();
  };
  sc.effect = [
    function effectCallback(state) {
      if (!state.isError || state.isFetching) {
        return noop;
      }
      const res = process(state.error, state);
      if (typeof res === 'function') {
        return res;
      }
      return noop;
    },
    (state, prevState) => {
      if (state.round === 0 || state.round === prevState.round) {
        return false;
      }
      if (!state.isError || state.isFetching) {
        return false;
      }
      return true;
    }
  ];
  return sc;
};

function now() {
  return new Date().getTime();
}

function cacheOperation<T>(
  cacheRecords: [string, { data: T; lastUpdateTime: number }][],
  size: number | undefined
) {
  const cacheLimit = size == null ? 1 : size;

  function getByKey(
    c: [string, { data: T; lastUpdateTime: number }][],
    k: string
  ): { data: T; lastUpdateTime: number } | undefined {
    const found = c.find(([ke]) => ke === k) || [undefined, undefined];
    const [, v] = found;
    return v;
  }
  return {
    get: (k: string) => {
      return getByKey(cacheRecords, k);
    },
    set(k: string, data: T): [string, { data: T; lastUpdateTime: number }][] {
      if (cacheLimit < 1) {
        return [];
      }
      const updater = { data, lastUpdateTime: now() };
      const target = getByKey(cacheRecords, k);
      if (target != null) {
        return cacheRecords.map(([ke, va]) => {
          if (k !== ke) {
            return [ke, va];
          }
          return [k, updater];
        });
      }
      const cacheData: [string, { data: T; lastUpdateTime: number }][] = [
        ...cacheRecords,
        [k, updater]
      ];
      return cacheData.length > cacheLimit
        ? cacheData.slice(cacheData.length - cacheLimit)
        : cacheData;
    }
  };
}

function cache(option?: {
  key?: (vars: any[]) => string;
  staleTime?: number;
  capacity?: number;
  static?: boolean;
}): StrategyType {
  function defaultKeyBy(vars: any[]) {
    return JSON.stringify(vars);
  }
  const {
    key: keyBy = defaultKeyBy,
    staleTime,
    capacity: cp = 1,
    static: isStatic
  } = option || {};
  return function cacheStrategy(requies) {
    const { getSessionState, runner, variables } = requies;
    const currentState = getSessionState();
    const { cache: cacheInState } = currentState;
    const variableKey = keyBy(variables);
    const cacheData = cacheOperation(cacheInState, cp).get(variableKey);
    if (
      cacheData &&
      ((staleTime && now() < staleTime + cacheData.lastUpdateTime) || isStatic)
    ) {
      const cacheState: SessionState = {
        ...currentState,
        data: cacheData.data,
        variables,
        visited: true
      };
      return Promise.resolve(cacheState);
    }
    return runner(c => {
      return cacheData && (!staleTime || staleTime < 0)
        ? { ...c, data: cacheData.data, visited: true }
        : { ...c, visited: false };
    }).then(next => {
      if (next.isError) {
        return {
          ...next,
          data: next.stale ? next.stale.data : next.data
        };
      }
      const nextKey = keyBy(next.variables || []);
      const { maxCacheCapacity } = getSessionState();
      const capacity = maxCacheCapacity < cp ? cp : maxCacheCapacity;
      const nextCache = cacheOperation(next.cache, capacity).set(
        nextKey,
        next.data
      );
      return { ...next, cache: nextCache, maxCacheCapacity: capacity };
    });
  };
}

export const Strategy = {
  cache,
  debounce,
  error,
  failure,
  memo,
  once,
  success,
  throttle,
  validate,
  reduce,
  response
};
