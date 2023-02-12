[![npm][npm-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/%40airma/react-effect.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/%40airma/react-effect
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
[npm-downloads-image]: https://img.shields.io/npm/dm/%40airma/react-effect.svg?style=flat-square

# @airma/react-effect

This tool is used for managing the side effect state of react app. 

## async effect

There are two async effects currently, `useQuery` and `useMutation`. They can accept a Promise callback, and returns the execution result of the Promise.

### useQuery

We can wrap a promise return callback to `useQuery`, when the dependecies changes, it querys data for you.

```ts
import React from 'react';
import {useQuery} from '@airma/react-effect';
import {client} from '@airma/restful';

const cli = client();

const App = ()=>{
    const [query, setQuery] = useState({name:'', username:''});
    const [result, execute] = useQuery(
        // query method
        ()=>
        cli.rest('/api/user/list').
        setParams(query).
        get<User[]>(),
        // when the elements of dependencies `[query]` changes,
        // or the first time of the hook `useQuery` is loaded,
        // it execute the query method.
        [query]
    );
    const {
        // User[]
        data,
        // boolean
        isFetching,
        // any
        error,
        // boolean
        isError
    } = result;

    ......
}
```

If you want to execute the query manually, you can set `manual:true` to the config.

```ts
import React from 'react';
import {useQuery} from '@airma/react-effect';
import {client} from '@airma/restful';

const cli = client();

const App = ()=>{
    const [query, setQuery] = useState({name:'', username:''});
    const [result, execute] = useQuery(
        // query method
        ()=>
        cli.rest('/api/user/list').
        setParams(query).
        get<User[]>(),
        // set manual execution, 
        // now, you need to call `execute` to query data. 
        {manual: true}
    );
    const {
        // User[]
        data,
        // boolean
        isFetching,
        // any
        error,
        // boolean
        isError
    } = result;

    const handleClick = async ()=>{
        const {
          // User[]
          data,
          // boolean
          isFetching,
          // any
          error,
          // boolean
          isError,
          // boolean
          // the result might be abandoned,
          // if the execution is not the newest one.
          abandon
        } = await execute();
    }

    ......
}
```

The manual execution is not recommend, you may accept an abandoned result, if the execution is not the newest one, in that case, you may have a different result with the hook `useQuery` result.

### useMutation

To execute a mutation, you can use `useMutation`. It only can be executed manually.

```ts
import React from 'react';
import {useMutation} from '@airma/react-effect';
import {client} from '@airma/restful';

const cli = client();

const App = ()=>{
    const [user, setUser] = useState({name:'', username:''});
    const [result, execute] = useMutation(
        // mutation method
        (u:User)=>
        cli.rest('/api/user').
        setBody(u).
        post<User>()
    );
    const {
        // User
        data,
        // boolean
        isFetching,
        // any
        error,
        // boolean
        isError
    } = result;

    const handleClick = async ()=>{
        const {
          // User[]
          data,
          // boolean
          isFetching,
          // any
          error,
          // boolean
          isError,
          // boolean
          abandon
        } = await execute();
    }

    ......
}
```

The different with `useQuery` is that the `useMutation` can not be truly executed again if the last execution is not finished, it returns the last result for you.

Sometimes we need an mutation to be inexecutable when the last execution is finished successly, we can use config `repeatable:false` to do this.

```ts
import React from 'react';
import {useMutation} from '@airma/react-effect';
import {client} from '@airma/restful';

const cli = client();

const App = ()=>{
    const [user, setUser] = useState({name:'', username:''});
    const [result, execute] = useMutation(
        // mutation method
        (u:User)=>
        cli.rest('/api/user').
        setBody(u).
        post<User>(),
        // set repeatable false,
        // makes the mutation only one shot
        {
        repeatable:false
        }
    );
    const {
        // User
        data,
        // boolean
        isFetching,
        // any
        error,
        // boolean
        isError
    } = result;

    const handleClick = async ()=>{
        const {
          // User[]
          data,
          // boolean
          isFetching,
          // any
          error,
          // boolean
          isError,
          // boolean
          abandon
        } = await execute();
    }

    ......
}
```

We often execute a query after a mutation is finished, we can set `after` callback into the config, and after the mutation is finished, it will execute the query.

```ts
import React from 'react';
import {useMutation, useQuery} from '@airma/react-effect';
import {client} from '@airma/restful';

const cli = client();

const App = ()=>{
    ......

    const [queryResult, executeQuery] = useQuery(()=>..., [...]);
    const [user, setUser] = useState({name:'', username:''});
    const [result, execute] = useMutation(
        // mutation method
        (u:User)=>
        cli.rest('/api/user').
        setBody(u).
        post<User>(),
        // set after callback,
        // it accepts the async execution result of mutation,
        // and runs after the mutation is finished.
        {
          repeatable:false,
          after:({isError})=>{
            if ( !isError ) {
                executeQuery();
            }
          }
        }
    );
    const {
        // User
        data,
        // boolean
        isFetching,
        // any
        error,
        // boolean
        isError
    } = result;

    const handleClick = async ()=>{
        const {
          // User[]
          data,
          // boolean
          isFetching,
          // any
          error,
          // boolean
          isError,
          // boolean
          abandon
        } = await execute(user);
    }

    ......
}
```

The `after` callback can accepts a async execution result.

### async execution result

The promise result is a unitary result format for both useQuery and useMutation.

```ts
export declare type PromiseResult<T> = {
  // the promise result of the callback,
  // you provided for useQuery or useMutation  
  data: T | undefined;
  // error of the promise
  error?: any;
  // is some errors happens,
  // it is marked when the promise is rejected.
  isError: boolean;
  // if the execution is not finished, it is true,
  // otherwise, it is false
  isFetching: boolean;
  // is the result is abandoned
  abandon: boolean;
};
```

## useSideEffect

If you want to make a side effect state management without promise, you can use this API.

```ts
import React from 'react';
import {useSideEffect} from '@airma/react-effect';

const App = ()=>{
    const [second, execute] = useSideEffect(response => {
        const id = window.setInterval(() => {
            response(s => s + 1);
        }, 1000);
        return () => clearInterval(id);
    }, 0); // 0 is the default state
}
```

As the proto hook of `useQuery`, you can also use the config and dependencies like `useQuery`.

```ts
import React from 'react';
import {useSideEffect} from '@airma/react-effect';

const App = ()=>{
    const [state, setState] = useState(...);
    const [second, execute] = useSideEffect(response => {
        const id = window.setInterval(() => {
            response(s => s + 1);
        }, 1000);
        return () => clearInterval(id);
    }, 0, [state]);
    // when state change, it will clear last interval,
    // then setInterval again.
}
```

You can start it manually.

```ts
import React from 'react';
import {useSideEffect} from '@airma/react-effect';

const App = ()=>{
    const [state, setState] = useState(...);
    const [second, execute] = useSideEffect(response => {
        const id = window.setInterval(() => {
            response(s => s + 1);
        }, 1000);
        return () => clearInterval(id);
    }, 0, {manual:true});
    // use manual execution
}
```

You can destroy it manualy. Yes, the destroy function is not exist in `useQuery` result.

```ts
import React from 'react';
import {useSideEffect} from '@airma/react-effect';

const App = ()=>{
    const [state, setState] = useState(...);
    const [second, execute, destroy] = useSideEffect(response => {
        const id = window.setInterval(() => {
            response(s => s + 1);
        }, 1000);
        return () => clearInterval(id);
    }, 0);
    // destroy the side effect will clear interval forcely,
    // if it has been created.
    const handleDestroy=()=>destroy();
}
```

## API

### useQuery

To execute a query promise callback.

```ts
export declare function useQuery<T>(
  callback: () => Promise<T>,
  config?: { deps?: any[]; manual?: boolean } | any[]
): [PromiseResult<T>, () => Promise<PromiseResult<T>>];
```

parameters:

* callback - a callback returns a promise, and it should has no parameters.
* config - it is optional, if you set nothing, the query will be executed once when the hook is mounted, if you set an array dependencies for it, it querys when the hook is mounted or the dependencies element changes. Set `{ manual:true }` allows you execute it manually.

returns:

```ts
[
  result,
  execute
]
```

### useMutation

To execute a mutation promise callback.

```ts
export declare function useMutation<
  T,
  C extends (...params: any[]) => Promise<T>
>(
  callback: C,
  config?: { after?: () => any; repeatable?: boolean }
): [
  PromiseResult<T>,
  (...params: Parameters<typeof callback>) => Promise<PromiseResult<T>>
];
```

parameters:

* callback - a callback returns a promise, it can accept parameters, when execute it, you need to pass paramters for it.
* config - it is optional. Set `repeatable: true` limits the execution only can work once, if the execution is successed. the `after` callback will be called, when the execution is finished.

returns:

```ts
[
  result,
  execute
]
```

### useSideEffect

To make a side effect state management.

```ts
export declare type ResponseParam<T> = T | ((d: T) => T);

export declare type ResponseType<T> = (data: ResponseParam<T>) => void;

export declare type SideEffectCallback<T> = (response: ResponseType<T>) => any;

export declare function useSideEffect<T, C extends SideEffectCallback<T>>(
  callback: C,
  defaultState: T,
  config?: { deps?: any[]; manual?: boolean } | any[]
): [T, () => ReturnType<C>, { destroy: () => any }];
```

parameters:

* callback - a callback accept a response callback as a parameter.
* defaultState - you need to give it a defaultState.
* config - it is optional, if you set nothing, the query will be executed once when the hook is mounted, if you set an array dependencies for it, it querys when the hook is mounted or the dependencies element changes. Set `{ manual:true }` allows you execute it manually.

The response callback is like a setState from `useState`. You can use it to set the side effect state.

returns:

```ts
[
  result,
  execute
]
```
