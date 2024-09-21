import { createKey, useSignal } from '@airma/react-state';
import type {
  SessionState,
  SessionType,
  SessionKey,
  PromiseCallback,
  QueryConfig,
  SessionRequest
} from './type';

export function effectModel(
  state: SessionState & { request?: SessionRequest }
) {
  const { request, ...rest } = state;
  const mergeVersion = (
    s: SessionState
  ): SessionState & { request?: SessionRequest } => {
    return { ...s, request, uniqueKey: state.uniqueKey };
  };
  const checkIfANewRound = (s: SessionState): SessionState => {
    if (s.isFetching) {
      return { ...s, stale: state.stale || { data: state.data } };
    }
    return {
      ...s,
      visited: state.visited ? state.visited : !s.isError,
      round: state.round + 1,
      lastSuccessfulRound: s.isError
        ? state.lastSuccessfulRound
        : state.lastSuccessfulRound + 1,
      lastFailedRound: s.isError
        ? state.lastFailedRound + 1
        : state.lastFailedRound,
      lastSuccessfulVariables: s.isError
        ? state.lastSuccessfulVariables
        : s.variables,
      lastFailedVariables: s.isError ? s.variables : state.lastFailedVariables,
      stale: undefined
    };
  };
  const requestVersion = request ? request.version : 0;
  return {
    state: rest,
    request,
    setState(
      s: SessionState | ((p: SessionState) => SessionState)
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
    lastSuccessfulVariables: undefined,
    lastFailedVariables: undefined,
    ...config
  } as SessionState);

function parseEffect<
  E extends (...p: any[]) => any,
  C extends Record<string, any> = Record<string, any>
>(
  callback: E | SessionKey<E>,
  sessionType: SessionType,
  config?: C
): [SessionKey<E>, E, C | undefined, boolean] {
  const { isFactory } = callback as SessionKey<E>;
  const isSessionKey = typeof isFactory === 'function' && isFactory();
  if (!isSessionKey) {
    return [effectModel as SessionKey<E>, callback as E, config, false];
  }
  const { payload } = callback as SessionKey<E>;
  const [effectCallback, { sessionType: keyType }] = payload as [
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
  return [callback as SessionKey<E>, effectCallback, config, true];
}

export function parseConfig<T, C extends PromiseCallback<T>>(
  callback: C | SessionKey<C>,
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
  callback: C | SessionKey<C>,
  uniqueKey: unknown,
  sessionType: SessionType,
  config?: QueryConfig<T, C> | Parameters<C>
): [
  ReturnType<typeof effectModel>,
  () => ReturnType<typeof effectModel>,
  QueryConfig<T, C>,
  C
] {
  const cg = Array.isArray(config) ? { variables: config } : config;
  const [model, effectCallback, con, isSessionKey] = parseEffect<
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
      if (!isSessionKey) {
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
  const model = createKey(effectModel, defaultPromiseResult()) as SessionKey<E>;
  const effectCallbackReplace: E = function effectCallbackReplace(
    ...params: any[]
  ) {
    return effectCallback(...params);
  } as E;
  model.payload = [
    effectCallbackReplace,
    sessionType ? { sessionType } : {}
  ] as [E, { sessionType?: SessionType }];
  return model as SessionKey<E>;
}
