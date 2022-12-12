import type {
  AirModelInstance,
  AirReducer,
  Action,
  Connection,
  HoldCallback
} from '@airma/core';
import type { Option } from './type';
import type { FC, ReactNode } from 'react';

import {
  activeRequiredModels,
  createModel,
  createRequiredModels
} from './core';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  createContext,
  createElement,
  useContext
} from 'react';

function usePersistFn<T extends (...args: any[]) => any>(callback: T): T {
  const dispatchRef = useRef<T>(callback);
  dispatchRef.current = callback;
  const persistRef = useRef((...args: any[]): any => {
    return dispatchRef.current(...args);
  });
  return persistRef.current as T;
}

export function useTupleModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  state: D,
  option?: ((s: S) => any) | Option
): [S, T] {
  const defaultOpt = { refresh: false };
  const { refresh } =
    typeof option !== 'function' && option ? option : defaultOpt;

  const modelRef = useRef<AirReducer<S, T>>(model);
  const current = useMemo(() => createModel<S, T, D>(model, state), []);
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
  const persistDispatch = usePersistFn(dispatch);
  current.connect(persistDispatch);

  useEffect(() => {
    if (refresh) {
      current.update(model, { state });
      setS(state);
    }
  }, [state]);

  useEffect(() => {
    const updateSource = typeof option === 'function' || refresh ? state : s;
    current.update(model, { state: updateSource });
    current.connect(persistDispatch);
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

type Selector = {
  get(reducer: AirReducer<any, any>): Connection | undefined;
  parent: Selector | null;
};

const ReactStateContext = createContext<Selector | null>(null);

export const RequiredModelProvider: FC<{
  value: Array<any> | ((...args: any) => any) | Record<string, any>;
  children: ReactNode;
}> = ({ value, children }) => {
  const context = useContext(ReactStateContext);
  const storeRef = useRef(activeRequiredModels(value));
  const selector = useMemo(() => {
    const store = storeRef.current.update(value);
    return { ...store, parent: context };
  }, [context, value]);
  return createElement(
    ReactStateContext.Provider,
    { value: selector },
    children
  );
};

export function useRequiredModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>,
  state?: D
): T {
  function find(
    c: Selector,
    m: typeof model
  ): Connection<S | undefined, T> | undefined {
    const d = c.get(m);
    if (!d && c.parent) {
      return find(c.parent, m);
    }
    return d as Connection<S | undefined, T> | undefined;
  }
  const context = useContext(ReactStateContext);
  const connection = context ? find(context, model) : undefined;
  const current = useMemo(
    () =>
      connection || createModel<S | undefined, T, D | undefined>(model, state),
    [model, connection]
  );
  const [s, setS] = useState<S | undefined>(
    connection ? connection.getCacheState() : state
  );

  const dispatch = ({ state }: Action) => {
    setS(state);
  };
  const persistDispatch = usePersistFn(dispatch);
  current.connect(persistDispatch);

  useEffect(() => {
    if (!connection) {
      current.update(model, { state: s });
    }
    current.connect(persistDispatch);
    return () => {
      current.disconnect(persistDispatch);
    };
  }, []);
  return current.agent as T;
}

export function requireModels<
  T extends Array<any> | ((...args: any) => any) | Record<string, any>
>(requireFn: (factory: HoldCallback) => T): T {
  return createRequiredModels<T>(requireFn);
}
