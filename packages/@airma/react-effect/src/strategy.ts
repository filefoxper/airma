import { PromiseResult, StrategyType } from './type';

const debounce = function debounce(op: { time: number }): StrategyType {
  const { time } = op;
  return function db(
    getCurrentState: () => PromiseResult,
    runner: () => Promise<PromiseResult>,
    storeRef: { current?: { id: any; resolve: (d: any) => void } }
  ): Promise<PromiseResult> {
    if (storeRef.current) {
      const { id, resolve } = storeRef.current;
      storeRef.current = undefined;
      clearTimeout(id);
      const currentState = getCurrentState();
      resolve({ ...currentState, abandon: true });
    }
    return new Promise<PromiseResult>(resolve => {
      const id = setTimeout(() => {
        resolve(runner());
      }, time);
      storeRef.current = { id, resolve };
    });
  };
};

const once = function once(): StrategyType {
  return function oc(getCurrentState, runner, storeRef) {
    if (storeRef.current) {
      return new Promise(resolve => {
        const currentState = getCurrentState();
        resolve({ ...currentState, abandon: true });
      });
    }
    storeRef.current = true;
    return runner().then(d => {
      if (d.isError) {
        storeRef.current = false;
      }
      return d;
    });
  };
};

export const Strategy = {
  debounce,
  once
};
