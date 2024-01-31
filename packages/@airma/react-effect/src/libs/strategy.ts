import { useRef } from 'react';
import {
  QueryConfig,
  SessionConfig,
  SessionState,
  StrategyCollectionType,
  StrategyEffect,
  StrategyType,
  TriggerType
} from './type';
import { effectModel } from './model';

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
      const { loaded, sessionLoaded } = v.current();
      const { abandon, isError, isFetching } = d;
      const currentLoaded = loaded || (!abandon && !isError && !isFetching);
      const currentIsSessionLoaded =
        sessionLoaded || (!abandon && !isError && !isFetching);
      return {
        ...d,
        loaded: currentLoaded,
        sessionLoaded: currentIsSessionLoaded
      };
    });
  };
}

export function toStrategies(
  strategy: StrategyCollectionType
): (StrategyType | null | undefined)[] {
  return Array.isArray(strategy) ? strategy : [strategy];
}

function createRuntimeCache() {
  const runtimeCacheStore: Array<[any, any]> = [];
  const fetchTuple = (key: any) => {
    const data = runtimeCacheStore.find(([k]) => k === key);
    if (!Array.isArray(data)) {
      return undefined;
    }
    return data;
  };
  return {
    set(key: any, value: any) {
      const data = fetchTuple(key);
      if (data) {
        data[1] = value;
        return;
      }
      runtimeCacheStore.push([key, value]);
    },
    get(key: any) {
      const tuple = fetchTuple(key);
      if (!tuple) {
        return undefined;
      }
      return tuple[1];
    }
  };
}

function cacheOperation<T>(
  cache: [string, { data: T; lastUpdateTime: number }][],
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
      if (cacheLimit < 1) {
        return undefined;
      }
      return getByKey(cache, k);
    },
    set(k: string, data: T): [string, { data: T; lastUpdateTime: number }][] {
      if (cacheLimit < 1) {
        return [];
      }
      const updater = { data, lastUpdateTime: now() };
      const target = getByKey(cache, k);
      if (target != null) {
        return cache.map(([ke, va]) => {
          if (k !== ke) {
            return [ke, va];
          }
          return [k, updater];
        });
      }
      const cacheData: [string, { data: T; lastUpdateTime: number }][] = [
        ...cache,
        [k, updater]
      ];
      return cacheData.length > cacheLimit
        ? cacheData.slice(cacheData.length - cacheLimit)
        : cacheData;
    }
  };
}

function now() {
  return new Date().getTime();
}

export function useStrategyExecution<T>(
  instance: ReturnType<typeof effectModel>,
  sessionRunner: ((
    triggerType: TriggerType,
    variables: any[]
  ) => Promise<SessionState<T>>) & { sessionConfig?: SessionConfig },
  config: QueryConfig<T, any>
) {
  const { strategy } = config;
  const { sessionConfig } = sessionRunner;
  const { cache: cacheBy } = sessionConfig || {};
  const strategies = toStrategies(strategy);
  const strategyStoreRef = useRef<{ current: any }[]>(
    strategies.map(() => ({ current: undefined }))
  );

  const effects = strategies
    .map(s => {
      if (!s) {
        return undefined;
      }
      return s.effect;
    })
    .filter((e): e is StrategyEffect<any> => !!e);

  const responses = strategies
    .map(s => {
      if (!s) {
        return undefined;
      }
      return s.response;
    })
    .filter((e): e is StrategyEffect<any> => !!e);

  const cacheOption = (function recomputeCache() {
    const defaultKeyBy = (v: any[]) => JSON.stringify(v);
    if (cacheBy == null) {
      return undefined;
    }
    if (cacheBy === 'default') {
      return {
        key: defaultKeyBy
      };
    }
    if (typeof cacheBy === 'function') {
      return {
        key: cacheBy
      };
    }
    const { key, staleTime, capacity } = cacheBy;
    return {
      key: key == null || key === 'default' ? defaultKeyBy : key,
      staleTime,
      capacity
    };
  })();

  return [
    function callWithStrategy(triggerType: TriggerType, variables?: any[]) {
      const runtimeVariables = variables || [];
      const runner = function runner() {
        const { state: current, setState } = instance;
        if (!cacheOption) {
          setState({
            ...current,
            isFetching: true,
            triggerType
          });
          return sessionRunner(triggerType, runtimeVariables);
        }
        const { cache } = current;
        const { key, staleTime, capacity } = cacheOption;
        const variableKey = key(runtimeVariables || []);
        const cacheData = cacheOperation(cache, capacity).get(variableKey);
        if (
          cacheData &&
          staleTime &&
          now() > staleTime + cacheData.lastUpdateTime
        ) {
          return Promise.resolve({
            ...current,
            data: cacheData.data,
            isFetching: false
          });
        }
        setState(
          cacheData
            ? {
                ...current,
                isFetching: true,
                data: cacheData.data,
                triggerType
              }
            : {
                ...current,
                isFetching: true,
                triggerType
              }
        );
        return sessionRunner(triggerType, runtimeVariables);
      };
      const requires = {
        current: () => instance.state,
        variables: runtimeVariables,
        runner,
        store: strategyStoreRef,
        runtimeCache: createRuntimeCache()
      };
      return composeStrategies(strategies)(requires).then(data => {
        const { state: currentSessionState } = instance;
        if (data.abandon) {
          return data;
        }
        if (
          !cacheOption ||
          (cacheOption.capacity != null && cacheOption.capacity < 1)
        ) {
          instance.setState(data);
          return data;
        }
        const { key: keyBy, capacity } = cacheOption;
        const recordKey = keyBy(data.variables || []);
        const newCache = cacheOperation(
          currentSessionState.cache,
          capacity
        ).set(recordKey, data.data);
        const result = { ...data, cache: newCache } as SessionState<T>;
        instance.setState(result);
        return result;
      });
    },
    effects,
    responses
  ] as const;
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
