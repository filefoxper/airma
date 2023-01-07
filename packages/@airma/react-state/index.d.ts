import { AirModelInstance, AirReducer } from '@airma/core';
import { FC, ReactNode } from 'react';

export declare function useModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>
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
>(
  model: AirReducer<S, T>,
  state: D,
  option?: { autoLink?: boolean }
): T;

export declare function useRefresh<T extends (...args: any[]) => any>(
  method: T,
  params: Parameters<T>
): void;

declare type FactoryObject =
    | Array<any>
    | ((...args: any) => any)
    | Record<string, any>;

export declare const ModelProvider: FC<{
  value: FactoryObject;
  children: ReactNode;
}>;

export declare function useSelector<
  S,
  T extends AirModelInstance,
  C extends (instance: T) => any
>(
  factoryModel: AirReducer<S, T>,
  callback: C,
  equalFn?: (c: ReturnType<C>, n: ReturnType<C>) => boolean
): ReturnType<C>;

declare type PipeCallback = <P extends AirReducer<any, any>>(reducer: P) => P;

declare type FactoryInstance<T extends AirReducer<any, any>> = T & {
  pipe: PipeCallback;
};

export declare function factory<T extends AirReducer<any, any>>(
    reducer: T,
    defaultState?: (T extends AirReducer<infer S, any> ? S : never)
):FactoryInstance<T>;

export declare function shallowEqual<R>(prev: R, current: R): boolean;
