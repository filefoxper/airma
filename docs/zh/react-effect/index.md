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
    const [state, trigger, execute] = useQuery(
        // 异步查询函数
        fetchUsers,
        // 查询参数
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

当 useQuery 被加载或其依赖参数发生变化时会自动触发查询。不用怀疑，这套自动触发机制采用的就是 React 渲染副作用机制 useEffect。

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
        execute
    ] = useMutation(
        // 异步修改函数
        saveUser,
        // 修改参数
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
        // 人工触发异步修改，
        // 触发器使用 useMutation 设置的参数，
        // 不需要另外传入。
        trigger();
    }

    const handleClickWithParameters = ()=>{
        // 人工执行异步修改，
        // 执行器需要额外提供参数。
        execute(user);
    }

    ......
}
```

不同于 useQuery，useMutation 需要人工触发异步修改操作，默认情况下，是不能随渲染副作用自动执行的。

### Session

每个异步状态管理单元都被称为[会话](/zh/react-effect/concepts?id=会话) (session)，无论 useQuery 还是 useMutation 都是创建会话的工具。通过 [session](/zh/react-effect/api?id=session) 会话声明 API 来使用 useQuery 和 useMutation 更自然，更流畅。

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
        execute
        // 使用 session.useQuery
    ] = userQuerySession.useQuery(
        // 查询参数
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

 session 预设了异步操作函数。session.useQuery/session.useMutation 的运行规则与 useQuery/useMutation 相同。

useQuery/useMutation 直接使用异步函数创建的是一个本地会话。通过 session.createStore() 的方式可以创建一个动态会话库，并使用库的方式管理异步状态。

### React.Context 动态会话库

```ts
import React from 'react';
import {session} from '@airma/react-effect';
import {User} from './type';

type UserQuery = {
    name: string;
    username: string;
}

// 创建一个动态会话库
const userQueryStore = session(
    (query: UserQuery):Promise<User[]> =>
        Promise.resolve([]),
    'query'
).createStore();

const SearchButton = ()=>{
    // 通过 useSession 可监听本地库状态的变化
    const [
        // 本地库状态
        {isFetching},
        // 调用 triggerQuery 可以触发当前库下的 useQuery 执行会话。
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
// 动态库并不维护会话状态，其实质是键的库状形态。
// 真正用于维护会话状态的库创建于 Provider 组件中
const App = userQueryStore.provideTo(()=>{
    const [query, setQuery] = useState({name:'', username:''});
    const [
        state, 
        // useQuery 可以将每次执行产生的会话状态存储到本地库中
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

关于支持 React.Context 动态库的原因可参考 [@airma/react-state 中的解释](/zh/react-state/index?id=为什么要支持-reactcontext-库管理模式？)。

**动态库**是包装成库形态的[键](/zh/react-effect/concepts?id=键)；键是创建 Provider 内部**本地库**的模板，也是连接本地库的通道。

动态库可以在不同的 Provider 组件元素中产生不同的本地库。这些依附于 Provider 元素的本地库互不干扰，并随依附组件元素的卸载而销毁。

### 全局静态库

与 `@airma/react-state` 不同的是，异步状态似乎更适合全局静库的状态管理模式。全局静态库的会话状态是直接维护在当前静态库对象中的，是真正意义上的库。

```ts
import React from 'react';
import {session} from '@airma/react-effect';
import {User} from './type';

type UserQuery = {
    name: string;
    username: string;
}

// 使用动态库的 asGlobal 方法，可创建全局静态库
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

通过 useSession API 获取的[会话状态](/zh/react-effect/concepts?id=会话状态)数据类型（data）可能是 undefined。如确认使用的会话已成功加载（执行成功过或有默认数据），可使用 useLoadedSession API 来代替 useSession 工作，这时获取的**会话状态数据**类型完全与异步函数返回的 Promise resolve 类型相同。

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
    // 确认当前会话已加载，
    // useLoadedSession 可用于稳定 data 的数据类型
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
            // 默认会话数据
            // 如果一个会话设置了默认会话数据，
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

想使用 debounce 防抖异步执行方式？

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

[Strategy](/zh/react-effect/api=strategy) API 提供了丰富的常用策略。单独或组合使用这些[策略](/zh/react-effect/concepts?id=策略)，可修改会话的运行效果。

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
                // 会话数据渲染缓存策略，
                // 如旧会话状态数据与本次执行结果数据等价，
                // 则继续使用旧会话状态数据，以提升渲染性能
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
                    // 缓存容量
                    capacity:10, 
                    // 每条缓存数据的有效期
                    staleTime:5*60*1000
                })
            ]
        }
    );

    ......
}
```

## 介绍

`@airma/react-effect` 主要负责异步状态管理工作，它依赖了 [@airma/react-state](/zh/react-state/index) 工具包，并借助了如键、动态库等诸多概念，因此在 API 上多有重叠。如果需要同时使用这两个工具包，推荐选用 [@airma/react-hooks](/zh/react-hooks/index)，它整合了两个包的通用 API，同时包囊了各自不同的常用 API。

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