import type {
  Action,
  AirModelInstance,
  AirReducer,
  Updater,
  HoldCallback,
  Connection,
} from './type';
import { createProxy } from './tools';
import { Creation } from './type';

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

const requiredModelKey = '@airma/core/requiredModels';

export function createRequiredModels<
  T extends Array<any> | ((...args: any) => any) | Record<string, any>
>(
  requireFn: (
    hold: HoldCallback
  ) => T & { [requiredModelKey]: () => [AirReducer<any, any>, Connection][] }
): T & { [requiredModelKey]: () => [AirReducer<any, any>, Connection][] } {
  const modelList: (AirReducer<any, any> & Creation<any>)[] = [];
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
    modelList.push(replaceModel);
    return replaceModel;
  };
  const models = requireFn(hold);
  models[requiredModelKey] = function active(): [
    AirReducer<any, any>,
    Connection
  ][] {
    return modelList.map(model => {
      return [model, model.creation()];
    });
  };
  return models;
}

export function activeRequiredModels<
  T extends Array<any> | ((...args: any) => any) | Record<string, any>
>(
  factory: T & {
    [requiredModelKey]: () => [AirReducer<any, any>, Connection][];
  }
): {
  get(reducer: AirReducer<any, any>): Connection | undefined;
  destroy(): void;
} {
  const active = factory[requiredModelKey];
  if (typeof active !== 'function') {
    throw new Error('This is a invalid model collection or function');
  }
  const pairs = active();
  const instances = new Map(pairs);
  return {
    get(reducer: AirReducer<any, any>): Connection | undefined {
      return instances.get(reducer);
    },
    destroy() {
      pairs.forEach(([, padding]) => padding.disconnect());
    }
  };
}
