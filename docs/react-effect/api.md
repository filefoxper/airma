# API

## useQuery

It is a query [session](/react-effect/concepts?id=session) API. By the default, it can be triggered when it is mounted; the dependency parameters change; or a manual trigger/execute is called. 

From version v18.5.0, a no config useQuery works more like a useSession, it always looks for another useQuery with same session key and config to work for it. If the perfect substitute is not exist, it works manually. 

So, a no config useQuery looks more like a useSession. The only different is that the no config useQuery still works if no substitute is found.

```ts
function useQuery(
  promiseCallbackOrSessionKey, 
  variablesOrConfig?
):[
  sessionState, 
  trigger, 
  execute
]
```

### Parameters

* promiseCallbackOrSessionKey - It can be a promise callback or a session [key](/react-effect/concepts?id=key).
* variablesOrConfig - It is optional, if there is no variables, useQuery works in manual mode. It can be an parameter array for callback, or a [session config](/react-effect/concepts?id=session-config).

### Returns

* sessionState - [session state](/react-effect/concepts?id=session-state).
* trigger - A callback to trigger useQuery work manually. It need no parameter, useQuery uses setted `variables` as parameters for execution.
* execute - A callback to execute useQuery manually. It need full parameters for execution.

## useMutation

It is a mutation [session](/react-effect/concepts?id=session) API. By the default, it can be triggered when  a manual trigger/execute is called. 

From version v18.5.0, a no config useMutation works more like a useSession, it always looks for another useMutation with same session key and config to work for it. If the perfect substitute is not exist, it works manually. 

So, a no config useMutation looks more like a useSession. The only different is that the no config useMutation still works if no substitute is found.

```ts
function useMutation(
  promiseCallbackOrSessionKey, 
  variablesOrConfig?
):[
  sessionState, 
  trigger, 
  execute
]
```

### Parameters

* promiseCallbackOrSessionKey - It can be a promise callback or a session [key](/react-effect/concepts?id=key).
* variablesOrConfig - It is optional, if there is no variables, useMutation works in manual mode. It can be an parameter array for callback, or a [session config](/react-effect/concepts?id=session-config).

### Returns

* sessionState - [session state](/react-effect/concepts?id=session-state).
* trigger - A callback to trigger useMutation work manually. It need no parameter, useMutation uses setted `variables` as parameters for execution.
* execute - A callback to execute useMutation manually. It need full parameters for execution.

## createSessionKey

It wraps a promise callback to be a session [key](/react-effect/concepts?id=key) for creating store.

```ts
function createSessionKey(
  promiseCallback,
  sessionType?: 'query' | 'mutation'
): SessionKey
```

### Parameters

* promiseCallback - It is a promise callback.
* sessionType - It is optional, default 'query'. It can declare what kind this session key is.

### Returns

* SessionKey - It is a session [key](/react-effect/concepts?id=key).

## Provider

It is a React Context Provider component. It creates store from [keys](/react-effect/concepts?id=key). It can be replace by [Provider](/react-state/api?id=provider) in @airma/react-state package.

```ts
Provider props:{
    value: <session keys> or <model keys>,
    children?: ReactNode
}
```

### Parameters

* value - [Session keys](/react-effect/concepts?id=key) or [model keys](/react-state/concepts?id=key).
* children - React Nodes

### Returns

It returns a React element.

## provide

It is a HOC mode for Provider.

```ts
function provide(keys){
    return function connect(Component){
        return function HocComponent(componentProps){
            return (
                <Provider keys={keys}>
                  <Component {...componentProps}/>
                </Provider>
            );
        }
    }
}
```

## useSession

It is used for subscribing store state change. It can trigger useQuery/useMutation to execute.

```ts
function useSession(sessionKey):[sessionState, trigger]
```

**From version v18.3.2**, useSession support execute method.

```ts
function useSession(sessionKey):[sessionState, trigger, execute]
```

### Parameters

* sessionKey - A session [key](/react-effect/concepts?id=key).

### Returns

* sessionState - [session state](/react-effect/concepts?id=session-state).
* trigger - A callback to trigger useQuery/useMutation work manually. It need no parameter, useQuery/useMutation uses setted `variables` as parameters for execution.
* execute - A callback to execute useQuery/useMutation work manually. It need parameters for the execute function. **Support from v18.3.2**.

## useLoadedSession

It is a special useSession when the usage is ensure that the [session](/react-effect/concepts?id=session) has been loaded.

```ts
function useLoadedSession(sessionKey):[sessionState, trigger]
```

**From version v18.3.2**, useLoadedSession support execute method.

```ts
function useLoadedSession(sessionKey):[sessionState, trigger, execute]
```

### Parameters

* sessionKey - A session [key](/react-effect/concepts?id=key).

### Returns

* sessionState - A loaded [session state](/react-effect/concepts?id=session-state).
* trigger - A callback to trigger useQuery/useMutation work manually. It need no parameter, useQuery/useMutation uses setted `variables` as parameters for execution.
* execute - A callback to execute useQuery/useMutation work manually. It need parameters for the execute function. **Support from v18.3.2**.


## Strategy

It is a set for often used [strategies](/react-effect/concepts?id=strategy).

```ts
const Strategy: {
  cache:(op?: {
    key?: (variables: any[]) => string;
    staleTime?: number;
    capacity?: number;
  }) => StrategyType;
  debounce: (op: { duration: number; lead?: boolean } | number) => StrategyType;
  once: () => StrategyType;
  failure: (
    process: (e: unknown) => any,
    option?: { withAbandoned?: boolean }
  ) => StrategyType;
  success: <T>(
    process: (data: T) => any,
    option?: { withAbandoned?: boolean }
  ) => StrategyType<T>;
  memo: <T>(
    equalFn?: (oldData: T | undefined, newData: T) => boolean
  ) => StrategyType<T>;
  validate: (process: (variables:any[], currentSessionState: SessionState<T>) => boolean|Promise<boolean>) => StrategyType;
  reduce: <T>(
    call: (previousData: T | undefined, currentData: T, states: [SessionState<T|undefined>, SessionState<T>]) => T | undefined
  ) => StrategyType<T>;
  response: {
    <T>(process: (state: SessionState<T>) => void|(()=>void)): StrategyType<T>;
    success: <T>(
      process: (data: T, sessionData: SessionState<T>) => void|(()=>void)
    ) => StrategyType<T>;
    error: (
      process: (e: unknown, sessionData: SessionState) => void|(()=>void)
    ) => StrategyType;
  };
};
```

### Strategy.cache

Used for opening SWR query mode. When the query key (default `JSON.stringify(variables)`) can be found in cache, the cache data can be picked out as [session state](/react-effect/concepts?id=session-state).data immediately. In that case, if the **staleTime** is set, the execution skips.

If the query key is not in cache data, it store execution result with this key into cache.

It can change the `visited` field in session state, if there is no cache data, it changes this field to be `false`; if there is cache data, it changes this field to be `true`.

#### Parameters

* **op.key** - It is an optional callback, accept executing variables, returns a string value as key for every cache data.
* **op.staleTime** - It is an optional millisecond number value, to describe the time for caching a data.
* **op.capacity** - It is an optional number value, to describe how many record can be cached.
* **op.static** - It is an optional boolean value, if it is true, the session execution always fetches data once, and then uses the cached data. It is useful for fetching a static data.

### Strategy.debounce

It makes execution run with debounce feature.

#### Parameters

* **op.duration** - It is a millisecond number value, to describe the debounce time. If the whole option is a number, then the whole option is this duration setting.
* **op.lead** - It is an optional boolean value, to describe the execution work time: `true` means start, `false or undefined` means end.

### Strategy.once

It makes session can only be executed successfully once.

### Strategy.failure

It allows process callback running when a session is failed. 

**Be careful, it works when the executed promise is rejected, it is different with Strategy.response.failure.**

**If there are some Strategy.failure or Strategy.response.failure working in the strategy chain, only the first one runs process callback.**

```
Note: In 18.6.0, the `Strategy.faiure` will not disable other failure strategies after it. It only disables the previous failure strategies when it has nothing throw out. Experience this feature by adding `experience` property to GlobalConfig.
```

For experience:

```ts
const globalConfig = {  
  experience: 'next',
  strategy: (workingStrategies: StrategyType[])=>{
    return [
      // put the final failure strategy at the top of the chain.
      Strategy.failure((e) => {
        console.log('failure', e);
      }),
      ...workingStrategies
    ];
  }
}
<ConfigProvider value={globalConfig}>{...}</ConfigProvider>
```

#### Parameters

* **process** - It is a callback to process when session is failed. This process callback accepts a error data from session.
* **op.withAbandoned** - It is an optional boolean value, if it is true, the process can accept the abondoned execution errors.

### Strategy.success

It allows process callback running when a session executes successfully. 

**Be careful, it works when the executed promise is resolved, it is different with Strategy.response.success.**

#### Parameters

* **process** - It is a callback to process when session executes successfully. This process callback accepts a promise resolved data from session.
* **op.withAbandoned** - It is an optional boolean value, if it is true, the process can accept the abondoned execution data.

### Strategy.memo

It is used for reducing render frequency. If the execution data equals with [session state](/react-effect/concepts?id=session-state) data, it uses the old session state data as a new session state data.

#### Parameters

* **equalFn** - It is an optional callback, accepts an old session state data, and a new executed data, returns a boolean for telling if they are equal with each other.

### Strategy.validate

It can skip invalidate session execution happens.

#### Parameters

* **process** - It is a callback accepts executing variables and a current sessionState object. It should return a boolean or a boolean resolving promise to validate if the current execution should be executed.

#### Example

To skip session execution when this session is not online.

```ts
// use Strategy.validate to skip query execution when the session is not online.
const [sessionState,,execute] = useQuery(sessionCallback, {
  variables: [],
  strategy: Strategy.validate((variables, sessionState) => {
    // Use current session state property 'online' to validate if this session is still workable.
    return sessionState.online;
  })
});
```

Use this skill in a global config to skip all the offline session executions.

```ts
const globalConfig = {
  strategy: (workingStrategies: StrategyType[])=>{
    return [
       Strategy.validate((variables, sessionState) => {
         return sessionState.online;
       }),
       ...workingStrategies
    ];
  }   
} 

<ConfigProvider value={globalConfig}>{...}</ConfigProvider>
```

Use this skill in a global config to skip all the query offline session executions.

```ts
const globalConfig = {
  strategy: (workingStrategies: StrategyType[], type: SessionType)=>{
    return type === 'query'? [
       Strategy.validate((variables, sessionState) => {
         return sessionState.online;
       }),
       ...workingStrategies
    ]: workingStrategies;
  }   
} 

<ConfigProvider value={globalConfig}>{...}</ConfigProvider>
```

### Strategy.reduce

It can accumulate execution data with session state data, just like Array.prototype.reduce.

#### Parameters

* **process** - It is a callback, accepts previous session state data, current executed data and a tuple array about [previouse session state, current session state], returns a next session state data.

### Strategy.response

It allows to process callback when a session execution is finished.

**It works in react.useEffect after a execution result is setted as a new session state.**

#### Parameters

* **process** -It is a callback to process when a execution is finished. It accepts a session state as parameter, returns void or a cleanup function.

### Strategy.response.success

It allows to process callback when a session execution is successful.

**It works in react.useEffect after a execution result is setted as a new session state.**

#### Parameters

* **process** -It is a callback to process when a execution is successful. It accepts a session state data and the session state as parameters, returns void or a cleanup function.

### Strategy.response.failure

It allows to process callback when a session execution is failed.

**It works in react.useEffect after a execution result is setted as a new session state.**

**If there are some Strategy.failure or Strategy.response.failure working in the strategy chain, only the first one runs process callback.**

```
Note: In 18.6.0, the `Strategy.response.faiure` will not be disabled by other failure strategies, like `Strategy.failure` or `Strategy.response.faiure`. Experience this feature by adding `experience` property to GlobalConfig.
```

#### Parameters

* **process** -It is a callback to process when a execution is failed. It accepts a session state error and the session state as parameters, returns void or a cleanup function.

## ConfigProvider

It is a global config provider. It can be used for preseting common strategies and providing batch update callback.

```ts
type GlobalConfig = {
  // For linking `unstable_batchedUpdates` from react-dom, and make running optmization.
  batchUpdate?: (callback: () => void) => void;
  /**
   * @deprecated
   **/
  useGlobalFetching?: boolean;
  // To experience the new features in the next middle version change.
  experience?:'next';
  // A callback to build a runtime strategy chains, it accepts a strategies array from a runtime `useQuery/useMutation`, returns a new strategies array to replace the original one.
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

[Examples](/react-state/guides?id=configprovider) in guides.

## useIsFetching

It is a hook to detect if there are some useQuery or useMutation still in fetching.

```ts
function useIsFetching(
  ...sessionStates: SessionState[]
): boolean;
```

Parameters

* sessionStates - Session states for detecting, it is optional. If it is void, useIsFetching detecting all sessions.

Returns

A boolean value, if any of sessionStates is in `fetching`, it returns true.

## useLazyComponent

It is used for loading asynchronous component when all dependency sessions have finished once.

```ts
function useLazyComponent(
  componentLoader, 
  ...sessionStates
): LazyComponent
```

### Parameters

* componentLoader - It is a callback returns a React.Component resolving promise. 
* sessionStates - Session states.

### Returns

A React.lazy component with **props.error** field, if all session states are loaded successfully, the component Suspense wrapper renders the component without **props.error: undefined**, unless the error should be like a failed executed [session state](/react-effect/concepts?id=session-state).

### Example

```ts
import React, {Suspense} from 'react';
import {
  useQuery,
  useLazyComponent
} from '@airma/react-effect';
import type {ErrorSessionState} from '@airma/react-effect';
import {currentUserKey, fetchUsersKey, fetchGroupsKey} from './globalSessions'; 

const UnexpectedComp = (props:{error?:ErrorSessionState})=>{
  const {error: errorSessionState} = props;
  const {
    error
  } = errorSessionState;
  return (
    <div>some thing is wrong</div>
  )
}

const App = ()=>{
  const [userSessionState] = useQuery(currentUserKey, []);
  const {data} = userSessionState;
  const [usersSessionState] = useQuery(fetchUsersKey, {
    variables:[data],
    triggerOn: [ 'update' ],
  });
  const [groupSessionState] = useQuery(fetchGroupsKey, {
    variables:[data],
    triggerOn: [ 'update' ],
  });

  // It is helpful to load component with its dependency sessions.
  const Container = useLazyComponent(()=>import('./container'), 
    userSessionState,
    usersSessionState,
    groupSessionState
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
```

## useResponse

It allows to process callback after a session execution is finished (in React.useEffect). 

```ts
function useResponse(
  process: (sessionState:SessionState)=>void|(()=>void),
  sessionState: SessionState | [SessionState, {watchOnly?: boolean}]
): void
```

### Parameters

* **process** - A process callback accepts a session state as parameter, returns void or a cleanup function.
* **sessionState** - The dependent session state or a tuple array with the dependent session state and an option. Set option.watchOnly true, makes useResponse only work when session is responsed.

### Example:

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

It has child APIs:

### useResponse.useSuccess

It allows to process callback after a session execution is finished successfully (in React.useEffect).

```ts
useResponse.useSuccess(
  process: (data: SessionState['data'], sessionState: SessionState) => void|(()=>void),
  sessionState: SessionState | [SessionState, {watchOnly?: boolean}]
): void;
```

#### Parameters

* **process** - A process callback accepts a successful execution data and a session state as parameters, returns void or a cleanup function.
* **sessionState** - The dependent session state or a tuple array with the dependent session state and an option. Set option.watchOnly true, makes useResponse only work when session is responsed.

#### Example

```ts
const [sessionState] = useQuery(sessionCallback, []);

useResponse.useSuccess((data, state)=>{
  processSuccess(data, state.variables);
}, sessionState);

useResponse.useSuccess((data, state)=>{
  const intervalId = setInterval(()=>{
    processSuccess(data, state.variables);
  },1000);
  // use cleanup function to clear intervalId
  return ()=>clearInterval(intervalId);
}, sessionState);
```

### useResponse.useFailure

It allows to process callback after a session execution is finished failed (in React.useEffect).

```ts
useResponse.useFailure(
  process: (error: SessionState['error'], sessionState: SessionState) => void|(()=>void),
  sessionState: SessionState | [SessionState, {watchOnly?: boolean}]
): void;
```

#### Parameters

* **process** - A process callback accepts a failed execution error and a session state as parameters, returns void or a cleanup function.
* **sessionState** - The dependent session state or a tuple array with the dependent session state and an option. Set option.watchOnly true, makes useResponse only work when session is responsed.

#### Example

```ts
const [sessionState] = useQuery(sessionCallback, []);

useResponse.useFailure((err)=>{
  processError(err);
}, sessionState);
```

## session

It is a function for wrapping a promise callback to be a API collection.

```ts
type StaticStoreApi = {
  useQuery(
    variablesOrConfig
  ):[sessionState, trigger, execute];
  useMutation(
    variablesOrConfig
  ):[sessionState, trigger, execute];
  useSession():[sessionState, trigger];
  useLoadedSession():[sessionState, trigger];
};

type StoreApi = {
  asGlobal(): StaticStoreApi;
  static(): StaticStoreApi; // same as `asGlobal`
  provideTo<P extends object>(
    component: ComponentType<P>
  ):ComponentType<P>;
  Provider:FunctionComponent<{
    value: ModelKeys, 
    children?: ReactNode
  }>;
  with(...stores:(StoreApi|ModelKey)[]);
  useQuery(
    variablesOrConfig
  ):[sessionState, trigger, execute];
  useMutation(
    variablesOrConfig
  ):[sessionState, trigger, execute];
  useSession():[sessionState, trigger];
  useLoadedSession():[sessionState, trigger];
};

type Api = {
  createStore():StoreApi;
  useQuery(
    variablesOrConfig
  ):[sessionState, trigger, execute];
  useMutation(
    variablesOrConfig
  ):[sessionState, trigger, execute];
};

function session(
  promiseCallback, 
  sessionType: 'query' | 'mutation'
): Api
```

### Parameters

* **promiseCallback** - A promise callback.
* **sessionType** - To declare if this session is for `query` or `mutation`.

### Returns

An Api collection for coding with a flow style.

[Examples](/react-effect/index?id=session) before.