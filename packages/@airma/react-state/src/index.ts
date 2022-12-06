import type {
  ActualReducer,
  AirModelInstance,
  AirReducer,
  Action
} from '@airma/core';
import type { Option } from './type';
import { createModel } from '@airma/core';
import { useEffect, useRef, useState } from 'react';

export function useTupleModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  state: D,
  option?: ((s: S) => any) | Option
): [S, T] {
  const defaultOpt = { refresh: false };
  const { refresh } =
    typeof option !== 'function' && option ? option : defaultOpt;

  const modelRef = useRef<AirReducer<S, T>>(model);
  const ref = useRef<ActualReducer<S, T>>(createModel<S, T, D>(model, state));
  const [s, setS] = useState<S>(state);
  if (modelRef.current !== model && typeof option !== 'function') {
    modelRef.current = model;
    ref.current.update(model);
  }

  if (typeof option === 'function') {
    ref.current.update(model, { state });
  }

  const dispatch = ({ state: actionState }: Action) => {
    if (typeof option === 'function') {
      option(actionState);
      return;
    }
    setS(actionState);
  };
  ref.current.connect(dispatch);

  useEffect(() => {
    if (refresh) {
      ref.current.update(model, { state });
      setS(state);
    }
  }, [state]);

  useEffect(() => {
    const updateSource = typeof option === 'function' || refresh ? state : s;
    ref.current.update(model, { state: updateSource });
    ref.current.connect(dispatch);
    return () => {
      ref.current.disconnect();
    };
  }, []);
  return [s, ref.current.agent];
}

export function useModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  state: D,
  option?: Option
): T {
  const [, agent] = useTupleModel(model, state, option);
  return agent;
}

export function useControlledModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  state: D,
  onChange: (s: S) => any
): T {
  const [, agent] = useTupleModel(model, state, onChange);
  return agent;
}

export function useRefreshModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  state: D
): T {
  const [, agent] = useTupleModel(model, state, { refresh: true });
  return agent;
}
