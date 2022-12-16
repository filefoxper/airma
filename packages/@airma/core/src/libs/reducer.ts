import type {
  Action,
  AirModelInstance,
  AirReducer,
  Updater,
  Connection,
  StateSetMode,
  FactoryInstance
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
    updater.state = result;
    updater.cacheState = { state: result };
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
    state: defaultState,
    cacheState: null
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
    getCacheState(): { state: S } | null {
      return updater.cacheState;
    },
    getState(): S {
      return updater.state;
    },
    update(
      updateReducer: AirReducer<S, T>,
      outState?: { state: S; cache?: boolean }
    ) {
      const { state } = updater;
      const nextState = outState ? outState.state : state;
      updater.reducer = updateReducer;
      updater.state = nextState;
      updater.cacheState =
        outState && outState.cache
          ? { state: outState.state }
          : updater.cacheState;
      updater.current = updateReducer(updater.state);
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

export const StateSetModes = {
  default<S = any>(state: S): StateSetMode<S> {
    return persist => {
      if (!persist) {
        return state;
      }
      return !persist.isDefault ? persist.state : state;
    };
  },
  extend<S = any>(state: S): StateSetMode<S> {
    return persist => {
      if (!persist) {
        return state;
      }
      return persist.state;
    };
  },
  force<S = any>(state: S): StateSetMode<S> {
    return () => state;
  }
};

export function factory<T extends AirReducer<any, any>>(
  reducer: T,
  state?:
    | (T extends AirReducer<infer S, any> ? S : never)
    | StateSetMode<T extends AirReducer<infer S, any> ? S : never>
): FactoryInstance<T> {
  const replaceModel = function replaceModel(state: any) {
    return reducer(state);
  };
  replaceModel.creation = function creation(): Connection {
    const stateSetMode =
      typeof state === 'function'
        ? (state as StateSetMode<
            T extends AirReducer<infer S, any> ? S : never
          >)
        : undefined;
    const currentState = stateSetMode ? stateSetMode(undefined) : state;
    const model = createModel(replaceModel, currentState);
    return {
      ...model,
      stateSetMode: stateSetMode || StateSetModes.default(currentState)
    };
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

const mutationSourceKey = '@@airma/react-state/factory/mutation/source';

function fetchMutationSource<
  T extends Record<string, any> | Array<any> | ((...args: any[]) => any)
>(target: T & { [mutationSourceKey]?: T }, deep?: boolean): T | null {
  const source = target[mutationSourceKey];
  if (source == null) {
    return deep ? target : null;
  }
  return fetchMutationSource(source, true);
}

factory.mutate = function mutate<
  T extends Record<string, any> | Array<any> | ((...args: any[]) => any)
>(target: T, callback: (f: T) => any): ReturnType<typeof callback> {
  const data = callback(target);
  data[mutationSourceKey] = fetchMutationSource(target) || target;
  return data;
};

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
    if (key === mutationSourceKey) {
      return;
    }
    const k = key as keyof T;
    const result = collectConnections(fact[k], [...collectionKeys, key]);
    collection.push(...result);
  });
  return collection;
}

export function createStore<
  T extends Array<any> | ((...args: any) => any) | Record<string, any>
>(
  fact: T & {
    [mutationSourceKey]?:
      | Array<any>
      | ((...args: any) => any)
      | Record<string, any>;
  }
): ModelFactoryStore<T> {
  const source = fetchMutationSource(fact);
  const handler = source || fact;
  function extractFactory(collections: Collection[]) {
    const connections = collections.map(({ connection }) => connection);
    const instances = new Map(
      collections.flatMap(({ factory, sourceFactory, connection }) => [
        [factory, connection],
        [sourceFactory, connection]
      ])
    );
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
    const updatedMap = new Map(
      updated.map(({ key, connection, factory }) => [
        key,
        { connection, factory }
      ])
    );
    const map = new Map(
      collections.map(({ key, connection, factory }) => [
        key,
        { connection, factory }
      ])
    );
    const additions = updated.filter(({ key }) => !map.has(key));
    const deletions = collections.filter(({ key }) => !updatedMap.has(key));
    const updates = collections
      .map(collection => {
        const { key, connection } = collection;
        const c = updatedMap.get(key);
        if (!c) {
          return undefined;
        }
        const updatingConnection = c.connection;
        const { stateSetMode } = updatingConnection;
        const state = (function computeState() {
          const isDefault = connection.getCacheState() == null;
          const state = connection.getState();
          if (typeof stateSetMode === 'function') {
            return stateSetMode({ isDefault, state });
          }
          return StateSetModes.default(updatingConnection.getState())({
            isDefault,
            state
          });
        })();
        console.log('state', state);
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
  const currentCollections = collectConnections(fact);
  const sourceCollections = source
    ? collectConnections(source)
    : currentCollections;
  const holder = source
    ? extractFactory(updateCollections(sourceCollections, currentCollections))
    : extractFactory(sourceCollections);

  const store = {
    update(updateFactory: T): ModelFactoryStore<T> {
      if (updateFactory === fact) {
        return { ...store };
      }
      const newSource = fetchMutationSource(updateFactory);
      const newSourceCollections = newSource
        ? updateCollections(sourceCollections, collectConnections(newSource))
        : sourceCollections;
      const collections = collectConnections(updateFactory);
      const newHolder = extractFactory(
        updateCollections(newSourceCollections, collections)
      );
      Object.assign(holder, { ...newHolder });
      return { ...store };
    },
    get(reducer: AirReducer<any, any>): Connection | undefined {
      return holder.instances.get(reducer);
    },
    equal(
      factory: Record<string, any> | Array<any> | ((...args: any[]) => any)
    ): boolean {
      return factory === handler;
    },
    destroy() {
      holder.connections.forEach(connection => connection.disconnect());
    }
  };
  return { ...store };
}
