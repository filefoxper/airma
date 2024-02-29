[![npm][npm-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/%40airma/react-effect.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/%40airma/react-effect
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
[npm-downloads-image]: https://img.shields.io/npm/dm/%40airma/react-effect.svg?style=flat-square

# @airma/react-effect

`@airma/react-effect` 是一款用于管理 React 异步状态的工具。

## 用法

### useQuery

API useQuery 用于管理异步查询状态。

```ts
import React from 'react';
import {useQuery} from '@airma/react-effect';
import {User} from './type';

type UserQuery = {
    name: string;
    username: string;
}
// 异步查询函数
const fetchUsers = (query: UserQuery):Promise<User[]> =>
        Promise.resolve([]);

const App = ()=>{
    const [query, setQuery] = useState({name:'', username:''});
    const [state, trigger, executeWithParams] = useQuery(
        // 使用异步查询函数
        fetchUsers,
        // 设置查询函数参数
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

当 useQuery 被加载或其依赖的参数发生变化时会自动触发查询，不用怀疑，这套自动触发机制采用的就是 React 渲染副作用机制 useEffect。

### useMutation

API useMutation 用于管理修改异步状态。

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
        // 使用异步修改函数
        saveUser,
        // 设置修改参数
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
        // 手动触发异步修改
        trigger();
    }

    ......
}
```

不同于 useQuery，useMutation 需要手动触发异步修改操作，不能随渲染副作用自动执行。

### Session

每个异步状态管理单元都被称为[会话](/zh/react-effect/concepts?id=会话) (session)，无论 useQuery 还是 useMutation 都是创建会话的工具。通过 session API 来使用 useQuery 和 useMutation 更自然。

```ts
import React from 'react';
import {session} from '@airma/react-effect';
import {User} from './type';

type UserQuery = {
    name: string;
    username: string;
}

// 使用 session API 声明一个查询会话
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
        // 使用 session.useQuery
    ] = userQuerySession.useQuery(
        // 设置查询参数
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

session.useQuery/session.useMutation 的运行规则与 useQuery/useMutation 相同，不同的只有 session 预设了异步操作函数。

useQuery/useMutation 与异步函数的直接组合只能创建一个本地会话。通过 session.createStore() 的方式可以创建一个状态库，并使用库的方式管理异步状态。

### React.Context 动态库状态管理

```ts
import React from 'react';
import {session} from '@airma/react-effect';
import {User} from './type';

type UserQuery = {
    name: string;
    username: string;
}

// 创建一个动态库
const userQueryStore = session(
    (query: UserQuery):Promise<User[]> =>
        Promise.resolve([]),
    'query'
).createStore();

const SearchButton = ()=>{
    // 通过 useSession 可监听库状态的变化
    const [
        // 库状态
        {isFetching},
        // 调用 triggerQuery 可以触发当前库下的 useQuery 工作 
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

// 动态库采用的是 React.Context 技术，
// 因此需要通过 provideTo 创建一个 Provider 高阶包装组件。
// 动态库并不维护会话状态，而是键的集合。
// 真正的库和会话状态维护在 Provider 组件库中
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

关于为什么支持 React.Context 动态库的原因可参考 [@airma/react-state 中的解释](/zh/react-state/index?id=为什么要支持-reactcontext-库管理模式？)。

动态库是[键](/zh/react-effect/concepts?id=键)的集合；键是创建 Provider 内部库的模板，也是连接库的通道。所以需要使用 [provide](/zh/react-effect/api?id=provide) 高阶组件创建一个 Provider 包装组件进行使用。

当同一个 Provider 组件元素化成不同的 React.Element 时，每个元素（React.Element）拥有不同的内部库，这些库随着组件的销毁而销毁。

### 全局静态库状态管理

不同于 `@airma/react-state` 中的模型库，异步状态似乎更适合全局静态状态管理模式。全局静态库的会话状态是直接维护在当前静态库对象中的，是真正意义上的库。

```ts
import React from 'react';
import {session} from '@airma/react-effect';
import {User} from './type';

type UserQuery = {
    name: string;
    username: string;
}

// 创建全局静态库
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

// 全局静态库不需要使用 Provider，
// 可直接连接使用，
// 会话状态是维护在该库中的，是真正意义上的库
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

通过 useSession API 获取的[会话状态](/zh/react-effect/concepts?id=会话状态) data 值类型始终可能是 undefined。如果可以保证会话库中的会话状态已经成功加载，可使用 useLoadedSession API 来代替 useSession 工作，这时获取的会话状态 data 值类型完全与异步函数返回的 Promise resolve 类型相同。

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
    // 当确信当前会话为已加载会话时，
    // store.useLoadedSession 可用于稳定 data 的数据类型
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
        // 通过 config 形式设置参数和默认值
        {
            // 参数
            variables: [query],
            // 默认值
            // 如果一个会话设置了默认值，
            // 那么该会话永远处于已加载状态
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

想要在 useQuery/useMutation 执行完毕后做些什么？

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
    
    // useResponse 可用于处理 useQuery/useMutation 执行完毕后的操作
    useResponse(
        // 处理函数
        (sessionState)=>{
            // 接收一个完成时的会话状态做参数
            const {
                data,
                isError,
                error,
                ......
            } = sessionState;
            doSomething(sessionState);
        }, 
        // 监听 useQuery 的会话状态
        state
    );

    // useResponse.useSuccess 可用于处理 useQuery/useMutation 执行成功后的操作
    useResponse.useSuccess(
        (data, sessionState)=>{
            // 接收成功完成时的会话数据和会话状态做参数
            doSomething(data);
        }, 
        // 监听 useQuery 的会话状态
        state
    );

    // useResponse.useFailure 可用于处理 useQuery/useMutation 执行失败后的操作
    useResponse.useFailure(
        (error, sessionState)=>{
            // 接收完成失败时的会话错误信息和会话状态做参数
            doSomething(error);
        }, 
        // 监听 useQuery 的会话状态
        state
    );
    ......
}
```

想使用类似 debounce 这样的防抖异步执行方式？

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
            // 使用 debounce 防抖策略
            strategy: Strategy.debounce(300)
        }
    );

    ......
}
```

[Strategy](/zh/react-effect/api=strategy) API 提供了丰富的常用策略库。这些[策略](/zh/react-effect/concepts?id=策略)可单独或组合使用，以改变部分会话特性。

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
            // 组合策略
            strategy: [
                // 检测策略，
                // 检测 query.name 是否为空,
                // 如为空字符串，则跳过本次执行。
                Strategy.validate(()=>!!query.name),
                // 防抖策略
                Strategy.debounce(300),
                // 会话数据更新缓存策略，
                // 如旧会话状态数据与本次执行结果数据等价，
                // 则继续使用旧会话状态数据，以提高渲染效率
                Strategy.memo()
            ]
        }
    );

    ......
}
```

想要使用 SWR(stale-while-revalidate) 特性？

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
                // 开启 swr 缓存策略
                Strategy.cache({
                    // 总数据容量 10 条
                    capacity:10, 
                    // 每条缓存数据的陈旧时间 5 分钟
                    staleTime:5*60*1000
                })
            ]
        }
    );

    ......
}
```

## 介绍

`@airma/react-effect` 主要负责异步状态管理工作，它依赖了 [@airma/react-state](/zh/react-state/index) 工具包，并借助了如键、动态库等诸多概念，因此在 API 上多有重叠。如果需要同时使用两个工具包，[@airma/react-hooks](/zh/react-hooks/index) 包将会是更优选择，它整合了两个包的通用 API，同时包囊了各自不同的常用 API，非常的实用。

### 为什么不推荐使用在异步函数中调用同步的 setState 来管理异步状态？

在异步函数中调用同步的 setState 很容易误入闭包产生的过时旧数据陷阱；同时也非常容易产生因组件过早卸载引起的 setState 内存泄漏问题，俗成[僵尸娃问题 (zombie-children)](https://react-redux.js.org/api/hooks#stale-props-and-zombie-children)。

## 安装与支持

当前工具的可运行包维护在[npm](https://www.npmjs.com/get-npm)官方服务器。可运行如下命令获取最新的稳定版本。

### 安装命令

```
npm i @airma/react-effect
```

### 浏览器支持

```
chrome: '>=91',
edge: '>=91',
firefox: '=>90',
safari: '>=15'
```

下一节[概念](/zh/react-effect/concepts)