import { AirModelInstance, AirReducer } from '@airma/core';
import { FunctionComponent, FC, NamedExoticComponent, ReactNode } from 'react';

declare type PipeCallback<S> = <P extends AirReducer<S, any>>(
  reducer: P
) => P & { getSourceFrom: () => any };

export declare type StoreKey<T extends AirReducer<any, any>> = T & {
  pipe: PipeCallback<T extends AirReducer<infer S, any> ? S : never>;
  effect?: [(...params: any[]) => any, Record<string, any>?];
};

export declare function useModel<S, T extends AirModelInstance>(
  model: AirReducer<S, T> & { getSourceFrom: () => any }
): T;
export declare function useModel<S, T extends AirModelInstance>(
  model: StoreKey<AirReducer<S, T>>
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

export declare type StoreKeys =
  | StoreKey<(s: any) => any>
  | Array<StoreKey<(s: any) => any>>
  | Record<string, StoreKeys>;

export declare const ModelProvider: FC<{
  value: StoreKeys;
  children?: ReactNode;
}>;

export declare function withModelProvider(
  models: StoreKeys
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

export declare function factory<S, T extends AirModelInstance>(
  model: AirReducer<S | undefined, T>
): StoreKey<AirReducer<S | undefined, T>>;
export declare function factory<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  defaultState: D
): StoreKey<AirReducer<S, T>>;
export declare function factory<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>,
  defaultState?: D
): StoreKey<AirReducer<S | undefined, T>>;

export declare function createStoreKey<S, T extends AirModelInstance>(
  model: AirReducer<S | undefined, T>
): StoreKey<typeof model>;
export declare function createStoreKey<
  S,
  T extends AirModelInstance,
  D extends S
>(model: AirReducer<S, T>, defaultState: D): StoreKey<typeof model>;
export declare function createStoreKey<
  S,
  T extends AirModelInstance,
  D extends S
>(
  model: AirReducer<S | undefined, T>,
  defaultState?: D
): StoreKey<typeof model>;

export declare function useRealtimeInstance<T>(instance: T): T;

export declare function useIsModelMatchedInStore(
  model: AirReducer<any, any> | StoreKey<any>
): boolean;

export declare function shallowEqual<R>(prev: R, current: R): boolean;
