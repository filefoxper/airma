import {
  FunctionComponent,
  ReactNode,
  ComponentType,
  ExoticComponent
} from 'react';
import {
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

export declare type StoreIndex<
  S = any,
  T extends ModelInstance = any,
  R extends (instance: () => T) => any = (instance: () => T) => T
> = AsStoreIndex<S, T, R>;

export declare type ModelLike = (state: any) => any;

export declare function useModel<S, T extends ModelInstance, D extends S>(
  modelLike: Model<S, T> | ModelKey<S, T> | Store<S, T>,
  state?: D
): T;

declare interface EffectDeps<T extends ModelInstance> {
  onActions: (
    depsPicker: (instance: T) => ((...args: any[]) => any)[]
  ) => EffectDeps<T>;
  onChanges: (depsPicker: (instance: T) => any[]) => EffectDeps<T>;
}

declare interface Signal<S, T extends ModelInstance> {
  (): T;
  useEffect: (
    callback: (instance: T, action: Action<S, T> | null) => void | (() => void)
  ) => EffectDeps<T>;
  useWatch: (
    callback: (instance: T, action: Action<S, T> | null) => void
  ) => EffectDeps<T>;
  store: Store<S, T>;
}

export declare function useSignal<S, T extends ModelInstance, D extends S>(
  modelLike: Model<S, T> | ModelKey<S, T> | Store<S, T>,
  state?: D
): Signal<S, T>;

export declare function useControlledModel<
  S,
  T extends ModelInstance,
  D extends S
>(modelLike: Model<S, T>, state: D, onChange: (s: S) => any): T;

export declare const Provider: FunctionComponent<{
  value?: Array<StoreIndex | ModelKey>;
  children?: ReactNode;
}>;

export declare type GlobalConfig = {
  batchUpdate?: (callback: () => void) => void;
};

export declare const ConfigProvider: FunctionComponent<{
  value: GlobalConfig;
  children?: ReactNode;
}>;

export declare function provide(...value: (StoreIndex | ModelKey)[]): {
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
  R extends (getInstance: () => T) => any = (getInstance: () => T) => T
>(
  modelLike: ModelKey<S, T, R> | Store<S, T, R> | ModelUsage<S, T, R>
): ReturnType<R>;
export declare function useSelector<
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
export declare function useSelector<
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
export declare function useSelector<
  S,
  T extends ModelInstance,
  R extends (getInstance: () => T) => any = (getInstance: () => T) => T,
  C extends (instance: T) => any = (instance: T) => T
>(
  modelLike: ModelKey<S, T, R> | Store<S, T, R> | ModelUsage<S, T, R>,
  selector: C,
  equalFn?: (c: ReturnType<C>, n: ReturnType<C>) => boolean
): ReturnType<C>;
export declare function useSelector<
  S,
  T extends ModelInstance,
  R extends (getInstance: () => T) => any = (getInstance: () => T) => T
>(
  modelLike: ModelKey<S, T, R> | Store<S, T, R> | ModelUsage<S, T, R>,
  selector: undefined,
  equalFn?: (c: ReturnType<R>, n: ReturnType<R>) => boolean
): ReturnType<R>;
export declare function useSelector<
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
export declare function useSelector<
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
): any;

export declare function createKey<S, T extends ModelInstance>(
  modelFn: Model<S, T>,
  defaultState?: S
): ModelKey<S, T>;

export declare function shallowEqual(prev: unknown, current: unknown): boolean;

/** new API * */
declare interface ApiSelector<
  S,
  T extends ModelInstance,
  R extends (getInstance: () => T) => any = (getInstance: () => T) => T
> {
  (): ReturnType<R>;
  <KD extends S = S>(callback: {
    state?: KD;
    equality?: (a: ReturnType<R>, b: ReturnType<R>) => boolean;
  }): ReturnType<R>;
  <
    C extends (instance: T) => any = (instance: T) => T,
    KD extends S = S
  >(callback: {
    state?: KD;
    selector: C;
    equality?: (a: ReturnType<C>, b: ReturnType<C>) => boolean;
  }): ReturnType<C>;
  (
    callback: undefined,
    equality?: (a: ReturnType<R>, b: ReturnType<R>) => boolean
  ): ReturnType<R>;
  <C extends (instance: T) => any = (instance: T) => T>(
    callback: C,
    equality?: (a: ReturnType<C>, b: ReturnType<C>) => boolean
  ): ReturnType<C>;
  <C extends (instance: T) => any = (instance: T) => T, KD extends S = S>(
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
  <C extends (instance: T) => any = (instance: T) => T, KD extends S = S>(
    callback?:
      | undefined
      | C
      | {
          state?: KD;
          selector?: C;
          equality?: (a: any, b: any) => boolean;
        },
    equality?: (a: any, b: any) => boolean
  ): any;
}

declare interface ModelKeyApi<
  S,
  T extends ModelInstance,
  R extends (getInstance: () => T) => any = (getInstance: () => T) => T
> extends ModelKey<S, T, R> {
  useModel: <D extends S>(defaultState?: D) => T;
  useSignal: <D extends S>(defaultState?: D) => Signal<T>;
  useSelector: ApiSelector<S, T, R>;
}

declare interface StoreApi<
  S,
  T extends ModelInstance,
  R extends (getInstance: () => T) => any = (getInstance: () => T) => T
> extends Store<S, T, R> {
  useModel: <D extends S>(defaultState?: D) => T;
  useSignal: <D extends S>(defaultState?: D) => Signal<T>;
  useSelector: ApiSelector<S, T, R>;
  instance: () => T;
}

declare interface ModelUsageApi<
  S,
  T extends ModelInstance,
  R extends (getInstance: () => T) => any = (getInstance: () => T) => T
> extends ModelUsage<S, T, R> {
  (s: S): ValidInstance<S, T>;
  createKey: <D extends S>(state?: D) => ModelKeyApi<S, T, R>;
  createStore: <D extends S>(state?: D) => StoreApi<S, T, R>;
  select: <C extends (instance: () => T) => any = (instance: () => T) => T>(
    s: C
  ) => ModelUsageApi<S, T, C>;
  useControlledModel: <D extends S>(state: D, onChange: (s: S) => any) => T;
  useModel: <D extends S>(defaultState?: D) => T;
  useSignal: <D extends S>(defaultState?: D) => Signal<T>;
  useSelector: ApiSelector<S, T, R>;
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
