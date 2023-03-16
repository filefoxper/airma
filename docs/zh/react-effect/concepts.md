# 概念

本章节提及的是 `useQuery` 与 `useMutation` 的通用概念，可以帮助你快速理解 `@airma/react-effect`。

1. [依赖](/zh/react-effect/concepts?id=依赖)
2. [触发](/zh/react-effect/concepts?id=触发)
3. [会话](/zh/react-effect/concepts?id=会话)
4. [策略](/zh/react-effect/concepts?id=策略)

## 依赖

依赖是驱动 `useQuery` 和 `useMutation` 运行的数据元，它是一个`数组`。当数组中的某个元素在组件更迭过程中产生了变化，`useQuery` 和 `useMutation` 就有可能被触发运行查询或修改。

是的，你没有看错， `useMutation` 也可能受依赖驱动的影响，在之后的[触发](/zh/react-effect/concepts?id=触发)小节，我们将进行详细说明。

依赖数据元可以被分为`变量依赖`和`自定义依赖`两种类型。

### 变量依赖

一个`查询`操作的最佳状态就是条件（变量）驱动，即变量就是`依赖`，我们称之为`变量依赖`。大部分情况下，我们只需要提供变量数组就可以实现`查询`功能。如：

```ts
import React from 'react';
import {useQuery} from '@airma/react-effect';
import {User} from './type';

......

const fetchUsers = ......;

const App = ()=>{
    // 提供变量
    const [query, setQuery] = useState({name:'', username:''});

    const [state, trigger, execute] = useQuery(
        // 查询请求函数
        fetchUsers,
        // 使用变量依赖驱动查询
        [query]
    );

    ......
}
```

或者使用 `config` 模式：

```ts
import React from 'react';
import {useQuery} from '@airma/react-effect';
import {User} from './type';

......

const fetchUsers = ......;

const App = ()=>{
    // 提供变量
    const [query, setQuery] = useState({name:'', username:''});

    const [state, trigger, execute] = useQuery(
        // 查询请求函数
        fetchUsers,
        // config 模式
        {
          // 使用变量依赖驱动查询
          variables: [query]
        }
    );

    ......
}
```

有时，`变量依赖`并不足以满足我们的需求，如：在依赖变量没有变化的时候，我们依然需要强制驱动`查询`，这时我们有两种驱动模式：`手动触发`或`自定义依赖`，这里我们仅介绍`自定义依赖`驱动方式。

### 自定义依赖

在使用`自定义依赖`进行驱动时，`变量依赖`将处于失效状态，也就是说这时的`变量依赖`仅仅只有充当查询条件的作用。

```ts
import React from 'react';
import {useQuery} from '@airma/react-effect';
import {User} from './type';

......

const fetchUsers = ......;

const App = ()=>{
    // 提供变量
    const [query, setQuery] = useState({name:'', username:''});

    // 提供自定义依赖
    const [queryVersion, setQueryVersion] = useState(0);

    const [state, trigger, execute] = useQuery(
        // 查询请求函数
        fetchUsers,
        // config 模式
        {
          // 变量依赖失效，仅作查询条件
          variables: [query],
          // 自定义依赖驱动，
          // 无论 query 还是 queryVersion 发生迭代变更，都会再次触发查询
          deps: [query, queryVersion]
        }
    );

    ......
}
```

`自定义依赖`驱动模式，只能通过 `config.deps` 配置启动。

## 触发

现在我们知道了 `useQuery` 和 `useMutation` 可以通过`会话加载`、`依赖驱动`和`手工启动`三种方式`触发`查询或修改数据。

这不得不归功于我们的`触发器`工作机制。触发器共有三种工作模式 `mount`、 `update`、 `manual`，分别对应 `会话加载时`、`依赖更新时`、`手动触发时` 三种状态。触发器工作模式限定了 `useQuery` 和 `useMutation` 拥有的启动方式，只有经过触发器的允许才能触发相应的工作模式。`useQuery` 和 `useMutation` 拥有各自默认的触发器模式。

`useQuery` 的默认触发模式为 `['mount', 'update', 'manual']`，所以在上述三种情况下，它都能被触发工作；而 `useMutation` 的默认触发模式仅为 `['manual']`，所以它只能通过手动触发的方式进行工作。

但触发器是可以被重新设置的：

```ts
import React from 'react';
import {useMutation} from '@airma/react-effect';
import {User} from './type';

// 保存回调函数
const saveUser = (user: User): Promise<User> => 
    Promise.resolve(user);

const App = ()=>{
    // 需要保存的 user 数据
    const [user, setUser] = useState<User>({...});

    // 需手动触发
    const [state, trigger] = useMutation(
        // 设置保存请求函数
        saveUser,
        {
          // 设置保存参数
          variables: [ user ],
          // 将触发器设置为 update 模式。
          // 这时，变量依赖驱动被启动，人工触发被关闭，
          // 只有变量 user 的改变才能触发保存操作。
          triggerOn: ['update']
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

    const handleSubmit = (submitingUser: User)=>{
        // 通过改变变量 user 引发保存操作
        setUser(submitingUser);
    }

    ......
}
```

触发器可以触发请求函数工作，请求的结果最终将记入会话。接下来让我们来看看会话的概念。

## 会话

会话是指通过 `useQuery` 或 `useMutation` 建立的异步副作用单元，这个单元由一个会话状态值和一个会话触发器函数组成：`[state, trigger]`。

### 会话状态

会话状态 `state` 自 `useQuery` 或 `useMutation` 调用开始就存在了，不受 promise 回调函数运行与否的影响。`state` 结构如下：

```ts
type SessionState<T> = {
  data: T | undefined,
  error?: any;
  isError: boolean;
  isFetching: boolean;
  abandon: boolean;
  triggerType: undefined | TriggerType;
  loaded: boolean;
}
```

字段含义：

* data - 最近一次请求成功返回的数据，在下次请求成功前会一致存在，默认为 undefined。
* error - 最近一次请求失败的错误信息，会被成功的请求清理为 undefined，默认为 undefined。
* isError - 最近一次请求是否失败，若失败为 true，否则为 false。会被成功的请求重置为 false，默认值为 false。
* isFetching - 请求是否正在进行中，在请求开始时会被设置为 true，结束时无论失败与否都会被重置为 false，默认为 false。
* abandon - 

### 会话触发器

The parameters for `promise callback`, we call it variables, it should be an array. When the `promise callback` is called by dependencies change, or triggered manually, it is used as parameters for `promise callback` function.

## 策略

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

You can use a list to chain strategies together like: `[Strategy.debounce(300), Strategy.once()]`. It wraps another from left to right, and finally it wraps the actual promise callback in.

A strategy looks like:

```ts
function once(): StrategyType {
  // Function oc is a strategy
  return function oc(value: {
    current: () => PromiseResult;
    variables: any[]; // current varibles for runner.
    runner: () => Promise<PromiseResult>;
    store: { current?: any };
  }) {
    // It accepts a parameter.
    // Field current is a callback for getting current state.
    // Field runner is a next strategy callback 
    // or the final actual promise callback.
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

A strategy callback should always returns a promise, and resolve with a [state](/react-effect/concepts?id=state) like object. You can ignore promise result by setting the `abandon` field `true` in resolving state result.

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