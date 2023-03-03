import { FactoryCollection, FactoryModel } from '@airma/react-state';
import { FunctionComponent, FC, NamedExoticComponent, ReactNode } from 'react';

declare type TriggerType = 'mount' | 'update' | 'manual';

declare type LoadedPromiseResult<T> = {
  data: T;
  error?: any;
  isError: boolean;
  isFetching: boolean;
  fetchingKey?: unknown;
  abandon: boolean;
  triggerType: undefined | TriggerType;
  loaded: true;
};

declare type UnloadedPromiseResult = {
  data: undefined;
  error?: any;
  isError: boolean;
  isFetching: boolean;
  fetchingKey?: unknown;
  abandon: boolean;
  triggerType: undefined | TriggerType;
  loaded: false;
};

export declare type PromiseResult<T> =
  | LoadedPromiseResult<T>
  | UnloadedPromiseResult;

export declare type StrategyType<T = any> = (value: {
  current: () => PromiseResult<T>;
  variables?: any[];
  runner: () => Promise<PromiseResult<T>>;
  store: { current: any };
}) => Promise<PromiseResult<T>>;

export declare type PromiseEffectCallback<T> = (...params: any[]) => Promise<T>;

export declare type ModelPromiseEffectCallback<
  E extends PromiseEffectCallback<any>
> = FactoryModel<
  (st: PromiseResult & { version?: number }) => {
    state: PromiseResult;
    version: number;
    setState: (s: PromiseResult) => PromiseResult & { version?: number };
    trigger: () => PromiseResult & { version?: number };
  }
> & {
  effect: [E];
  implement: (c: E) => void;
};

export declare type StrategyCollectionType<T> =
  | undefined
  | null
  | StrategyType<T>
  | (StrategyType<T> | null | undefined)[];

export declare type QueryConfig<T, C extends PromiseEffectCallback<T>> = {
  deps?: any[];
  variables?: Parameters<C>;
  strategy?: StrategyCollectionType<T>;
  manual?: boolean;
  exact?: boolean;
};

declare type DefaultQueryConfig<
  T,
  C extends PromiseEffectCallback<T>
> = QueryConfig<T, C> & {
  defaultData: T;
};

export declare type MutationConfig<T, C extends PromiseEffectCallback<T>> = {
  variables?: Parameters<C>;
  strategy?: StrategyCollectionType<T>;
  exact?: boolean;
};

declare type DefaultMutationConfig<
  T,
  C extends PromiseEffectCallback<T>
> = MutationConfig<T, C> & {
  defaultData: T;
};

declare type PCR<
  T extends PromiseEffectCallback<any> | ModelPromiseEffectCallback<any>
> = T extends PromiseEffectCallback<infer R>
  ? R
  : T extends ModelPromiseEffectCallback<infer C>
  ? PCR<C>
  : never;

declare type MCC<
  T extends PromiseEffectCallback<any> | ModelPromiseEffectCallback<any>
> = T extends PromiseEffectCallback<any>
  ? T
  : T extends ModelPromiseEffectCallback<infer C>
  ? C
  : never;

export declare function useQuery<
  D extends PromiseEffectCallback<any> | ModelPromiseEffectCallback<any>
>(
  callback: D,
  config: DefaultQueryConfig<PCR<D>, MCC<D>>
): [
  LoadedPromiseResult<PCR<D>>,
  () => Promise<LoadedPromiseResult<PCR<D>>>,
  (...variables: Parameters<MCC<D>>) => Promise<LoadedPromiseResult<PCR<D>>>
];
export declare function useQuery<
  D extends PromiseEffectCallback<any> | ModelPromiseEffectCallback<any>
>(
  callback: D,
  config?: QueryConfig<PCR<D>, MCC<D>> | Parameters<MCC<D>>
): [
  PromiseResult<PCR<D>>,
  () => Promise<PromiseResult<PCR<D>>>,
  (...variables: Parameters<MCC<D>>) => Promise<PromiseResult<PCR<D>>>
];

export declare function useMutation<
  D extends PromiseEffectCallback<any> | ModelPromiseEffectCallback<any>
>(
  callback: D,
  config: DefaultMutationConfig<PCR<D>, MCC<D>>
): [
  LoadedPromiseResult<PCR<D>>,
  () => Promise<LoadedPromiseResult<PCR<D>>>,
  (...variables: Parameters<MCC<D>>) => Promise<LoadedPromiseResult<PCR<D>>>
];
export declare function useMutation<
  D extends PromiseEffectCallback<any> | ModelPromiseEffectCallback<any>
>(
  callback: D,
  config?: MutationConfig<PCR<D>, MCC<D>> | Parameters<MCC<D>>
): [
  PromiseResult<PCR<D>>,
  () => Promise<PromiseResult<PCR<D>>>,
  (...variables: Parameters<MCC<D>>) => Promise<PromiseResult<PCR<D>>>
];

declare type LocalClientConfig = {
  loaded?: boolean;
};

/**
 * @deprecated
 * @param factory
 * @param config
 */
export declare function useAsyncEffect<
  D extends ModelPromiseEffectCallback<any>
>(factory: D, config?: LocalClientConfig): [PromiseResult<PCR<D>>, () => void];

export declare function useClient<D extends ModelPromiseEffectCallback<any>>(
  factory: D,
  config: {
    loaded: true;
  }
): [LoadedPromiseResult<PCR<D>>, () => void];
export declare function useClient<D extends ModelPromiseEffectCallback<any>>(
  factory: D,
  config?: LocalClientConfig
): [PromiseResult<PCR<D>>, () => void];

/**
 * @deprecated
 * @param effectCallback
 */
export declare function asyncEffect<
  E extends (...params: any[]) => Promise<any>,
  T = E extends (...params: any[]) => Promise<infer R> ? R : never
>(effectCallback: E): ModelPromiseEffectCallback<E>;

export declare function client<
  E extends (...params: any[]) => Promise<any>,
  T = E extends (...params: any[]) => Promise<infer R> ? R : never
>(effectCallback: E): ModelPromiseEffectCallback<E>;

declare type Status = {
  isFetching: boolean;
  loaded: boolean;
  isError: boolean;
  isSuccess: boolean;
};

export declare function useStatus(
  ...results: (PromiseResult | [PromiseResult, ...any])[]
): Status;

/**
 * @deprecated
 */
export declare const EffectProvider: FC<{
  value: FactoryCollection;
  children?: ReactNode;
}>;

export declare const ClientProvider: FC<{
  value: FactoryCollection;
  children?: ReactNode;
}>;

export declare type EffectType = 'query' | 'mutation';

export declare type ClientConfig = {
  strategy?: (
    strategy: (StrategyType | null | undefined)[],
    type: EffectType
  ) => (StrategyType | null | undefined)[];
};

/**
 * @deprecated
 */
export declare const EffectConfigProvider: FC<{
  value: ClientConfig;
  children?: ReactNode;
}>;

export declare const ClientConfigProvider: FC<{
  value: ClientConfig;
  children?: ReactNode;
}>;

/**
 * @deprecated
 * @param models
 */
export declare function withEffectProvider(
  models: FactoryCollection
): <P extends Record<string, any>>(
  component: FunctionComponent<P> | NamedExoticComponent<P>
) => typeof component;

export declare function withClientProvider(
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
