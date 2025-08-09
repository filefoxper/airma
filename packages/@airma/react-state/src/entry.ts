import {
  config,
  Model,
  ModelInstance,
  ModelKey,
  ModelUsage,
  Store,
  validations
} from 'as-model';
import { useControlledModel, useModel } from './model';
import { useSignal } from './signal';
import { useSelector } from './selector';

export const model = function model<
  S,
  T extends ModelInstance,
  R extends (getInstance: () => T) => any = (getInstance: () => T) => T
>(modelLike: Model<S, T> | ModelUsage<S, T, R>) {
  const selector = validations.isModelUsage<S, T, R>(modelLike)
    ? modelLike.selector
    : undefined;
  const modelUsage = selector
    ? config({}).model<S, T, R>(modelLike, selector)
    : config({}).model<S, T, R>(modelLike);

  const {
    createKey: originalCreateKey,
    createStore: originalCreateStore,
    select: originalSelect
  } = modelUsage;

  function select<
    C extends (getInstance: () => T) => any = (getInstance: () => T) => T
  >(callback: C) {
    const newUsage = originalSelect(callback);
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

    function useKeySelector(): ReturnType<R>;
    function useKeySelector<KD extends S = S>(callback: {
      state?: KD;
      equality?: (a: ReturnType<R>, b: ReturnType<R>) => boolean;
    }): ReturnType<R>;
    function useKeySelector<
      C extends (instance: T) => any = (instance: T) => T,
      KD extends S = S
    >(callback: {
      state?: KD;
      selector: C;
      equality?: (a: ReturnType<C>, b: ReturnType<C>) => boolean;
    }): ReturnType<C>;
    function useKeySelector(
      callback: undefined,
      equality?: (a: ReturnType<R>, b: ReturnType<R>) => boolean
    ): ReturnType<R>;
    function useKeySelector<
      C extends (instance: T) => any = (instance: T) => T
    >(
      callback: C,
      equality?: (a: ReturnType<C>, b: ReturnType<C>) => boolean
    ): ReturnType<C>;
    function useKeySelector<
      C extends (instance: T) => any = (instance: T) => T,
      KD extends S = S
    >(
      callback:
        | undefined
        | C
        | {
            state?: KD;
            selector?: C;
            equality?: (a: any, b: any) => boolean;
          },
      equality?: (a: any, b: any) => boolean
    ): any;
    function useKeySelector<
      C extends (instance: T) => any = (instance: T) => T,
      KD extends S = S
    >(
      callback?:
        | undefined
        | C
        | {
            state?: KD;
            selector?: C;
            equality?: (a: any, b: any) => boolean;
          },
      equality?: (a: any, b: any) => boolean
    ): any {
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
    const { key } = store;
    const useStoreModel = function useStoreModel<KD extends S>(
      defaultModelState?: KD
    ) {
      const parameters = (
        arguments.length > 0 ? [store, defaultModelState] : [store]
      ) as [Store<S, T, R>, KD?];
      return useModel<S, T, KD>(...parameters);
    };

    const useStoreSignal = function useStoreSignal<KD extends S>(
      defaultModelState?: KD
    ) {
      const parameters = (
        arguments.length > 0 ? [store, defaultModelState] : [store]
      ) as [Store<S, T, R>, KD?];
      return useSignal<S, T, KD>(...parameters);
    };

    function useStoreSelector(): ReturnType<R>;
    function useStoreSelector<KD extends S = S>(callback: {
      state?: KD;
      equality?: (a: ReturnType<R>, b: ReturnType<R>) => boolean;
    }): ReturnType<R>;
    function useStoreSelector<
      C extends (instance: T) => any = (instance: T) => T,
      KD extends S = S
    >(callback: {
      state?: KD;
      selector: C;
      equality?: (a: ReturnType<C>, b: ReturnType<C>) => boolean;
    }): ReturnType<C>;
    function useStoreSelector(
      callback: undefined,
      equality?: (a: ReturnType<R>, b: ReturnType<R>) => boolean
    ): ReturnType<R>;
    function useStoreSelector<
      C extends (instance: T) => any = (instance: T) => T
    >(
      callback: C,
      equality?: (a: ReturnType<C>, b: ReturnType<C>) => boolean
    ): ReturnType<C>;
    function useStoreSelector<
      C extends (instance: T) => any = (instance: T) => T,
      KD extends S = S
    >(
      callback:
        | undefined
        | C
        | {
            state?: KD;
            selector?: C;
            equality?: (a: any, b: any) => boolean;
          },
      equality?: (a: any, b: any) => boolean
    ): any;
    function useStoreSelector<
      C extends (instance: T) => any = (instance: T) => T,
      KD extends S = S
    >(
      callback?:
        | undefined
        | C
        | {
            state?: KD;
            selector?: C;
            equality?: (a: any, b: any) => boolean;
          },
      equality?: (a: any, b: any) => boolean
    ): any {
      return useSelector(store, callback, equality);
    }

    return store.extends({
      useModel: useStoreModel,
      useSignal: useStoreSignal,
      useSelector: useStoreSelector,
      instance: store.getInstance
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

  function useUsageSelector(): ReturnType<R>;
  function useUsageSelector<KD extends S = S>(callback: {
    state?: KD;
    equality?: (a: ReturnType<R>, b: ReturnType<R>) => boolean;
  }): ReturnType<R>;
  function useUsageSelector<
    C extends (instance: T) => any = (instance: T) => T,
    KD extends S = S
  >(callback: {
    state?: KD;
    selector: C;
    equality?: (a: ReturnType<C>, b: ReturnType<C>) => boolean;
  }): ReturnType<C>;
  function useUsageSelector(
    callback: undefined,
    equality?: (a: ReturnType<R>, b: ReturnType<R>) => boolean
  ): ReturnType<R>;
  function useUsageSelector<
    C extends (instance: T) => any = (instance: T) => T
  >(
    callback: C,
    equality?: (a: ReturnType<C>, b: ReturnType<C>) => boolean
  ): ReturnType<C>;
  function useUsageSelector<
    C extends (instance: T) => any = (instance: T) => T,
    KD extends S = S
  >(
    callback:
      | undefined
      | C
      | {
          state?: KD;
          selector?: C;
          equality?: (a: any, b: any) => boolean;
        },
    equality?: (a: any, b: any) => boolean
  ): any;
  function useUsageSelector<
    C extends (instance: T) => any = (instance: T) => T,
    KD extends S = S
  >(
    callback?:
      | undefined
      | C
      | {
          state?: KD;
          selector?: C;
          equality?: (a: any, b: any) => boolean;
        },
    equality?: (a: any, b: any) => boolean
  ): any {
    return useSelector(modelUsage, callback, equality);
  }

  function useUsageControlledModel<KD extends S>(
    state: KD,
    onChange: (s: S) => any
  ) {
    return useControlledModel(modelUsage, state, onChange);
  }

  modelUsage.extends({
    select,
    createKey: createUsageKey,
    createStore: createUsageStore,
    useControlledModel: useUsageControlledModel,
    useModel: useUsageModel,
    useSignal: useUsageSignal,
    useSelector: useUsageSelector
  });

  return modelUsage;
};

const asModel = config({}).model;

model.create = model;
model.createField = asModel.createField;
model.createMethod = asModel.createMethod;
