import { PromiseResult, StrategyType } from './type';

const debounce = function debounce(op: { time: number }): StrategyType {
  const { time } = op;
  return function db(value: {
    current: () => PromiseResult;
    runner: () => Promise<PromiseResult>;
    store: { current?: { id: any; resolve: (d: any) => void } };
  }): Promise<PromiseResult> {
    const { current, runner, store } = value;
    if (store.current) {
      const { id, resolve } = store.current;
      store.current = undefined;
      clearTimeout(id);
      const currentState = current();
      resolve({ ...currentState, abandon: true });
    }
    return new Promise<PromiseResult>(resolve => {
      const id = setTimeout(() => {
        resolve(runner());
      }, time);
      store.current = { id, resolve };
    });
  };
};

const once = function once(): StrategyType {
  return function oc(value: {
    current: () => PromiseResult;
    runner: () => Promise<PromiseResult>;
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
};

export const Strategy = {
  debounce,
  once
};
