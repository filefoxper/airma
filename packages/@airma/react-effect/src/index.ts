import {
  createElement,
  lazy,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef
} from 'react';
import {
  Provider as ModelProvider,
  provide as provideKeys,
  useSignal,
  validations,
  useActProcess
} from '@airma/react-state';
import {
  useMount,
  usePersistFn,
  useUnmount,
  useUpdate
} from '@airma/react-hooks-core';
import {
  parseConfig,
  useSessionBuildModel,
  createSessionKey,
  createSessionStore,
  parseMeta,
  parseStoreMeta
} from './libs/model';
import { globalControllerStore, useGlobalConfig } from './libs/global';
import {
  block,
  latest,
  toStrategies,
  useStrategyExecution
} from './libs/strategy';
import { logger } from './libs/tools';
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
  ControlData,
  Tunnel,
  Resolver,
  StrategyEffectDestroy,
  SessionInstance,
  SessionStore
} from './libs/type';
import type { Signal } from '@airma/react-state';

function noop() {
  /* noop */
}

function useInitialize<T extends () => any>(callback: T): ReturnType<T> {
  const ref = useRef<null | { result: ReturnType<T> }>(null);
  if (ref.current == null) {
    ref.current = { result: callback() };
    return ref.current.result;
  }
  return ref.current.result;
}

function toNoRejectionPromiseCallback<
  T,
  C extends (variables: any[]) => Promise<T>
>(
  callback: C
): (payload: unknown | undefined, variables: any[]) => Promise<PromiseData<T>> {
  return function noRejectionPromiseCallback(
    payload: unknown | undefined,
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
          payload,
          error: undefined,
          isError: false
        };
      },
      e => {
        return {
          variables,
          payload,
          error: e,
          isError: true
        };
      }
    );
  };
}

function useController<T, C extends PromiseCallback<T>>(
  signal: Signal<(s: SessionState<T>) => SessionInstance<T>>
): Controller {
  function getController() {
    const payload = signal.store.payload();
    return payload as FullControlData | undefined;
  }
  return {
    getData(key: keyof ControlData) {
      const controller = getController();
      if (controller == null || controller.data == null) {
        return null;
      }
      return controller.data[key];
    },
    setData(key: keyof ControlData, data: ControlData[typeof key]) {
      const controller = getController();
      if (controller == null) {
        return;
      }
      controller.data = { ...(controller.data || {}), [key]: data };
    }
  };
}

function useFetchingKey(controller: Controller) {
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
}

function usePromise(controller: Controller) {
  return {
    requirePromise(name?: string) {
      const resolver = {
        name,
        resolve: (data: SessionState) => {
          /* noop */
        },
        reject: (data: SessionState) => {
          /* noop */
        }
      };
      const promise = new Promise<SessionState>((resolve, reject) => {
        resolver.resolve = resolve;
        resolver.reject = reject;
      });
      const resolvers: Resolver[] =
        controller.getData('resolvers') || ([] as Resolver[]);
      controller.setData('resolvers', [...resolvers, resolver]);
      return promise;
    },
    responsePromise(sessionState: SessionState) {
      const resolvers: Resolver[] = controller.getData('resolvers') || [];
      controller.setData('resolvers', undefined);
      resolvers.forEach(({ resolve, name }) => {
        resolve(sessionState);
      });
    }
  };
}

function useTunnels(controller: Controller) {
  const getTunnels = function getTunnels(): Tunnel[] {
    return controller.getData('tunnels') || [];
  };
  return {
    getTunnels,
    registry(tunnel: Tunnel) {
      const tunnels = getTunnels();
      if (tunnels.some(t => t.key === tunnel.key)) {
        return;
      }
      controller.setData('tunnels', [...tunnels, tunnel]);
    },
    removeTunnel(key: unknown) {
      const tunnels = getTunnels();
      if (!tunnels.some(t => t.key === key)) {
        return;
      }
      controller.setData(
        'tunnels',
        tunnels.filter(t => t.key !== key)
      );
    }
  };
}

function usePromiseCallbackEffect<T, C extends PromiseCallback<T>>(
  callback: C | SessionKey<C> | { key: SessionKey<C> },
  sessionType: SessionType,
  config: QueryConfig<T, C>,
  isFullFunctionalConfig: boolean
): [
  SessionState<T>,
  () => Promise<SessionState>,
  (...variables: Parameters<C>) => Promise<SessionState>
] {
  const mountedRef = useRef(false);
  const preloadRef = useRef<null | { variables: Array<any> | null }>(null);
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

  useInitialize(() => {
    const mayKey = parseMeta(callback);
    if (validations.isModelKey(mayKey) && mayKey.sessionPayload) {
      const [, d] = mayKey.sessionPayload;
      return signal.store.payload(p => (p != null ? p : { ...d }));
    }
    if (
      validations.isModelStore(mayKey) &&
      (mayKey as SessionStore<C>).sessionPayload
    ) {
      const [, d] = (mayKey as SessionStore<C>).sessionPayload;
      return signal.store.payload(p => (p != null ? p : { ...d }));
    }
    return null;
  });
  const controller = useController(signal);
  const fetchingKeyController = useFetchingKey(controller);
  const tunnelController = useTunnels(controller);
  const promiseHandler = usePromise(controller);

  const globalControlSignal = globalControllerStore.useSignal();

  const sessionRunner = function sessionRunner(
    triggerType: TriggerType,
    payload: unknown | undefined,
    vars: any[]
  ): Promise<SessionState<T>> {
    const noRejectionPromiseCallback = toNoRejectionPromiseCallback(
      (params: any[]) => promiseCallback(...params)
    );
    return noRejectionPromiseCallback(payload, vars).then(data => {
      const abandon =
        fetchingKeyController.getFinalFetchingKey() != null &&
        keyRef.current !== fetchingKeyController.getFinalFetchingKey();
      const online = !signal.store.isDestroyed();
      return {
        ...signal().state,
        ...data,
        abandon,
        isFetching: false,
        triggerType,
        online
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
    payload: unknown | undefined,
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
    return strategyExecution(triggerType, payload, vars || variables).then(
      data => {
        promiseHandler.responsePromise(data);
        return data;
      }
    );
  };

  const triggerWithPayload = usePersistFn(function triggerWithPayload(
    payloadWrapper: { payload: unknown } | undefined
  ) {
    if (triggerTypes.indexOf('manual') < 0) {
      return false;
    }
    if (!mountedRef.current) {
      preloadRef.current = { variables: variables || null };
      return true;
    }
    const payload = payloadWrapper ? payloadWrapper.payload : con.payload;
    if (isFullFunctionalConfig) {
      sessionExecution('manual', payload);
      return true;
    }
    const currentKey = keyRef.current;
    const fulls = tunnelController.getTunnels().filter(t => t.isFullFunctional);
    fulls.forEach(f => {
      if (f.key === currentKey) {
        return;
      }
      f.execution.trigger(payloadWrapper);
    });
    sessionExecution('manual', payload);
    return true;
  });

  const trigger = () => {
    return triggerWithPayload(undefined);
  };

  const executeWithPayload = usePersistFn(function executeWithPayload(
    payloadWrapper: { payload: unknown } | undefined,
    ...vars: Parameters<C>
  ) {
    if (triggerTypes.indexOf('manual') < 0) {
      return false;
    }
    if (!mountedRef.current) {
      preloadRef.current = { variables: vars };
      return true;
    }
    const payload = payloadWrapper ? payloadWrapper.payload : con.payload;
    if (isFullFunctionalConfig) {
      sessionExecution('manual', payload, vars);
      return true;
    }
    const currentKey = keyRef.current;
    const fulls = tunnelController.getTunnels().filter(t => t.isFullFunctional);
    fulls.forEach(f => {
      if (f.key === currentKey) {
        return;
      }
      f.execution.execute(payloadWrapper, ...vars);
    });
    sessionExecution('manual', payload, vars);
    return true;
  });

  const execute = (...vars: Parameters<C>) => {
    return executeWithPayload(undefined, ...vars);
  };

  const effectDeps = deps || variables || [];

  const processor = useActProcess();

  useLayoutEffect(() => {
    tunnelController.registry({
      key: keyRef.current,
      isFullFunctional: isFullFunctionalConfig,
      execution: {
        trigger: triggerWithPayload,
        execute: executeWithPayload as (
          payload: unknown | undefined,
          ...args: any[]
        ) => boolean
      }
    });
    return () => {
      tunnelController.removeTunnel(keyRef.current);
    };
  }, []);

  useMount(() => {
    mountedRef.current = true;
    const preload = preloadRef.current;
    preloadRef.current = null;
    if (
      preload &&
      triggerTypes.indexOf('manual') >= 0 &&
      triggerTypes.indexOf('mount') < 0
    ) {
      const { variables: parameters } = preload;
      if (parameters) {
        execute(...(parameters as Parameters<C>));
      } else {
        trigger();
      }
      return;
    }
    sessionExecution('mount', con.payload);
  });

  useUpdate(() => {
    sessionExecution('update', con.payload);
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
    const operateGlobalFetchingKey = function operateGlobalFetchingKey() {
      const { setGlobalFetchingKey, removeGlobalFetchingKey } =
        globalControlSignal();
      if (stableInstance.state.isFetching) {
        setGlobalFetchingKey(keyRef.current);
      } else {
        removeGlobalFetchingKey(keyRef.current);
      }
    };
    processor.act(() => {
      operateGlobalFetchingKey();
    });
  }, [stableInstance.state.isFetching]);

  useUnmount(() => {
    const destroy = function destroy() {
      const { removeGlobalFetchingKey } = globalControlSignal();
      removeGlobalFetchingKey(keyRef.current);
      fetchingKeyController.removeFetchingKey(keyRef.current);
      preloadRef.current = null;
    };
    processor.act(() => {
      destroy();
    });
  });

  const prevStateRef = useRef(stableInstance.state);

  const destroyCacheRef = useRef<StrategyEffectDestroy<T>[]>([]);

  useEffect(() => {
    const prevState = prevStateRef.current;
    const nextDestroyCache = destroyCacheRef.current
      .map(cache => {
        const [destroy, effectFilter] = cache;
        if (effectFilter(stableInstance.state, prevState)) {
          processor.act(() => destroy());
          return undefined;
        }
        return cache;
      })
      .filter((cache): cache is StrategyEffectDestroy<T> => cache != null);
    destroyCacheRef.current = nextDestroyCache;
    const effectStrategyContextStore: { current: [any, any][] } = {
      current: []
    };
    const effectStrategyContext = {
      set(k: any, v: any) {
        const mappedContextStoreCurrent =
          effectStrategyContextStore.current.map(s =>
            s[0] === k ? ([k, v] as [any, any]) : s
          );
        effectStrategyContextStore.current = mappedContextStoreCurrent.some(
          s => s[0] === k
        )
          ? mappedContextStoreCurrent
          : [...mappedContextStoreCurrent, [k, v] as [any, any]];
      },
      get(k: any) {
        const found = effectStrategyContextStore.current.find(s => s[0] === k);
        if (found) {
          return found[1];
        }
        return undefined;
      }
    };
    const results = strategyEffects.map(effectCallback => {
      if (typeof effectCallback === 'function') {
        return processor.act(() =>
          effectCallback(
            stableInstance.state,
            prevState,
            con,
            effectStrategyContext
          )
        );
      }
      const [callbackOfEffect, effectFilter] = effectCallback;
      if (effectFilter(stableInstance.state, prevState)) {
        const destroy = processor.act(() =>
          callbackOfEffect(
            stableInstance.state,
            prevState,
            con,
            effectStrategyContext
          )
        );
        if (typeof destroy === 'function') {
          const destroyCaches = destroyCacheRef.current;
          destroyCacheRef.current = [...destroyCaches, [destroy, effectFilter]];
        }
      }
      return undefined;
    });
    prevStateRef.current = stableInstance.state;
    return () => {
      results.forEach(r => {
        if (typeof r === 'function') {
          processor.act(() => r());
        }
      });
    };
  }, [stableInstance.state]);

  useEffect(() => {
    return () => {
      destroyCacheRef.current.forEach(([call]) => {
        call();
      });
      destroyCacheRef.current = [];
    };
  }, []);

  const handleTrigger = function handleTrigger() {
    const hasExecuted = trigger();
    if (!hasExecuted) {
      return Promise.resolve(signal().state);
    }
    return promiseHandler.requirePromise();
  };

  handleTrigger.payload = (payload: unknown | undefined) => {
    return function payloadTrigger() {
      const hasExecuted = triggerWithPayload({ payload });
      if (!hasExecuted) {
        return Promise.resolve(signal().state);
      }
      return promiseHandler.requirePromise();
    };
  };

  const handleExecute = function handleExecute(...vars: Parameters<C>) {
    const hasExecuted = execute(...vars);
    if (!hasExecuted) {
      return Promise.resolve(signal().state);
    }
    return promiseHandler.requirePromise();
  };

  handleExecute.payload = (payload: unknown | undefined) => {
    return function payloadExecute(...vars: Parameters<C>) {
      const hasExecuted = executeWithPayload({ payload }, ...vars);
      if (!hasExecuted) {
        return Promise.resolve(signal().state);
      }
      return promiseHandler.requirePromise();
    };
  };

  return [
    stableInstance.state,
    usePersistFn(handleTrigger),
    usePersistFn(handleExecute)
  ];
}

export function useQuery<T, C extends PromiseCallback<T>>(
  sessionLike: C | SessionKey<C> | { key: SessionKey<C> },
  config?: QueryConfig<T, C> | Parameters<C>
): [
  SessionState<T>,
  () => Promise<SessionState>,
  (...variables: Parameters<C>) => Promise<SessionState>
] {
  const callback = sessionLike;
  const con = parseConfig(callback, 'query', config);
  const {
    variables,
    deps,
    manual: man,
    triggerOn = ['mount', 'update', 'manual'],
    strategy,
    ignoreStrategyWrapper
  } = con;

  const manual = !deps && !variables ? true : man;
  const triggerTypes: TriggerType[] = manual ? ['manual'] : triggerOn;
  const scopeEffectConfig = useGlobalConfig() || {};
  const { strategy: strategyCallback, experience } = scopeEffectConfig;
  const {
    list: currentStrategies,
    withoutWrapper,
    withoutDefault
  } = toStrategies(strategy);
  const strategies =
    strategyCallback && !ignoreStrategyWrapper && !withoutWrapper
      ? strategyCallback(currentStrategies, 'query')
      : currentStrategies;

  const promiseConfig = {
    experience,
    ...con,
    triggerOn: triggerTypes,
    strategy: withoutDefault
      ? strategies
      : strategies.concat(latest() as StrategyType | null | undefined)
  };

  return usePromiseCallbackEffect<T, C>(
    callback,
    'query',
    promiseConfig,
    !!config
  );
}

export function useMutation<T, C extends PromiseCallback<T>>(
  sessionLike: C | SessionKey<C> | { key: SessionKey<C> },
  config?: MutationConfig<T, C> | Parameters<C>
): [
  SessionState<T>,
  () => Promise<SessionState>,
  (...variables: Parameters<C>) => Promise<SessionState>
] {
  const callback = sessionLike;
  const con = parseConfig(callback, 'mutation', config);
  const {
    triggerOn: triggerTypes = ['manual'],
    strategy,
    ignoreStrategyWrapper
  } = con;

  const scopeEffectConfig = useGlobalConfig() || {};
  const { strategy: strategyCallback, experience } = scopeEffectConfig;
  const {
    list: currentStrategies,
    withoutWrapper,
    withoutDefault
  } = toStrategies(strategy);
  const strategies =
    strategyCallback && !ignoreStrategyWrapper && !withoutWrapper
      ? strategyCallback(currentStrategies, 'mutation')
      : currentStrategies;

  const promiseConfig = {
    experience,
    ...con,
    triggerOn: triggerTypes,
    strategy: withoutDefault
      ? strategies
      : strategies.concat(block() as StrategyType | null | undefined)
  };

  return usePromiseCallbackEffect<T, C>(
    callback,
    'mutation',
    promiseConfig,
    !!config
  );
}

export function useSession<T, C extends PromiseCallback<T>>(
  sessionKeyLike: SessionKey<C> | { key: SessionKey<C> },
  config?: { loaded?: boolean; sessionType?: SessionType } | SessionType
): [
  SessionState<T>,
  () => Promise<SessionState>,
  (...variables: Parameters<C>) => Promise<SessionState>
] {
  const sessionKey = parseStoreMeta<C>(sessionKeyLike);
  const [, padding] = sessionKey.sessionPayload;
  const { sessionType: sessionKeyType } = padding;
  const signal = useSignal(sessionKey);
  const sessionState = signal().state;
  const controller = useController(signal);
  const tunnelController = useTunnels(controller);
  const promiseHandler = usePromise(controller);
  const { loaded: shouldLoaded, sessionType } =
    typeof config === 'string'
      ? { sessionType: config, loaded: undefined }
      : config || {};
  const { loaded } = sessionState;
  if (sessionType && sessionKeyType && sessionType !== sessionKeyType) {
    throw new Error(
      `The sessionType is not matched, can not use '${sessionKeyType} type' sessionKey 
      with '${sessionType} type' useSession.`
    );
  }
  if (shouldLoaded && !loaded) {
    throw new Error(
      'The session is not loaded yet, check config, and set {loaded: undefined}.'
    );
  }
  function triggerWithPayload(
    payloadWrapper: { payload: unknown } | undefined
  ) {
    const promise = promiseHandler.requirePromise();
    const tunnels = tunnelController.getTunnels();
    const fulls = tunnels.filter(t => t.isFullFunctional);
    fulls.forEach(f => {
      f.execution.trigger(payloadWrapper);
    });
    if (fulls.length) {
      return promise;
    }
    const shorts = tunnels.filter(t => !t.isFullFunctional);
    shorts.forEach(f => {
      f.execution.trigger(payloadWrapper);
    });
    if (!shorts.length) {
      return Promise.resolve({ ...sessionState, abandon: true });
    }
    return promise;
  }
  const handleTrigger = function handleTrigger() {
    return triggerWithPayload(undefined);
  };

  handleTrigger.payload = function payloadTrigger(
    payload: unknown | undefined
  ) {
    return function triggerPayload() {
      return triggerWithPayload({ payload });
    };
  };

  function executeWithPayload(
    payloadWrapper: { payload: unknown } | undefined,
    ...vars: Parameters<C>
  ) {
    const promise = promiseHandler.requirePromise();
    const tunnels = tunnelController.getTunnels();
    const fulls = tunnelController.getTunnels().filter(t => t.isFullFunctional);
    fulls.forEach(f => {
      f.execution.execute(payloadWrapper, ...vars);
    });
    if (fulls.length) {
      return promise;
    }
    const shorts = tunnels.filter(t => !t.isFullFunctional);
    shorts.forEach(f => {
      f.execution.execute(payloadWrapper, ...vars);
    });
    if (!shorts.length) {
      return Promise.resolve({ ...sessionState, abandon: true });
    }
    return promise;
  }
  const handleExecute = function handleExecute(...vars: Parameters<C>) {
    return executeWithPayload(undefined, ...vars);
  };
  handleExecute.payload = function payloadExecute(
    payload: unknown | undefined
  ) {
    return function executePayload(...vars: Parameters<C>) {
      return executeWithPayload({ payload }, ...vars);
    };
  };
  return [
    sessionState,
    usePersistFn(handleTrigger),
    usePersistFn(handleExecute)
  ];
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
    if (defaultCompLike.default) {
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
  sessionKey: SessionKey<C> | { key: SessionKey<C> },
  config?: { sessionType?: SessionType } | SessionType
): [
  SessionState<T>,
  () => Promise<SessionState>,
  (...variables: Parameters<C>) => Promise<SessionState>
] {
  return useSession(
    sessionKey,
    typeof config === 'string'
      ? { sessionType: config, loaded: true }
      : { ...config, loaded: true }
  );
}

export function useResponse<T>(
  process: (state: SessionState<T>) => void | (() => void),
  state: SessionState<T> | [SessionState<T>, { watchOnly?: boolean }?]
) {
  const sessionState = Array.isArray(state) ? state[0] : state;
  const initialRound = useInitialize(() => sessionState.round);
  const { watchOnly } = (Array.isArray(state) ? state[1] : undefined) ?? {};
  const processor = useActProcess();
  useEffect(() => {
    if (sessionState.round === 0) {
      return noop;
    }
    if (watchOnly && initialRound === sessionState.round) {
      return noop;
    }
    const isErrorResponse = sessionState.isError;
    const isSuccessResponse =
      sessionState.sessionLoaded && !sessionState.isError;
    if (isErrorResponse || isSuccessResponse) {
      const res = processor.act(() => process(sessionState));
      return typeof res === 'function' ? res : noop;
    }
    return noop;
  }, [sessionState.round]);
}

useResponse.useSuccess = function useResponseSuccess<T>(
  process: (data: T, sessionState: SessionState<T>) => void | (() => void),
  state: SessionState<T> | [SessionState<T>, { watchOnly?: boolean }?]
) {
  const sessionState = Array.isArray(state) ? state[0] : state;
  const initialRound = useInitialize(() => sessionState.lastSuccessfulRound);
  const { watchOnly } = (Array.isArray(state) ? state[1] : undefined) ?? {};
  const processor = useActProcess();
  useEffect(() => {
    if (sessionState.lastSuccessfulRound === 0) {
      return noop;
    }
    if (watchOnly && initialRound === sessionState.lastSuccessfulRound) {
      return noop;
    }
    const isSuccessResponse =
      sessionState.sessionLoaded && !sessionState.isError;
    if (isSuccessResponse) {
      const res = processor.act(() =>
        process(sessionState.data as T, sessionState)
      );
      return typeof res === 'function' ? res : noop;
    }
    return noop;
  }, [sessionState.lastSuccessfulRound]);
};

useResponse.useFailure = function useResponseFailure(
  process: (error: unknown, sessionState: SessionState) => void | (() => void),
  state: SessionState | [SessionState, { watchOnly?: boolean }?]
) {
  const sessionState = Array.isArray(state) ? state[0] : state;
  const initialRound = useInitialize(() => sessionState.lastFailedRound);
  const { watchOnly } = (Array.isArray(state) ? state[1] : undefined) ?? {};
  const processor = useActProcess();
  useEffect(() => {
    if (sessionState.lastFailedRound === 0) {
      return noop;
    }
    if (watchOnly && initialRound === sessionState.lastFailedRound) {
      return noop;
    }
    const isErrorResponse = sessionState.isError;
    if (isErrorResponse) {
      const res = processor.act(() =>
        process(sessionState.error, sessionState)
      );
      return typeof res === 'function' ? res : noop;
    }
    return noop;
  }, [sessionState.lastFailedRound]);
};

export const Provider = ModelProvider;

export const provide = provideKeys;

export { createSessionKey, createSessionStore };

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
    c?: QueryConfig<T, C> | Parameters<C>
  ) {
    return useQuery(sessionCallback, c);
  };

  const useApiMutation = function useApiMutation(
    c?: MutationConfig<T, C> | Parameters<C>
  ) {
    return useMutation(sessionCallback, c);
  };

  const storeApi = function storeApi() {
    const sessionStore = createSessionStore(sessionCallback, queryType);
    const useStoreApiQuery = function useStoreApiQuery(
      c?: QueryConfig<T, C> | Parameters<C>
    ) {
      return useQuery(sessionStore, c);
    };
    const useStoreApiMutation = function useStoreApiMutation(
      c?: MutationConfig<T, C> | Parameters<C>
    ) {
      return useMutation(sessionStore, c);
    };
    const useStoreApiSession = function useStoreApiSession() {
      return useSession(sessionStore, queryType);
    };
    const useStoreApiLoadedSession = function useStoreApiLoadedSession() {
      return useLoadedSession(sessionStore, queryType);
    };
    return sessionStore.extends(
      queryType === 'query'
        ? {
            useSession: useStoreApiSession,
            useLoadedSession: useStoreApiLoadedSession,
            useQuery: useStoreApiQuery
          }
        : {
            useSession: useStoreApiSession,
            useLoadedSession: useStoreApiLoadedSession,
            useMutation: useStoreApiMutation
          }
    );
  };

  const keyApi = function keyApi() {
    const key = createSessionKey(sessionCallback, queryType);
    const useStoreApiQuery = function useStoreApiQuery(
      c?: QueryConfig<T, C> | Parameters<C>
    ) {
      return useQuery(key, c);
    };
    const useStoreApiMutation = function useStoreApiMutation(
      c?: MutationConfig<T, C> | Parameters<C>
    ) {
      return useMutation(key, c);
    };
    const useStoreApiSession = function useStoreApiSession() {
      return useSession(key, queryType);
    };
    const useStoreApiLoadedSession = function useStoreApiLoadedSession() {
      return useLoadedSession(key, queryType);
    };
    const sessionKeyApi = {
      key,
      useSession: useStoreApiSession,
      useLoadedSession: useStoreApiLoadedSession
    };
    return queryType === 'query'
      ? { ...sessionKeyApi, useQuery: useStoreApiQuery }
      : { ...sessionKeyApi, useMutation: useStoreApiMutation };
  };

  const api = {
    sessionType: queryType,
    createStore: storeApi,
    createKey: keyApi
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
