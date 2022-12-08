import type {
  ActualReducer,
  AirModelInstance,
  AirReducer,
  Action
} from '@airma/core';
import type { Option } from './type';
import { createModel } from '@airma/core';
import { useEffect, useMemo, useRef, useState } from 'react';

export function useTupleModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  state: D,
  option?: ((s: S) => any) | Option
): [S, T] {
  const defaultOpt = { refresh: false };
  const { refresh } =
    typeof option !== 'function' && option ? option : defaultOpt;

  const modelRef = useRef<AirReducer<S, T>>(model);
  const current = useMemo<ActualReducer<S, T>>(
    () => createModel<S, T, D>(model, state),
    []
  );
  const [s, setS] = useState<S>(state);
  if (modelRef.current !== model && typeof option !== 'function') {
    modelRef.current = model;
    current.update(model);
  }

  if (typeof option === 'function') {
    current.update(model, { state });
  }

  const dispatch = ({ state: actionState }: Action) => {
    if (typeof option === 'function') {
      option(actionState);
      return;
    }
    setS(actionState);
  };
  current.connect(dispatch);

  useEffect(() => {
    if (refresh) {
      current.update(model, { state });
      setS(state);
    }
  }, [state]);

  useEffect(() => {
    const updateSource = typeof option === 'function' || refresh ? state : s;
    current.update(model, { state: updateSource });
    current.connect(dispatch);
    return () => {
      current.disconnect();
    };
  }, []);
  return [s, current.agent];
}

export function useModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>
): T;
export function useModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  state: D,
  option?: Option
): T;
export function useModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>,
  state?: D,
  option?: Option
): T {
  const [, agent] = useTupleModel<S | undefined, T, D | undefined>(
    model,
    state,
    option
  );
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

export function useRefresh<T extends (...args: any[]) => any>(
  method: T,
  params: Parameters<T>
) {
  useEffect(() => {
    method(...params);
  }, [method, ...params]);
}
