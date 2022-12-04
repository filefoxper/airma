import type {
  Action,
  ActualReducer,
  AirModelInstance,
  AirReducer,
  Connection
} from './type';
import { createProxy } from './tools';

function rebuildDispatchMethod<S, T extends AirModelInstance>(
  connection: Connection<S, T>,
  type: string
) {
  if(connection.cacheMethods[type]){
    return connection.cacheMethods[type];
  }
  const newMethod = function newMethod(...args: unknown[]) {
    const method = connection.current[type] as (...args:unknown[])=>S;
    const result = method(...args);
    const { dispatch, reducer } = connection;
    connection.current = reducer(result);
    connection.cacheState = result;
    if (typeof dispatch !== 'function') {
      return result;
    }
    dispatch({ type, state: result });
    return result;
  };
  connection.cacheMethods[type] = newMethod;
  return newMethod;
}

export default function createModel<S, T extends AirModelInstance,D extends S>(
  reducer: AirReducer<S, T>,
  defaultState: D
): ActualReducer<S, T> {
  const defaultModel = reducer(defaultState);
  const connection: Connection<S, T> = {
    current: defaultModel,
    reducer,
    dispatch: null,
    cacheMethods:{},
    cacheState:defaultState
  };
  const actualReducer: ActualReducer<S, T> = function actualReducer(
    state: S,
    action: Action
  ) {
    if (typeof connection.current[action.type] === 'function'||action.type==='@@AIR_STATE_UPDATE') {
      return action.state;
    }
    return state;
  };
  actualReducer.agent = createProxy(defaultModel, {
    get(target: T, p: string): unknown {
      const value = connection.current[p];
      if (typeof value === 'function') {
        return rebuildDispatchMethod<S, T>(
          connection,
          p
        );
      }
      return value;
    }
  });
  actualReducer.update = function update(updateReducer:AirReducer<S, T>){
    const {cacheState} = connection;
    connection.reducer = updateReducer;
    connection.current = updateReducer(cacheState);
  };
  actualReducer.connect = function connect(dispatchCall) {
    connection.dispatch = null;
    connection.dispatch = dispatchCall || null;
  };
  actualReducer.disconnect = function disconnect() {
    connection.dispatch = null;
  };
  return actualReducer;
}
