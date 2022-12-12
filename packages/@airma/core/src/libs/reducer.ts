import type {
  Action,
  AirModelInstance,
  AirReducer,
  Updater,
  HoldCallback,
  Connection
} from './type';
import { createProxy } from './tools';
import { Collection, Creation, ModelFactoryStore } from './type';

function rebuildDispatchMethod<S, T extends AirModelInstance>(
  updater: Updater<S, T>,
  type: string
) {
  if (updater.cacheMethods[type]) {
    return updater.cacheMethods[type];
  }
  const newMethod = function newMethod(...args: unknown[]) {
    function dispatch(action: Action): void {
      const { dispatches } = updater;
      const dispatchCallbacks = [...dispatches];
      dispatchCallbacks.forEach(callback => {
        callback(action);
      });
    }
    const method = updater.current[type] as (...args: unknown[]) => S;
    const result = method(...args);
    const { reducer } = updater;
    updater.current = reducer(result);
    updater.cacheState = result;
    dispatch({ type, state: result });
    return result;
  };
  updater.cacheMethods[type] = newMethod;
  return newMethod;
}

export default function createModel<S, T extends AirModelInstance, D extends S>(
  reducer: AirReducer<S, T>,
  defaultState: D
): Connection<S, T> {
  const defaultModel = reducer(defaultState);
  const updater: Updater<S, T> = {
    current: defaultModel,
    reducer,
    dispatch: null,
    dispatches: [],
    cacheMethods: {},
    cacheState: defaultState
  };
  return {
    agent: createProxy(defaultModel, {
      get(target: T, p: string): unknown {
        const value = updater.current[p];
        if (updater.current.hasOwnProperty(p) && typeof value === 'function') {
          return rebuildDispatchMethod<S, T>(updater, p);
        }
        return value;
      }
    }),
    getCacheState(): S {
      return updater.cacheState;
    },
    update(updateReducer: AirReducer<S, T>, outState?: { state: S }) {
      const { cacheState } = updater;
      updater.reducer = updateReducer;
      updater.cacheState = outState ? outState.state : cacheState;
      updater.current = updateReducer(updater.cacheState);
    },
    connect(dispatchCall) {
      const { dispatches } = updater;
      if (dispatches.some(d => d === dispatchCall) || !dispatchCall) {
        return;
      }
      dispatches.push(dispatchCall);
    },
    disconnect(dispatchCall) {
      if (!dispatchCall) {
        updater.dispatches = [];
        return;
      }
      const { dispatches } = updater;
      const index = dispatches.indexOf(dispatchCall);
      if (index < 0) {
        return;
      }
      dispatches.splice(index, 1);
    }
  };
}

export function createRequiredModels<
  T extends Array<any> | ((...args: any) => any) | Record<string, any>
>(requireFn: (hold: HoldCallback) => T): T {
  const hold: HoldCallback = function hold(
    reducer: AirReducer<any, any>,
    defaultState: any
  ) {
    const replaceModel = function replaceModel(state: any) {
      return reducer(state);
    };
    replaceModel.creation = function creation(): Connection {
      const model = createModel(replaceModel, defaultState);
      return {
        ...model
      };
    };
    return replaceModel;
  };
  return requireFn(hold);
}

function collectConnections<
  T extends Array<any> | ((...args: any) => any) | Record<string, any>
>(factory: T, collectionKeys: string[] = []): Collection[] {
  if (
    typeof factory === 'function' &&
    typeof (factory as typeof factory & Creation<any>).creation === 'function'
  ) {
    return [
      {
        key: collectionKeys.join('.'),
        factory: factory as (...args: any[]) => any,
        connection: (factory as typeof factory & Creation<any>).creation()
      } as Collection
    ];
  }
  if (!factory || typeof factory !== 'object') {
    return [];
  }
  const collection: Collection[] = [];
  const fact = factory as Exclude<T, (...args: any) => any>;
  const keys = Object.keys(fact);
  keys.forEach((key: string) => {
    const k = key as keyof T;
    const result = collectConnections(fact[k], [...collectionKeys, key]);
    collection.push(...result);
  });
  return collection;
}

export function activeRequiredModels<
  T extends Array<any> | ((...args: any) => any) | Record<string, any>
>(fact: T): ModelFactoryStore<T> {
  function extractFactory(collections: Collection[]) {
    const connections = collections.map(({ connection }) => connection);
    const instances = new Map(
      collections.map(({ factory, connection }) => [factory, connection])
    );
    return {
      collections,
      connections,
      instances
    };
  }
  function update(collections: Collection[], updated: Collection[]) {
    const map = new Map(
      updated.map(({ key, connection, factory }) => [
        key,
        { connection, factory }
      ])
    );
    collections.forEach(({ key, connection }) => {
      const c = map.get(key);
      if (c) {
        c.connection.update(c.factory, { state: connection.getCacheState() });
      } else {
        connection.disconnect();
      }
    });
  }
  const holder = extractFactory(collectConnections(fact));

  const store = {
    update(updateFactory: T): ModelFactoryStore<T> {
      if (updateFactory === fact) {
        return { ...store };
      }
      const collections = collectConnections(updateFactory);
      update(holder.collections, collections);
      const newHolder = extractFactory(collections);
      Object.assign(holder, { ...newHolder });
      return { ...store };
    },
    get(reducer: AirReducer<any, any>): Connection | undefined {
      return holder.instances.get(reducer);
    },
    destroy() {
      holder.connections.forEach(connection => connection.disconnect());
    }
  };
  return { ...store };
}
