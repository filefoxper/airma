import { AirModelInstance, AirReducer } from '@airma/core';
import { ComponentType, FC, NamedExoticComponent, ReactNode } from 'react';

declare type PipeCallback<S> = <P extends AirReducer<S, any>>(
  reducer: P
) => P & { getSourceFrom: () => any };

export declare type FactoryModel<T extends AirReducer<any, any>> = T & {
  pipe: PipeCallback<T extends AirReducer<infer S, any> ? S : never>;
  effect?: [(...params: any[]) => any, Record<string, any>?];
};

export declare function useModel<S, T extends AirModelInstance>(
  model: AirReducer<S, T> & { getSourceFrom: () => any }
): T;
export declare function useModel<S, T extends AirModelInstance>(
  model: FactoryModel<AirReducer<S, T>>
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

export declare function useControlledModel<
  S,
  T extends AirModelInstance,
  D extends S
>(model: AirReducer<S, T>, state: D, onChange: (s: S) => any): T;

export declare function useRefreshModel<
  S,
  T extends AirModelInstance,
  D extends S
>(model: AirReducer<S, T>, state: D, option?: { autoLink?: boolean }): T;

export declare function useRefresh<T extends (...args: any[]) => any>(
  method: T,
  params: Parameters<T>,
  options?: { refreshDeps?: any[] }
): void;

export declare type FactoryCollection =
  | FactoryModel<(s: any) => any>
  | Array<FactoryModel<(s: any) => any>>
  | Record<string, FactoryModel<(s: any) => any>>;

export declare const ModelProvider: FC<{
  value: FactoryCollection;
  children?: ReactNode;
}>;

export declare function withModelProvider(
  models: FactoryCollection
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
): FactoryModel<AirReducer<S | undefined, T>>;
export declare function factory<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  defaultState: D
): FactoryModel<AirReducer<S, T>>;
export declare function factory<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>,
  defaultState?: D
): FactoryModel<AirReducer<S | undefined, T>>;

export declare function keyModel<S, T extends AirModelInstance>(
  model: AirReducer<S | undefined, T>
): FactoryModel<typeof model>;
export declare function keyModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  defaultState: D
): FactoryModel<typeof model>;
export declare function keyModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>,
  defaultState?: D
): FactoryModel<typeof model>;

export declare function shallowEqual<R>(prev: R, current: R): boolean;
