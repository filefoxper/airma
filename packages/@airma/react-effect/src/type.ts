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
    implement: (c: E) => void;
  };

export type TriggerType = 'mount' | 'update' | 'manual';

export type PromiseData<T = any> = {
  data?: T | undefined;
  error?: any;
  isError?: boolean;
};

type LoadedPromiseResult<T> = {
  data: T;
  error?: any;
  isError: boolean;
  isFetching: boolean;
  fetchingKey?: unknown;
  abandon: boolean;
  triggerType: undefined | TriggerType;
  loaded: true;
};

type UnloadedPromiseResult = {
  data: undefined;
  error?: any;
  isError: boolean;
  isFetching: boolean;
  fetchingKey?: unknown;
  abandon: boolean;
  triggerType: undefined | TriggerType;
  loaded: false;
};

export type PromiseResult<T = any> =
  | LoadedPromiseResult<T>
  | UnloadedPromiseResult;

export type StrategyType<T = any> = (value: {
  current: () => PromiseResult<T>;
  variables: any[];
  runner: () => Promise<PromiseResult<T>>;
  store: { current: any };
}) => Promise<PromiseResult<T>>;

export type StrategyCollectionType<T> =
  | undefined
  | null
  | StrategyType<T>
  | (StrategyType<T> | null | undefined)[];

export type QueryConfig<T, C extends PromiseEffectCallback<T>> = {
  deps?: any[];
  triggerOn?: TriggerType[];
  defaultData?: T;
  variables?: Parameters<C>;
  strategy?: StrategyCollectionType<T>;
  manual?: boolean;
  exact?: boolean;
};

export type MutationConfig<T, C extends PromiseEffectCallback<T>> = {
  defaultData?: T;
  deps?: any[];
  triggerOn?: TriggerType[];
  variables?: Parameters<C>;
  strategy?: StrategyCollectionType<T>;
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

export type LocalClientConfig = {
  loaded?: boolean;
};

export type Status = {
  isFetching: boolean;
  loaded: boolean;
  isError: boolean;
  isSuccess: boolean;
};
