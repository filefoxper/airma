export type Action = {
  type: string;
  state?: any;
  prevState?: any;
  params?: any[];
};

export type Dispatch = ((action: Action) => unknown) & { confirmed?: boolean };

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

export type Contexts = {
  data: { current: unknown }[];
  current: number;
  initialized: boolean;
  working: boolean;
};

export type ModelContext = {
  ref: <C>(current: C) => { current: C };
  memo: <M extends () => any>(call: M, deps: unknown[]) => ReturnType<M>;
};

export type ModelContextFactory = {
  context: ModelContext;
  start: () => void;
  end: () => void;
  reset: () => void;
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
  getCurrent(): T;
  getVersion(): number;
  getListeners(): Dispatch[];
  update: (
    reducer: AirReducer<S, T>,
    outState?: {
      state: S;
      cache?: boolean;
      isDefault?: boolean;
      ignoreDispatch?: boolean;
    }
  ) => void;
  updateState: (state: S) => void;
  notice: () => void;
  tunnel: (dispatch: Dispatch) => {
    connect: () => void;
    disconnect: () => void;
  };
  destroy: () => void;
  connect: (dispatch: Dispatch) => void;
  disconnect: (dispatch?: Dispatch) => void;
  optimize: (batchUpdateCallback?: (callback: () => void) => void) => void;
}

export interface ActionWrap {
  prev?: ActionWrap;
  value: Action;
  next?: ActionWrap;
}

export interface FirstActionWrap extends ActionWrap {
  tail: ActionWrap | undefined;
}

// inner interface
export type Updater<S, T extends AirModelInstance> = {
  version: number;
  isSubscribing: boolean;
  dispatching?: FirstActionWrap;
  current: T;
  controlled: boolean;
  reducer: AirReducer<S, T>;
  dispatch: Dispatch | null;
  dispatches: Dispatch[];
  temporaryDispatches: Dispatch[];
  cacheMethods: Record<string, (...args: unknown[]) => unknown>;
  cacheState: { state: S } | null;
  state: S;
  notify: (action: Action) => void;
};

export type UpdaterConfig = {
  controlled?: boolean;
  batchUpdate?: (callback: () => void) => void;
};

export type Creation = {
  creation(updateConfig?: UpdaterConfig): Connection;
};

export type Collection = {
  key: string;
  keys: (string | number)[];
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

export type StaticFactoryInstance<T extends AirReducer<any, any>> = T & {
  connection: Connection;
  payload?: unknown;
  effect?: [(...params: any[]) => any, Record<string, any>?];
  pipe<P extends AirReducer<any, any>>(
    reducer: P
  ): P & { getSourceFrom: () => FactoryInstance<T> };
  global: () => StaticFactoryInstance<T>;
};

export type FactoryInstance<T extends AirReducer<any, any>> = T & {
  creation(updateConfig?: UpdaterConfig): Connection;
  payload?: unknown;
  effect?: [(...params: any[]) => any, Record<string, any>?];
  pipe<P extends AirReducer<any, any>>(
    reducer: P
  ): P & { getSourceFrom: () => FactoryInstance<T> };
  global: () => StaticFactoryInstance<T>;
};
