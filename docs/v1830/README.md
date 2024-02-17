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

1. [@airma/react-state](/react-state/index)
2. [@airma/react-effect](/react-effect/index)
3. [@airma/react-hooks](/react-hooks/index)

### @airma/react-state

Simple `reducer-like` state-management with method action dispatch mode for react components.

Create `reducer-like` function:

```ts
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

```ts
import {counting} from './model';
import {useModel} from '@airma/react-state';

......
// give it an initialState can make it fly.
const {count, increase, decrease, add} = useModel(counting, 0); // initialState `0`
// call method `increase\decrease\add` can change `count` and make component rerender
......
```

Read [documents](/react-state/index) of `@airma/react-state` for more informations.

### @airma/react-effect

Simple asynchronous state-management for react. It is considered as a combined hook with `React.useEffect` and `React.useState`.

Create a callback which always returns a promise.

```ts
// parameters groupId
export function fetchUsers(groupId: number): Promise<User[]> {
    return userRequest.fetchUsersByGroupId(groupId);
}
```

Use asynchronous callback.

```ts
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

Read [documents](/react-effect/index) of `@airma/react-effect` for more informations.

### @airma/react-hooks

A lot of APIs about `@airma/react-state` and `@airma/react-effect` are too similar. So, `@airma/react-hooks` is a better choosen for using both of them. It combines the two packages APIs together.

```ts
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
