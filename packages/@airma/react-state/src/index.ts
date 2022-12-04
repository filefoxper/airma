import {
  ActualReducer,
  createModel,
  AirModelInstance,
  AirReducer
} from '@airma/core';
import { useEffect, useRef, useState } from 'react';

export function useTupleModel<S, T extends AirModelInstance,D extends S>(
  model: AirReducer<S, T>,
  state: D
): [T, S] {
  const modelRef = useRef<AirReducer<S, T>>(model);
  const ref = useRef<ActualReducer<S, T>>(createModel<S, T, D>(model, state));
  const [s, setS] = useState<S>(state);
  if (modelRef.current !== model) {
    modelRef.current = model;
    ref.current.update(model);
  }

  ref.current.connect(({ state: actionState }) => {
    setS(actionState);
  });
  useEffect(
    () => () => {
      ref.current.disconnect();
    },
    []
  );
  return [ref.current.agent, s];
}

export function useModel<S, T extends AirModelInstance,D extends S>(
  model: AirReducer<S, T>,
  state: D
): T {
  const [agent] = useTupleModel(model, state);
  return agent;
}
