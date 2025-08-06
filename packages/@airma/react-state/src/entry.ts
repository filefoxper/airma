import { config, validations } from 'as-model';
import { useControlledModel, useModel } from './model';
import { useSignal } from './signal';
import { useSelector } from './selector';
import type {
  Model,
  ModelInstance,
  ModelKey,
  ModelUsage,
  Store
} from 'as-model';

export const model = function model<
  S,
  T extends ModelInstance,
  R extends (getInstance: () => T) => any = (getInstance: () => T) => T
>(modelLike: Model<S, T> | ModelUsage<S, T, R>) {
  const wrapper = validations.isModelUsage<S, T, R>(modelLike)
    ? modelLike.wrapper
    : undefined;
  const modelUsage = wrapper
    ? config({}).model<S, T, R>(modelLike, wrapper)
    : config({}).model<S, T, R>(modelLike);

  const {
    createKey: originalCreateKey,
    createStore: originalCreateStore,
    produce: originalProduce
  } = modelUsage;

  function produce<
    C extends (getInstance: () => T) => any = (getInstance: () => T) => T
  >(callback: C) {
    const newUsage = originalProduce(callback);
    return model(newUsage);
  }

  const createUsageKey = function createUsageKey<D extends S>(
    defaultState?: D
  ) {
    const hasDefaultState = arguments.length > 0;
    const key = hasDefaultState
      ? originalCreateKey(defaultState)
      : originalCreateKey();

    const useKeyModel = function useKeyModel<KD extends S>(
      defaultModelState?: KD
    ) {
      const parameters = (
        arguments.length > 0 ? [key, defaultModelState] : [key]
      ) as [ModelKey<S, T, R>, KD?];
      return useModel<S, T, KD>(...parameters);
    };

    const useKeySignal = function useKeySignal<KD extends S>(
      defaultModelState?: KD
    ) {
      const parameters = (
        arguments.length > 0 ? [key, defaultModelState] : [key]
      ) as [ModelKey<S, T, R>, KD?];
      return useSignal<S, T, KD>(...parameters);
    };

    function useKeySelector<
      C extends (instance: ReturnType<R>) => any = (
        instance: ReturnType<R>
      ) => ReturnType<R>
    >(
      callback: C,
      equality?: (a: ReturnType<C>, b: ReturnType<C>) => boolean
    ): ReturnType<C> {
      return useSelector(key, callback, equality);
    }
    return key.extends({
      useModel: useKeyModel,
      useSignal: useKeySignal,
      useSelector: useKeySelector
    });
  };

  const createUsageStore = function createUsageStore<D extends S>(
    defaultState?: D
  ) {
    const hasDefaultState = arguments.length > 0;
    const store = hasDefaultState
      ? originalCreateStore(defaultState)
      : originalCreateStore();
    const useStoreModel = function useStoreModel<KD extends S>(
      defaultModelState?: KD
    ) {
      const parameters = (
        arguments.length > 0 ? [store, defaultModelState] : [store]
      ) as [Store<S, T>, KD];
      return useModel<S, T, KD>(...parameters);
    };

    const useStoreSignal = function useStoreSignal<KD extends S>(
      defaultModelState?: KD
    ) {
      const parameters = (
        arguments.length > 0 ? [store, defaultModelState] : [store]
      ) as [Store<S, T>, KD?];
      return useSignal<S, T, KD>(...parameters);
    };

    function useStoreSelector<
      C extends (instance: ReturnType<R>) => any = (
        instance: ReturnType<R>
      ) => ReturnType<R>
    >(
      callback: C,
      equality?: (a: ReturnType<C>, b: ReturnType<C>) => boolean
    ): ReturnType<C> {
      return useSelector(store, callback, equality);
    }

    return store.extends({
      useModel: useStoreModel,
      useSignal: useStoreSignal,
      useSelector: useStoreSelector,
      instance(initialState?: D) {
        const hasInitialState = arguments.length > 0;
        if (hasInitialState) {
          store.update({ initialState });
        }
        return store.getInstance();
      }
    });
  };

  const useUsageModel = function useUsageModel<KD extends S>(
    defaultModelState: KD
  ) {
    return useModel<S, T, KD>(modelLike, defaultModelState);
  };

  const useUsageSignal = function useUsageSignal<KD extends S>(
    defaultModelState: KD
  ) {
    return useSignal<S, T, KD>(modelLike, defaultModelState);
  };

  function useUsageControlledModel<KD extends S>(
    state: KD,
    onChange: (s: S) => any
  ) {
    return useControlledModel(modelUsage, state, onChange);
  }

  modelUsage.extends({
    produce,
    createKey: createUsageKey,
    createStore: createUsageStore,
    useControlledModel: useUsageControlledModel,
    useModel: useUsageModel,
    useSignal: useUsageSignal
  });

  return modelUsage;
};

const asModel = config({}).model;

model.create = model;
model.createField = asModel.createField;
model.createMethod = asModel.createMethod;
