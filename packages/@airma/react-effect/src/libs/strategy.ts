import { useRef } from 'react';
import { useUnmount } from '@airma/react-hooks-core';
import { useActProcess } from '@airma/react-state';
import type { Signal } from '@airma/react-state';
import type {
  QueryConfig,
  SessionInstance,
  SessionState,
  SessionToken,
  StrategyCollectionType,
  StrategyConfig,
  StrategyEffect,
  StrategyType,
  TriggerType
} from './type';

export function composeStrategies(
  strategies: (StrategyType | undefined | null)[]
): StrategyType {
  return function strategy(v) {
    const tempSessionSetters: ((s: SessionState) => SessionState)[] = [];
    const defaultStrategy: StrategyType = value => {
      return value.runner(s => {
        return tempSessionSetters.reduce((r, c) => {
          if (r.abandon) {
            return r;
          }
          return c(r);
        }, s);
      });
    };
    const storeSlots = v.localCache.current as { current: any }[];
    const callback = [...strategies]
      .reverse()
      .reduce((r: StrategyType, c: StrategyType | undefined | null, i) => {
        const storage = storeSlots[i] || { current: undefined };
        return function middle(value) {
          const nextValue = { ...value, localCache: storage };
          if (c == null) {
            return r(nextValue);
          }
          const nextRunner = (
            setSessionState?: (s: SessionState) => SessionState
          ) => {
            if (setSessionState != null) {
              tempSessionSetters.push(setSessionState);
            }
            if (nextValue.getSessionToken().status === 'abandon') {
              const currentState = nextValue.getSessionState();
              return Promise.resolve({ ...currentState, abandon: true });
            }
            return r(nextValue).then(d => {
              return nextValue.getSessionToken().status === 'abandon'
                ? { ...d, abandon: true }
                : d;
            });
          };
          return c({ ...nextValue, runner: nextRunner });
        };
      }, defaultStrategy);
    return callback(v).then(d => {
      const { loaded, sessionLoaded } = v.getSessionState();
      const { abandon, isError, isFetching } = d;
      const currentLoaded = loaded || (!abandon && !isError && !isFetching);
      const currentIsSessionLoaded =
        sessionLoaded || (!abandon && !isError && !isFetching);
      return {
        ...d,
        loaded: currentLoaded,
        sessionLoaded: currentIsSessionLoaded
      };
    });
  };
}

export function toStrategies(strategy: StrategyCollectionType): StrategyConfig {
  if (Array.isArray(strategy)) {
    return { list: strategy };
  }
  if (strategy == null || typeof strategy === 'function') {
    return { list: [strategy] };
  }
  return strategy;
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

function useSessionToken() {
  const tokensRef = useRef<SessionToken[]>([]);

  const createToken = (): SessionToken => {
    const currentTokens = tokensRef.current;
    const token: SessionToken = {
      status: 'normal',
      abandon() {
        throw new Error('This Session token has not been initialized');
      },
      silence() {
        throw new Error('This Session token has not been initialized');
      }
    };
    token.abandon = function abandon(tokens?: SessionToken[]) {
      if (tokens != null) {
        tokens.forEach(t => {
          t.abandon();
        });
        return;
      }
      token.status = 'abandon';
      tokensRef.current = tokensRef.current.filter(t => t !== token);
    };
    token.silence = function silence() {
      if (token.status === 'abandon') {
        return;
      }
      token.status = 'silent';
    };
    tokensRef.current = [...currentTokens, token];
    return token;
  };
  return {
    createToken,
    removeToken(token: SessionToken) {
      tokensRef.current = tokensRef.current.filter(t => t !== token);
    },
    getTokens() {
      return tokensRef.current;
    }
  };
}

export function useStrategyExecution<T>(
  signal: Signal<(state: SessionState) => SessionInstance>,
  sessionRunner: (
    triggerType: TriggerType,
    payload: unknown | undefined,
    variables: any[]
  ) => Promise<SessionState<T>>,
  config: QueryConfig<T, any>
) {
  const sessionTokens = useSessionToken();
  const processor = useActProcess();
  const { strategy } = config;
  const { list: strategies } = toStrategies(strategy);
  const strategyStoreRef = useRef<{ current: any }[]>(
    strategies.map(() => ({ current: undefined }))
  );

  const unmountRef = useRef(false);
  useUnmount(() => {
    unmountRef.current = true;
  });

  const effects = strategies
    .map(s => {
      if (!s) {
        return undefined;
      }
      return s.effect;
    })
    .filter((e): e is StrategyEffect<any> => !!e)
    .reverse();

  return [
    function callWithStrategy(
      triggerType: TriggerType,
      payload: unknown | undefined,
      variables?: any[]
    ) {
      const runtimeVariables = variables || [];
      const runner = function runner(
        setSessionState?: (s: SessionState<T>) => SessionState<T>
      ) {
        const { state: current, setState } = signal();
        const initialFetchingState = current;
        const fetchingState = setSessionState
          ? setSessionState(initialFetchingState)
          : { ...initialFetchingState, abandon: true };
        if (!fetchingState.abandon) {
          processor.act(() => {
            setState({
              ...fetchingState,
              triggerType
            });
          });
        }
        return sessionRunner(triggerType, payload, runtimeVariables);
      };

      const execute = function execute(
        tType: TriggerType,
        pd: unknown | undefined,
        vars: any[]
      ) {
        return sessionRunner(tType, pd, vars);
      };

      const token = sessionTokens.createToken();
      const requires = {
        getSessionState: () => {
          const s = signal().state;
          const online = !signal.store.isDestroyed();
          return { ...s, online };
        },
        getSessionToken: () => {
          return token;
        },
        getSessionWork: () => {
          return { online: !unmountRef.current };
        },
        abandon(data?: SessionState<T>) {
          return data
            ? { ...data, abandon: true }
            : { ...signal().state, abandon: true };
        },
        variables: runtimeVariables,
        runner,
        execute,
        triggerType,
        config,
        payload,
        localCache: strategyStoreRef,
        executeContext: createRuntimeCache()
      };

      function ifFetching() {
        return !!sessionTokens.getTokens().filter(t => t.status === 'normal')
          .length;
      }

      const roundWork = composeStrategies(strategies)(requires);
      processor.act(() => {
        signal().setState({
          ...signal().state,
          isFetching: ifFetching(),
          roundStatus: 'start'
        });
      });
      return roundWork.then(data => {
        if (token.status !== 'abandon') {
          sessionTokens.removeToken(token);
        }
        const currentState = signal().state;
        const isFetching = ifFetching();
        if (data.abandon) {
          if (!isFetching && currentState.isFetching) {
            processor.act(() => {
              signal().onlyEndIsFetching();
            });
          }
          return { ...currentState, abandon: true };
        }
        processor.act(() => {
          signal().setState({ ...data, isFetching, roundStatus: 'end' });
        });
        return data;
      });
    },
    effects
  ] as const;
}

export function latest(): StrategyType {
  return function latestStrategy(requires): Promise<SessionState> {
    const { runner, localCache, getSessionToken } = requires;
    const token = getSessionToken();
    localCache.current = localCache.current || { version: null, tokens: [] };
    const { tokens } = localCache.current;
    const version = token;
    localCache.current = { version, tokens: [...tokens, token] };
    return runner().then(sessionData => {
      if (localCache.current.version === version) {
        const otherTokens: SessionToken[] = localCache.current.tokens.filter(
          (t: SessionToken) => t !== token
        );
        token.abandon(otherTokens);
        localCache.current = { version: null, tokens: [] };
      }
      return sessionData;
    });
  };
}

export function block(): StrategyType {
  return function blockStrategy(requires): Promise<SessionState> {
    const { runner, localCache, triggerType, abandon } = requires;
    if (triggerType !== 'manual') {
      return runner();
    }
    if (localCache.current) {
      return localCache.current.then((sessionData: SessionState) =>
        abandon(sessionData)
      );
    }
    const promise = runner();
    localCache.current = promise.then((sessionData: SessionState) => {
      localCache.current = undefined;
      return sessionData;
    });
    return promise;
  };
}
