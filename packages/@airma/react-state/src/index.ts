import {
  useRef,
  useEffect,
  useMemo,
  useState,
  createContext,
  createElement,
  useContext,
  useLayoutEffect
} from 'react';
import { usePersistFn } from '@airma/react-hooks-core';
import type { ComponentType, FC, ReactNode, FunctionComponent } from 'react';
import {
  createModel,
  checkIfLazyIdentifyConnection,
  createStoreCollection,
  factory as createFactory,
  getRuntimeContext
} from './libs/reducer';
import { shallowEqual as shallowEq, createProxy } from './libs/tools';
import type {
  AirReducerLike,
  GlobalConfig,
  ModelAction,
  Selector,
  SignalEffect,
  SignalEffectAction,
  SignalWatcher
} from './type';
import type {
  AirModelInstance,
  AirReducer,
  Connection,
  FactoryInstance,
  InstanceActionRuntime,
  Action
} from './libs/type';

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
      current.destroy();
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

function useOptimize() {
  const config = useContext(ConfigContext);
  const { batchUpdate } = config || {};
  return useMemo(() => ({ batchUpdate }), [batchUpdate]);
}

export const Provider: FC<{
  keys?: Array<any> | ((...args: any) => any) | Record<string, any>;
  value?: Array<any> | ((...args: any) => any) | Record<string, any>;
  children?: ReactNode;
}> = function RequiredModelProvider({ keys, value, children }) {
  const storeKeys = keys != null ? keys : value;
  if (storeKeys == null) {
    throw new Error('You need to provide keys to `Provider`');
  }
  const { batchUpdate } = useOptimize();
  const context = useContext(ReactStateContext);
  const storeMemo = useMemo(
    () => createStoreCollection(storeKeys, { batchUpdate }),
    []
  );
  const selector = useMemo(() => {
    const store = storeMemo.update(storeKeys);
    return { ...store, parent: context };
  }, [context, storeKeys]);

  useEffect(() => {
    return () => {
      selector.destroy();
    };
  }, []);

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

function useInstanceActionRuntime(): InstanceActionRuntime {
  const methodsCacheRef = useRef({});
  const middleWare = usePersistFn((action: Action) => {
    return action;
  });
  return { methodsCache: methodsCacheRef.current, middleWare };
}

function equalByKeys<T extends Record<string | number, any>>(
  obj: T,
  reference: T,
  keys: string[]
) {
  let result = true;
  keys.forEach(k => {
    if (obj[k] !== reference[k]) {
      result = false;
    }
  });
  return result;
}

function watch<S, T extends AirModelInstance>(
  connection: Connection<S | undefined, T>
) {
  return function useWatcher(callback: () => void | (() => void)) {
    const [action, setAction] = useState<Action | null>(null);
    const persistDispatch = usePersistFn((currentAction: Action) => {
      setAction(currentAction);
    });
    const tunnel = useMemo(() => connection.tunnel(persistDispatch), []);

    useEffect(() => {
      return callback();
    }, [action]);

    useEffect(() => {
      tunnel.connect();
      return () => {
        tunnel.disconnect();
      };
    });
  };
}

function useSourceTupleModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>,
  state?: D,
  option?: {
    refresh?: boolean;
    required?: boolean;
    autoLink?: boolean;
    signal?: boolean;
    useDefaultState?: boolean;
    realtimeInstance?: boolean;
    updateDeps?: (instance: T) => any[];
  }
): [S | undefined, T, (s: S | undefined) => void, () => T] {
  const defaultOpt = {
    refresh: false,
    required: false,
    autoLink: false,
    realtimeInstance: false
  };
  const {
    refresh,
    required,
    autoLink,
    useDefaultState,
    realtimeInstance,
    signal,
    updateDeps
  } = {
    ...defaultOpt,
    ...option
  };
  const isEffectStageRef = useRef(false);
  const openSignalRef = useRef(false);
  const prevOpenSignalRef = useRef(false);
  openSignalRef.current = false;
  isEffectStageRef.current = false;

  const { batchUpdate } = useOptimize();
  const unmountRef = useRef(false);
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
  const runtime = useInstanceActionRuntime();
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
  instance.optimize(batchUpdate);
  const current = connection || instance;
  if (modelRef.current !== model && !connection) {
    modelRef.current = model;
    current.update(model);
  }
  const [agent, setAgent] = useState(current.getCurrent(runtime));
  const updateVersionRef = useRef(current.getVersion());
  const updateDepsRef = useRef(updateDeps ? updateDeps(agent) : undefined);
  const prevSelectionRef = useRef<null | string[]>(null);

  const signalStale: {
    selection: Array<string> | null;
  } = {
    selection: []
  };
  prevSelectionRef.current = signalStale.selection;

  const dispatch = (currentAction: Action) => {
    const action = currentAction as ModelAction;
    if (unmountRef.current) {
      return;
    }
    const currentVersion = current.getVersion();
    const currentAgent = current.getCurrent(runtime);
    if (updateVersionRef.current === currentVersion && !action.payload) {
      return;
    }
    if (!action.payload) {
      updateVersionRef.current = currentVersion;
    }
    if (signal && !openSignalRef.current) {
      return;
    }
    const currentAgentDeps = updateDeps ? updateDeps(currentAgent) : undefined;
    if (
      updateDepsRef.current &&
      currentAgentDeps &&
      shallowEq(updateDepsRef.current, currentAgentDeps)
    ) {
      return;
    }
    updateDepsRef.current = currentAgentDeps;
    if (
      signal &&
      prevSelectionRef.current &&
      equalByKeys(currentAgent, agent, prevSelectionRef.current)
    ) {
      return;
    }
    setAgent(currentAgent);
  };
  const persistDispatch = usePersistFn(dispatch);
  const prevStateRef = useRef<{ state: D | undefined }>({ state });

  useLayoutEffect(() => {
    isEffectStageRef.current = true;
    prevOpenSignalRef.current = openSignalRef.current;
  });

  useEffect(() => {
    const prevState = prevStateRef.current;
    prevStateRef.current = { state };
    if (refresh && prevState.state !== state) {
      current.update(model, { state, cache: true });
    }
  }, [state]);

  const tunnel = useMemo(() => current.tunnel(persistDispatch), []);

  useEffect(() => {
    tunnel.connect();
    return () => {
      tunnel.disconnect();
    };
  });

  useEffect(() => {
    return () => {
      unmountRef.current = true;
      prevSelectionRef.current = null;
      if (connection == null) {
        current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (needInitializeScopeConnection) {
      current.notice();
    }
  }, [needInitializeScopeConnection]);

  const signalCallback = function signalCallback() {
    openSignalRef.current = true;
    if (signalStale.selection !== prevSelectionRef.current) {
      signalStale.selection = null;
    }
    const ins = current.getCurrent(runtime);
    return createProxy(ins, {
      get(target: T, p: Exclude<keyof T, number>, receiver: any): any {
        const v = target[p];
        if (
          signalStale.selection != null &&
          signalStale.selection === prevSelectionRef.current &&
          !unmountRef.current &&
          !isEffectStageRef.current
        ) {
          const selectionMap: Record<string, true> = {};
          signalStale.selection.forEach(k => {
            selectionMap[k] = true;
          });
          if (!selectionMap[p as string]) {
            signalStale.selection.push(p as string);
          }
        }
        return v;
      }
    });
  };

  const persistSignalCallback = usePersistFn(signalCallback);

  const signalUsage: (() => T) & {
    useWatcher?: (callback: () => void | (() => void)) => void;
  } = prevOpenSignalRef.current ? signalCallback : persistSignalCallback;

  signalUsage.useWatcher = watch(current);

  if (realtimeInstance || signal) {
    return [
      current.getState(),
      current.agent,
      current.updateState,
      signalUsage
    ];
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
  const stableSignalCallback = function stableSignalCallback() {
    return stableInstance;
  };
  return [
    current.getState(),
    stableInstance,
    current.updateState,
    stableSignalCallback
  ];
}

function useTupleModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>
): [S | undefined, T, () => T];
function useTupleModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  state: D,
  option?: {
    refresh?: boolean;
    required?: boolean;
    autoLink?: boolean;
    signal?: boolean;
    useDefaultState?: boolean;
    realtimeInstance?: boolean;
    updateDeps?: (instance: T) => any[];
  }
): [S, T, () => T];
function useTupleModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>,
  state?: D,
  option?: {
    refresh?: boolean;
    required?: boolean;
    autoLink?: boolean;
    signal?: boolean;
    useDefaultState?: boolean;
    realtimeInstance?: boolean;
    updateDeps?: (instance: T) => any[];
  }
): [S | undefined, T, () => T] {
  const { getSourceFrom } = model as AirReducerLike;
  const sourceFrom =
    typeof getSourceFrom === 'function' ? getSourceFrom() : undefined;
  const result = useSourceTupleModel(sourceFrom || model, state, option);
  const [s, agent, updateState, createSignal] = result;
  const controlledAgent = useSourceControlledModel(model, s, updateState, {
    disabled: !sourceFrom
  });
  return [s, sourceFrom ? controlledAgent : agent, createSignal];
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
    updateDeps?: (instance: T) => any[];
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
    updateDeps?: (instance: T) => any[];
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

export function useSignal<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>,
  state?: D
): () => T {
  const { pipe } = model as FactoryInstance<any>;
  const { getSourceFrom } = model as AirReducerLike;
  const required =
    typeof pipe === 'function' || typeof getSourceFrom === 'function';
  const useDefaultState = arguments.length > 1;
  const [, , createSignal] = useTupleModel(model, state, {
    required,
    useDefaultState,
    signal: true
  });
  return createSignal;
}

/**
 * @deprecated
 * @param model
 * @param state
 * @param option
 */
export function useStaticModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>,
  state?: D,
  option?: {
    autoLink?: boolean;
    realtimeInstance?: boolean;
  }
) {
  const { pipe } = model as FactoryInstance<any>;
  const { getSourceFrom } = model as AirReducerLike;
  const required =
    typeof pipe === 'function' || typeof getSourceFrom === 'function';
  const useDefaultState = arguments.length > 1;
  const [, agent] = useTupleModel(model, state, {
    required,
    useDefaultState,
    ...option,
    updateDeps: () => []
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
  const { batchUpdate } = useOptimize();
  const context = useContext(ReactStateContext);
  const runtime = useInstanceActionRuntime();
  const connection = findConnection(context, factoryModel);
  if (!connection) {
    throw new Error(requiredError('useSelector'));
  }
  checkIfLazyIdentifyConnection(connection);
  connection.optimize(batchUpdate);
  const current = callback(connection.getCurrent(runtime));
  const eqCallback = (s: any, t: any) =>
    equalFn ? equalFn(s, t) : Object.is(s, t);
  const unmountRef = useRef(false);
  const updateVersionRef = useRef(connection.getVersion());
  const [s, setS] = useState({ data: current });

  const dispatch = usePersistFn(() => {
    if (unmountRef.current) {
      return;
    }
    const currentVersion = connection.getVersion();
    if (updateVersionRef.current === currentVersion) {
      return;
    }
    updateVersionRef.current = currentVersion;
    const next = callback(connection.getCurrent(runtime));
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
  });

  useEffect(() => {
    return () => {
      unmountRef.current = true;
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
  reducerLike: AirReducer<S | undefined, T>
) {
  const m = function modelWrapper(s: S | undefined) {
    return reducerLike(s);
  };
  m.meta = {} as Record<string, any>;
  const useApiModel = function useApiModel(s?: S) {
    const params = (arguments.length ? [m, s] : [m]) as [
      typeof m,
      (S | undefined)?
    ];
    return useModel(...params);
  };

  const useApiSignal = function useApiSignal(s?: S) {
    const params = (arguments.length ? [m, s] : [m]) as [
      typeof m,
      (S | undefined)?
    ];
    return useSignal(...params);
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

    const useApiStoreSignal = function useApiStoreSignal(s?: S) {
      const params = (arguments.length ? [key, s] : [key]) as [
        typeof key,
        (S | undefined)?
      ];
      return useSignal(...params);
    };

    const useApiStaticStoreModel = function useApiStaticStoreModel(s?: S) {
      const params = (arguments.length ? [key, s] : [key]) as [
        typeof key,
        (S | undefined)?
      ];
      return useStaticModel(...params);
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

      const useApiGlobalSignal = function useApiGlobalSignal(s?: S) {
        const params = (
          arguments.length ? [staticModelKey, s] : [staticModelKey]
        ) as [typeof staticModelKey, (S | undefined)?];
        return useSignal(...params);
      };

      const useApiStaticGlobalModel = function useApiStaticGlobalModel(s?: S) {
        const params = (
          arguments.length ? [staticModelKey, s] : [staticModelKey]
        ) as [typeof staticModelKey, (S | undefined)?];
        return useStaticModel(...params);
      };
      const useApiGlobalSelector = function useApiGlobalSelector(
        c: (i: T) => any,
        eq?: (a: ReturnType<typeof c>, b: ReturnType<typeof c>) => boolean
      ) {
        return useSelector(staticModelKey, c, eq);
      };
      return {
        useModel: useApiGlobalModel,
        useSignal: useApiGlobalSignal,
        useStaticModel: useApiStaticGlobalModel,
        useSelector: useApiGlobalSelector
      };
    }

    const storeApi = {
      key,
      keys,
      useModel: useApiStoreModel,
      useSignal: useApiStoreSignal,
      useStaticModel: useApiStaticStoreModel,
      useSelector: useApiStoreSelector,
      asGlobal: global,
      static: global,
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
    useSignal: useApiSignal,
    useControlledModel: useApiControlledModel,
    store: createStoreApi,
    createStore: createStoreApi
  });
};

model.context = getRuntimeContext;
model.create = model;
