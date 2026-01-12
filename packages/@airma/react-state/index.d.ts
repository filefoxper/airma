import type { ReactNode, ComponentType, ExoticComponent } from 'react';
import type {
  StoreIndex as AsStoreIndex,
  ModelKey as AsModelKey,
  ModelInstance,
  ModelUsage,
  Model,
  Store,
  Action,
  Instance,
  PickState
} from 'as-model';

declare type PickKeyWrapper<M extends ModelKey> =
  M extends ModelKey<any, any, infer R> ? R : never;

declare type PickStoreWrapper<M extends StoreIndex> =
  M extends Store<any, any, infer R> ? R : never;

declare type PickModelUsageWrapper<M extends StoreIndex> =
  M extends ModelUsage<any, infer R> ? R : never;

declare type InstanceOf<
  T extends ModelInstance,
  R extends undefined | ((instance: () => T) => any)
> = R extends undefined ? T : ReturnType<R extends undefined ? never : R>;

export declare type ModelKey<
  S = any,
  T extends ModelInstance = any,
  R extends undefined | ((instance: () => T) => any) = undefined
> = AsModelKey<S, T, R>;

export declare type ModelStore<
  S = any,
  T extends ModelInstance = any,
  R extends undefined | ((instance: () => T) => any) = undefined
> = Store<S, T, R>;

export declare type StoreIndex<
  S = any,
  T extends ModelInstance = any,
  R extends undefined | ((instance: () => T) => any) = undefined
> = AsStoreIndex<S, T, R>;

export declare type ModelLike = (state: any) => any;

export declare function useModel<
  S,
  T extends ModelInstance,
  D extends S,
  R extends undefined | ((instance: () => T) => any) = undefined
>(modelLike: ModelUsage<Model<S, T>, R>, state?: D): InstanceOf<T, R>;
export declare function useModel<S, T extends ModelInstance, D extends S>(
  modelLike: Model<S, T>,
  state?: D
): T;
export declare function useModel<
  S,
  T extends ModelInstance,
  D extends S,
  R extends undefined | ((instance: () => T) => any) = undefined
>(modelLike: ModelKey<S, T, R>, state?: D): InstanceOf<T, R>;
export declare function useModel<
  S,
  T extends ModelInstance,
  D extends S,
  R extends undefined | ((instance: () => T) => any) = undefined
>(modelLike: Store<S, T, R>, state?: D): InstanceOf<T, R>;
export declare function useModel<
  S,
  T extends ModelInstance,
  D extends S,
  R extends undefined | ((instance: () => T) => any) = undefined
>(
  modelLike:
    | Model<S, T>
    | ModelKey<S, T, R>
    | Store<S, T, R>
    | ModelUsage<Model<S, T>, R>,
  state?: D
): InstanceOf<T, R>;

declare interface EffectDeps<T extends ModelInstance> {
  onActions: (
    depsPicker: (instance: T) => ((...args: any[]) => any)[]
  ) => EffectDeps<T>;
  onChanges: (depsPicker: (instance: T) => any[]) => EffectDeps<T>;
}

declare interface Signal<
  S,
  T extends ModelInstance,
  R extends undefined | ((instance: () => T) => any) = undefined
> {
  (opts?: { cutOff?: boolean }): InstanceOf<T, R>;
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
  R extends undefined | ((instance: () => T) => any) = undefined
>(modelLike: ModelUsage<Model<S, T>, R>, state?: D): Signal<S, T, R>;
export declare function useSignal<S, T extends ModelInstance, D extends S>(
  modelLike: Model<S, T>,
  state?: D
): Signal<S, T>;
export declare function useSignal<
  S,
  T extends ModelInstance,
  D extends S,
  R extends undefined | ((instance: () => T) => any) = undefined
>(modelLike: ModelKey<S, T, R>, state?: D): Signal<S, T, R>;
export declare function useSignal<
  S,
  T extends ModelInstance,
  D extends S,
  R extends undefined | ((instance: () => T) => any) = undefined
>(modelLike: Store<S, T, R>, state?: D): Signal<S, T, R>;
export declare function useSignal<
  S,
  T extends ModelInstance,
  D extends S,
  R extends undefined | ((instance: () => T) => any) = undefined
>(
  modelLike:
    | Model<S, T>
    | ModelKey<S, T, R>
    | Store<S, T, R>
    | ModelUsage<Model<S, T>, R>,
  state?: D
): Signal<S, T, R>;

export declare function useControlledModel<
  S,
  T extends ModelInstance,
  D extends S,
  R extends undefined | ((instance: () => T) => any) = undefined
>(
  modelLike: ModelUsage<Model<S, T>, R>,
  state: D,
  onChange: (s: S) => any
): InstanceOf<T, R>;
export declare function useControlledModel<
  S,
  T extends ModelInstance,
  D extends S
>(modelLike: Model<S, T>, state: D, onChange: (s: S) => any): T;
export declare function useControlledModel<
  S,
  T extends ModelInstance,
  D extends S,
  R extends undefined | ((instance: () => T) => any) = undefined
>(
  modelLike: Model<S, T> | ModelUsage<Model<S, T>, R>,
  state: D,
  onChange: (s: S) => any
): InstanceOf<T, R>;

export declare const Provider: FC<{
  value:
    | Array<
        | StoreIndex<any, any, any>
        | ModelKey<any, any, any>
        | Record<string, StoreIndex<any, any, any>>
        | Record<string, ModelKey<any, any, any>>
      >
    | Record<string, StoreIndex<any, any, any>>
    | Record<string, ModelKey<any, any, any>>;
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
    | StoreIndex<any, any, any>
    | ModelKey<any, any, any>
    | Record<string, StoreIndex<any, any, any>>
    | Record<string, ModelKey<any, any, any>>
    | Record<number, StoreIndex<any, any, any>>
    | Record<number, ModelKey<any, any, any>>
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
  R extends undefined | ((instance: () => T) => any) = undefined,
  C extends (
    instance: R extends undefined
      ? T
      : ReturnType<R extends undefined ? never : R>
  ) => any = (
    instance: R extends undefined
      ? T
      : ReturnType<R extends undefined ? never : R>
  ) => R extends undefined ? T : ReturnType<R extends undefined ? never : R>
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
  R extends undefined | ((getInstance: () => T) => any) = undefined
> {
  <
    C extends (
      instance: R extends undefined
        ? T
        : ReturnType<R extends undefined ? never : R>
    ) => any = (
      instance: R extends undefined
        ? T
        : ReturnType<R extends undefined ? never : R>
    ) => R extends undefined ? T : ReturnType<R extends undefined ? never : R>
  >(
    callback: C,
    equality?: (a: ReturnType<C>, b: ReturnType<C>) => boolean
  ): ReturnType<C>;
}

declare interface ModelKeyApi<
  S,
  T extends ModelInstance,
  R extends undefined | ((getInstance: () => T) => any) = undefined
> extends ModelKey<S, T, R> {
  useModel: <D extends S>(
    defaultState?: D
  ) => R extends undefined ? T : ReturnType<R extends undefined ? never : R>;
  useSignal: <D extends S>(defaultState?: D) => Signal<S, T, R>;
  useSelector: ApiSelector<S, T, R>;
}

declare interface StoreApi<
  S,
  T extends ModelInstance,
  R extends undefined | ((getInstance: () => T) => any) = undefined
> extends Store<S, T, R> {
  useModel: <D extends S>(
    defaultState?: D
  ) => R extends undefined ? T : ReturnType<R extends undefined ? never : R>;
  useSignal: <D extends S>(defaultState?: D) => Signal<S, T, R>;
  useSelector: ApiSelector<S, T, R>;
  instance: <D extends S>(
    defaultState?: D
  ) => R extends undefined ? T : ReturnType<R extends undefined ? never : R>;
}

declare interface ModelUsageApi<
  M extends Model,
  R extends undefined | ((getInstance: () => Instance<M>) => any) = undefined
> extends ModelUsage<M, R> {
  createKey: <D extends PickState<M>>(
    state?: D
  ) => ModelKeyApi<PickState<M>, Instance<M>, R>;
  createStore: <D extends S>(
    state?: D
  ) => StoreApi<PickState<M>, Instance<M>, R>;
  produce: <
    C extends (instance: () => Instance<M>) => any = (
      instance: () => Instance<M>
    ) => Instance<M>
  >(
    s: C
  ) => ModelUsageApi<M, C>;
  useControlledModel: <D extends PickState<M>>(
    state: D,
    onChange: (s: PickState<M>) => any
  ) => R extends undefined
    ? Instance<M>
    : ReturnType<R extends undefined ? never : R>;
  useModel: <D extends PickState<M>>(
    defaultState?: D
  ) => R extends undefined
    ? Instance<M>
    : ReturnType<R extends undefined ? never : R>;
  useSignal: <D extends PickState<M>>(
    defaultState?: D
  ) => Signal<PickState<M>, Instance<M>, R>;
}

export declare const model: {
  <
    D extends Model,
    R extends undefined | ((getInstance: () => Instance<D>) => any) = undefined
  >(
    modelLike: D
  ): ModelUsageApi<D, R>;
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
    R extends undefined | ((ins: () => T) => any) = undefined
  >(
    data: any
  ) => data is ModelKey<S, T, R>;
  isModelStore: <
    S,
    T extends ModelInstance,
    R extends undefined | ((ins: () => T) => any) = undefined
  >(
    data: any
  ) => data is Store<S, T, R>;
  isModelUsage: <
    S,
    T extends ModelInstance,
    R extends undefined | ((ins: () => T) => any) = undefined
  >(
    data: any
  ) => data is ModelUsage<S, T, R>;
};

export declare function useActProcess(): {
  act: (callback: () => any) => ReturnType<typeof callback>;
};
