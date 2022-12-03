import {AirModelInstance, AirReducer} from "@airma/core";

export declare function useModel<S, T extends AirModelInstance<S>>(
    model: AirReducer<S, T>,
    state: ReturnType<typeof model>['state']
): T

export declare function useTupleModel<S, T extends AirModelInstance<S>>(
    model: AirReducer<S, T>,
    state: ReturnType<typeof model>['state']
): [T['state'], T]
