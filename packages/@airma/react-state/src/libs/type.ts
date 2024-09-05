export type Action = {
  type: string;
  method: null | ((...args: any[]) => any);
  state?: any;
  prevState?: any;
  instance: any;
  prevInstance: any;
  params?: any[];
  payload?: unknown;
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

export type AirReducer<S, T extends AirModelInstance> = ((
  state: S
) => ValidInstance<S, T>);

export interface InstanceActionRuntime {
  methodsCache: Record<string, (...args: any[]) => any>;
  middleWare?: (action: Action) => Action | null;
}

export interface Connection<
  S = any,
  T extends AirModelInstance = AirModelInstance
> {
  agent: T;
  getCacheState(): { state: S } | null;
  getState(): S;
  getReducer(): AirReducer<S, T>;
  getCurrent(runtime?: InstanceActionRuntime): T;
  getStoreInstance(): T;
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
  renew: (connection?: Connection<S, T>) => void;
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

export interface FieldGenerator<R extends () => any = () => any> {
  callback: R;
  deps?: unknown[];
  get: () => ReturnType<R>;
  stale?: boolean;
  cacheGenerator: <S, T extends AirModelInstance>(
    updater: Updater<S, T>,
    type: string
  ) => any;
}

// inner interface
export type Updater<S, T extends AirModelInstance> = {
  version: number;
  isDestroyed: boolean;
  isSubscribing: boolean;
  dispatching?: FirstActionWrap;
  current: T;
  controlled: boolean;
  reducer: AirReducer<S, T>;
  dispatch: Dispatch | null;
  dispatches: Dispatch[];
  temporaryDispatches: Dispatch[];
  cacheGenerators: Record<
    string,
    { value: any; deps?: unknown[]; out: { get: () => any } } | null
  >;
  cacheMethods: Record<string, (...args: unknown[]) => unknown>;
  cacheState: { state: S } | null;
  state: S;
  notify: (action: Action | null) => void;
};

export type Collection = {
  key: string;
  keys: (string | number)[];
  factory: (...args: any[]) => any;
  sourceFactory?: (...args: any[]) => any;
  connection: Connection;
};

export type ModelFactoryStore<T> = {
  parent?: ModelFactoryStore<any>;
  update(
    updateFactory: T,
    parent?: ModelFactoryStore<any>
  ): ModelFactoryStore<T>;
  get(reducer: AirReducer<any, any>): Connection | undefined;
  equal(factory: T): boolean;
  destroy(): void;
};

export type UpdaterConfig = {
  controlled?: boolean;
  batchUpdate?: (callback: () => void) => void;
  parent?: ModelFactoryStore<any>;
};

export type Creation = {
  creation(updateConfig?: UpdaterConfig): Connection;
};

export type StaticFactoryInstance<T extends AirReducer<any, any>> = T & {
  connection: Connection;
  payload?: unknown;
  static: () => StaticFactoryInstance<T>;
  isFactory: () => true;
};

export type FactoryInstance<T extends AirReducer<any, any>> = T & {
  creation(updateConfig?: UpdaterConfig): Connection;
  payload?: unknown;
  static: () => StaticFactoryInstance<T>;
  isFactory: () => true;
};
