import { usePersistFn } from '@airma/react-hooks-core';
import { useEffect, useState } from 'react';
import { useModelInitialize } from './initialize';
import { useRenderProtectDispatch } from './enhance';
import type { ResultOf } from './type';
import type { InstanceOf, ModelLike } from '../index';
import type {
  Action,
  Instance,
  Model,
  ModelKey,
  ModelUsage,
  PickState,
  Store
} from 'as-model';

export function useControlledModel<
  M extends Model,
  D extends PickState<M>,
  R extends undefined | ((instance: () => Instance<M>) => any) = undefined
>(
  modelLike: M | ModelUsage<M, R>,
  state: D,
  onChange: (s: PickState<M>) => any
): R extends undefined
  ? Instance<M>
  : ReturnType<R extends undefined ? never : R> {
  const store = useModelInitialize(modelLike, {
    hasDefaultState: true,
    state,
    controlled: true
  });

  const dispatch = usePersistFn((action: Action) => {
    if (action.state === state) {
      return;
    }
    onChange(action.state);
  });

  const subscription = useRenderProtectDispatch(action => {
    dispatch(action);
  });

  useEffect(() => {
    return store.subscribe(subscription);
  }, []);

  return store.getInstance();
}

export function useModel<
  M extends Model,
  D extends PickState<M>,
  R extends undefined | ((instance: () => Instance<M>) => any) = undefined
>(modelLike: ModelUsage<M, R>, state?: D): ResultOf<Instance<M>, R>;
export function useModel<M extends Model, D extends PickState<M>>(
  modelLike: M,
  state?: D
): Instance<M>;
export function useModel<
  M extends ModelLike,
  D extends PickState<M>,
  R extends undefined | ((instance: () => Instance<M>) => any) = undefined
>(modelLike: ModelKey<M, R>, state?: D): InstanceOf<Instance<M>, R>;
export function useModel<
  M extends ModelLike,
  D extends PickState<M>,
  R extends undefined | ((instance: () => Instance<M>) => any) = undefined
>(modelLike: Store<M, R>, state?: D): InstanceOf<Instance<M>, R>;
export function useModel<
  M extends Model,
  D extends PickState<M>,
  R extends undefined | ((instance: () => Instance<M>) => any) = undefined
>(
  modelLike: M | ModelKey<M, R> | Store<M, R> | ModelUsage<M, R>,
  state?: D
): ResultOf<Instance<M>, R> {
  const hasDefaultState = arguments.length > 1;
  const store = useModelInitialize<M, D, R>(modelLike, {
    hasDefaultState,
    state
  });

  const [data, setData] = useState(() => {
    const ins = store.getInstance();
    const token = store.getToken();
    return {
      instance: ins,
      token
    };
  });

  const subscription = useRenderProtectDispatch(() => {
    const token = store.getToken();
    if (!data.token.isDifferent(token)) {
      return;
    }
    setData({ instance: store.getInstance(), token });
  });

  useEffect(() => {
    return store.subscribe(subscription);
  }, []);

  return data.instance;
}
