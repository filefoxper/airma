import type { ComponentType, FC, ReactNode } from 'react';

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
import { usePersistFn } from '@airma/react-hooks-core';
import type {
  AirModelInstance,
  AirReducer,
  Action,
  Connection,
  FactoryInstance
} from './libs/type';
import createModel, {
  checkIfLazyIdentifyConnection,
  createStoreCollection,
  factory as createFactory,
  getRuntimeContext,
  staticFactory
} from './libs/reducer';
import { shallowEqual as shallowEq, createProxy } from './libs/tools';
import type { AirReducerLike, GlobalConfig, Selector } from './type';

const realtimeInstanceMountProperty =
  '@@_airmaReactStateRealtimeInstancePropertyV18_@@';

const ConfigContext = createContext<GlobalConfig | undefined>(undefined);

function useSourceControlledModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  state: D,
  onChange: (s: S) => any,
  option?: { disabled: boolean }
): T {
  const { disabled } = option || {};
  const modelRef = useRef(model);
  const current = useMemo(
    () =>
      createModel<S, T, D>(model, state, {
        controlled: true
      }),
    []
  );
  if (
    !disabled &&
    (state !== current.getState() || model !== modelRef.current)
  ) {
    current.update(model, { state, ignoreDispatch: true });
    modelRef.current = model;
  }

  const dispatch = ({ state: actionState }: Action) => {
    if (state === actionState) {
      return;
    }
    if (!disabled) {
      onChange(actionState);
    }
  };
  const persistDispatch = usePersistFn(dispatch);
  current.connect(persistDispatch);

  useEffect(() => {
    current.connect(persistDispatch);
    return () => {
      current.disconnect(persistDispatch);
    };
  }, []);

  return createProxy(current.getCurrent(), {
    get(target: T, p: Exclude<keyof T, number>, receiver: any): any {
      const v = target[p];
      if (p === realtimeInstanceMountProperty) {
        return current.agent;
      }
      return v;
    }
  });
}

export function useControlledModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  state: D,
  onChange: (s: S) => any
): T {
  return useSourceControlledModel(model, state, onChange);
}

/**
 * @deprecated
 * @param method
 * @param params
 */
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

export const Provider: FC<{
  keys?: Array<any> | ((...args: any) => any) | Record<string, any>;
  value?: Array<any> | ((...args: any) => any) | Record<string, any>;
  children?: ReactNode;
}> = function RequiredModelProvider({ keys, value, children }) {
  const storeKeys = keys != null ? keys : value;
  if (storeKeys == null) {
    throw new Error('You need to provide keys to `Provider`');
  }
  const config = useContext(ConfigContext);
  const { batchUpdate } = config || {};
  const context = useContext(ReactStateContext);
  const storeMemo = useMemo(
    () => createStoreCollection(storeKeys, { batchUpdate }),
    []
  );
  const selector = useMemo(() => {
    const store = storeMemo.update(storeKeys);
    return { ...store, parent: context };
  }, [context, storeKeys]);
  return createElement(
    ReactStateContext.Provider,
    { value: selector },
    children
  );
};

/**
 * @deprecated
 */
export const StoreProvider = Provider;

/**
 * @deprecated
 */
export const ModelProvider = Provider;

function findConnection<S, T extends AirModelInstance>(
  c: Selector | null | undefined,
  m: AirReducer<S | undefined, T> & {
    connection?: Connection<S | undefined, T>;
  }
): Connection<S | undefined, T> | undefined {
  if (m.connection) {
    return m.connection;
  }
  if (c == null) {
    return undefined;
  }
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
  const connection = required ? findConnection(context, model) : undefined;
  if (required && !autoLink && !connection) {
    throw new Error(
      'The model in usage is a `store key`, it should match with a store created by `StoreProvider`.'
    );
  }
  const needInitializeScopeConnection =
    connection != null &&
    !!useDefaultState &&
    connection.getCacheState() == null;
  if (needInitializeScopeConnection) {
    connection.update(model, { state, cache: true, ignoreDispatch: true });
  }
  if (connection != null) {
    checkIfLazyIdentifyConnection(connection);
  }
  const modelRef = useRef<AirReducer<S | undefined, T>>(model);
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
  if (modelRef.current !== model && !connection) {
    modelRef.current = model;
    current.update(model);
  }
  const [agent, setAgent] = useState(current.getCurrent());
  const dispatch = () => {
    setAgent(current.getCurrent());
  };
  const persistDispatch = usePersistFn(dispatch);
  const prevStateRef = useRef<{ state: D | undefined }>({ state });
  useEffect(() => {
    const prevState = prevStateRef.current;
    prevStateRef.current = { state };
    if (refresh && prevState.state !== state) {
      current.update(model, { state, cache: true });
    }
  }, [state]);

  const tunnel = current.tunnel(persistDispatch);

  useEffect(() => {
    tunnel.connect();
    return () => {
      tunnel.disconnect();
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
  const connection = findConnection(context, factoryModel);
  if (!connection) {
    throw new Error(requiredError('useSelector'));
  }
  checkIfLazyIdentifyConnection(connection);
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

  // connection.connect(dispatch);
  const tunnel = connection.tunnel(dispatch);

  useEffect(() => {
    tunnel.connect();
    return () => {
      tunnel.disconnect();
    };
  }, []);

  return s.data;
}

export function provide(
  keys: Array<any> | ((...args: any) => any) | Record<string, any>
) {
  return function connect<
    P extends Record<string, any>,
    C extends ComponentType<P>
  >(Comp: C): ComponentType<P> {
    return function WithModelProviderComponent(props: P) {
      return createElement(
        Provider,
        { value: keys },
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

export const createKey = function createKey<S, T extends AirModelInstance>(
  m: AirReducer<S, T>,
  s?: S
) {
  const lazy = arguments.length < 2;
  return createFactory(m, s, lazy);
};

export const ConfigProvider: FC<{
  value: GlobalConfig;
  children?: ReactNode;
}> = function ConfigProvider(props) {
  const { value, children } = props;
  return createElement(ConfigContext.Provider, { value }, children);
};

export const model = function model<S, T extends AirModelInstance>(
  m: AirReducer<S | undefined, T>
) {
  const useApiModel = function useApiModel(s?: S) {
    const params = (arguments.length ? [m, s] : [m]) as [
      typeof m,
      (S | undefined)?
    ];
    return useModel(...params);
  };

  const useApiControlledModel = function useApiControlledModel(
    state: S | undefined,
    setState: (s: S | undefined) => any
  ) {
    return useControlledModel(m, state, setState);
  };

  const apiStore = function apiStore(state?: S, k?: any, keys: any[] = []) {
    const hasParams = arguments.length > 0;
    const key = (function computeKey() {
      if (k != null) {
        return k;
      }
      return hasParams ? createKey(m, state) : createKey(m);
    })();

    const useApiStoreModel = function useApiStoreModel(s?: S) {
      const params = (arguments.length ? [key, s] : [key]) as [
        typeof key,
        (S | undefined)?
      ];
      return useModel(...params);
    };

    const useApiStoreSelector = function useApiStoreSelector(
      c: (i: T) => any,
      eq?: (a: ReturnType<typeof c>, b: ReturnType<typeof c>) => boolean
    ) {
      return useSelector(key, c, eq);
    };

    const apiStoreProvide = function apiStoreProvide() {
      return provide([key, ...keys]);
    };

    const apiStoreProvideTo = function apiStoreProvideTo(
      component: FunctionComponent
    ) {
      return provide([key, ...keys])(component);
    };

    const ApiStoreProvider = function ApiStoreProvider({
      children
    }: {
      children?: ReactNode;
    }) {
      return createElement(Provider, { value: [key, ...keys] }, children);
    };

    function global() {
      const staticModelKey = key.global();

      const useApiGlobalModel = function useApiGlobalModel(s?: S) {
        const params = (
          arguments.length ? [staticModelKey, s] : [staticModelKey]
        ) as [typeof staticModelKey, (S | undefined)?];
        return useModel(...params);
      };
      const useApiGlobalSelector = function useApiGlobalSelector(
        c: (i: T) => any,
        eq?: (a: ReturnType<typeof c>, b: ReturnType<typeof c>) => boolean
      ) {
        return useSelector(staticModelKey, c, eq);
      };
      return {
        useModel: useApiGlobalModel,
        useSelector: useApiGlobalSelector
      };
    }

    const storeApi = {
      key,
      keys,
      useModel: useApiStoreModel,
      useSelector: useApiStoreSelector,
      asGlobal: global,
      provide: apiStoreProvide,
      provideTo: apiStoreProvideTo,
      Provider: ApiStoreProvider
    };

    const withKeys = function withKeys(
      ...stores: (
        | {
            key: AirReducer<any, any>;
          }
        | AirReducer<any, any>
      )[]
    ) {
      const nks = keys.concat(
        stores.map(store => (typeof store === 'function' ? store : store.key))
      );
      return apiStore(state, key, nks);
    };

    return {
      ...storeApi,
      with: withKeys
    };
  };

  function createStoreApi(s?: S) {
    return arguments.length ? apiStore(s) : apiStore();
  }

  return Object.assign(m, {
    useModel: useApiModel,
    useControlledModel: useApiControlledModel,
    store: createStoreApi,
    createStore: createStoreApi
  });
};

model.context = getRuntimeContext;
model.create = model;
