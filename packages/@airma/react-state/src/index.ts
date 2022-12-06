import {
  ActualReducer,
  createModel,
  AirModelInstance,
  AirReducer
} from '@airma/core';
import { useEffect, useRef, useState } from 'react';

export function useTupleModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  state: D,
  onChange?: (s: S) => any
): [S, T] {
  const modelRef = useRef<AirReducer<S, T>>(model);
  const ref = useRef<ActualReducer<S, T>>(createModel<S, T, D>(model, state));
  const [s, setS] = useState<S>(state);
  if (modelRef.current !== model && onChange == null) {
    modelRef.current = model;
    ref.current.update(model);
  }
  if (onChange) {
    ref.current.update(model, { state });
  }

  ref.current.connect(({ state: actionState }) => {
    if (onChange) {
      onChange(actionState);
      return;
    }
    setS(actionState);
  });
  useEffect(
    () => () => {
      ref.current.disconnect();
    },
    []
  );
  return [s, ref.current.agent];
}

export function useModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  state: D
): T {
  const [, agent] = useTupleModel(model, state);
  return agent;
}

export function useControlledModel<
  S,
  T extends AirModelInstance,
  D extends S
>(model: AirReducer<S, T>, state: D, onChange: (s: S) => any): T {
  const [, agent] = useTupleModel(model, state, onChange);
  return agent;
}
