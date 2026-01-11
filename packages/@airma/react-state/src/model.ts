import { usePersistFn } from '@airma/react-hooks-core';
import { useEffect, useState } from 'react';
import { useModelInitialize } from './initialize';
import { useRenderProtectDispatch } from './enhance';
import type {
  Action,
  Model,
  ModelInstance,
  ModelKey,
  ModelUsage,
  Store
} from 'as-model';

export function useControlledModel<
  S,
  T extends ModelInstance,
  D extends S,
  R extends (instance: () => T) => any = (instance: () => T) => T
>(
  modelLike: Model<S, T> | ModelUsage<S, T, R>,
  state: D,
  onChange: (s: S) => any
): T {
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
  S,
  T extends ModelInstance,
  D extends S,
  R extends (instance: () => T) => any = (instance: () => T) => T
>(
  modelLike:
    | Model<S, T>
    | ModelKey<S, T>
    | Store<S, T, R>
    | ModelUsage<S, T, R>,
  state?: D
): T {
  const hasDefaultState = arguments.length > 1;
  const store = useModelInitialize(modelLike, { hasDefaultState, state });

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
