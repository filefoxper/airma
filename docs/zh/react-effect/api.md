# API

## useQuery

It is used to maintain a query state.

```ts
function useQuery(callback, variables){
    return [state, trigger, execute];
}
```

### Parameters

* callback - It can be a promise callback `(...variables:any[])=>Promise<any>` or a client key `client((...variables:any[])=>Promise<any>)`.
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
    triggerOn?: TriggerType[],
    // to ignore the global config from `ClientConfigProvider`
    exact?: boolean
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

* callback - It can be a promise callback `(...variables:any[])=>Promise<any>` or a client key `client((...variables:any[])=>Promise<any>)`.
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
    triggerOn?: TriggerType[],
    // to ignore the global config from `ClientConfigProvider`
    exact?: boolean
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

## client

It is used to create a client key from a promise callback.

```ts
function client(promiseCallback){
    return ClientKey;
}
```

### Parameters

* promiseCallback - It should be a callback returns a promise.

### Returns

* ClientKey - It is a client key model. It can be provided to ClientProvider() for creating a store. And with this key inside ClientProvider, you can broadcast or accept state changes. 

## ClientProvider

It is a React Context Provider component. It is used for creating a scope store by using client keys.

```ts
ClientProvider props:{
    value: <client keys>,
    children?: ReactNode
}
```

### Parameters

* value - It should be client keys, an object with client key values or just a simple client key.
* children - React Nodes

### Returns

It returns a React element.

## withClientProvider

It is a HOC mode for ClientProvider.

```ts
function withClientProvider(clientKeys){
    return function connect(Component){
        return function HocComponent(componentProps){
            return (
                <ClientProvider value={clientKeys}>
                  <Component {...componentProps}/>
                </ClientProvider>
            );
        }
    }
}
```

### Example

```ts
import React from 'react';
import {
    withClientProvider, 
    useQuery, 
    useClient
} from '@airma/react-effect';

const clientKey = ...;

const Child = ()=>{
    const [ {data} ] = useClient(clientKey);
    return ......;
}

const App = withClientProvider(clientKey)(()=>{

    useQuery(clientKey, []);

    return (
        <div>
            <Child/>
        </div>
    );
})
```

## useClient

It is a react hook used to accept state changes from the nearest mathced [ClientProvider](/react-effect/api?id=clientprovider).

```ts
function useClient(clientKey){
    return [state, trigger];
}
```

### Parameters

* clientKey - A client key created by [client](/react-effect/api?id=client) API.

### Returns

* state - The promise state from nearest ClientProvider store matched with the clientKey.
* trigger - It is a no parameter callback, returns void. It can be used to trigger query or mutation which is using the same client key manually.

## useStatus

It is used to summary status from promise states or clients.

```ts
function useStatus(...stateOrclients){
    return Status;
}
```

### Parameters

* stateOrclients - It is a parameter array. You can set what a `useQuery` or `useMutation` return to it, or extract the promise states to it.

### Returns

Status is a summary object for clients.

```ts
type Status = {
  // If some states are fetching
  isFetching: boolean;
  // If all states has loaded data
  loaded: boolean;
  // If there are some rejections
  isError: boolean;
  // If all states are successed.
  isSuccess: boolean;
}
```

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
};
```

* Strategy.debounce - It returns a debounce strategy. You can set a duration time to make promise callback work debounce with this duration time.
* Strategy.once - It returns a strategy. With it, when your promise callback has resolved a promise, it can not be called again.
* Strategy.error - It returns a strategy. You can provide a error process callback for it. When the promise is rejected, it calls the process callback with error parameter.
* Strategy.success - It returns a strategy. You can provide a success process callback for it. When the promise is resolved, it calls the process callback with data parameter.

## ClientConfigProvider

It is a global config provider. If you want to set a global strategy for every `useQuery` and `useMutation` in children, you can use it.

```ts
ClientConfigProvider props:{
    value: ClientConfig,
    children?: ReactNode
}
```

### Parameters

* value - It should be client config.
* children - React Nodes

### Example

```ts
import React from 'react';
import {
  ClientConfigProvider,
  Strategy,
  useQuery
} from '@airma/react-effect';
import type {ClientConfig} from '@airma/react-effect';

// The ClientConfig only support rebuild strategy currently.
const config: ClientConfig = {
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
<ClientConfigProvider 
  value={Strategy.error(e => console.log(e))}
>
  <App/>
</ClientConfigProvider>
```

