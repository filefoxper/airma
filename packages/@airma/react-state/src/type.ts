import type { Action, AirReducer, ModelFactoryStore } from './libs/type';

export type Selector = {
  parent: Selector | null;
} & ModelFactoryStore<any>;

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
