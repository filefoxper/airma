export declare type Action = {
    type: string;
    state?: any;
    prevState?: any;
    params?: any[];
};

export declare type Dispatch = (action: Action) => any;

export declare type AirModel<S> = {
    state: S;
    [key: string]: any;
};

export declare interface AirModelInstance {
    [key: string]: any;
}

declare type ValidInstance<S,T extends AirModelInstance>={
    [K in keyof T]:T[K] extends ((...args: any[]) => S)?T[K]:T[K] extends ((...args: any[]) => any)?never:T[K]
};

export declare type AirReducer<S, T extends AirModelInstance> = (
    state: S
) => ValidInstance<S,T>;

export declare type Reducer<S, A> = (state: S, action: A) => S;

export declare interface ReducerPadding<S = any, T extends AirModelInstance = AirModelInstance> {
    agent: T;
    update:(reducer:AirReducer<S, T>,uncontrolled?:{state:S})=>void;
    connect: (dispatch?: Dispatch) => void;
    disconnect: () => void;
}

export declare type ActualReducer<S = any, T extends AirModelInstance = any> = Reducer<
    S,
    Action
    > &
    ReducerPadding<S, T>;

export declare function createModel<S, T extends AirModelInstance, D extends S>(
    reducer: AirReducer<S, T>,
    defaultState:D
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
