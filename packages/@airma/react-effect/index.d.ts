import { ModelKeys, ModelKey } from '@airma/react-state';
import {
  FunctionComponent,
  FC,
  NamedExoticComponent,
  ReactNode,
  ComponentType,
  LazyExoticComponent,
  ExoticComponent
} from 'react';

declare type TriggerType = 'mount' | 'update' | 'manual';

declare type SessionType = 'query' | 'mutation';

declare interface AbstractSessionState {
  data: unknown;
  variables: any[] | undefined;
  error?: any;
  isError: boolean;
  isFetching: boolean;
  fetchingKey?: unknown;
  finalFetchingKey?: unknown;
  abandon: boolean;
  triggerType: undefined | TriggerType;
  loaded: boolean;
  sessionLoaded: boolean;
}

export declare interface LoadedSessionState<T> extends AbstractSessionState {
  data: T;
  variables: any[] | undefined;
  loaded: true;
}

export declare interface UnloadedSessionState extends AbstractSessionState {
  data: undefined;
  variables: any[] | undefined;
  loaded: false;
}

export declare interface ErrorSessionState extends AbstractSessionState {
  isError: true;
}

export declare type SessionState<T> =
  | LoadedSessionState<T>
  | UnloadedSessionState;

export declare type StrategyType<T = any> = (runtime: {
  current: () => SessionState<T>;
  variables: any[];
  runner: () => Promise<SessionState<T>>;
  store: { current: any };
  runtimeCache: {
    set: (key: any, value: any) => void;
    get: (key: any) => any;
  };
}) => Promise<SessionState<T>>;

declare type PromiseCallback<T> = (...params: any[]) => Promise<T>;

export declare type SessionKey<E extends PromiseCallback<any>> = ModelKey<
  (st: SessionState & { version?: number }) => {
    state: SessionState;
    version: number;
    setState: (s: SessionState) => SessionState & { version?: number };
    trigger: () => SessionState & { version?: number };
  }
> & {
  effect: [E, { sessionType?: SessionType }];
  implement: (c: E) => void;
};

export declare interface QuerySessionKey<E extends PromiseCallback<any>>
  extends SessionKey<E> {
  effect: [E, { sessionType?: 'query' }];
}

export declare interface MutationSessionKey<E extends PromiseCallback<any>>
  extends SessionKey<E> {
  effect: [E, { sessionType?: 'mutation' }];
}

declare type StrategyCollectionType<T> =
  | undefined
  | null
  | StrategyType<T>
  | (StrategyType<T> | null | undefined)[];

declare type QueryConfig<T, C extends PromiseCallback<T>> = {
  deps?: any[];
  triggerOn?: TriggerType[];
  variables?: Parameters<C>;
  strategy?: StrategyCollectionType<T>;
  manual?: boolean;
};

declare type DefaultQueryConfig<T, C extends PromiseCallback<T>> = QueryConfig<
  T,
  C
> & {
  defaultData: T;
};

declare type MutationConfig<T, C extends PromiseCallback<T>> = {
  deps?: any[];
  triggerOn?: TriggerType[];
  variables?: Parameters<C>;
  strategy?: StrategyCollectionType<T>;
};

declare type DefaultMutationConfig<
  T,
  C extends PromiseCallback<T>
> = MutationConfig<T, C> & {
  defaultData: T;
};

declare type PCR<T extends PromiseCallback<any> | SessionKey<any>> =
  T extends PromiseCallback<infer R>
    ? R
    : T extends SessionKey<infer C>
    ? PCR<C>
    : never;

declare type MCC<T extends PromiseCallback<any> | SessionKey<any>> =
  T extends PromiseCallback<any>
    ? T
    : T extends SessionKey<infer C>
    ? C
    : never;

declare type LoadedSessionResult<
  D extends PromiseCallback<any> | SessionKey<any>
> = [
  LoadedSessionState<PCR<D>>,
  () => Promise<LoadedSessionState<PCR<D>>>,
  (...variables: Parameters<MCC<D>>) => Promise<LoadedSessionState<PCR<D>>>
];

declare type SessionResult<D extends PromiseCallback<any> | SessionKey<any>> = [
  SessionState<PCR<D>>,
  () => Promise<SessionState<PCR<D>>>,
  (...variables: Parameters<MCC<D>>) => Promise<SessionState<PCR<D>>>
];

declare type AbstractSessionResult = [
  SessionState,
  () => any,
  ((...variables: any[]) => Promise<SessionState>)?
];

export declare function useQuery<
  D extends PromiseCallback<any> | SessionKey<any>
>(
  callback: D,
  config: DefaultQueryConfig<PCR<D>, MCC<D>>
): D extends MutationSessionKey<any> ? never : LoadedSessionResult<D>;
export declare function useQuery<
  D extends PromiseCallback<any> | SessionKey<any>
>(
  callback: D,
  config?: QueryConfig<PCR<D>, MCC<D>> | Parameters<MCC<D>>
): D extends MutationSessionKey<any> ? never : SessionResult<D>;

export declare function useMutation<
  D extends PromiseCallback<any> | SessionKey<any>
>(
  callback: D,
  config: DefaultMutationConfig<PCR<D>, MCC<D>>
): D extends QuerySessionKey<any> ? never : LoadedSessionResult<D>;
export declare function useMutation<
  D extends PromiseCallback<any> | SessionKey<any>
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

export declare function useSession<D extends SessionKey<any>>(
  factory: D,
  config: LoadedUseSessionConfig
): [LoadedSessionState<PCR<D>>, () => void];
export declare function useSession<D extends SessionKey<any>>(
  factory: D,
  config: SessionType
): [SessionState<PCR<D>>, () => void];
export declare function useSession<D extends SessionKey<any>>(
  factory: D,
  config?: UnloadedUseSessionConfig
): [SessionState<PCR<D>>, () => void];
export declare function useSession<D extends SessionKey<any>>(
  factory: D,
  config?: { loaded?: boolean; sessionType?: SessionType } | SessionType
): [SessionState<PCR<D>>, () => void];

export declare function useLoadedSession<D extends SessionKey<any>>(
  factory: D,
  config?: UseSessionConfig | SessionType
): [LoadedSessionState<PCR<D>>, () => void];

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

export declare const SessionProvider: FC<
  | {
      keys: ModelKeys;
      children?: ReactNode;
    }
  | {
      value: ModelKeys;
      children?: ReactNode;
    }
>;

export declare type GlobalConfig = {
  strategy?: (
    strategy: (StrategyType | null | undefined)[],
    type: SessionType
  ) => (StrategyType | null | undefined)[];
};

export declare const GlobalSessionProvider: FC<{
  config?: GlobalConfig;
  keys?: ModelKeys;
  children?: ReactNode;
}>;

/**
 * @deprecated
 * @param keys
 */
export declare function withSessionProvider(
  keys: ModelKeys
): <P extends Record<string, any>>(
  component: FunctionComponent<P> | NamedExoticComponent<P>
) => typeof component;

export declare const Strategy: {
  debounce: (op: { duration: number } | number) => StrategyType;
  throttle: (op: { duration: number } | number) => StrategyType;
  once: () => StrategyType;
  error: (
    process: (e: unknown, sessionData: SessionState) => any,
    option?: { withAbandoned?: boolean }
  ) => StrategyType;
  success: <T>(
    process: (data: T, sessionData: SessionState<T>) => any,
    option?: { withAbandoned?: boolean }
  ) => StrategyType<T>;
  validate: (process: () => boolean) => StrategyType;
  memo: <T>(
    equalFn?: (source: T | undefined, target: T) => boolean
  ) => StrategyType<T>;
};

export declare function provide(
  keys: ModelKeys
): <P extends Record<string, any>>(
  component: FunctionComponent<P> | NamedExoticComponent<P>
) => typeof component;
