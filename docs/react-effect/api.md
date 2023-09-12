# API

## useQuery

It is used to maintain a query state.

```ts
function useQuery(callback, variables){
    return [state, trigger, execute];
}
```

### Parameters

* callback - It can be a promise callback `(...variables:any[])=>Promise<any>` or a session key `createSessionKey((...variables:any[])=>Promise<any>)`.
* variables - It is optional, if there is no variables, `useQuery` works in manual mode. It can be an parameter array for callback `[...variables]`, or a detail config.

Variables config:

```ts
{
    // the variables for callback,
    // if there is no deps,
    // the change of variables can drive `useQuery` works
    variables?: Parameters<callback>,
    // the deps to drive `useQuery` works,
    deps?: any[],
    // set trigger on `manual` mode forcely
    manual?: boolean,
    // set loaded `true` can tells typescript about useQuery 
    // give out a loaded data type.
    loaded?:true,
    // a default data before state is loaded
    defaultData?: any,
    // strategy callbacks to optimize query
    strategy?: Strategy | (Strategy[]),
    // limit the working trigger type in `mount`, `update`, `manual`
    // default with ['mount', 'update', 'manual']
    triggerOn?: TriggerType[]
}
```

### Returns

* state - The promise state of useQuery.
* trigger - A callback to trigger useQuery work manually with the current variables you set to useQuery. It returns a promise resolving a `state`.
* execute - A callback to trigger useQuery work manually with local parameters. It returns a promise resolving a `state`.

State:

```ts
type State<T> = {
    // The data promise resolved
    data: T,
    // If the query or mutation is not finished
    isFetching: boolean,
    // The error promise rejected
    error: any,
    // If the promise has rejected 
    isError: boolean,
    // If there is one promise resolve happened.
    loaded: boolean,
    // If this promise state is abandoned
    abandon: boolean
} 
```

## useMutation

It is used to maintain a mutation state.

```ts
function useMutation(callback, variables){
    return [state, trigger, execute];
}
```

### Parameters

* callback - It can be a promise callback `(...variables:any[])=>Promise<any>` or a session key `createSessionKey((...variables:any[])=>Promise<any>)`.
* variables - It is optional, if there is no variables, `useQuery` works in manual mode. It can be an parameter array for callback `[...variables]`, or a detail config.

Variables config:

```ts
{
    // the variables for callback,
    // if there is no deps,
    // the change of variables can drive `useQuery` works
    variables?: Parameters<callback>,
    // the deps to drive `useQuery` works,
    deps?: any[],
    // set loaded `true` can tells typescript about useQuery 
    // give out a loaded data type.
    loaded?:true,
    // a default data before state is loaded
    defaultData?: any,
    // strategy callbacks to optimize query
    strategy?: Strategy | (Strategy[]),
    // limit the working trigger type in `mount`, `update`, `manual`
    // default with ['manual']
    triggerOn?: TriggerType[]
}
```

### Returns

* state - The promise state of useQuery.
* trigger - A callback to trigger useQuery work manually with the current variables you set to useQuery. It returns a promise resolving a `state`.
* execute - A callback to trigger useQuery work manually with local parameters. It returns a promise resolving a `state`.

State:

```ts
type State<T> = {
    // The data promise resolved
    data: T,
    // If the query or mutation is not finished
    isFetching: boolean,
    // The error promise rejected
    error: any,
    // If the promise has rejected 
    isError: boolean,
    // If there is one promise resolve happened.
    loaded: boolean,
    // If this promise state is abandoned
    abandon: boolean
} 
```

## createSessionKey

It is used to create a session key for a promise callback.

```ts
function createSessionKey(promiseCallback){
    return SessionKey;
}
```

### Parameters

* promiseCallback - It should be a callback returns a promise.

### Returns

* SessionKey - It is a session key function. It can be provided to SessionProvider for creating a store. And with this key inside SessionProvider, you can broadcast or accept state changes. 

## SessionProvider

It is a React Context Provider component. It is used for creating a scope store by using session keys.

```ts
SessionProvider props:{
    keys: <session keys>,
    children?: ReactNode
}
```

### Parameters

* keys - It should be session keys.
* children - React Nodes

### Returns

It returns a React element.

## provide

It is a HOC mode for SessionProvider.

```ts
function provide(sessionKeys){
    return function connect(Component){
        return function HocComponent(componentProps){
            return (
                <SessionProvider keys={sessionKeys}>
                  <Component {...componentProps}/>
                </SessionProvider>
            );
        }
    }
}
```

### Example

```ts
import React from 'react';
import {
    provide, 
    useQuery, 
    useSession,
    createSessionKey
} from '@airma/react-effect';

const clientKey = createSessionKey(...);

const Child = ()=>{
    const [ {data} ] = useSession(clientKey);
    return ......;
}

const App = provide(clientKey)(()=>{

    useQuery(clientKey, []);

    return (
        <div>
            <Child/>
        </div>
    );
})
```

## useSession

It is a react hook used to accept state changes from the nearest mathced [SessionProvider](/react-effect/api?id=sessionprovider).

```ts
export declare function useSession<D extends SessionKey<any>>(
  factory: D,
  config: LoadedUseSessionConfig
): [LoadedSessionState<PCR<D>>, () => void];
export declare function useSession<D extends SessionKey<any>>(
  factory: D,
  config: SessionType
): [SessionState<PCR<D>>, () => void];
export declare function useSession<D extends SessionKey<any>>(
  factory: D,
  config?: UnloadedUseSessionConfig
): [SessionState<PCR<D>>, () => void];
export declare function useSession<D extends SessionKey<any>>(
  factory: D,
  config?: { loaded?: boolean; sessionType?: SessionType } | SessionType
): [SessionState<PCR<D>>, () => void];
```

### Parameters

* sessionKey - A session key created by [createSessionKey](/react-effect/api?id=createsessionkey) API.
* config - An optional config object or session type, set `{loaded: true}` can force it returns a loaded session state, set `{sessionType: 'query'|'mutation'}` can mark out if you have use a wrong session type. 

### Returns

* state - The promise state from nearest SessionProvider store matched with the session key.
* trigger - It is a no parameter callback, returns void. It can be used to trigger query or mutation which is using the same session key manually.

## useLoadedSession

```ts
export declare function useLoadedSession<D extends SessionKey<any>>(
  factory: D,
  config: UseSessionConfig
): [LoadedSessionState<PCR<D>>, () => void];
```

It is `useSession` with a `{loaded: true}` config item.


## Strategy

It is a set for often used [strategies](/react-effect/concepts?id=strategy).

```ts
const Strategy: {
  // Provide a debounce running strategy
  debounce: (op: { duration: number } | number) => StrategyType;
  // Provide a once running strategy
  once: () => StrategyType;
  error: (
    process: (e: unknown) => any,
    option?: { withAbandoned?: boolean }
  ) => StrategyType;
  success: <T>(
    process: (data: T) => any,
    option?: { withAbandoned?: boolean }
  ) => StrategyType<T>;
  memo: <T>(
    equalFn?: (source: T | undefined, target: T) => boolean
  ) => StrategyType<T>;
  validate: (process: () => boolean) => StrategyType;
  reduce: <T>(
    call: (previous: T | undefined, currentData: T) => T | undefined
  ) => StrategyType<T>;
  effect: {
    <T>(process: (state: SessionState<T>) => void): StrategyType<T>;
    success: <T>(
      process: (data: T, sessionData: SessionState<T>) => any
    ) => StrategyType<T>;
    error: (
      process: (e: unknown, sessionData: SessionState) => any
    ) => StrategyType;
  };
};
```

* Strategy.debounce - It returns a debounce strategy. You can set a duration time to make promise callback work debounce with this duration time.
* Strategy.once - It returns a strategy. With it, when your promise callback has resolved a promise, it can not be called again.
* Strategy.error - It returns a strategy. You can provide a error process callback for it. When the promise is rejected, it calls the process callback with error parameter.
* Strategy.success - It returns a strategy. You can provide a success process callback for it. When the promise is resolved, it calls the process callback with data parameter.
* Strategy.memo - It returns a strategy. You can provide a data comparator function for it. This strategy compares promise data with state data, if the result of `equalFn` returns true, it will reuse the state data. The default `equalFn` compares with two JSON.stringify results.
* Strategy.validate - It returns a strategy. You can set a boolean returning callback, it is always called before promise callback is started. If the setting callback returns `false`, the promise callback will stop work.
* Strategy.reduce - It returns a strategy. You can set a callback which accepts a newest session data and a current promise resolving data for generating a accumulative data for next session state.
* Strategy.effect - It returns a strategy. You can set a process callback for it to process the session state effect.
* Strategy.effect.success - It returns a strategy. You can set a process callback for it to process the session state effect when state changes to success.
* Strategy.effect.error - It returns a strategy. You can set a process callback for it to process the session state effect when state changes to error.

`Strategy.success` is different with `Strategy.effect.success`, one responses to the promise resolver, another responses to session state effect. The same as `Strategy.error` and `Strategy.effect.error`.

## ConfigProvider

It is a global config provider. If you want to set a global strategy for every `useQuery` and `useMutation` in children, or use a global fetching state, you can use it.

```ts
type GlobalConfig = {
  useGlobalFetching?: boolean;
  strategy?:(
    strategies:(StrategyType | undefined | null)[], 
    type: 'query' | 'mutation'
  )=>(StrategyType | undefined | null)[];
};

interface ConfigProviderProps:{
    value: GlobalConfig;
    children?: ReactNode;
}
```

### Parameters

* value - It should be global config.
* children - React Nodes

### Example

```ts
import React from 'react';
import {
  ConfigProvider,
  Strategy,
  useQuery,
  useIsFetching
} from '@airma/react-effect';
import type {GlobalConfig} from '@airma/react-effect';
import {fetchUsers, fetchGroups} from './globalSessions'; 

const config: GlobalConfig = {
  // The strategy is a callback,
  // it accepts a running effect strategy array,
  // and a effect type: 'query' | 'mutation'.
  // You can complete the running strategies
  // with padding strategies,
  // so, the running effect will work with these new strategies.
  strategy:(
    s:(StrategyType | undefined| null)[], type: 'query' | 'mutation'
  )=>[...s, Strategy.error((e)=>console.log(e))],
  // use global fetching state.
  useGlobalFetching: true
}

const App = ()=>{
  // if the `fetchUsers` is failed,
  // the global config strategy `Strategy.error` works.
  useQuery(fetchUsers, []);
  useQuery(fetchGroups, {
    variables: [...ids],
    strategy: [
      Strategy.debounce(300), 
      // Strategy.error can not work twice in strategy chain runtime.
      Strategy.error(...)
    ]
  });
  const userOrGroupsIsFetching = useIsFetching();
  ......
}

......
{/* Set a GlobalConfig */}
<ConfigProvider 
  value={config}
>
  <App/>
</ConfigProvider>
```

## ~~GlobalSessionProvider~~

It is a global config provider. If you want to set a global strategy for every `useQuery` and `useMutation` in children, you can use it.

```ts
GlobalSessionProvider props:{
    keys?: SessionKeys,
    config?: GlobalConfig,
    children?: ReactNode
}
```

### Parameters

* keys - It is optional, you can set session keys for creating a session store in it.
* config - It is optional, and it should be global config.
* children - React Nodes

### Example

```ts
import React from 'react';
import {
  GlobalSessionProvider,
  Strategy,
  useQuery
} from '@airma/react-effect';
import type {GlobalConfig} from '@airma/react-effect';
import {fetchUsers, fetchGroups} from './globalSessions'; 

// The GlobalConfig only support rebuild strategy currently.
const config: GlobalConfig = {
  // The strategy is a callback,
  // it accepts a running effect strategy array,
  // and a effect type: 'query' | 'mutation'.
  // You can complete the running strategies
  // with padding strategies,
  // so, the running effect will work with these new strategies.
  strategy:(
    s:(StrategyType | undefined| null)[], type: 'query' | 'mutation'
  )=>[...s, Strategy.error((e)=>console.log(e))]
}

const App = ()=>{
  // if the `fetchUsers` is failed,
  // the global config strategy `Strategy.error` works.
  useQuery(fetchUsers, []);
  useQuery(fetchGroups, {
    variables: [...ids],
    strategy: [
      Strategy.debounce(300), 
      Strategy.error(...)
    ]
  });
  ......
}

......
{/* Set a ClientConfig */}
<GlobalSessionProvider 
  config={config}
>
  <App/>
</GlobalSessionProvider>
```

## useIsFetching

It is a hook to detect if there are some `useQuery` or `useMutation` are still fetching.

```ts
export declare function useIsFetching(
  ...sessionStates: SessionState[]
): boolean;
```

Parameters

* sessionStates - The states of `useQuery` or `useMutation` for detecting.

Returns

A boolean data, if any of sessionStates is in `fetching`, it returns true.

Explain

If `useIsFetching` is in a `useGlobalFetching` setted `ConfigProvider`, and there is no parameter for it, it detects all `useQuery` or `useMutation` in this Provider.

## useLazyComponent

```ts
declare type LazyComponentSupportType<P> =
  | ComponentType<P>
  | ExoticComponent<P>;

declare type CheckLazyComponentSupportType<
  T extends LazyComponentSupportType<any>
> = T extends LazyComponentSupportType<infer P>
  ? P extends { error?: ErrorSessionState }
    ? LazyExoticComponent<T>
    : never
  : never;

export declare function useLazyComponent<
  T extends LazyComponentSupportType<any>
>(
  componentLoader: () => Promise<T | { default: T }>,
  ...deps: (AbstractSessionState | AbstractSessionResult)[]
): CheckLazyComponentSupportType<T>;
```

Parameters

* componentLoader - It is a callback, it should returns a promise which always resolve a React component or `{default: ReactComponent}` with `{ error?: ErrorSessionState }` props. 
* deps - The states of `useQuery` or `useMutation` for detecting.

Explain

This hook API is used for loading component with its dependecy sessions. It accepts a callback which returns a promise with a component result, and sessionStates from `useQuery`, `useMutation` or `useSession`.

Example

```ts
import React, {Suspense} from 'react';
import {
  GlobalSessionProvider,
  Strategy,
  useQuery,
  useLazyComponent
} from '@airma/react-effect';
import type {GlobalConfig, ErrorSessionState} from '@airma/react-effect';
import {currentUserKey, fetchUsersKey, fetchGroupsKey} from './globalSessions'; 

// The GlobalConfig only support rebuild strategy currently.
const config: GlobalConfig = {
  strategy:(
    s:(StrategyType | undefined| null)[], type: 'query' | 'mutation'
  )=>[...s, Strategy.error((e)=>console.log(e))]
}

const UnexpectedComp = (props:{error?:ErrorSessionState})=>{
  return (
    <div>some thing is wrong</div>
  )
}

const App = ()=>{
  const userSession = useQuery(currentUserKey, []);
  const [{data}] = userSession;
  const usersSession = useQuery(fetchUsersKey, {
    variables:[data],
    triggerOn: [ 'update' ],
  });
  const groupSession = useQuery(fetchGroupsKey, {
    variables:[data],
    triggerOn: [ 'update' ],
  });

  // It can help you to load component with its dependency sessions.
  const Container = useLazyComponent(()=>import('./container'), 
    userSession,
    usersSession,
    groupSession
  )

  ......
  return (
    <div>
      ......
      <Suspense fallback={...}>
        <Container/>
      </Suspense>
    </div>
  )
}

......
{/* Set a ClientConfig */}
<GlobalSessionProvider 
  config={Strategy.error(e => console.log(e))}
  keys = {{fetchUsersKey, fetchGroupsKey}}
>
  <App/>
</GlobalSessionProvider>
```

## useResponse

```ts
export declare interface useResponse<T> {
  (
    process: (state: SessionState<T>) => any,
    sessionState: SessionState<T>
  ): void;
  success: (
    process: (data: T, sessionState: SessionState<T>) => any,
    sessionState: SessionState<T>
  ) => void;
  error: (
    process: (error: unknown, sessionState: SessionState) => any,
    sessionState: SessionState
  ) => void;
}
```

Parameters

process - A process callback response for session state changes.

Explain

This hook Api calls process callback when session is responsed. It is a effect for session state.

Example:

```ts
const [sessionState] = useQuery(sessionCallback, []);

useResponse((s)=>{
  if(s.isError){
    processError(s.error)
  }else{
    processSuccess(s.data);
  }
}, sessionState);
```

### useResponse.success

```ts
useResponse.success<T>(
    process: (data: T, sessionState: SessionState<T>) => any,
    sessionState: SessionState<T>
  ) => void;
```

Parameters

process - A process callback response for session state changes.

Explain

This Hook Api calls process callback when the session is responsed successful.

Example

```ts
const [sessionState] = useQuery(sessionCallback, []);

useResponse.success((data)=>{
  processSuccess(data);
}, sessionState);
```

### useResponse.success

```ts
useResponse.error(
    process: (error: unknown, sessionState: SessionState) => any,
    sessionState: SessionState
  ) => void;
```

Parameters

process - A process callback response for session state changes.

Explain

This Hook Api calls process callback when the session is responsed failed.

Example

```ts
const [sessionState] = useQuery(sessionCallback, []);

useResponse.error((err)=>{
  processError(err);
}, sessionState);
```

Why use `useResponse` hooks? `Strategy.success` and `Strategy.error` only response for the running promise drived by `useQuery`, that means if there are some `useQuery` and `useSession` with same session keys, only one of them can trigger `Strategy.xxx`. But, `useResponse` responses for session state, it can be triggered by every session state from `useQuery` and `useSession` with a same session key. If you still like using a `Strategy` to response session state changes, you can use `Strategy.effect` for a same experience.