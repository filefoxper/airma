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

export type TriggerType = 'mount' | 'update' | 'manual';

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
  triggerType: undefined | TriggerType;
};

export type StrategyType<T = any> = (value: {
  current: () => PromiseResult<T>;
  variables?: any[];
  runner: () => Promise<PromiseResult<T>>;
  store: { current: any };
}) => Promise<PromiseResult<T>>;

export type StrategyCollectionType =
  | undefined
  | null
  | StrategyType
  | (StrategyType | null | undefined)[];

export type QueryConfig<T, C extends PromiseEffectCallback<T>> = {
  deps?: any[];
  variables?: Parameters<C>;
  strategy?: StrategyCollectionType;
  manual?: boolean;
  exact?: boolean;
};

export type MutationConfig<T, C extends PromiseEffectCallback<T>> = {
  variables?: Parameters<C>;
  strategy?: StrategyCollectionType;
  exact?: boolean;
};

export type EffectConfig = {
  strategy?: (
    strategy: (StrategyType | null | undefined)[],
    type: 'query' | 'mutation'
  ) => (StrategyType | null | undefined)[];
};

export type EffectConfigProviderProps = {
  value: EffectConfig;
  children?: ReactNode;
};
