# 引导

`@airma/react-effect` 同时管理[本地会话]()与[上下文会话]()两种情形。本章节，我们将着重介绍如何使用本地会话进行简单的本地请求操作；如何使用上下文会话进行较为复杂的请求数据同步，及跨组件操作等内容。

The usage about `@airma/react-effect` is simple enough. We will introduce some practical usage in this section.

## 本地回话

本地会话涉及的查询和修改操作十分简单。通过合理区分每种不同异步操作的类型，配合正确的策略，就能简单满足我们的大部分需求。

### useQuery

如果一个会话仅仅涉及简单的数据查询工作，那么 `useQuery` 就是最佳选择。通常我们会对一个查询功能使用 `Strategy.throttle`、`Strategy.memo`、`Strategy.success`、`Strategy.error` 等策略。

#### 依赖查询

最常见的查询就是依赖查询，而依赖查询中的变量依赖最为常见。

```ts
import React from 'react';
import { message } from 'antd';
import { useQuery, Strategy } from '@airma/react-effect';
import { User } from './type';

// 查询参数类型
type UserQuery = {
    name: string;
    username: string;
}

const fetchUsers = (query: UserQuery):Promise<User[]> =>
        Promise.resolve([]);

const App = ()=>{
    const [query, setQuery] = useState({name:'', username:''});

    const [ state ] = useQuery(
        // 设置查询请求函数
        fetchUsers,
        {
            // 根据变量依赖查询
            variables: [query],
            strategy: [
                // 设置 30 秒内，若变量序列化字符串没有，不发起请求的节流策略
                Strategy.throttle(30000),
                // 设置结果数据序列化字符串没有变化，直接使用当前会话数据的策略
                Strategy.memo(),
                // 设置错误处理策略
                Strategy.error(message.error)
            ]
        }
    );

    const {
        // User[] | undefined
        data,
        // 是否正在请求数据
        isFetching,
        // 是否请求出错
        isError,
        // 是否有过一次正确请求
        loaded
    } = state;
    ......
}
```

#### 级联查询

有时，我们需要使用互相依赖等待的 `useQuery` 进行级联查询，这时我们可以利用 `triggerOn` 来控制我们下行 `useQuery` 在上行数据更新成功后进行。

```ts
import React from 'react';
import { message } from 'antd';
import { useQuery, Strategy } from '@airma/react-effect';
import { User } from './type';

// 查询参数类型
type UserQuery = {
    id: string;
}

// 获取当前登陆用户请求
const fetchLoginUser = ():Promise<User> =>
        Promise.resolve([{id:'1', username:'xxx', name:'xxx'});

// 通过 id 获取用户详细信息
const fetchUserDetail = (id: number|undefined):Promise<User> =>{
    if (id == null) {
        throw new Error('xxx');
    }
    return Promise.resolve([{id:query.id, age: 10, introduce: 'xxx'});
}

const App = ()=>{
    const [ userState ] = useQuery(fetchLoginUser,[]);

    const [ detailState ] = useQuery(
        // 设置查询请求函数
        fetchUserDetail,
        {
            // 根据变量依赖查询
            variables: [userState?.data?.id],
            strategy: [
                // 设置 30 秒内，若变量序列化字符串没有，不发起请求的节流策略
                Strategy.throttle(30000),
                // 设置结果数据序列化字符串没有变化，直接使用当前会话数据的策略
                Strategy.memo(),
                // 设置错误处理策略
                Strategy.error(message.error)
            ],
            // 使用更新触发模式
            // 依赖的 userState?.data?.id 变更后才开始查询，
            // userState?.data?.id 原始值为 undefined。
            triggerOn: ['update']
        }
    );

    const {
        // User[] | undefined
        data,
        // 是否正在请求数据
        isFetching,
        // 是否请求出错
        isError,
        // 是否有过一次正确请求
        loaded
    } = state;
    ......
}
```

上例通过使用 `update` 触发模式查询。在上行 `useQuery(fetchLoginUser)` 加载时 `userState?.data?.id` 为 undefined，而此时由于下行 `useQuery(fetchUserDetail)` 不存在 `mount` 模式，所以不会在加载时触发查询。当上行 `useQuery(fetchLoginUser)` 查询成功后， `userState?.data?.id` 变成 `1`，这个改变触发了下行 `useQuery(fetchUserDetail)` 的 `update` 模式工作。 

#### 定时查询

通常涉及到的定时查询以人工触发 `trigger` 函数为佳。我们可以通过 `manual: true`，将 `useQuery` 设置为人工触发模式。该配置相当于 `triggerOn: ['manual']` 的快捷方式。

```ts
import React from 'react';
import { message } from 'antd';
import { useQuery, Strategy } from '@airma/react-effect';
import { User } from './type';

// 查询参数类型
type UserQuery = {
    name: string;
    username: string;
}

const fetchUsers = (query: UserQuery):Promise<User[]> =>
        Promise.resolve([]);

const App = ()=>{
    const [query, setQuery] = useState({name:'', username:''});

    const [users, setUsers] = useState<User[]>([]);

    // 直接使用 isFetching 查看请求是否还在进行中
    const [ { isFetching }, trigger, execute] = useQuery(
        // 设置查询请求函数
        fetchUsers,
        // 请求参数
        {
            variables: [query],
            strategy: [
                // 设置 30 秒内，若变量序列化字符串没有，不发起请求的节流策略
                Strategy.throttle(30000),
                // 设置结果数据序列化字符串没有变化，直接使用当前会话数据的策略
                Strategy.memo(),
                // 设置成功后直接把结果设置到 useState 的策略
                Strategy.success(setUsers),
                // 设置错误处理策略
                Strategy.error(message.error)
            ],
            // 相当于 triggerOn: ['manual']，
            // 只支持手动触发模式
            manual: true
        }
    );

    useEffect(()=>{
        // 20 秒触发一次查询
        const id = setInterval(()=>{
            trigger();
        }, 20000);
        return ()=>{
            clearInterval(id);
        }
    },[]);

    ......
}
```

### useMutation

修改的异步操作通常通过手动触发的形式使其工作，如：

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

因为修改相对比较简单，复杂的例子也和 `useQuery` 类似，就不再展开叙述了。

## 上下文会话

本地会话基本可以足够一个简单页面的增删改查需求了。但如果查询数据可以通过上下文状态的方式，在需要的深层子组件中直接获取，而非 props 层层传递，那会更加方便。

`@airma/react-effect` 提供了这个能力。为了实现会话的上下文同步，我们采取了和 `@airma/react-state` 的[上下文状态](/zh/react-state/guides?id=上下文状态)管理一样的机制，通过键库匹配的方式进行上下文间的关联同步。

1. 使用 `createSessionKey` API 创建一个会话`键`。
2. 将创建好的会话`键`集合（可以是独立的`键`，也可以是由`键`组成的对象或数组）提供给 `SessionProvider` 组件，用于生成会话`库`（store）。
3. 通过 `useQuery` 或 `useMutation` 关联创建好的会话`键`来链接 `SessionProvider` 组件实例中的 `库`。请求所得的会话结果最终会发往与`键`匹配的`库`，从而支持上下文关联。需要知道的是所有使用同一会话`键`的 `useQuery` 或 `useMutation` 共享通一个上下文会话。
4. 因为每个 `useQuery` 都拥有监听依赖查询数据的能力，在只想使用会话状态或只想手动触发查询，而不希望依赖查询的组件内使用被动接收 API `useSession`。
