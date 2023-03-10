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
  model: AirReducer<S, T> & { getSourceFrom: () => any }
): T;
export declare function useModel<S, T extends AirModelInstance>(
  model: ModelKey<AirReducer<S, T>>
): T;
export declare function useModel<S, T extends AirModelInstance>(
  model: AirReducer<S | undefined, T>
): T;
export declare function useModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  state: D,
  option?: { refresh?: boolean; autoLink?: boolean }
): T;
export declare function useModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>,
  state?: D,
  option?: { refresh?: boolean; autoLink?: boolean }
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
>(model: AirReducer<S, T>, state: D, option?: { autoLink?: boolean }): T;

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
  | ModelKey<(s: any) => any>
  | Array<ModelKey<(s: any) => any>>
  | Record<string, ModelKeys>;

export declare const ModelProvider: FC<{
  value: ModelKeys;
  children?: ReactNode;
}>;

export declare function withModelProvider(
  models: ModelKeys
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
): ModelKey<AirReducer<S | undefined, T>>;
export declare function factory<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  defaultState: D
): ModelKey<AirReducer<S, T>>;
export declare function factory<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>,
  defaultState?: D
): ModelKey<AirReducer<S | undefined, T>>;

export declare function createModelKey<S, T extends AirModelInstance>(
  model: AirReducer<S | undefined, T>
): ModelKey<typeof model>;
export declare function createModelKey<
  S,
  T extends AirModelInstance,
  D extends S
>(model: AirReducer<S, T>, defaultState: D): ModelKey<typeof model>;
export declare function createModelKey<
  S,
  T extends AirModelInstance,
  D extends S
>(
  model: AirReducer<S | undefined, T>,
  defaultState?: D
): ModelKey<typeof model>;

export declare function useIsValidModel(
  model: AirReducer<any, any> | ModelKey<any>
): boolean;

export declare function shallowEqual<R>(prev: R, current: R): boolean;
