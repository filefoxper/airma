import { SessionState, StrategyType } from './type';

function debounce(op: { duration: number } | number): StrategyType {
  const time = typeof op === 'number' ? op : op.duration;
  return function db(value: {
    current: () => SessionState;
    runner: () => Promise<SessionState>;
    store: { current?: { id: any; resolve: (d: any) => void } };
  }): Promise<SessionState> {
    const { current, runner, store } = value;
    if (store.current) {
      const { id, resolve } = store.current;
      store.current = undefined;
      clearTimeout(id);
      const currentState = current();
      resolve({ ...currentState, abandon: true });
    }
    return new Promise<SessionState>(resolve => {
      const id = setTimeout(() => {
        resolve(runner());
      }, time);
      store.current = { id, resolve };
    });
  };
}

function once(): StrategyType {
  return function oc(value: {
    current: () => SessionState;
    runner: () => Promise<SessionState>;
    store: { current?: boolean };
  }) {
    const { current, runner, store } = value;
    if (store.current) {
      return new Promise(resolve => {
        const currentState = current();
        resolve({ ...currentState, abandon: true });
      });
    }
    store.current = true;
    return runner().then(d => {
      if (d.isError) {
        store.current = false;
      }
      return d;
    });
  };
}

const stringifyComparator = function comparator(s: any, t: any) {
  if (Object.is(s, t)) {
    return true;
  }
  if (s == null || t == null) {
    return false;
  }
  return JSON.stringify(s) === JSON.stringify(t);
};

function memo<T>(
  equalFn: (source: T | undefined, target: T) => boolean = stringifyComparator
): StrategyType {
  return function mo(value) {
    const { runner, current } = value;
    return runner().then(d => {
      const state = current();
      if (
        typeof equalFn === 'function'
          ? equalFn(state.data, d.data)
          : state.data === d.data
      ) {
        return { ...d, data: state.data };
      }
      return d;
    });
  };
}

function error(
  process: (e: unknown) => any,
  option?: { withAbandoned?: boolean }
): StrategyType {
  const { withAbandoned } = option || {};
  return function er(value: {
    current: () => SessionState;
    runner: () => Promise<SessionState>;
    store: { current?: boolean };
  }) {
    const { runner } = value;
    return runner().then(d => {
      if (d.isError && !d.isErrorProcessed && (!d.abandon || withAbandoned)) {
        process(d.error);
        return { ...d, isErrorProcessed: true };
      }
      return d;
    });
  };
}

function success<T>(
  process: (data: T) => any,
  option?: { withAbandoned?: boolean }
): StrategyType<T> {
  const { withAbandoned } = option || {};
  return function sc(value: {
    current: () => SessionState<T>;
    runner: () => Promise<SessionState<T>>;
    store: { current?: boolean };
  }) {
    const { runner } = value;
    return runner().then(d => {
      if (!d.isError && (!d.abandon || withAbandoned)) {
        process(d.data as T);
      }
      return d;
    });
  };
}

export const Strategy = {
  debounce,
  once,
  error,
  success,
  memo
};
