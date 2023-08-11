import { useRef } from 'react';
import {
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

export function useStrategyExecution<T>(
  instance: ReturnType<typeof effectModel>,
  sessionRunner: (
    triggerType: TriggerType,
    variables: any[]
  ) => Promise<SessionState<T>>,
  strategy: StrategyCollectionType<T>
) {
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
    function callWithStrategy(triggerType: TriggerType, variables?: any[]) {
      const runtimeVariables = variables || [];
      const requires = {
        current: () => instance.state,
        variables: runtimeVariables,
        runner: () => {
          const { state: current, setState } = instance;
          setState({
            ...current,
            isFetching: true,
            triggerType
          });
          return sessionRunner(triggerType, runtimeVariables);
        },
        store: strategyStoreRef,
        runtimeCache: createRuntimeCache()
      };
      return composeStrategies(strategies)(requires).then(data => {
        if (!data.abandon) {
          instance.setState(data);
        }
        return data;
      });
    },
    effects
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
