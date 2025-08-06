import { useEffect, useRef } from 'react';
import {
  config,
  Key,
  Model,
  ModelInstance,
  ModelKey,
  ModelUsage,
  Store,
  StoreIndex,
  validations
} from 'as-model';
import { ModelStores } from './type';
import { useConfiguration, useStores } from './provider';

export function useInitialize<T extends () => any>(callback: T): ReturnType<T> {
  const ref = useRef<null | { result: ReturnType<T> }>(null);
  if (ref.current == null) {
    ref.current = { result: callback() };
    return ref.current.result;
  }
  return ref.current.result;
}

function findStore<
  S,
  T extends ModelInstance,
  R extends (getInstance: () => T) => any = (getInstance: () => T) => T
>(
  stores: ModelStores | null | undefined,
  storeIndex: Key<S, T, R> | StoreIndex<S, T, R>
): Store<S, T, R> | undefined {
  if (stores == null) {
    return undefined;
  }
  const found = stores.collections.find(storeIndex);
  if (!found) {
    return findStore(stores.parent, storeIndex);
  }
  return found;
}

export function useModelInitialize<
  S,
  T extends ModelInstance,
  D extends S,
  R extends (getInstance: () => T) => any = (getInstance: () => T) => T
>(
  model: Model<S, T> | ModelUsage<S, T, R> | ModelKey<S, T, R> | Store<S, T, R>,
  opt?: {
    controlled?: boolean;
    hasDefaultState?: boolean;
    state?: D;
  }
) {
  const hasDefaultState = opt?.hasDefaultState ?? false;
  const state = opt?.state;
  const controlled = opt?.controlled;
  const stores = useStores();
  const optimize = useConfiguration();

  const ifModelIsModelOrModelUsage =
    !validations.isModelStore<S, T, R>(model) &&
    !validations.isModelKey<S, T, R>(model);

  const initializedStore: Store<S, T, R> = useInitialize(() => {
    const store = (function findOrCreateStore() {
      if (validations.isModelStore<S, T, R>(model)) {
        const foundStore = findStore<S, T, R>(stores, model);
        return foundStore ?? model;
      }
      if (validations.isModelKey<S, T, R>(model)) {
        const foundStore = findStore<S, T, R>(stores, model);
        if (foundStore == null) {
          throw new Error('Can not find the store of template model key.');
        }
        return foundStore;
      }
      if (controlled) {
        return config({ controlled }).model<S, T, R>(model).createStore();
      }
      if (validations.isModelUsage<S, T, R>(model)) {
        return model.createStore();
      }
      const { createStore } = config(
        optimize?.batchUpdate
          ? {
              notify(notifer, action) {
                optimize?.batchUpdate?.(() => {
                  const { errors } = notifer(action);
                  if (!errors || !errors.length) {
                    return;
                  }
                  errors.forEach(err => {
                    Promise.reject(err);
                  });
                });
              }
            }
          : {}
      ).model<S, T, R>(model);
      return createStore();
    })();
    if (hasDefaultState) {
      store.update({ initialState: state });
    }
    return store;
  });

  useEffect(() => {
    return () => {
      if (ifModelIsModelOrModelUsage) {
        initializedStore.destroy();
      }
    };
  }, []);

  if (ifModelIsModelOrModelUsage) {
    initializedStore.update(controlled ? { model, state } : { model });
  }

  return initializedStore;
}
