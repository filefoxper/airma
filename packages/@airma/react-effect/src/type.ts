import { FactoryModel } from '@airma/react-state';
import { ReactNode } from 'react';

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

export type PromiseData<T = any> = {
  data?: T | undefined;
  error?: any;
  isError?: boolean;
};

export type PromiseResult<T = any> = {
  data: T | undefined;
  error?: any;
  isError: boolean;
  isFetching: boolean;
  fetchingKey?: unknown;
  abandon: boolean;
};

export type StrategyType<T = any> = (value: {
  current: () => PromiseResult<T>;
  variables?: any[];
  runner: () => Promise<PromiseResult<T>>;
  store: { current: any };
}) => Promise<PromiseResult<T>>;

export type QueryConfig<T, C extends PromiseEffectCallback<T>> = {
  deps?: any[];
  variables?: Parameters<C>;
  strategy?: StrategyType | (StrategyType | null | undefined)[];
  primaryStrategy?: StrategyType | null | (StrategyType | null | undefined)[];
  manual?: boolean;
};

export type MutationConfig<T, C extends PromiseEffectCallback<T>> = {
  variables?: Parameters<C>;
  strategy?: StrategyType | (StrategyType | null | undefined)[];
  primaryStrategy?: StrategyType | null | (StrategyType | null | undefined)[];
};

export type PrimaryStrategyProviderProps = {
  value: StrategyType | null | StrategyType[];
  children?: ReactNode;
};
