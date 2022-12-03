import type {
  Action,
  ActualReducer,
  AirModelInstance,
  AirReducer,
  Connection
} from './type';
import { createProxy } from './tools';

function rebuildDispatchMethod<S, T extends AirModelInstance<S>>(
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
    const next = reducer(result);
    connection.current = next;
    if (typeof dispatch !== 'function') {
      return result;
    }
    dispatch({ type, state: next.state });
    return result;
  };
  connection.cacheMethods[type] = newMethod;
  return newMethod;
}

export default function createModel<S, T extends AirModelInstance<S>>(
  reducer: AirReducer<S, T>,
  defaultState: ReturnType<typeof reducer>['state']
): ActualReducer<S, T> {
  const defaultModel = reducer(defaultState);
  const connection: Connection<S, T> = {
    current: defaultModel,
    reducer,
    dispatch: null,
    cacheMethods:{}
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
      if (p === 'state') {
        return connection.current[p];
      }
      if (typeof value === 'function') {
        return rebuildDispatchMethod<S, T>(
          connection,
          p
        );
      }
      return value;
    }
  });
  actualReducer.update = function update(updateReducer:AirReducer<S, T>,s:S){
    connection.reducer = updateReducer;
    connection.current = updateReducer(s);
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
