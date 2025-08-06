import {
  config,
  Model,
  ModelInstance,
  ModelKey,
  shallowEqual as shallowEq
} from 'as-model';

export { useModel, useControlledModel } from './model';

export { useSignal } from './signal';

export { useSelector } from './selector';

export { provide, Provider, ConfigProvider } from './provider';

export const shallowEqual = shallowEq;

export const createKey = function createKey<S, T extends ModelInstance>(
  modelFn: Model<S, T>,
  defaultState?: S
): ModelKey<S, T> {
  const hasDefaultState = arguments.length > 1;
  return hasDefaultState
    ? config({}).createKey(modelFn, defaultState)
    : config({}).createKey(modelFn);
};

export { model } from './entry';

export { validations } from './validations';
