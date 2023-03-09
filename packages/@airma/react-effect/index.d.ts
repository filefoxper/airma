import { FactoryCollection, FactoryModel } from '@airma/react-state';
import { FunctionComponent, FC, NamedExoticComponent, ReactNode } from 'react';

declare type TriggerType = 'mount' | 'update' | 'manual';

declare type LoadedSessionState<T> = {
  data: T;
  error?: any;
  isError: boolean;
  isFetching: boolean;
  fetchingKey?: unknown;
  abandon: boolean;
  triggerType: undefined | TriggerType;
  loaded: true;
};

declare type UnloadedSessionState = {
  data: undefined;
  error?: any;
  isError: boolean;
  isFetching: boolean;
  fetchingKey?: unknown;
  abandon: boolean;
  triggerType: undefined | TriggerType;
  loaded: false;
};

export declare type SessionState<T> =
  | LoadedSessionState<T>
  | UnloadedSessionState;

export declare type StrategyType<T = any> = (value: {
  current: () => SessionState<T>;
  variables: any[];
  runner: () => Promise<SessionState<T>>;
  store: { current: any };
}) => Promise<SessionState<T>>;

declare type PromiseCallback<T> = (...params: any[]) => Promise<T>;

declare type SessionKey<E extends PromiseCallback<any>> = FactoryModel<
  (st: SessionState & { version?: number }) => {
    state: SessionState;
    version: number;
    setState: (s: SessionState) => SessionState & { version?: number };
    trigger: () => SessionState & { version?: number };
  }
> & {
  effect: [E];
  implement: (c: E) => void;
};

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

export declare function useQuery<
  D extends PromiseCallback<any> | SessionKey<any>
>(
  callback: D,
  config: DefaultQueryConfig<PCR<D>, MCC<D>>
): [
  LoadedSessionState<PCR<D>>,
  () => Promise<LoadedSessionState<PCR<D>>>,
  (...variables: Parameters<MCC<D>>) => Promise<LoadedSessionState<PCR<D>>>
];
export declare function useQuery<
  D extends PromiseCallback<any> | SessionKey<any>
>(
  callback: D,
  config?: QueryConfig<PCR<D>, MCC<D>> | Parameters<MCC<D>>
): [
  SessionState<PCR<D>>,
  () => Promise<SessionState<PCR<D>>>,
  (...variables: Parameters<MCC<D>>) => Promise<SessionState<PCR<D>>>
];

export declare function useMutation<
  D extends PromiseCallback<any> | SessionKey<any>
>(
  callback: D,
  config: DefaultMutationConfig<PCR<D>, MCC<D>>
): [
  LoadedSessionState<PCR<D>>,
  () => Promise<LoadedSessionState<PCR<D>>>,
  (...variables: Parameters<MCC<D>>) => Promise<LoadedSessionState<PCR<D>>>
];
export declare function useMutation<
  D extends PromiseCallback<any> | SessionKey<any>
>(
  callback: D,
  config?: MutationConfig<PCR<D>, MCC<D>> | Parameters<MCC<D>>
): [
  SessionState<PCR<D>>,
  () => Promise<SessionState<PCR<D>>>,
  (...variables: Parameters<MCC<D>>) => Promise<SessionState<PCR<D>>>
];

export declare function useSession<D extends SessionKey<any>>(
  factory: D
): [SessionState<PCR<D>>, () => void];

export declare function sessionKey<
  E extends (...params: any[]) => Promise<any>
>(effectCallback: E): SessionKey<E>;

export declare function useCombinedSessionState(
  ...sessionStates: SessionState[]
): SessionState;

export declare const SessionProvider: FC<{
  value: FactoryCollection;
  children?: ReactNode;
}>;

declare type QueryType = 'query' | 'mutation';

export declare type GlobalConfig = {
  strategy?: (
    strategy: (StrategyType | null | undefined)[],
    type: QueryType
  ) => (StrategyType | null | undefined)[];
};

export declare const GlobalConfigProvider: FC<{
  value: GlobalConfig;
  children?: ReactNode;
}>;

export declare function withSessionProvider(
  models: FactoryCollection
): <P extends Record<string, any>>(
  component: FunctionComponent<P> | NamedExoticComponent<P>
) => typeof component;

export declare const Strategy: {
  debounce: (op: { duration: number } | number) => StrategyType;
  once: () => StrategyType;
  error: (
    process: (e: unknown) => any,
    option?: { withAbandoned?: boolean }
  ) => StrategyType;
  success: <T>(
    process: (data: T) => any,
    option?: { withAbandoned?: boolean }
  ) => StrategyType<T>;
};
