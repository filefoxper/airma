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

export type SessionKey<E extends PromiseCallback<any>> = ModelKey<
  (st: SessionState & { version?: number }) => {
    state: SessionState;
    version: number;
    setState: (s: SessionState) => SessionState & { version?: number };
    setFetchingKey: (
      fetchingKey: unknown
    ) => SessionState & { version?: number };
    removeFetchingKey: (
      fetchingKey: unknown
    ) => SessionState & { version?: number };
    trigger: () => SessionState & { version?: number };
  }
> & {
  effect: [E, { sessionType?: SessionType }];
  implement: (c: E) => void;
};

export interface QuerySessionKey<E extends PromiseCallback<any>>
  extends SessionKey<E> {
  effect: [E, { sessionType?: 'query' }];
}

export interface MutationSessionKey<E extends PromiseCallback<any>>
  extends SessionKey<E> {
  effect: [E, { sessionType?: 'mutation' }];
}

export type TriggerType = 'mount' | 'update' | 'manual';

export type PromiseData<T = any> = {
  data?: T | undefined;
  variables: any[];
  error?: any;
  isError?: boolean;
};

export interface AbstractSessionState {
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
  uniqueKey: unknown;
  fetchVersion?: number;
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

export type StrategyEffect<T> = (state: SessionState<T>) => void;

export interface StrategyType<T = any> {
  (value: {
    current: () => SessionState<T>;
    variables: any[];
    runner: () => Promise<SessionState<T>>;
    store: { current: any };
    runtimeCache: {
      set: (key: any, value: any) => void;
      get: (key: any) => any;
    };
  }): Promise<SessionState<T>>;
  effect?: StrategyEffect<T>;
  response?: StrategyEffect<T>;
}

export type StrategyCollectionType<T = any> =
  | undefined
  | null
  | StrategyType<T>
  | (StrategyType<T> | null | undefined)[];

export type QueryConfig<T, C extends PromiseCallback<T>> = {
  deps?: any[];
  triggerOn?: TriggerType[];
  defaultData?: T;
  variables?: Parameters<C>;
  strategy?: StrategyCollectionType<T>;
  loaded?: boolean;
  manual?: boolean;
};

export type MutationConfig<T, C extends PromiseCallback<T>> = {
  defaultData?: T;
  deps?: any[];
  triggerOn?: TriggerType[];
  variables?: Parameters<C>;
  strategy?: StrategyCollectionType<T>;
  loaded?: boolean;
};

export type GlobalConfig = {
  useGlobalFetching?: boolean;
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
