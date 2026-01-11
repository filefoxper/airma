import { createSelector } from 'as-model';
import { usePersistFn } from '@airma/react-hooks-core';
import { useEffect, useState } from 'react';
import { useInitialize, useModelInitialize } from './initialize';
import { useRenderProtectDispatch } from './enhance';
import type { ModelInstance, ModelKey, Store } from 'as-model';

export function useSelector<
  S,
  T extends ModelInstance,
  R extends undefined | ((getInstance: () => T) => any) = undefined,
  C extends (
    instance: R extends undefined
      ? T
      : ReturnType<R extends undefined ? never : R>
  ) => any = (
    instance: R extends undefined
      ? T
      : ReturnType<R extends undefined ? never : R>
  ) => ReturnType<
    R extends undefined ? T : ReturnType<R extends undefined ? never : R>
  >
>(
  modelLike: ModelKey<S, T, R> | Store<S, T, R>,
  selector: C,
  equalFn?: (c: ReturnType<C>, n: ReturnType<C>) => boolean
): ReturnType<C> {
  const equalityFunction = equalFn;
  const selectorFunction = selector;
  const equality = usePersistFn((a: ReturnType<C>, b: ReturnType<C>) =>
    equalityFunction ? equalityFunction(a, b) : a === b
  );
  const store = useModelInitialize(modelLike);

  const selectStore = useInitialize(() => {
    return createSelector(store, equalFn ? { equality } : {});
  });
  const computeResult = function computeResult() {
    const token = selectStore.getToken();
    const selected = selectStore.select(i => selectorFunction(i() as any));
    return { token, selected };
  };

  const [result, setResult] = useState(computeResult);

  const subscription = useRenderProtectDispatch(() => {
    const newResult = computeResult();
    if (!newResult.token.isDifferent(result.token)) {
      return;
    }
    if (result.selected === newResult.selected) {
      return;
    }
    setResult(newResult);
  });

  useEffect(() => {
    return selectStore.subscribe(subscription);
  }, []);

  return result.selected;
}
