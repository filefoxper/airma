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
  StateSetModes as StateSets
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
  option?: { refresh?: boolean; required?: boolean }
): [S | undefined, T, (s: S | undefined) => void] {
  const defaultOpt = { refresh: false, required: false };
  const { refresh, required } = option ? option : defaultOpt;
  const context = useContext(ReactStateContext);
  const connection =
    context && required ? findConnection(context, model) : undefined;
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

export function useTupleModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>
): [S | undefined, T];
export function useTupleModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  state: D,
  option?: { refresh?: boolean; required?: boolean }
): [S, T];
export function useTupleModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>,
  state?: D,
  option?: { refresh?: boolean; required?: boolean }
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
  option?: { refresh?: boolean; required?: boolean }
): T;
export function useModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>,
  state?: D,
  option?: { refresh?: boolean; required?: boolean }
): T {
  const [, agent] = useTupleModel(model, state, option);
  return agent;
}

export function useRefreshModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  state: D,
  option?: { required?: boolean }
): T {
  return useModel(model, state, { ...option, refresh: true });
}

export function useRequiredModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>,
  state?: D,
  option?: { refresh?: boolean }
): T {
  return useModel(model, state, { ...option, required: true });
}

export function useFactory<
  T extends Array<any> | ((...args: any) => any) | Record<string, any>
>(factory: T, mapCallback?: (f: T) => any): [T, (m: (f: T) => T) => any] {
  const sourceFactoryRef = useRef<T>(factory);
  const factoryRef = useRef<T | null>(null);
  if (sourceFactoryRef.current !== factory || factoryRef.current == null) {
    factoryRef.current = mapCallback
      ? createFactory.mutate(factory, mapCallback)
      : factory;
    sourceFactoryRef.current = factory;
  }
  const [, setVersion] = useState<number>(0);
  const mapFactory = usePersistFn((callback: (f: T) => T) => {
    factoryRef.current = createFactory.mutate(
      factoryRef.current || factory,
      callback
    );
    setVersion(v => v + 1);
  });
  return [factoryRef.current as T, mapFactory];
}

function findStore<
  T extends Array<any> | ((...args: any) => any) | Record<string, any>
>(factory: T, selector?: Selector | null): Selector | null {
  if (!selector) {
    return null;
  }
  if (selector.equal(factory)) {
    return selector;
  }
  return findStore(factory, selector.parent);
}

export const factory = createFactory;

export const State = StateSets;
