import {
  ActualReducer,
  createModel,
  AirModelInstance,
  AirReducer
} from '@airma/core';
import { useEffect, useRef, useState } from 'react';

export function useModel<S, T extends AirModelInstance<S>>(
    model: AirReducer<S, T>,
    state: ReturnType<typeof model>['state']
): T {
  const modelRef = useRef<AirReducer<S, T>>(model);
  const ref = useRef<ActualReducer<S, T>>(createModel<S, T>(model, state));
  const [s, setS] = useState<S>(ref.current.agent.state);
  if (modelRef.current !== model) {
    modelRef.current = model;
    ref.current.update(model, s);
  }

  ref.current.connect(({ state:actionState }) => {
    setS(actionState);
  });
  useEffect(
      () => () => {
        ref.current.disconnect();
      },
      []
  );
  return ref.current.agent;
}
