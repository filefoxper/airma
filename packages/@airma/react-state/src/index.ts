import { config, shallowEqual as shallowEq } from 'as-model';
import type { Model, ModelKey, Store, PickState } from 'as-model';

export { useModel, useControlledModel } from './model';

export { useSignal } from './signal';

export { useSelector } from './selector';

export { provide, Provider, ConfigProvider } from './provider';

export const shallowEqual = shallowEq;

export const createKey = function createKey<
  M extends Model,
  D extends PickState<M>
>(modelFn: M, defaultState?: D): ModelKey<M> {
  const hasDefaultState = arguments.length > 1;
  return hasDefaultState
    ? config({}).createKey<M, D>(modelFn, defaultState)
    : config({}).createKey<M, D>(modelFn);
};

export const createStore = function createStore<
  M extends Model,
  D extends PickState<M>
>(modelFn: M, defaultState?: D): Store<M> {
  const hasDefaultState = arguments.length > 1;
  return hasDefaultState
    ? config({}).createStore(modelFn, defaultState)
    : config({}).createStore(modelFn);
};

export { model } from './entry';

export { validations } from './validations';

export { useActProcess } from './provider';
