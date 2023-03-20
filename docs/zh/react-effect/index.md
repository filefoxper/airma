[![npm][npm-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/%40airma/react-effect.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/%40airma/react-effect
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
[npm-downloads-image]: https://img.shields.io/npm/dm/%40airma/react-effect.svg?style=flat-square

# @airma/react-effect

`@airma/react-effect` 是一款用于管理 React 副作用状态（state）的库，目前只涉及异步请求相关的状态管理。

## 为什么需要管理副作用状态

React hook 是一套基于函数式编程思想设计的系统，在普通回调函数中大量使用副作用会破坏了函数式编程的稳定性，使得输入输出之间没有稳定的关系。

为了更好地理解副作用对组件更新带来的破环性，我们以下面的例子来做个简单说明：

```ts
import React from 'react';

const App = ()=>{

    const [count, setCount] = useState(0);

    // 先点击 “异步 + 1” 按钮
    const handleAsyncIncrease = async ()=>{
        // 异步等待，3秒后运行 setCount(count + result);
        const result = await new Promise((resolve)=>{
            setTimeout(()=>{
                resolve(1);
            }, 3000);
        });
        // result 值为 1，
        // 因为之前同步点击已经运行了 setCount(count + 1),
        // 所这时的 count 是 1 ？
        // 1 + 1 = 2，
        // 所以运行完毕后 useState 元组中的 count 为 2 ？
        setCount(count + result);
    };

    // 然后立即点击 “同步 + 1” 按钮。
    const handleSyncIncrease = ()=>{
        setCount(count+1);
    };

    return (
        <div>
          <button onClick={handleAsyncIncrease}>异步 + 1</button>
          <button onClick={handleSyncIncrease}>同步 + 1</button>
          <span>{ count }</span>
        </div>
    )
}
```

上例中，我们先点击 “异步 + 1” 按钮，然后立即点击 “同步 + 1” 按钮，这时 count 值显示为 1，我们根据异步结果 result 也是 1，推测 3 秒后将运行 setCount(1 + 1) ，也就是说 count 最终应该显示为 2。

```
1 second later count: 1
2 seconds later count: 1
3 seconds later count: 1
...
2000 years later count: 1
```

不用等了，count 依然是 1，不会是 2。handleAsyncIncrease 中的 count 是初次渲染的 useState 元组投射变量的闭包值，3秒后运行 setCount 时，该闭包值 count 始终为 0，结果就是 0 + 1 = 1。

是的，我们常见的闭包旧数据问题往往就是由副作用破坏函数式编程稳定性产生的。为此我们需要使用 `setCount((current)=> current + result)` 回调方式来解决问题。但不断使用回调更新并非长久之计，我们需要从根本上解决问题，按 react 设计思想来使用副作用。

将副作用输入数据独立出来，并接受 react 渲染管理就显得特别有必要了。

```ts
import React, {useEffect, useState} from 'react';

const usePromise = <T>(
    promiseCallback: ()=>Promise<T>
): [T|undefined, ()=>void] =>{
    // 我们设计了一个拥有稳定 state 状态的接口，用于管理 promise 回调状态，默认值为 undefined，
    // 这是一个把异步输入托管到 React 状态更迭系统中的接口。
    const [result, setResult] = useState<T|undefined>(undefined);
    const [triggerVersion, setTriggerVersion] = useState(0);

    useEffect(()=>{
        if (!triggerVersion) {
            return;
        }
        promiseCallback(params).then((data:T)=>{
            // 只更新 promise resolve 结果
            setResult(data);
        });
    },[triggerVersion]);

    const trigger = ()=>{
        setTriggerVersion(v => v+1);
    };

    return [result, trigger];
}

const App = ()=>{
    const [count, setCount] = useState(0);

    // 先点击 “异步 + 1” 按钮
    const [result, asyncIncrease] = usePromise(
        () => {
           return new Promise((resolve)=>{
                setTimeout(()=>{
                    resolve(1);
                }, 3000);
            }); 
        }
    );

    useEffect(()=>{
        // 通过监听 promise result 变化来更新数据，
        if(result == null){
            return;
        }
        setCount(count + result);
    },[result])

    // 然后立即点击 “同步 + 1” 按钮。
    const handleSyncIncrease = ()=>{
        setCount(count+1);
    };

    return (
        <div>
          <button onClick={asyncIncrease}>异步 + 1</button>
          <button onClick={handleSyncIncrease}>同步 + 1</button>
          <span>{ count }</span>
        </div>
    )
}
```

使用 usePromise 来统一管理异步副作用输入数据，并将单一的副作用输入当作状态托管给 React 组件更迭系统（hook），然后通过监听副作用状态的变化来驱动 `setCount` 运行。这样就符合函数式编程的稳定输入输出结构了。让我们再次重复上述操作，我们发现 3 秒后，值被更新成 2，符合我们的预期。因为 useEffect 在监听到 result 变化时会使用当前最新迭代的闭包数据 count，这时 count 确实为 1，于是运行的就是 `setCount(1 + 1)`。

## 介绍

针对前端开发的日常业务，我们开发了一套比上述 `usePromise` 更符合大多业务场景的副作用状态管理工具 `@airma/react-effect`。当前库中包含了 `useQuery` 和 `useMutation` API，分别用于`查询`和`修改（增、删、该）`的异步逻辑。

我们需要为这两个 API 提供返回 promise 结果的回调函数用于实际运行。为了方便描述，我们把这个回调函数称作`请求函数`。

### UseQuery

加载时或依赖参数变化时，会调用`请求函数`。因为大多查询场景都需要在页面（或组件）加载时直接运行，依赖参数发生变化时再次运行。

```ts
import React from 'react';
import {useQuery} from '@airma/react-effect';
import {User} from './type';

// 查询参数类型
type UserQuery = {
    name: string;
    username: string;
}
// 查询请求，必须符合返回值为 promise 的先决条件
const fetchUsers = (query: UserQuery):Promise<User[]> =>
        Promise.resolve([]);

const App = ()=>{
    // 我们将请求参数设置为 state 状态数据
    const [query, setQuery] = useState({name:'', username:''});

    // useQuery 通过监听参数状态的变化调用查询请求函数
    const [state, trigger, execute] = useQuery(
        // 设置查询请求函数
        fetchUsers,
        // 请求参数
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

上例是 `useQuery` 的一个简单应用场景。`useQuery` 会在组件 App 加载或监听到参数变化时，调用查询函数，并在 promise 成功或失败后修改状态。

`useQuery` 的返回结果是一个元组数据，并稳定存在于组件中，由 `[state, trigger, execute]` 三部分组成。其中元组的 `[state, trigger]` 部分被称为`会话`，稍后我们会在概念篇中进行详细介绍。这里我们只需要了解 `state` 为查询状态（包含查询回调 promise resolve 或 reject 的数据），`trigger` 为无参手动触发函数，`execute` 为有参触发函数。

### UseMutation

`useMutation` 常用于修改数据，大多场景是需要手动触发的，所以该 API 在默认情况下，并没有采取 `useQuery` 的监听策略，我们需要通过会话元组中的 `trigger` 或 `execute` 函数去触发它。

```ts
import React from 'react';
import {useMutation} from '@airma/react-effect';
import {User} from './type';

// 保存请求函数
const saveUser = (user: User): Promise<User> => 
    Promise.resolve(user);

const App = ()=>{
    // 需要保存的 user 数据
    const [user, setUser] = useState<User>({...});

    // 需手动触发
    const [state, trigger] = useMutation(
        // 设置保存请求函数
        saveUser,
        // 设置保存参数
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

    const handleSubmit = ()=>{
        // 通过元组中的 trigger 手动触发
        trigger();
    }

    ......
}
```

`useMutation` 与 `useQuery` 返回数据结构相同，都是`会话`。

如果 `@airma/react-effect` 已经足够成为你开发项目，解决副作用问题的选项，请移步至[安装与支持](/zh/react-effect/install.md)先睹为快。如果希望了解更多相关信息，请参考[概念篇](/zh/react-effect/concepts.md)深入学习。
