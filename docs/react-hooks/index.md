[![npm][npm-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/%40airma/react-hooks.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/%40airma/react-hooks
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
[npm-downloads-image]: https://img.shields.io/npm/dm/%40airma/react-hooks.svg?style=flat-square

# @airma/react-hooks

`@airma/react-hooks` is a composite package for: 

* [@airma/react-state](/react-state/index): React synchronous state management package.
* [@airma/react-effect](/react-effect/index): React asynchronous state management package.
* @airma/react-hooks-core: React simple useful hook APIs.

## Model State Management

Create `reducer-like` function:

```js
export function counting(state:number){
    return {
        // reproduced state for render
        count: `mount: ${state}`,
        // action method
        increase:()=>state + 1,
        // action method
        decrease:()=>state - 1,
        // action method, define parameters freely,
        // return next state.
        add(...additions: number[]){
            return additions.reduce((result, current)=>{
                return result + current;
            }, state);
        }
    };
}
```

Use `reducer-like` function:

```tsx
import {counting} from './model';
import {useModel} from '@airma/react-state';

......
// give it an initialState can make it fly.
const {count, increase, decrease, add} = useModel(counting, 0); // initialState `0`
// call method `increase\decrease\add` can change `count` and make component rerender
......
```

The `reducer-like` function has a simple name `model`. Use API `model` can make it more simple.

### Local state management

```ts
import {model} from '@airma/react-state';

// api model returns a wrap function for your model function.
// it keeps a same type of parameters and return data with the wrapped function.
const counting = model(function counting(state:number){
    return {
        count: `mount: ${state}`,
        increase:()=>state + 1,
        decrease:()=>state - 1,
        add(...additions: number[]){
            return additions.reduce((result, current)=>{
                return result + current;
            }, state);
        }
    };
});
......
// you can get useModel from the model wrapped function.
const {count, increase, decrease, add} = counting.useModel(0);
......
```

The basic usage about `model` is just enhancing `React.useReducer` to manage a local state, it also supports store usage with or without `React.Context` to manage a global state. 

### React.Context state management

```ts
import {memo} from 'react';
import {model} from '@airma/react-state';

const countingStore = model(function counting(state:number){
    return {
        count: `mount: ${state}`,
        increase:()=>state + 1,
        decrease:()=>state - 1,
        add(...additions: number[]){
            return additions.reduce((result, current)=>{
                return result + current;
            }, state);
        }
    };
}).createStore(0);
......
const Increase = memo(()=>{
    // use store.useSelector can share state changes from store,
    // when the selected result is changed it rerender component. 
    const increase = countingStore.useSelector(i => i.increase);
    return <button onClick={increase}>+</button>;
});
const Count = memo(()=>{
    // use store.useModel can share state changes from store.
    const {count} = countingStore.useModel();
    return <span>{count}</span>;
});
const Decrease = memo(()=>{
    const decrease = countingStore.useSelector(i => i.decrease);
    return <button onClick={decrease}>-</button>;
});
// provide store to component for a React.Context usage.
const Component = countingStore.provideTo(function Comp() {
    return (
        <div>
            <Increase/>
            <Count/>
            <Decrease/>
        </div>
    );
});
......
```

Using `model(xxx).createStore(defaultState?).asGlobal()` can build a global store.

### Global state management

```ts
import {model} from '@airma/react-state';

const countingStore = model(function counting(state:number){
    return {
        count: `mount: ${state}`,
        increase:()=>state + 1,
        decrease:()=>state - 1,
        add(...additions: number[]){
            return additions.reduce((result, current)=>{
                return result + current;
            }, state);
        }
    };
}).createStore(0).asGlobal(); 
// mark store to be global
......
const Increase = memo(()=>{
    const increase = countingStore.useSelector(i => i.increase);
    return <button onClick={increase}>+</button>;
});
const Count = memo(()=>{
    const {count} = countingStore.useModel();
    return <span>{count}</span>;
});
const Decrease = memo(()=>{
    const decrease = countingStore.useSelector(i => i.decrease);
    return <button onClick={decrease}>-</button>;
});
// use global store without provider.
const Component = function Comp() {
    return (
        <div>
            <Increase/>
            <Count/>
            <Decrease/>
        </div>
    );
};
```

## Asynchronous State Management

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
    const [query, setQuery] = useState({name:'', username:''});
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

When `useQuery` is mounted, or the dependency parameters  change, it calls the promise callback.

### UseMutation

API `useMutation` is similar with `useQuery`. The difference is that it should be triggered manually to work.

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

Both of useQuery and useMutation need a promise callback for working, the mission of promise callback is called [session](/react-effect/concepts?id=session).

Use a simplified API [session](/react-effect/api?id=session) to make coding fly.

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
    const [query, setQuery] = useState({name:'', username:''});
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

The state of useQuery/useMutation is a local state. There are two different store state-managements: use dynamic React.Context store or use static global store.

### React.Context dynamic store state-management

```ts
import React from 'react';
import {session} from '@airma/react-effect';
import {User} from './type';

type UserQuery = {
    name: string;
    username: string;
}

// declare a query session dynamic store
const userQueryStore = session(
    (query: UserQuery):Promise<User[]> =>
        Promise.resolve([]),
    'query'
).createStore();

const SearchButton = ()=>{
    // useSession subscribes state change from session store
    const [
        // state from session store
        {isFetching},
        // call trigger function can trigger useQuery work manually 
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

// provide dynamic store is very important
const App = userQueryStore.provideTo(()=>{
    const [query, setQuery] = useState({name:'', username:''});
    const [
        state, 
        // Write every query state change to store
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
})
```

Why support React.Context store? Refer to [@airma/react-state explain](/react-state/index?id=why-support-context-store).

The dynamic store is a special session [key](/react-effect/concepts?id=key) collection not a real store. It persist an actual store in [Provider](/react-effect/api?id=provider) component. 

When a Provider is mounting in, it creates store, and when the provider has been unmounted, it destroys this store.

### Global static store state-management

```ts
import React from 'react';
import {session} from '@airma/react-effect';
import {User} from './type';

type UserQuery = {
    name: string;
    username: string;
}

// declare a query session global static store
const userQueryStore = session(
    (query: UserQuery):Promise<User[]> =>
        Promise.resolve([]),
    'query'
).createStore().asGlobal();

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

// global static store needs no Provider.
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

The state `data` from useSession is always has a `undefined` union type. API [useLoadedSession](/react-effect/api?id=useloadedsession) can be helpful if the session `state.data` is not empty from initializing time.

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
).createStore().asGlobal();

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

The [Strategy](/react-effect/api?id=strategy) API contains some useful strategies for useQuery and useMutation. Compose some strategies together can make the session of useQuery/useMutation performance wonderfully.

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
                // If the response data equals current state.data,
                // keeps current state.data.
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
                    capacity:10, 
                    staleTime:5*60*1000
                })
            ]
        }
    );

    ......
}
```

## Install and Support

The package lives in [npm](https://www.npmjs.com/get-npm). To install the latest stable version, run the following command:

### Install command

```
npm i @airma/react-hooks
```

### Browser support

```
chrome: '>=91',
edge: '>=91',
firefox: '=>90',
safari: '>=15'
```

Take next section [api](/react-hooks/api).