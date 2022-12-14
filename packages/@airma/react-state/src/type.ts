import type { AirReducer, ModelFactoryStore } from '@airma/core';

export type AirReducerLike = AirReducer<any, any> & {
  getSourceFrom?: () => AirReducer<any, any>;
};

export type Selector = {
  parent: Selector | null;
} & ModelFactoryStore<any>;
