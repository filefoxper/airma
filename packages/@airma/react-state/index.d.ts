import {AirModelInstance, AirReducer} from "@airma/core";

export declare function useModel<S, T extends AirModelInstance,D extends S>(
    model: AirReducer<S, T>,
    state: D
): T;

export declare function useTupleModel<S, T extends AirModelInstance,D extends S>(
    model: AirReducer<S, T>,
    state: D
): [T, S];
