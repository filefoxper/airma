import { useEffect, useRef } from 'react';
import { config, validations } from 'as-model';
import { useConfiguration, useStores } from './provider';
import type {
  Key,
  Model,
  ModelKey,
  ModelUsage,
  Store,
  StoreIndex,
  PickState,
  Instance
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
  M extends Model,
  R extends undefined | ((getInstance: () => Instance<M>) => any) = undefined
>(
  stores: ModelStores | null | undefined,
  storeIndex: Key<M, R> | StoreIndex<M, R>
): Store<M, R> | undefined {
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
  M extends Model,
  D extends PickState<M>,
  R extends undefined | ((getInstance: () => Instance<M>) => any) = undefined
>(
  model: M | ModelUsage<M, R> | ModelKey<M, R> | Store<M, R>,
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
    !validations.isModelStore<M, R>(model) &&
    !validations.isModelKey<M, R>(model);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const stores = ifModelIsModelOrModelUsage ? undefined : useStores();
  const optimize = useConfiguration();

  const initializedStore: Store<M, R> = useInitialize(() => {
    const store = (function findOrCreateStore() {
      if (validations.isModelStore<M, R>(model)) {
        const foundStore = findStore<M, R>(stores, model);
        return foundStore ?? model;
      }
      if (validations.isModelKey<M, R>(model)) {
        const foundStore = findStore<M, R>(stores, model);
        if (foundStore == null) {
          throw new Error('Can not find the store of template model key.');
        }
        return foundStore;
      }
      if (controlled) {
        return config({ controlled }).model<M, R>(model).createStore();
      }
      if (validations.isModelUsage<M, R>(model)) {
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
      ).model<M, R>(model);
      return createStore();
    })();
    if (!controlled && !store.getConfiguration()?.notify) {
      store.config(
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
      );
    }
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
    initializedStore.update(
      controlled ? { model, state } : { model, silence: true }
    );
  }

  if (
    validations.isInstanceFromNoStateModel(initializedStore.getStoreInstance())
  ) {
    throw new Error('The model store is not initialized.');
  }

  return initializedStore;
}
