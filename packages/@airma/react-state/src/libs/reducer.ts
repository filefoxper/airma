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
  UpdaterConfig
} from './type';
import { createProxy, noop, toMapObject } from './tools';
import { Collection, Creation, ModelFactoryStore } from './type';

function defaultNotifyImplement(dispatches: Dispatch[], action: Action) {
  dispatches.forEach(callback => {
    callback(action);
  });
}

function generateNotification<S, T extends AirModelInstance>(
  updater: Updater<S, T>
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
          defaultNotifyImplement(dispatchCallbacks, wrap.value);
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

function rebuildDispatchMethod<S, T extends AirModelInstance>(
  updater: Updater<S, T>,
  type: string
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
    updater.current = reducer(result);
    updater.state = result;
    updater.cacheState = { state: result };
    updater.notify({ type, state: result });
    return result;
  };
  updater.cacheMethods[type] = newMethod;
  return newMethod;
}

export default function createModel<S, T extends AirModelInstance, D extends S>(
  reducer: AirReducer<S, T>,
  defaultState: D,
  updaterConfig?: UpdaterConfig
): Connection<S, T> {
  const defaultModel = reducer(defaultState);
  const { controlled } = updaterConfig || {};
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

  updater.notify = generateNotification(updater);

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
    updater.current = updateReducer(updater.state);
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
        return rebuildDispatchMethod<S, T>(updater, p);
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
    connect(dispatchCall) {
      const needNotice = subscribe(dispatchCall);
      if (!needNotice) {
        return;
      }
      notice(dispatchCall);
    },
    disconnect
  };
}

export function factory<T extends AirReducer<any, any>>(
  reducer: T,
  state?: T extends AirReducer<infer S, any> ? S : never
): FactoryInstance<T> {
  const replaceModel = function replaceModel(s: any) {
    return reducer(s);
  };
  replaceModel.creation = function creation(
    updaterConfig?: UpdaterConfig
  ): Connection {
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
        ).creation()
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

export function createStore<
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
    deletions.forEach(({ connection }) => connection.disconnect());
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
      holder.connections.forEach(connection => connection.disconnect());
    }
  };
  return { ...store };
}
