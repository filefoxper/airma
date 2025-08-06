import {
  createSelector,
  ModelInstance,
  ModelKey,
  ModelUsage,
  Store
} from 'as-model';
import { usePersistFn } from '@airma/react-hooks-core';
import { useEffect, useState } from 'react';
import { useInitialize, useModelInitialize } from './initialize';

export function useSelector<
  S,
  T extends ModelInstance,
  R extends (getInstance: () => T) => any = (getInstance: () => T) => T
>(
  modelLike: ModelKey<S, T, R> | Store<S, T, R> | ModelUsage<S, T, R>
): ReturnType<R>;
export function useSelector<
  S,
  T extends ModelInstance,
  R extends (getInstance: () => T) => any = (getInstance: () => T) => T,
  D extends S = S
>(
  modelLike: ModelKey<S, T, R> | Store<S, T, R> | ModelUsage<S, T, R>,
  selector: {
    state?: D;
    equality?: (c: ReturnType<R>, n: ReturnType<R>) => boolean;
  }
): ReturnType<R>;
export function useSelector<
  S,
  T extends ModelInstance,
  R extends (getInstance: () => T) => any = (getInstance: () => T) => T,
  C extends (instance: T) => any = (instance: T) => T,
  D extends S = S
>(
  modelLike: ModelKey<S, T, R> | Store<S, T, R> | ModelUsage<S, T, R>,
  selector: {
    state?: D;
    selector: C;
    equality?: (c: ReturnType<C>, n: ReturnType<C>) => boolean;
  }
): ReturnType<C>;
export function useSelector<
  S,
  T extends ModelInstance,
  R extends (getInstance: () => T) => any = (getInstance: () => T) => T,
  C extends (instance: T) => any = (instance: T) => T
>(
  modelLike: ModelKey<S, T, R> | Store<S, T, R> | ModelUsage<S, T, R>,
  selector: C,
  equalFn?: (c: ReturnType<C>, n: ReturnType<C>) => boolean
): ReturnType<C>;
export function useSelector<
  S,
  T extends ModelInstance,
  R extends (getInstance: () => T) => any = (getInstance: () => T) => T
>(
  modelLike: ModelKey<S, T, R> | Store<S, T, R> | ModelUsage<S, T, R>,
  selector: undefined,
  equalFn?: (c: ReturnType<R>, n: ReturnType<R>) => boolean
): ReturnType<R>;
export function useSelector<
  S,
  T extends ModelInstance,
  R extends (getInstance: () => T) => any = (getInstance: () => T) => T,
  C extends (instance: T) => any = (instance: T) => T,
  D extends S = S
>(
  modelLike: ModelKey<S, T, R> | Store<S, T, R> | ModelUsage<S, T, R>,
  selector:
    | undefined
    | C
    | {
        state?: D;
        selector?: C;
        equality?: (c: any, n: any) => boolean;
      },
  equalFn?: (c: any, n: any) => boolean
): any;
export function useSelector<
  S,
  T extends ModelInstance,
  R extends (getInstance: () => T) => any = (getInstance: () => T) => T,
  C extends (instance: T) => any = (instance: T) => T,
  D extends S = S
>(
  modelLike: ModelKey<S, T, R> | Store<S, T, R> | ModelUsage<S, T, R>,
  selector?:
    | undefined
    | C
    | {
        state?: D;
        selector?: C;
        equality?: (c: any, n: any) => boolean;
      },
  equalFn?: (c: any, n: any) => boolean
): any {
  const selectorConfig =
    selector && typeof selector === 'object' ? selector : undefined;
  const equalityFunction = selectorConfig?.equality ?? equalFn;
  const selectorFunction =
    selectorConfig?.selector ??
    (typeof selector === 'function' ? selector : undefined);
  const equality = usePersistFn((a: unknown, b: unknown) =>
    equalityFunction ? equalityFunction(a, b) : a === b
  );
  const store = useModelInitialize(modelLike, {
    hasDefaultState: !!selectorConfig && 'state' in selectorConfig,
    state: selectorConfig?.state
  });
  const selectStore = useInitialize(() => {
    return createSelector(store, equalFn ? { equality } : {});
  });
  const computeResult = function computeResult() {
    const token = selectStore.getToken();
    const selected = selectorFunction
      ? selectStore.select(i => selectorFunction(i()))
      : selectStore.select();
    return { token, selected };
  };

  const [result, setResult] = useState(computeResult);

  const subscription = usePersistFn(() => {
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
