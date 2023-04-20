import { ModelKey, ModelKeys } from '@airma/react-state';
import { ReactNode } from 'react';

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

type LoadedSessionState<T> = {
  data: T;
  variables: any[] | undefined;
  error?: any;
  isError: boolean;
  isFetching: boolean;
  fetchingKey?: unknown;
  finalFetchingKey?: unknown;
  abandon: boolean;
  triggerType: undefined | TriggerType;
  loaded: true;
};

type UnloadedSessionState = {
  data: undefined;
  variables: any[] | undefined;
  error?: any;
  isError: boolean;
  isFetching: boolean;
  fetchingKey?: unknown;
  finalFetchingKey?: unknown;
  abandon: boolean;
  triggerType: undefined | TriggerType;
  loaded: false;
};

export type SessionState<T = any> =
  | LoadedSessionState<T>
  | UnloadedSessionState;

export type StrategyType<T = any> = (value: {
  current: () => SessionState<T>;
  variables: any[];
  runner: () => Promise<SessionState<T>>;
  store: { current: any };
  runtimeCache: {
    cache: (key: any, value: any) => void;
    fetch: (key: any) => any;
  };
}) => Promise<SessionState<T>>;

export type StrategyCollectionType<T> =
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
  manual?: boolean;
};

export type MutationConfig<T, C extends PromiseCallback<T>> = {
  defaultData?: T;
  deps?: any[];
  triggerOn?: TriggerType[];
  variables?: Parameters<C>;
  strategy?: StrategyCollectionType<T>;
};

export type GlobalConfig = {
  strategy?: (
    strategy: (StrategyType | null | undefined)[],
    type: 'query' | 'mutation'
  ) => (StrategyType | null | undefined)[];
};

export type GlobalConfigProviderProps = {
  value?: GlobalConfig;
  children?: ReactNode;
};

export type GlobalSessionProviderProps = {
  config?: GlobalConfig;
  keys?: ModelKeys;
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
