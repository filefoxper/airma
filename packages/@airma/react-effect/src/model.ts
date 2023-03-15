import { createKey } from '@airma/react-state';
import type { SessionState } from './type';
import { SessionKey } from './type';

export function effectModel(state: SessionState & { version?: number }) {
  const { version, ...rest } = state;
  const mergeVersion = (s: SessionState) => {
    return { ...s, version };
  };
  return {
    state: rest,
    version: version || 0,
    setState(
      s: SessionState | ((p: SessionState) => SessionState)
    ): SessionState & { version?: number } {
      if (typeof s !== 'function') {
        return mergeVersion(s);
      }
      return mergeVersion(s(state));
    },
    trigger(): SessionState & { version?: number } {
      return { ...state, version: (version || 0) + 1 };
    }
  };
}

export const defaultPromiseResult = (config?: {
  data: any;
  loaded: true;
}): SessionState => ({
  data: undefined,
  isError: false,
  isFetching: false,
  abandon: false,
  triggerType: undefined,
  loaded: false,
  ...config
});

export function createSessionKey<
  E extends (...params: any[]) => Promise<any>,
  T = E extends (...params: any[]) => Promise<infer R> ? R : never
>(effectCallback: E): SessionKey<E> {
  const context = { implemented: false };
  const model = createKey(effectModel, defaultPromiseResult()) as SessionKey<E>;
  model.effect = [
    function effectCallbackReplace(...params: any[]) {
      return effectCallback(...params);
    } as E
  ] as [E];
  model.implement = function impl(callback: E) {
    if (context.implemented) {
      return;
    }
    model.effect[0] = callback;
    context.implemented = true;
  };
  return model as SessionKey<E>;
}
