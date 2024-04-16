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

export type SignalEffectAction = ModelAction & {
  on: (...actionMethods: ((...args: any[]) => any)[]) => boolean;
};

export type SignalEffect<T> = (instance: T, action: SignalEffectAction) => void;
