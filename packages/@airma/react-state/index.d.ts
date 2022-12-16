import { AirModelInstance, AirReducer } from '@airma/core';
import { FC, ReactNode } from 'react';

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

export declare function useTupleModel<S, T extends AirModelInstance, D extends S>(
    model: AirReducer<S | undefined, T>
): [S|undefined,T];
export declare function useTupleModel<S, T extends AirModelInstance, D extends S>(
    model: AirReducer<S, T>,
    state: D,
    option?: { refresh?: boolean; required?: boolean }
): [S,T];
export declare function useTupleModel<S, T extends AirModelInstance, D extends S>(
    model: AirReducer<S | undefined, T>,
    state?: D,
    option?: { refresh?: boolean; required?: boolean }
): [S|undefined,T]

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

declare type StateSetMode<S> = (persist?:{state:S,isDefault:boolean})=>S;

declare type FactoryInstance<T extends AirReducer<any, any>> = T & {
  pipe<P extends AirReducer<any, any>>(
      reducer: P
  ): P & { getSourceFrom: () => FactoryInstance<T> };
};

declare type FactoryCall = (<T extends AirReducer<any, any>>(
    reducer: T,
    defaultState?:
        | (T extends AirReducer<infer S, any> ? S : never)
        | StateSetMode<T extends AirReducer<infer S, any> ? S : never>
) => FactoryInstance<T>) & {
  mutate<
      M extends Record<string, any> | Array<any> | ((...args: any[]) => any)
  >(
      target: M,
      callback: (f: M) => any
  ): ReturnType<typeof callback>;
};

export declare const State:{
  default<S>(state:S):StateSetMode<S>,
  extend<S>(state:S):StateSetMode<S>,
  force<S>(state:S):StateSetMode<S>
}

export declare const factory: FactoryCall;

declare type FactoryObject = Array<any> | ((...args: any) => any) | Record<string, any>;

export declare function useFactory<
    T extends FactoryObject
>(factory: T, mapCallback?: (f: T) => FactoryObject): [T, (m: (f: T) => FactoryObject) => any];
