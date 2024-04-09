import { createKey, useModel } from '@airma/react-state';
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
  const mergeVersion = (s: SessionState) => {
    return { ...s, request, uniqueKey: state.uniqueKey };
  };
  const mergeFetchVersion = (s: SessionState) => {
    if (s.isFetching) {
      return s;
    }
    return {
      ...s,
      fetchVersion: (state.fetchVersion || 0) + 1,
      round: state.round + 1
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
        return mergeFetchVersion(mergeVersion(s));
      }
      return mergeFetchVersion(mergeVersion(s(state)));
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
  const { pipe } = callback as SessionKey<E>;
  const isSessionKey = typeof pipe === 'function';
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
  config?: QueryConfig<T, C> | Parameters<C>
): QueryConfig<T, C> {
  const cg = Array.isArray(config) ? { variables: config } : config;
  const [, , con] = parseEffect<C, QueryConfig<T, C>>(callback, 'query', cg);
  return con || {};
}

export function useSessionBuildModel<T, C extends PromiseCallback<T>>(
  callback: C | SessionKey<C>,
  uniqueKey: unknown,
  config?: QueryConfig<T, C> | Parameters<C>
): [ReturnType<typeof effectModel>, QueryConfig<T, C>, C] {
  const cg = Array.isArray(config) ? { variables: config } : config;
  const [model, effectCallback, con, isSessionKey] = parseEffect<
    C,
    QueryConfig<T, C>
  >(callback, 'query', cg);
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
  const stableInstance = useModel(
    ...(modelParams as [typeof model, SessionState<T>])
  );
  if (loaded && !stableInstance.state.loaded) {
    throw new Error(
      'This session is not loaded, you should remove "config.loaded" option.'
    );
  }
  return [stableInstance, configuration, effectCallback];
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
