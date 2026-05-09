import type {
  StoreCollection,
  Action,
  Dispatch,
  Store,
  Model,
  Instance,
  ModelInstance
} from 'as-model';

export type GlobalConfig = {
  batchUpdate?: (callback: () => void) => void;
  supports?: { renderAction?: boolean };
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
  M extends Model,
  R extends undefined | ((instance: () => Instance<M>) => any) = undefined
> {
  (): R extends undefined
    ? Instance<M>
    : ReturnType<R extends undefined ? never : R>;
  startStatistics: () => void;
  stopStatistics: () => void;
  subscribe: (dispatcher: Dispatch) => () => void;
  store: Store<M, R>;
}

export type ResultOf<
  T extends ModelInstance,
  R extends undefined | ((instance: () => T) => any)
> = R extends undefined ? T : ReturnType<R extends undefined ? never : R>;

export type InstanceOf<
  T extends ModelInstance,
  R extends undefined | ((instance: () => T) => any)
> = R extends undefined ? T : ReturnType<R extends undefined ? never : R>;
