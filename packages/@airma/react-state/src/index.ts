import type {
  AirModelInstance,
  AirReducer,
  Action,
  Connection
} from '@airma/core';
import type { FC, ReactNode } from 'react';

import {
  createStore,
  factory as createFactory,
  createModel,
  ModelFactoryStore,
  shallowEqual as shallowEq
} from '@airma/core';
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

export function useControlledModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  state: D,
  onChange: (s: S) => any
): T {
  const current = useMemo(() => createModel<S, T, D>(model, state), []);
  current.update(model, { state });

  const dispatch = ({ state: actionState }: Action) => {
    onChange(actionState);
  };
  const persistDispatch = usePersistFn(dispatch);
  current.connect(persistDispatch);

  useEffect(() => {
    current.update(model, { state });
    current.connect(persistDispatch);
    return () => {
      current.disconnect(persistDispatch);
    };
  }, []);
  return current.agent;
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
  parent: Selector | null;
} & ModelFactoryStore<any>;

const ReactStateContext = createContext<Selector | null>(null);

export const RequiredModelProvider: FC<{
  value: Array<any> | ((...args: any) => any) | Record<string, any>;
  children: ReactNode;
}> = ({ value, children }) => {
  const context = useContext(ReactStateContext);
  const storeRef = useRef(createStore(value));
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

function findConnection<S, T extends AirModelInstance>(
  c: Selector,
  m: AirReducer<S | undefined, T>
): Connection<S | undefined, T> | undefined {
  const d = c.get(m);
  if (!d && c.parent) {
    return findConnection(c.parent, m);
  }
  return d as Connection<S | undefined, T> | undefined;
}

type AirReducerLike = AirReducer<any, any> & {
  getSourceFrom?: () => AirReducer<any, any>;
};

function useSourceTupleModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>,
  state?: D,
  option?: { refresh?: boolean; required?: boolean; autoRequired?: boolean }
): [S | undefined, T, (s: S | undefined) => void] {
  const defaultOpt = { refresh: false, required: false, autoRequired: false };
  const { refresh, required, autoRequired } = option ? option : defaultOpt;
  const context = useContext(ReactStateContext);
  const connection =
    context && required ? findConnection(context, model) : undefined;
  if (required && !autoRequired && !connection) {
    throw new Error('Can not find a right model in store.');
  }
  const modelRef = useRef<AirReducer<S, T>>(model);
  const instance = useMemo(
    () => createModel<S | undefined, T, D | undefined>(model, state),
    []
  );
  const current = connection || instance;
  const refreshStateRef = useRef<{ state: S | undefined } | null>(null);
  const [s, setS] = useState<S | undefined>(current.getState());
  if (modelRef.current !== model && !connection) {
    modelRef.current = model;
    current.update(model);
  }

  const dispatch = ({ state: actionState }: Action) => {
    setS(actionState);
  };
  const persistDispatch = usePersistFn(dispatch);
  current.connect(persistDispatch);

  if (
    (!refreshStateRef.current || refreshStateRef.current.state !== state) &&
    refresh
  ) {
    current.update(model, { state, cache: true });
  }
  refreshStateRef.current = { state };

  useEffect(() => {
    if (!connection) {
      current.update(model, { state: s });
    }
    current.connect(persistDispatch);
    return () => {
      current.disconnect(persistDispatch);
    };
  }, []);
  return [current.getState(), current.agent, current.updateState];
}

function useTupleModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>
): [S | undefined, T];
function useTupleModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  state: D,
  option?: { refresh?: boolean; required?: boolean; autoRequired?: boolean }
): [S, T];
function useTupleModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>,
  state?: D,
  option?: { refresh?: boolean; required?: boolean; autoRequired?: boolean }
): [S | undefined, T] {
  const getSourceFrom = (model as AirReducerLike).getSourceFrom;
  const sourceFrom =
    typeof getSourceFrom === 'function' ? getSourceFrom() : undefined;
  const result = useSourceTupleModel(sourceFrom || model, state, option);
  const [s, agent, updateState] = result;
  const controlledAgent = useControlledModel(model, s, updateState);
  return [s, sourceFrom ? controlledAgent : agent];
}

export function useModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>
): T;
export function useModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  state: D,
  option?: { refresh?: boolean; required?: boolean; autoRequired?: boolean }
): T;
export function useModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>,
  state?: D,
  option?: { refresh?: boolean; required?: boolean; autoRequired?: boolean }
): T {
  const [, agent] = useTupleModel(model, state, option);
  return agent;
}

export function useRefreshModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  state: D,
  option?: { required?: boolean; autoRequired?: boolean }
): T {
  return useModel(model, state, { ...option, refresh: true });
}

export function useRequiredModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>,
  state?: D,
  option?: { refresh?: boolean; autoRequired?: boolean }
): T {
  return useModel(model, state, { ...option, required: true });
}

const requiredError = (api: string): string => {
  return `API "${api}" can only work in a RequiredModelProvider which contains the right seeking factory model`;
};

export function useRequiredModelState<
  S,
  T extends AirModelInstance,
  D extends S
>(
  model: AirReducer<S | undefined, T>,
  defaultState?: D
): [S | undefined, (s: S | undefined) => void] {
  const context = useContext(ReactStateContext);
  const connection = context ? findConnection(context, model) : undefined;
  if (!connection) {
    throw new Error(requiredError('useRequiredModelState'));
  }
  const [, setState] = useState(0);

  if (
    connection.getCacheState() == null &&
    connection.getState() !== defaultState
  ) {
    connection.update(model, { state: defaultState });
  }

  const dispatch = usePersistFn(() => {
    setState(s => s + 1);
  });
  connection.connect(dispatch);

  useEffect(() => {
    connection.connect(dispatch);
    return () => {
      connection.disconnect(dispatch);
    };
  }, []);

  const updateState = usePersistFn((s: S | undefined) => {
    connection.updateState(s);
  });
  return [connection.getState(), updateState];
}

export function useSelector<
  S,
  T extends AirModelInstance,
  C extends (instance: T) => any
>(
  factoryModel: AirReducer<S | undefined, T>,
  callback: C,
  equalFn?: (c: ReturnType<C>, n: ReturnType<C>) => boolean
): ReturnType<C> {
  const context = useContext(ReactStateContext);
  const connection = context ? findConnection(context, factoryModel) : null;
  if (!connection) {
    throw new Error(requiredError('useSelector'));
  }
  const agent = connection.agent;
  const [s, setS] = useState(callback(agent));
  const dispatch = usePersistFn(() => {
    const next = callback(connection.agent);
    if (equalFn ? equalFn(s, next) : Object.is(s, next)) {
      return;
    }
    setS(next);
  });
  connection.connect(dispatch);

  useEffect(() => {
    connection.connect(dispatch);
    return () => {
      connection.disconnect(dispatch);
    };
  }, []);
  return s;
}

export function useLocalSelector<
    S,
    T extends AirModelInstance,
    C extends (instance: T) => any,
    D extends S
>(
    model: AirReducer<S | undefined, T>,
    callback: C,
    defaultState?:D
): ReturnType<C> {
  const modelRef = useRef<AirReducer<S, T>>(model);
  const current = useMemo(
      () => createModel<S | undefined, T, D|undefined>(model,defaultState),
      []
  );
  const agent = current.agent;
  const [a, setA] = useState(callback(agent));

  if(modelRef.current!==model){
    current.update(model);
  }
  modelRef.current = model;

  const dispatch = usePersistFn(() => {
    const next = callback(current.agent);
    setA(next);
  });
  current.connect(dispatch);

  useEffect(() => {
    current.update(model, { state: current.getState() });
    current.connect(dispatch);
    return () => {
      current.disconnect(dispatch);
    };
  }, []);
  return a;
}

export const shallowEqual = shallowEq;

export const factory = createFactory;
