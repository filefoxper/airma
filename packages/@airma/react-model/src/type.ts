import { StoreCollection, Action } from 'as-model';

export type GlobalConfig = {
  batchUpdate?: (callback: () => void) => void;
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
