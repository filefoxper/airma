import { AirModelInstance, AirReducer } from '@airma/core';

export declare type Option = {
  refresh?: boolean;
};

export declare function useModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S | undefined, T>
): T;
export declare function useModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  state: D,
  option?: Option
): T;
export declare function useModel<S, T extends AirModelInstance, D extends S>(
  model: AirReducer<S, T>,
  state: D,
  option?: Option
): T;

export declare function useTupleModel<
  S,
  T extends AirModelInstance,
  D extends S
>(model: AirReducer<S, T>, state: D, option?: ((s: S) => any) | Option): [S, T];

export declare function useControlledModel<
  S,
  T extends AirModelInstance,
  D extends S
>(model: AirReducer<S, T>, state: D, onChange: (s: S) => any): T;

export declare function useRefreshModel<
  S,
  T extends AirModelInstance,
  D extends S
>(model: AirReducer<S, T>, state: D): T;

export declare function useRefresh<T extends (...args: any[]) => any>(
  method: T,
  params: Parameters<T>
);
