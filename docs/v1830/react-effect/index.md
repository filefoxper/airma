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

Do asynchronous operations in `effects` is more effective.

1. You can pre-render a default result for asynchronous operation before it is really resolved.
2. It makes component render with less asynchronous effects spread in event handle callbacks.
3. React `useEffect` callback is drived by the changes of its dependencies, it can do asynchronous operations more accurately then calling them manually in event handle callbacks.  

Use effect to do asynchronous operations with less `async ... await`:

```ts
import {useEffect, useState} from 'react';
import {query} from './service';

const useQueryEffect = (
  callback:(...args: any[])=>Promise<any>, 
  variables: any[]
)=>{
  const [data, setData] = useState(undefined);
  const [isFetching, setFetching] = useState(false);
  const [error, setError] = useState(undefined);

  useEffect(()=>{
      setFetching(true);
      // The asynchronous operation
      callback(variables).then((d)=>{
          // Set query result into state
          setData(d);
          setError(undefined);
          setFetching(false);
      },(e)=>{
          setError(e);
          setFetching(false);
      });
  }, variables); 
  // The variables change drives asynchronous operation

  // return query state information for render usage
  return {data, isFetching, error};
};

const App = memo(()=>{
    ......
    const [variable, changeVariable] = useState({...});
    // use `useQueryEffect` as a library API.
    const {data, isFetching, error} = useQueryEffect(query, [variable]);

    return ......;
});
```

The example code above is simple enough for understanding the principle of effect asynchronous operations. But, we need a more intelligent effect tool for more complex practical usages.

## Introduce

The target of `@airma/react-effect` is build a more intelligent effect tool for practical usages with less config. We split practical usages to two different application scenarios.

1. For query data, we need API `useQuery`. It should accepts a promise callback, and parameters for this callback. It should returns a promise description state for immediately render. When the parameters are changed or setted, it should call promise callback and response promise resolving to generate next state.
2. For mutate data, we need API `useMutation`. It should accepts a promise callback, and parameters for this callback. It should returns a promise description state for immediately render. The different with `useQuery` is that the operation callback of `useMutation` should be drived manually.

### UseQuery

The code below shows how to use `useQuery` intelligently.

```ts
import React from 'react';
import {useQuery} from '@airma/react-effect';
import {User} from './type';

type UserQuery = {
    name: string;
    username: string;
}
// Prepare a callback which returns a promise.
// We call it a query callback. 
const fetchUsers = (query: UserQuery):Promise<User[]> =>
        Promise.resolve([]);

const App = ()=>{
    const [query, setQuery] = useState({name:'', username:''});
    const [state, trigger, execute] = useQuery(
        // Use query callback
        fetchUsers,
        // Set parameters for query callback
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
        isError,
        // boolean
        loaded
    } = state;

    ......
}
```

The most common field usages about promise state are:

* data - Last successful query promise result. It only can be overrided by next successful query. Before query works, it is `undefined`.
* error - Last failed query promise rejection. It can be overrided to be `undefined` by a next successful query, or be overrided by a next failed query promise rejection.
* isFetching - When the query callback is launched, it turns to be `true`. When the query promise returned by callback is resolved or rejected, it turns to be `false`.
* isError - Use the `error` field value is `undefined` to estimate if the query promise is rejected is not credible. It is much better to use `isError` to estimate if the last query promise is rejected.
* loaded - It shows if the data had been resolved yet. If it is `true`, that means there is at least one successful query happened.

When `useQuery` is mounted, or the elements of parameters are changed, it call the promise callback.

### UseMutation

The usage of `useMutation` is similar with `useQuery`, but it is not drived
by parameter changes, you need to trigger it manually.

```ts
import React from 'react';
import {useMutation} from '@airma/react-effect';
import {User} from './type';

const saveUser = (user: User): Promise<User> => 
    Promise.resolve(user);

const App = ()=>{
    const [user, setUser] = useState<User>({...});
    const [state, trigger] = useMutation(
        // Set mutation callback,
        // it is a promise callback.
        saveUser,
        // Set mutation parameters.
        [ user ]
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
        trigger();
    }

    ......
}
```

The state of `useMutation` has same fields with `useQuery`. You can trigger it to make a `mutation` happen.

Take next section about [installing and browser supports](/react-effect/install.md) or go to [concepts](/react-effect/concepts.md) directly.
