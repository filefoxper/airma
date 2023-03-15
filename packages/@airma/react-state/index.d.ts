import { AirModelInstance, AirReducer } from '@airma/core';
import { FunctionComponent, FC, NamedExoticComponent, ReactNode } from 'react';

declare type PipeCallback<S> = <P extends AirReducer<S, any>>(
  reducer: P
) => P & { getSourceFrom: () => any };

export declare type Key<T extends AirReducer<any, any>> = T & {
  pipe: PipeCallback<T extends AirReducer<infer S, any> ? S : never>;
  effect?: [(...params: any[]) => any, Record<string, any>?];
};

export declare function useModel<S, T extends AirModelInstance>(
  model: AirReducer<S, T> & { getSourceFrom: () => any }
): T;
export declare function useModel<S, T extends AirModelInstance>(
  model: Key<AirReducer<S, T>>
): T;
export declare function useModel<S, T extends AirModelInstance>(
  model: AirReducer<S | undefined, T>
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

export declare type Keys =
  | Key<(s: any) => any>
  | Array<Key<(s: any) => any>>
  | Record<string, Keys>;

/**
 * @deprecated
 */
export declare const ModelProvider: FC<{
  value: Keys;
  children?: ReactNode;
}>;

/**
 * @deprecated
 */
export declare const StoreProvider: FC<{
  value: Keys;
  children?: ReactNode;
}>;

export declare const Provider: FC<{
  keys: Keys;
  children?: ReactNode;
}>;

export declare function withProvider<P extends Record<string, any>>(
  keys: Keys,
  component: FunctionComponent<P> | NamedExoticComponent<P>
): typeof component;

/**
 * @deprecated
 * @param models
 */
export declare function withModelProvider(
  models: Keys
): <P extends Record<string, any>>(
  component: FunctionComponent<P> | NamedExoticComponent<P>
) => typeof component;

/**
 * @deprecated
 * @param models
 */
export declare function withStoreProvider(
  models: Keys
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
): Key<AirReducer<S | undefined, T>>;
export declare function factory<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  defaultState: D
): Key<AirReducer<S, T>>;
export declare function factory<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>,
  defaultState?: D
): Key<AirReducer<S | undefined, T>>;

export declare function createKey<S, T extends AirModelInstance>(
  model: AirReducer<S | undefined, T>
): Key<typeof model>;
export declare function createKey<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  defaultState: D
): Key<typeof model>;
export declare function createKey<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>,
  defaultState?: D
): Key<typeof model>;

export declare function useRealtimeInstance<T>(instance: T): T;

export declare function useIsModelMatchedInStore(
  model: AirReducer<any, any> | Key<any>
): boolean;

export declare function shallowEqual<R>(prev: R, current: R): boolean;
