export type Action = {
  type: string;
  state?: any;
  prevState?: any;
  params?: any[];
};

export type Dispatch = (action: Action) => unknown;

export interface AirModelInstance {
  [key: string]: unknown;
  [key: number]: unknown;
}

type ValidInstance<S, T extends AirModelInstance> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => S
    ? T[K]
    : T[K] extends (...args: unknown[]) => unknown
    ? never
    : T[K];
};

export type AirReducer<S, T extends AirModelInstance> = (
  state: S
) => ValidInstance<S, T>;

export interface Connection<
  S = any,
  T extends AirModelInstance = AirModelInstance
> {
  agent: T;
  getCacheState(): { state: S } | null;
  getState(): S;
  update: (
    reducer: AirReducer<S, T>,
    outState?: { state: S; cache?: boolean, isDefault?:boolean }
  ) => void;
  updateState:(state:S)=>void
  connect: (dispatch?: Dispatch) => void;
  disconnect: (dispatch?: Dispatch) => void;
}

// inner interface
export type Updater<S, T extends AirModelInstance> = {
  current: T;
  reducer: AirReducer<S, T>;
  dispatch: Dispatch | null;
  dispatches: Dispatch[];
  cacheMethods: Record<string, (...args: unknown[]) => unknown>;
  cacheState: { state: S } | null;
  state: S;
};

export type Creation = {
  creation(): Connection;
};

export type Collection = {
  key: string;
  keys:(string|number)[]
  factory: (...args: any[]) => any;
  sourceFactory?: (...args: any[]) => any;
  connection: Connection;
};

export type ModelFactoryStore<T> = {
  update(updateFactory: T): ModelFactoryStore<T>;
  get(reducer: AirReducer<any, any>): Connection | undefined;
  equal(factory: T): boolean;
  destroy(): void;
};

export type FactoryInstance<T extends AirReducer<any, any>> = T & {
  creation(): Connection;
  pipe<P extends AirReducer<any, any>>(
    reducer: P
  ): P & { getSourceFrom: ()=>FactoryInstance<T> };
};
