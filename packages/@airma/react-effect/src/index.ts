import {
  createElement,
  lazy,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  StoreProvider,
  useIsModelMatchedInStore,
  useModel,
  useRealtimeInstance,
  useSelector,
  provide as provideKeys
} from '@airma/react-state';
import {
  useMount,
  usePersistFn,
  useUnmount,
  useUpdate
} from '@airma/react-hooks-core';
import type {
  SessionState,
  PromiseCallback,
  QueryConfig,
  MutationConfig,
  StrategyType,
  PromiseData,
  TriggerType,
  SessionKey,
  SessionType,
  AbstractSessionState,
  AbstractSessionResult,
  PromiseHolder,
  CheckLazyComponentSupportType,
  LazyComponentSupportType,
  SessionResult
} from './libs/type';
import { parseConfig, useSessionBuildModel } from './libs/model';
import {
  defaultIsFetchingState,
  globalControllerKey,
  useGlobalConfig
} from './libs/global';
import {
  block,
  latest,
  toStrategies,
  useStrategyExecution
} from './libs/strategy';

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

  const { setGlobalFetchingKey, removeGlobalFetchingKey } = useModel(
    globalControllerKey,
    defaultIsFetchingState,
    { autoLink: true }
  );

  const keyRef = useRef({});

  function sessionRunner(
    triggerType: TriggerType,
    vars: any[]
  ): Promise<SessionState<T>> {
    const noRejectionPromiseCallback = toNoRejectionPromiseCallback(
      (params: any[]) => promiseCallback(...params)
    );
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

  const [strategyExecution, strategyEffects] = useStrategyExecution(
    instance,
    sessionRunner,
    strategy
  );

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
    if (currentFetchingKey && currentFetchingKey !== keyRef.current) {
      return new Promise<SessionState<T>>(resolve => {
        resolve({ ...instance.state, abandon: true } as SessionState<T>);
      });
    }
    instance.setFetchingKey(keyRef.current);
    Promise.resolve(undefined).then(() => {
      instance.removeFetchingKey(keyRef.current);
    });
    return strategyExecution(triggerType, vars || variables);
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

  const triggerVersionRef = useRef(stableInstance.version);
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

  useEffect(() => {
    if (stableInstance.state.isFetching) {
      setGlobalFetchingKey(keyRef.current);
    } else {
      removeGlobalFetchingKey(keyRef.current);
    }
  }, [stableInstance.state.isFetching]);

  useUnmount(() => {
    removeGlobalFetchingKey(keyRef.current);
    instance.removeFetchingKey(keyRef.current);
  });

  useEffect(() => {
    strategyEffects.forEach(effectCallback => {
      effectCallback(stableInstance.state);
    });
  }, [stableInstance.state]);

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
  const con = parseConfig(callback, config);
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
  const con = parseConfig(callback, config);
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

export function useIsFetching(
  ...sessionStates: (AbstractSessionState | AbstractSessionResult)[]
): boolean {
  const isLocalFetching = useMemo(() => {
    const states = sessionStates.map(d => {
      if (!Array.isArray(d)) {
        return d;
      }
      const [s] = d;
      return s;
    });
    return states.some(d => d.isFetching);
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

function withError<T extends LazyComponentSupportType<any>>(
  component: T,
  error?: unknown
): T {
  return function ErrorBoundComponent(props: any) {
    return createElement(component, { ...props, error });
  } as T;
}

export function useLazyComponent<T extends LazyComponentSupportType<any>>(
  componentLoader: () => Promise<T | { default: T }>,
  ...deps: (AbstractSessionState | AbstractSessionResult)[]
): CheckLazyComponentSupportType<T> {
  const holders = useMemo(() => {
    return deps.map(d => {
      const promiseHolder: PromiseHolder = { loaded: false } as PromiseHolder;
      promiseHolder.promise = new Promise((resolve, reject) => {
        promiseHolder.resolve = resolve;
        promiseHolder.reject = reject;
      });
      return promiseHolder;
    });
  }, []);
  const holdersRef = useRef(holders);

  useEffect(() => {
    const { current: hs } = holdersRef;
    deps.forEach((value, index) => {
      const state = Array.isArray(value) ? value[0] : value;
      const holder = hs[index];
      if (state.isError && !holder.loaded) {
        holder.loaded = true;
        holder.reject(state);
        return;
      }
      if (state.sessionLoaded && !holder.loaded) {
        holder.loaded = true;
        holder.resolve(true);
      }
    });
  }, [...deps]);

  function fitComponentLoader(comp: T | { default: T }) {
    if ((comp as { default: T }).default) {
      return comp as { default: T };
    }
    return { default: comp };
  }

  function extractComponent(compLike: T | { default: T }): T {
    const defaultCompLike = compLike as { default: T };
    if (
      defaultCompLike.default &&
      typeof defaultCompLike.default === 'function'
    ) {
      return defaultCompLike.default;
    }
    return compLike as T;
  }

  return useMemo(() => {
    const { current: hs } = holdersRef;
    const promises = hs.map(({ promise }) => promise);
    return lazy(() => {
      const loader = componentLoader();
      return Promise.all([loader, ...promises]).then(
        ([comp]) => {
          return fitComponentLoader(comp);
        },
        error => {
          return loader.then(compLike => {
            const comp = extractComponent(compLike);
            const hoc = withError<T>(comp, error);
            return fitComponentLoader(hoc);
          });
        }
      ) as Promise<{ default: T }>;
    }) as CheckLazyComponentSupportType<T>;
  }, []);
}

export function useLoadedSession<T, C extends PromiseCallback<T>>(
  sessionKey: SessionKey<C>,
  config?: { sessionType?: SessionType } | SessionType
): [SessionState<T>, () => void] {
  return useSession(
    sessionKey,
    typeof config === 'string'
      ? { sessionType: config, loaded: true }
      : { ...config, loaded: true }
  );
}

export function useResponse<T>(
  process: (state: SessionState<T>) => any,
  sessionState: SessionState<T>
) {
  useEffect(() => {
    const isErrorResponse = !sessionState.isFetching && sessionState.isError;
    const isSuccessResponse =
      !sessionState.isFetching &&
      sessionState.sessionLoaded &&
      !sessionState.isError;
    if (isErrorResponse || isSuccessResponse) {
      process(sessionState);
    }
  }, [sessionState]);
}

useResponse.success = function useSuccessResponse<T>(
  process: (data: T, sessionState: SessionState<T>) => any,
  sessionState: SessionState<T>
) {
  useEffect(() => {
    const isSuccessResponse =
      !sessionState.isFetching &&
      sessionState.sessionLoaded &&
      !sessionState.isError;
    if (isSuccessResponse) {
      process(sessionState.data as T, sessionState);
    }
  }, [sessionState]);
};

useResponse.error = function useErrorResponse(
  process: (error: unknown, sessionState: SessionState) => any,
  sessionState: SessionState
) {
  useEffect(() => {
    const isErrorResponse = !sessionState.isFetching && sessionState.isError;
    if (isErrorResponse) {
      process(sessionState.error, sessionState);
    }
  }, [sessionState]);
};

export const SessionProvider = StoreProvider;

export const withSessionProvider = provideKeys;

export const provide = provideKeys;

export { createSessionKey } from './libs/model';

export { Strategy } from './strategies';

export { GlobalSessionProvider, ConfigProvider } from './libs/global';
