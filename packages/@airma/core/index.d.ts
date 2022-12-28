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
  getCacheState(): { state: S } | null;
  getState(): S;
  update: (
    reducer: AirReducer<S, T>,
    outState?: { state: S; cache?: boolean,isDefault?:boolean,ignoreDispatch?:boolean }
  ) => void;
  updateState:(state:S)=>void;
  connect: (dispatch?: Dispatch) => void;
  disconnect: (dispatch?: Dispatch) => void;
}

export declare function createModel<S, T extends AirModelInstance, D extends S>(
  reducer: AirReducer<S, T>,
  defaultState: D,
  controlled?:boolean
): Connection<S, T>;

export declare type ModelFactoryStore<T> = {
  update(updateFactory: T): ModelFactoryStore<T>;
  get(reducer: AirReducer<any, any>): Connection | undefined;
  equal(factory: T): boolean;
  destroy(): void;
};

declare type FactoryInstance<T extends AirReducer<any, any>> = T & {
  pipe<P extends AirReducer<any, any>>(
    reducer: P
  ): P & { getSourceFrom: () => FactoryInstance<T> };
};

export declare function factory<T extends AirReducer<any, any>>(
    reducer: T,
    defaultState?: (T extends AirReducer<infer S, any> ? S : never)
):FactoryInstance<T>;

export declare function createStore<
  T extends Array<any> | ((...args: any) => any) | Record<string, any>
>(models: T): ModelFactoryStore<T>;

export declare function createProxy<T extends Record<string, any>>(
  target: T,
  handler: ProxyHandler<T>
): T;

export declare function shallowEqual<R>(prev: R, current: R): boolean;
