import { useEffect, useRef } from 'react';
import { config, validations } from 'as-model';
import { useConfiguration, useStores } from './provider';
import type {
  Key,
  Model,
  ModelInstance,
  ModelKey,
  ModelUsage,
  Store,
  StoreIndex
} from 'as-model';
import type { ModelStores } from './type';

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
  R extends undefined | ((getInstance: () => T) => any) = undefined
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
  R extends undefined | ((getInstance: () => T) => any) = undefined
>(
  model:
    | Model<S, T>
    | ModelUsage<Model<S, T>, R>
    | ModelKey<S, T, R>
    | Store<S, T, R>,
  opt?: {
    controlled?: boolean;
    hasDefaultState?: boolean;
    state?: D;
  }
) {
  const hasDefaultState = opt?.hasDefaultState ?? false;
  const state = opt?.state;
  const controlled = opt?.controlled;

  const ifModelIsModelOrModelUsage =
    !validations.isModelStore<S, T, R>(model) &&
    !validations.isModelKey<S, T, R>(model);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const stores = ifModelIsModelOrModelUsage ? undefined : useStores();
  const optimize = useConfiguration();

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
        return config({ controlled })
          .model<Model<S, T>, R>(model)
          .createStore();
      }
      if (validations.isModelUsage<Model<S, T>, R>(model)) {
        return model.createStore();
      }
      const { createStore } = config(
        optimize?.batchUpdate
          ? {
              notify(notifier, action) {
                optimize?.batchUpdate?.(() => {
                  const { errors } = notifier(action);
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
      ).model<Model<S, T>, R>(model);
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

  if (
    validations.isInstanceFromNoStateModel(initializedStore.getStoreInstance())
  ) {
    throw new Error('The model store is not initialized.');
  }

  return initializedStore;
}
