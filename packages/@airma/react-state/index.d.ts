import { AirModelInstance, AirReducer } from '@airma/core';
import { FC, ReactNode } from 'react';

declare type PipeCallback<S> = <P extends AirReducer<S, any>>(
  reducer: P
) => P & { getSourceFrom: () => any };

declare type FactoryModel<T extends AirReducer<any, any>> = T & {
  pipe: PipeCallback<T extends AirReducer<infer S, any> ? S : never>;
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
  params: Parameters<T>
): void;

declare type FactoryCollection =
  | FactoryModel<(s: any) => any>
  | Array<FactoryModel<(s: any) => any>>
  | Record<string, FactoryModel<(s: any) => any>>;

export declare const ModelProvider: FC<{
  value: FactoryCollection;
  children: ReactNode;
}>;

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
): FactoryModel<typeof model>;
export declare function factory<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  defaultState: D
): FactoryModel<typeof model>;
export declare function factory<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>,
  defaultState?: D
): FactoryModel<typeof model>;

export declare function shallowEqual<R>(prev: R, current: R): boolean;
