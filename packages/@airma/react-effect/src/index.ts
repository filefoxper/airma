import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef
} from 'react';
import {
  factory,
  ModelProvider,
  useIsValidModel,
  useModel,
  useSelector,
  withModelProvider
} from '@airma/react-state';
import type {
  SessionState,
  PromiseCallback,
  QueryConfig,
  MutationConfig,
  StrategyType,
  PromiseData,
  GlobalConfigProviderProps,
  GlobalConfig,
  TriggerType,
  SessionKey
} from './type';
import { defaultPromiseResult, effectModel } from './model';

const defaultIsFetchingState: any[] = [];

const isFetchingModel = factory((fetchingKeys: any[]) => {
  return {
    isFetching: fetchingKeys.length > 0,
    startFetching(fetchingKey: any) {
      const isFetching = fetchingKeys.some(k => k === fetchingKey);
      if (isFetching) {
        return fetchingKeys;
      }
      return fetchingKeys.concat(fetchingKey);
    },
    endFetching(fetchingKey: any) {
      const isFetching = fetchingKeys.some(k => k === fetchingKey);
      if (!isFetching) {
        return fetchingKeys;
      }
      return fetchingKeys.filter(k => k !== fetchingKey);
    }
  };
}, defaultIsFetchingState);

const GlobalConfigContext = createContext<GlobalConfig | null>(null);

export function GlobalRefreshProvider({
  value,
  children
}: GlobalConfigProviderProps) {
  const isValid = useIsValidModel(isFetchingModel);
  return isValid
    ? createElement(
        GlobalConfigContext.Provider,
        { value: value || null },
        children
      )
    : createElement(
        ModelProvider,
        { value: isFetchingModel },
        createElement(
          GlobalConfigContext.Provider,
          { value: value || null },
          children
        )
      );
}

function useGlobalConfig(): GlobalConfig | null {
  return useContext(GlobalConfigContext);
}

function parseEffect<
  E extends (...p: any[]) => any,
  C extends Record<string, any> = Record<string, any>
>(callback: E | SessionKey<E>, config?: C): [SessionKey<E>, E, C?] {
  const { pipe } = callback as SessionKey<E>;
  const isModel = typeof pipe === 'function';
  if (!isModel) {
    return [effectModel as SessionKey<E>, callback as E, config];
  }
  const { effect } = callback as SessionKey<E>;
  const [effectCallback, cg] = effect;
  return [
    callback as SessionKey<E>,
    effectCallback,
    (cg || config) as C | undefined
  ];
}

function usePromiseCallback<T, C extends (vars?: any[]) => Promise<T>>(
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
  return function strategy(v) {
    const callback = [...st]
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

export function useQuery<T, C extends PromiseCallback<T>>(
  callback: C | SessionKey<C>,
  config: QueryConfig<T, C> | Parameters<C>
): [
  SessionState<T>,
  () => Promise<SessionState<T>>,
  (...variables: Parameters<C>) => Promise<SessionState<T>>
] {
  const cg = Array.isArray(config) ? { variables: config } : config;
  const [model, effectCallback, con] = parseEffect<C, QueryConfig<T, C>>(
    callback,
    cg
  );
  const {
    variables,
    deps,
    triggerOn = ['mount', 'update', 'manual'],
    manual: man,
    strategy,
    defaultData
  } = con || {};

  const hasDefaultData = Object.prototype.hasOwnProperty.call(
    con || {},
    'defaultData'
  );

  const params: [typeof model, SessionState<T>?] = (function computeParams() {
    if (model === effectModel) {
      return [
        model,
        defaultPromiseResult(
          hasDefaultData ? { data: defaultData, loaded: true } : undefined
        )
      ];
    }
    return hasDefaultData
      ? [model, defaultPromiseResult({ data: defaultData, loaded: true })]
      : [model];
  })();

  const instance = useModel(...(params as [typeof model, SessionState<T>]));
  const { startFetching, endFetching } = useModel(
    isFetchingModel,
    defaultIsFetchingState,
    { autoLink: true }
  );

  const scopeEffectConfig = useGlobalConfig() || {};
  const { strategy: strategyCallback } = scopeEffectConfig;
  const manual = !deps && !variables ? true : man;
  const triggerTypes: TriggerType[] = manual ? ['manual'] : triggerOn;
  const currentStrategies = toStrategies(strategy);
  const strategies = strategyCallback
    ? strategyCallback(currentStrategies, 'query')
    : currentStrategies;
  const runner = usePromiseCallback<T, (vars?: any[]) => Promise<T>>(vars =>
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
  ): Promise<SessionState<T>> {
    const version = versionRef.current + 1;
    versionRef.current = version;
    const { state: current, setState } = instance;
    setState({
      ...current,
      isFetching: true,
      fetchingKey: keyRef.current,
      triggerType
    });
    startFetching(keyRef.current);
    return runner(vars).then(data => {
      const abandon = version !== versionRef.current;
      return {
        ...instance.state,
        ...data,
        abandon,
        isFetching: false,
        fetchingKey: undefined,
        triggerType
      } as SessionState<T>;
    });
  };

  const callWithStrategy = function callWithStrategy(
    call: (
      triggerType: TriggerType,
      variables?: Parameters<C>
    ) => Promise<SessionState<T>>,
    triggerType: TriggerType,
    vars?: Parameters<C>
  ) {
    const requires = {
      current: () => instance.state,
      variables: vars || variables || [],
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
    const triggerType = isOnMount ? 'mount' : 'update';
    if (triggerTypes.indexOf(triggerType) < 0) {
      return;
    }
    callWithStrategy(caller, triggerType).then(data => {
      if (!data.abandon) {
        instance.setState(data);
        endFetching(keyRef.current);
      }
      return data;
    });
  };

  const query = function query(vars?: Parameters<C>) {
    const triggerType = 'manual';
    if (triggerTypes.indexOf(triggerType) < 0) {
      return new Promise<SessionState<T>>(resolve => {
        resolve({ ...instance.state, abandon: true } as SessionState<T>);
      });
    }
    return callWithStrategy(caller, triggerType, vars).then(data => {
      if (!data.abandon) {
        instance.setState(data);
      }
      return data;
    });
  };

  const execute = usePersistFn(() => query());

  const queryCallback = usePersistFn((...vars: Parameters<C>) => query(vars));

  const effectDeps = deps || variables || [];

  useLayoutEffect(() => {
    const isOnMount = mountRef.current;
    mountRef.current = false;
    const currentFetchingKey = instance.state.fetchingKey;
    if (currentFetchingKey && currentFetchingKey !== keyRef.current) {
      return;
    }
    effectQuery(isOnMount);
  }, [...effectDeps]);

  const triggerVersionRef = useRef(instance.version);
  useEffect(() => {
    if (triggerVersionRef.current === instance.version) {
      return;
    }
    triggerVersionRef.current = instance.version;
    query();
  }, [instance.version]);

  useEffect(
    () => () => {
      endFetching(keyRef.current);
    },
    []
  );

  return [instance.state, execute, queryCallback];
}

export function useMutation<T, C extends PromiseCallback<T>>(
  callback: C | SessionKey<C>,
  config: MutationConfig<T, C> | Parameters<C>
): [
  SessionState<T>,
  () => Promise<SessionState<T>>,
  (...variables: Parameters<C>) => Promise<SessionState<T>>
] {
  const cg = Array.isArray(config) ? { variables: config } : config;
  const [model, effectCallback, con] = parseEffect<C, MutationConfig<T, C>>(
    callback,
    cg
  );
  const {
    variables,
    strategy,
    defaultData,
    deps,
    triggerOn = ['manual']
  } = con || {};
  const triggerTypes = triggerOn;
  const hasDefaultData = Object.prototype.hasOwnProperty.call(
    con || {},
    'defaultData'
  );

  const params: [typeof model, SessionState<T>?] = (function computeParams() {
    if (model === effectModel) {
      return [
        model,
        defaultPromiseResult(
          hasDefaultData ? { data: defaultData, loaded: true } : undefined
        )
      ];
    }
    return hasDefaultData
      ? [model, defaultPromiseResult({ data: defaultData, loaded: true })]
      : [model];
  })();

  const instance = useModel(...(params as [typeof model, SessionState<T>]));
  const { startFetching, endFetching } = useModel(
    isFetchingModel,
    defaultIsFetchingState,
    { autoLink: true }
  );
  const scopeEffectConfig = useGlobalConfig() || {};
  const { strategy: strategyCallback } = scopeEffectConfig;
  const currentStrategies = toStrategies(strategy);
  const strategies = strategyCallback
    ? strategyCallback(currentStrategies, 'mutation')
    : currentStrategies;
  const runner = usePromiseCallback<T, (vars?: any[]) => Promise<T>>(
    (vars?: any[]) => effectCallback(...(vars || variables || []))
  );

  const strategyStoreRef = useRef<{ current: any }[]>(
    strategies.map(() => ({ current: undefined }))
  );

  const mountRef = useRef(true);
  const keyRef = useRef({});
  const savingRef = useRef(false);
  const caller = function caller(
    vars?: Parameters<C>
  ): Promise<SessionState<T>> {
    if (savingRef.current) {
      return new Promise<SessionState<T>>(resolve => {
        resolve({ ...instance.state, abandon: true, triggerType: 'manual' });
      });
    }
    savingRef.current = true;
    const { state: current, setState } = instance;
    startFetching(keyRef.current);
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
      } as SessionState<T>;
    });
  };

  const callWithStrategy = function callWithStrategy(
    call: (vars?: Parameters<C>) => Promise<SessionState<T>>,
    triggerType: TriggerType,
    vars?: Parameters<C>
  ) {
    const requires = {
      current: () => instance.state,
      variables: vars || variables || [],
      runner: () => call(vars),
      store: strategyStoreRef
    };
    return buildStrategy(strategyStoreRef.current, strategies)(requires);
  };

  const effectQuery = function effectQuery(isOnMount: boolean) {
    const currentFetchingKey = instance.state.fetchingKey;
    if (currentFetchingKey && currentFetchingKey !== keyRef.current) {
      return;
    }
    const triggerType = isOnMount ? 'mount' : 'update';
    if (triggerTypes.indexOf(triggerType) < 0) {
      return;
    }
    callWithStrategy(caller, triggerType).then(data => {
      if (!data.abandon) {
        instance.setState(data);
        endFetching(keyRef.current);
      }
      return data;
    });
  };

  const mutate = function mutate(vars?: Parameters<C>) {
    const triggerType = 'manual';
    if (triggerTypes.indexOf(triggerType) < 0) {
      return new Promise<SessionState<T>>(resolve => {
        resolve({ ...instance.state, abandon: true });
      });
    }
    return callWithStrategy(caller, triggerType, vars).then(data => {
      if (!data.abandon) {
        instance.setState(data);
      }
      return data;
    });
  };

  const execute = usePersistFn(() => mutate());

  const mutateCallback = usePersistFn((...vars: Parameters<C>) => mutate(vars));

  const triggerVersionRef = useRef(instance.version);

  const effectDeps = deps || variables || [];

  useLayoutEffect(() => {
    const isOnMount = mountRef.current;
    mountRef.current = false;
    const currentFetchingKey = instance.state.fetchingKey;
    if (currentFetchingKey && currentFetchingKey !== keyRef.current) {
      return;
    }
    effectQuery(isOnMount);
  }, [...effectDeps]);

  useEffect(() => {
    if (triggerVersionRef.current === instance.version) {
      return;
    }
    triggerVersionRef.current = instance.version;
    mutate();
  }, [instance.version]);

  useEffect(
    () => () => {
      endFetching(keyRef.current);
    },
    []
  );

  return [instance.state, execute, mutateCallback];
}

export function useSession<T, C extends PromiseCallback<T>>(
  sessionKey: SessionKey<C>
): [SessionState<T>, () => void] {
  return useSelector(
    sessionKey,
    s => [s.state, s.trigger] as [SessionState<T>, () => void]
  );
}

export function useIsFetching(...sessionStates: SessionState[]): boolean {
  const isLocalFetching = useMemo(() => {
    return sessionStates.some(d => d.isFetching);
  }, sessionStates);
  const valid = useIsValidModel(isFetchingModel);
  // const { isFetching: isGlobalFetching } = useModel(
  //   isFetchingModel,
  //   defaultIsFetchingState,
  //   { autoLink: true }
  // );
  const isGlobalFetching = useSelector(isFetchingModel, s => s.isFetching);
  if (valid && !sessionStates.length) {
    return isGlobalFetching;
  }
  return isLocalFetching;
}

export const SessionProvider = ModelProvider;

export const withSessionProvider = withModelProvider;

export { createSessionKey } from './model';

export { Strategy } from './strategy';
