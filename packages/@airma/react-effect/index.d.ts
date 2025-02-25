import {
  ModelKeys,
  ModelKey,
  ModelLike,
  ModelCreation
} from '@airma/react-state';
import {
  FunctionComponent,
  ReactNode,
  ComponentType,
  LazyExoticComponent,
  ExoticComponent
} from 'react';

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

export declare interface StrategyType<T = any, V extends any[] = any[]> {
  (runtime: {
    getSessionState: () => SessionState<T, V>;
    getStage: () => 'mounted' | 'unmounted';
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

export declare interface SessionKey<
  E extends PromiseCallback<any>
> extends ModelKey<
    (st: SessionState & { version?: number }) => {
      state: SessionState;
      version: number;
      setState: (s: SessionState) => SessionState & { version?: number };
      trigger: () => SessionState & { version?: number };
    }
  > {
  payload: [E, { sessionType?: SessionType }];
}

export declare interface QuerySessionKey<E extends PromiseCallback<any>>
  extends SessionKey<E> {
  payload: [E, { sessionType?: 'query' }];
}

export declare interface MutationSessionKey<E extends PromiseCallback<any>>
  extends SessionKey<E> {
  payload: [E, { sessionType?: 'mutation' }];
}

declare type StrategyCollectionType<T = any, V extends any[] = any[]> =
  | undefined
  | null
  | StrategyType<T, V>
  | (StrategyType<T, V> | null | undefined)[];

declare type QueryConfig<T, C extends PromiseCallback<T>> = {
  deps?: any[];
  triggerOn?: TriggerType[];
  variables?: Parameters<C>;
  strategy?: StrategyCollectionType<T, Parameters<C>>;
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
  extends ModelCreation {
  key: SessionKey<E>;
}

declare type PCR<
  T extends PromiseCallback<any> | SessionKey<any> | SessionCreation<any>
> = T extends PromiseCallback<infer R>
  ? R
  : T extends SessionKey<infer C>
  ? PCR<C>
  : T extends SessionCreation<infer L>
  ? PCR<L>
  : never;

declare type MCC<
  T extends PromiseCallback<any> | SessionKey<any> | SessionCreation<any>
> = T extends PromiseCallback<any>
  ? T
  : T extends SessionKey<infer C>
  ? C
  : T extends SessionCreation<infer L>
  ? L
  : never;

declare type LoadedSessionResult<
  D extends PromiseCallback<any> | SessionKey<any> | SessionCreation<any>
> = [
  LoadedSessionState<PCR<D>, Parameters<MCC<D>>>,
  {
    (): Promise<LoadedSessionState<PCR<D>, Parameters<MCC<D>>>>;
    payload: (
      payloadData: unknown | undefined
    ) => () => Promise<LoadedSessionState<PCR<D>, Parameters<MCC<D>>>>;
  },
  {
    (...variables: Parameters<MCC<D>>): Promise<
      LoadedSessionState<PCR<D>, Parameters<MCC<D>>>
    >;
    payload: (
      payloadData: unknown | undefined
    ) => (
      ...variables: Parameters<MCC<D>>
    ) => Promise<LoadedSessionState<PCR<D>, Parameters<MCC<D>>>>;
  }
];

declare type SessionResult<
  D extends PromiseCallback<any> | SessionKey<any> | SessionCreation<any>
> = [
  SessionState<PCR<D>, Parameters<MCC<D>>>,
  {
    (): Promise<SessionState<PCR<D>, Parameters<MCC<D>>>>;
    payload: (
      payloadData: unknown | undefined
    ) => () => Promise<SessionState<PCR<D>, Parameters<MCC<D>>>>;
  },
  {
    (...variables: Parameters<MCC<D>>): Promise<
      SessionState<PCR<D>, Parameters<MCC<D>>>
    >;
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
  D extends PromiseCallback<any> | SessionKey<any> | SessionCreation<any>
>(
  callback: D,
  config: DefaultQueryConfig<PCR<D>, MCC<D>>
): D extends MutationSessionKey<any> ? never : LoadedSessionResult<D>;
export declare function useQuery<
  D extends PromiseCallback<any> | SessionKey<any> | SessionCreation<any>
>(
  callback: D,
  config?: QueryConfig<PCR<D>, MCC<D>> | Parameters<MCC<D>>
): D extends MutationSessionKey<any> ? never : SessionResult<D>;

export declare function useMutation<
  D extends PromiseCallback<any> | SessionKey<any> | SessionCreation<any>
>(
  callback: D,
  config: DefaultMutationConfig<PCR<D>, MCC<D>>
): D extends QuerySessionKey<any> ? never : LoadedSessionResult<D>;
export declare function useMutation<
  D extends PromiseCallback<any> | SessionKey<any> | SessionCreation<any>
>(
  callback: D,
  config?: MutationConfig<PCR<D>, MCC<D>> | Parameters<MCC<D>>
): D extends QuerySessionKey<any> ? never : SessionResult<D>;

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
  D extends SessionKey<any> | SessionCreation<any>
>(sessionKey: D, config: LoadedUseSessionConfig): LoadedSessionResult<D>;
export declare function useSession<
  D extends SessionKey<any> | SessionCreation<any>
>(sessionKey: D, config: SessionType): SessionResult<D>;
export declare function useSession<
  D extends SessionKey<any> | SessionCreation<any>
>(sessionKey: D, config?: UnloadedUseSessionConfig): SessionResult<D>;
export declare function useSession<
  D extends SessionKey<any> | SessionCreation<any>
>(
  sessionKey: D,
  config?: { loaded?: boolean; sessionType?: SessionType } | SessionType
): SessionResult<D>;

export declare function useLoadedSession<
  D extends SessionKey<any> | SessionCreation<any>
>(
  sessionKey: D,
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

export declare function useIsFetching(
  ...sessionStates: (AbstractSessionState | AbstractSessionResult)[]
): boolean;

declare type LazyComponentSupportType<P> =
  | ComponentType<P>
  | ExoticComponent<P>;

declare type CheckLazyComponentSupportType<
  T extends LazyComponentSupportType<any>
> = T extends LazyComponentSupportType<infer P>
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

export declare const Provider: FunctionComponent<
  | {
      value: ModelKeys;
      children?: ReactNode;
    }
  | {
      keys: ModelKeys;
      children?: ReactNode;
    }
  | {
      storeCreators: ModelKeys;
      children?: ReactNode;
    }
>;

export declare type GlobalConfig = {
  batchUpdate?: (callback: () => void) => void;
  experience?: 'next';
  strategy?: (
    strategy: (StrategyType | null | undefined)[],
    type: SessionType
  ) => (StrategyType | null | undefined)[];
};

export declare const ConfigProvider: FunctionComponent<{
  value: GlobalConfig;
  children?: ReactNode;
}>;

export declare type HostStage = 'mounted' | 'unmounted';

export declare const Strategy: {
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
  /**
   * @deprecated
   * @param process
   * @param option
   */
  error: <T = any, V extends any[] = any[]>(
    process: (
      e: unknown,
      sessionData: ImportantVariable<SessionState<T, V>>
    ) => any,
    option?: { withAbandoned?: boolean }
  ) => StrategyType<T, V>;
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
    /**
     * @deprecated
     * @param process
     */
    error: <T = any, V extends any[] = any[]>(
      process: (
        e: unknown,
        sessionData: ImportantVariable<SessionState<T, V>>
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

export declare function provide(...storeCreators: ModelKeys[]): {
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

declare type UseQueryShort<D extends PromiseCallback<any> | SessionKey<any>> = <
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
  D extends PromiseCallback<any> | SessionKey<any>
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
  /**
   * @deprecated not recommend
   * @param key
   */
  with: <M extends ModelKey<ModelLike>>(
    ...key: ({ key: M } | M)[]
  ) => SessionStoreApi<D>;
  /**
   * @deprecated not recommend
   */
  provide: <P>() => (
    component: ComponentType<P> | ExoticComponent<P>
  ) => typeof component;
  /**
   * @deprecated not recommend
   */
  provideTo: <P>(
    component: ComponentType<P> | ExoticComponent<P>
  ) => typeof component;
  /**
   * @deprecated not recommend
   */
  Provider: FunctionComponent<{ children?: ReactNode }>;
}

declare interface QueryKeyApi<D extends PromiseCallback<any>>
  extends SessionKeyApi<D> {
  useQuery: UseQueryShort<D>;
}

declare interface StaticQuery<D extends PromiseCallback<any>>
  extends SessionCreation<D> {
  useQuery: UseQueryShort<D>;
  useSession: UseSessionShort<D>;
  useLoadedSession: UseLoadedSessionShort<D>;
}

declare interface QueryStoreApi<D extends PromiseCallback<any>>
  extends SessionStoreApi<D> {
  useQuery: UseQueryShort<D>;
  /**
   * @deprecated should remove
   */
  static: () => StaticQuery<D>;
}

declare interface MutationKeyApi<D extends PromiseCallback<any>>
  extends SessionKeyApi<D> {
  useMutation: UseMutationShort<D>;
}

declare interface StaticMutation<D extends PromiseCallback<any>>
  extends SessionCreation<D> {
  useMutation: UseMutationShort<D>;
  useSession: UseSessionShort<D>;
  useLoadedSession: UseLoadedSessionShort<D>;
}

declare interface MutationStoreApi<D extends PromiseCallback<any>>
  extends SessionStoreApi<D> {
  useMutation: UseMutationShort<D>;
  /**
   * @deprecated
   */
  static: () => StaticMutation<D>;
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
