import { Action, Model, ModelInstance, ModelKey, Store } from 'as-model';
import { usePersistFn } from '@airma/react-hooks-core';
import { useEffect, useState } from 'react';
import { useModelInitialize } from './initialize';

export function useControlledModel<S, T extends ModelInstance, D extends S>(
  modelLike: Model<S, T>,
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

  useEffect(() => {
    return store.subscribe(action => {
      dispatch(action);
    });
  }, []);

  return store.getInstance();
}

export function useModel<S, T extends ModelInstance, D extends S>(
  modelLike: Model<S, T> | ModelKey<S, T> | Store<S, T>,
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

  const subscription = usePersistFn(() => {
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
