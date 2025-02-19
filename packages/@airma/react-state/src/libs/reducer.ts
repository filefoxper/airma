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
  InstanceActionRuntime,
  FieldGenerator
} from './type';

const lazyIdentify = {};

const lazyIdentifyKey = '@@lazyIdentify';

function defaultNotifyImplement(dispatches: Dispatch[], action: Action) {
  dispatches.forEach(callback => {
    callback(action);
  });
}

function refreshModel<S, T extends AirModelInstance, D extends S>(
  reducer: AirReducer<S, T>,
  state: D
) {
  return reducer(state);
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

function transToActionMethod<S, T extends AirModelInstance>(
  updater: Updater<S, T>,
  type: string,
  runtime: {
    methodsCache: Record<string, (...args: any[]) => any>;
    middleWare?: (action: Action) => Action | null;
    sourceTo?: (...args: any[]) => any;
  }
) {
  const instanceMethod = updater.current[type] as ((...args: any[]) => any) & {
    noActionMethod?: unknown;
  };
  if (
    instanceMethod.noActionMethod &&
    instanceMethod.noActionMethod === lazyIdentify
  ) {
    return instanceMethod;
  }
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
    updater.current = refreshModel(reducer, result);
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

function clearCacheGenerators<S, T extends AirModelInstance>(
  updater: Updater<S, T>,
  type: string
) {
  if (updater.cacheGenerators[type]) {
    updater.cacheGenerators[type] = null;
  }
}

function cacheGenerator<S, T extends AirModelInstance>(
  updater: Updater<S, T>,
  type: string
) {
  const field = updater.current[type] as FieldGenerator;
  if (!field || field.cacheGenerator !== cacheGenerator) {
    clearCacheGenerators(updater, type);
    return field;
  }
  const cacheStructure = updater.cacheGenerators[type];
  if (
    cacheStructure &&
    ((field.deps && shallowEqual(cacheStructure.deps, field.deps)) ||
      (!field.deps && cacheStructure.value === field.value))
  ) {
    return cacheStructure.out;
  }
  const out = {
    get: () => {
      const data = updater.current[type] as FieldGenerator;
      if (data == null) {
        throw new Error('This field is not exist now.');
      }
      if (!isCacheGenerator(data)) {
        throw new Error('This field is changed to be a normal object');
      }
      const cacheStructureInRuntime = updater.cacheGenerators[type];
      if (!cacheStructureInRuntime) {
        const { value } = data;
        return value;
      }
      const { value: cacheValue, deps: cacheDeps } = cacheStructureInRuntime;
      if (
        (data.deps && shallowEqual(cacheDeps, data.deps)) ||
        (!data.deps && cacheValue === data.value)
      ) {
        return cacheValue;
      }
      return data.value;
    }
  };
  updater.cacheGenerators[type] = { value: field.value, deps: field.deps, out };
  return out;
}

export function createCacheField<R extends () => any>(
  callback: R,
  deps?: unknown[]
): FieldGenerator<R> {
  const currentDeps = (function computeDeps(): unknown[] | undefined {
    if (deps == null) {
      return deps;
    }
    if (deps.some(d => isCacheGenerator(d) && d.deps == null)) {
      return undefined;
    }
    return deps.flatMap(d => {
      if (isCacheGenerator(d)) {
        return d.deps;
      }
      return d;
    });
  })();
  const value = callback();
  return {
    callback,
    deps: currentDeps,
    cacheGenerator,
    value,
    get(): ReturnType<R> {
      return value;
    }
  };
}

export function createField<R extends () => any>(
  callback: R,
  deps?: unknown[]
): FieldGenerator<R> {
  const currentDeps = (function computeDeps(): unknown[] | undefined {
    if (deps == null) {
      return deps;
    }
    if (deps.some(d => isCacheGenerator(d) && d.deps == null)) {
      return undefined;
    }
    return deps.flatMap(d => {
      if (isCacheGenerator(d)) {
        return d.deps;
      }
      return d;
    });
  })();
  const value = callback();
  return {
    callback,
    deps: currentDeps,
    cacheGenerator,
    value,
    get(): ReturnType<R> {
      return value;
    }
  };
}

export function createMethod<
  R extends ((...args: any[]) => any) & { noActionMethod?: unknown }
>(callback: R): R & { noActionMethod: Record<string, any> } {
  const replace = function replace(...args: any[]) {
    return callback(...args);
  };
  Object.assign(replace, callback);
  replace.noActionMethod = lazyIdentify;
  return replace as R & { noActionMethod: Record<string, any> };
}

function isCacheGenerator(value: unknown): value is FieldGenerator {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as FieldGenerator).cacheGenerator === cacheGenerator
  );
}

export function createModel<S, T extends AirModelInstance, D extends S>(
  reducer: AirReducer<S, T>,
  defaultState: D,
  updaterConfig?: UpdaterConfig
): Connection<S, T> {
  const defaultModel = refreshModel(reducer, defaultState);
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
    cacheGenerators: {},
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
    updater.current = refreshModel(updateReducer, updater.state);
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
      if (isCacheGenerator(value)) {
        return value.cacheGenerator(updater, p);
      }
      if (
        Object.prototype.hasOwnProperty.call(updater.current, p) &&
        typeof value === 'function'
      ) {
        return transToActionMethod<S, T>(updater, p, {
          methodsCache: updater.cacheMethods
        });
      }
      return value;
    }
  });
  return {
    agent,
    getReducer(): AirReducer<S, T> {
      return updater.reducer;
    },
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
          if (isCacheGenerator(d)) {
            return d.cacheGenerator(updater, i.toString());
          }
          if (typeof d === 'function') {
            return runtime
              ? transToActionMethod<S, T>(updater, i.toString(), {
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
        if (isCacheGenerator(value)) {
          result[key] = value.cacheGenerator(updater, key as string);
          return;
        }
        if (typeof value === 'function') {
          result[key] = runtime
            ? (transToActionMethod<S, T>(updater, key as string, {
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
      updater.notify = noop;
      updater.isDestroyed = true;
      updater.cacheMethods = {};
      updater.cacheGenerators = {};
      optimize.batchUpdate = undefined;
    },
    renew(connection?: Connection<S, T>) {
      updater.isDestroyed = false;
      updater.notify = generateNotification(updater, optimize);
      if (!connection) {
        return;
      }
      const { getState, getReducer } = connection;
      updater.cacheState = null;
      update(getReducer(), { state: getState(), ignoreDispatch: true });
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
    },
    isDestroyed() {
      return updater.isDestroyed;
    },
    setPayload<P>(callback: (payload: P) => P) {
      const newPayload = callback(updater.payload as P);
      updater.payload = newPayload;
      return newPayload;
    },
    getPayload<P>() {
      return updater.payload as P;
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
  replaceModel.getInstance = function getInstance() {
    return replaceModel.connection.getCurrent() as ReturnType<T>;
  };
  replaceModel.initialize = function initialize(state: Parameters<T>[0]) {
    const { connection } = replaceModel;
    const needInitializeScopeConnection =
      connection != null && connection.getCacheState() == null;
    if (needInitializeScopeConnection) {
      connection.update(reducer, { state, cache: true, ignoreDispatch: true });
    }
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
      const lazyReducer = (s: any) => {
        return { [lazyIdentifyKey]: lazyIdentify } as ReturnType<T>;
      };
      return createModel(lazyReducer, undefined, updaterConfig) as Connection;
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
  const currentCollections = collectConnections(fact, updaterConfig);
  const holder = extractFactory(currentCollections);

  const updateHolderFactory = function updateHolderFactory(
    updateFactory: T,
    conf?: UpdaterConfig
  ) {
    const collections = collectConnections(updateFactory, conf);
    const { collections: holders } = holder;
    const instances = toInstances(collections);
    holders.forEach(c => {
      const connection = instances.get(c.factory);
      if (connection == null) {
        return;
      }
      c.connection.renew();
    });
  };

  const store = {
    destroyed: false,
    parent: updaterConfig?.parent,
    update(updateFactory: T, conf?: UpdaterConfig): ModelFactoryStore<T> {
      if (
        updateFactory === fact &&
        conf?.parent === updaterConfig?.parent &&
        !store.destroyed
      ) {
        return store;
      }
      store.parent = conf ? conf.parent : undefined;
      updateHolderFactory(updateFactory);
      store.destroyed = false;
      return store;
    },
    get(reducer: AirReducer<any, any>): Connection | undefined {
      return holder.instances.get(reducer);
    },
    destroy() {
      holder.connections.forEach(connection => connection.destroy());
      store.destroyed = true;
    }
  };
  return store;
}
