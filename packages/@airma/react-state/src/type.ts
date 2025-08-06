import type {
  StoreCollection,
  Action,
  ModelInstance,
  Dispatch,
  Store
} from 'as-model';

export type GlobalConfig = {
  batchUpdate?: (callback: () => void) => void;
  test?: {
    act: (callback: () => any) => any;
  };
};

export interface ModelAction extends Action {
  payload?: { type: 'block' | 'initialize' | 'unblock' };
}

export interface EffectOn<T> {
  onActions: (
    actionGetter: (ins: T) => ((...args: any[]) => any)[]
  ) => EffectOn<T>;
  onChanges: (changeGetter: (ins: T) => any[]) => EffectOn<T>;
}

export type ModelStores = {
  collections: StoreCollection;
  parent?: ModelStores;
};

export interface SignalGenerator<
  S,
  T extends ModelInstance,
  R extends (instance: () => T) => any = (instance: () => T) => T
> {
  (): T;
  startStatistics: () => void;
  stopStatistics: () => void;
  subscribe: (dispatcher: Dispatch) => () => void;
  store: Store<S, T, R>;
}
