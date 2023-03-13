import type {
  AirModelInstance,
  AirReducer,
  Action,
  Connection,
  FactoryInstance
} from '@airma/core';
import type { ComponentType, FC, ReactNode } from 'react';

import {
  createStore,
  factory as createFactory,
  createModel,
  shallowEqual as shallowEq,
  createProxy
} from '@airma/core';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  createContext,
  createElement,
  useContext,
  FunctionComponent
} from 'react';
import type { AirReducerLike, Selector } from './type';

const realtimeInstanceMountProperty =
  '@@_airmaReactStateRealtimeInstancePropertyV17_@@';

function usePersistFn<T extends (...args: any[]) => any>(callback: T): T {
  const dispatchRef = useRef<T>(callback);
  dispatchRef.current = callback;
  const persistRef = useRef((...args: any[]): any =>
    dispatchRef.current(...args)
  );
  return persistRef.current as T;
}

function useSourceControlledModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  state: D,
  onChange: (s: S) => any,
  option?: { disabled: boolean }
): T {
  const { disabled } = option || {};
  const modelRef = useRef(model);
  const current = useMemo(() => createModel<S, T, D>(model, state, true), []);
  if (
    !disabled &&
    (state !== current.getState() || model !== modelRef.current)
  ) {
    current.update(model, { state, ignoreDispatch: true });
    modelRef.current = model;
  }

  const dispatch = ({ state: actionState }: Action) => {
    if (!disabled) {
      onChange(actionState);
    }
  };
  const persistDispatch = usePersistFn(dispatch);
  current.connect(persistDispatch);

  useEffect(() => {
    if (!disabled) {
      current.update(model, { state });
    }
    current.connect(persistDispatch);
    return () => {
      current.disconnect(persistDispatch);
    };
  }, []);
  return current.agent;
}

export function useControlledModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  state: D,
  onChange: (s: S) => any
): T {
  return useSourceControlledModel(model, state, onChange);
}

export function useRefresh<T extends (...args: any[]) => any>(
  method: T,
  params:
    | Parameters<T>
    | {
        refreshDeps?: any[];
        variables: Parameters<T>;
      }
) {
  const isVariableParams = Array.isArray(params);
  const refreshDeps = (function computeRefreshDeps() {
    if (isVariableParams) {
      return params;
    }
    if (!params) {
      return undefined;
    }
    return params.refreshDeps;
  })();
  const variables = (function computeVariables() {
    if (isVariableParams) {
      return params;
    }
    if (!params) {
      return [];
    }
    return params.variables || [];
  })();
  const fn = usePersistFn(method);
  useEffect(() => {
    const result = fn(...variables);
    if (typeof result === 'function') {
      return result;
    }
    return () => undefined;
  }, refreshDeps);
}

const ReactStateContext = createContext<Selector | null>(null);

export const StoreProvider: FC<{
  value: Array<any> | ((...args: any) => any) | Record<string, any>;
  children?: ReactNode;
}> = function RequiredModelProvider({ value, children }) {
  const context = useContext(ReactStateContext);
  const storeMemo = useMemo(() => createStore(value), []);
  const selector = useMemo(() => {
    const store = storeMemo.update(value);
    return { ...store, parent: context };
  }, [context, value]);
  return createElement(
    ReactStateContext.Provider,
    { value: selector },
    children
  );
};

export const ModelProvider = StoreProvider;

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

function useSourceTupleModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>,
  state?: D,
  option?: {
    refresh?: boolean;
    required?: boolean;
    autoLink?: boolean;
    useDefaultState?: boolean;
    realtimeInstance?: boolean;
  }
): [S | undefined, T, (s: S | undefined) => void] {
  const defaultOpt = {
    refresh: false,
    required: false,
    autoLink: false,
    realtimeInstance: false
  };
  const { refresh, required, autoLink, useDefaultState, realtimeInstance } = {
    ...defaultOpt,
    ...option
  };
  const context = useContext(ReactStateContext);
  const connection =
    context && required ? findConnection(context, model) : undefined;
  if (required && !autoLink && !connection) {
    throw new Error(
      'The model in usage is a `store key`, it should match with a store created by `StoreProvider`.'
    );
  }
  const prevStateRef = useRef<null | { state: D | undefined }>(null);
  const modelRef = useRef<AirReducer<S, T>>(model);
  const instanceRef = useRef(
    useMemo(
      () =>
        connection ||
        createModel<S | undefined, T, D | undefined>(model, state),
      []
    )
  );
  const instance = instanceRef.current;
  const current = connection || instance;
  const needInitializeScopeConnection =
    connection != null &&
    !!useDefaultState &&
    connection.getCacheState() == null &&
    !refresh;
  if (needInitializeScopeConnection) {
    connection.update(model, { state, cache: true, ignoreDispatch: true });
  }
  if (modelRef.current !== model && !connection) {
    modelRef.current = model;
    current.update(model);
  }
  const initialState = current.getState();
  const [s, setS] = useState<S | undefined>(initialState);
  const [agent, setAgent] = useState(current.getCurrent());
  const dispatch = ({ state: actionState }: Action) => {
    setAgent(current.getCurrent());
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
    current.connect(persistDispatch);
    return () => {
      current.disconnect(persistDispatch);
    };
  }, []);

  useEffect(() => {
    if (needInitializeScopeConnection) {
      current.notice();
    }
  }, [needInitializeScopeConnection]);

  if (realtimeInstance) {
    return [current.getState(), current.agent, current.updateState];
  }

  const stableInstance = createProxy(agent, {
    get(target: T, p: Exclude<keyof T, number>, receiver: any): any {
      const v = target[p];
      if (p === realtimeInstanceMountProperty) {
        return current.agent;
      }
      return v;
    }
  });

  return [current.getState(), stableInstance, current.updateState];
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
    useDefaultState?: boolean;
    realtimeInstance?: boolean;
  }
): [S, T];
function useTupleModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>,
  state?: D,
  option?: {
    refresh?: boolean;
    required?: boolean;
    autoLink?: boolean;
    useDefaultState?: boolean;
    realtimeInstance?: boolean;
  }
): [S | undefined, T] {
  const { getSourceFrom } = model as AirReducerLike;
  const sourceFrom =
    typeof getSourceFrom === 'function' ? getSourceFrom() : undefined;
  const result = useSourceTupleModel(sourceFrom || model, state, option);
  const [s, agent, updateState] = result;
  const controlledAgent = useSourceControlledModel(model, s, updateState, {
    disabled: !sourceFrom
  });
  return [s, sourceFrom ? controlledAgent : agent];
}

export function useModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>
): T;
export function useModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  state: D,
  option?: {
    refresh?: boolean;
    autoLink?: boolean;
    useDefaultState?: boolean;
    realtimeInstance?: boolean;
  }
): T;
export function useModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>,
  state?: D,
  option?: {
    refresh?: boolean;
    autoLink?: boolean;
    useDefaultState?: boolean;
    realtimeInstance?: boolean;
  }
): T {
  const { pipe } = model as FactoryInstance<any>;
  const { getSourceFrom } = model as AirReducerLike;
  const required =
    typeof pipe === 'function' || typeof getSourceFrom === 'function';
  const useDefaultState = arguments.length > 1;
  const [, agent] = useTupleModel(model, state, {
    required,
    useDefaultState,
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
  `API "${api}" can not work, there is no matched StoreProvider with its store key.`;

export function useSelector<
  R extends AirReducer<any, any>,
  C extends (instance: ReturnType<R>) => any
>(
  factoryModel: R,
  callback: C,
  equalFn?: (c: ReturnType<C>, n: ReturnType<C>) => boolean
): ReturnType<C> {
  const context = useContext(ReactStateContext);
  const connection = context ? findConnection(context, factoryModel) : null;
  if (!connection) {
    throw new Error(requiredError('useSelector'));
  }
  const current = callback(connection.getCurrent());
  const eqCallback = (s: any, t: any) =>
    equalFn ? equalFn(s, t) : Object.is(s, t);
  const [s, setS] = useState({ data: current });

  const dispatch = usePersistFn(() => {
    const next = callback(connection.getCurrent());
    if (eqCallback(s.data, next)) {
      return;
    }
    setS({ data: next });
  });

  connection.connect(dispatch);

  useEffect(() => {
    connection.connect(dispatch);
    return () => {
      connection.disconnect(dispatch);
    };
  }, []);

  return s.data;
}

export function withStoreProvider(
  models: Array<any> | ((...args: any) => any) | Record<string, any>
) {
  return function connect<
    P extends Record<string, any>,
    C extends ComponentType<P>
  >(Comp: C): ComponentType<P> {
    return function WithModelProviderComponent(props: P) {
      return createElement(
        ModelProvider,
        { value: models },
        createElement<P>(Comp as FunctionComponent<P>, props)
      );
    };
  };
}

export function useRealtimeInstance<T>(
  instance: T & { [realtimeInstanceMountProperty]?: T }
): T {
  const realtimeInstance = instance[realtimeInstanceMountProperty];
  if (!realtimeInstance) {
    return instance;
  }
  return realtimeInstance;
}

export const withModelProvider = withStoreProvider;

export function useIsModelMatchedInStore(model: AirReducer<any, any>): boolean {
  const { pipe } = model as AirReducer<any, any> & { pipe: () => void };
  const context = useContext(ReactStateContext);
  if (typeof pipe !== 'function') {
    return false;
  }
  const connection = context ? findConnection(context, model) : null;
  return connection != null;
}

export const shallowEqual = shallowEq;

export const factory = createFactory;

export const createStoreKey = createFactory;
