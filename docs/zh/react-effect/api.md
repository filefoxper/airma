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
    value: <session keys>,
    children?: ReactNode
}
```

### Parameters

* value - It should be session keys.
* children - React Nodes

### Returns

It returns a React element.

## withSessionProvider

It is a HOC mode for SessionProvider.

```ts
function withSessionProvider(clientKeys){
    return function connect(Component){
        return function HocComponent(componentProps){
            return (
                <SessionProvider value={clientKeys}>
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
    withSessionProvider, 
    useQuery, 
    useSession
} from '@airma/react-effect';

const clientKey = ...;

const Child = ()=>{
    const [ {data} ] = useSession(clientKey);
    return ......;
}

const App = withSessionProvider(clientKey)(()=>{

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
function useClient(sessionKey){
    return [state, trigger];
}
```

### Parameters

* sessionKey - A session key created by [createSessionKey](/react-effect/api?id=createsessionkey) API.

### Returns

* state - The promise state from nearest SessionProvider store matched with the session key.
* trigger - It is a no parameter callback, returns void. It can be used to trigger query or mutation which is using the same session key manually.

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
};
```

* Strategy.debounce - It returns a debounce strategy. You can set a duration time to make promise callback work debounce with this duration time.
* Strategy.once - It returns a strategy. With it, when your promise callback has resolved a promise, it can not be called again.
* Strategy.error - It returns a strategy. You can provide a error process callback for it. When the promise is rejected, it calls the process callback with error parameter.
* Strategy.success - It returns a strategy. You can provide a success process callback for it. When the promise is resolved, it calls the process callback with data parameter.
* Strategy.memo - It returns a strategy. You can provide a data comparator function for it. This strategy compares promise data with state data, if the result of `equalFn` returns true, it will reuse the state data. The default `equalFn` compares with two JSON.stringify results.

## GlobalProvider

It is a global config provider. If you want to set a global strategy for every `useQuery` and `useMutation` in children, you can use it.

```ts
GlobalProvider props:{
    value: GlobalConfig,
    children?: ReactNode
}
```

### Parameters

* value - It should be global config.
* children - React Nodes

### Example

```ts
import React from 'react';
import {
  GlobalProvider,
  Strategy,
  useQuery
} from '@airma/react-effect';
import type {GlobalConfig} from '@airma/react-effect';

// The GlobalConfig only support rebuild strategy currently.
const config: GlobalConfig = {
  // The strategy is a callback,
  // it accepts a running effect strategy array,
  // and a effect type: 'query' | 'mutation'.
  // You can complete the running strategies
  // with padding strategies,
  // so, the running effect will work with these new strategies.
  // It can be ignored by a local effect config option:
  // `exact: true`
  strategy:(
    s:(StrategyType | undefined| null)[], type: 'query' | 'mutation'
  )=>[...s, Strategy.error((e)=>console.log(e))]
}

const App = ()=>{
  // if the `fetchUsers` is failed,
  // the global config strategy `Strategy.error` works.
  useQuery(fetchUsers, [data]);
  useQuery(fetchGroups, {
    variables: [...ids],
    strategy: [
      Strategy.debounce(300), 
      Strategy.error(...)
    ],
    // tell useQuery to use the current config exactly.
    exact: true
  });
  ......
}

......
{/* Set a ClientConfig */}
<GlobalProvider 
  value={Strategy.error(e => console.log(e))}
>
  <App/>
</GlobalProvider>
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

If `useIsFetching` is in a `GlobalProvider`, and there is no parameter for it, it detects all `useQuery` or `useMutation` in  `GlobalProvider`.