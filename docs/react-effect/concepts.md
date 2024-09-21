# Concepts

There are some important concepts.

1. [session](/react-effect/concepts?id=session)
2. [key](/react-effect/concepts?id=key)
3. [strategy](/react-effect/concepts?id=strategy)

## Session

Session is a promise callback mission. It contains a state and a promise execute callback. API [useQuery](/react-effect/api?id=usequery) and [useMutation](/react-effect/api?id=usemutation) can build a session, API [useSession](/react-effect/api?id=usesession) can use a store session, API [session](/react-effect/api?id=session) can wrap a promise callback to be a session API collection.

```ts
const session = useQuery(promiseCallback, variablesOrConfig);
const session = useMutation(promiseCallback, variablesOrConfig);

const [
    // Session state
    sessionState, 
    // Trigger session execution manually,
    // it needs no parameter,
    // useQuery/useMutation execute with the config variables as parameters.
    trigger, 
    // Execute session manually,
    // it needs parameters to replace config variables.
    execute
] = session;
```

### Session state

The session state exsit at begining, and changes when session is executed. 

```ts
const session = useQuery(promiseCallback, variablesOrConfig);

const [
    sessionState, 
    trigger,
    execute
] = session;

const {
    // The latest successful execution result.
    data,
    // The latest execution parameters for promise callback.
    variables,
    // If the session is in fetching.
    // true/false
    isFetching,
    // If the latest execution is failed.
    // true/false
    isError,
    // The latest execution failed result.
    error,
    ......
} = sessionState;
```

The full fields of session state:

* **data** - The latest successful execution result of promise callback, if there is no default data setting, it should be undefined before session has been executed.
* **error** - The latest execution failed result, it should be undefined if the execution is successful. 
* **variables** - The latest execution parameters, it should be undefined before session has been executed.
* **isFetching** - If the session is running it should be `true`, otherwise it should be `false`.
* **isError** - If the latest execution is failed it should be `true`, otherwise it should be `false`.
* **sessionLoaded** - If the session has been executed successfully it should be `true`, otherwise it should be `false`.
* **loaded** - If the session has been executed successfully or contains a default data setting it should be `true`, otherwise it should be `false`. 
* **triggerType** - It describes how does the latest execution works, there are 3 trigger type: `mount | update | manual`.
* **round** - The adopted execution times, it is a `number` data increased with adopted execution finished. Before session has been executed, it is `0`.
* **abandon** - It should be `false` in session state. In [stratey](/react-effect/concepts?id=strategy) executing process, setting it `true` prevents invalid session state to be adopted.
* **vistied** - It is similar to `loaded`, but can be changed by strategies (ex. [Strategy.cache](/react-effect/api?id=strategy-cache)).
* **lastSuccessfulRound** - It is the cached value of `round` when a latest execution is successful.
* **lastFailedRound** - It is the cached value of `round` when a latest execution is failed.
* **lastSuccessfulVariables** - It is the cached value of `variables` when a latest execution is successful.
* **lastFailedVariables** - It is the cached value of `variables` when a latest execution is failed.

### Session config

Session config can be setted to tell [useQuery](/react-effect/api?id=usequery)/[useMutation](/react-effect/api?id=usemutation) when and how to execute promise callback.

The simplest config is a parameters array for promise callback.

```ts
// useQuery start executing with parameters,
// when it is mounted, or some of parameters changes. 
useQuery(promiseCallback, [param1, param2, ...]);

// useMuation should be triggered to execute manually.
const [
    ,
    trigger,
    execute
] = useMutation(promiseCallback, [param1, param2, ...]);
```

Use complex config object to describe more features for session.

```ts
useQuery(promiseCallback, {
    // set parameters
    variables: [param1, param2, ...],
    // give a default data to session
    defaultData: defaultData,
    // limit executing way
    triggerOn: ['update', 'manual'],
    // set strategies
    strategy: [
        Strategy.debounce(300),
        Strategy.response.success((data)=>{
            console.log(data);
        })
    ]
});

useMutation(promiseCallback, {
    variables: [param1, param2, ...],
    // The default triggerOn of useMutation is ['manual'],
    // reset `triggerOn` option can expand it.
    triggerOn: ['update', 'manual'],
    strategy: [
        Strategy.response.success((data)=>{
            console.log(data);
        })
    ]
});
```

The config options are optional.

The full config fields are:

* **triggerOn** - The session executing ways. It should be an array, and there are 3 ways: `mount | update | manual`. This setting can change the session executing ways.
* **deps** - The update trigger dependency data, it should be an array. When the `triggerOn` setting contains `update`, and elements of deps change, the session execute promise callback with newest `variables`.
* **variables** - The parameters for execution, it should be an array. If there is no `deps` option in config, it is used as a default `deps` by session.
* **defaultData** - The default data for session. If it is setted, the `sessionState.data` has a default data at begining, and `sessionState.loaded` is always `true`.
* **strategy** - The executing features for session. It can be a single [strategy](/react-effect/concepts?id=strategy) or an strategy array.

The default **triggerOn** setting of useQuery and useMutation are different.

* useQuery - `['mount', 'update', 'manual']`
* useMutation - `['manual']`

### Trigger and execute

If a session has a `manual` support **triggerOn** setting, it can be triggered to execute manually by calling **trigger** or **execute** method.

The **trigger** method accepts no parameters, it just make session execute with setted varibles.

The **execute** method accepts same parameters type with promise callback.

```ts
const [
    querySessionState,
    // trigger
    triggerQuery,
    // execute
    executeQuery
] = useQuery(promiseCallback, [param1, param2]);
const [
    mutationSessionState,
    // trigger
    triggerMutation,
    // execute
    executeMutation
] = useMutation(promiseCallback, [param1, param2]);

const callTriggerQuery = ()=>{
    // just call it
    triggerQuery();
};

const callExecuteQuery = ()=>{
    // just call it
    executeQuery(param1, param2);
};

const callTriggerMutation = ()=>{
    // just call it
    triggerMutation();
};

const callExecuteMutation = ()=>{
    // just call it
    executeMutation(param1, param2);
};
```

## Key

Key is a special function for creating and subscribing store in [Provider](/react-effect/api?id=provider).  API [createSessionKey](/react-effect/api?id=createsessionkey) wraps a promise callback to be key. It is a special [model key](/react-state/concepts?id=key) from `@airma/react-state` concepts.

```ts
import React from 'react';
import {
    createSessionKey, 
    provide,
    useQuery, 
    useSession
} from '@airma/react-effect';
import {User} from './type';

type UserQuery = {
    name: string;
    username: string;
}

// create a query session key
const userQueryKey = createSessionKey(
    (query: UserQuery):Promise<User[]> =>
        Promise.resolve([]),
    'query'
);

const SearchButton = ()=>{
    // With session key, 
    // useSession can subscribe session state from store.
    const [
        // session state from store
        {isFetching},
        // call trigger function can trigger useQuery work manually 
        triggerQuery
    ] = useSession(userQueryKey);
    return (
        <button 
            disabled={isFetching} 
            onClick={triggerQuery}
        >
        query
        </button>
    );
}

// provide key to Provider for creating store.
// API provide is a HOC Provider for wrapping customized component. 
const App = provide(userQueryKey)(()=>{
    const [query, setQuery] = useState({name:'', username:''});
    const [
        state, 
        // With session key, 
        // useQuery can write and read session state from store.
    ] = useQuery(userQueryKey, [query]);

    ......

    return (
        <>
            <SearchButton />
            ......
        </>
    );
})
```

## Strategy

Strategy is a function for interposing the session executing process. 

```ts
type Runtime = {
    getSessionState: () => SessionState;
    variables: any[];
    triggerType: 'mount' | 'update' | 'manual';
    runner: (
        setFetchingSessionState?: (s: SessionState) => SessionState
    ) => Promise<SessionState>;
    localCache: { current: any };
    executeContext: {
      set: (key: any, value: any) => void;
      get: (key: any) => any;
    };
  };

function stratey(
    runtime: Runtime
): Promise<SessionState>;
```

The strategy function can accept a **runtime** parameter, it contains fields:

* **getSessionState** - A callback to get current session state.
* **varaibles** - Parameters for current execution.
* **triggerType** - Current execution trigger way, `'mount' | 'update' | 'manual'`.
* **runner** - Current execution callback, it can accept a 
callback to define the fetcing time state change, and returns a promise to set session state after execution.
* **localCache** - It can cache local data for every strategy.
* **executeContext** - It can cache data in execution time, and all strategies in session can use it.

A session always executes with strategies, even there is no strategy in config. 

Default strategy in API:

* [useQuery](/react-effect/api?id=usequery) - The default strategy ensures that useQuery always sets a latest execution data to session state. 
* [useMutation](/react-effect/api?id=usemutation) - The default strategy ensures that useMutation always execute atomically when it is triggered manually.

The **runner** function in runtime is another strategy chained after. It can be a final wrapped promise callback, or a customized strategy function.

The execution order like:

```ts
useQuery(
    promiseCallback,
    {
        variables: [query],
        // chain strategies.
        strategy: [
            // enter 1, return 3
            Strategy.validate(([q])=>!!q.name),
            // enter 2, return 2
            Strategy.debounce(300),
            // enter 3, return 1 
            Strategy.memo()
        ]
    }
);
```

Take next section [guides](/react-effect/guides).