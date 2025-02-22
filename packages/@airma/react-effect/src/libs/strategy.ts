import { useEffect, useRef } from 'react';
import { SignalHandler } from '@airma/react-state';
import {
  QueryConfig,
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
  return function strategy(v) {
    const tempSessionSetters: ((s: SessionState) => SessionState)[] = [];
    const defaultStrategy: StrategyType = value =>
      value.runner(s => {
        return tempSessionSetters.reduce((r, c) => {
          if (r.abandon) {
            return r;
          }
          return c(r);
        }, s);
      });
    const storeSlots = v.localCache.current as { current: any }[];
    const callback = [...strategies]
      .reverse()
      .reduce((r: StrategyType, c: StrategyType | undefined | null, i) => {
        const storage = storeSlots[i] || { current: undefined };
        return function middle(value) {
          const nextValue = { ...value, localCache: storage };
          if (c == null) {
            return r(nextValue);
          }
          const nextRunner = (
            setSessionState?: (s: SessionState) => SessionState
          ) => {
            if (setSessionState != null) {
              tempSessionSetters.push(setSessionState);
            }
            return r(nextValue);
          };
          return c({ ...nextValue, runner: nextRunner });
        };
      }, defaultStrategy);
    return callback(v).then(d => {
      const { loaded, sessionLoaded } = v.getSessionState();
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

export function useStrategyExecution<T>(
  signal: SignalHandler<typeof effectModel>,
  sessionRunner: (
    triggerType: TriggerType,
    payload: unknown | undefined,
    variables: any[]
  ) => Promise<SessionState<T>>,
  config: QueryConfig<T, any>
) {
  const { strategy } = config;
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

  return [
    function callWithStrategy(
      triggerType: TriggerType,
      payload: unknown | undefined,
      variables?: any[]
    ) {
      const runtimeVariables = variables || [];
      const runner = function runner(
        setSessionState?: (s: SessionState<T>) => SessionState<T>
      ) {
        const { state: current, setState } = signal();
        const initialFetchingState = { ...current, isFetching: true };
        const fetchingState = setSessionState
          ? setSessionState(initialFetchingState)
          : initialFetchingState;
        if (!fetchingState.abandon) {
          setState({
            ...fetchingState,
            triggerType
          });
        }
        return sessionRunner(triggerType, payload, runtimeVariables);
      };
      const requires = {
        getSessionState: () => {
          const s = signal().state;
          const online = !signal.getConnection().isDestroyed();
          return { ...s, online };
        },
        variables: runtimeVariables,
        runner,
        triggerType,
        config,
        localCache: strategyStoreRef,
        executeContext: createRuntimeCache()
      };
      return composeStrategies(strategies)(requires).then(data => {
        if (data.abandon) {
          const currentState = signal().state;
          return { ...currentState, abandon: true };
        }
        signal().setState(data);
        return data;
      });
    },
    effects
  ] as const;
}

export function latest(): StrategyType {
  return function latestStrategy(requires): Promise<SessionState> {
    const { runner, localCache } = requires;
    localCache.current = localCache.current || 0;
    const version = localCache.current + 1;
    localCache.current = version;
    return runner().then(sessionData => {
      if (localCache.current !== version) {
        return { ...sessionData, abandon: true };
      }
      return sessionData;
    });
  };
}

export function block(): StrategyType {
  return function blockStrategy(requires): Promise<SessionState> {
    const { runner, localCache, triggerType } = requires;
    if (triggerType !== 'manual') {
      return runner();
    }
    if (localCache.current) {
      return localCache.current.then((sessionData: SessionState) => ({
        ...sessionData,
        abandon: true
      }));
    }
    const promise = runner();
    localCache.current = promise.then((sessionData: SessionState) => {
      localCache.current = undefined;
      return sessionData;
    });
    return promise;
  };
}
