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

export const defaultPromiseResult = (config?: {
  data: any;
  loaded: true;
}): PromiseResult => ({
  data: undefined,
  isError: false,
  isFetching: false,
  abandon: false,
  triggerType: undefined,
  loaded: false,
  ...config
});

export function client<
  E extends (...params: any[]) => Promise<any>,
  T = E extends (...params: any[]) => Promise<infer R> ? R : never
>(effectCallback: E): ModelPromiseEffectCallback<E> {
  const context = { implemented: false };
  const model = factory(
    effectModel,
    defaultPromiseResult()
  ) as ModelPromiseEffectCallback<E>;
  model.effect = [
    function effectCallbackReplace(...params: any[]) {
      return effectCallback(...params);
    } as E
  ];
  model.implement = function impl(callback: E) {
    if (context.implemented) {
      return;
    }
    model.effect[0] = callback;
    context.implemented = true;
  };
  return model as ModelPromiseEffectCallback<E>;
}

export const asyncEffect = client;
