import { factory } from '@airma/react-state';
import type { ModelPromiseEffectCallback, PromiseResult } from './type';

export function effectModel(state: PromiseResult & { version?: number }) {
  const { version, ...rest } = state;
  const mergeVersion = (s: PromiseResult) => {
    return { ...s, version };
  };
  return {
    state: rest,
    version: version || 0,
    setState(
      s: PromiseResult | ((p: PromiseResult) => PromiseResult)
    ): PromiseResult & { version?: number } {
      if (typeof s !== 'function') {
        return mergeVersion(s);
      }
      return mergeVersion(s(state));
    },
    trigger(): PromiseResult & { version?: number } {
      return { ...state, version: (version || 0) + 1 };
    }
  };
}

export const defaultPromiseResult = (): PromiseResult => ({
  data: undefined,
  isError: false,
  isFetching: false,
  abandon: false,
  triggerType: undefined
});

export function client<
  E extends (...params: any[]) => Promise<any>,
  T = E extends (...params: any[]) => Promise<infer R> ? R : never
>(effectCallback: E): ModelPromiseEffectCallback<E> {
  const model = factory(effectModel, defaultPromiseResult());
  model.effect = [
    function effectCallbackReplace(...params: any[]) {
      return effectCallback(...params);
    }
  ];
  return model as ModelPromiseEffectCallback<E>;
}

export const asyncEffect = client;
