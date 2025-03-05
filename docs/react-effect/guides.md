# Guides

This section tells how to use these APIs: [useQuery](/react-effect/guides?id=usequery), [useMutation](/react-effect/guides?id=usemutation), [useSession](/react-effect/guides?id=usessesion), [provide](/react-effect/guides?id=provide), [session](/react-effect/guides?id=session) and [Strategy](/react-effect/guides?id=strategy).

## useQuery

API useQuery is used for managing a query session state. It can run with a promise callback or a session [key](/react-effect/concepts?id=key), event a session store. It always takes a latest  execution result as [session state](/react-effect/concepts?id=session-state). Consider it as **useEffect** is helpful for understanding when it works automatically.

The most basic usage of this API is compose it with a promise callback and parameter array directly:

```ts
//session.ts
import {User} from './type';

type UserQuery = {
    name: string;
    username: string;
}
// Promise callback
export function fetchUsers(query: UserQuery):Promise<User[]> {
    return Promise.resolve([]); 
}
```

#### Use API useQuery with promise callback:

```ts
// page.tsx
import React from 'react';
import {useQuery} from '@airma/react-effect';
import {fetchUsers} from './session';

const Page = ()=>{
    const [query, setQuery] = useState({name:'', username:''});
    // Works like React.useEffect dependency system.
    const [
        sessionState,
        trigger,
        execute
    ] = useQuery(fetchUsers, [query]); 
    const {
        // User[] | undefined
        data,
        // [UserQuery] | undefined
        variables,
        // boolean
        isFetching,
    } = sessionState;
    ......
    const callTrigger = ()=>{
        // No parameter is needed,
        // The session uses varibles: [query] as parameters.
        trigger();
    }

    const callExecute = ()=>{
        // Need parameters just like promise callback itself.
        execute({name:'name',username:''});
    }
}
```

#### Give it a default data:

```ts
const [
    {
        // User[]
        data
    }
] = useQuery(fetchUsers, {
    variables: [query],
    // set default data, the sessionState.data default with `[]`
    defaultData: []
}); 
```

#### Use customized execution dependencies:

```ts
const [
    {
        // User[]
        data
    }
] = useQuery(fetchUsers, {
    variables: [query],
    defaultData: [],
    // Use customized execution dependencies
    deps: [query.name]
}); 
```

#### Change default trigger way:

```ts
useQuery(fetchUsers, {
    variables: [query],
    defaultData: [],
    deps: [query.name],
    // Change default trigger way,
    // only when `query.name` changes, it executes.
    // Default triggerOn: ['mount', 'update', 'manual']
    triggerOn: ['update']
}); 
```

#### Do something when execution finishes:

```ts
import {useResponse} from '@airma/react-effect';

const [sessionState] = useQuery(fetchUsers, {
    variables: [query],
    defaultData: [],
    deps: [query.name],
    triggerOn: ['update'],
    strategy:[
        Strategy.response((state)=>{
            doSomething(state);
        }),
        Strategy.response.success((data, state)=>{
            doSomething(state);
        }),
        Strategy.response.failure((error, state)=>{
            doSomething(state);
        }),
    ]
}); 
// when execution finishes
useResponse((state)=>{
    const {variables} = state;
    doSomething(state);
}, sessionState);

// when execution finishes successfully
useResponse.useSuccess((data, state)=>{
    const {variables} = state;
    doSomething(state);
}, sessionState);

// when execution finishes with error
useResponse.useFailure((error, state)=>{
    const {variables} = state;
    doSomething(state);
}, sessionState);
```

#### Execute query manually without preset variables

```ts
const [sessionState, , execute] = useQuery(fetchUsers, {
    // Do not set variables and deps for it.
    // variables: [query],
    defaultData: [],
}); 

const callExecute=()=>{
    execute(query);
}
```

#### Most welcome strategy for useQuery

```ts
import {Strategy} from '@airma/react-effect';

useQuery(fetchUsers, {
    variables: [query],
    strategy: [
        // query with debounce feature
        Strategy.debounce(300),
        // If the new sessionState.data equals the current one,
        // use the old data.
        // It can optimize render performance after execution.
        Strategy.memo(),
        // Open swr feature, cache 10 execution result.
        Strategy.cache({capacity:10}),
        // When execution finishes successfully,
        // do something.
        Strategy.response.success((data)=>{
            doSomething(data);
        })
    ]
}); 
```

## useMutation

API useMutation is used for managing a mutation session state. It can run with a promise callback or a store session [key](/react-effect/concepts?id=key). The execution is atomical, when it is triggered manually. By default, it only can be triggered manually.

The basic usage is similar with useQuery `manual` trigger way.

```ts
// session.ts
type User = {
    name: string;
    username: string;
};

export function saveUser(user: User): Promise<User>{
    return Promise.resolve(user);
}
```

#### Use API useMutation with promise callback:

```ts
// page.tsx
import React from 'react';
import {useMutation} from '@airma/react-effect';
import {saveUser} from './session';

const Page = ()=>{
    const [user, setUser] = useState({name:'', username:''});
    // It only can work manually by default.
    const [
        sessionState,
        trigger,
        execute
    ] = useMutation(fetchUsers, [user]); 
    const {
        // User | undefined
        data,
        // [User] | undefined
        variables,
        // boolean
        isFetching,
    } = sessionState;
    ......
    const callTrigger = ()=>{
        // No parameter is needed,
        // The session uses varibles: [user] as parameters.
        trigger();
    }

    const callExecute = ()=>{
        // Need parameters just like promise callback itself.
        execute({name:'name',username:'username'});
    }
}
```

#### Change default trigger way:

```ts
useMutation(saveUser, {
    variables: [user],
    // Change default trigger way,
    // only when `user` changes, it executes.
    // Default triggerOn: ['manual']
    triggerOn: ['update']
}); 
```

When useMutation is triggered by `update` or `mount` way, it can **not** run execution atomically.

#### Execute mutation without preset variables

```ts
// Do not set variables and deps for it.
const [sessionState, , execute] = useMutation(saveUser); 

const callExecute=()=>{
    execute(user);
}
```

#### Most welcome strategy for useMutation

```ts
import {Strategy} from '@airma/react-effect';

useMutation(saveUser, {
    variables: [user],
    strategy: [
        // Want to execute successfully only once.
        Strategy.once(),
        // When execution finishes successfully,
        // do something.
        Strategy.response.success((data)=>{
            doSomething(data);
        })
    ]
}); 
```

#### Other usages?

The other usages about useMutation is similar with useQuery.

## provide

Using session state from dynamic store makes a better coding experience than using a local one.

#### Create session key

The [Provider](/react-effect/api?id=provider) component creates store from keys, so creating session [key](/react-effect/concepts?id=key) is the first step.

```ts
// session.ts

import {createSessionKey} from '@airma/react-effect';

// create a session key for query with promise callback
const queryKey = createSessionKey(fetchUsers, 'query');

// create a session key for mutation with promise callback
const saveKey = createSessionKey(saveUser, 'mutation');
```

API [createSessionKey](/react-effect/api?id=createsessionkey) wraps promise callback to be session key.

#### Use session keys to create store

API [provide](/react-effect/api?id=provide) is a HOC (Higher order component), it creates a [Provider](/react-effect/api?id=provider) wrapper (HOC too).

```ts
// usage.tsx
import {queryKey, saveKey} from './session';
import {provide} from '@airma/react-effect';

const sessions = {
    query: queryKey,
    save: saveKey
}

// provide session keys to create a wrapper
const wrap = provide(sessions);
// or
// const wrap = provide(queryKey, saveKey);

// wrap customized component,
// and create store in wrap Provider HOC
const Component = wrap((props:Props)=>{
    // The created store can be used in whole Component.

    // API useQuery executes promise callback in session key,
    // and set session state to store.
    useQuery(sessions.query, [props.query]);
    return (
        <>
            <Child1 />
            <Child2 />
        </>
    );
});
```

API useQuery/useMutation executes promise callback wrapped in session key, and set session state to store. It also subscribe state change of the response store.

Use [Provider](/react-effect/api?id=provider) component directly to create store.

```ts
// usage.tsx
import {queryKey, saveKey} from './session';
import {Provider} from '@airma/react-effect';

const sessions = {
    query: queryKey,
    save: saveKey
}

const Component = (props:Props)=>{
    // create store in Provider.
    // problem is the created store can not be used in Component render out of Provider.
    return (
        <Provider value={sessions}>
            <Child1 />
            <Child2 />
        </Provider>
    );
};
```

## useSession

API [useSession](/react-effect/api?id=usesession) only subscribes session state change of store, it can not execute promise callback itself, but can drive useQuery/useMutation to work. 

```ts
// usage.tsx
import {queryKey, saveKey} from './session';
import {
    provide,
    useQuery,
    useSession
} from '@airma/react-effect';

const sessions = {
    query: queryKey,
    save: saveKey
}

const Child1 = ()=>{
    // useSession subscribes store[sessions.query].
    // It can drive useQuery with same key works.
    const [
        querySessionState, 
        triggerQuery,
        executeQuery
    ] = useSession(sessions.query);

    const {
        // User[] | undefined
        data,
    } = querySessionState;
    return ......;
}

const Child2 = ()=>{
    return ......;
}

// simplify wrap
const Component = provide(queryKey, saveKey)((props:Props)=>{
    // responses session state to store[sessions.query],
    // and subscribes store[sessions.query]
    useQuery(sessions.query, {
        variables: [props.query],
        defaultData: []
    });
    return (
        <>
            <Child1 />
            <Child2 />
        </>
    );
});
```

API useSession triggers all executable sessions (useQuery/useMutation) with same key to work, but only one of these sessions responses.

```ts
// usage.tsx
import {queryKey, saveKey} from './session';
import {
    provide,
    useQuery,
    useSession
} from '@airma/react-effect';

const sessions = {
    query: queryKey,
    save: saveKey
}

const Child1 = ()=>{
    const [
        querySessionState, 
        // trigger all useQuery(sessions.query, xxx)
        triggerQuery,
        executeQuery
    ] = useSession(sessions.query);
    return ......;
}

const Child2 = ()=>{
    const q = useMemo(()=>({name:'',username:''}),[]);
    // When more than one same key sessions work together,
    // only one is allowed to execute and response.
    useQuery(sessions.query, [q]);
    return ......;
}

const Component = provide(queryKey, saveKey).to((props:Props)=>{
    // When more than one same key sessions work together,
    // only one is allowed to execute and response.
    useQuery(sessions.query, [props.query]);
    return (
        <>
            <Child1 />
            <Child2 />
        </>
    );
});
```

## useLoadedSession

API [useSession](/react-effect/api?id=usesession) always get a sessionState.data which may be undefined, even when the usage mounts in after session has executed successfully. API [useLoadedSession](/react-effect/api?id=useloadedsession) can resolve this problem, if it is very sure, that the session has executed successfully, and the sessionState.data is not undefined.

```ts
// usage.tsx
import {queryKey, saveKey} from './session';
import {
    provide,
    useQuery,
    useSession
} from '@airma/react-effect';

const sessions = {
    query: queryKey,
    save: saveKey
}

const Child1 = ()=>{
    // useQuery(sessions.query, xxx) has a defaultData setting,
    // so, it is sure that querySessionState.data is `User[]`,
    // and useLoadedSession is a reasonable usage here.
    const [
        querySessionState, 
        triggerQuery
    ] = useLoadedSession(sessions.query);

    const {
        // User[]
        data,
    } = querySessionState;
    return ......;
}

const Child2 = ()=>{
    return ......;
}

const Component = provide(queryKey, saveKey).to((props:Props)=>{
    useQuery(sessions.query, {
        variables: [props.query],
        defaultData: []
    });
    return (
        <>
            <Child1 />
            <Child2 />
        </>
    );
});
```

## No config useQuery/useMutation

From version 18.5.0, if a `useQuey/useMutation` works without a config parameter, it always finds and drives a configurated one with same session key to work. If the perfect substitute is not found, it works by itself.

```ts
// usage.tsx
import {queryKey, saveKey} from './session';
import {
    provide,
    useQuery,
    useSession
} from '@airma/react-effect';

const sessions = {
    query: queryKey,
    save: saveKey
}

const Child1 = ()=>{
    // No config parameter,
    // it works like a useSession.
    // It found useQuery in top Component has a same key and config parameter,
    // then it drives useQuery in top Component works.
    const [
        querySessionState, 
        triggerQuery
    ] = useQuery(sessions.query);

    const {
        // User[] | undefined
        data,
    } = querySessionState;
    return ......;
}

const Child2 = ()=>{
    return ......;
}

// simplify wrap
const Component = provide(queryKey, saveKey)((props:Props)=>{
    // responses session state to store[sessions.query],
    // and subscribes store[sessions.query]
    useQuery(sessions.query, {
        variables: [props.query],
        defaultData: []
    });
    return (
        <>
            <Child1 />
            <Child2 />
        </>
    );
});
```

## session

API session wraps promise callback to be a often use API collection.

```ts
// session.ts
import {session} from '@airma/react-effect';

export const querySession = session(fetchUsers, 'query');

export const saveSession = session(saveUser, 'mutation');
```

Use session API style.

```ts
// usage.tsx
import {provide} from '@airma/react-effect';
import {querySession, saveSession} from './session';

// create session key
const queryKey = querySession.createKey();
const saveKey = saveSession.createKey();

const Child1 = ({query}: {query:UserQuery})=>{
    // key.useQuery need no key or promise callback
    const [
        {
            data,
            isFetching
        },
        triggerQuery,
        executeQuery
    ] = queryKey.useQuery([query]);
    return ......;
}

const Child2 = ()=>{
    const [user, setUser] = useState({
        name:'',
        username:''
    });
    
    const [, triggerQuery, executeQuery] = queryKey.useSession();
    const [
        saveSessionState,
        triggerSave,
        executeSave
    ] = saveKey.useMutation([user]);

    useResponse.useSuccess(()=>{
        triggerQuery();
    }, saveSessionState);
    return ......;
}

// provide keys
const Component = provide(queryKey, saveKey).to(
    (props: Props)=>{
        return (
            <>
                <Child1 query={props.query} />
                <Child2 />
            </>
        )
    }
)

// create a static store
const globalQueryStore = querySession.createStore();

// static store needs no Provider system.
const Component2 = (props:Props)=>{
    // use it directly
    const [
        {
            data,
            isFetching
        },
        triggerQuery
    ] = globalQueryStore.useQuery({
        variables: [props.query],
        defaultData: [],
        strategy: Strategy.debounce(300)
    });
    const [user, setUser] = useState({
        name:'',
        username:''
    });
    // local session usage
    const [
        saveSessionState,
        triggerSave,
        executeSave
    ] = saveSession.useMutation([user]);

    useResponse.useSuccess(()=>{
        triggerQuery();
    }, saveSessionState);

    return ......;
}
```

More [examples](/react-effect/index?id=static-store-state-management).

## Strategy

The [strategies](/react-effect/concepts?id=strategy) are often chained and used on useQuery/useMutation. It only works on a local session.

Set common strategies on [ConfigProvider](/react-effect/api?id=configprovider), then every useQuery/useMutation can use these chained strategies automatically.

```ts
import {unstable_batchedUpdates} from 'react-dom';
import {
    ConfigProvider, 
    Strategy
} from '@airma/react-effect';
import type {GlobalConfig} from '@airma/react-effect';

const globalConfig: GlobalConfig = {
    batchUpdate: unstable_batchedUpdates,
    // set common strategies
    strategy: (
        // a running session strategy chain
        s: StrategyType[], 
        // a running session type,
        // useQuery - query,
        // useMutation - mutation
        sessionType: 'query'|'mutation'
    ) => [
        ...s, 
        // chain a memo strategy for every useQuery
        sessionType === 'query'? Strategy.memo():null,
        // chain a failure strategy to process failure message which has not be processed.
        Strategy.failure(e => {
            // if there is a Strategy.failure or Strategy.response.failure before in `s`,
            // this strategy skips its process callback.
            message.error(e);
        })
    ]
}

<ConfigProvider value={globalConfig}>
......
</ConfigProvider>
```

**Note**: When the @airma/react-effect 18.6.0 coming, Strategy.failure should be put on top for a default processing to errors.

```ts
import {unstable_batchedUpdates} from 'react-dom';
import {
    ConfigProvider, 
    Strategy
} from '@airma/react-effect';
import type {GlobalConfig} from '@airma/react-effect';

const globalConfig: GlobalConfig = {
    batchUpdate: unstable_batchedUpdates,
    // add experience next to use the new features in next big version.
    experience: 'next',
    // set common strategies
    strategy: (
        // a running session strategy chain
        s: StrategyType[], 
        sessionType: 'query'|'mutation'
    ) => [
        // In 18.6.0, failure strategy should be top,
        // and the error can go through customized Strategy.failure before into this one.
        Strategy.failure(e => {
            message.error(e);
        }),
        ...s, 
        // chain a memo strategy for every useQuery
        sessionType === 'query'? Strategy.memo():null,
    ]
}

const Child = ()=>{
    useQuery(promiseCallback, {
        variables:[],
        strategy:[
            Strategy.response.failure((err)=>{
                // in 18.6.0, it is allowed to process some conditions about error, and throw others to the default Strategy.failure process.
                if(err.code === 'xxx'){
                    processError(err);
                    return;
                }
                throw err;
            });
        ]
    });
    return ......;
}

<ConfigProvider value={globalConfig}>
......
</ConfigProvider>
```

The element of strategy chain can be dynamic, but it only can be switched with `null`.

```ts
const [openMemo, setOpenMemo] = useState(false);

const [
    sessionState,
    trigger,
    execute
] = useQuery(fetchUsers, {
    variables: [query],
    strategy:[
        Strategy.validate(()=>!!query.name),
        // dynamic switch strategy
        openMemo? Strategy.memo(): null
    ]
    // don't filter strategy chain.
});
```

Don't filter strategy chain or switch strategy with another one, that may cause problem, for every strategy stores a localCache in a fixed local array.

How to write a strategy?

```ts
// code of Strategy.validate
import type {StrategyType} from '@airma/react-effect';

function validate(callback: () => boolean): StrategyType {
    // a strategy function should return a promise resolves session state like data.
    return function validStrategy(runtime) {
        const { runner, getSessionState } = runtime;
        const result = callback();
        // if validate result is `false`,
        // return a promise resolves an abandoned session state.
        if (!result) {
            const sessionState = getSessionState();
            return new Promise(resolve => {
                // an abandoned session state like data can not to be session state.
                resolve({
                    ...sessionState, 
                    // set abandon `true`
                    abandon: true 
                });
            });
        }
        // runner is a next strategy, 
        // it returns a promise resolves session state like data too.
        return runner();
    };
}
```

A [strategy](/react-effect/concepts?id=strategy) function should accepts a runtime parameter, and returns a promise which resolves a session state like data.

If the resolved data.**abandon** is **true**, this data will be abandoned, it can not be a session state. That's why the **'abandon'** field in [session state](/react-effect/concepts?id=session-state) is always **false**.

```ts
// code of Strategy.once
function once(): StrategyType {
    return function oc(runtime: {
        getSessionState: () => SessionState;
        runner: () => Promise<SessionState>;
        localCache: { current?: Promise<SessionState> };
    }) {
        const { runner, localCache } = runtime;
        // If runtime.localCache has a promise value,
        // it means this session has worked, 
        // the current execution should be abandoned.
        if (localCache.current) {
            return localCache.current.then(d => ({
                 ...d, 
                 abandon: true 
            }));
        }
        // If it is called first time,
        // store the runner returned promise into runtime.localCache.
        localCache.current = runner().then(d => {
            if (d.isError) {
                localCache.current = undefined;
            }
        return d;
        });
        return localCache.current;
    };
}
```

## useResponse

useResponse/useResponse.useSuccess/useResponse.useFailure responses the result of a session. If a session has loaded yet, useResponse may process it when it is mounted.

Ex：

```ts
const Component = ()=>{
    const [sessionState] = useLoadedSession(sessionKey,...);

    useResponse.useSuccess(()=>{
        // The session has loaded before useResponse mounted,
        // So, useResponse processes the session state when it is mounted.
    },sessionState);
}

const App = ()=>{
    const [sessionState] = useQuery(sessionKey,...);

    useResponse.useSuccess(()=>{
        // When session responses, it works.
    },sessionState);

    return sessionState.loaded?<Component/>:null
}
```

If you want useResponse process only when the session is responsed, add the option `{watchOnly:true}` to it.

Ex：

```ts
const Component = ()=>{
    const [sessionState] = useLoadedSession(sessionKey,...);

    useResponse.useSuccess(()=>{
        // use watchOnly makes useResponse only works when session is responsed
    },[sessionState, {watchOnly:true}]);
}

const App = ()=>{
    const [sessionState] = useQuery(sessionKey,...);

    useResponse.useSuccess(()=>{
        // When session responses, it works.
    },sessionState);

    return sessionState.loaded?<Component/>:null
}
```

## ConfigProvider

It can config a common strategies for all useQuery/useMutation API usages. 

```ts
import {unstable_batchedUpdates} from 'react-dom';
import {
    ConfigProvider, 
    Strategy,
    useQuery,
} from '@airma/react-effect';
import type {GlobalConfig} from '@airma/react-effect';

const globalConfig: GlobalConfig = {
    // use batchUpdate to optimize update performance.
    batchUpdate: unstable_batchedUpdates,
    // set a common strategies
    strategy: (
        s: StrategyType[], 
        sessionType: 'query'|'mutation'
    ) => [
        ...s, 
        sessionType === 'query'? Strategy.memo():null,
        Strategy.failure(e => {
            message.error(e);
        })
    ]
}

const App = ()=>{
    // It works with common strategies: Strategy.debounce(300), Strategy.memo(), Strategy.failure(e => {message.error(e);})
    useQuery(promiseCallback, {
        strategy: [Strategy.debounce(300)]
    });
    return ......;
}

<ConfigProvider value={globalConfig}>
    <App />
</ConfigProvider>
```

To stop using common strategies, set `ignoreStrategyWrapper` option to config.

```ts
import {unstable_batchedUpdates} from 'react-dom';
import {
    ConfigProvider, 
    Strategy,
    useQuery
} from '@airma/react-effect';
import type {GlobalConfig} from '@airma/react-effect';

const globalConfig: GlobalConfig = {
    // use batchUpdate to optimize update performance.
    batchUpdate: unstable_batchedUpdates,
    // set a common strategies
    strategy: (
        s: StrategyType[], 
        sessionType: 'query'|'mutation'
    ) => [
        ...s, 
        sessionType === 'query'? Strategy.memo():null,
        Strategy.failure(e => {
            message.error(e);
        })
    ]
}

const App = ()=>{
    // It works with common strategies: Strategy.debounce(300), Strategy.memo(), Strategy.failure(e => {message.error(e);})
    useQuery(promiseCallback, {
        strategy: [Strategy.debounce(300)]
    });

    // It works with common strategies: Strategy.debounce(300)
    useQuery(promiseCallback, {
        strategy: [Strategy.debounce(300)],
        ignoreStrategyWrapper: true
    });

    return ......;
}

<ConfigProvider value={globalConfig}>
    <App />
</ConfigProvider>
```

Set `experience: 'next'` to experince new features in next big version.

```ts
import {unstable_batchedUpdates} from 'react-dom';
import {
    ConfigProvider, 
    Strategy,
    useQuery,
} from '@airma/react-effect';
import type {GlobalConfig} from '@airma/react-effect';

const globalConfig: GlobalConfig = {
    // use batchUpdate to optimize update performance.
    batchUpdate: unstable_batchedUpdates,
    // To experince new features in next big version.
    experience: 'next',
    // set a common strategies
    strategy: (
        s: StrategyType[], 
        sessionType: 'query'|'mutation'
    ) => [
        // In 18.6.0, The common Strategy.failure should be put on top
        Strategy.failure(e => {
            message.error(e);
        }),
        ...s, 
        sessionType === 'query'? Strategy.memo():null
    ]
}

const App = ()=>{
    // It works with common strategies: Strategy.debounce(300), Strategy.memo(), Strategy.failure(e => {message.error(e);})
    useQuery(promiseCallback, {
        strategy: [
            Strategy.debounce(300),
            Strategy.response.failure((err)=>{
                // process some conditions about error, and throw others to the default Strategy.failure process.
                if(err.code === 'xxx'){
                    processError(err);
                    return;
                }
                throw err;
            });
        ]
    });
    return ......;
}

<ConfigProvider value={globalConfig}>
    <App />
</ConfigProvider>
```

* batchUpdate - It can use `unstable_batchedUpdates` from react-dom to optimize update performance.
* experience - It only accepts a 'next' value. Open it, means to use features in next big version.
* strategy - It can be used for composing a common strategy chain for every session.

Next section [feature](/react-effect/feature).