import { AirModelInstance, AirReducer } from '@airma/core';
import { FunctionComponent, FC, NamedExoticComponent, ReactNode } from 'react';

declare type PipeCallback<S> = <P extends AirReducer<S, any>>(
  reducer: P
) => P & { getSourceFrom: () => any };

export declare type ModelKey<T extends AirReducer<any, any>> = T & {
  pipe: PipeCallback<T extends AirReducer<infer S, any> ? S : never>;
  effect?: [(...params: any[]) => any, Record<string, any>?];
};

export declare function useModel<S, T extends AirModelInstance>(
  model: ModelKey<AirReducer<S, T>>
): T;
export declare function useModel<S, T extends AirModelInstance>(
  model: AirReducer<S | undefined, T>
): T;
export declare function useModel<S, T extends AirModelInstance>(
  model: AirReducer<S, T> & { getSourceFrom: () => any }
): T;
export declare function useModel<S, T extends AirModelInstance, D extends S>(
  model: ModelKey<AirReducer<S, T>>,
  state: D,
  option?: {
    refresh?: boolean;
    autoLink?: boolean;
    realtimeInstance?: boolean;
    useDefaultState?: boolean;
  }
): T;
export declare function useModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  state: D,
  option?: {
    refresh?: boolean;
    autoLink?: boolean;
    realtimeInstance?: boolean;
    useDefaultState?: boolean;
  }
): T;
export declare function useModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>,
  state?: D,
  option?: {
    refresh?: boolean;
    autoLink?: boolean;
    realtimeInstance?: boolean;
    useDefaultState?: boolean;
  }
): T;

export declare function useControlledModel<S, T extends AirModelInstance>(
  model: AirReducer<S, T>,
  state: S,
  onChange: (s: S) => any
): T;

export declare function useRefreshModel<
  S,
  T extends AirModelInstance,
  D extends S
>(
  model: ModelKey<AirReducer<S, T>>,
  state: D,
  option?: {
    autoLink?: boolean;
    realtimeInstance?: boolean;
  }
): T;
export declare function useRefreshModel<
  S,
  T extends AirModelInstance,
  D extends S
>(
  model: AirReducer<S, T>,
  state: D,
  option?: { autoLink?: boolean; realtimeInstance?: boolean }
): T;

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
  R extends AirReducer<any, any>,
  C extends (instance: ReturnType<R>) => any
>(
  factoryModel: R,
  selector: C,
  equalFn?: (c: ReturnType<C>, n: ReturnType<C>) => boolean
): ReturnType<C>;

/**
 * @deprecated
 * @param model
 */
export declare function factory<S, T extends AirModelInstance>(
  model: AirReducer<S | undefined, T>
): ModelKey<AirReducer<S | undefined, T>>;
/**
 * @deprecated
 * @param model
 * @param defaultState
 */
export declare function factory<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  defaultState: D
): ModelKey<AirReducer<S, T>>;
/**
 * @deprecated
 * @param model
 * @param defaultState
 */
export declare function factory<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>,
  defaultState?: D
): ModelKey<AirReducer<S | undefined, T>>;

declare type ExtractState<M extends AirReducer<any, any>> =
  M extends AirReducer<infer S, any> ? S : never;

export declare function createKey<
  M extends AirReducer<any, any>,
  D extends ExtractState<M>
>(model: M, defaultState?: D): ModelKey<M>;

/**
 * @deprecated
 * @param model
 */
export declare function createStoreKey<S, T extends AirModelInstance>(
  model: AirReducer<S | undefined, T>
): ModelKey<typeof model>;
/**
 * @deprecated
 * @param model
 * @param defaultState
 */
export declare function createStoreKey<
  S,
  T extends AirModelInstance,
  D extends S
>(model: AirReducer<S, T>, defaultState: D): ModelKey<typeof model>;
/**
 * @deprecated
 * @param model
 * @param defaultState
 */
export declare function createStoreKey<
  S,
  T extends AirModelInstance,
  D extends S
>(
  model: AirReducer<S | undefined, T>,
  defaultState?: D
): ModelKey<typeof model>;

export declare function useRealtimeInstance<T>(instance: T): T;

export declare function useIsModelMatchedInStore(
  model: AirReducer<any, any> | ModelKey<any>
): boolean;

export declare function shallowEqual<R>(prev: R, current: R): boolean;
