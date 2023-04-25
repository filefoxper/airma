import { useEffect, useMemo, useRef } from 'react';
import {
  StoreProvider,
  useIsModelMatchedInStore,
  useModel,
  useRealtimeInstance,
  useSelector,
  provide as provideKeys
} from '@airma/react-state';
import { useMount, usePersistFn, useUpdate } from '@airma/react-hooks';
import type {
  SessionState,
  PromiseCallback,
  QueryConfig,
  MutationConfig,
  StrategyType,
  PromiseData,
  TriggerType,
  SessionKey,
  SessionType
} from './type';
import { defaultPromiseResult, effectModel } from './model';
import {
  defaultIsFetchingState,
  globalControllerKey,
  useGlobalConfig
} from './global';
import { block, composeStrategies, latest } from './strategy';

function parseEffect<
  E extends (...p: any[]) => any,
  C extends Record<string, any> = Record<string, any>
>(
  callback: E | SessionKey<E>,
  sessionType: SessionType,
  config?: C
): [SessionKey<E>, E, C | undefined, boolean] {
  const { pipe } = callback as SessionKey<E>;
  const isSessionKey = typeof pipe === 'function';
  if (!isSessionKey) {
    return [effectModel as SessionKey<E>, callback as E, config, false];
  }
  const { effect } = callback as SessionKey<E>;
  const [effectCallback, { sessionType: keyType }] = effect;
  if (keyType != null && keyType !== sessionType) {
    throw new Error(
      `The sessionType is not matched, can not use '${keyType} type' sessionKey with '${
        sessionType === 'query' ? 'useQuery' : 'useMutation'
      }'`
    );
  }
  return [callback as SessionKey<E>, effectCallback, config, true];
}

function toNoRejectionPromiseCallback<
  T,
  C extends (variables: any[]) => Promise<T>
>(callback: C): (variables: any[]) => Promise<PromiseData<T>> {
  return function noRejectionPromiseCallback(
    variables: any[]
  ): Promise<PromiseData<T>> {
    const result = callback(variables);
    if (!result || typeof result.then !== 'function') {
      throw new Error('The callback have to return a promise object.');
    }
    return result.then(
      d => {
        return {
          data: d,
          variables,
          error: undefined,
          isError: false
        };
      },
      e => {
        return {
          variables,
          error: e,
          isError: true
        };
      }
    );
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

function useSessionBuildModel<T, C extends PromiseCallback<T>>(
  callback: C | SessionKey<C>,
  config?: QueryConfig<T, C> | Parameters<C>
): [ReturnType<typeof effectModel>, QueryConfig<T, C>, C] {
  const cg = Array.isArray(config) ? { variables: config } : config;
  const [model, effectCallback, con, isSessionKey] = parseEffect<
    C,
    QueryConfig<T, C>
  >(callback, 'query', cg);
  const hasDefaultData = Object.prototype.hasOwnProperty.call(
    con || {},
    'defaultData'
  );
  const configuration = con || {};
  const { defaultData } = configuration;
  const modelParams: [typeof model, SessionState<T>?] =
    (function computeParams() {
      if (!isSessionKey) {
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
  const stableInstance = useModel(
    ...(modelParams as [typeof model, SessionState<T>])
  );
  return [stableInstance, configuration, effectCallback];
}

function usePromiseCallbackEffect<T, C extends PromiseCallback<T>>(
  callback: C | SessionKey<C>,
  config?: QueryConfig<T, C> | Parameters<C>
): [
  SessionState<T>,
  () => Promise<SessionState<T>>,
  (...variables: Parameters<C>) => Promise<SessionState<T>>
] {
  const [stableInstance, con, promiseCallback] = useSessionBuildModel(
    callback,
    config
  );
  const {
    variables,
    deps,
    triggerOn: triggerTypes = ['mount', 'update', 'manual'],
    strategy
  } = con;

  const instance = useRealtimeInstance(stableInstance);
  const strategies = toStrategies(strategy);
  const strategyStoreRef = useRef<{ current: any }[]>(
    strategies.map(() => ({ current: undefined }))
  );
  const { setGlobalFetchingKey, removeGlobalFetchingKey } = useModel(
    globalControllerKey,
    defaultIsFetchingState,
    { autoLink: true }
  );
  const noRejectionPromiseCallback = toNoRejectionPromiseCallback(
    (params: any[]) => promiseCallback(...params)
  );
  const keyRef = useRef({});

  function sessionRunner(
    triggerType: TriggerType,
    vars: any[]
  ): Promise<SessionState<T>> {
    const { state: current, setState } = instance;
    setState({
      ...current,
      isFetching: true,
      triggerType
    });
    setGlobalFetchingKey(keyRef.current);
    return noRejectionPromiseCallback(vars).then(data => {
      const abandon =
        instance.state.finalFetchingKey != null &&
        keyRef.current !== instance.state.finalFetchingKey;
      return {
        ...instance.state,
        ...data,
        abandon,
        isFetching: false,
        triggerType
      } as SessionState<T>;
    });
  }

  const callWithStrategy = function callWithStrategy(
    call: (
      triggerType: TriggerType,
      variables: any[]
    ) => Promise<SessionState<T>>,
    triggerType: TriggerType,
    runtimeVariables: any[]
  ) {
    const requires = {
      current: () => instance.state,
      variables: runtimeVariables,
      runner: () => call(triggerType, runtimeVariables),
      store: strategyStoreRef,
      runtimeCache: createRuntimeCache()
    };
    return composeStrategies(strategies)(requires);
  };

  const sessionExecution = function sessionExecution(
    triggerType: 'manual' | 'mount' | 'update',
    vars?: any[]
  ) {
    const currentFetchingKey = instance.state.fetchingKey;
    if (triggerTypes.indexOf(triggerType) < 0) {
      return new Promise<SessionState<T>>(resolve => {
        resolve({ ...instance.state, abandon: true } as SessionState<T>);
      });
    }
    if (
      triggerType !== 'manual' &&
      currentFetchingKey &&
      currentFetchingKey !== keyRef.current
    ) {
      return new Promise<SessionState<T>>(resolve => {
        resolve({ ...instance.state, abandon: true } as SessionState<T>);
      });
    }
    instance.setFetchingKey(keyRef.current);
    return callWithStrategy(
      sessionRunner,
      triggerType,
      vars || variables || []
    ).then(data => {
      if (!data.abandon) {
        instance.setState(data);
        removeGlobalFetchingKey(keyRef.current);
      }
      return data;
    });
  };

  const trigger = usePersistFn(() => sessionExecution('manual'));

  const execute = usePersistFn((...vars: Parameters<C>) =>
    sessionExecution('manual', vars)
  );

  const effectDeps = deps || variables || [];

  useMount(() => {
    sessionExecution('mount');
  });

  useUpdate(() => {
    sessionExecution('update');
  }, effectDeps);

  useUpdate(() => {
    if (stableInstance.state.fetchingKey !== keyRef.current) {
      return;
    }
    instance.setFetchingKey(undefined);
  }, [stableInstance.state.fetchingKey]);

  const triggerVersionRef = useRef(instance.version);
  useEffect(() => {
    if (triggerVersionRef.current === stableInstance.version) {
      return;
    }
    triggerVersionRef.current = stableInstance.version;
    const currentFetchingKey = instance.state.fetchingKey;
    if (currentFetchingKey && currentFetchingKey !== keyRef.current) {
      return;
    }
    trigger();
  }, [stableInstance.version]);

  useEffect(
    () => () => {
      removeGlobalFetchingKey(keyRef.current);
      if (instance.state.fetchingKey !== keyRef.current) {
        return;
      }
      instance.setFetchingKey(undefined);
    },
    []
  );

  return [stableInstance.state, trigger, execute];
}

export function useQuery<T, C extends PromiseCallback<T>>(
  callback: C | SessionKey<C>,
  config?: QueryConfig<T, C> | Parameters<C>
): [
  SessionState<T>,
  () => Promise<SessionState<T>>,
  (...variables: Parameters<C>) => Promise<SessionState<T>>
] {
  const [, con] = useSessionBuildModel(callback, config);
  const {
    variables,
    deps,
    manual: man,
    triggerOn = ['mount', 'update', 'manual'],
    strategy
  } = con;

  const manual = !deps && !variables ? true : man;
  const triggerTypes: TriggerType[] = manual ? ['manual'] : triggerOn;
  const scopeEffectConfig = useGlobalConfig() || {};
  const { strategy: strategyCallback } = scopeEffectConfig;
  const currentStrategies = toStrategies(strategy);
  const strategies = strategyCallback
    ? strategyCallback(currentStrategies, 'query')
    : currentStrategies;

  const promiseConfig = {
    ...con,
    triggerOn: triggerTypes,
    strategy: ([latest()] as (StrategyType | null | undefined)[]).concat(
      strategies
    )
  };

  return usePromiseCallbackEffect<T, C>(callback, promiseConfig);
}

export function useMutation<T, C extends PromiseCallback<T>>(
  callback: C | SessionKey<C>,
  config?: MutationConfig<T, C> | Parameters<C>
): [
  SessionState<T>,
  () => Promise<SessionState<T>>,
  (...variables: Parameters<C>) => Promise<SessionState<T>>
] {
  const [, con] = useSessionBuildModel(callback, config);
  const { triggerOn: triggerTypes = ['manual'], strategy } = con;

  const scopeEffectConfig = useGlobalConfig() || {};
  const { strategy: strategyCallback } = scopeEffectConfig;
  const currentStrategies = toStrategies(strategy);
  const strategies = strategyCallback
    ? strategyCallback(currentStrategies, 'mutation')
    : currentStrategies;

  const promiseConfig = {
    ...con,
    triggerOn: triggerTypes,
    strategy: ([block()] as (StrategyType | null | undefined)[]).concat(
      strategies
    )
  };

  return usePromiseCallbackEffect<T, C>(callback, promiseConfig);
}

export function useSession<T, C extends PromiseCallback<T>>(
  sessionKey: SessionKey<C>,
  config?: { loaded?: boolean; sessionType?: SessionType } | SessionType
): [SessionState<T>, () => void] {
  const [, padding] = sessionKey.effect;
  const { sessionType: sessionKeyType } = padding;
  const session = useSelector(
    sessionKey,
    s => [s.state, s.trigger] as [SessionState<T>, () => void]
  );
  const { loaded: shouldLoaded, sessionType } =
    typeof config === 'string'
      ? { sessionType: config, loaded: undefined }
      : config || {};
  const [{ loaded }] = session;
  if (sessionType && sessionKeyType && sessionType !== sessionKeyType) {
    throw new Error(
      `The sessionType is not matched, can not use '${sessionKeyType} type' sessionKey with '${sessionType} type' useSession.`
    );
  }
  if (shouldLoaded && !loaded) {
    throw new Error(
      'The session is not loaded yet, check config, and set {loaded: undefined}.'
    );
  }
  return session;
}

export function useIsFetching(...sessionStates: SessionState[]): boolean {
  const isLocalFetching = useMemo(() => {
    return sessionStates.some(d => d.isFetching);
  }, sessionStates);
  const isMatchedInStore = useIsModelMatchedInStore(globalControllerKey);
  const { isFetching: isGlobalFetching } = useModel(
    globalControllerKey,
    defaultIsFetchingState,
    { autoLink: true }
  );
  if (!isMatchedInStore && !sessionStates.length) {
    throw new Error(
      'You should provide a `GlobalRefreshProvider` to support a global `isFetching` detect.'
    );
  }
  if (isMatchedInStore && !sessionStates.length) {
    return isGlobalFetching;
  }
  return isLocalFetching;
}

export const SessionProvider = StoreProvider;

export const withSessionProvider = provideKeys;

export const provide = provideKeys;

export { createSessionKey } from './model';

export { Strategy } from './strategy';

export { GlobalSessionProvider } from './global';
