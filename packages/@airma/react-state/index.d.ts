import type { ReactNode, ComponentType, ExoticComponent } from 'react';
import type {
  ModelKey as AsModelKey,
  ModelInstance,
  ModelUsage,
  Model as AsModelLike,
  Store as AsModelStore,
  StoreIndex as AsModelStoreIndex,
  Action,
  Instance,
  PickState
} from 'as-model';

export declare type Model = AsModelLike;

declare type InstanceOf<
  T extends ModelInstance,
  R extends undefined | ((instance: () => T) => any)
> = R extends undefined ? T : ReturnType<R extends undefined ? never : R>;

export declare type ModelKey<
  M extends Model = Model,
  R extends undefined | ((instance: () => T) => any) = undefined
> = AsModelKey<M, R>;

export declare type Store<
  M extends Model = Model,
  R extends undefined | ((instance: () => T) => any) = undefined
> = AsModelStore<M, R>;

export declare type StoreIndex<
  M extends Model = Model,
  R extends undefined | ((instance: () => T) => any) = undefined
> = AsModelStoreIndex<M, R>;

export declare function useModel<
  M extends Model,
  D extends PickState<M>,
  R extends undefined | ((instance: () => Instance<M>) => any) = undefined
>(modelLike: ModelUsage<M, R>, state?: D): InstanceOf<Instance<M>, R>;
export declare function useModel<M extends Model, D extends PickState<M>>(
  modelLike: M,
  state?: D
): Instance<M>;
export declare function useModel<
  M extends Model,
  D extends PickState<M>,
  R extends undefined | ((instance: () => Instance<M>) => any) = undefined
>(modelLike: ModelKey<M, R>, state?: D): InstanceOf<Instance<M>, R>;
export declare function useModel<
  M extends Model,
  D extends PickState<M>,
  R extends undefined | ((instance: () => Instance<M>) => any) = undefined
>(modelLike: Store<M, R>, state?: D): InstanceOf<Instance<M>, R>;
export declare function useModel<
  M extends Model,
  D extends PickState<M>,
  R extends undefined | ((instance: () => Instance<M>) => any) = undefined
>(
  modelLike: M | ModelKey<M, R> | Store<M, R> | ModelUsage<M, R>,
  state?: D
): InstanceOf<Instance<M>, R>;

declare interface EffectDeps<T extends ModelInstance> {
  onActions: (
    depsPicker: (instance: T) => ((...args: any[]) => any)[]
  ) => EffectDeps<T>;
  onChanges: (depsPicker: (instance: T) => any[]) => EffectDeps<T>;
}

declare interface Signal<
  M extends Model,
  R extends undefined | ((instance: () => Instance<M>) => any) = undefined
> {
  (opts?: { cutOff?: boolean }): InstanceOf<Instance<M>, R>;
  useEffect: (
    callback: (
      instance: Instance<M>,
      action: Action<PickState<M>, Instance<M>> | null
    ) => void | (() => void)
  ) => EffectDeps<Instance<M>>;
  useWatch: (
    callback: (
      instance: Instance<M>,
      action: Action<PickState<M>, Instance<M>> | null
    ) => void
  ) => EffectDeps<Instance<M>>;
  store: Store<M, R>;
}

export declare function useSignal<
  M extends Model,
  D extends PickState<M>,
  R extends undefined | ((instance: () => Instance<M>) => any) = undefined
>(modelLike: ModelUsage<M, R>, state?: D): Signal<M, R>;
export declare function useSignal<M extends Model, D extends PickState<M>>(
  modelLike: M,
  state?: D
): Signal<M>;
export declare function useSignal<
  M extends Model,
  D extends PickState<M>,
  R extends undefined | ((instance: () => Instance<M>) => any) = undefined
>(modelLike: ModelKey<M, R>, state?: D): Signal<M, R>;
export declare function useSignal<
  M extends Model,
  D extends PickState<M>,
  R extends undefined | ((instance: () => Instance<M>) => any) = undefined
>(modelLike: Store<M, R>, state?: D): Signal<M, R>;
export declare function useSignal<
  M extends Model,
  D extends PickState<M>,
  R extends undefined | ((instance: () => Instance<M>) => any) = undefined
>(
  modelLike: M | ModelKey<M, R> | Store<M, R> | ModelUsage<M, R>,
  state?: D
): Signal<M, R>;

export declare function useControlledModel<
  M extends Model,
  D extends PickState<M>,
  R extends undefined | ((instance: () => Instance<M>) => any) = undefined
>(
  modelLike: ModelUsage<M, R>,
  state: D,
  onChange: (s: PickState<M>) => any
): InstanceOf<Instance<M>, R>;
export declare function useControlledModel<
  M extends Model,
  D extends PickState<M>
>(modelLike: M, state: D, onChange: (s: PickState<M>) => any): Instance<M>;
export declare function useControlledModel<
  M extends Model,
  D extends PickState<M>,
  R extends undefined | ((instance: () => Instance<M>) => any) = undefined
>(
  modelLike: M | ModelUsage<M, R>,
  state: D,
  onChange: (s: PickState<M>) => any
): InstanceOf<Instance<M>, R>;

export declare const Provider: FC<{
  value:
    | Array<
        | StoreIndex<any, any>
        | ModelKey<any, any>
        | Record<string, StoreIndex<any, any>>
        | Record<string, ModelKey<any, any>>
      >
    | Record<string, StoreIndex<any, any>>
    | Record<string, ModelKey<any, any>>;
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
    | StoreIndex<Model, any>
    | ModelKey<Model, any>
    | Record<string, StoreIndex<Model, any>>
    | Record<string, ModelKey<Model, any>>
    | Record<number, StoreIndex<Model, any>>
    | Record<number, ModelKey<Model, any>>
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
  M extends Model,
  R extends undefined | ((instance: () => Instance<M>) => any) = undefined,
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
  modelLike: ModelKey<M, R>,
  selector: C,
  equalFn?: (c: ReturnType<C>, n: ReturnType<C>) => boolean
): ReturnType<C>;
export declare function useSelector<
  M extends Model,
  R extends undefined | ((instance: () => Instance<M>) => any) = undefined,
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
  modelLike: Store<M, R>,
  selector: C,
  equalFn?: (c: ReturnType<C>, n: ReturnType<C>) => boolean
): ReturnType<C>;
export declare function useSelector<
  M extends Model,
  R extends undefined | ((instance: () => Instance<M>) => any) = undefined,
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
  modelLike: ModelKey<M, R> | Store<M, R>,
  selector: C,
  equalFn?: (c: ReturnType<C>, n: ReturnType<C>) => boolean
): ReturnType<C>;

export declare function createKey<M extends Model, D extends PickState<M>>(
  modelFn: M,
  initialState?: D
): ModelKey<M>;

export declare function createStore<M extends Model, D extends PickState<M>>(
  modelFn: M,
  initialState?: D
): Store<M>;

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
  M extends Model = Model,
  R extends undefined | ((getInstance: () => Instance<M>) => any) = undefined
> extends ModelKey<M, R> {
  useModel: <D extends PickState<M>>(
    defaultState?: D
  ) => R extends undefined
    ? Instance<M>
    : ReturnType<R extends undefined ? never : R>;
  useSignal: <D extends PickState<M>>(defaultState?: D) => Signal<M, R>;
  useSelector: ApiSelector<PickState<M>, Instance<M>, R>;
}

declare interface StoreApi<
  M extends Model = Model,
  R extends undefined | ((getInstance: () => Instance<M>) => any) = undefined
> extends Store<M, R> {
  useModel: <D extends PickState<M>>(
    defaultState?: D
  ) => R extends undefined
    ? Instance<M>
    : ReturnType<R extends undefined ? never : R>;
  useSignal: <D extends PickState<M>>(defaultState?: D) => Signal<M, R>;
  useSelector: ApiSelector<PickState<M>, Instance<M>, R>;
  instance: <D extends S>(
    defaultState?: D
  ) => R extends undefined
    ? Instance<M>
    : ReturnType<R extends undefined ? never : R>;
}

declare interface ModelUsageApi<
  M extends Model = Model,
  R extends undefined | ((getInstance: () => Instance<M>) => any) = undefined
> extends ModelUsage<M, R> {
  createKey: <D extends PickState<M>>(state?: D) => ModelKeyApi<M, R>;
  createStore: <D extends S>(state?: D) => StoreApi<M, R>;
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
  useSignal: <D extends PickState<M>>(defaultState?: D) => Signal<M, R>;
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
    M extends Model,
    R extends undefined | ((ins: () => Instance<M>) => any) = undefined
  >(
    data: any
  ) => data is ModelKey<M, R>;
  isModelStore: <
    M extends Model,
    R extends undefined | ((ins: () => Instance<M>) => any) = undefined
  >(
    data: any
  ) => data is Store<M, R>;
  isModelUsage: <
    M extends Model,
    R extends undefined | ((ins: () => Instance<M>) => any) = undefined
  >(
    data: any
  ) => data is ModelUsage<M, R>;
};

export declare function useActProcess(): {
  act: (callback: () => any) => ReturnType<typeof callback>;
};
