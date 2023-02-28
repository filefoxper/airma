import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef
} from 'react';
import {
  ModelProvider,
  useModel,
  useSelector,
  withModelProvider
} from '@airma/react-state';
import {
  PromiseResult,
  PromiseEffectCallback,
  QueryConfig,
  MutationConfig,
  ModelPromiseEffectCallback,
  StrategyType,
  PromiseData,
  EffectConfigProviderProps,
  EffectConfig,
  TriggerType
} from './type';
import { defaultPromiseResult, effectModel } from './model';

const EffectConfigContext = createContext<EffectConfig | null>(null);

export function ClientConfigProvider({
  value,
  children
}: EffectConfigProviderProps) {
  return createElement(EffectConfigContext.Provider, { value }, children);
}

export const EffectConfigProvider = ClientConfigProvider;

function useEffectConfig(): EffectConfig | null {
  return useContext(EffectConfigContext);
}

function parseEffect<
  E extends (...p: any[]) => any,
  C extends Record<string, any> = Record<string, any>
>(
  callback: E | ModelPromiseEffectCallback<E>,
  config?: C
): [ModelPromiseEffectCallback<E>, E, C?] {
  const { pipe } = callback as ModelPromiseEffectCallback<E>;
  const isModel = typeof pipe === 'function';
  if (!isModel) {
    return [
      effectModel as ModelPromiseEffectCallback<E>,
      callback as E,
      config
    ];
  }
  const { effect } = callback as ModelPromiseEffectCallback<E>;
  const [effectCallback, cg] = effect;
  return [
    callback as ModelPromiseEffectCallback<E>,
    effectCallback,
    (cg || config) as C | undefined
  ];
}

function usePromise<T, C extends (vars?: any[]) => Promise<T>>(
  callback: C
): (vars?: any[]) => Promise<PromiseData<T>> {
  return (vars): Promise<PromiseData<T>> => {
    const result = callback(vars);
    if (!result || typeof result.then !== 'function') {
      throw new Error('The callback have to return a promise object.');
    }
    return result.then(
      d => {
        return {
          data: d,
          error: undefined,
          isError: false
        };
      },
      e => {
        return {
          error: e,
          isError: true
        };
      }
    );
  };
}

function buildStrategy(
  store: { current: any }[],
  st: (StrategyType | undefined | null)[]
): StrategyType {
  const defaultStrategy: StrategyType = value => value.runner();
  return [...st]
    .reverse()
    .reduce((r: StrategyType, c: StrategyType | undefined | null, i) => {
      const storage = store[i] || { current: undefined };
      return function middle(value) {
        if (c == null) {
          return r(value);
        }
        const nextRunner = () => r(value);
        return c({ ...value, store: storage, runner: nextRunner });
      };
    }, defaultStrategy);
}

function toStrategies(
  strategy:
    | undefined
    | null
    | StrategyType
    | (StrategyType | null | undefined)[]
): (StrategyType | null | undefined)[] {
  return Array.isArray(strategy) ? strategy : [strategy];
}

function usePersistFn<T extends (...args: any[]) => any>(callback: T): T {
  const dispatchRef = useRef<T>(callback);
  dispatchRef.current = callback;
  const persistRef = useRef((...args: any[]): any =>
    dispatchRef.current(...args)
  );
  return persistRef.current as T;
}

export function useQuery<T, C extends PromiseEffectCallback<T>>(
  callback: C | ModelPromiseEffectCallback<C>,
  config?: QueryConfig<T, C> | Parameters<C>
): [
  PromiseResult<T>,
  () => Promise<PromiseResult<T>>,
  (...variables: Parameters<C>) => Promise<PromiseResult<T>>
] {
  const cg = Array.isArray(config) ? { variables: config } : config;
  const [model, effectCallback, con] = parseEffect<C, QueryConfig<T, C>>(
    callback,
    cg
  );
  const params: [typeof model, PromiseResult<T>?] =
    model === effectModel ? [model, defaultPromiseResult()] : [model];
  const instance = useModel(...(params as [typeof model, PromiseResult<T>]));
  const { variables, deps, manual: man, strategy, exact } = con || {};
  const scopeEffectConfig = useEffectConfig() || {};
  const { strategy: strategyCallback } = exact
    ? { strategy: undefined }
    : scopeEffectConfig;
  const manual = !deps && !variables ? true : man;
  const currentStrategies = toStrategies(strategy);
  const strategies = strategyCallback
    ? strategyCallback(currentStrategies, 'query')
    : currentStrategies;
  const runner = usePromise<T, (vars?: any[]) => Promise<T>>(vars =>
    effectCallback(...(vars || variables || []))
  );
  const mountRef = useRef(true);
  const keyRef = useRef({});
  const strategyStoreRef = useRef<{ current: any }[]>(
    strategies.map(() => ({ current: undefined }))
  );

  const versionRef = useRef(0);
  const caller = function caller(
    triggerType: TriggerType,
    vars?: Parameters<C>
  ): Promise<PromiseResult<T>> {
    const version = versionRef.current + 1;
    versionRef.current = version;
    const { state: current, setState } = instance;
    setState({
      ...current,
      isFetching: true,
      fetchingKey: keyRef.current,
      triggerType
    });
    return runner(vars).then(data => {
      const abandon = version !== versionRef.current;
      return {
        ...instance.state,
        ...data,
        abandon,
        isFetching: false,
        fetchingKey: undefined,
        triggerType
      };
    });
  };

  const callWithStrategy = function callWithStrategy(
    call: (
      triggerType: TriggerType,
      variables?: Parameters<C>
    ) => Promise<PromiseResult<T>>,
    triggerType: TriggerType,
    vars?: Parameters<C>
  ) {
    const requires = {
      current: () => instance.state,
      variables: vars || variables,
      runner: () => call(triggerType, vars),
      store: strategyStoreRef
    };
    return buildStrategy(strategyStoreRef.current, strategies)(requires);
  };

  const effectQuery = function effectQuery(isOnMount: boolean) {
    const currentFetchingKey = instance.state.fetchingKey;
    if (currentFetchingKey && currentFetchingKey !== keyRef.current) {
      return;
    }
    callWithStrategy(caller, isOnMount ? 'mount' : 'update').then(data => {
      if (!data.abandon) {
        instance.setState(data);
      }
      return data;
    });
  };

  const query = function query(vars?: Parameters<C>) {
    return callWithStrategy(caller, 'manual', vars).then(data => {
      if (!data.abandon) {
        instance.setState(data);
      }
      return data;
    });
  };

  const execute = usePersistFn(() => query());

  const queryCallback = usePersistFn((...vars: Parameters<C>) => query(vars));

  useLayoutEffect(() => {
    const isOnMount = mountRef.current;
    mountRef.current = false;
    if (manual) {
      return;
    }
    const currentFetchingKey = instance.state.fetchingKey;
    if (currentFetchingKey && currentFetchingKey !== keyRef.current) {
      return;
    }
    effectQuery(isOnMount);
  }, deps || variables || []);

  const triggerVersionRef = useRef(instance.version);
  useEffect(() => {
    if (triggerVersionRef.current === instance.version) {
      return;
    }
    triggerVersionRef.current = instance.version;
    query();
  }, [instance.version]);

  return [instance.state, execute, queryCallback];
}

export function useMutation<T, C extends PromiseEffectCallback<T>>(
  callback: C | ModelPromiseEffectCallback<C>,
  config?: MutationConfig<T, C> | Parameters<C>
): [
  PromiseResult<T>,
  () => Promise<PromiseResult<T>>,
  (...variables: Parameters<C>) => Promise<PromiseResult<T>>
] {
  const cg = Array.isArray(config) ? { variables: config } : config;
  const [model, effectCallback, con] = parseEffect<C, MutationConfig<T, C>>(
    callback,
    cg
  );
  const params: [typeof model, PromiseResult<T>?] =
    model === effectModel ? [model, defaultPromiseResult()] : [model];
  const instance = useModel(...(params as [typeof model, PromiseResult<T>]));
  const { variables, strategy, exact } = con || {};
  const scopeEffectConfig = useEffectConfig() || {};
  const { strategy: strategyCallback } = exact
    ? { strategy: undefined }
    : scopeEffectConfig;
  const currentStrategies = toStrategies(strategy);
  const strategies = strategyCallback
    ? strategyCallback(currentStrategies, 'mutation')
    : currentStrategies;
  const runner = usePromise<T, (vars?: any[]) => Promise<T>>((vars?: any[]) =>
    effectCallback(...(vars || variables || []))
  );

  const strategyStoreRef = useRef<{ current: any }[]>(
    strategies.map(() => ({ current: undefined }))
  );

  const keyRef = useRef({});
  const savingRef = useRef(false);
  const caller = function caller(
    vars?: Parameters<C>
  ): Promise<PromiseResult<T>> {
    if (savingRef.current) {
      return new Promise<PromiseResult<T>>(resolve => {
        resolve({ ...instance.state, abandon: true, triggerType: 'manual' });
      });
    }
    savingRef.current = true;
    const { state: current, setState } = instance;
    setState({
      ...current,
      isFetching: true,
      fetchingKey: keyRef.current,
      triggerType: 'manual'
    });
    return runner(vars).then(data => {
      savingRef.current = false;
      return {
        ...instance.state,
        ...data,
        isFetching: false,
        fetchingKey: undefined,
        triggerType: 'manual'
      };
    });
  };

  const callWithStrategy = function callWithStrategy(
    call: (vars?: Parameters<C>) => Promise<PromiseResult<T>>,
    vars?: Parameters<C>
  ) {
    const requires = {
      current: () => instance.state,
      variables: vars || variables,
      runner: () => call(vars),
      store: strategyStoreRef
    };
    return buildStrategy(strategyStoreRef.current, strategies)(requires);
  };

  const mutate = function mutate(vars?: Parameters<C>) {
    return callWithStrategy(caller, vars).then(data => {
      if (!data.abandon) {
        instance.setState(data);
      }
      return data;
    });
  };

  const execute = usePersistFn(() => mutate());

  const mutateCallback = usePersistFn((...vars: Parameters<C>) => mutate(vars));

  const triggerVersionRef = useRef(instance.version);
  useEffect(() => {
    if (triggerVersionRef.current === instance.version) {
      return;
    }
    triggerVersionRef.current = instance.version;
    mutate();
  }, [instance.version]);

  return [instance.state, execute, mutateCallback];
}

export function useClient<T, C extends PromiseEffectCallback<T>>(
  factory: ModelPromiseEffectCallback<C>
): [PromiseResult<T>, () => void] {
  return useSelector(
    factory,
    s => [s.state, s.trigger] as [PromiseResult<T>, () => void]
  );
}

export const useAsyncEffect = useClient;

export const EffectProvider = ModelProvider;

export const ClientProvider = ModelProvider;

export const withEffectProvider = withModelProvider;

export const withClientProvider = withModelProvider;

export { asyncEffect, client } from './model';

export { Strategy } from './strategy';
