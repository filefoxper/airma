export type Action = {
  type: string;
  state?: any;
  prevState?: any;
  params?: any[];
};

export type Dispatch = (action: Action) => unknown;

export type AirModel<S> = {
  state: S;
  [key: string]: unknown;
};

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

export type Reducer<S, A> = (state: S, action: A) => S;

export interface Connection<
  S = any,
  T extends AirModelInstance = AirModelInstance
> {
  agent: T;
  getCacheState():S;
  update: (reducer: AirReducer<S, T>, outState?: { state: S }) => void;
  connect: (dispatch?: Dispatch) => void;
  disconnect: (dispatch?: Dispatch) => void;
}

// inner interface
export type Updater<S, T extends AirModelInstance> = {
  current: T;
  reducer: AirReducer<S, T>;
  dispatch: Dispatch | null;
  dispatches:Dispatch[];
  cacheMethods: Record<string, (...args: unknown[]) => unknown>;
  cacheState: S;
};

export type Creation<T> = {
  creation():Connection
}

export type HoldCallback = <S=any, T extends AirModelInstance=any, D extends S=any>(
  reducer: AirReducer<S, T>,
  defaultState?: D
) => typeof reducer & Creation<T>;
