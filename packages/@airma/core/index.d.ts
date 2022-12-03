export declare type Action = {
    type: string;
    state?: any;
    prevState?: any;
    params?: any[];
};

export declare type Dispatch = (action: Action) => unknown;

export declare type AirModel<S> = {
    state: S;
    [key: string]: unknown;
};

export declare interface AirModelInstance<S> {
    state: S;
    [key: string]: ((...args: unknown[]) => S)|S;
}

export declare type AirReducer<S, T extends AirModelInstance<S>> = (
    state: S
) => T;

export declare type Reducer<S, A> = (state: S, action: A) => S;

export declare interface ReducerPadding<S = any, T extends AirModelInstance<S> = AirModelInstance<S>> {
    agent: T;
    update:(reducer:AirReducer<S, T>,state:S)=>void;
    connect: (dispatch?: Dispatch) => void;
    disconnect: () => void;
}

export declare type ActualReducer<S = any, T extends AirModelInstance<S> = any> = Reducer<
    S,
    Action
    > &
    ReducerPadding<S, T>;

export declare function createModel<S, T extends AirModelInstance<S>>(
    reducer: AirReducer<S, T>,
    defaultState:ReturnType<typeof reducer>['state']
): ActualReducer<S, T>;


export declare function useSimpleProxy<T extends Record<string, unknown>>(
    target: T,
    handler: ProxyHandler<T>,
): T;

export declare function createProxy<T extends Record<string, any>>(
    target: T,
    handler: ProxyHandler<T>,
): T;

export function isFunctionModel<S, T extends AirModel<S>>(
    model: T | { new (): T } | ((state: S) => T)
): model is (state: S) => T;
