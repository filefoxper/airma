[![npm][npm-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/%40airma/react-effect.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/%40airma/react-effect
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
[npm-downloads-image]: https://img.shields.io/npm/dm/%40airma/react-effect.svg?style=flat-square

# @airma/react-effect

**@airma/react-effect** is an asynchronous state-management tool for react.

## Code first

### UseQuery

API `useQuery` can query data, and set it as a state.

```ts
import React from 'react';
import {useQuery} from '@airma/react-effect';
import {User} from './type';

type UserQuery = {
    name: string;
    username: string;
}
// Prepare a query promise callback.
const fetchUsers = (query: UserQuery):Promise<User[]> =>
        Promise.resolve([]);

const App = ()=>{
    const [query, setQuery] = useState<UserQuery>({name:'', username:''});
    const [state, trigger, executeWithParams] = useQuery(
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

By default, the actions about parameters effect and manual trigger can make **useQuery** run the promise callback.

### UseMutation

API **useMutation** is similar with **useQuery**. The difference is that it only can be triggered manually by default.

```ts
import React from 'react';
import {useMutation} from '@airma/react-effect';
import {User} from './type';

const saveUser = (user: User): Promise<User> => 
    Promise.resolve(user);

const App = ()=>{
    const [user, setUser] = useState<User>({...});
    const [
        state, 
        trigger, 
        executeWithParams
    ] = useMutation(
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

The state of useMutation has same fields with useQuery state.

### Session

Both of useQuery and useMutation need a promise callback for working, they build a [session](concepts?id=session) to manage the promise processing state.

Use a simplified API [session](api?id=session) to make coding fly.

```ts
import React from 'react';
import {session} from '@airma/react-effect';
import {User} from './type';

type UserQuery = {
    name: string;
    username: string;
}

// use `session` API to declare a query session
const userQuerySession = session(
    (query: UserQuery):Promise<User[]> =>
        Promise.resolve([]),
    'query'
);

const App = ()=>{
    const [query, setQuery] = useState<UserQuery>({name:'', username:''});
    const [
        state, 
        trigger, 
        executeWithParams
        // call session.useQuery
    ] = userQuerySession.useQuery(
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

The code above shows how to use **useQuery/useMutation** managing a local session state. In fact, they also can be used to subscrible store session state. There are two different session stores: dynamic store and static store.

### Dynamic store state-management

```ts
import React from 'react';
import {session} from '@airma/react-effect';
import {User} from './type';

type UserQuery = {
    name: string;
    username: string;
}

// declare a query session key
const userQueryKey = session(
    (query: UserQuery):Promise<User[]> =>
        Promise.resolve([]),
    'query'
).createKey();

const SearchButton = ()=>{
    // useSession subscribes state change from session store
    const [
        // state from session store
        {isFetching},
        // call trigger function can trigger useQuery work manually 
        triggerQuery
    ] = userQueryKey.useSession();
    return (
        <button 
            disabled={isFetching} 
            onClick={triggerQuery}
        >
        query
        </button>
    );
}

// provide keys to create store inside the elements of Provider component.
const App = provide(userQueryKey).to(()=>{
    const [query, setQuery] = useState({name:'', username:''});
    const [
        state, 
        // Write every query state change to store
    ] = userQueryKey.useQuery(
        [query]
    );

    ......

    return (
        <>
            <SearchButton />
            ......
        </>
    );
})
```

Dynamic store is created from session key inside a Provider component element. In the children scope of Provider, components can use session key to find and subscribe session state. The different elements created from one component take different stores.

### Static store state-management

```ts
import React from 'react';
import {session} from '@airma/react-effect';
import {User} from './type';

type UserQuery = {
    name: string;
    username: string;
}

// create a query session static store
const userQueryStore = session(
    (query: UserQuery):Promise<User[]> =>
        Promise.resolve([]),
    'query'
).createStore();

const SearchButton = ()=>{
    const [
        {
            isFetching,
            // User[] | undefined
            data
        },
        triggerQuery
    ] = userQueryStore.useSession();
    return (
        <button 
            disabled={isFetching} 
            onClick={triggerQuery}
        >
        query
        </button>
    );
}

// The static store needs no Provider.
const App = ()=>{
    const [query, setQuery] = useState({name:'', username:''});
    const [
        state
    ] = userQueryStore.useQuery(
        [query]
    );

    ......

    return (
        <>
            <SearchButton />
            ......
        </>
    );
}
```

The **state.data** from useSession is always has a **undefined** union type. API [useLoadedSession](api?id=useloadedsession) can be helpful if the session has a default data, or it had been loaded already. 

```ts
import React from 'react';
import {session} from '@airma/react-effect';
import {User} from './type';

type UserQuery = {
    name: string;
    username: string;
}

const userQueryStore = session(
    (query: UserQuery):Promise<User[]> =>
        Promise.resolve([]),
    'query'
).createStore();

const SearchButton = ()=>{
    // store.useLoadedSession can give out the promise resolve type without `empty`.
    const [
        {
            isFetching,
            // User[]
            data
        },
        triggerQuery
    ] = userQueryStore.useLoadedSession();
    return (
        <button 
            disabled={isFetching} 
            onClick={triggerQuery}
        >
        query
        </button>
    );
}

const App = ()=>{
    const [query, setQuery] = useState({name:'', username:''});
    const [
        state
    ] = userQueryStore.useQuery(
        // use object config to set default data
        {
            variables: [query],
            // To make `state.data` not empty,
            // a default data is needed.
            defaultData: []
        }
    );

    ......

    return (
        <>
            <SearchButton />
            ......
        </>
    );
}
```

Want to do something when query or mutation responses?

```ts
import React from 'react';
import {session, useResponse} from '@airma/react-effect';
import {User} from './type';

type UserQuery = {
    name: string;
    username: string;
}

const userQuerySession = session(
    (query: UserQuery):Promise<User[]> =>
        Promise.resolve([]),
    'query'
);

const App = ()=>{
    const [query, setQuery] = useState({name:'', username:''});
    const [
        state
    ] = userQuerySession.useQuery(
        [query]
    );
    
    // When useQuery/useMutation responses, 
    // useResponse calls the response callback.
    useResponse(
        // response callback
        (sessionState)=>{
            // accept a newest session state.
            const {
                data,
                isError,
                error,
                ......
            } = sessionState;
            doSomething(sessionState);
        }, 
        // listen to the session state of useQuery
        state
    );

    // When useQuery/useMutation responses successfully, 
    // useResponse.useSuccess calls the response callback.
    useResponse.useSuccess(
        (data, sessionState)=>{
            // accept a newst session state data.
            // accept a newest session state.
            doSomething(data);
        }, 
        // listen to the session state of useQuery
        state
    );

    // When useQuery/useMutation responses unsuccessfully, 
    // useResponse.useFailure calls the response callback.
    useResponse.useFailure(
        (error, sessionState)=>{
            // accept a newst session state error.
            // accept a newest session state.
            doSomething(error);
        }, 
        // listen to the session state of useQuery
        state
    );
    ......
}
```

Want to run useQuery or useMutation with some features like debounce?

### Strategy

```ts
import React from 'react';
import {session, Strategy} from '@airma/react-effect';
import {User} from './type';

type UserQuery = {
    name: string;
    username: string;
}

const userQuerySession = session(
    (query: UserQuery):Promise<User[]> =>
        Promise.resolve([]),
    'query'
);

const App = ()=>{
    const [query, setQuery] = useState({name:'', username:''});
    const [
        state, 
        trigger, 
        executeWithParams
    ] = userQuerySession.useQuery(
        {
            variables: [query],
            // set a debouce strategy to take debounce query feature.
            strategy: Strategy.debounce(300)
        }
    );

    ......
}
```

The [Strategy](api?id=strategy) API contains some useful strategies for useQuery and useMutation. Compose some strategies together can make the session of useQuery/useMutation performance wonderfully.

```ts
import React from 'react';
import {session, Strategy} from '@airma/react-effect';
import {User} from './type';

type UserQuery = {
    name: string;
    username: string;
}

const userQuerySession = session(
    (query: UserQuery):Promise<User[]> =>
        Promise.resolve([]),
    'query'
);

const App = ()=>{
    const [query, setQuery] = useState({name:'', username:''});
    const [
        state, 
        trigger, 
        executeWithParams
    ] = userQuerySession.useQuery(
        {
            variables: [query],
            // compose different strategies.
            strategy: [
                // Validate query.name is not empty,
                // if it is empty, then stop execute query
                Strategy.validate(()=>!!query.name),
                // Query with debounce feature
                Strategy.debounce(300),
                // If the response data equals with the stale state.data,
                // use the stale state.data.
                Strategy.memo()
            ]
        }
    );

    ......
}
```

Want to use SWR(stale-while-revalidate)?

```ts
import React from 'react';
import {session, Strategy} from '@airma/react-effect';
import {User} from './type';

type UserQuery = {
    name: string;
    username: string;
}

const userQuerySession = session(
    (query: UserQuery):Promise<User[]> =>
        Promise.resolve([]),
    'query'
);

const App = ()=>{
    const [query, setQuery] = useState({name:'', username:''});
    const [
        state, 
        trigger, 
        executeWithParams
    ] = userQuerySession.useQuery(
        {
            variables: [query],
            strategy: [
                // use swr strategy
                Strategy.cache({
                    // the default cache capacity is 1.
                    capacity: 10,
                    // set a stale time to clear stale cache data 
                    staleTime: 5*60*1000
                })
            ]
        }
    );

    ......
}
```

## Introduce

**@airma/react-effect** is an asynchronous state-management tool for react. It dependents [@airma/react-state](/react-state/index), and there are some similar apis between both packages, so, use a integrated package [@airma/react-hooks](/react-hooks/index) is a better choice.

### Why not use setState in asynchronous callback?

Setting state in asynchronous callback is more easy to take a stale state usage bug in code. And it often makes [zombie-children](https://react-redux.js.org/api/hooks#stale-props-and-zombie-children) problem too.

## Install and Support

The package lives in [npm](https://www.npmjs.com/get-npm). To install the latest stable version, run the following command:

### Install command

```
npm i @airma/react-effect
```

### Browser support

```
chrome: '>=91',
edge: '>=91',
firefox: '=>90',
safari: '>=15'
```

Take next section [concepts](concepts).
