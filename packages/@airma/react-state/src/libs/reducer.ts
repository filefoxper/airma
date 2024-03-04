import {
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
  ModelContextFactory
} from './type';
import { createProxy, noop, shallowEqual, toMapObject } from './tools';

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

  return function dispatch(action: Action): void {
    const { dispatching } = updater;
    pendAction(action);
    if (dispatching) {
      return;
    }
    while (updater.dispatching) {
      const wrap = unshiftAction();
      if (wrap) {
        const { dispatches } = updater;
        const dispatchCallbacks = [...dispatches];
        try {
          if (typeof optimize.batchUpdate === 'function') {
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
      } else {
        updater.dispatching = undefined;
      }
    }
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
  runtime: ModelContextFactory
) {
  if (updater.cacheMethods[type]) {
    return updater.cacheMethods[type];
  }
  const newMethod = function newMethod(...args: unknown[]) {
    const method = updater.current[type] as (...args: unknown[]) => S;
    const result = method(...args);
    const { reducer, controlled } = updater;
    const methodAction = { type, state: result };
    if (controlled) {
      updater.notify(methodAction);
      return result;
    }
    updater.current = refreshModel(reducer, result, runtime);
    updater.state = result;
    updater.cacheState = { state: result };
    updater.notify({ type, state: result });
    return result;
  };
  updater.cacheMethods[type] = newMethod;
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
    current: defaultModel,
    reducer,
    dispatch: null,
    dispatches: [],
    cacheMethods: {},
    state: defaultState,
    cacheState: null,
    controlled: !!controlled,
    notify: noop
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
    const { state } = updater;
    const isDefaultUpdate = !!(outState && outState.isDefault);
    const ignoreDispatch = !!(outState && outState.ignoreDispatch);
    if (isDefaultUpdate && updater.cacheState) {
      return;
    }
    const nextState = outState ? outState.state : state;
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
    updater.notify({ state: updater.state, type: '' });
  }

  function subscribe(dispatchCall: Dispatch): boolean {
    const { dispatches, controlled: isControlled } = updater;
    const copied = [...dispatches];
    const exist = copied.indexOf(dispatchCall) >= 0;
    if (exist) {
      return false;
    }
    if (isControlled) {
      updater.dispatches = [dispatchCall];
      return false;
    }
    updater.dispatches = copied.concat(dispatchCall);
    return true;
  }

  function notice(dispatchCall: Dispatch) {
    dispatchCall({ state: updater.state, type: '' });
  }

  function disconnect(dispatchCall: Dispatch | undefined) {
    if (!dispatchCall) {
      updater.dispatches = [];
      return;
    }
    const { dispatches } = updater;
    const copied = [...dispatches];
    updater.dispatches = copied.filter(d => d !== dispatchCall);
  }

  const agent = createProxy(defaultModel, {
    get(target: T, p: string): unknown {
      const value = updater.current[p];
      if (
        Object.prototype.hasOwnProperty.call(updater.current, p) &&
        typeof value === 'function'
      ) {
        return rebuildDispatchMethod<S, T>(updater, p, modelContextFactory);
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
    getCurrent(): T {
      if (Array.isArray(updater.current)) {
        return updater.current.map((d, i) => {
          if (typeof d === 'function') {
            return agent[i];
          }
          return d;
        }) as unknown as T;
      }
      const keys = Object.keys(updater.current);
      const result = { ...updater.current };
      keys.forEach((key: keyof T) => {
        const value = result[key];
        if (typeof value === 'function') {
          result[key] = agent[key];
        }
      });
      return result;
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
          const needNotice = subscribe(dispatchCall);
          if (!needNotice) {
            return;
          }
          notice(dispatchCall);
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
      updater.state = defaultState;
      updater.cacheState = null;
      updater.notify = noop;
      updater.cacheMethods = {};
      optimize.batchUpdate = undefined;
    },
    connect(dispatchCall) {
      const needNotice = subscribe(dispatchCall);
      if (!needNotice) {
        return;
      }
      notice(dispatchCall);
    },
    disconnect,
    optimize(batchUpdateCallback?: (callback: () => void) => void) {
      if (optimize.batchUpdate === batchUpdateCallback) {
        return;
      }
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
  replaceModel.effect = reducer.effect;
  replaceModel.connection = reducer.creation();
  replaceModel.pipe = reducer.pipe;
  replaceModel.global = function self() {
    return replaceModel;
  };
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
  replaceModel.pipe = function pipe<P extends AirReducer<any, any>>(
    target: P
  ): P & { getSourceFrom: () => FactoryInstance<T> } {
    const pipeModel = function pipeModel(s: any) {
      return target(s);
    };
    pipeModel.getSourceFrom = function getSourceFrom() {
      return replaceModel;
    };
    return pipeModel as P & { getSourceFrom: () => FactoryInstance<T> };
  };
  replaceModel.global = function staticFactoryForModel() {
    return staticFactory<T>(replaceModel as FactoryInstance<T>);
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
