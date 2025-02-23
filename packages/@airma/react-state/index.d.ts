import {
  FunctionComponent,
  ReactNode,
  ComponentType,
  ExoticComponent
} from 'react';

declare interface InstanceLike {
  [key: string]: any;
  [key: number]: any;
}

export declare type ModelLike = (state: any) => any;

declare type ExpectInstance<S, T extends InstanceLike> = {
  [K in keyof T]: T[K] extends
    | ((...args: any[]) => S)
    | (((...args: any[]) => any) & { noActionMethod: Record<string, any> })
    ? T[K]
    : T[K] extends (...args: any[]) => any
    ? never
    : T[K];
};

declare type PickState<R extends ModelLike> = R extends (state: infer S) => any
  ? S
  : never;

declare type Instance<R extends ModelLike> = R extends (
  state: infer S
) => infer T
  ? ExpectInstance<S, T>
  : never;

declare type Action<R extends ModelLike> = {
  type: string;
  method: null | ((...args: any[]) => any);
  params?: any[];
  state?: PickState<R>;
  prevState?: PickState<R>;
  instance: Instance<R>;
  prevInstance: Instance<R>;
};

export declare type ModelKey<R extends ModelLike> = R & {
  payload?: unknown;
  isFactory: () => true;
  static: () => ModelKey<R>;
};

export declare interface ModelCreation<R extends ModelLike = any> {
  key: ModelKey<R>;
}

export declare function useModel<R extends ModelLike>(
  model: ModelKey<R>
): Instance<R>;
export declare function useModel<R extends ModelLike>(
  model: ModelCreation<R>
): Instance<R>;
export declare function useModel<R extends ModelLike>(
  model: R
): undefined extends PickState<R> ? Instance<R> : never;
export declare function useModel<R extends ModelLike, D extends PickState<R>>(
  model: ModelKey<R>,
  state: D
): Instance<R>;
export declare function useModel<R extends ModelLike, D extends PickState<R>>(
  model: ModelCreation<R>,
  state: D
): Instance<R>;
export declare function useModel<R extends ModelLike, D extends PickState<R>>(
  model: R,
  state: D
): Instance<R>;
export declare function useModel<R extends ModelLike, D extends PickState<R>>(
  model: R,
  state?: D
): undefined extends PickState<R> ? Instance<R> : never;

declare interface EffectDeps<R extends ModelLike> {
  onActions: (
    depsPicker: (instance: Instance<R>) => ((...args: any[]) => any)[]
  ) => EffectDeps<R>;
  onChanges: (depsPicker: (instance: Instance<R>) => any[]) => EffectDeps<R>;
}

declare interface Signal<R extends ModelLike> {
  (): Instance<R>;
  useEffect: (
    callback: (
      instance: Instance<R>,
      action: Action<R> | null
    ) => void | (() => void)
  ) => EffectDeps<R>;
  useWatch: (
    callback: (instance: Instance<R>, action: Action<R> | null) => void
  ) => EffectDeps<R>;
  getConnection: () => {
    isDestroyed: () => boolean;
    setPayload: <P>(setter: (payload: P) => P) => P;
    getPayload: <P>() => P;
  };
}

export declare function useSignal<R extends ModelLike>(
  model: ModelKey<R>
): Signal<R>;
export declare function useSignal<R extends ModelLike>(
  model: ModelCreation<R>
): Signal<R>;
export declare function useSignal<R extends ModelLike>(
  model: R
): undefined extends PickState<R> ? Signal<R> : never;
export declare function useSignal<R extends ModelLike, D extends PickState<R>>(
  model: ModelKey<R>,
  state: D
): Signal<R>;
export declare function useSignal<R extends ModelLike, D extends PickState<R>>(
  model: ModelCreation<R>,
  state: D
): Signal<R>;
export declare function useSignal<R extends ModelLike, D extends PickState<R>>(
  model: R,
  state: D
): Signal<R>;
export declare function useSignal<R extends ModelLike, D extends PickState<R>>(
  model: R,
  state?: D
): undefined extends PickState<R> ? Signal<R> : never;

export declare function useControlledModel<
  R extends ModelLike,
  D extends PickState<R>
>(model: R, state: D, onChange: (s: PickState<R>) => any): Instance<R>;

export declare type ModelKeys =
  | {
      [key: string]: ModelKey<any> | ModelCreation;
    }
  | {
      [key: number]: ModelKey<any> | ModelCreation;
    }
  | ModelKey<any>
  | ModelCreation;

export declare const Provider: FunctionComponent<
  | {
      value: ModelKeys;
      children?: ReactNode;
    }
  | {
      keys: ModelKeys;
      children?: ReactNode;
    }
>;

export declare type GlobalConfig = {
  batchUpdate?: (callback: () => void) => void;
};

export declare const ConfigProvider: FunctionComponent<{
  value: GlobalConfig;
  children?: ReactNode;
}>;

export declare function provide(
  keys: ModelKeys
): <P extends Record<string, any>>(
  component: ComponentType<P> | ExoticComponent<P>
) => typeof component;

export declare function useSelector<
  R extends ModelLike,
  C extends (instance: Instance<R>) => any
>(
  modelCreation: ModelKey<R> | ModelCreation<R>,
  selector: C,
  equalFn?: (c: ReturnType<C>, n: ReturnType<C>) => boolean
): ReturnType<C>;

export declare function createKey<R extends ModelLike, D extends PickState<R>>(
  model: R,
  defaultState?: D
): ModelKey<R>;

export declare function shallowEqual<R>(prev: R, current: R): boolean;

/** new API * */

declare type ValidModel<R extends ModelLike> = R extends (
  state: infer S
) => infer T
  ? T extends ExpectInstance<S, T>
    ? R
    : (state: S) => ExpectInstance<S, T> & T
  : never;

declare type ModelUsage<R extends ModelLike> = undefined extends PickState<R>
  ? (state?: PickState<R>) => Instance<R>
  : (state: PickState<R>) => Instance<R>;

declare type SignalUsage<R extends ModelLike> = undefined extends PickState<R>
  ? (state?: PickState<R>) => Signal<R>
  : (state: PickState<R>) => Signal<R>;

declare type ControlledModelUsage<R extends ModelLike> = (
  value: PickState<R>,
  onChange: (value: PickState<R>) => any
) => Instance<R>;

declare interface StoreUsageApi<R extends ModelLike> extends ModelCreation<R>{
  useModel: (state?: PickState<R>) => Instance<R>;
  useSignal: (state?: PickState<R>) => Signal<R>;
  useSelector: <C extends (instance: ReturnType<R>) => any>(
    call: C,
    equalFn?: (c: ReturnType<C>, n: ReturnType<C>) => boolean
  ) => ReturnType<C>;
  instance: (state?: PickState<R>) => Instance<R>;
}

declare interface StoreApi<R extends ModelLike> extends ModelCreation<R> {
  key: ModelKey<R>;
  with: <M extends ModelKey<ModelLike>>(
    ...key: ({ key: M } | M)[]
  ) => StoreApi<R>;
  instance: (state?: PickState<R>) => Instance<R>;
  /**
   * @deprecated
   */
  static: () => StoreUsageApi<R>;
  provide: <P>() => (
    component: ComponentType<P> | ExoticComponent<P>
  ) => typeof component;
  provideTo: <P>(
    component: ComponentType<P> | ExoticComponent<P>
  ) => typeof component;
  Provider: FunctionComponent<{ children?: ReactNode }>;
  useModel: (state?: PickState<R>) => Instance<R>;
  useSignal: (state?: PickState<R>) => Signal<R>;
  useSelector: <C extends (instance: ReturnType<R>) => any>(
    call: C,
    equalFn?: (c: ReturnType<C>, n: ReturnType<C>) => boolean
  ) => ReturnType<C>;
}

declare interface KeyApi<R extends ModelLike> extends ModelCreation<R> {
  key: ModelKey<R>;
  useModel: (state?: PickState<R>) => Instance<R>;
  useSignal: (state?: PickState<R>) => Signal<R>;
  useSelector: <C extends (instance: ReturnType<R>) => any>(
    call: C,
    equalFn?: (c: ReturnType<C>, n: ReturnType<C>) => boolean
  ) => ReturnType<C>;
}

declare interface Api<R extends ModelLike> {
  useModel: ModelUsage<R>;
  useSignal: SignalUsage<R>;
  useControlledModel: ControlledModelUsage<R>;
  createStore: (state?: PickState<R>) => StoreApi<R>;
  createKey: (state?: PickState<R>) => KeyApi<R>;
}

export declare function storeCreation(
  ...modelCreations: (ModelKey<any> | ModelCreation)[]
): {
  for: <P extends Record<string, any>>(
    component: ComponentType<P> | ExoticComponent<P>
  ) => typeof component;
};

export declare const model: {
  <R extends ModelLike>(m: ValidModel<R>): R & Api<R>;
  create: <M extends ModelLike>(m: ValidModel<M>) => M & Api<M>;
  /**
   * @deprecated
   */
  createCacheField: <T extends () => any>(
    callback: T,
    deps?: unknown[]
  ) => {
    get: () => ReturnType<T>;
  };
  createField: <T extends () => any>(
    callback: T,
    deps?: unknown[]
  ) => {
    get: () => ReturnType<T>;
  };
  createMethod<R extends (...args: any[]) => any>(
    callback: R
  ): R & { noActionMethod: Record<string, any> };
};
