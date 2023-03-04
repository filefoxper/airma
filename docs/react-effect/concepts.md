# Concepts

There are some concepts for helping you to understand `@airma/react-effect` more quickly.

1. [promise callback](/react-effect/concepts?id=promise-callback)
2. [variables](/react-effect/concepts?id=variables)
3. [state](/react-effect/concepts?id=state)
4. [trigger](/react-effect/concepts?id=trigger)
5. [execution](/react-effect/concepts?id=execution)
6. [strategy](/react-effect/concepts?id=strategy)

## Promise callback

Promise callback is a function which always returns a promise. API `useQuery` or `useMutation` calls it, and generates next state with the promise resolved data or rejected error.

To distinguish the different usage, we call them:

1. query callback - It is for `useQuery`.
2. mutation callback - It is for `useMutation`.

## Variables

The parameters for `promise callback`, we call it variables, it should be an array. When the `promise callback` is called by dependencies change, or triggered manually, it is used as parameters for `promise callback` function.

## State

API `useQuery` and `useMutation` returns a tuple array, the first element is the state. A state contains some helpful information:

* data - Last successful promise result. It only can be overrided by a next promise resolving. Before promise callback works, it is `undefined`.
* error - Last failed promise rejection. It can be overrided to be `undefined` by a next promise resolving, or be overrided by a next failed promise rejection.
* isFetching - When the promise callback is launched, it turns to be `true`. When the promise returned by callback is resolved or rejected, it turns to be `false`.
* isError - Use a `undefined error` field value to estimate if the query promise is rejected is incredible. It is much better to use `isError` to estimate if the last promise is rejected.
* loaded - It shows if the data had been resolved yet. If it is `true`, that means there is at least one successful promise happened.
* abandon - It marks if a promise result should be set into state. It should always be `false` in state. It is more useful in a strategy setting.
* triggerType - It is `undefined` before callback launched. It has 3 types: `mount`, `update`, `manual`. And you can use it to learn how the current state is generated.

Example for state:

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
        loaded,
        // undefined | 'mount' | 'update' | 'manual'
        triggerType,
        // false
        abondon
    } = state;

    ......
}
```

## Trigger

Trigger is a no parameter callback. You can call it to trigger the current promise callback work with current variables. It returns a promise which has a result similar with `state`. This result is incredible, take care about `result.abondon`, if it is `true`, that means this result will be abandoned, and will not appear in `state`.

Usage of trigger:

```ts
import React from 'react';
import {useMutation, Strategy} from '@airma/react-effect';
import {User} from './type';

const saveUser = (user:User): Promise<User> =>
        Promise.resolve(user);

const App = ()=>{
    const [user, setUser] = useState({...});
    const [state, trigger] = useMutation(saveUser, {
        variables: [user],
        // Use debounce, once strategy
        strategy: [Strategy.debounce(300), Strategy.once()]
    });

    const handleClick = async ()=>{
        const {
           data,
           error,
           isError,
           isFetching,
           loaded,
           // take care about abandon field
           abondon 
        } = await trigger();
        // If abandon is `true`,
        // that means this promise result is abandoned,
        // and it will not appear in state.
    };
};
```

## Execution

Execution is a callback with the same parameter requires with promise callback. You can call it to trigger the current promise callback work with setted parameters. It returns a promise which has a result similar with `state`. This result is incredible, take care about `result.abondon`, if it is `true`, that means this result will be abandoned, and will not appear in `state`.

Usage of execution:

```ts
import React from 'react';
import {useMutation, Strategy} from '@airma/react-effect';
import {User} from './type';

const saveUser = (user:User): Promise<User> =>
        Promise.resolve(user);

const App = ()=>{
    const [user, setUser] = useState({...});
    // use execute callback
    const [state, , execute] = useMutation(saveUser, {
        variables: [user],
        // Use debounce, once strategy
        strategy: [Strategy.debounce(300), Strategy.once()]
    });

    const handleClick = async ()=>{
        const {
           data,
           error,
           isError,
           isFetching,
           loaded,
           // take care about abandon field
           abondon 
           // you can pass a new parameters for execution.
        } = await execute({...user,id:'xxx'});
        // If abandon is `true`,
        // that means this promise result is abandoned,
        // and it will not appear in state.
    };
};
```

## Strategy

Strategy is a wrap callback design for promise callback. It can intercept promise callback, and do some strategy like `debounce`, `once` to affect the callback. You can return another promise result to replace the current one, and the `state` uses the final result from a strategy list.

A strategy looks like:

```ts
function once(): StrategyType {
  // Function oc is a strategy
  return function oc(value: {
    current: () => PromiseResult;
    runner: () => Promise<PromiseResult>;
    store: { current?: any };
  }) {
    // It accepts a parameter.
    // Field current is a callback for getting current state.
    // Field runner is a callback returns a promise state.
    // Field store contains a current key, 
    // you can cache and fetch any thing from `store.current`
    const { current, runner, store } = value;
    // If promise callback is launched, 
    // store.current should be `true`.
    if (store.current) {
      // If promise callback is launched,
      // we should prevent it started again,
      // so, we should returns another result,
      // which is abandoned.
      return new Promise(resolve => {
        const currentState = current();
        // Make a abandoned result with current state
        resolve({ ...currentState, abandon: true });
      });
    }
    // cache true into store.current
    store.current = true;
    return runner().then(d => {
      if (d.isError) {
        // If result isError,
        // cancel the prevent
        store.current = false;
      }
      return d;
    });
  };
}
```

Usage of Strategy:

```ts
import React from 'react';
import {useMutation, Strategy} from '@airma/react-effect';
import {User} from './type';

const saveUser = (user:User): Promise<User> =>
        Promise.resolve(user);

const App = ()=>{
    const [user, setUser] = useState({...});
    const [state, trigger] = useMutation(saveUser, {
        variables: [user],
        // Use debounce, once strategy
        strategy: [Strategy.debounce(300), Strategy.once()]
    });

    const handleClick = ()=>{
        // When we trigger it,
        // it runs with 300 ms debounce strategy first,
        // then it runs with once strategy to protect mutation.
        trigger();
    };
};
```

After learning these concepts, we can go next [section](/react-effect/guides.md) to know more about it.