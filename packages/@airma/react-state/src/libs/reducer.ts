import { createProxy, noop, shallowEqual, toMapObject } from './tools';
import type {
  Action,
  AirModelInstance,
  AirReducer,
  Updater,
  Connection,
  FactoryInstance,
  Dispatch,
  ActionWrap,
  FirstActionWrap,
  UpdaterConfig,
  StaticFactoryInstance,
  Collection,
  Creation,
  ModelFactoryStore,
  ModelContext,
  Contexts,
  ModelContextFactory,
  InstanceActionRuntime
} from './type';

const lazyIdentify = {};

const lazyIdentifyKey = '@@lazyIdentify';

function defaultNotifyImplement(dispatches: Dispatch[], action: Action) {
  dispatches.forEach(callback => {
    callback(action);
  });
}

const systemRuntime: { context: ModelContext | null } = {
  context: null
};

export function getRuntimeContext() {
  const { context } = systemRuntime;
  if (context == null) {
    throw new Error('Can not use context out of the model refresh time.');
  }
  return context;
}

function refreshModel<S, T extends AirModelInstance, D extends S>(
  reducer: AirReducer<S, T>,
  state: D,
  runtime: ModelContextFactory
) {
  runtime.start();
  systemRuntime.context = runtime.context;
  const instance = reducer(state);
  systemRuntime.context = null;
  runtime.end();
  if ((instance as any)[lazyIdentifyKey] === lazyIdentify) {
    runtime.reset();
  }
  return instance;
}

function destroyDispatching<S, T extends AirModelInstance>(
  updater: Updater<S, T>
) {
  const { dispatching } = updater;
  if (!dispatching) {
    return;
  }
  let wrapper: ActionWrap | undefined = dispatching;
  while (wrapper) {
    const { next } = wrapper as ActionWrap;
    wrapper.next = undefined;
    wrapper.prev = undefined;
    if (next) {
      next.prev = undefined;
    }
    wrapper = next;
  }
  dispatching.tail = undefined;
  updater.dispatching = undefined;
}

function generateNotification<S, T extends AirModelInstance>(
  updater: Updater<S, T>,
  optimize: {
    batchUpdate?: (callback: () => void) => void;
  }
) {
  function pendAction(value: Action) {
    const { dispatching } = updater;
    if (!dispatching) {
      const wrap = { value } as FirstActionWrap;
      wrap.tail = wrap;
      updater.dispatching = wrap;
      return;
    }
    const { tail } = dispatching;
    if (!tail) {
      return;
    }
    const current: ActionWrap = { prev: tail, value };
    tail.next = current;
    dispatching.tail = current;
  }

  function unshiftAction() {
    const { dispatching } = updater;
    if (!dispatching) {
      return undefined;
    }
    const { next, tail } = dispatching;
    if (tail === dispatching || !next) {
      dispatching.tail = undefined;
      updater.dispatching = undefined;
      return dispatching;
    }
    next.prev = undefined;
    const newFirst = next as FirstActionWrap;
    newFirst.tail = tail;
    updater.dispatching = newFirst;
    return dispatching;
  }

  function consumeTemporaries() {
    const { temporaryDispatches } = updater;
    if (!temporaryDispatches.length) {
      updater.dispatches = updater.dispatches.concat(temporaryDispatches);
      updater.temporaryDispatches = [];
    }
    const initializedAction = {
      state: updater.state,
      prevState: updater.state,
      instance: updater.current,
      prevInstance: updater.current,
      type: '',
      method: null
    };
    temporaryDispatches.forEach(call => {
      call(initializedAction);
    });
  }

  return function dispatch(action: Action | null): void {
    if (action == null) {
      return;
    }
    const { dispatching } = updater;
    pendAction(action);
    if (dispatching) {
      return;
    }
    while (updater.dispatching) {
      const wrap = updater.dispatching;
      if (wrap) {
        const { dispatches } = updater;
        const dispatchCallbacks = [...dispatches];
        try {
          if (
            typeof optimize.batchUpdate === 'function' &&
            dispatchCallbacks.length
          ) {
            optimize.batchUpdate(() => {
              defaultNotifyImplement(dispatchCallbacks, wrap.value);
            });
          } else {
            defaultNotifyImplement(dispatchCallbacks, wrap.value);
          }
        } catch (e) {
          updater.dispatching = undefined;
          throw e;
        }
        unshiftAction();
      } else {
        updater.dispatching = undefined;
      }
    }
    consumeTemporaries();
  };
}

function generateModelContextFactory(): ModelContextFactory {
  const contexts: Contexts = {
    data: [],
    current: 0,
    initialized: false,
    working: false
  };
  const ref = function ref<C>(current: C) {
    const { data, initialized, working } = contexts;
    if (!working) {
      throw new Error(
        'Context hook only can be used in model refreshing time.'
      );
    }
    const currentIndex = contexts.current;
    const memoData = data[currentIndex];
    contexts.current += 1;
    if (memoData) {
      return memoData as { current: C };
    }
    if (initialized) {
      throw new Error(
        'Context hook should be used everytime, when model is refreshing.'
      );
    }
    const refData = { current };
    data[currentIndex] = refData;
    return refData;
  };
  const memo = function memo<M extends () => any>(
    call: M,
    deps: unknown[] = []
  ) {
    const memoRef = ref<undefined | [ReturnType<M>, unknown[]]>(undefined);
    const [memoData, memoDeps] = (function generate(): [
      ReturnType<M>,
      unknown[] | undefined
    ] {
      if (memoRef.current == null) {
        return [call(), deps];
      }
      const [d, p] = memoRef.current;
      if (shallowEqual(p, deps)) {
        return [d, undefined];
      }
      return [call(), deps];
    })();
    if (memoDeps) {
      memoRef.current = [memoData, memoDeps];
    }
    return memoData;
  };
  return {
    context: { ref, memo },
    reset() {
      contexts.working = false;
      contexts.current = 0;
      contexts.initialized = false;
      contexts.data = [];
    },
    start() {
      contexts.working = true;
      contexts.current = 0;
    },
    end() {
      contexts.working = false;
      contexts.initialized = true;
    }
  };
}

function rebuildDispatchMethod<S, T extends AirModelInstance>(
  updater: Updater<S, T>,
  type: string,
  runtime: {
    context: ModelContextFactory;
    methodsCache: Record<string, (...args: any[]) => any>;
    middleWare?: (action: Action) => Action | null;
    sourceTo?: (...args: any[]) => any;
  }
) {
  if (runtime.methodsCache[type]) {
    return runtime.methodsCache[type];
  }
  const newMethod: ((...args: unknown[]) => S) & {
    dispatchId: undefined | ((...args: any[]) => any);
    dispatchType: string;
  } = function newMethod(...args: unknown[]) {
    const method = updater.current[type] as (...args: unknown[]) => S;
    const result = method(...args);
    const { reducer, controlled, isDestroyed } = updater;
    if (isDestroyed) {
      return result;
    }
    const methodAction = {
      type,
      state: result,
      prevState: result,
      instance: updater.current,
      prevInstance: updater.current,
      method: newMethod
    };
    if (controlled) {
      updater.notify(methodAction);
      return result;
    }
    const prevState = updater.state;
    const prevInstance = updater.current;
    updater.current = refreshModel(reducer, result, runtime.context);
    updater.state = result;
    updater.version += 1;
    updater.cacheState = { state: result };
    const actionResult: Action = {
      type,
      state: result,
      prevState,
      instance: updater.current,
      prevInstance,
      method: newMethod
    };
    const action = runtime.middleWare
      ? runtime.middleWare(actionResult)
      : actionResult;
    updater.notify(action);
    return result;
  };
  newMethod.dispatchType = type;
  newMethod.dispatchId = runtime.sourceTo;
  runtime.methodsCache[type] = newMethod;
  return newMethod;
}

export function createModel<S, T extends AirModelInstance, D extends S>(
  reducer: AirReducer<S, T>,
  defaultState: D,
  updaterConfig?: UpdaterConfig
): Connection<S, T> {
  const modelContextFactory = generateModelContextFactory();
  const defaultModel = refreshModel(reducer, defaultState, modelContextFactory);
  const { controlled, batchUpdate } = updaterConfig || {};
  const optimize = { batchUpdate };
  const updater: Updater<S, T> = {
    version: 0,
    isDestroyed: false,
    current: defaultModel,
    reducer,
    dispatch: null,
    dispatches: [],
    temporaryDispatches: [],
    cacheMethods: {},
    state: defaultState,
    cacheState: null,
    controlled: !!controlled,
    notify: noop,
    isSubscribing: false
  };

  updater.notify = generateNotification(updater, optimize);

  function update(
    updateReducer: AirReducer<S, T>,
    outState?: {
      state: S;
      cache?: boolean;
      isDefault?: boolean;
      ignoreDispatch?: boolean;
    }
  ): void {
    const { state, isDestroyed } = updater;
    if (isDestroyed) {
      return;
    }
    const isDefaultUpdate = !!(outState && outState.isDefault);
    const ignoreDispatch = !!(outState && outState.ignoreDispatch);
    if (isDefaultUpdate && updater.cacheState) {
      return;
    }
    const nextState = outState ? outState.state : state;
    if (nextState !== state && !updater.controlled) {
      updater.version += 1;
    }
    const prevState = state;
    const prevInstance = updater.current;
    updater.reducer = updateReducer;
    updater.state = nextState;
    updater.cacheState =
      outState && outState.cache
        ? { state: outState.state }
        : updater.cacheState;
    updater.current = refreshModel(
      updateReducer,
      updater.state,
      modelContextFactory
    );
    if (state === updater.state || isDefaultUpdate || ignoreDispatch) {
      return;
    }
    updater.notify({
      state: updater.state,
      prevState,
      instance: updater.current,
      prevInstance,
      type: '',
      method: null
    });
  }

  function notice(...dispatchCall: Dispatch[]) {
    if (updater.isDestroyed) {
      return;
    }
    const initializedAction = {
      state: updater.state,
      prevState: updater.state,
      instance: updater.current,
      prevInstance: updater.current,
      type: '',
      method: null
    };
    dispatchCall.forEach(call => {
      call(initializedAction);
    });
  }

  function subscribe(dispatchCall: Dispatch) {
    const {
      dispatches,
      temporaryDispatches,
      controlled: isControlled,
      isDestroyed
    } = updater;
    if (isDestroyed) {
      return;
    }
    const copied = [...dispatches, ...temporaryDispatches];
    const exist = copied.indexOf(dispatchCall) >= 0;
    if (exist) {
      return;
    }
    if (isControlled) {
      updater.dispatches = [dispatchCall];
      return;
    }
    updater.temporaryDispatches.push(dispatchCall);
    if (updater.dispatching) {
      return;
    }
    updater.dispatches = [
      ...updater.dispatches,
      ...updater.temporaryDispatches
    ];
    updater.temporaryDispatches = [];
    notice(...temporaryDispatches);
  }

  function disconnect(dispatchCall: Dispatch | undefined) {
    if (!dispatchCall) {
      updater.dispatches = [];
      updater.temporaryDispatches = [];
      return;
    }
    const { dispatches, temporaryDispatches } = updater;
    updater.dispatches = dispatches.filter(d => d !== dispatchCall);
    updater.temporaryDispatches = temporaryDispatches.filter(
      d => d !== dispatchCall
    );
  }

  const agent = createProxy(defaultModel, {
    get(target: T, p: string): unknown {
      const value = updater.current[p];
      if (
        Object.prototype.hasOwnProperty.call(updater.current, p) &&
        typeof value === 'function'
      ) {
        return rebuildDispatchMethod<S, T>(updater, p, {
          context: modelContextFactory,
          methodsCache: updater.cacheMethods
        });
      }
      return value;
    }
  });
  return {
    agent,
    getCacheState(): { state: S } | null {
      return updater.cacheState;
    },
    getState(): S {
      return updater.state;
    },
    getVersion() {
      return updater.version;
    },
    getCurrent(runtime?: InstanceActionRuntime): T {
      if (updater.isDestroyed) {
        return updater.current;
      }
      if (Array.isArray(updater.current)) {
        return updater.current.map((d, i) => {
          if (typeof d === 'function') {
            return runtime
              ? rebuildDispatchMethod<S, T>(updater, i.toString(), {
                  context: modelContextFactory,
                  ...runtime,
                  sourceTo: agent[i] as (...args: any[]) => any
                })
              : agent[i];
          }
          return d;
        }) as unknown as T;
      }
      const keys = Object.keys(updater.current);
      const result = { ...updater.current };
      keys.forEach((key: keyof T) => {
        const value = result[key];
        if (typeof value === 'function') {
          result[key] = runtime
            ? (rebuildDispatchMethod<S, T>(updater, key as string, {
                context: modelContextFactory,
                ...runtime,
                sourceTo: agent[key] as (...args: any[]) => any
              }) as T[typeof key])
            : agent[key];
        }
      });
      return result;
    },
    getStoreInstance() {
      return updater.current;
    },
    getListeners(): Dispatch[] {
      return updater.dispatches;
    },
    update,
    updateState(state: S): void {
      update(updater.reducer, { state, cache: true });
    },
    notice(): void {
      notice(updater.notify);
    },
    tunnel(dispatchCall) {
      return {
        connect() {
          subscribe(dispatchCall);
        },
        disconnect() {
          disconnect(dispatchCall);
        }
      };
    },
    destroy() {
      updater.dispatch = null;
      updater.dispatches = [];
      destroyDispatching(updater);
      updater.temporaryDispatches = [];
      updater.state = defaultState;
      updater.cacheState = null;
      updater.notify = noop;
      updater.isDestroyed = true;
      updater.cacheMethods = {};
      optimize.batchUpdate = undefined;
    },
    connect(dispatchCall) {
      subscribe(dispatchCall);
    },
    disconnect,
    optimize(batchUpdateCallback?: (callback: () => void) => void) {
      if (optimize.batchUpdate === batchUpdateCallback) {
        return;
      }
      optimize.batchUpdate = undefined;
      optimize.batchUpdate = batchUpdateCallback;
    }
  };
}

export function checkIfLazyIdentifyConnection(
  connection: Connection<any, any>
) {
  const agent = connection.agent as any;
  if (agent[lazyIdentifyKey]) {
    throw new Error(
      'A stateless connection should be initialized before it is accessed.'
    );
  }
}

export function staticFactory<T extends AirReducer<any, any>>(
  reducer: FactoryInstance<T>
): StaticFactoryInstance<T> {
  const replaceModel: StaticFactoryInstance<T> = function replaceModel(s: any) {
    return reducer(s);
  } as StaticFactoryInstance<T>;
  replaceModel.payload = reducer.payload;
  replaceModel.connection = reducer.creation();
  replaceModel.static = function self() {
    return replaceModel;
  };
  replaceModel.isFactory = reducer.isFactory;
  return replaceModel as StaticFactoryInstance<T>;
}

export function factory<T extends AirReducer<any, any>>(
  reducer: T,
  state?: T extends AirReducer<infer S, any> ? S : never,
  lazy?: boolean
): FactoryInstance<T> {
  const replaceModel = function replaceModel(s: any) {
    return reducer(s);
  };
  replaceModel.creation = function creation(
    updaterConfig?: UpdaterConfig
  ): Connection {
    if (lazy) {
      return createModel(
        (s: undefined) => {
          return { [lazyIdentifyKey]: lazyIdentify };
        },
        undefined,
        updaterConfig
      ) as any;
    }
    return createModel(replaceModel, state, updaterConfig);
  };
  replaceModel.static = function staticFactoryForModel() {
    return staticFactory<T>(replaceModel as FactoryInstance<T>);
  };
  replaceModel.isFactory = function isFactory() {
    return true;
  };
  return replaceModel as FactoryInstance<T>;
}

function collectConnections<
  T extends Array<any> | ((...args: any[]) => any) | Record<string, any>
>(
  factoryCollections: T,
  updaterConfig: UpdaterConfig = {},
  collectionKeys: string[] = []
): Collection[] {
  if (
    typeof factoryCollections === 'function' &&
    typeof (factoryCollections as typeof factoryCollections & Creation)
      .creation === 'function'
  ) {
    return [
      {
        key: collectionKeys.join('.'),
        keys: collectionKeys,
        factory: factoryCollections as (...args: any[]) => any,
        connection: (
          factoryCollections as typeof factoryCollections & Creation
        ).creation(updaterConfig)
      } as Collection
    ];
  }
  if (!factoryCollections || typeof factoryCollections !== 'object') {
    return [];
  }
  const collection: Collection[] = [];
  const fact = factoryCollections as Exclude<T, (...args: any[]) => any>;
  const keys = Object.keys(fact);
  keys.forEach((key: string) => {
    const k = key as keyof T;
    const result = collectConnections(
      fact[k] as Record<string, any>,
      updaterConfig,
      collectionKeys.concat(key)
    );
    collection.push(...result);
  });
  return collection;
}

function toInstances(collections: Collection[]) {
  return {
    get(key: (...args: any[]) => any): Connection | undefined {
      const found = collections.find(
        c => c.factory === key || c.sourceFactory === key
      );
      return found ? found.connection : undefined;
    }
  };
}

export function createStoreCollection<
  T extends Array<any> | ((...args: any) => any) | Record<string, any>
>(fact: T, updaterConfig?: UpdaterConfig): ModelFactoryStore<T> {
  const handler = fact;
  function extractFactory(collections: Collection[]) {
    const connections = collections.map(({ connection }) => connection);
    const instances = toInstances(collections);
    return {
      collections,
      connections,
      instances
    };
  }
  function updateCollections(
    collections: Collection[],
    updated: Collection[]
  ): Collection[] {
    const updatedMap = toMapObject(
      updated.map(({ key, connection, factory: fac }) => [
        key,
        { connection, factory: fac }
      ])
    );
    const map = toMapObject(
      collections.map(({ key, connection, factory: fac }) => [
        key,
        { connection, factory: fac }
      ])
    );
    const additions = updated.filter(({ key }) => !map.get(key));
    const deletions = collections.filter(({ key }) => !updatedMap.get(key));
    const updates = collections
      .map(collection => {
        const { key, connection } = collection;
        const c = updatedMap.get(key);
        if (!c) {
          return undefined;
        }
        const updatingConnection = c.connection;
        const state = (function computeState() {
          const isDefault = connection.getCacheState() == null;
          if (isDefault) {
            return updatingConnection.getState();
          }
          return connection.getState();
        })();
        connection.update(c.factory, { state });
        return {
          ...collection,
          factory: c.factory,
          sourceFactory: collection.factory
        } as Collection;
      })
      .filter((d): d is Collection => !!d);
    deletions.forEach(({ connection }) => connection.destroy());
    return [...additions, ...updates];
  }
  const currentCollections = collectConnections(fact, updaterConfig);
  const holder = extractFactory(currentCollections);

  const store = {
    update(updateFactory: T): ModelFactoryStore<T> {
      if (updateFactory === fact) {
        return { ...store };
      }
      const collections = collectConnections(updateFactory, updaterConfig);
      const {
        instances,
        connections,
        collections: newCollections
      } = extractFactory(updateCollections(currentCollections, collections));
      holder.instances = instances;
      holder.connections = connections;
      holder.collections = newCollections;
      return { ...store };
    },
    get(reducer: AirReducer<any, any>): Connection | undefined {
      return holder.instances.get(reducer);
    },
    equal(
      factoryCollections:
        | Record<string, any>
        | Array<any>
        | ((...args: any[]) => any)
    ): boolean {
      return factoryCollections === handler;
    },
    destroy() {
      holder.connections.forEach(connection => connection.destroy());
    }
  };
  return { ...store };
}
