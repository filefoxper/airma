import { createKey, useModel } from '@airma/react-state';
import type {
  SessionState,
  SessionType,
  SessionKey,
  PromiseCallback,
  QueryConfig
} from './type';

export function effectModel(state: SessionState & { version?: number }) {
  const { version, ...rest } = state;
  const mergeVersion = (s: SessionState) => {
    return { ...s, version };
  };
  return {
    state: rest,
    version: version || 0,
    setState(
      s: SessionState | ((p: SessionState) => SessionState)
    ): SessionState & { version?: number } {
      if (typeof s !== 'function') {
        return mergeVersion(s);
      }
      return mergeVersion(s(state));
    },
    setFetchingKey(fetchingKey: unknown): SessionState & { version?: number } {
      return mergeVersion({
        ...state,
        fetchingKey,
        finalFetchingKey:
          fetchingKey != null ? fetchingKey : state.finalFetchingKey
      });
    },
    removeFetchingKey(
      fetchingKey: unknown
    ): SessionState & { version?: number } {
      if (state.fetchingKey !== fetchingKey) {
        return state;
      }
      return mergeVersion({
        ...state,
        fetchingKey: undefined
      });
    },
    trigger(): SessionState & { version?: number } {
      return { ...state, version: (version || 0) + 1 };
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
  loaded: true;
}): SessionState => ({
  data: undefined,
  variables: undefined,
  isError: false,
  isFetching: false,
  abandon: false,
  triggerType: undefined,
  loaded: false,
  sessionLoaded: false,
  ...config
});

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
  config?: QueryConfig<T, C> | Parameters<C>
): [ReturnType<typeof effectModel>, QueryConfig<T, C>, C] {
  const cg = Array.isArray(config) ? { variables: config } : config;
  const [model, effectCallback, con, isSessionKey] = parseEffect<
    C,
    QueryConfig<T, C>
  >(callback, 'query', cg);
  const configuration = con || {};
  const { defaultData } = configuration;
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

export function createSessionKey<
  E extends (...params: any[]) => Promise<any>,
  T = E extends (...params: any[]) => Promise<infer R> ? R : never
>(effectCallback: E, sessionType?: SessionType): SessionKey<E> {
  const context = { implemented: false };
  const model = createKey(effectModel, defaultPromiseResult()) as SessionKey<E>;
  model.effect = [
    function effectCallbackReplace(...params: any[]) {
      return effectCallback(...params);
    } as E,
    sessionType ? { sessionType } : {}
  ] as [E, { sessionType?: SessionType }];
  model.implement = function impl(callback: E) {
    if (context.implemented) {
      return;
    }
    model.effect[0] = callback;
    context.implemented = true;
  };
  return model as SessionKey<E>;
}
