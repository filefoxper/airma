import { FactoryCollection, FactoryModel } from '@airma/react-state';
import { ComponentType, FC, ReactNode } from 'react';

export declare type PromiseResult<T> = {
  data: T | undefined;
  error?: any;
  isError: boolean;
  isFetching: boolean;
  abandon: boolean;
};

export declare type StrategyType<T = any> = (
  getCurrentState: () => PromiseResult<T>,
  runner: () => Promise<PromiseResult<T>>,
  storeRef: { current: any }
) => Promise<PromiseResult<T>>;

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
};

export declare type QueryConfig<T, C extends PromiseEffectCallback<T>> = {
  deps?: any[];
  variables?: Parameters<C>;
  strategy?: StrategyType;
  manual?: boolean;
};

export declare type MutationConfig<T, C extends PromiseEffectCallback<T>> = {
  variables?: Parameters<C>;
  strategy?: StrategyType;
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
  config?: QueryConfig<PCR<D>, MCC<D>> | Parameters<MCC<D>>
): [PromiseResult<PCR<D>>, () => Promise<PromiseResult<PCR<D>>>];

export declare function useMutation<
  D extends PromiseEffectCallback<any> | ModelPromiseEffectCallback<any>
>(
  callback: D,
  config?: MutationConfig<PCR<D>, MCC<D>> | Parameters<MCC<D>>
): [PromiseResult<PCR<D>>, () => Promise<PromiseResult<PCR<D>>>];

export declare function useAsyncEffect<
  D extends ModelPromiseEffectCallback<any>
>(factory: D): [PromiseResult<PCR<D>>, () => void];

export declare function asyncEffect<
  E extends (...params: any[]) => Promise<any>,
  T = E extends (...params: any[]) => Promise<infer R> ? R : never
>(effectCallback: E): ModelPromiseEffectCallback<E>;

export declare const EffectProvider: FC<{
  value: FactoryCollection;
  children?: ReactNode;
}>;

export declare function withEffectProvider(
  models: FactoryCollection
): <P extends object>(component: ComponentType<P>) => typeof component;

export declare const Strategy = {
  debounce: (op: { time: number }) => StrategyType,
  once: () => StrategyType
};
