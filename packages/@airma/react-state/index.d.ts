import { AirModelInstance, AirReducer, FactoryHolder } from '@airma/core';
import { FC, ReactNode } from 'react';

export declare type Option = {
  refresh?: boolean;
};

export declare function useModel<S, T extends AirModelInstance, D extends S>(
    model: AirReducer<S | undefined, T>
): T;
export declare function useModel<S, T extends AirModelInstance, D extends S>(
    model: AirReducer<S, T>,
    state: D,
    option?: { refresh?:boolean,required?:boolean }
): T;
export declare function useModel<S, T extends AirModelInstance, D extends S>(
    model: AirReducer<S | undefined, T>,
    state?: D,
    option?: { refresh?:boolean,required?:boolean }
): T;

export declare function useTupleModel<
  S,
  T extends AirModelInstance,
  D extends S
>(model: AirReducer<S, T>, state: D, option?: ((s: S) => any) | Option): [S, T];

export declare function useControlledModel<S, T extends AirModelInstance, D extends S>(
    model: AirReducer<S, T>,
    state: D,
    onChange: (s: S) => any
): T;

export declare function useRefreshModel<S, T extends AirModelInstance, D extends S>(
    model: AirReducer<S, T>,
    state: D,
    option?:{required?:boolean}
): T;

export declare function useRefresh<T extends (...args: any[]) => any>(
  method: T,
  params: Parameters<T>
): void;

export declare const RequiredModelProvider: FC<{
  value: Array<any> | ((...args: any) => any) | Record<string, any>;
  children: ReactNode;
}>;

export declare function useRequiredModel<S, T extends AirModelInstance, D extends S>(
    model: AirReducer<S | undefined, T>,
    state?: D,
    option?:{refresh?:boolean}
): T;

export declare function requireModels<
  T extends Array<any> | ((...args: any) => any) | Record<string, any>
>(requireFn: (factory: FactoryHolder) => T): T;

declare type FactoryCall = (<T extends AirReducer<any, any>>(
    reducer: T,
    defaultState?: T extends AirReducer<infer S, any> ? S : never
) => T) & {
  mutate<
      M extends Record<string, any> | Array<any> | ((...args: any[]) => any)
  >(
      target: M,
      callback: (f: M) => any
  ): ReturnType<typeof callback>;
};

export declare const factory: FactoryCall;

export declare function useFactory<
    T extends Array<any> | ((...args: any) => any) | Record<string, any>
>(factory: T, mapCallback?: (f: T) => any): [T, (m: (f: T) => T) => any];
