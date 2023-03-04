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

If you are ready to improve your react app codes with less asynchronous operation effects, please take minutes to read the [documents](https://filefoxper.github.io/airma/#/react-effect/index) of this tool. 

## Basic Usage

The basic hook API `useQuery` and `useMutation` maintains a promise result state. It contains promise information `data`, `error` and status `isFetching`, `isError` for a render help.

### UseQuery

This API is often used to query data with a promise returning callback and parameters for this callback. When `useQuery` is mounted, or the elements of parameters changed, it calls query callback.

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

The hook API `useQuery` returns a tuple `[state, trigger, execute]`. Element `state` contains informations about this query action. Element `trigger` is a no parameter callback which returns a `state` promise, it should be used just like a query trigger. Element `execute` is a callback which accepts parameters, and returns a `state` promise.

If you don't want the auto query action happens, when the parameters are changed or setted first time, you should set optional config `manual` to stop it.

```ts
import React from 'react';
import {useQuery} from '@airma/react-effect';
import {User} from './type';

const fetchUsers = (query: UserQuery):Promise<User[]> =>
        Promise.resolve([]);

const App = ()=>{
    const [query, setQuery] = useState({name:'', username:''});
    const [state, trigger] = useQuery(
        fetchUsers,
        // Set optional config manual
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
        isError,
        // boolean
        loaded
    } = state;

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
          abandon,
          // boolean
          loaded
        } = await trigger();
    }

    ......
}
```

We do not recommend using the result promise returned by a `trigger` callback, and that's why we call it a `trigger`.

### UseMutation

It is often used to mutate data with a promise returning callback and its parameters. It is always triggered or executed manually.

```ts
import React from 'react';
import {useMutation} from '@airma/react-effect';
import {User} from './type';

const saveUser = (user: User): Promise<User> =>Promise.resolve(user);

const App = ()=>{
    const [user, setUser] = useState({name:'', username:''});
    const [state, trigger, execute] = useMutation(
        // Provide mutation callback
        saveUser,
        // Set parameters
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
        // boolean
        loaded
    } = state;

    const handleClick = ()=>{
        // Trigger it manually
        trigger();
    }

    ......
}
```

It only works in `manual` mode, so you don't have to worry about the auto mutation happening.

### Use Strategy

Sometimes you want to control the running way about the promise callback.

For example, we often save data oncely, and then unmount component immediately after saving success to prevent a repeat saving mistake. 

```ts
import React from 'react';
import {useMutation, Strategy} from '@airma/react-effect';
import {User} from './type';

const saveUser = (user:User):Promise<User> => 
    Promise.resolve(user);

const App = ()=>{
    const [user, setUser] = useState({name:'', username:''});
    const [state, trigger] = useMutation(
        saveUser,
        // Set variables and strategy
        {
        variables: [user],
        // Set Strategy.once()
        strategy: Strategy.once()
        }
    );

    const handleClick = async ()=>{
        trigger();
    }

    ......
}
```

## Share promise state changes

There are steps you need to do for sharing promise state changes.

1. Create a `client` for every promise callback.
2. Set `clients` to `ClientProvider` for creating state store.
3. Use `client` as a key to store in `ClientProvider`, and build a persistent link with the right state.

```ts
import React, {memo} from 'react';
import { 
  ClientProvider, 
  client, 
  useClient, 
  useQuery 
} from '@airma/react-effect';
import {User} from './type';

const fetchLoginUser = (query:UserQuery):Promise<User>=> 
    Promise.resolve({...});

// Create a `client`
const loginUser = client(fetchLoginUser);

const Child1 = memo(()=>{
  // Query for current login user.
  // Update promise state into store
  // with client `loginUser`
  const [ state ] = useQuery(loginUser,[]);

  return ......;
});

const Child2 = memo(()=>{
  // Take and subscribe promise state changes
  // of client `loginUser` in store.
  const [ state ] = useClient(loginUser);

  return ......;
});

const App = memo(()=>{
  // Set client `loginUser` into `ClientProvider`,
  // and create a store inside.
  return (
      <ClientProvider value={loginUser}>
        <Child1/>
        <Child2/>
      </ClientProvider>
  );
})
```

## Summary

The common usages about `@airma/react-effect` are listed above, if you want to know more about it, please take this [document](https://filefoxper.github.io/airma/#/react-effect/index).