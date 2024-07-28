import {
  createElement,
  FunctionComponent,
  lazy,
  ReactNode,
  useEffect,
  useMemo,
  useRef
} from 'react';
import {
  Provider as ModelProvider,
  useSelector,
  provide as provideKeys,
  AirReducer
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
  FullControlData,
  Controller,
  ControlData
} from './libs/type';
import {
  parseConfig,
  useSessionBuildModel,
  createSessionKey
} from './libs/model';
import { globalControllerStore, useGlobalConfig } from './libs/global';
import {
  block,
  latest,
  toStrategies,
  useStrategyExecution
} from './libs/strategy';
import { logger } from './libs/tools';

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

function useController<T, C extends PromiseCallback<T>>(
  callback: C | SessionKey<C>
): Controller {
  const { payload } = callback as SessionKey<C>;
  const [, d] = payload || [];
  const controller = d as FullControlData | undefined;
  return useMemo(() => {
    return {
      getData(key: keyof ControlData) {
        if (controller == null || controller.data == null) {
          return null;
        }
        return controller.data[key];
      },
      setData(key: keyof ControlData, data: ControlData[typeof key]) {
        if (controller == null) {
          return;
        }
        controller.data = { ...(controller.data || {}), [key]: data };
      }
    };
  }, []);
}

function useFetchingKey(controller: Controller) {
  return useMemo(() => {
    return {
      getFetchingKey() {
        return controller.getData('fetchingKey');
      },
      getFinalFetchingKey() {
        return controller.getData('finalFetchingKey');
      },
      setFetchingKey(key: unknown) {
        controller.setData('fetchingKey', key);
        if (key == null) {
          return;
        }
        controller.setData('finalFetchingKey', key);
      },
      removeFetchingKey(key: unknown) {
        if (key !== controller.getData('fetchingKey')) {
          return;
        }
        controller.setData('fetchingKey', undefined);
      }
    };
  }, []);
}

function usePromiseCallbackEffect<T, C extends PromiseCallback<T>>(
  callback: C | SessionKey<C>,
  sessionType: SessionType,
  config?: QueryConfig<T, C> | Parameters<C>
): [
  SessionState<T>,
  () => Promise<SessionState<T>>,
  (...variables: Parameters<C>) => Promise<SessionState<T>>
] {
  const keyRef = useRef({});
  const [stableInstance, signal, con, promiseCallback] = useSessionBuildModel(
    callback,
    keyRef.current,
    sessionType,
    config
  );
  const {
    variables,
    deps,
    triggerOn: triggerTypes = ['mount', 'update', 'manual']
  } = con;

  const controller = useController(callback);
  const fetchingKeyController = useFetchingKey(controller);

  const globalControlSignal = globalControllerStore.useSignal();

  const sessionRunner = function sessionRunner(
    triggerType: TriggerType,
    vars: any[]
  ): Promise<SessionState<T>> {
    const noRejectionPromiseCallback = toNoRejectionPromiseCallback(
      (params: any[]) => promiseCallback(...params)
    );
    return noRejectionPromiseCallback(vars).then(data => {
      const abandon =
        fetchingKeyController.getFinalFetchingKey() != null &&
        keyRef.current !== fetchingKeyController.getFinalFetchingKey();
      return {
        ...signal().state,
        ...data,
        abandon,
        isFetching: false,
        triggerType
      } as SessionState<T>;
    });
  };

  const [strategyExecution, strategyEffects] = useStrategyExecution(
    signal,
    sessionRunner,
    con
  );

  const sessionExecution = function sessionExecution(
    triggerType: 'manual' | 'mount' | 'update',
    vars?: any[]
  ): Promise<SessionState<T>> {
    const currentFetchingKey = fetchingKeyController.getFetchingKey();
    if (triggerTypes.indexOf(triggerType) < 0) {
      return new Promise<SessionState<T>>(resolve => {
        resolve({ ...signal().state, abandon: true } as SessionState<T>);
      });
    }
    if (currentFetchingKey && currentFetchingKey !== keyRef.current) {
      return new Promise<SessionState<T>>(resolve => {
        resolve({ ...signal().state, abandon: true } as SessionState<T>);
      });
    }
    if (['mount', 'update'].includes(triggerType) && variables == null) {
      logger.warn(
        'Trigger Session with no variables is dangerous. It means calling async function with no parameter.'
      );
    }
    if (triggerType === 'manual' && variables == null && vars == null) {
      logger.warn(
        'Trigger Session with no variables is dangerous. It means calling async function with no parameter.'
      );
    }
    fetchingKeyController.setFetchingKey(keyRef.current);
    Promise.resolve(undefined).then(() => {
      fetchingKeyController.removeFetchingKey(keyRef.current);
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

  const triggerRequestRef = useRef(stableInstance.request);
  useEffect(() => {
    if (triggerRequestRef.current === stableInstance.request) {
      return;
    }
    triggerRequestRef.current = stableInstance.request;
    const currentFetchingKey = fetchingKeyController.getFetchingKey();
    if (currentFetchingKey && currentFetchingKey !== keyRef.current) {
      return;
    }
    const { variables: requestVariables } = stableInstance.request || {};
    if (!requestVariables) {
      trigger();
      return;
    }
    execute(...(requestVariables as Parameters<C>));
  }, [stableInstance.request]);

  useEffect(() => {
    const { setGlobalFetchingKey, removeGlobalFetchingKey } =
      globalControlSignal();
    if (stableInstance.state.isFetching) {
      setGlobalFetchingKey(keyRef.current);
    } else {
      removeGlobalFetchingKey(keyRef.current);
    }
  }, [stableInstance.state.isFetching]);

  useUnmount(() => {
    const { removeGlobalFetchingKey } = globalControlSignal();
    removeGlobalFetchingKey(keyRef.current);
    fetchingKeyController.removeFetchingKey(keyRef.current);
  });

  const prevStateRef = useRef(stableInstance.state);

  useEffect(() => {
    const prevState = prevStateRef.current;
    strategyEffects.forEach(effectCallback => {
      effectCallback(stableInstance.state, prevState);
    });
    prevStateRef.current = stableInstance.state;
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
  const con = parseConfig(callback, 'query', config);
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
    strategy: strategies.concat(latest() as StrategyType | null | undefined)
  };

  return usePromiseCallbackEffect<T, C>(callback, 'query', promiseConfig);
}

export function useMutation<T, C extends PromiseCallback<T>>(
  callback: C | SessionKey<C>,
  config?: MutationConfig<T, C> | Parameters<C>
): [
  SessionState<T>,
  () => Promise<SessionState<T>>,
  (...variables: Parameters<C>) => Promise<SessionState<T>>
] {
  const con = parseConfig(callback, 'mutation', config);
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
    strategy: strategies.concat(block() as StrategyType | null | undefined)
  };

  return usePromiseCallbackEffect<T, C>(callback, 'mutation', promiseConfig);
}

export function useSession<T, C extends PromiseCallback<T>>(
  sessionKey: SessionKey<C>,
  config?: { loaded?: boolean; sessionType?: SessionType } | SessionType
): [SessionState<T>, () => void, (variables: any[]) => void] {
  const [, padding] = sessionKey.payload;
  const { sessionType: sessionKeyType } = padding;
  const session = useSelector(
    sessionKey,
    s =>
      [s.state, s.trigger, s.execute] as [
        SessionState<T>,
        () => void,
        (variables: any[]) => void
      ]
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
  const [sessionState, trigger, executeCallback] = session;
  const execute = usePersistFn((...variables: any[]) => {
    executeCallback(variables);
  });
  return [sessionState, trigger, execute];
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
  const isGlobalFetching = globalControllerStore.useSelector(i => i.isFetching);
  if (!sessionStates.length) {
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
      if (state.loaded && !holder.loaded) {
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
): [SessionState<T>, () => void, (variables: any[]) => void] {
  return useSession(
    sessionKey,
    typeof config === 'string'
      ? { sessionType: config, loaded: true }
      : { ...config, loaded: true }
  );
}

export function useResponse<T>(
  process: (state: SessionState<T>) => any,
  state: SessionState<T> | [SessionState<T>, { watchOnly?: boolean }?]
) {
  const sessionState = Array.isArray(state) ? state[0] : state;
  const { watchOnly } = (Array.isArray(state) ? state[1] : undefined) ?? {};
  const mountedRef = useRef(false);
  useEffect(() => {
    const mounted = mountedRef.current;
    mountedRef.current = true;
    if (sessionState.round === 0) {
      return;
    }
    if (watchOnly && !mounted) {
      return;
    }
    const isErrorResponse = !sessionState.isFetching && sessionState.isError;
    const isSuccessResponse =
      !sessionState.isFetching &&
      sessionState.sessionLoaded &&
      !sessionState.isError;
    if (isErrorResponse || isSuccessResponse) {
      process(sessionState);
    }
  }, [sessionState.round]);
}

useResponse.useSuccess = function useResponseSuccess<T>(
  process: (data: T, sessionState: SessionState<T>) => any,
  state: SessionState<T> | [SessionState<T>, { watchOnly?: boolean }?]
) {
  const sessionState = Array.isArray(state) ? state[0] : state;
  const { watchOnly } = (Array.isArray(state) ? state[1] : undefined) ?? {};
  const mountedRef = useRef(false);
  useEffect(() => {
    const mounted = mountedRef.current;
    mountedRef.current = true;
    if (sessionState.round === 0) {
      return;
    }
    if (watchOnly && !mounted) {
      return;
    }
    const isSuccessResponse =
      !sessionState.isFetching &&
      sessionState.sessionLoaded &&
      !sessionState.isError;
    if (isSuccessResponse) {
      process(sessionState.data as T, sessionState);
    }
  }, [sessionState.round]);
};

useResponse.useFailure = function useResponseFailure(
  process: (error: unknown, sessionState: SessionState) => any,
  state: SessionState | [SessionState, { watchOnly?: boolean }?]
) {
  const sessionState = Array.isArray(state) ? state[0] : state;
  const { watchOnly } = (Array.isArray(state) ? state[1] : undefined) ?? {};
  const mountedRef = useRef(false);
  useEffect(() => {
    const mounted = mountedRef.current;
    mountedRef.current = true;
    if (sessionState.round === 0) {
      return;
    }
    if (watchOnly && !mounted) {
      return;
    }
    const isErrorResponse = !sessionState.isFetching && sessionState.isError;
    if (isErrorResponse) {
      process(sessionState.error, sessionState);
    }
  }, [sessionState.round]);
};

/**
 * @deprecated
 * @param process
 * @param sessionState
 */
useResponse.success = useResponse.useSuccess;

/**
 * @deprecated
 * @param process
 * @param sessionState
 */
useResponse.error = useResponse.useFailure;

export const Provider = ModelProvider;

export const provide = provideKeys;

export { createSessionKey };

export { Strategy } from './strategies';

export { ConfigProvider } from './libs/global';

const session = function session<T, C extends PromiseCallback<T>>(
  callback: C,
  sessionType: 'query' | 'mutation'
) {
  const queryType = sessionType;
  const sessionCallback: C = function sessionCallback(...args: Parameters<C>) {
    return callback(...args);
  } as C;

  const useApiQuery = function useApiQuery(
    c: QueryConfig<T, C> | Parameters<C>
  ) {
    return useQuery(sessionCallback, c);
  };

  const useApiMutation = function useApiMutation(
    c: MutationConfig<T, C> | Parameters<C>
  ) {
    return useMutation(sessionCallback, c);
  };

  const storeApi = function storeApi(k?: any, keys: any[] = []) {
    const key = k != null ? k : createSessionKey(sessionCallback, queryType);
    const useStoreApiQuery = function useStoreApiQuery(
      c: QueryConfig<T, C> | Parameters<C>
    ) {
      return useQuery(key, c);
    };
    const useStoreApiMutation = function useStoreApiMutation(
      c: MutationConfig<T, C> | Parameters<C>
    ) {
      return useMutation(key, c);
    };
    const useStoreApiSession = function useStoreApiSession() {
      return useSession(key, queryType);
    };
    const useStoreApiLoadedSession = function useStoreApiLoadedSession() {
      return useLoadedSession(key, queryType);
    };
    const withKeys = function withKeys(
      ...stores: (
        | {
            key: AirReducer;
          }
        | AirReducer
      )[]
    ) {
      const nks = keys.concat(
        stores.map(store => (typeof store === 'function' ? store : store.key))
      );
      return storeApi(key, nks);
    };
    const storeApiProvide = function storeApiProvide() {
      return provide([key, ...keys]);
    };
    const storeApiProvideTo = function storeApiProvideTo(
      component: FunctionComponent
    ) {
      return provide([key, ...keys])(component);
    };
    const StoreApiProvider = function StoreApiProvider({
      children
    }: {
      children?: ReactNode;
    }) {
      return createElement(Provider, { value: [key, ...keys] }, children);
    };
    const globalApi = function globalApi() {
      const globalKey = key.global();
      const globalApiHooks = {
        useSession() {
          return useSession(globalKey, queryType);
        },
        useLoadedSession() {
          return useLoadedSession(globalKey, queryType);
        }
      };
      const useGlobalApiQuery = function useGlobalApiQuery(
        c: QueryConfig<T, C> | Parameters<C>
      ) {
        return useQuery(globalKey, c);
      };
      const useGlobalApiMutation = function useGlobalApiMutation(
        c: MutationConfig<T, C> | Parameters<C>
      ) {
        return useMutation(globalKey, c);
      };
      return queryType === 'query'
        ? { ...globalApiHooks, useQuery: useGlobalApiQuery }
        : { ...globalApiHooks, useMutation: useGlobalApiMutation };
    };
    const sessionStoreApi = {
      key,
      with: withKeys,
      asGlobal: globalApi,
      static: globalApi,
      useSession: useStoreApiSession,
      useLoadedSession: useStoreApiLoadedSession,
      provide: storeApiProvide,
      provideTo: storeApiProvideTo,
      Provider: StoreApiProvider
    };
    return queryType === 'query'
      ? { ...sessionStoreApi, useQuery: useStoreApiQuery }
      : { ...sessionStoreApi, useMutation: useStoreApiMutation };
  };

  const api = {
    store: storeApi,
    createStore: storeApi
  };

  const queryApi = {
    ...api,
    useQuery: useApiQuery
  };

  const mutationApi = {
    ...api,
    useMutation: useApiMutation
  };
  const apis = queryType === 'query' ? queryApi : mutationApi;
  return Object.assign(sessionCallback, apis);
};

export { session };
