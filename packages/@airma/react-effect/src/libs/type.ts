import { ModelKey, ModelKeys } from '@airma/react-state';
import {
  ComponentType,
  ExoticComponent,
  LazyExoticComponent,
  ReactNode
} from 'react';

type PCR<T extends PromiseCallback<any> | SessionKey<any>> =
  T extends PromiseCallback<infer R>
    ? R
    : T extends SessionKey<infer C>
    ? PCR<C>
    : never;

type MCC<T extends PromiseCallback<any> | SessionKey<any>> =
  T extends PromiseCallback<any>
    ? T
    : T extends SessionKey<infer C>
    ? C
    : never;

export type LazyComponentSupportType<P> = ComponentType<P> | ExoticComponent<P>;

export type PromiseCallback<T> = (...params: any[]) => Promise<T>;

export type SessionType = 'query' | 'mutation';

export type SessionRequest = {
  version: number;
  variables?: any[];
};

export type SessionKey<E extends PromiseCallback<any>> = ModelKey<
  (st: SessionState & { request?: SessionRequest }) => {
    state: SessionState;
    request: SessionRequest | undefined;
    setState: (s: SessionState) => SessionState & { request?: SessionRequest };
    trigger: () => SessionState & { request?: SessionRequest };
    execute: (variables: any[]) => SessionState & { request?: SessionRequest };
  }
> & {
  payload: [E, { sessionType?: SessionType }];
};

export interface QuerySessionKey<E extends PromiseCallback<any>>
  extends SessionKey<E> {
  payload: [E, { sessionType?: 'query' }];
}

export interface MutationSessionKey<E extends PromiseCallback<any>>
  extends SessionKey<E> {
  payload: [E, { sessionType?: 'mutation' }];
}

export type TriggerType = 'mount' | 'update' | 'manual';

export type PromiseData<T = any> = {
  data?: T | undefined;
  variables: any[];
  payload: unknown | undefined;
  error?: any;
  isError?: boolean;
};

type SessionCache = [string, { data: any; lastUpdateTime: number }];

export interface AbstractSessionState {
  data: unknown;
  stale?: { data: unknown };
  variables: any[] | undefined;
  payload?: unknown;
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
  round: number;
  cache: SessionCache[];
  maxCacheCapacity: number;
  executeVariables: any[] | undefined;
  visited: boolean;
  lastSuccessfulRoundVariables: any[] | undefined;
  lastFailedRoundVariables: any[] | undefined;
  lastSuccessfulRound: number;
  lastFailedRound: number;
  online: boolean;
}

interface LoadedSessionState<T> extends AbstractSessionState {
  data: T;
  variables: any[] | undefined;
  loaded: true;
}

interface UnloadedSessionState extends AbstractSessionState {
  data: undefined;
  variables: any[] | undefined;
  loaded: false;
}

interface ErrorSessionState extends AbstractSessionState {
  isError: true;
}

export type SessionState<T = any> =
  | LoadedSessionState<T>
  | UnloadedSessionState;

export type CheckLazyComponentSupportType<
  T extends LazyComponentSupportType<any>
> = T extends LazyComponentSupportType<infer P>
  ? P extends { error?: ErrorSessionState }
    ? LazyExoticComponent<T>
    : never
  : never;

export type StrategyEffect<T> =
  | ((
      state: SessionState<T>,
      prevState: SessionState<T>,
      config: QueryConfig<T, any>
    ) => void | (() => void))
  | [
      (
        state: SessionState<T>,
        prevState: SessionState<T>,
        config: QueryConfig<T, any>
      ) => void | (() => void),
      (state: SessionState<T>, prevState: SessionState<T>) => boolean
    ];

export interface StrategyType<T = any> {
  (value: {
    getSessionState: () => SessionState<T>;
    variables: any[];
    config: QueryConfig<T, any>;
    runner: (
      setFetchingSessionState?: (s: SessionState<T>) => SessionState<T>
    ) => Promise<SessionState<T>>;
    localCache: { current: any };
    triggerType: TriggerType;
    executeContext: {
      set: (key: any, value: any) => void;
      get: (key: any) => any;
    };
  }): Promise<SessionState<T>>;
  effect?: StrategyEffect<T>;
}

export type StrategyEffectDestroy<T = any> = [
  () => void,
  (s: SessionState<T>, p: SessionState<T>) => boolean
];

export type StrategyCollectionType<T = any> =
  | undefined
  | null
  | StrategyType<T>
  | (StrategyType<T> | null | undefined)[];

export type KeyBy<C extends PromiseCallback<any>> = (
  variables: Parameters<C>
) => string;

export type QueryConfig<T, C extends PromiseCallback<T>> = {
  deps?: any[];
  triggerOn?: TriggerType[];
  defaultData?: T;
  variables?: Parameters<C>;
  strategy?: StrategyCollectionType<T>;
  loaded?: boolean;
  manual?: boolean;
  payload?: unknown;
  experience?: 'next';
};

export type MutationConfig<T, C extends PromiseCallback<T>> = {
  defaultData?: T;
  deps?: any[];
  triggerOn?: TriggerType[];
  variables?: Parameters<C>;
  strategy?: StrategyCollectionType<T>;
  loaded?: boolean;
  payload?: unknown;
  experience?: 'next';
};

export type GlobalConfig = {
  batchUpdate?: (callback: () => void) => void;
  experience?: 'next';
  strategy?: (
    strategy: (StrategyType | null | undefined)[],
    type: 'query' | 'mutation'
  ) => (StrategyType | null | undefined)[];
};

export type GlobalSessionProviderProps = {
  config?: GlobalConfig;
  keys?: ModelKeys;
  children?: ReactNode;
};

export type ConfigProviderProps = {
  value: GlobalConfig;
  children?: ReactNode;
};

export type Status = {
  isFetching: boolean;
  loaded: boolean;
  isError: boolean;
};

export type SessionProviderProps = {
  value: ModelKeys;
  children?: ReactNode;
};

export type LoadedSessionResult<
  D extends PromiseCallback<any> | SessionKey<any>
> = [
  LoadedSessionState<PCR<D>>,
  () => Promise<LoadedSessionState<PCR<D>>>,
  (...variables: Parameters<MCC<D>>) => Promise<LoadedSessionState<PCR<D>>>
];

export type SessionResult<D extends PromiseCallback<any> | SessionKey<any>> = [
  SessionState<PCR<D>>,
  () => Promise<SessionState<PCR<D>>>,
  (...variables: Parameters<MCC<D>>) => Promise<SessionState<PCR<D>>>
];

export type AbstractSessionResult = [
  SessionState,
  () => Promise<SessionState>,
  ((...variables: any[]) => Promise<SessionState>)?
];

export type PromiseHolder = {
  promise: Promise<any>;
  resolve: (data: any) => void;
  reject: (data: any) => void;
  loaded?: boolean;
};

export interface Execution {
  trigger: (payloadWrapper: { payload: unknown } | undefined) => boolean;
  execute: (
    payloadWrapper: { payload: unknown } | undefined,
    ...args: any[]
  ) => boolean;
}

export interface Tunnel {
  key: unknown;
  isFullFunctional: boolean;
  execution: Execution;
}

export type Resolver = {
  name?: string;
  resolve: (data: any) => void;
  reject: (data: any) => void;
};

export type ControlData = {
  variables?: any[];
  fetchingKey?: any;
  finalFetchingKey?: any;
  tunnels?: Tunnel[];
  resolvers?: Resolver[];
};

export type FullControlData = {
  sessionType?: SessionType;
  data?: ControlData;
};

export type Controller = {
  getData: (key: keyof ControlData) => ControlData[typeof key] | null;
  setData: (key: keyof ControlData, data: ControlData[typeof key]) => void;
};
