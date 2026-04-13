import type { Model, ModelKey, Store, StoreIndex } from '@airma/react-state';
import type {
  ReactNode,
  ComponentType,
  LazyExoticComponent,
  ExoticComponent
} from 'react';
import type { SessionRequest } from './src/libs/type';

export declare type ModelKeys = ModelKey<any> | StoreIndex;

declare type TriggerType = 'mount' | 'update' | 'manual';

declare type SessionType = 'query' | 'mutation';

declare interface AbstractSessionState {
  data: unknown;
  payload?: unknown;
  stale?: { data: unknown };
  error?: any;
  isError: boolean;
  isFetching: boolean;
  fetchingKey?: unknown;
  finalFetchingKey?: unknown;
  abandon: boolean;
  triggerType: undefined | TriggerType;
  loaded: boolean;
  sessionLoaded: boolean;
  uniqueKey: unknown;
  variables: any[] | undefined;
  round: number;
  visited: boolean;
  lastSuccessfulRound: number;
  lastSuccessfulRoundVariables: any[] | undefined;
  lastFailedRound: number;
  lastFailedRoundVariables: any[] | undefined;
  online: boolean;
}

export declare interface LoadedSessionState<T, V> extends AbstractSessionState {
  data: T;
  variables: V;
  lastSuccessfulRoundVariables: V;
  lastFailedRoundVariables: V | undefined;
  loaded: true;
}

export declare interface UnloadedSessionState extends AbstractSessionState {
  data: undefined;
  variables: undefined;
  lastSuccessfulRoundVariables: undefined;
  lastFailedRoundVariables: undefined;
  loaded: false;
}

export declare interface ErrorSessionState extends AbstractSessionState {
  isError: true;
}

export declare type SessionState<T = any, V extends any[] = any[]> =
  | LoadedSessionState<T, V>
  | UnloadedSessionState;

export declare interface SessionInstance<T = any> {
  state: SessionState<T>;
  request: SessionRequest | undefined;
  setState: (
    s: SessionState<T>
  ) => SessionState<T> & { request?: SessionRequest };
  trigger: () => SessionState<T> & { request?: SessionRequest };
  execute: (variables: any[]) => SessionState<T> & { request?: SessionRequest };
}

export interface SessionToken {
  abandon: (tokens?: SessionToken[]) => any;
  silence: () => any;
}

export declare interface StrategyType<T = any, V extends any[] = any[]> {
  (runtime: {
    getSessionState: () => SessionState<T, V>;
    getSessionToken: () => SessionToken;
    abandon: (data?: SessionState<T, V>) => SessionState<T, V>;
    variables: V;
    triggerType: TriggerType;
    runner: (
      setFetchingSessionState?: (s: SessionState<T, V>) => SessionState<T, V>
    ) => Promise<SessionState<T, V>>;
    localCache: { current: any };
    executeContext: {
      set: (key: any, value: any) => void;
      get: (key: any) => any;
    };
  }): Promise<SessionState<T, V>>;
  effect?:
    | ((
        state: SessionState<T, V>,
        prevState: SessionState<T, V>
      ) => void | (() => void))
    | [
        (
          state: SessionState<T, V>,
          prevState: SessionState<T, V>
        ) => void | (() => void),
        (state: SessionState<T, V>, prevState: SessionState<T, V>) => boolean
      ];
}

declare type PromiseCallback<T> = (...params: any[]) => Promise<T>;

export declare type SessionKey<E extends PromiseCallback<any>> = ModelKey<
  Model,
  undefined
> & {
  sessionPayload: [E, { sessionType?: SessionType }];
};

export declare type SessionStore<E extends PromiseCallback<any>> = Store<
  Model,
  undefined
> & {
  sessionPayload: [E, { sessionType?: SessionType }];
};

export declare interface QuerySessionKey<E extends PromiseCallback<any>>
  extends SessionKey<E> {
  sessionPayload: [E, { sessionType?: 'query' }];
}

export declare interface MutationSessionKey<E extends PromiseCallback<any>>
  extends SessionKey<E> {
  sessionPayload: [E, { sessionType?: 'mutation' }];
}

export declare interface QuerySessionStore<E extends PromiseCallback<any>>
  extends SessionStore<E> {
  sessionPayload: [E, { sessionType?: 'query' }];
}

export declare interface MutationSessionStore<E extends PromiseCallback<any>>
  extends SessionStore<E> {
  sessionPayload: [E, { sessionType?: 'mutation' }];
}

declare interface StrategyConfig<T = any, V extends any[] = any[]> {
  list: (StrategyType<T, V> | null | undefined)[];
  withoutWrapper?: boolean;
  withoutDefault?: boolean;
}

declare type StrategyCollectionType<T = any, V extends any[] = any[]> =
  | undefined
  | null
  | StrategyType<T, V>
  | StrategyConfig<T, V>
  | (StrategyType<T, V> | null | undefined)[];

declare type QueryConfig<T, C extends PromiseCallback<T>> = {
  deps?: any[];
  triggerOn?: TriggerType[];
  variables?: Parameters<C>;
  strategy?: StrategyCollectionType<T, Parameters<C>>;
  ignoreStrategyWrapper?: boolean;
  manual?: boolean;
  payload?: unknown;
};

declare type DefaultQueryConfig<T, C extends PromiseCallback<T>> = QueryConfig<
  T,
  C
> &
  (
    | {
        defaultData: T;
      }
    | {
        defaultData?: T;
        loaded: true;
      }
  );

declare type MutationConfig<T, C extends PromiseCallback<T>> = {
  deps?: any[];
  triggerOn?: TriggerType[];
  variables?: Parameters<C>;
  strategy?: StrategyCollectionType<T, Parameters<C>>;
  ignoreStrategyWrapper?: boolean;
  payload?: unknown;
};

declare type DefaultMutationConfig<
  T,
  C extends PromiseCallback<T>
> = MutationConfig<T, C> &
  (
    | {
        defaultData: T;
      }
    | {
        defaultData?: T;
        loaded: true;
      }
  );

declare interface SessionCreation<E extends PromiseCallback<any>>
  extends StoreIndex<(state: SessionState) => SessionInstance, undefined> {
  key: SessionKey<E>;
}

declare type PCR<
  T extends
    | PromiseCallback<any>
    | SessionKey<any>
    | SessionStore<any>
    | SessionCreation<any>
> =
  T extends SessionKey<infer C>
    ? PCR<C>
    : T extends PromiseCallback<infer R>
      ? R
      : T extends SessionStore<infer S>
        ? PCR<S>
        : T extends SessionCreation<infer L>
          ? PCR<L>
          : never;

declare type MCC<
  T extends
    | PromiseCallback<any>
    | SessionKey<any>
    | SessionStore<any>
    | SessionCreation<any>
> =
  T extends SessionKey<infer C>
    ? C
    : T extends PromiseCallback<any>
      ? T
      : T extends SessionStore<infer S>
        ? S
        : T extends SessionCreation<infer L>
          ? L
          : never;

declare type LoadedSessionResult<
  D extends
    | PromiseCallback<any>
    | SessionKey<any>
    | SessionStore<any>
    | SessionCreation<any>
> = [
  LoadedSessionState<PCR<D>, Parameters<MCC<D>>>,
  {
    (): Promise<LoadedSessionState<PCR<D>, Parameters<MCC<D>>>>;
    payload: (
      payloadData: unknown | undefined
    ) => () => Promise<LoadedSessionState<PCR<D>, Parameters<MCC<D>>>>;
  },
  {
    (
      ...variables: Parameters<MCC<D>>
    ): Promise<LoadedSessionState<PCR<D>, Parameters<MCC<D>>>>;
    payload: (
      payloadData: unknown | undefined
    ) => (
      ...variables: Parameters<MCC<D>>
    ) => Promise<LoadedSessionState<PCR<D>, Parameters<MCC<D>>>>;
  }
];

declare type SessionResult<
  D extends
    | PromiseCallback<any>
    | SessionKey<any>
    | SessionStore<any>
    | SessionCreation<any>
> = [
  SessionState<PCR<D>, Parameters<MCC<D>>>,
  {
    (): Promise<SessionState<PCR<D>, Parameters<MCC<D>>>>;
    payload: (
      payloadData: unknown | undefined
    ) => () => Promise<SessionState<PCR<D>, Parameters<MCC<D>>>>;
  },
  {
    (
      ...variables: Parameters<MCC<D>>
    ): Promise<SessionState<PCR<D>, Parameters<MCC<D>>>>;
    payload: (
      payloadData: unknown | undefined
    ) => (
      ...variables: Parameters<MCC<D>>
    ) => Promise<SessionState<PCR<D>, Parameters<MCC<D>>>>;
  }
];

declare type AbstractSessionResult = [
  SessionState,
  () => any,
  ((...variables: any[]) => Promise<SessionState>)?
];

export declare function useQuery<
  D extends
    | PromiseCallback<any>
    | SessionKey<any>
    | SessionStore<any>
    | SessionCreation<any>
>(
  callback: D,
  config: DefaultQueryConfig<PCR<D>, MCC<D>>
): D extends MutationSessionKey<any> | MutationSessionStore<any>
  ? never
  : LoadedSessionResult<D>;
export declare function useQuery<
  D extends
    | PromiseCallback<any>
    | SessionKey<any>
    | SessionStore<any>
    | SessionCreation<any>
>(
  callback: D,
  config?: QueryConfig<PCR<D>, MCC<D>> | Parameters<MCC<D>>
): D extends MutationSessionKey<any> | MutationSessionStore<any>
  ? never
  : SessionResult<D>;

export declare function useMutation<
  D extends
    | PromiseCallback<any>
    | SessionKey<any>
    | SessionStore<any>
    | SessionCreation<any>
>(
  callback: D,
  config: DefaultMutationConfig<PCR<D>, MCC<D>>
): D extends QuerySessionKey<any> | QuerySessionStore<any>
  ? never
  : LoadedSessionResult<D>;
export declare function useMutation<
  D extends
    | PromiseCallback<any>
    | SessionKey<any>
    | SessionStore<any>
    | SessionCreation<any>
>(
  callback: D,
  config?: MutationConfig<PCR<D>, MCC<D>> | Parameters<MCC<D>>
): D extends QuerySessionKey<any> | QuerySessionStore<any>
  ? never
  : SessionResult<D>;

declare interface UseSessionConfig {
  sessionType?: SessionType;
}

declare interface LoadedUseSessionConfig extends UseSessionConfig {
  loaded: true;
}

declare interface UnloadedUseSessionConfig extends UseSessionConfig {
  loaded?: false;
}

export declare function useSession<
  D extends SessionKey<any> | SessionStore<any> | SessionCreation<any>
>(sessionKeyOrStore: D, config: LoadedUseSessionConfig): LoadedSessionResult<D>;
export declare function useSession<
  D extends SessionKey<any> | SessionStore<any> | SessionCreation<any>
>(sessionKeyOrStore: D, config: SessionType): SessionResult<D>;
export declare function useSession<
  D extends SessionKey<any> | SessionStore<any> | SessionCreation<any>
>(sessionKeyOrStore: D, config?: UnloadedUseSessionConfig): SessionResult<D>;
export declare function useSession<
  D extends SessionKey<any> | SessionStore<any> | SessionCreation<any>
>(
  sessionKeyOrStore: D,
  config?: { loaded?: boolean; sessionType?: SessionType } | SessionType
): SessionResult<D>;

export declare function useLoadedSession<
  D extends SessionKey<any> | SessionStore<any> | SessionCreation<any>
>(
  sessionKeyOrStore: D,
  config?: UseSessionConfig | SessionType
): LoadedSessionResult<D>;

export declare function createSessionKey<
  E extends (...params: any[]) => Promise<any>
>(effectCallback: E): SessionKey<E>;
export declare function createSessionKey<
  E extends (...params: any[]) => Promise<any>
>(effectCallback: E, sessionType: 'query'): QuerySessionKey<E>;
export declare function createSessionKey<
  E extends (...params: any[]) => Promise<any>
>(effectCallback: E, sessionType: 'mutation'): MutationSessionKey<E>;

export declare function createSessionStore<
  E extends (...params: any[]) => Promise<any>
>(effectCallback: E): SessionStore<E>;
export declare function createSessionStore<
  E extends (...params: any[]) => Promise<any>
>(effectCallback: E, sessionType: 'query'): QuerySessionStore<E>;
export declare function createSessionStore<
  E extends (...params: any[]) => Promise<any>
>(effectCallback: E, sessionType: 'mutation'): MutationSessionStore<E>;

export declare function useIsFetching(
  ...sessionStates: (AbstractSessionState | AbstractSessionResult)[]
): boolean;

declare type LazyComponentSupportType<P> =
  | ComponentType<P>
  | ExoticComponent<P>;

declare type CheckLazyComponentSupportType<
  T extends LazyComponentSupportType<any>
> =
  T extends LazyComponentSupportType<infer P>
    ? P extends { error?: ErrorSessionState }
      ? LazyExoticComponent<T>
      : never
    : never;

export declare function useLazyComponent<
  T extends LazyComponentSupportType<any>
>(
  componentLoader: () => Promise<T | { default: T }>,
  ...deps: (AbstractSessionState | AbstractSessionResult)[]
): CheckLazyComponentSupportType<T>;

declare type ImportantVariable<T extends SessionState> = Omit<
  T,
  'variables'
> & {
  variables: Exclude<T['variables'], undefined>;
};

declare type SuccessStateOf<T extends SessionState> = Omit<
  T,
  'variables' | 'data'
> & {
  variables: Exclude<T['variables'], undefined>;
  data: Exclude<T['data'], undefined>;
};

declare type ResponseOption = { watchOnly?: boolean };

export declare const useResponse: {
  <T extends SessionState>(
    process: (state: ImportantVariable<T>) => void | (() => void),
    sessionState: T | [T, ResponseOption?]
  ): void;
  useSuccess: <T extends SessionState>(
    process: (
      data: SuccessStateOf<T>['data'],
      sessionState: SuccessStateOf<T>
    ) => void | (() => void),
    sessionState: T | [T, ResponseOption?]
  ) => void;
  useFailure: <T extends SessionState>(
    process: (
      error: unknown,
      sessionState: ImportantVariable<T>
    ) => void | (() => void),
    sessionState: T | [T, ResponseOption?]
  ) => void;
};

export declare const Provider: FC<{
  value:
    | Array<
        | StoreIndex<Model, any>
        | ModelKey<Model, any>
        | Record<string, StoreIndex<Model, any>>
        | Record<string, ModelKey<Model, any>>
      >
    | Record<string, StoreIndex<Model, any>>
    | Record<string, ModelKey<Model, any>>;
  children?: ReactNode;
}>;

export declare type GlobalConfig = {
  batchUpdate?: (callback: () => void) => void;
  experience?: 'next';
  test?: {
    act: (callback: () => any) => any;
  };
  strategy?: (
    strategy: (StrategyType | null | undefined)[],
    type: SessionType
  ) => (StrategyType | null | undefined)[];
};

export declare const ConfigProvider: FC<{
  value: GlobalConfig;
  children?: ReactNode;
}>;

export declare type HostStage = 'mounted' | 'unmounted';

export declare const Strategy: {
  atomic: <T = any, V extends any[] = any[]>(op?: {
    throttle?: boolean;
    stopWhenError?: boolean;
  }) => StrategyType<T, V>;
  cache: <T = any, V extends any[] = any[]>(op?: {
    key?: (vars: V) => string;
    staleTime?: number;
    capacity?: number;
    static?: boolean;
  }) => StrategyType<T, V>;
  debounce: <T = any, V extends any[] = any[]>(
    op: { duration: number; lead?: boolean } | number
  ) => StrategyType<T, V>;
  /**
   * @deprecated
   * @param op
   */
  throttle: <T = any, V extends any[] = any[]>(
    op?: { duration: number } | number
  ) => StrategyType<T, V>;
  once: <T = any, V extends any[] = any[]>() => StrategyType<T, V>;
  failure: <T = any, V extends any[] = any[]>(
    process: (
      e: unknown,
      sessionData: ImportantVariable<SessionState<T, V>>
    ) => any,
    option?: { withAbandoned?: boolean }
  ) => StrategyType<T, V>;
  success: <T = any, V extends any[] = any[]>(
    process: (data: T, sessionData: SuccessStateOf<SessionState<T, V>>) => any,
    option?: { withAbandoned?: boolean }
  ) => StrategyType<T, V>;
  validate: <T = any, V extends any[] = any[]>(
    process: (
      variables: V,
      isOnline: () => boolean
    ) => boolean | Promise<boolean>
  ) => StrategyType<T, V>;
  memo: <T = any, V extends any[] = any[]>(
    equalFn?: (source: T | undefined, target: T) => boolean
  ) => StrategyType<T, V>;
  reduce: <T = any, V extends any[] = any[]>(
    call: (
      previous: T | undefined,
      currentData: T,
      states: [
        SessionState<T | undefined, V>,
        SuccessStateOf<SessionState<T, V>>
      ]
    ) => T | undefined
  ) => StrategyType<T, V>;
  response: {
    <T = any, V extends any[] = any[]>(
      process: (
        state: ImportantVariable<SessionState<T, V>>
      ) => void | (() => void)
    ): StrategyType<T, V>;
    success: <T = any, V extends any[] = any[]>(
      process: (
        data: T,
        sessionData: SuccessStateOf<SessionState<T, V>>
      ) => void | (() => void)
    ) => StrategyType<T, V>;
    failure: <T = any, V extends any[] = any[]>(
      process: (
        e: unknown,
        sessionData: ImportantVariable<SessionState<T, V>>
      ) => void | (() => void)
    ) => StrategyType<T, V>;
  };
};

export declare function provide(
  ...storeCreators: (
    | StoreIndex<Model, any>
    | ModelKey<Model, any>
    | Record<string, StoreIndex<Model, any>>
    | Record<string, ModelKey<Model, any>>
    | Record<number, StoreIndex<Model, any>>
    | Record<number, ModelKey<Model, any>>
  )[]
): {
  <P extends Record<string, any>>(
    component: ComponentType<P> | ExoticComponent<P>
  ): typeof component;
  to: <P extends Record<string, any>>(
    component: ComponentType<P> | ExoticComponent<P>
  ) => typeof component;
};

/** new api * */

declare interface DefaultDataQueryConfig<T, C extends PromiseCallback<T>>
  extends QueryConfig<T, C> {
  defaultData: T;
}

declare type UseQueryShort<
  D extends PromiseCallback<any> | SessionKey<any> | SessionStore<any>
> = <
  C extends
    | QueryConfig<PCR<D>, MCC<D>>
    | Parameters<MCC<D>>
    | DefaultQueryConfig<PCR<D>, MCC<D>>
>(
  config?: C
) => C extends DefaultQueryConfig<PCR<D>, MCC<D>>
  ? LoadedSessionResult<D>
  : SessionResult<D>;

declare type UseMutationShort<
  D extends PromiseCallback<any> | SessionKey<any> | SessionStore<any>
> = <
  C extends
    | MutationConfig<PCR<D>, MCC<D>>
    | Parameters<MCC<D>>
    | DefaultMutationConfig<PCR<D>, MCC<D>>
>(
  config?: C
) => C extends DefaultMutationConfig<PCR<D>, MCC<D>>
  ? LoadedSessionResult<D>
  : SessionResult<D>;

declare type UseSessionShort<D extends PromiseCallback<any>> =
  () => SessionResult<D>;

declare type UseLoadedSessionShort<D extends PromiseCallback<any>> =
  () => LoadedSessionResult<D>;

declare interface SessionKeyApi<D extends PromiseCallback<any>>
  extends SessionCreation<D> {
  useSession: UseSessionShort<D>;
  useLoadedSession: UseLoadedSessionShort<D>;
}

declare interface SessionStoreApi<D extends PromiseCallback<any>>
  extends SessionCreation<D> {
  useSession: UseSessionShort<D>;
  useLoadedSession: UseLoadedSessionShort<D>;
}

declare interface QueryKeyApi<D extends PromiseCallback<any>>
  extends SessionKeyApi<D> {
  useQuery: UseQueryShort<D>;
}

declare interface QueryStoreApi<D extends PromiseCallback<any>>
  extends SessionStoreApi<D> {
  useQuery: UseQueryShort<D>;
}

declare interface MutationKeyApi<D extends PromiseCallback<any>>
  extends SessionKeyApi<D> {
  useMutation: UseMutationShort<D>;
}

declare interface MutationStoreApi<D extends PromiseCallback<any>>
  extends SessionStoreApi<D> {
  useMutation: UseMutationShort<D>;
}

export declare function session<D extends PromiseCallback<any>>(
  sessionCallback: D,
  sessionType: 'query'
): {
  (...p: Parameters<D>): ReturnType<D>;
  useQuery: UseQueryShort<D>;
  createStore: () => QueryStoreApi<D>;
  createKey: () => QueryKeyApi<D>;
};
export declare function session<D extends PromiseCallback<any>>(
  sessionCallback: D,
  sessionType: 'mutation'
): {
  (...p: Parameters<D>): ReturnType<D>;
  useMutation: UseMutationShort<D>;
  createStore: () => MutationStoreApi<D>;
  createKey: () => MutationKeyApi<D>;
};
