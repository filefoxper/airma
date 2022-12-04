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

export interface ReducerPadding<
  S = any,
  T extends AirModelInstance = AirModelInstance
> {
  agent: T;
  update: (reducer: AirReducer<S, T>) => void;
  connect: (dispatch?: Dispatch) => void;
  disconnect: () => void;
}

// inner interface
export type ActualReducer<S = any, T extends AirModelInstance = any> = Reducer<
  S,
  Action
> &
  ReducerPadding<S, T>;

export type Connection<S, T extends AirModelInstance> = {
  current: T;
  reducer: AirReducer<S, T>;
  dispatch: Dispatch | null;
  cacheMethods: Record<string, (...args: unknown[]) => unknown>;
  cacheState: S;
};
