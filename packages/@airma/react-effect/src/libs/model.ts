import {
  createKey,
  createStore,
  useSignal,
  validations
} from '@airma/react-state';
import type { Signal } from '@airma/react-state';
import type {
  SessionState,
  SessionType,
  SessionKey,
  PromiseCallback,
  QueryConfig,
  SessionRequest,
  SessionInstance,
  SessionStore
} from './type';

export function effectModel(
  state: SessionState & { request?: SessionRequest }
) {
  const { request, ...rest } = state;
  const mergeVersion = (
    s: SessionState & { roundStatus?: 'start' | 'end' }
  ): SessionState & {
    request?: SessionRequest;
    roundStatus?: 'start' | 'end';
  } => {
    return { ...s, request, uniqueKey: state.uniqueKey };
  };
  const checkIfANewRound = (
    nextS: SessionState & { roundStatus?: 'start' | 'end' }
  ): SessionState => {
    const { roundStatus, ...s } = nextS;
    if (!roundStatus) {
      return s;
    }
    if (roundStatus === 'start') {
      return { ...s, stale: state.stale || { data: state.data } };
    }

    return {
      ...s,
      visited: state.visited ? state.visited : !s.isError,
      round: state.round + 1,
      lastSuccessfulRound: s.isError
        ? state.lastSuccessfulRound
        : state.round + 1,
      lastFailedRound: s.isError ? state.round + 1 : state.lastFailedRound,
      lastSuccessfulRoundVariables: s.isError
        ? state.lastSuccessfulRoundVariables
        : s.variables,
      lastFailedRoundVariables: s.isError
        ? s.variables
        : state.lastFailedRoundVariables,
      stale: undefined
    };
  };
  const requestVersion = request ? request.version : 0;
  return {
    state: rest,
    request,
    setState(
      s:
        | (SessionState & { roundStatus?: 'start' | 'end' })
        | ((
            p: SessionState
          ) => SessionState & { roundStatus?: 'start' | 'end' })
    ): SessionState & { request?: SessionRequest } {
      if (typeof s !== 'function') {
        return checkIfANewRound(mergeVersion(s));
      }
      return checkIfANewRound(mergeVersion(s(state)));
    },
    trigger(): SessionState & { request?: SessionRequest } {
      return { ...state, request: { version: requestVersion + 1 } };
    },
    execute(variables: any[]): SessionState & { request?: SessionRequest } {
      return { ...state, request: { version: requestVersion + 1, variables } };
    }
  };
}

export function globalController(fetchingKeys: any[]) {
  return {
    isFetching: fetchingKeys.length > 0,
    setGlobalFetchingKey(fetchingKey: any) {
      const isFetching = fetchingKeys.some(k => k === fetchingKey);
      if (isFetching) {
        return fetchingKeys;
      }
      return fetchingKeys.concat(fetchingKey);
    },
    removeGlobalFetchingKey(fetchingKey: any) {
      const isFetching = fetchingKeys.some(k => k === fetchingKey);
      if (!isFetching) {
        return fetchingKeys;
      }
      return fetchingKeys.filter(k => k !== fetchingKey);
    }
  };
}

export const defaultPromiseResult = (config?: {
  data: any;
  uniqueKey: unknown;
  loaded: true;
}): SessionState =>
  ({
    data: undefined,
    variables: undefined,
    isError: false,
    isFetching: false,
    abandon: false,
    triggerType: undefined,
    loaded: false,
    sessionLoaded: false,
    cache: [],
    maxCacheCapacity: 1,
    round: 0,
    executeVariables: undefined,
    visited: false,
    lastSuccessfulRound: 0,
    lastFailedRound: 0,
    lastSuccessfulRoundVariables: undefined,
    lastFailedRoundVariables: undefined,
    online: true,
    ...config
  }) as SessionState;

export function parseStoreMeta<E extends (...p: any[]) => any>(
  callback: E | SessionKey<E> | { key: SessionKey<E> }
): SessionKey<E> | SessionStore<E> {
  const storeLike = callback as { key: SessionKey<E> };
  const isSessionKey = validations.isModelKey(callback);
  const errorMessage =
    'API `useSession` can not use a session callback directly. Please set a session key or session store.';
  if (!isSessionKey && !validations.isModelKey(storeLike.key)) {
    throw new Error(errorMessage);
  }
  const sessionCaller = callback as SessionKey<E> | { key: SessionKey<E> };
  if (
    validations.isModelStore(sessionCaller) ||
    validations.isModelKey(sessionCaller)
  ) {
    return sessionCaller as SessionKey<E> | SessionStore<E>;
  }
  if (!validations.isModelKey(storeLike.key)) {
    throw new Error(errorMessage);
  }
  return sessionCaller.key as SessionKey<E>;
}

export function parseMeta<E extends (...p: any[]) => any>(
  callback: E | SessionKey<E> | { key: SessionKey<E> }
): E | SessionKey<E> | SessionStore<E> {
  const storeLike = callback as { key: SessionKey<E> };
  const isSessionKey = validations.isModelKey(callback);
  if (!isSessionKey && !validations.isModelKey(storeLike.key)) {
    return callback as E;
  }
  const sessionCaller = callback as SessionKey<E> | { key: SessionKey<E> };
  if (
    validations.isModelStore(sessionCaller) ||
    validations.isModelKey(sessionCaller)
  ) {
    return sessionCaller as SessionKey<E> | SessionStore<E>;
  }
  if (!validations.isModelKey(storeLike.key)) {
    return callback as E;
  }
  return sessionCaller.key as SessionKey<E>;
}

function parseEffect<
  E extends (...p: any[]) => any,
  C extends Record<string, any> = Record<string, any>
>(
  callback: E | SessionKey<E> | { key: SessionKey<E> },
  sessionType: SessionType,
  config?: C
): [SessionKey<E> | SessionStore<E>, E, C | undefined, boolean] {
  const storeLike = callback as { key: SessionKey<E> };
  const isSessionKey = validations.isModelKey(callback);
  if (!isSessionKey && !validations.isModelKey(storeLike.key)) {
    return [effectModel as SessionKey<E>, callback as E, config, false];
  }
  const sessionCaller = callback as SessionKey<E> | { key: SessionKey<E> };
  const caller =
    validations.isModelStore(sessionCaller) ||
    validations.isModelKey(sessionCaller)
      ? (sessionCaller as SessionKey<E> | SessionStore<E>)
      : (sessionCaller.key as SessionKey<E>);
  const { sessionPayload } = caller;
  const [effectCallback, { sessionType: keyType }] = sessionPayload as [
    E,
    { sessionType?: SessionType }
  ];
  if (keyType != null && keyType !== sessionType) {
    throw new Error(
      `The sessionType is not matched, can not use '${keyType} type' sessionKey with '${
        sessionType === 'query' ? 'useQuery' : 'useMutation'
      }'`
    );
  }
  return [caller, effectCallback, config, true];
}

export function parseConfig<T, C extends PromiseCallback<T>>(
  callback: C | SessionKey<C> | { key: SessionKey<C> },
  sessionType: SessionType,
  config?: QueryConfig<T, C> | Parameters<C>
): QueryConfig<T, C> {
  const cg = Array.isArray(config) ? { variables: config } : config;
  const [, , con] = parseEffect<C, QueryConfig<T, C>>(
    callback,
    sessionType,
    cg
  );
  return con || {};
}

export function useSessionBuildModel<T, C extends PromiseCallback<T>>(
  callback: C | SessionKey<C> | { key: SessionKey<C> },
  uniqueKey: unknown,
  sessionType: SessionType,
  config?: QueryConfig<T, C> | Parameters<C>
): [
  ReturnType<typeof effectModel>,
  Signal<(state: SessionState) => SessionInstance>,
  QueryConfig<T, C>,
  C
] {
  const cg = Array.isArray(config) ? { variables: config } : config;
  const [model, effectCallback, con, isSessionKeyOrStore] = parseEffect<
    C,
    QueryConfig<T, C>
  >(callback, sessionType, cg);
  const configuration = con || {};
  const { defaultData, loaded } = configuration;
  const hasDefaultData = Object.prototype.hasOwnProperty.call(
    configuration,
    'defaultData'
  );
  const modelParams: [typeof model, SessionState<T>?] =
    (function computeParams() {
      if (!isSessionKeyOrStore) {
        return [
          model,
          defaultPromiseResult(
            hasDefaultData
              ? { data: defaultData, uniqueKey, loaded: true }
              : undefined
          )
        ];
      }
      return hasDefaultData
        ? [
            model,
            defaultPromiseResult({
              data: defaultData,
              uniqueKey: callback,
              loaded: true
            })
          ]
        : [model];
    })();
  const signal = useSignal(...(modelParams as [typeof model, SessionState<T>]));
  const stableInstance = signal();
  if (loaded && !stableInstance.state.loaded) {
    throw new Error(
      'This session is not loaded, you should remove "config.loaded" option.'
    );
  }
  return [stableInstance, signal, configuration, effectCallback];
}

export function createSessionKey<E extends (...params: any[]) => Promise<any>>(
  effectCallback: E,
  sessionType?: SessionType
): SessionKey<E> {
  const modelKey = createKey(
    effectModel,
    defaultPromiseResult()
  ) as SessionKey<E>;
  const effectCallbackReplace: E = function effectCallbackReplace(
    ...params: any[]
  ) {
    return effectCallback(...params);
  } as E;
  modelKey.sessionPayload = [
    effectCallbackReplace,
    sessionType ? { sessionType } : {}
  ] as [E, { sessionType?: SessionType }];
  return modelKey as SessionKey<E>;
}

export function createSessionStore<
  E extends (...params: any[]) => Promise<any>
>(effectCallback: E, sessionType?: SessionType): SessionStore<E> {
  const modelStore = createStore(
    effectModel,
    defaultPromiseResult()
  ) as SessionStore<E>;
  const effectCallbackReplace: E = function effectCallbackReplace(
    ...params: any[]
  ) {
    return effectCallback(...params);
  } as E;
  const createSessionPayload = () =>
    [effectCallbackReplace, sessionType ? { sessionType } : {}] as [
      E,
      { sessionType?: SessionType }
    ];
  modelStore.sessionPayload = createSessionPayload();
  modelStore.key.sessionPayload = createSessionPayload();
  return modelStore as SessionStore<E>;
}
