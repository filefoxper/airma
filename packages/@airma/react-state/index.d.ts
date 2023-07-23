import { FunctionComponent, FC, NamedExoticComponent, ReactNode } from 'react';

declare interface AirModelInstance {
  [key: string]: any;
  [key: number]: any;
}

declare type AirReducer = (state: any) => any;

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

declare type ValidReducerReturnType<R extends (state: any) => any> = R extends (
  state: infer S
) => infer T
  ? ValidInstance<S, T>
  : never;

declare type StateExtendsUndefinedReducer<R extends (state: any) => any> =
  R extends (state: infer S) => any ? (undefined extends S ? R : never) : never;

declare type ValidReducer<R extends (state: any) => any> = R extends (
  state: infer S
) => infer T
  ? T extends ValidInstanceRecord<S, T>
    ? R
    : never
  : never;

declare type PipeCallback<S> = <R extends (state: S) => any>(
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
      [key: string]: ModelKey<(s: any) => any> | ModelKeys;
    }
  | {
      [key: number]: ModelKey<(s: any) => any> | ModelKeys;
    }
  | ModelKey<(s: any) => any>;

/**
 * @deprecated
 */
export declare const ModelProvider: FC<{
  value: ModelKeys;
  children?: ReactNode;
}>;

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
 * @param models
 */
export declare function withModelProvider(
  models: ModelKeys
): <P extends Record<string, any>>(
  component: FunctionComponent<P> | NamedExoticComponent<P>
) => typeof component;

/**
 * @deprecated
 * @param keys
 */
export declare function withStoreProvider(
  keys: ModelKeys
): <P extends Record<string, any>>(
  component: FunctionComponent<P> | NamedExoticComponent<P>
) => typeof component;

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

/**
 * @deprecated
 * @param model
 */
export declare function factory<R extends AirReducer>(model: R): ModelKey<R>;
/**
 * @deprecated
 * @param model
 * @param defaultState
 */
export declare function factory<R extends AirReducer, D extends PickState<R>>(
  model: R,
  defaultState: D
): ModelKey<R>;
/**
 * @deprecated
 * @param model
 * @param defaultState
 */
export declare function factory<R extends AirReducer, D extends PickState<R>>(
  model: R,
  defaultState?: D
): ModelKey<R>;

export declare function createKey<R extends AirReducer>(
  model: StateExtendsUndefinedReducer<R>
): ModelKey<R>;
export declare function createKey<R extends AirReducer, D extends PickState<R>>(
  model: R,
  defaultState: D
): ModelKey<R>;

/**
 * @deprecated
 * @param model
 * @param defaultState
 */
export declare function createStoreKey<
  R extends AirReducer,
  D extends PickState<R>
>(model: R, defaultState?: D): ModelKey<R>;

export declare function useRealtimeInstance<T>(instance: T): T;

export declare function useIsModelMatchedInStore(
  model: AirReducer | ModelKey<AirReducer>
): boolean;

export declare function shallowEqual<R>(prev: R, current: R): boolean;
