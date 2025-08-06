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
  config,
  model as asModel,
  createSelector,
  createSignal,
  createStores,
  Key,
  Model,
  ModelInstance,
  ModelKey,
  ModelUsage,
  Store,
  StoreIndex,
  validations,
  shallowEqual as shallowEq
} from 'as-model';
import { GlobalConfig, ModelStores } from './type';

const ConfigContext = createContext<GlobalConfig | undefined>(undefined);

function useInitialize<T extends () => any>(callback: T): ReturnType<T> {
  const ref = useRef<null | { result: ReturnType<T> }>(null);
  if (ref.current == null) {
    ref.current = { result: callback() };
    return ref.current.result;
  }
  return ref.current.result;
}

const ModelStoresContext = createContext<ModelStores | undefined>(undefined);

function useOptimize() {
  const config = useContext(ConfigContext);
  const { batchUpdate } = config || {};
  return useMemo(() => ({ batchUpdate }), [batchUpdate]);
}

export const Provider: FC<{
  keys?: Array<StoreIndex | ModelKey>;
  value?: Array<StoreIndex | ModelKey>;
  children?: ReactNode;
}> = function RequiredModelProvider({ keys, value, children }) {
  const storeKeys = (function extractCreators() {
    return keys != null ? keys : value;
  })();
  if (storeKeys == null) {
    throw new Error('You need to provide keys to `Provider`');
  }
  const parent = useContext(ModelStoresContext);
  const [stores, setStores] = useState((): ModelStores => {
    const collections = createStores(...storeKeys);
    return { collections, parent };
  });

  useEffect(() => {
    if (
      shallowEq(
        stores.collections.keys(),
        [...storeKeys].map(d => (validations.isModelKey(d) ? d : d.key))
      ) &&
      stores.parent === parent
    ) {
      return;
    }
    stores.collections.update(...storeKeys);
    setStores({ collections: stores.collections, parent });
  }, [stores, storeKeys, parent]);

  useEffect(() => {
    return () => {
      stores.collections.destroy();
      stores.parent = undefined;
    };
  }, []);

  return createElement(
    ModelStoresContext.Provider,
    { value: stores },
    children
  );
};

function findStore<
  S,
  T extends ModelInstance,
  R extends (getInstance: () => T) => any = (getInstance: () => T) => T
>(
  stores: ModelStores | null | undefined,
  storeIndex: Key<S, T, R> | StoreIndex<S, T, R>
): Store<S, T, R> | undefined {
  if (stores == null) {
    return undefined;
  }
  const found = stores.collections.find(storeIndex);
  if (!found) {
    return findStore(stores.parent, storeIndex);
  }
  return found;
}

function useModelInitialize<
  S,
  T extends ModelInstance,
  D extends S,
  R extends (getInstance: () => T) => any = (getInstance: () => T) => T
>(
  model: Model<S, T> | ModelKey<S, T, R> | Store<S, T, R>,
  opt?: {
    hasDefaultState?: boolean;
    state?: D;
  }
) {
  const hasDefaultState = opt?.hasDefaultState ?? false;
  const state = opt?.state;
  const stores = useContext(ModelStoresContext);
  const optimize = useOptimize();

  const ifModelIsModel =
    !validations.isModelStore<S, T, R>(model) &&
    !validations.isModelKey<S, T, R>(model);

  const initializedStore: Store<S, T, R> = useInitialize(() => {
    const store = (function findOrCreateStore() {
      if (validations.isModelStore<S, T, R>(model)) {
        const foundStore = findStore<S, T, R>(stores, model);
        return foundStore ?? model;
      }
      if (validations.isModelKey<S, T, R>(model)) {
        const foundStore = findStore<S, T, R>(stores, model);
        if (foundStore == null) {
          throw new Error('Can not find the store of template model key.');
        }
        return foundStore;
      }
      const { createStore } = config(
        optimize?.batchUpdate
          ? {
              batchNotify(dispatches, action) {
                optimize?.batchUpdate?.(() => {
                  dispatches.forEach(dispatch => {
                    dispatch(action);
                  });
                });
              }
            }
          : {}
      ).model<S, T, R>(model);
      return createStore();
    })();
    if (hasDefaultState) {
      store.update({ state });
    }
    useEffect(() => {
      return () => {
        if (ifModelIsModel) {
          initializedStore.destroy();
        }
      };
    }, []);
    return store;
  });

  if (ifModelIsModel) {
    initializedStore.update({ model });
  }

  return initializedStore;
}

export function useModel<S, T extends ModelInstance, D extends S>(
  modelLike: Model<S, T> | ModelKey<S, T> | Store<S, T>,
  state?: D
): T {
  const hasDefaultState = arguments.length > 1;
  const store = useModelInitialize(modelLike, { hasDefaultState, state });

  const [instance, setInstance] = useState(store.getInstance());

  useEffect(() => {
    return store.subscribe(() => {
      setInstance(store.getInstance());
    });
  }, []);

  return instance;
}

export function useSignal<S, T extends ModelInstance, D extends S>(
  modelLike: Model<S, T> | ModelKey<S, T> | Store<S, T>,
  state?: D
) {
  const hasDefaultState = arguments.length > 1;
  const [, refresh] = useState({});
  const store = useModelInitialize(modelLike, { hasDefaultState, state });
  const signalStore = useInitialize(() => {
    return createSignal(store);
  });
  const signal = signalStore.getSignal();
  signal.startStatistics();
  useLayoutEffect(() => {
    signal.stopStatistics();
  });
  useEffect(() => {
    return signalStore.subscribe(() => {
      refresh({});
    });
  }, []);
  const signalCallback = function signalCallback() {
    return signal();
  };
  // signalCallback.useWatch = function useWatch(
  //   callback: (ins: T, act: Action | null) => void | (() => void)
  // ) {
  //   useEffect(() => {
  //     return signal.subscribe((action) => {
  //
  //     });
  //   }, []);
  // };
  return usePersistFn(signalCallback);
}

const requiredError = (api: string): string =>
  `API "${api}" can not work, there is no matched Provider with its store key.`;

export function useSelector<
  S,
  T extends ModelInstance,
  R extends (getInstance: () => T) => any = (getInstance: () => T) => T
>(modelKeyOrStore: ModelKey<S, T, R> | Store<S, T, R>): ReturnType<R>;
export function useSelector<
  S,
  T extends ModelInstance,
  R extends (getInstance: () => T) => any = (getInstance: () => T) => T
>(
  modelKeyOrStore: ModelKey<S, T, R> | Store<S, T, R>,
  callback: (instance: T) => any
): ReturnType<typeof callback>;
export function useSelector<
  S,
  T extends ModelInstance,
  R extends (getInstance: () => T) => any = (getInstance: () => T) => T
>(
  modelKeyOrStore: ModelKey<S, T, R> | Store<S, T, R>,
  callback: (instance: T) => any,
  equalFn?: (c: unknown, n: unknown) => boolean
): ReturnType<typeof callback>;
export function useSelector<
  S,
  T extends ModelInstance,
  R extends (getInstance: () => T) => any = (getInstance: () => T) => T
>(
  modelKeyOrStore: ModelKey<S, T, R> | Store<S, T, R>,
  callback?: (instance: T) => any,
  equalFn?: (c: unknown, n: unknown) => boolean
): any {
  const unmountRef = useRef(false);
  const equality = usePersistFn((a: unknown, b: unknown) =>
    equalFn ? equalFn(a, b) : a === b
  );
  const store = useModelInitialize(modelKeyOrStore, { hasDefaultState: false });
  const selectStore = useInitialize(() => {
    return createSelector(store, equalFn ? { equality } : {});
  });
  const computeResult = function computeResult() {
    return callback
      ? selectStore.select(i => callback(i()))
      : selectStore.select();
  };

  const [result, setResult] = useState(computeResult());

  const dispatch = usePersistFn(() => {
    if (unmountRef.current) {
      return;
    }
    const newResult = computeResult();
    if (result === newResult) {
      return;
    }
    setResult(newResult);
  });

  useEffect(() => {
    const unsubscribe = selectStore.subscribe(dispatch);
    return () => {
      unmountRef.current = true;
      unsubscribe();
    };
  }, []);

  return result;
}

export function provide(...keys: (StoreIndex | ModelKey)[]) {
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

export const createKey = function createKey<S, T extends ModelInstance>(
  m: Model<S, T>,
  s?: S
) {
  const lazy = arguments.length < 2;
  return config({}).createKey(m, s);
};

export const ConfigProvider: FC<{
  value: GlobalConfig;
  children?: ReactNode;
}> = function ConfigProvider(props) {
  const { value, children } = props;
  return createElement(ConfigContext.Provider, { value }, children);
};

export const model = function model<
  S,
  T extends ModelInstance,
  R extends (getInstance: () => T) => any = (getInstance: () => T) => T
>(modelLike: Model<S, T> | ModelUsage<S, T, R>) {
  const selector = validations.isModelUsage<S, T, R>(modelLike)
    ? modelLike.selector
    : undefined;
  const modelUsage = selector
    ? config({}).model<S, T, R>(modelLike, selector)
    : config({}).model<S, T, R>(modelLike);

  function select<
    C extends (getInstance: () => T) => any = (getInstance: () => T) => T
  >(callback: C) {
    const newUsage = modelUsage.select(callback);
    return model(newUsage);
  }

  const createUsageKey = function createUsageKey<D extends S>(
    defaultState?: D
  ) {
    const hasDefaultState = arguments.length > 0;
    const key = hasDefaultState
      ? modelUsage.createKey(defaultState)
      : modelUsage.createKey();

    const useKeyModel = function useKeyModel<KD extends S>(
      defaultModelState?: KD
    ) {
      const parameters = (
        arguments.length > 0 ? [key, defaultModelState] : [key]
      ) as [ModelKey<S, T, R>, KD?];
      return useModel<S, T, KD>(...parameters);
    };

    const useKeySignal = function useKeySignal<KD extends S>(
      defaultModelState?: KD
    ) {
      const parameters = (
        arguments.length > 0 ? [key, defaultModelState] : [key]
      ) as [ModelKey<S, T, R>, KD?];
      return useSignal<S, T, KD>(...parameters);
    };

    function useKeySelector(): ReturnType<R>;
    function useKeySelector(
      callback: (instance: T) => any
    ): ReturnType<typeof callback>;
    function useKeySelector(
      callback: (instance: T) => any,
      equality?: (a: unknown, b: unknown) => boolean
    ): ReturnType<typeof callback>;
    function useKeySelector(
      callback?: (instance: T) => any,
      equality?: (a: unknown, b: unknown) => boolean
    ): any {
      return useSelector(key, callback, equality);
    }
    return {
      key,
      useModel: useKeyModel,
      useSignal: useKeySignal,
      useSelector: useKeySelector
    };
  };

  const createUsageStore = function createUsageStore<D extends S>(
    defaultState?: D
  ) {
    const hasDefaultState = arguments.length > 0;
    const store = hasDefaultState
      ? modelUsage.createStore(defaultState)
      : modelUsage.createStore();
    const { key } = store;
    const useStoreModel = function useStoreModel<KD extends S>(
      defaultModelState?: KD
    ) {
      const parameters = (
        arguments.length > 0 ? [store, defaultModelState] : [store]
      ) as [Store<S, T, R>, KD?];
      return useModel<S, T, KD>(...parameters);
    };

    const useStoreSignal = function useStoreSignal<KD extends S>(
      defaultModelState?: KD
    ) {
      const parameters = (
        arguments.length > 0 ? [store, defaultModelState] : [store]
      ) as [Store<S, T, R>, KD?];
      return useSignal<S, T, KD>(...parameters);
    };

    function useStoreSelector(): ReturnType<R>;
    function useStoreSelector(
      callback: (instance: T) => any
    ): ReturnType<typeof callback>;
    function useStoreSelector(
      callback: (instance: T) => any,
      equality: (
        a: ReturnType<typeof callback>,
        b: ReturnType<typeof callback>
      ) => boolean
    ): ReturnType<typeof callback>;
    function useStoreSelector(
      callback?: (instance: T) => any,
      equality?: (a: any, b: any) => boolean
    ): any {
      return useSelector(store, callback, equality);
    }
    return {
      key,
      useModel: useStoreModel,
      useSignal: useStoreSignal,
      useSelector: useStoreSelector,
      getInstance: store.getInstance,
      instance: store.getInstance
    };
  };

  return Object.assign(modelUsage, {
    createStore: createUsageStore,
    createKey: createUsageKey
  });
};

const asModel = config({}).model;

model.create = asModel;
model.createField = asModel.createField;
model.createMethod = asModel.createMethod;
