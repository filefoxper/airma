[![npm][npm-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/%40airma/react-effect.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/%40airma/react-effect
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
[npm-downloads-image]: https://img.shields.io/npm/dm/%40airma/react-effect.svg?style=flat-square

# @airma/react-effect

`@airma/react-effect` is designed for managing the asynchronous effect state for react components.

## Why effects

React hook system is designed for synchronous render usage. But asynchronous operations are often used in components, so, take the asynchronous code out of render is a good choice. That's why `useEffect` is useful in hook system, we can set the asynchronous in it, and run it out of the render time.

Good example:

```ts
import {useEffect, useState} from 'react';
import {query} from './service';

const useQueryEffect = (variables)=>{
    const [data, setData] = useState(undefined);
    const [isFetching, setFetching] = useState(false);
    const [error, setError] = useState(undefined);

    useEffect(()=>{
        setFetching(true);
        // limit the asynchronous only in useEffect
        query(variables).then((d)=>{
            // set the query result into state
            setData(d);
            setError(undefined);
            setFetching(false);
        },(e)=>{
            setError(e);
            setFetching(false);
        });
    },[variables]); // when variables change, run query

    // return state information out for render usage
    return {data, isFetching, error};
};

const App = memo(()=>{
    ......
    const {data, isFetching, error} = useQueryEffect(variables);

    return ......;
});
```

Not so good example:

```ts
import {memo, useState} from 'react';
import {query} from './service';

const App = memo(()=>{
    const [data, setData] = useState(undefined);
    const [isFetching, setFetching] = useState(false);
    const [error, setError] = useState(undefined);

    // Use asynchronous callback directly
    // may affect the other operation codes,
    // and make asynchronous operations spread out in component
    const handleQuery = async (variables)=>{
        setFetching(true);
        try {
            const d = await query(variables);
            setData(d);
            setError(undefined);
        } catch(e) {
            setError(e);
        } finally {
            setFetching(false);
        }
    };
    
    // affected by asynchronous callback `handleQuery`
    const handleReset = async ()=>{
        await handleQuery(defaultVariables);
        doSomething();
    };

    useEffect(()=>{
        handleQuery();
    },[]);

    return ......;
}) 
```

Use asynchronous callback all over in component is not a good idea, we need concentrative controllers for limit asynchronous operations in less effects. Then we can have a simple synchronously render component.

Now, Let's take some simple, but more powerful API to replace the code of good example above.

## useQuery

We can wrap a promise return callback to `useQuery`, when the dependecy varaibles change, it fetches data for you.

```ts
import React from 'react';
import {useQuery} from '@airma/react-effect';
import {client} from '@airma/restful';

type UserQuery = {
    name: string;
    username: string;
}

const cli = client();

const App = ()=>{
    const [query, setQuery] = useState({name:'', username:''});
    const [result, execute] = useQuery(
        // query method
        (q: UserQuery)=>
        cli.rest('/api/user/list').
        setParams(q).
        get<User[]>(),
        // dependency vairables change,
        // the query method runs with the newest variables.
        [query]
    );
    const {
        // User[] | undefined
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
        // User[] | undefined
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
          // User[] | undefined
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

The manual execution is not recommend, you may accept an abandoned result, if the execution is not the newest one, in that case, you may have a different result with the hook `useQuery` result. And we have talked the problem about asynchronous code spread out in component.

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
        post<User>(),
        // set variables
        [user]
    );
    const {
        // User | undefined
        data,
        // boolean
        isFetching,
        // any
        error,
        // boolean
        isError
    } = result;

    const handleClick = ()=>{
        // it returns a promise result,
        // but we recommoned you using it as a void returning callback
        execute();
    }

    ......
}
```

The different with `useQuery` is that the `useMutation` can not be truly executed again if the last execution is not finished, it returns the last result for you.

Sometimes we need an mutation only can be executed once. We can take a `Strategy` like `Strategy.once`.

```ts
import React from 'react';
import {useMutation, Strategy} from '@airma/react-effect';
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
        // set strategy
        {
        variables: [user],
        strategy: Strategy.once()
        }
    );
    const {
        // User | undefined
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
          // User | undefined
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

## state sharing

We have provides a `ClientProvider` for sharing the state changes of `useQuery` and `useMutation`.

```ts
import React, {memo} from 'react';
import { client as restClient } from '@airma/restful';
import { useModel, useSelector, factory } from '@airma/react-state';
import { ClientProvider, client, useClient } from '@airma/react-effect';

type UserQuery = {name: string, username: string};

const cli = restClient();

const userQueryModel = (state: UserQuery)=>{
    const {name, username} = state;
    return {
        name,
        username,
        state,
        changeName(e: ChangeEvent){
            return {username, name: e.target.value};
        },
        changeUsername(e: ChangeEvent){
            return {name, username: e.target.value};
        }
    }
}

const queryUsers = (query:UserQuery)=> cli.rest('/api/user/list').
        setParams(query).
        get<User[]>();

const models = {
    userQuery: factory(userQueryModel), // make a customized model key
    queryUsers: client(queryUsers) // make an effect model key
};

const Condition = memo(()=>{
    const {
        name, 
        username, 
        changeName, 
        changeUsername
    } = useModel(models.userQuery);

    // useClient can accept the query state changes
    // from `models.queryUsers`,
    // it also can trigger it query again by `trigger`.
    const [{isFetching}, trigger] = useClient(models.queryUsers);

    return (
        <div>
            <input type="text" value={name} onChange={changeName}/>
            <input 
              type="text" 
              value={username} 
              onChange={changeUsername}
            />
            {/* we disable query button, */}
            {/* when the query is fetching */}
            <button 
              disabled={isFetching} 
              onClick={trigger}
            >
              query
            </button>
        </div>
    )
});

const Datasource = memo(()=>{
    const q = useSelector(models.userQuery,s =>s.state);

    const [
        {
            data,
            isFetching,
            error,
            isError
        }
    ] = useQuery(models.queryUsers, [q]);
    return ......;
});

const App = memo(()=>{
    // yes, 
    // ClientProvider is just the `ModelProvider` in 
    // `@airma/react-state`,
    // you can choose any of them as you wish.
    return (
        <ClientProvider value={models}>
          <Condition/>
          <Datasource/>
        </ClientProvider>
    );
})
```

Now, you can share the query or mutation state any where in a `ClientProvider`. Because the `ClientProvider` is `ModelProvider`, so, they have same features, for example, the useQuery or useAsynEffect find the key in parent Providers, the middle Provider will not block them. You can refer to [ModelProvider](https://filefoxper.github.io/airma/#/react-state/feature?id=scope-state) in [@airma/react-state](https://filefoxper.github.io/airma/#/react-state/index).

## async execution result

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
  // the triggerType describes how this result came out.
  triggerType: undefined | 'mount' | 'update' | 'manual'
};
```
## API

### useQuery

To execute a query promise callback.

```ts
function useQuery<
  D extends PromiseEffectCallback<any> | ModelPromiseEffectCallback<any>
>(
  callback: D,
  config?: QueryConfig<PCR<D>, MCC<D>> | Parameters<MCC<D>>
): [PromiseResult<PCR<D>>, () => Promise<PromiseResult<PCR<D>>>];
```

parameters:

* callback - a callback returns a promise, or a effect model. When it is a `effect model`, the query result will be shared out to any place in a ClientProvider.
* config - it is optional. If you set nothing, it means you want to execute it manually. It can be an tuple array as parameters for callback. It can be a config object to set features of this query.

config:

* variables - you can set an array as parameters for query, when the elements change, the query callback runs.
* deps - you can set an array as dependencies, sometimes you may want to drive query callback running by the different dependencies with variables.
* manual - set manual `true`, means you want to execute the query manually, then the deps and variables change will not affect the query callback running.
* strategy - you can set a strategy function or a strategy array to make query callback running with the strategy you want, for example: `debounce`, `once`. If it is an array, the query follows running order from outside to inside.
* exact - a boolean value, for ignore the affect from a global `ClientConfigProvider` config. 

returns:

```ts
[
  result,
  execute,
  callback
]
```

The `execute` function has no parameters, it uses `variables` from `useQuery` as inner parameters.

The `callback` function accepts parameters, you can set temporary parameters for executing again.

Both of `execute` and `callback` works a `manual` triggerType.

### useMutation

To execute a mutation promise callback, it can only be drived manually by calling the returning method `execute`.

```ts
function useMutation<
  D extends PromiseEffectCallback<any> | ModelPromiseEffectCallback<any>
>(
  callback: D,
  config?: MutationConfig<PCR<D>, MCC<D>> | Parameters<MCC<D>>
): [PromiseResult<PCR<D>>, () => Promise<PromiseResult<PCR<D>>>];
```

parameters:

* callback - a callback returns a promise, or a effect model. When it is a `effect model`, the query result will be shared out to any place in a ClientProvider.
* config - it is optional. It can be an tuple array as parameters for callback. It can be a config object to set features of this mutation.

config:

* variables - you can set an array as parameters for query, when the elements change, the mutation callback runs.
* strategy - you can set a strategy function or a strategy array to make query callback running with the strategy you want, for example: `debounce`, `once`. If it is an array, the query follows running order from outside to inside. 
* exact - a boolean value, for ignore the affect from a global `ClientConfigProvider` config. 

returns:

```ts
[
  result,
  execute,
  callback
]
```

The `execute` function has no parameters, it uses `variables` from `useMutation` as inner parameters.

The `callback` function accepts parameters, you can set temporary parameters for executing again.

Both of `execute` and `callback` works a `manual` triggerType.

### client ~~asyncEffect~~

It is used to generate a `effect model` with effect( promise ) callback. We can provide it as a key to `ClientProvider` or [ModelProvider](https://filefoxper.github.io/airma/#/react-state/api?id=modelprovider) in `@airma/react-state` for state sharing. And use `useQuery` or `useMutation` to link it, and fetching the query state.

```ts
function client<
  E extends (...params: any[]) => Promise<any>,
  T = E extends (...params: any[]) => Promise<infer R> ? R : never
>(effectCallback: E): ModelPromiseEffectCallback<E>;
```

parameters:

* effectCallback - a callback returns a promise.

returns

A [react-state factory model](https://filefoxper.github.io/airma/#/react-state/api?id=factory) with effect( promise ) callback.

### useClient ~~useAsyncEffect~~

It is used to accept the state change from `useQuery` or `useMutation` with a same `effect model`.

```ts
function useClient<
  D extends ModelPromiseEffectCallback<any>
>(effectModel: D): [PromiseResult<PCR<D>>, () => void];
```

parameters:

* effectModel - an `effect model` created by `client` API.

returns:

```ts
[
  result,
  trigger
]
```

The trigger method is different with `execute` method returned by `useQuery` and `useMutation`. It returns void, that means it can not be `await`.

### CilentProvider ~~EffectProvider~~

You can refer it to [ModelProvider](https://filefoxper.github.io/airma/#/react-state/api?id=modelprovider) in `@airma/react-state`.

### withClientProvider ~~withEffectProvider~~

You can refer it to [withModelProvider](https://filefoxper.github.io/airma/#/react-state/api?id=withmodelprovider) in `@airma/react-state`.

### ClientConfigProvider ~~EffectConfigProvider~~

It is a react `Provider` for setting global config for every `useQuery` and `useMutation` in `children`, it can be ignored by the local config option `exact`.

```ts
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

</ClientConfigProvider>
```

### Strategy

It provides some useful effect running `Strategy` for you.

```ts
const Strategy:{
  debounce: (op: { time: number } | number) => StrategyType,
  once: () => StrategyType
  error: (
    process: (e: unknown) => any,
    option?: { withAbandoned?: boolean }
  ) => StrategyType;
};
```

You can use it to the config `strategy` in `useQuery` and `useMutation`.

For example:

```ts
import {
  Strategy,
  useQuery
} from '@airma/react-effect';

const useUserList = (...ids:number[])=>{
  useQuery(fetchUsers, {
    variables: [...ids],
    strategy: [
      Strategy.debounce(300),
      Strategy.error((e) =>console.log(e))
    ]
  })
};
```

#### debounce 

you can set a debounce running time to it. like:

```ts
useQuery(callback,{
    variables:[...],
    strategy: Strategy.debounce({time:300})
})
```

Then the query callback runs with this debounce strategy.

#### once

It is used to force the query or mutation callback only runs once, if no error comes out.

#### error

You can set a callback to process the error information from promise rejection.

Use it as a global effect config strategy can help you reduce the codes for dealing a common error process.

```ts
import {
  Strategy,
  ClientConfigProvider
} from '@airma/react-effect';

const error = Strategy.error((e) =>console.log(e));

const config = {
  strategy: (s)=>[...s, error]
}

<ClientConfigProvider value={config}>
......
</ClientConfigProvider>
```

By the default, it only process the error result which is not abandoned. You can set `{withAbandoned: true}` for dealing includes the abandoned errors.

```ts
import {
  Strategy,
  ClientConfigProvider
} from '@airma/react-effect';

const error = Strategy.error(
  (e) =>console.log(e),
  {withAbandoned: true}
);

const config = {
  strategy: (s)=>[...s, error]
}

<ClientConfigProvider value={config}>
......
</ClientConfigProvider>
```

#### success

You can set a callback to process the data from promise resolve.

```ts
import React from 'react';
import {
  Strategy,
  useQuery
} from '@airma/react-effect';
import service from './service';

const App = ()=>{

  const [datasource, updateDatasource] = useState([]);

  useQuery(service.fetch,{
    variables: [{name:'name'}],
    strategy: Strategy.success((d)=>updateDatasource(d||[]))
  })

  return ......;
}
```

By the default, it only process the data result which is not abandoned. You can set `{withAbandoned: true}` for dealing includes the abandoned result.

```ts
import React from 'react';
import {
  Strategy,
  useQuery
} from '@airma/react-effect';
import service from './service';

const App = ()=>{

  const [datasource, updateDatasource] = useState([]);

  useQuery(service.fetch,{
    variables: [{name:'name'}],
    strategy: Strategy.success((d)=>updateDatasource(d||[]),{
      withAbandoned: true
    })
  })

  return ......;
}
```

We suggest you use `Strategy.success` without setting a `{withAbandoned: true}` config, for the abandoned data is not helpful, and it would not be exsit in the useQuery or useMutation render state history.

## Write Strategy

You can write Strategy yourself, it is a simple work.

```ts
export type StrategyType<T = any> = (
  getCurrentState: () => PromiseResult<T>,
  runner: () => Promise<PromiseResult<T>>,
  storeRef: { current: any }
) => Promise<PromiseResult<T>>;
```

A Strategy function accepts a parameter with properties:

* current - A callback returns a current promise result.
* runner - The wrapped effect callback, returns a promise.
* store - A store for your Strategy, you can store any thing which is helpful for your Strategy.
* variables - The variables for current query or mutation.

For example:

```ts
function once(): StrategyType {

  // this inner function is a Strategy
  return function oc(value: {
    current: () => PromiseResult;
    runner: () => Promise<PromiseResult>;
    store: { current?: boolean };
  }) {
    const { current, runner, store } = value;
    // It store a boolean value to tell 
    // if the effect callback is started.
    // If this value is true,
    // it returns a current state promise,
    // and mark it to abandoned.
    if (store.current) {
      return new Promise(resolve => {
        // use current callback to fetch the current data,
        // which is returned by the useQuery
        const currentState = current();
        resolve({ ...currentState, abandon: true });
      });
    }
    // If the store value is false,
    // it marks it as started,
    // then truely start it.
    store.current = true;
    return runner().then(d => {
      if (d.isError) {
        // if the promise is error,
        // mark it to false again,
        // the the effect callback can be started again.
        store.current = false;
      }
      return d;
    });
  };
};
```