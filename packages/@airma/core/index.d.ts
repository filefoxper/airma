export declare type Action = {
  type: string;
  state?: any;
  prevState?: any;
  params?: any[];
};

export declare type Dispatch = (action: Action) => any;

export declare type AirModel<S> = {
  state: S;
  [key: string]: any;
};

export declare interface AirModelInstance {
  [key: string]: any;
  [key: number]: any;
}

declare type ValidInstance<S, T extends AirModelInstance> = {
  [K in keyof T]: T[K] extends (...args: any[]) => S
    ? T[K]
    : T[K] extends (...args: any[]) => any
    ? never
    : T[K];
};

export declare type AirReducer<S, T extends AirModelInstance> = (
  state: S
) => ValidInstance<S, T>;

export declare interface Connection<
  S = any,
  T extends AirModelInstance = AirModelInstance
> {
  agent: T;

  getCacheState(): S;
  update: (reducer: AirReducer<S, T>, outState?: { state: S }) => void;
  connect: (dispatch?: Dispatch) => void;
  disconnect: (dispatch?: Dispatch) => void;
}

export declare function createModel<S, T extends AirModelInstance, D extends S>(
  reducer: AirReducer<S, T>,
  defaultState: D
): Connection<S, T>;

declare type HoldCallback = <
  S = any,
  T extends AirModelInstance = any,
  D extends S = any
>(
  reducer: AirReducer<S, T>,
  defaultState?: D
) => typeof reducer;

export declare function createRequiredModels<
  T extends Array<any> | ((...args: any) => any) | Record<string, any>
>(
  requireFn: (hold: HoldCallback) => T
): T;

export declare function activeRequiredModels<
  T extends Array<any> | ((...args: any) => any) | Record<string, any>
>(
  models: T
): {
  get(reducer: AirReducer<any, any>): Connection | undefined;
  destroy(): void;
};

export declare function useSimpleProxy<T extends Record<string, unknown>>(
  target: T,
  handler: ProxyHandler<T>
): T;

export declare function createProxy<T extends Record<string, any>>(
  target: T,
  handler: ProxyHandler<T>
): T;

export declare function isFunctionModel<S, T extends AirModel<S>>(
  model: T | { new (): T } | ((state: S) => T)
): model is (state: S) => T;

export declare function shallowEqual<R>(prev: R, current: R): boolean;
