import type { Action, AirReducer, ModelFactoryStore } from './libs/type';

export type AirReducerLike = AirReducer<any, any> & {
  getSourceFrom?: () => AirReducer<any, any>;
};

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
  onActions: (callback: (ins: T) => ((...args: any[]) => any)[]) => EffectOn<T>;
}
