import { FactoryModel } from '@airma/react-state';

export type PromiseEffectCallback<T> = (...params: any[]) => Promise<T>;

export type ModelPromiseEffectCallback<E extends PromiseEffectCallback<any>> =
  FactoryModel<
    (st: PromiseResult & { version?: number }) => {
      state: PromiseResult;
      version: number;
      setState: (s: PromiseResult) => PromiseResult & { version?: number };
      trigger: () => PromiseResult & { version?: number };
    }
  > & {
    effect: [E];
  };

export type PromiseResult<T = any> = {
  data: T | undefined;
  error?: any;
  isError: boolean;
  isFetching: boolean;
  fetchingKey?: unknown;
  abandon: boolean;
};

export type StrategyType<T = any> = (
  getCurrentState: () => PromiseResult<T>,
  runner: () => Promise<PromiseResult<T>>,
  storeRef: { current: any }
) => Promise<PromiseResult<T>>;

export type QueryConfig<T, C extends PromiseEffectCallback<T>> = {
  deps?: any[];
  variables?: Parameters<C>;
  strategy?: StrategyType;
  manual?: boolean;
};

export type MutationConfig<T, C extends PromiseEffectCallback<T>> = {
  variables?: Parameters<C>;
  strategy?: StrategyType;
};
