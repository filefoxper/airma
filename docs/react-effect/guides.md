# Guides

The usage about `@airma/react-effect` is simple enough. We will introduce some practical usage in this section.

## UseQuery

The basic usage is simple, when `useQuery` is mounted, or the elements of variables changes, it works.


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
        // Set parameters for query callback,
        // When useQuery is mounted, 
        // or the `query` changed,
        // it works `fetchUsers`
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

But, sometimes we want query data manually. 

### Manual

There are many ways to set a manual work mode for `useQuery`.

We can set `config.manual` to be `true`, and the query can only works manually by using `trigger` or `execute` methods.

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
        {
            variables: [query],
            // Set manual option,
            // only when we call trigger or execute can make it works.
            manual: true
        }
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

    const handleTrigger = ()=>{
        // Query manually
        trigger();
    }

    const handleExecute = ()=>{
        // Query manually
        execute(query);
    }

    ......
}
```

There are other ways to make query works manually. The simplest way is set no `variable` or `dependency` for `useQuery`.

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
        // Use query callback,
        // and set nothing to force `useQuery` works manually.
        ()=>fetchUsers(query)
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

    const handleTrigger = ()=>{
        // Query manually
        trigger();
    }

    const handleExecute = ()=>{
        // Query manually
        execute(query);
    }

    ......
}
```

We can also use `config.triggerOn` to do that, and we will introduce that later.

Let's take another problem first, if we want to make `useQuery` auto triggered with different dependencies, not the `variables`, what we can do?

### Deps

Set `config.deps` can make `useQuery` drived by `dependencies`, not variables. It should be an array with any data you want for driving `useQuery` works.

```ts
import React from 'react';
import {useQuery} from '@airma/react-effect';
import {User} from './type';

type UserQuery = {
    name: string;
    username: string;
}

const fetchUsers = (query: UserQuery):Promise<User[]> =>
        Promise.resolve([]);

const App = ()=>{
    const [version, setVersion] = useState(0);
    const [query, setQuery] = useState({name:'', username:''});
    const [state, trigger, execute] = useQuery(
        fetchUsers,
        {
            variables: [query],
            // Set deps with [version, query],
            // now, the version change can make `useQuery` works too.
            deps: [version, query]
        }
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

Now, we still have a trouble, we can not set `useQuery` only working in the time that dependencies or variables are updating.

### TriggerOn

Set `config.triggerOn` option can limit `useQuery` working mode. It has 3 mode for choosing:

* mount - When `useQuery` mounts, it works.
* update - When `deps` or `variables` are changed, it works.
* manual - When a `trigger` or a `execution` is called, it works.

API `useQuery` has a default full set: `['mount', 'update', 'manual']`, that means `useQuery` works in 3 mode, when `config.manual` is setted, the `triggerOn` is limited to be `['manual']` forcely.

```ts
import React from 'react';
import {useQuery} from '@airma/react-effect';
import {User} from './type';

type UserQuery = {
    name: string;
    username: string;
}

const fetchUsers = (query: UserQuery):Promise<User[]> =>
        Promise.resolve([]);

const App = ()=>{
    const [query, setQuery] = useState({name:'', username:''});
    const [state, trigger, execute] = useQuery(
        fetchUsers,
        {
            variables: [query],
            // Set `useQuery` work in `manual` mode
            triggerOn: ['manual']
        }
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

    const handleTrigger = ()=>{
        // Query manually 
        trigger();
    }
    ......
}
```

The `triggerOn` setting is the last way to make `useQuery` manually. In fact, `config.triggerOn` can provide more help for you, for you can select and composite the 3 `triggerTypes` to fit your need.

### Strategy



## UseMutation

API `useMutation` is very similar with `useQuery`. The only different is that `useMutation` has a default `config.triggerOn` setting with `['manual']`. That is why `useMutation` only works in a manual mode.

Now, we can use `config.triggerOn` to change it.

```ts
import React from 'react';
import {useMutation} from '@airma/react-effect';
import {User} from './type';

const saveUser = (user: User): Promise<User> => 
    Promise.resolve(user);

const App = ()=>{
    const [user, setUser] = useState<User>({...});
    const [state, trigger] = useMutation(
        saveUser,
        {
            variables: [ user ],
            // Set `update` and `manual` working mode
            triggerOn: ['update', 'manual']
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

    const handleClick = ()=>{
        // We can change the variables to make
        // useMutation works.
        setUser({...});
    }

    ......
}
```

For API `useMutation` is too similar with API `useQuery`, we don't repeat again.

## Share state changes
