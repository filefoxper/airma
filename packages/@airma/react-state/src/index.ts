import type {
  AirModelInstance,
  AirReducer,
  Action,
  ModelFactoryStore,
  Connection,
  FactoryInstance
} from '@airma/core';
import type { FC, ReactNode } from 'react';

import {
  createStore,
  factory as createFactory,
  createModel,
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
  const persistRef = useRef((...args: any[]): any =>
    dispatchRef.current(...args)
  );
  return persistRef.current as T;
}

export function useControlledModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  state: D,
  onChange: (s: S) => any
): T {
  const current = useMemo(() => createModel<S, T, D>(model, state, true), []);
  current.update(model, { state, ignoreDispatch: true });

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

export const ModelProvider: FC<{
  value: Array<any> | ((...args: any) => any) | Record<string, any>;
  children: ReactNode;
}> = function RequiredModelProvider({ value, children }) {
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
  option?: {
    refresh?: boolean;
    required?: boolean;
    autoLink?: boolean;
    hasState?: boolean;
  }
): [S | undefined, T, (s: S | undefined) => void] {
  const defaultOpt = { refresh: false, required: false, autoLink: false };
  const { refresh, required, autoLink, hasState } = {
    ...defaultOpt,
    ...option
  };
  const context = useContext(ReactStateContext);
  const connection =
    context && required ? findConnection(context, model) : undefined;
  if (required && !autoLink && !connection) {
    throw new Error('Can not find a right model in store.');
  }
  const prevStateRef = useRef<null | { state: D | undefined }>(null);
  const modelRef = useRef<AirReducer<S, T>>(model);
  const instanceRef = useRef(
    useMemo(
      () => createModel<S | undefined, T, D | undefined>(model, state),
      []
    )
  );
  const instance = instanceRef.current;
  const current = connection || instance;
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

  useEffect(() => {
    const prevState = prevStateRef.current;
    prevStateRef.current = { state };
    if (refresh && (!prevState || prevState.state !== state)) {
      current.connect(persistDispatch);
      current.update(model, { state, cache: true });
    }
  }, [state]);

  useEffect(() => {
    if (!connection && !refresh) {
      current.update(model, { state: s });
    }
    if (connection && connection.getCacheState() == null && hasState && !autoLink) {
      current.updateState(state);
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
  option?: {
    refresh?: boolean;
    required?: boolean;
    autoLink?: boolean;
    hasState?: boolean;
  }
): [S, T];
function useTupleModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>,
  state?: D,
  option?: { refresh?: boolean; required?: boolean; autoLink?: boolean; hasState?: boolean; }
): [S | undefined, T] {
  const { getSourceFrom } = model as AirReducerLike;
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
  option?: { refresh?: boolean; autoLink?: boolean; hasState?:boolean }
): T;
export function useModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>,
  state?: D,
  option?: { refresh?: boolean; autoLink?: boolean; hasState?:boolean }
): T {
  const { pipe } = model as FactoryInstance<any>;
  const required = typeof pipe === 'function';
  const hasState = arguments.length > 1;
  const [, agent] = useTupleModel(model, state, {
    required,
    hasState,
    ...option
  });
  return agent;
}

export function useRefreshModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  state: D,
  option?: { autoLink?: boolean }
): T {
  return useModel(model, state, { ...option, refresh: true });
}

const requiredError = (api: string): string =>
  `API "${api}" can only work in a RequiredModelProvider which contains the right seeking factory model`;

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
  const { agent } = connection;
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

export const shallowEqual = shallowEq;

export const factory = createFactory;
