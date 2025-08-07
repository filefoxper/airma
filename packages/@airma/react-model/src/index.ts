import {
  config,
  Model,
  ModelInstance,
  shallowEqual as shallowEq
} from 'as-model';

export { useModel, useControlledModel } from './model';

export { useSignal } from './signal';

export { useSelector } from './selector';

export { provide, Provider, ConfigProvider } from './provider';

export const shallowEqual = shallowEq;

export const createKey = function createKey<S, T extends ModelInstance>(
  m: Model<S, T>,
  s?: S
) {
  const hasDefaultState = arguments.length > 1;
  return hasDefaultState ? config({}).createKey(m, s) : config({}).createKey(m);
};

export { model } from './entry';
