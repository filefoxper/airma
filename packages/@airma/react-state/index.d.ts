import type { ReactNode, ComponentType, ExoticComponent } from 'react';
import type {
  StoreIndex as AsStoreIndex,
  ModelKey as AsModelKey,
  ModelInstance,
  ModelUsage,
  Model,
  Store,
  Action,
  ValidInstance
} from 'as-model';

export declare type ModelKey<
  S = any,
  T extends ModelInstance = any,
  R extends (instance: () => T) => any = (instance: () => T) => T
> = AsModelKey<S, T, R>;

export declare type ModelStore<
  S = any,
  T extends ModelInstance = any,
  R extends (instance: () => T) => any = (instance: () => T) => T
> = Store<S, T, R>;

export declare type StoreIndex<
  S = any,
  T extends ModelInstance = any,
  R extends (instance: () => T) => any = (instance: () => T) => T
> = AsStoreIndex<S, T, R>;

export declare type ModelLike = (state: any) => any;

export declare function useModel<
  S,
  T extends ModelInstance,
  D extends S,
  R extends (instance: () => T) => any = (instance: () => T) => T
>(
  modelLike: Model<S, T> | ModelKey<S, T> | Store<S, T> | ModelUsage<S, T, R>,
  state?: D
): ReturnType<R>;

declare interface EffectDeps<T extends ModelInstance> {
  onActions: (
    depsPicker: (instance: T) => ((...args: any[]) => any)[]
  ) => EffectDeps<T>;
  onChanges: (depsPicker: (instance: T) => any[]) => EffectDeps<T>;
}

declare interface Signal<
  S,
  T extends ModelInstance,
  R extends (instance: () => T) => any = (instance: () => T) => T
> {
  (opts?: { cutOff?: boolean }): ReturnType<R>;
  useEffect: (
    callback: (instance: T, action: Action<S, T> | null) => void | (() => void)
  ) => EffectDeps<T>;
  useWatch: (
    callback: (instance: T, action: Action<S, T> | null) => void
  ) => EffectDeps<T>;
  store: Store<S, T, R>;
}

export declare function useSignal<
  S,
  T extends ModelInstance,
  D extends S,
  R extends (instance: () => T) => any = (instance: () => T) => T
>(
  modelLike: Model<S, T> | ModelKey<S, T> | Store<S, T> | ModelUsage<S, T, R>,
  state?: D
): Signal<S, T, R>;

export declare function useControlledModel<
  S,
  T extends ModelInstance,
  D extends S,
  R extends (instance: () => T) => any = (instance: () => T) => T
>(
  modelLike: Model<S, T> | ModelUsage<S, T, R>,
  state: D,
  onChange: (s: S) => any
): ReturnType<R>;

export declare const Provider: FC<{
  value:
    | Array<
        | StoreIndex
        | ModelKey
        | Record<string, StoreIndex>
        | Record<string, ModelKey>
      >
    | Record<string, StoreIndex>
    | Record<string, ModelKey>;
  children?: ReactNode;
}>;

export declare type GlobalConfig = {
  batchUpdate?: (callback: () => void) => void;
  test?: {
    act: (callback: () => any) => any;
  };
};

export declare const ConfigProvider: FC<{
  value: GlobalConfig;
  children?: ReactNode;
}>;

export declare function provide(
  ...value: (
    | StoreIndex
    | ModelKey
    | Record<string, StoreIndex>
    | Record<string, ModelKey>
    | Record<number, StoreIndex>
    | Record<number, ModelKey>
  )[]
): {
  <P extends Record<string, any>>(
    component: ComponentType<P> | ExoticComponent<P>
  ): typeof component;
  to: <P extends Record<string, any>>(
    component: ComponentType<P> | ExoticComponent<P>
  ) => typeof component;
};

export declare function useSelector<
  S,
  T extends ModelInstance,
  R extends (getInstance: () => T) => any = (getInstance: () => T) => T,
  C extends (instance: ReturnType<R>) => any = (
    instance: ReturnType<R>
  ) => ReturnType<R>
>(
  modelLike: ModelKey<S, T, R> | Store<S, T, R>,
  selector: C,
  equalFn?: (c: ReturnType<C>, n: ReturnType<C>) => boolean
): ReturnType<C>;

export declare function createKey<S, T extends ModelInstance, D extends S>(
  modelFn: Model<S, T>,
  defaultState?: D
): ModelKey<S, T>;

export declare function createStore<S, T extends ModelInstance, D extends S>(
  modelFn: Model<S, T>,
  defaultState?: D
): ModelStore<S, T>;

export declare function shallowEqual(prev: unknown, current: unknown): boolean;

/** new API * */
declare interface ApiSelector<
  S,
  T extends ModelInstance,
  R extends (getInstance: () => T) => any = (getInstance: () => T) => T
> {
  <
    C extends (instance: ReturnType<R>) => any = (
      instance: ReturnType<R>
    ) => ReturnType<R>
  >(
    callback: C,
    equality?: (a: ReturnType<C>, b: ReturnType<C>) => boolean
  ): ReturnType<C>;
}

declare interface ModelKeyApi<
  S,
  T extends ModelInstance,
  R extends (getInstance: () => T) => any = (getInstance: () => T) => T
> extends ModelKey<S, T, R> {
  useModel: <D extends S>(defaultState?: D) => ReturnType<R>;
  useSignal: <D extends S>(defaultState?: D) => Signal<S, T, R>;
  useSelector: ApiSelector<S, T, R>;
}

declare interface StoreApi<
  S,
  T extends ModelInstance,
  R extends (getInstance: () => T) => any = (getInstance: () => T) => T
> extends Store<S, T, R> {
  useModel: <D extends S>(defaultState?: D) => ReturnType<R>;
  useSignal: <D extends S>(defaultState?: D) => Signal<S, T, R>;
  useSelector: ApiSelector<S, T, R>;
  instance: <D extends S>(defaultState?: D) => ReturnType<R>;
}

declare interface ModelUsageApi<
  S,
  T extends ModelInstance,
  R extends (getInstance: () => T) => any = (getInstance: () => T) => T
> extends ModelUsage<S, T, R> {
  (s: S): ValidInstance<S, T>;
  createKey: <D extends S>(state?: D) => ModelKeyApi<S, T, R>;
  createStore: <D extends S>(state?: D) => StoreApi<S, T, R>;
  produce: <C extends (instance: () => T) => any = (instance: () => T) => T>(
    s: C
  ) => ModelUsageApi<S, T, C>;
  useControlledModel: <D extends S>(
    state: D,
    onChange: (s: S) => any
  ) => ReturnType<R>;
  useModel: <D extends S>(defaultState?: D) => ReturnType<R>;
  useSignal: <D extends S>(defaultState?: D) => Signal<S, T, R>;
}

export declare const model: {
  <
    S,
    T extends ModelInstance,
    R extends (getInstance: () => T) => any = (getInstance: () => T) => T
  >(
    modelLike: Model<S, T> | ModelUsage<S, T, R>
  ): ModelUsageApi<S, T, R>;
  createField: <T extends () => any>(
    callback: T,
    deps?: unknown[]
  ) => {
    get: () => ReturnType<T>;
  };
  createMethod<M extends (...args: any[]) => any>(
    callback: M
  ): M & { identifier: (d: any) => boolean };
};

export declare const validations: {
  isInstanceFromNoStateModel: (instance: any) => boolean;
  isModelKey: <
    S,
    T extends ModelInstance,
    R extends (ins: () => T) => any = (ins: () => T) => T
  >(
    data: any
  ) => data is ModelKey<S, T, R>;
  isModelStore: <
    S,
    T extends ModelInstance,
    R extends (ins: () => T) => any = (ins: () => T) => T
  >(
    data: any
  ) => data is Store<S, T, R>;
  isModelUsage: <
    S,
    T extends ModelInstance,
    R extends (ins: () => T) => any = (ins: () => T) => T
  >(
    data: any
  ) => data is ModelUsage<S, T, R>;
};

export declare function useActProcess(): {
  act: (callback: () => any) => ReturnType<typeof callback>;
};
