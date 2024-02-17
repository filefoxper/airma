[![npm][npm-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/%40airma/react-state.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/%40airma/react-state
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
[npm-downloads-image]: https://img.shields.io/npm/dm/%40airma/react-state.svg?style=flat-square

# @airma

`@airma` provides simple and useful packages for react developing env:

1. [@airma/react-state](https://filefoxper.github.io/airma/#/react-state/index)
2. [@airma/react-effect](https://filefoxper.github.io/airma/#/react-effect/index)
3. [@airma/react-hooks](https://filefoxper.github.io/airma/#/react-hooks/index)

## @airma/react-state

Simple `reducer-like` state-management with method action dispatch mode for react components.

Create `reducer-like` function:

```js
export function counting(state:number){
    return {
        // reproduced state for render
        count: `mount: ${state}`,
        // action method
        increase:()=>count + 1,
        // action method
        decrease:()=>count - 1,
        // action method, define parameters freely.
        add(...additions: number[]){
            return additions.reduce((result, current)=>{
                return result + current;
            }, count);
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

```tsx
import {model} from '@airma/react-state';

// api model returns a wrap function for your model function.
// it keeps a same type of parameters and return data with the wrapped function.
const counting = model(function counting(state:number){
    return {
        count: `mount: ${state}`,
        increase:()=>count + 1,
        decrease:()=>count - 1,
        add(...additions: number[]){
            return additions.reduce((result, current)=>{
                return result + current;
            }, count);
        }
    };
});
......
// you can get useModel from the model wrapped function.
const {count, increase, decrease, add} = counting.useModel(0);
......
```

Though, the basic function about `model` is enhancing `React.useReducer` to manage a local state, it also supports store usage with or without `React.Context` to manage a global state. 

### React.Context state management

```tsx
import {memo} from 'react';
import {model} from '@airma/react-state';

const countingStore = model(function counting(state:number){
    return {
        count: `mount: ${state}`,
        increase:()=>count + 1,
        decrease:()=>count - 1,
        add(...additions: number[]){
            return additions.reduce((result, current)=>{
                return result + current;
            }, count);
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

Using `model(xxx).createStore().asGlobal()` can build a global store.

### Global state management

```ts
import {model} from '@airma/react-state';

const countingStore = model(function counting(state:number){
    return {
        count: `mount: ${state}`,
        increase:()=>count + 1,
        decrease:()=>count - 1,
        add(...additions: number[]){
            return additions.reduce((result, current)=>{
                return result + current;
            }, count);
        }
    };
}).createStore(0).asGlobal();
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

The `useSelector` API is helpful for reducing render frequency, only when the selected result is changed, it make its owner component rerender. 

### Why support context store?

In `@airma/react-state`, store is dynamic, every `provider` copies a working instance for a context usage.

 That means: 
 
 1. The store data can be destroyed with its `provider` component unmount.
 2. Components with same store provider can be used together in one parent component without state change effect to each other.
 
 #### How to subscribe a grand parent provider store?

 The store provider system in `@airma/react-state` is designed with a tree structure. The nearest `provider` finds store one-by-one from itself to its root parent `provider`, and links the nearest matched `provider` store to the subscriber `useModel/useSelector`.

 #### Does the state change of store leads a whole provider component rerender?

 No, only the hooks subscribing this `store` may rerender their owners. Every store change is notified to its subscriber like `useModel` and `useSelector`, and then the subscriber rerenders its owner by `useState`. 

 ### Why not async action methods

 Async action often makes the problem about stale data and [zombie-children](https://react-redux.js.org/api/hooks#stale-props-and-zombie-children). So, a special tool to resolve this problem is necessary, you can try [@airma/react-effect](https://filefoxper.github.io/airma/#/react-effect/index) with it.

There are more examples, concepts and APIs in the [documents](https://filefoxper.github.io/airma/#/react-state/index) of `@airma/react-state`.

## @airma/react-effect

Simple asynchronous state-management for react. It is considered as a combined hook with `React.useEffect` and `React.useState`.

Create a callback which always returns a promise.

```ts
// parameters groupId
export function fetchUsers(groupId: number): Promise<User[]> {
    return userRequest.fetchUsersByGroupId(groupId);
}
```

Use asynchronous callback.

```tsx
import {fetchUsers} from './session';
import {useQuery} from '@airma/react-effect';

......
// useQuery calls `fetchUsers` just like a `useEffect` works.
// When the owner component is mounting, or each variable([props.groupId]) is changing, the `fetchUsers` is called. 
const [
    sessionState,
    recall,
    recallWithVariables
] = useQuery(fetchUsers, [props.groupId]);

const {
    // (Users[] | undefined), the promise resolving data.
    // Before useQuery works out, it is undefined.
    data: users,
    // boolean, if useQuery is fetching data.
    isFetching,
    // boolean, if current query has a rejection.
    isError,
    // unknown, the promise rejection
    error,
    // (undefined | Parameters<typeof fetchUsers>),
    // The parameters of current query result.
    // Before useQuery works out, it is undefined.
    variables,
    // boolean, if useQuery has fetched data successfully.
    loaded
} = sessionState;
......
// call `recall` function can trigger useQuery works manually.
recall();
......
// call `recallWithVariables` function can trigger useQuery works manually with temporary parameters.
recallWithVariables(props.groupId);
......
```

Every time `useQuery` fetches a latest data as `sessionState.data` by calling asynchronous callback, it is very useful.

The asynchronous callback for `useQuery` or `useMutation` is named `session` in `@airma/react-effect`. It makes a simple usage `API` like `model` for `@airma/react-state`.

### Local asynchronous state management

```ts
import {session} from '@airma/react-effect';

const fetchUsersSession = session((groupId: number): Promise<User[]> => {
    return userRequest.fetchUsersByGroupId(groupId);
}, 'query'); // use sessionType `query` to mark out, it is a session for `useQuery` not `useMutation`.
......
const [
    sessionState,
    recall,
    recallWithVariables 
] = fetchUsersSession.useQuery([props.groupId]);
......
```

API `useQuery` or `useMutation` can be used as a context or global asynchronous state-management hook too.

### React.Context asynchronous state management

```tsx
import {session} from '@airma/react-effect';

// create a store for sharing state change.
const fetchUsersSession = session((groupId: number): Promise<User[]> => {
    return userRequest.fetchUsersByGroupId(groupId);
}, 'query').createStore();
......
const ChildQueryComponent = ()=>{
    ......
    // when `fetchUsersSession.useQuery` works,
    // the `sessionState change` is shared with a same store subscriber like `useSession`. 
    const [
        sessionState,
        recall,
        recallWithVariables 
    ] = fetchUsersSession.useQuery([props.groupId]);
    ......
};

const ChildReceptionComponent = ()=>{
    ......
    // the store.useSession can accept the sessionState change caused by the same store `useQuery` or `useMutation`.
    const [
        sessionState,
        recall
    ] = fetchUsersSession.useSession();
    ......
};

// provide store to component. 
const Component = fetchUsersSession.provideTo(function Comp(){
    return (
        <>
            <ChildQueryComponent/>
            <ChildReceptionComponent/>
        </>
    );
});
```

Use `session(xxx,'query'|'mutation').createStore().asGlobal()` can create a global store, which can be used directly without provider.

### Global asynchronous state management

```tsx
import {session} from '@airma/react-effect';

// make store global
const fetchUsersSession = session((groupId: number): Promise<User[]> => {
    return userRequest.fetchUsersByGroupId(groupId);
}, 'query').createStore().asGlobal();
......
const ChildQueryComponent = ()=>{
    ......
    const [
        sessionState,
        recall,
        recallWithVariables 
    ] = fetchUsersSession.useQuery([props.groupId]);
    ......
};

const ChildReceptionComponent = ()=>{
    ......
    const [
        sessionState,
        recall
    ] = fetchUsersSession.useSession();
    ......
};
 
 // a global store API can be used directly without provider.
const Component = function Comp(){
    return (
        <>
            <ChildQueryComponent/>
            <ChildReceptionComponent/>
        </>
    );
};
```

### API useMutation

The API `useMutation` or `(session\sessionStore).useMutation` is similar with `useQuery`.

The different is `useMutation` should be triggered to work manually.

```ts
import {session} from '@airma/react-effect';

const saveUserSession = session((user: User): Promise<void> => {
    return userRequest.saveUser(user);
}, 'mutation'); // use sessionType `mutation` to mark out, it is a session for `useMutation` not `useQuery`.
......
const [
    sessionState,
    recall,
    recallWithVariables 
] = saveUserSession.useMutation([state.user]);
......
// trigger it manually
recall();
......
recallWithVariables();
```

The `useMutation` API works with a block mode. If it is working, it refuses other triggered missions.

### Change default trigger ways

Set `triggerOn` config property to `useQuery` or `useMutation` can change the default trigger ways of these hooks.

Make `useMutation` works when variables changes.

```ts
import {session} from '@airma/react-effect';

const saveUserSession = session((user: User): Promise<void> => {
    return userRequest.saveUser(user);
}, 'mutation'); 
......
const [
    sessionState,
    recall,
    recallWithVariables 
] = saveUserSession.useMutation({
    variables: [state.user],
    // This setting makes useMutation works when `state.user` changes.
    triggerOn: ['update', 'manual']
});
......
recall();
......
recallWithVariables();
```

Be careful if the config of `useMutation` is using `update` or `mount` trigger way, it works without a block  `protection` mode.

Make `useQuery` works only when it is triggered manually.

```ts
import {session} from '@airma/react-effect';

const fetchUsersSession = session((groupId: number): Promise<User[]> => {
    return userRequest.fetchUsersByGroupId(groupId);
}, 'query'); 
......
const [
    sessionState,
    recall,
    recallWithVariables 
] = fetchUsersSession.useQuery({
    variables: [props.groupId],
    triggerOn: ['manual']
});
......
```

### Strategies

There are full strategies to decorate the actions about `useQuery` and `useMutation`, like debounce, throttle, once, memo, and so on.

Set these strategies to `useQuery` or `useMutation` can help session works better.

```ts
import {session} from '@airma/react-effect';

const fetchUsersSession = session((groupId: number): Promise<User[]> => {
    return userRequest.fetchUsersByGroupId(groupId);
}, 'query'); 
......
const [
    sessionState,
    recall,
    recallWithVariables 
] = fetchUsersSession.useQuery({
    variables: [props.groupId],
    // Strategy.debounce makes useQuery works debounce with 300 ms duration time.
    // Strategy.memo makes useQuery use the old sessionState.data, if the work out data equals old data by calling `JSON.stringify`.
    strategy: [Strategy.debounce(300), Strategy.memo()]
});
......
```

### Questions?

`@airma/react-effect` dependent `@airma/react-state`, and the state sharing way is just like `@airma/react-state`.

There are more examples, concepts and APIs in the [documents](https://filefoxper.github.io/airma/#/react-effect/index) of `@airma/react-effect`.

## @airma/react-hooks

A lot of APIs about `@airma/react-state` and `@airma/react-effect` are too similar. So, `@airma/react-hooks` is a better choosen for using both of them. It combine these two packages APIs together.

```tsx
import {model, session} from '@airma/react-hooks';

const countingStore = model(function counting(state:number){
    return {
        count: `mount: ${state}`,
        increase:()=>count + 1,
        decrease:()=>count - 1,
        add(...additions: number[]){
            return additions.reduce((result, current)=>{
                return result + current;
            }, count);
        }
    };
}).createStore(0);

const fetchUsersSession = session((groupId: number): Promise<User[]> => {
    return userRequest.fetchUsersByGroupId(groupId);
}, 'query').createStore();
......
// combine different stores together, and provide to a root component
const Component = countingStore.with(fetchUsersSession).provideTo(function Comp(){
    ......
});
```
