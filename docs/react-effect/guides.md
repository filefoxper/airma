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

If you are not familiar with the concept with `strategy`, you can learn it in [concepts](/react-effect/concepts?id=strategy) again. 

So, how to use Strategy in `useQuery`?

```ts
import React from 'react';
import {useQuery, Strategy} from '@airma/react-effect';
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
            // Use Strategy.debounce for a lazy query,
            // when query changes.
            // Use Strategy.error after Strategy.debounce,
            // it means the `debounce` strategy wraps the `error` one,
            // if the `debounce` starts next strategy,
            // the error one can catch promise rejection,
            // and call the callback you set, 
            // to process error infomation.
            strategy: [
                Strategy.debounce(300), 
                Strategy.error((e) => console.log(e))
            ]
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

    const handleNameChange = (e: ChangeEvent)=>{
        // Change query.name from <input/>.onChange event handler.
        const name = e.target.value;
        setQuery(s=>({...s, name}));
        // After we change the `query` state,
        // useQuery start work with a debounce mode,
        // it fetch users after the input stopped 300 ms.
    }
    ......
}
```

The example code above shows how to use strategy to optimize a frequent query. You can use it to optimize a mutation too.

## UseMutation

API `useMutation` is very similar with `useQuery`. The only different is that `useMutation` has a default `config.triggerOn` setting with `['manual']`. That is why `useMutation` only works in a manual mode.

Now, we can use `config.triggerOn` to change it.

```ts
import React from 'react';
import {useMutation, Strategy} from '@airma/react-effect';
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
            triggerOn: ['update', 'manual'],
            strategy: [Strategy.debounce(300)]
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

    const handleChange = (e)=>{
        // We can change the variables to make
        // useMutation works.
        const name = e.target.value;
        setUser(u=>({...u, name}));
    }

    ......
}
```

Set triggerOn `update` is useful for a immediately saving, it always using with `Strategy.debounce`.

### Strategy

The `Strategy.once` is very useful for `useMutation`. We often save data before a dialog closing, in that case, we don't want a repeat save happen. `Strategy.once` can help you to resolve this problem. It allows `useMutation` only work once before it unmount, unless the promise reject.

```ts
import React from 'react';
import {useMutation, Strategy} from '@airma/react-effect';
import {User} from './type';

const saveUser = (user: User): Promise<User> => 
    Promise.resolve(user);

const Dialog = ()=>{
    const [user, setUser] = useState<User>({...});
    const [state, trigger] = useMutation(
        saveUser,
        {
            variables: [ user ],
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

    const handleSave = ()=>{
        trigger();
    }

    ......
}
```

Because the API `useMutation` is too similar with API `useQuery`, we don't repeat others again.

## Sharing state

Sharing state between components is very useful for react app. It helps us use state without props flow, and reduce unnecessary querys to reuse query data in different components.

We can use the follow APIs to share state between components.

1. SessionProvider - It is a react context provider component. It creates a store inside to maintain states from `useQuery` or `useMutation` which you want to sharing in the context scope.
2. createSessionKey - It helps you create a sharing session key for promise callback. Provide these keys to `SessionProvider` can create a store. And you can use them to link the store in deep child component usages.
3. useSession - It is a point hook to accept state changes from a parent `SessionProvider`. You need a session key for it to accept state changes.
4. useQuery - It is a point hook to broadcast or accept state changes in `SessionProvider`. You need a session key for it too, if not, it is just a local query hook.
5. useMutation - It is a point hook to broadcast or accept state changes in `SessionProvider`. You need a session key for it too, if not, it is just a local mutation hook.

Here is an example about how to share a login user information and a login user config information after application initialized. 

```ts
import React from 'react';
import {render} from 'react-dom';
import {
    createSessionKey,
    SessionProvider,
    useMutation,
    useQuery,
    useSession,
    useStatus
} from '@airma/react-effect';
import {login, fetchConfig} from './service';
import {LoginBody, User, Config} from './type';

// type LoginBody = {username: string, password: string};
// type User = {id: number, username: string, name: string};
// type Config = {id: number, userId: number, config: string};
// function login (user: LoginBody): Promise<User>;
// function fetchConfig(userId: number | null): Promise<Config>;

// use `createSessionKey` to create a login request key
const loginUser = createSessionKey(login);

// use `createSessionKey` to create a fetchConfig request key
const config = createSessionKey(fetchConfig);

// combine keys together
const clientKeys = {
    loginUser,
    config
};

const App = ()=>{
    const [ {data: user} ] = useSession(loginUser, {loaded:true});
    const [ {data: userConfig} ] = useSession(config, {loaded: true});

    return ......;
}

const Login = ()=>{
    const [
        loginBody, 
        changeLoginBody
    ] = useState<LoginBody>({
        username:'',
        password:''
    });

    // use `useMutation` and loginUser key to do login operation,
    // and broadcast mutation result to other components.
    const [, trigger] = useMutation(loginUser, [loginBody]);

    return (
        <div>
          <input type="text" onChange={(e)=>{
            const username = e.target.value;
            changeLoginBody(s=>({...s, username}));
          }}>
          <input type="passwd" onChange={(e)=>{
            const password = e.target.value;
            changeLoginBody(s=>({...s, password}));
          }}>
          <button onClick={trigger}>submit</button>
        </div>
    );
}

const Entry = ()=>{

    // Use useSession and session key loginUser to accept state changes 
    // from useMutation in component Login
    const loginClient = useSession(loginUser);

    const [ {data, loaded} ] = loginClient;

    // use `useQuery` and session key to query config,
    // and broadcast result to other components.
    const configClient = useQuery(config,{
        // Limit useQuery works in update mode,
        // when loginUser is loaded,
        // use the user.id as a query parameter
        // to query user config
        variables: [ loaded? data.id : null ],
        triggerOn: ['update']
    });

    const initialized = loginClient.loaded && configClient.loaded;

    // If not, it should still show Login component
    if (!initialized) {
        return <Login/>;
    }
    return <App/>;
}

render(
    // use client keys to create a store in SessionProvider
    <SessionProvider keys={clientKeys}>
        <Entry/>
    </SessionProvider>,
    document.getElementById('root')
);
```

The code above shows how to use state sharing.

`@airma/react-effect` support a `SessionProvider` tree match. You can use a child `SessionProvider` in a parent one, like:

```ts
import React from 'react';
import {render} from 'react-dom';
import {
    createSessionKey,
    SessionProvider,
    useMutation,
    useQuery,
    useSession
} from '@airma/react-effect';
import {login, fetchConfig, fetchTodos} from './service';
import {LoginBody, User, Config, Todo} from './type';

const loginUser = createSessionKey(login);

const config = createSessionKey(fetchConfig);

const globalKeys = {
    loginUser,
    config
};

const pageKeys ={
    // function fetchTodos():Promise<Todo[]>
    todos: createSessionKey(fetchTodos)
}

const TodoList = ()=>{
    const [ {data: list} ] = useSession(pageKeys.todos);
    return ......;
};

const Page = ()=>{
    // useSession can not match the key loginUser
    // in <SessionProvider keys={pageKeys} />, 
    // it will auto go up to <SessionProvider keys={globalKeys} />,
    // and it will match state there.
    const [ {data: user} ] = useSession(loginUser, {loaded:true});
    const [ {data: userConfig} ] = useSession(config, {loaded: true});

    // useQuery matches its key pageKeys.todos
    // in <SessionProvider keys={pageKeys} />.
    useQuery(pageKeys.todos,[]);

    return ......;
}

const Login = ()=>{
    const [
        loginBody, 
        changeLoginBody
    ] = useState<LoginBody>({
        username:'',
        password:''
    });

    const [, trigger] = useMutation(loginUser, [loginBody]);

    return ......;
}

const Entry = ()=>{
    const loginClient = ...;
    const configClient = ...;
    const initialized = loginClient.loaded && configClient.loaded;
    if (!initialized) {
        return <Login/>;
    }
    // Use a child SessionProvider
    return (
        <SessionProvider keys={pageKeys}>
          <Page/>
        </SessionProvider>
    );
}

render(
    // Use a global SessionProvider
    <SessionProvider keys={globalKeys}>
        <Entry/>
    </SessionProvider>,
    document.getElementById('root')
);
```

The code above shows that the sharing state usage point matches state from the closest parent `SessionProvider` to a farther one.

We will introduce the features of `useQuery` and `useMutation` in next [section](/react-effect/feature.md).