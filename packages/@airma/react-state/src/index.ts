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
  createField,
  createMethod,
  createCacheField
} from './libs/reducer';
import { shallowEqual as shallowEq, createProxy, noop } from './libs/tools';
import { EffectOn, GlobalConfig, ModelAction, Selector } from './type';
import type {
  AirModelInstance,
  AirReducer,
  Connection,
  FactoryInstance,
  InstanceActionRuntime,
  Action
} from './libs/type';

const ConfigContext = createContext<GlobalConfig | undefined>(undefined);

function useInitialize<T extends () => any>(callback: T): ReturnType<T> {
  const ref = useRef<null | { result: ReturnType<T> }>(null);
  if (ref.current == null) {
    ref.current = { result: callback() };
    return ref.current.result;
  }
  return ref.current.result;
}

function useSourceControlledModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  state: D,
  onChange: (s: S) => any,
  option?: { disabled: boolean }
): T {
  const { disabled } = option || {};
  const current = createModel<S, T, D>(model, state, {
    controlled: true
  });

  const dispatch = ({ state: actionState }: Action) => {
    if (state === actionState) {
      return;
    }
    if (!disabled) {
      onChange(actionState);
    }
  };
  const persistDispatch = usePersistFn(dispatch);
  const tunnel = current.tunnel(persistDispatch);

  useEffect(() => {
    tunnel.connect();
    return () => {
      tunnel.disconnect();
    };
  });

  useEffect(() => {
    current.renew();
    return () => {
      current.destroy();
    };
  }, []);

  return current.getCurrent();
}

export function useControlledModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  state: D,
  onChange: (s: S) => any
): T {
  return useSourceControlledModel(model, state, onChange);
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
  storeCreators?: Array<any> | ((...args: any) => any) | Record<string, any>;
  children?: ReactNode;
}> = function RequiredModelProvider({ keys, value, storeCreators, children }) {
  const storeKeys = (function extractCreators() {
    if (storeCreators != null) {
      return storeCreators;
    }
    return keys != null ? keys : value;
  })();
  if (storeKeys == null) {
    throw new Error('You need to provide keys to `Provider`');
  }
  const { batchUpdate } = useOptimize();
  const context = useContext(ReactStateContext);
  const selector = useInitialize(() => {
    return createStoreCollection(storeKeys, {
      batchUpdate,
      parent: context || undefined
    });
  });

  useEffect(() => {
    selector.update(storeKeys, {
      batchUpdate,
      parent: context || undefined
    });
    return () => {
      selector.destroy();
    };
  }, [selector, storeKeys, context]);

  return createElement(
    ReactStateContext.Provider,
    { value: selector },
    children
  );
};

function findConnection<S, T extends AirModelInstance>(
  c: Selector | null | undefined,
  m: AirReducer<S | undefined, T> & {
    connection?: Connection<S | undefined, T>;
  }
): Connection<S | undefined, T> | undefined {
  if (c == null) {
    return m.connection;
  }
  const d = c.get(m);
  if (!d) {
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
  connection: Connection<S | undefined, T>,
  actionInState: Action | null
) {
  function getDispatchId(
    m:
      | (((...args: any[]) => any) & { dispatchId?: (...args: any[]) => any })
      | null
  ) {
    if (m == null) {
      return null;
    }
    return m.dispatchId || m;
  }

  const useEffectWrap = function useEffectWrap(
    callback: (ins: T, act: Action | null) => void | (() => void)
  ) {
    const onActionRef = useRef<null | ((...args: any[]) => any)[]>(null);
    const onChangeRef = useRef<null | any[]>(null);
    const onChangeCallbackRef = useRef<null | ((ins: T) => any[])>(null);
    const [action, setAction] = useState<Action | null>(null);
    const runtime = useInstanceActionRuntime();
    const persistDispatch = usePersistFn((currentAction: Action) => {
      if (action === currentAction) {
        return;
      }
      if (!currentAction.type) {
        return;
      }
      const instance = connection.getCurrent(runtime);
      const onActions = onActionRef.current;
      const onChangeCallback = onChangeCallbackRef.current;
      if (onActions == null && onChangeCallback == null) {
        return;
      }
      const prevOnChanges = onChangeRef.current;
      const currentOnChanges = onChangeCallback
        ? onChangeCallback(instance)
        : null;
      onChangeRef.current = currentOnChanges;
      if (
        onActions &&
        onActions.length &&
        onActions
          .map(getDispatchId)
          .indexOf(getDispatchId(currentAction.method)) < 0
      ) {
        return;
      }
      if (
        currentOnChanges != null &&
        prevOnChanges != null &&
        shallowEq(currentOnChanges, prevOnChanges)
      ) {
        return;
      }
      setAction(currentAction);
    });

    const tunnel = connection.tunnel(persistDispatch);

    useEffect(() => {
      if (onActionRef.current == null && onChangeCallbackRef.current == null) {
        return noop;
      }
      if (onActionRef.current != null && action == null) {
        return noop;
      }
      const instance = connection.getCurrent(runtime);
      return callback(instance, action);
    }, [action]);

    useEffect(() => {
      if (onActionRef.current != null || onChangeCallbackRef.current != null) {
        return noop;
      }
      const instance = connection.getCurrent(runtime);
      return callback(instance, actionInState);
    }, [actionInState]);

    useEffect(() => {
      tunnel.connect();
      return () => {
        tunnel.disconnect();
      };
    }, []);

    const effectOn: EffectOn<T> = {
      onActions(filter: (ins: T) => ((...args: any[]) => any)[]) {
        const result = filter(connection.getCurrent(runtime));
        if (!Array.isArray(result)) {
          throw new Error(
            'The `filter callback` for method `on` should return an action method array.'
          );
        }
        onActionRef.current = result.filter(d => typeof d === 'function');
        return effectOn;
      },
      onChanges(filter: (ins: T) => any[]) {
        onChangeCallbackRef.current = filter;
        return effectOn;
      }
    };

    return effectOn;
  };

  const useWatchtWrap = function useWatchtWrap(
    callback: (ins: T, act: Action | null) => void | (() => void)
  ) {
    const onActionRef = useRef<null | ((...args: any[]) => any)[]>(null);
    const onChangeRef = useRef<null | any[]>(null);
    const onChangeCallbackRef = useRef<null | ((ins: T) => any[])>(null);
    const runtime = useInstanceActionRuntime();
    const persistDispatch = usePersistFn((action: Action) => {
      if (!action.type) {
        return noop;
      }
      const instance = connection.getCurrent(runtime);
      const onActions = onActionRef.current;
      const onChangeCallback = onChangeCallbackRef.current;
      const prevOnChanges = onChangeRef.current;
      const currentOnChanges = onChangeCallback
        ? onChangeCallback(instance)
        : null;
      onChangeRef.current = currentOnChanges;
      if (
        onActions &&
        onActions.length &&
        onActions.map(getDispatchId).indexOf(getDispatchId(action.method)) < 0
      ) {
        return noop;
      }
      if (
        currentOnChanges != null &&
        prevOnChanges != null &&
        shallowEq(currentOnChanges, prevOnChanges)
      ) {
        return noop;
      }
      return callback(instance, action);
    });
    const tunnel = connection.tunnel(persistDispatch);

    useEffect(() => {
      tunnel.connect();
      return () => {
        tunnel.disconnect();
      };
    }, []);

    const effectOn: EffectOn<T> = {
      onActions(filter: (ins: T) => ((...args: any[]) => any)[]) {
        const result = filter(connection.getCurrent(runtime));
        if (!Array.isArray(result)) {
          throw new Error(
            'The `filter callback` for method `on` should return an action method array.'
          );
        }
        onActionRef.current = result.filter(d => typeof d === 'function');
        return effectOn;
      },
      onChanges(filter: (ins: T) => any[]) {
        onChangeCallbackRef.current = filter;
        return effectOn;
      }
    };

    return effectOn;
  };

  const getConnection = function getConnection() {
    return {
      isDestroyed() {
        return connection.isDestroyed();
      },
      setPayload<P>(setter: (payload: P) => P) {
        return connection.setPayload<P>(setter);
      },
      getPayload<P>() {
        return connection.getPayload<P>();
      }
    };
  };
  return {
    useEffectWrap,
    useWatchtWrap,
    getConnection
  };
}

function useSourceTupleModel<S, T extends AirModelInstance, D extends S>(
  modelLike:
    | AirReducer<S | undefined, T>
    | { key: AirReducer<S | undefined, T> },
  state?: D,
  option?: {
    required?: boolean;
    signal?: boolean;
    useDefaultState?: boolean;
  }
): [S | undefined, T, (s: S | undefined) => void, () => T] {
  const model = typeof modelLike === 'function' ? modelLike : modelLike.key;
  const defaultOpt = {
    required: false
  };
  const { useDefaultState, signal } = {
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
  const isFactoryValidate = (model as FactoryInstance<any>).isFactory;
  const required =
    typeof isFactoryValidate === 'function' && isFactoryValidate();
  const connection = required ? findConnection(context, model) : undefined;
  if (required && !connection) {
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
  const instance = useInitialize(
    () =>
      connection || createModel<S | undefined, T, D | undefined>(model, state)
  );

  const isConnection = useInitialize(() => !!connection);

  instance.optimize(batchUpdate);

  const current = connection || instance;

  if (modelRef.current !== model && !connection) {
    modelRef.current = model;
    current.update(model);
  }
  const [actionState, setActionState] = useState<{
    agent: T;
    action: null | Action;
  }>({ agent: current.getCurrent(runtime), action: null });
  const updateVersionRef = useRef(current.getVersion());
  const prevSelectionRef = useRef<null | string[]>(null);

  const { agent } = actionState;

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
    if (
      signal &&
      prevSelectionRef.current &&
      equalByKeys(currentAgent, agent, prevSelectionRef.current)
    ) {
      return;
    }
    setActionState({ agent: currentAgent, action });
  };
  const persistDispatch = usePersistFn(dispatch);

  useLayoutEffect(() => {
    isEffectStageRef.current = true;
    prevOpenSignalRef.current = openSignalRef.current;
  });

  const tunnel = current.tunnel(persistDispatch);

  useEffect(() => {
    tunnel.connect();
    return () => {
      tunnel.disconnect();
    };
  });

  useEffect(() => {
    unmountRef.current = false;
    current.renew();
    return () => {
      unmountRef.current = true;
      prevSelectionRef.current = null;
      if (!isConnection) {
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
    useEffect?: (callback: (ins: T) => void | (() => void)) => void;
    useWatch?: (callback: (ins: T) => void) => void;
    getConnection?: () => { isDestroyed: () => boolean };
  } = prevOpenSignalRef.current ? signalCallback : persistSignalCallback;

  const { useEffectWrap, useWatchtWrap, getConnection } = watch(
    current,
    actionState.action
  );

  signalUsage.useEffect = useEffectWrap;
  signalUsage.useWatch = useWatchtWrap;
  signalUsage.getConnection = getConnection;

  const stableInstance = agent;

  if (signal) {
    return [
      current.getState(),
      stableInstance,
      current.updateState,
      signalUsage
    ];
  }

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
  model: AirReducer<S | undefined, T> | { key: AirReducer<S | undefined, T> },
  state?: D,
  option?: {
    required?: boolean;
    signal?: boolean;
    useDefaultState?: boolean;
  }
): [S | undefined, T, () => T] {
  const result = useSourceTupleModel(model, state, option);
  const [s, agent, updateState, createSignal] = result;
  return [s, agent, createSignal];
}

export function useModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T> | { key: AirReducer<S | undefined, T> },
  state?: D
): T {
  const useDefaultState = arguments.length > 1;
  const [, agent] = useTupleModel(model, state, {
    useDefaultState
  });
  return agent;
}

export function useSignal<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T> | { key: AirReducer<S | undefined, T> },
  state?: D
): () => T {
  const useDefaultState = arguments.length > 1;
  const [, , createSignal] = useTupleModel(model, state, {
    useDefaultState,
    signal: true
  });
  return createSignal;
}

const requiredError = (api: string): string =>
  `API "${api}" can not work, there is no matched Provider with its store key.`;

export function useSelector<
  R extends AirReducer<any, any>,
  C extends (instance: ReturnType<R>) => any
>(
  factoryModel: R | { key: R },
  callback: C,
  equalFn?: (c: ReturnType<C>, n: ReturnType<C>) => boolean
): ReturnType<C> {
  const key =
    typeof factoryModel === 'function' ? factoryModel : factoryModel.key;
  const { batchUpdate } = useOptimize();
  const context = useContext(ReactStateContext);
  const runtime = useInstanceActionRuntime();
  const connection = findConnection(context, key);
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
    unmountRef.current = false;
    return () => {
      unmountRef.current = true;
    };
  }, []);
  return s.data;
}

export function provide(
  ...keys: (Array<any> | ((...args: any) => any) | Record<string, any>)[]
) {
  const connect = function connect<
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
  connect.to = function to<
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
  return connect;
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

  const apiStore = function apiStore(
    state?: S,
    k?: FactoryInstance<any>,
    keys: FactoryInstance<any>[] = []
  ) {
    const hasParams = arguments.length > 0;
    const key = (function computeKey() {
      if (k != null) {
        return k;
      }
      return hasParams ? createKey(m, state).static() : createKey(m).static();
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

    const apiStoreInstance = function apiStoreInstance(s?: S) {
      if (!arguments.length) {
        return key.getInstance();
      }
      key.initialize(s);
      return key.getInstance();
    };

    function global() {
      const staticModelKey = key;

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

      const useApiGlobalSelector = function useApiGlobalSelector(
        c: (i: T) => any,
        eq?: (a: ReturnType<typeof c>, b: ReturnType<typeof c>) => boolean
      ) {
        return useSelector(staticModelKey, c, eq);
      };

      const apiGlobalInstance = function apiGlobalInstance(s?: S) {
        if (!arguments.length) {
          return staticModelKey.getInstance();
        }
        staticModelKey.initialize(s);
        return staticModelKey.getInstance();
      };
      return {
        key,
        useModel: useApiGlobalModel,
        useSignal: useApiGlobalSignal,
        useSelector: useApiGlobalSelector,
        instance: apiGlobalInstance
      };
    }

    const storeApi = {
      key,
      keys,
      useModel: useApiStoreModel,
      useSignal: useApiStoreSignal,
      useSelector: useApiStoreSelector,
      /** @deprecated* */
      static: global,
      provide: apiStoreProvide,
      provideTo: apiStoreProvideTo,
      Provider: ApiStoreProvider,
      instance: apiStoreInstance
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

  const apiKey = function apiKey(state?: S, k?: FactoryInstance<any>) {
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

    const useApiStoreSelector = function useApiStoreSelector(
      c: (i: T) => any,
      eq?: (a: ReturnType<typeof c>, b: ReturnType<typeof c>) => boolean
    ) {
      return useSelector(key, c, eq);
    };

    return {
      key,
      useModel: useApiStoreModel,
      useSignal: useApiStoreSignal,
      useSelector: useApiStoreSelector
    };
  };

  function createStoreApi(s?: S) {
    return arguments.length ? apiStore(s) : apiStore();
  }

  function createKeyApi(s?: S) {
    return arguments.length ? apiKey(s) : apiKey();
  }

  return Object.assign(m, {
    useModel: useApiModel,
    useSignal: useApiSignal,
    useControlledModel: useApiControlledModel,
    createStore: createStoreApi,
    createKey: createKeyApi
  });
};

model.create = model;
model.createCacheField = createCacheField;
model.createField = createField;
model.createMethod = createMethod;
