import { FunctionComponent, FC, NamedExoticComponent, ReactNode } from 'react';

declare interface AirModelInstance {
  [key: string]: any;
  [key: number]: any;
}

export declare type ModelContext = {
  memo: <M extends () => any>(call: M, deps: unknown[]) => ReturnType<M>;
  ref: <C>(current: C) => { current: C };
};

export declare type AirReducer = (state: any) => any;

declare type ValidInstanceRecord<S, T extends AirModelInstance> = {
  [K in keyof T]: T[K] extends (...args: any[]) => S
    ? T[K]
    : T[K] extends (...args: any[]) => any
    ? never
    : T[K];
};

declare type ValidInstance<S, T extends AirModelInstance> = ValidInstanceRecord<
  S,
  T
>;

declare type PickState<R extends AirReducer> = R extends (state: infer S) => any
  ? S
  : never;

declare type ValidReducerReturnType<R extends AirReducer> = R extends (
  state: infer S
) => infer T
  ? ValidInstance<S, T>
  : never;

declare type StateExtendsUndefinedReducer<R extends AirReducer> = R extends (
  state: infer S
) => any
  ? undefined extends S
    ? R
    : never
  : never;

declare type ValidReducer<R extends AirReducer> = R extends (
  state: infer S
) => infer T
  ? T extends ValidInstanceRecord<S, T>
    ? R
    : never
  : never;

declare type PipeCallback<S> = <R extends AirReducer>(
  reducer: R
) => ValidReducer<R> & { getSourceFrom: () => any };

export declare type ModelKey<R extends AirReducer> = ValidReducer<R> & {
  pipe: PipeCallback<PickState<R>>;
  effect?: [(...params: any[]) => any, Record<string, any>?];
};

export declare function useModel<R extends AirReducer>(
  model: ModelKey<R>
): ValidReducerReturnType<R>;
export declare function useModel<R extends AirReducer>(
  model: R
): undefined extends PickState<R> ? ValidReducerReturnType<R> : never;
export declare function useModel<R extends AirReducer>(
  model: R & { getSourceFrom: () => any }
): ValidReducerReturnType<R>;
export declare function useModel<R extends AirReducer, D extends PickState<R>>(
  model: ModelKey<R>,
  state: D,
  option?: {
    refresh?: boolean;
    autoLink?: boolean;
    realtimeInstance?: boolean;
    useDefaultState?: boolean;
  }
): ValidReducerReturnType<R>;
export declare function useModel<R extends AirReducer, D extends PickState<R>>(
  model: R,
  state: D,
  option?: {
    refresh?: boolean;
    autoLink?: boolean;
    realtimeInstance?: boolean;
    useDefaultState?: boolean;
  }
): ValidReducerReturnType<R>;
export declare function useModel<R extends AirReducer, D extends PickState<R>>(
  model: R,
  state?: D,
  option?: {
    refresh?: boolean;
    autoLink?: boolean;
    realtimeInstance?: boolean;
    useDefaultState?: boolean;
  }
): undefined extends PickState<R> ? ValidReducerReturnType<R> : never;

export declare function useControlledModel<
  R extends AirReducer,
  D extends PickState<R>
>(
  model: R,
  state: D,
  onChange: (s: PickState<R>) => any
): ValidReducerReturnType<R>;

export declare function useRefreshModel<
  R extends AirReducer,
  D extends PickState<R>
>(
  model: ModelKey<R>,
  state: D,
  option?: {
    autoLink?: boolean;
    realtimeInstance?: boolean;
  }
): ValidReducerReturnType<R>;
export declare function useRefreshModel<
  R extends AirReducer,
  D extends PickState<R>
>(
  model: R,
  state: D,
  option?: { autoLink?: boolean; realtimeInstance?: boolean }
): ValidReducerReturnType<R>;

/**
 * @deprecated
 * @param method
 * @param params
 */
export declare function useRefresh<T extends (...args: any[]) => any>(
  method: T,
  params:
    | Parameters<T>
    | {
        refreshDeps?: any[];
        variables: Parameters<T>;
      }
): void;

export declare type ModelKeys =
  | {
      [key: string]: ModelKey<AirReducer> | ModelKeys | StoreApi<AirReducer>;
    }
  | {
      [key: number]: ModelKey<AirReducer> | ModelKeys | StoreApi<AirReducer>;
    }
  | ModelKey<AirReducer>
  | StoreApi<AirReducer>;

/**
 * @deprecated
 */
export declare const StoreProvider: FC<
  | {
      value: ModelKeys;
      children?: ReactNode;
    }
  | {
      keys: ModelKeys;
      children?: ReactNode;
    }
>;

/**
 * @deprecated
 */
export declare const ModelProvider: FC<
  | {
      value: ModelKeys;
      children?: ReactNode;
    }
  | {
      keys: ModelKeys;
      children?: ReactNode;
    }
>;

export declare const Provider: FC<
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

export declare const ConfigProvider: FC<{
  value: GlobalConfig;
  children?: ReactNode;
}>;

export declare function provide(
  keys: ModelKeys
): <P extends Record<string, any>>(
  component: FunctionComponent<P> | NamedExoticComponent<P>
) => typeof component;

export declare function useSelector<
  R extends AirReducer,
  C extends (instance: ValidReducerReturnType<R>) => any
>(
  factoryModel: R,
  selector: C,
  equalFn?: (c: ReturnType<C>, n: ReturnType<C>) => boolean
): ReturnType<C>;

export declare function createKey<R extends AirReducer, D extends PickState<R>>(
  model: R,
  defaultState?: D
): ModelKey<R>;

export declare function useRealtimeInstance<T>(instance: T): T;

export declare function useIsModelMatchedInStore(
  model: AirReducer | ModelKey<AirReducer>
): boolean;

export declare function shallowEqual<R>(prev: R, current: R): boolean;

/** new API * */

declare type ValidModel<R extends AirReducer> = R extends (
  state: infer S
) => infer T
  ? T extends ValidInstance<S, T>
    ? R
    : (state: S) => ValidInstance<S, T> & T
  : never;

declare type ModelUsage<R extends AirReducer> = undefined extends PickState<R>
  ? (state?: PickState<R>) => ValidReducerReturnType<R>
  : (state: PickState<R>) => ValidReducerReturnType<R>;

declare type ControlledModelUsage<R extends AirReducer> = (
  value: PickState<R>,
  onChange: (value: PickState<R>) => any
) => ValidReducerReturnType<R>;

declare interface StoreUsageApi<R extends AirReducer> {
  useModel: (state?: PickState<R>) => ValidReducerReturnType<R>;
  useSelector: <C extends (instance: ReturnType<R>) => any>(
    call: C,
    equalFn?: (c: ReturnType<C>, n: ReturnType<C>) => boolean
  ) => ReturnType<C>;
}

declare interface StoreApi<R extends AirReducer> extends StoreUsageApi<R> {
  key: ModelKey<R>;
  with: <M extends ModelKey<AirReducer>>(
    ...key: ({ key: M } | M)[]
  ) => StoreApi<R>;
  provide: () => (
    component: FunctionComponent<P> | NamedExoticComponent<P>
  ) => typeof component;
  provideTo: (
    component: FunctionComponent<P> | NamedExoticComponent<P>
  ) => typeof component;
  Provider: FC<{ children?: ReactNode }>;
}

declare interface Api<R extends AirReducer> {
  useModel: ModelUsage<R>;
  useControlledModel: ControlledModelUsage<R>;
  store: (state?: PickState<R>) => StoreApi<R>;
  createStore: (state?: PickState<R>) => StoreApi<R>;
}

export declare const model: {
  <R extends AirReducer>(m: ValidModel<R>): R & Api<R>;
  context: () => ModelContext;
  create: <M extends AirReducer>(m: ValidModel<M>) => M & Api<M>;
};
