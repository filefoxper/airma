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

export interface AirModelInstance<S> {
  state: S;
  [key: string]: ((...args: unknown[]) => S) | S;
}

export type AirReducer<S, T extends AirModelInstance<S>> = (state?: S) => T;

export type Reducer<S, A> = (state: S, action: A) => S;

export interface ReducerPadding<S = any, T extends AirModelInstance<S> = AirModelInstance<S>> {
  agent: T;
  update:(reducer:AirReducer<S, T>,state:S)=>void;
  connect: (dispatch?: Dispatch) => void;
  disconnect: () => void;
}

// inner interface
export type ActualReducer<S = any, T extends AirModelInstance<S> = any> = Reducer<
  S,
  Action
> &
  ReducerPadding<S, T>;

export type Connection<S, T extends AirModelInstance<S>> = {
  current: T;
  reducer: AirReducer<S, T>;
  dispatch: Dispatch | null;
  cacheMethods:Record<string, (...args: unknown[]) => unknown>
};
