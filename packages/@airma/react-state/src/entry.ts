import { config, validations } from 'as-model';
import { useControlledModel, useModel } from './model';
import { useSignal } from './signal';
import { useSelector } from './selector';
import type {
  Model,
  ModelKey,
  ModelUsage,
  Store,
  Instance,
  PickState
} from 'as-model';

export const model = function model<
  M extends Model,
  R extends undefined | ((getInstance: () => Instance<M>) => any) = undefined
>(modelLike: M | ModelUsage<M, R>) {
  const wrapper = validations.isModelUsage<M, R>(modelLike)
    ? modelLike.wrapper
    : undefined;
  const modelUsage = wrapper
    ? config({}).model<M, R>(modelLike, wrapper)
    : config({}).model<M, R>(modelLike);

  const {
    createKey: originalCreateKey,
    createStore: originalCreateStore,
    produce: originalProduce
  } = modelUsage;

  function produce<
    C extends (getInstance: () => Instance<M>) => any = (
      getInstance: () => Instance<M>
    ) => Instance<M>
  >(callback: C) {
    const newUsage = originalProduce(callback);
    return model(newUsage);
  }

  const createUsageKey = function createUsageKey<D extends PickState<M>>(
    defaultState?: D
  ) {
    const hasDefaultState = arguments.length > 0;
    const key = hasDefaultState
      ? originalCreateKey(defaultState)
      : originalCreateKey();

    const useKeyModel = function useKeyModel<KD extends PickState<M>>(
      defaultModelState?: KD
    ) {
      const parameters = (
        arguments.length > 0 ? [key, defaultModelState] : [key]
      ) as [ModelKey<M, R>, KD?];
      return useModel<M, KD, R>(...parameters);
    };

    const useKeySignal = function useKeySignal<KD extends PickState<M>>(
      defaultModelState?: KD
    ) {
      const parameters = (
        arguments.length > 0 ? [key, defaultModelState] : [key]
      ) as [ModelKey<M, R>, KD?];
      return useSignal<M, KD, R>(...parameters);
    };

    function useKeySelector<
      C extends (
        instance: R extends undefined
          ? Instance<M>
          : ReturnType<R extends undefined ? never : R>
      ) => any = (
        instance: R extends undefined
          ? Instance<M>
          : ReturnType<R extends undefined ? never : R>
      ) => R extends undefined
        ? Instance<M>
        : ReturnType<R extends undefined ? never : R>
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

  const createUsageStore = function createUsageStore<D extends PickState<M>>(
    defaultState?: D
  ) {
    const hasDefaultState = arguments.length > 0;
    const store = hasDefaultState
      ? originalCreateStore(defaultState)
      : originalCreateStore();
    const useStoreModel = function useStoreModel<KD extends PickState<M>>(
      defaultModelState?: KD
    ) {
      const parameters = (
        arguments.length > 0 ? [store, defaultModelState] : [store]
      ) as [Store<M, R>, KD];
      return useModel<M, KD, R>(...parameters);
    };

    const useStoreSignal = function useStoreSignal<KD extends PickState<M>>(
      defaultModelState?: KD
    ) {
      const parameters = (
        arguments.length > 0 ? [store, defaultModelState] : [store]
      ) as [Store<M, R>, KD?];
      return useSignal<M, KD, R>(...parameters);
    };

    function useStoreSelector<
      C extends (
        instance: R extends undefined
          ? Instance<M>
          : ReturnType<R extends undefined ? never : R>
      ) => any = (
        instance: R extends undefined
          ? Instance<M>
          : ReturnType<R extends undefined ? never : R>
      ) => R extends undefined
        ? Instance<M>
        : ReturnType<R extends undefined ? never : R>
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

  const useUsageModel = function useUsageModel<KD extends PickState<M>>(
    defaultModelState: KD
  ) {
    return useModel(modelLike, defaultModelState);
  };

  const useUsageSignal = function useUsageSignal<KD extends PickState<M>>(
    defaultModelState: KD
  ) {
    return useSignal(modelLike, defaultModelState);
  };

  function useUsageControlledModel<KD extends PickState<M>>(
    state: KD,
    onChange: (s: PickState<M>) => any
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
