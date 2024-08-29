# 引导

本节主要介绍 `@airma/react-effect` 中各种常用的 API 功能、用法。

## useQuery

API [useQuery](/zh/react-effect/api?id=usequery) 用于建立异步查询会话。查询会话基本策略功能为，始终以最新一次执行产生的数据为会话状态数据。查询会话默认以全量触发模式运行（即：支持加载、更新、人工触发模式）。

查询会话可接收一个异步函数作为最终执行函数，也可以使用会话[键](/zh/react-effect/concepts?id=键)中的寄生执行函数工作。

```ts
//session.ts
import {User} from './type';

type UserQuery = {
    name: string;
    username: string;
}
// 异步执行函数
export function fetchUsers(query: UserQuery):Promise<User[]> {
    return Promise.resolve([]); 
}
```

#### 运行本地查询会话

```ts
// page.tsx
import React from 'react';
import {useQuery} from '@airma/react-effect';
import {fetchUsers} from './session';

const Page = ()=>{
    const [query, setQuery] = useState({name:'', username:''});
    // 以类似 useEffect 的形式工作，依赖项为参数 query
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
        // 触发查询
        trigger();
    }

    const callExecute = ()=>{
        // 传参执行查询
        execute({name:'name',username:''});
    }
}
```

#### 提供默认会话数据

```ts
const [
    {
        // User[]
        // 初始化时数据为默认会话数据
        data
    }
] = useQuery(fetchUsers, {
    variables: [query],
    // 提供默认会话数据
    defaultData: []
}); 
```

#### 非参数自动查询依赖项

```ts
const [
    {
        // User[]
        data
    }
] = useQuery(fetchUsers, {
    variables: [query],
    defaultData: [],
    // 自定义依赖项，当 query.name 变更时发生查询
    deps: [query.name]
}); 
```

#### 更改查询触发条件

```ts
useQuery(fetchUsers, {
    variables: [query],
    defaultData: [],
    deps: [query.name],
    // 限制为只在依赖项更新时查询，
    // 这时无论 useQuery 加载还是手动触发均失效
    triggerOn: ['update']
}); 
```

#### 查询结束回调

```ts
import {useResponse} from '@airma/react-effect';

const [sessionState] = useQuery(fetchUsers, {
    variables: [query],
    defaultData: [],
    deps: [query.name],
    triggerOn: ['update']
}); 
// 当一次查询结束后调用回调函数
useResponse((state)=>{
    // state 为执行完成后的会话状态
    const {variables} = state;
    doSomething(state);
}, sessionState); // 需监听 useQuery 的会话状态

// 当一次查询成功结束后调用回调函数
useResponse.useSuccess((data, state)=>{
    // data 为执行成功后的会话数据
    // state 为执行成功后的会话状态
    const {variables} = state;
    doSomething(state);
}, sessionState); // 需监听 useQuery 的会话状态

// 当一次查询执行失败后调用回调函数
useResponse.useFailure((error, state)=>{
    // error 为执行失败后的会话错误信息
    // state 为执行失败后的会话状态
    const {variables} = state;
    doSomething(state);
}, sessionState); // 需监听 useQuery 的会话状态
```

也可使用完成回调策略。

```ts
import {Strategy} from '@airma/react-effect';

const [sessionState] = useQuery(fetchUsers, {
    variables: [query],
    defaultData: [],
    deps: [query.name],
    triggerOn: ['update'],
    // 回调策略
    strategy: [
        Strategy.response((state)=>{...}),
        Strategy.response.success((data, state)=>{...}),
        Strategy.response.failure((error, state)=>{...}),
    ]
}); 
```

#### 强制手工执行查询

```ts
const [sessionState, , execute] = useQuery(fetchUsers, {
    // 无 variables 参数，进入强制手工执行模式
    defaultData: [],
}); 

const callExecute=()=>{
    // 强制手工执行模式，使用 execute 执行函数才是安全的做法。
    execute(query);
}
```

#### 最受欢迎的查询会话策略

```ts
import {Strategy} from '@airma/react-effect';

useQuery(fetchUsers, {
    variables: [query],
    strategy: [
        // 防抖策略
        Strategy.debounce(300),
        // 会话数据缓存策略，
        // 提升查询结果的渲染性能。
        Strategy.memo(),
        // SWR 缓存策略
        Strategy.cache({capacity:10}),
        // 查询成功后回调策略
        Strategy.response.success((data)=>{
            doSomething(data);
        })
    ]
}); 
```

使用 useQuery 管理库存会话，常常需要与 [useSession](/zh/react-effect/guides?id=usession) API 配合使用，相关内容将在介绍
[provide](/zh/react-effect/guides?id=provide) 和 [useSession](/zh/react-effect/guides?id=usession) 部分介绍。

## useMutation

API [useMutation](/zh/react-effect/guides?id=usemutation) 用于管理修改会话。默认情况下只支持原子性的人工触发方式。

与 useQuery 一样，useMutation 也支持本地会话管理和库存会话管理两种模式。

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

#### 运行本地修改会话

```ts
// page.tsx
import React from 'react';
import {useMutation} from '@airma/react-effect';
import {saveUser} from './session';

const Page = ()=>{
    const [user, setUser] = useState({name:'', username:''});
    // 默认只支持手工触发模式
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
        // 人工触发会话
        trigger();
    }

    const callExecute = ()=>{
        // 调人工执行会话，需要传参执行
        execute({name:'name',username:'username'});
    }
}
```

#### 修改默认触发方式

```ts
useMutation(saveUser, {
    variables: [user],
    // 通过 triggerOn 修改允许的触发方式。
    // 当 useMutation 限制使用 update 触发方式时，
    // 只有依赖变化才能触发会话执行。
    triggerOn: ['update']
}); 
```

当 useMutation 的触发方式为**非人工触发**时，执行异步函数**不再遵循阻塞的原子性操作**。

#### 最受欢迎的修改会话策略

```ts
import {Strategy} from '@airma/react-effect';

useMutation(saveUser, {
    variables: [user],
    strategy: [
        // 一次性策略，
        // 只允许修改操作成功运行一次。
        // 在修改成功后自动关闭的弹窗组件中特别受欢迎。
        Strategy.once(),
        // 修改成功后回调策略
        Strategy.response.success((data)=>{
            doSomething(data);
        })
    ]
}); 
```

#### 其他用法？

useMutation 的其他用法可参考 useQuery 用法。

## provide

库的使用可以让 React 状态管理变得更加简单易懂。`@airma/react-effect` 支持创建**动态**和**静态**两种不同形态的库。 [Provider](/zh/react-effect/api?id=provider) 组件通过持有[键](/zh/react-effect/concepts?id=键)可动态创建一个维护在 Provider 内部的本地库，useQuery/useMutation/useSession 可通过键订阅库的状态变更，也可通过执行触发更新库的状态。

[provide](/zh/react-effect/api?id=provide) 为 Provider 组件的高阶形态（High-Order-Component），更加易用。

#### 创建会话键

```ts
// session.ts

import {createSessionKey} from '@airma/react-effect';

// 将异步函数 fetchUsers 包装成一个查询会话键
const queryKey = createSessionKey(fetchUsers, 'query');

// 将异步函数 saveUser 包装成一个修改会话键
const saveKey = createSessionKey(saveUser, 'mutation');
```

使用 [createSessionKey](/zh/react-effect/api?id=createsessionkey) API 可将异步函数包装成会话键。

#### 创建会话库

```ts
// usage.tsx
import {queryKey, saveKey} from './session';
import {provide} from '@airma/react-effect';

const sessions = {
    query: queryKey,
    save: saveKey
}

// 调用 provide 高阶组件函数，传入键（或键的集合），
// 可得到一个 Provider 的次级高阶组件，
// 该组件可包囊需要使用库的自定义组件。
const wrap = provide(sessions);

// 包囊自定义组件，
// 包囊组件中的 Provider 会根据会话键创建本地会话库
const Component = wrap((props:Props)=>{
    // 库的使用范围包含了整个自定义组件。
    // useQuery 通过会话键管理库中的会话状态
    useQuery(sessions.query, [props.query]);
    return (
        <>
            <Child1 />
            <Child2 />
        </>
    );
});
```

在 Provider 组件的包囊范围内，useQuery/useMutation 可通过键实时获取会话状态变更，并将会话操作产生的状态更新至库中，以便其他同键会话使用者订阅。

直接使用 [Provider](/zh/react-effect/api?id=provider) 组件创建库的效果会稍有不同。

```ts
// usage.tsx
import {queryKey, saveKey} from './session';
import {Provider} from '@airma/react-effect';

const sessions = {
    query: queryKey,
    save: saveKey
}

const Component = (props:Props)=>{
    // 使用 Provider 创建的库包囊范围并不包含当前自定义组件 return 前的内容，
    // 因此不能在自定义组件 return 前使用库。
    return (
        <Provider value={sessions}>
            <Child1 />
            <Child2 />
        </Provider>
    );
};
```

## useSession

API [useSession](/zh/react-effect/api?id=usesession) 可通过会话[键](/zh/react-effect/concepts?id=键)订阅本地库中的会话状态，也可通过 trigger 和 execute 方法人工触发 useQuery/useMutation 执行会话。

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
    // useSession 通过键订阅库状态
    const [
        // 会话状态
        querySessionState, 
        // 触发器,
        // 通过调用触发器，人工触发同键 useQuery 查询
        triggerQuery，
    ] = useSession(sessions.query);

    const {
        // User[] | undefined
        // 虽然 useQuery 设置了默认会话数据，
        // 但 useSession 得到的会话数据类型依然被识别为可能 undefined
        data,
    } = querySessionState;
    
    return ......;
}

const Child2 = ()=>{
    return ......;
}

// 简化 provide 包装过程
const Component = provide(sessions)((props:Props)=>{
    useQuery(sessions.query, {
        variables: [props.query],
        // 设置默认会话数据
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

useSession 的触发器函数会触发所有同键[会话](/zh/react-effect/concepts?id=会话)（useQuery/useMutation），当同键会话同时被触发时，只有一个会被允许执行，其他会话处于静默订阅状态（虽然不执行，但可以订阅会话状态变更）。

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
        // 触发所有 useQuery(sessions.query, xxx)
        triggerQuery
    ] = useSession(sessions.query);
    return ......;
}

const Child2 = ()=>{
    const q = useMemo(()=>({name:'',username:''}),[]);
    // 同键 useQuery 同时触发时，只有一个被允许执行
    useQuery(sessions.query, [q]);
    return ......;
}

const Component = provide(sessions)((props:Props)=>{
    // 同键 useQuery 同时触发时，只有一个被允许执行
    useQuery(sessions.query, [props.query]);
    return (
        <>
            <Child1 />
            <Child2 />
        </>
    );
});
```

关于同键会话问题，通常更建议采用单会话（useQuery/useMutation），多监听（useSession）的解决方案，但有时这种类似抢答的同键会话问题可以成为一种优秀的公共组件设计方案。

## useLoadedSession

useSession API 返回的会话状态数据类型总是支持 undefined，即便库中的会话状态数据已经确认不可能为 undefined。

在确认会话确实已加载（执行成功过）或已经设置默认会话数据时，可使用 [useLoadedSession](/zh/react-effect/api?id=useloadedsession) API 来订阅库的会话状态。

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
    // useQuery(sessions.query, xxx) 已设置 defaultData，
    // 会话处于已加载状态，
    // 这时使用 useLoadedSession 更为合理。
    const [
        querySessionState, 
        triggerQuery
    ] = useLoadedSession(sessions.query);

    const {
        // User[]
        // useLoadedSession 得到的会话数据与异步函数结果类型完全一致。
        data,
    } = querySessionState;
    return ......;
}

const Child2 = ()=>{
    return ......;
}

const Component = provide(sessions)((props:Props)=>{
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

## 无配置useQuery/useMutation

自 18.5.0 版本开始，无 config 入参的 useQuery/useMutation 将肩负 useSession 的功能，当该 useQuery/useMutation 被人工触发时，它会先查找是否有 session key 相同，且具备 config 参数的其他 useQuery/useMutation 存在，若存在，则驱动其工作，若不存在或无法驱动其他同键 useQuery/useMutation 工作，则自己工作。

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
    // 无 config 入参的 useQuery 会通过会话键查找其他有 config 入参的 useQuery,
    // 若存在，则驱动其工作，若不存在或无法驱动其工作，则自己工作。
    const [
        // 会话状态
        querySessionState, 
        // 触发器,
        // 通过调用触发器，人工触发同键 useQuery 查询
        triggerQuery，
    ] = useQuery(sessions.query);

    const {
        // User[] | undefined
        // 虽然 Component 中的 useQuery 设置了默认会话数据，
        // 但当前 useQuery 得到的会话数据类型依然被识别为可能 undefined
        data,
    } = querySessionState;
    
    return ......;
}

const Child2 = ()=>{
    return ......;
}

// 简化 provide 包装过程
const Component = provide(sessions)((props:Props)=>{
    useQuery(sessions.query, {
        variables: [props.query],
        // 设置默认会话数据
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

API [session](/zh/react-effect/api?id=session) 可将异步函数包装成会话声明函数，会话声明函数与原异步函数几乎完全相同，但拥有大量可直接调用的常用 API。

```ts
// session.ts
import {session} from '@airma/react-effect';

// 声明查询会话
export const querySession = session(fetchUsers, 'query');

// 声明修改会话
export const saveSession = session(saveUser, 'mutation');
```

会话声明函数可采用流式调用方式使用会话 API。

```ts
// usage.tsx
import {querySession, saveSession} from './session';

// 创建动态库（被包装成库形态的键）
const queryStore = querySession.createStore();
const saveStore = saveSession.createStore();

const Child1 = ({query}: {query:UserQuery})=>{
    // queryStore.useQuery 不再需要使用会话键
    const [
        {
            data,
            isFetching
        },
        triggerQuery,
        executeQuery
    ] = queryStore.useQuery([query]);
    return ......;
}

const Child2 = ()=>{
    const [user, setUser] = useState({
        name:'',
        username:''
    });
    // queryStore.useSession 不再需要使用会话键
    const [, triggerQuery] = queryStore.useSession();
    // queryStore.useMutation 不再需要使用会话键
    const [
        saveSessionState,
        triggerSave,
        executeSave
    ] = saveStore.useMutation([user]);

    useResponse.useSuccess(()=>{
        triggerQuery();
    }, saveSessionState);
    return ......;
}

// 动态库可通过 with 方法与其他动态库或键联合成公共动态库，
// 并使用 provideTo(Component) 将自定义组件装入 Provider 库环境。
const Component = saveStore.with(queryStore).provideTo(
    (props: Props)=>{
        return (
            <>
                <Child1 query={props.query} />
                <Child2 />
            </>
        )
    }
)

// asGlobal 方法可声明一个全局静态库。
// 全局静态库是一个真正意义上的库，
// 会话状态是维护在这个静态库中的。
const globalQueryStore = queryStore.asGlobal();

// 全局静态库不需要 provide 高阶组件
const Component2 = (props:Props)=>{
    // 全局静态库可直接使用
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
    // session 的本地会话用法
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

更多[例子](/zh/react-effect/index?id=session)。

## strategy

[策略](/zh/react-effect/concepts?id=策略)系统贯穿了会话的执行过程，除了对每个会话单独使用各种策略，也可以设置全局会话策略添加公共会话特性。

```ts
import {unstable_batchedUpdates} from 'react-dom';
import {
    ConfigProvider, 
    Strategy
} from '@airma/react-effect';
import type {GlobalConfig} from '@airma/react-effect';

const globalConfig: GlobalConfig = {
    batchUpdate: unstable_batchedUpdates,
    // 设置全局策略链组合函数
    strategy: (
        // 会话运行时使用的策略链
        s: StrategyType[], 
        // 运行时会话的会话类型,
        // useQuery - query,
        // useMutation - mutation
        sessionType: 'query'|'mutation'
    ) => [
        ...s, 
        // 给所有的 useQuery 策略接入会话状态数据缓存策略
        sessionType === 'query'? Strategy.memo():null,
        // 给所有会话策略接入兜底错误处理策略
        Strategy.failure(e => {
            // 当策略链中出现多个错误处理策略时，
            // 只运行最前面的错误处理策略回调函数。
            message.error(e);
        })
    ]
}

<ConfigProvider value={globalConfig}>
......
</ConfigProvider>
```

策略链中的每一个策略函数可以与 null 动态切换。

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
        // 动态切换策略
        openMemo? Strategy.memo(): null
    ]
    // 不要动态增删策略链
});
```

**注意**，在策略链中，每个策略的位置在会话创建时就固定好了。动态排序，删除，更改，切换策略都是不被允许的，否则可能出现策略缓存异常问题。每个策略只能与 null 或 undefined 进行动态切换。

如何自定义策略？

```ts
// Strategy.validate 源码
import type {StrategyType} from '@airma/react-effect';

function validate(callback: () => boolean): StrategyType {
    // 策略函数返回的 promise 对象必须 resolve 一个 `会话状态类型` 数据
    return function validStrategy(runtime) {
        const { runner, getSessionState } = runtime;
        const result = callback();
        // 通过回调判断是否应该执行后续策略
        if (!result) {
            // 如判断结果为 false，
            // 则不运行 runner，
            // 直接返回一个自定义 resolve 会话状态的 promise 对象。
            // 通过 getSessionState 可以获取当前会话状态。
            const sessionState = getSessionState();
            return new Promise(resolve => {
                // 因为校验不通过，所以不应该修改会话状态
                resolve({
                    ...sessionState, 
                    // 将 abandon 字段设置 `true`，
                    // 策略终端会放弃当前 promise resolve 结果。
                    abandon: true 
                });
            });
        }
        // 若校验通过，则通过调用 runner 函数，继续运行后续策略。
        // runner 即当前策略所在链条位置的下一个策略函数，
        // runner 函数返回的 promise 对象始终 resolve 一个 `会话状态类型` 的数据，
        // 如最终 promise resolve 数据的 abandon 字段为 `false`，
        // 则表示最终所得的会话状态可以被接受，
        // 该数据会被更新为新的会话状态。
        return runner();
    };
}
```

一个合法的策略函数可接受一个 [runtime](/zh/react-effect/concepts?id=策略) 对象用于操作会话，同时返回一个 resolve 会话状态的 promise 对象，用于决定最终会话状态。通过对最终 promise resolve 对象标记 **abandon: true**，可迫使策略终端放弃当前执行结果。**注意**，因为其他策略也只推荐对最终会话状态做放弃标记，所以尽量不要将 **abandon** 字段标记为 **false（采纳标记）**，这可能会影响到其他策略函数的正常运行。

使用策略本地缓存：

```ts
// Strategy.once 源码
function once(): StrategyType {
    return function oc(runtime: {
        getSessionState: () => SessionState;
        runner: () => Promise<SessionState>;
        localCache: { current?: Promise<SessionState> };
    }) {
        const { runner, localCache } = runtime;
        // localCache 可用于缓存当前策略产生的状态
        // Strategy.once 策略直接缓存了后续策略返回的 promise 对象。
        // 如 localCache.current 存在，则认为当前会话已经执行。
        if (localCache.current) {
            // 对已经执行的会话直接返回执行产生的 promise 对象，
            // 并将该 promise resolve 的会话状态标记为放弃。
            // 这样就可以阻止当前会话被多次执行了。
            return localCache.current.then(d => ({
                 ...d, 
                 abandon: true 
            }));
        }
        // 如 localCache.current 不存在，则认为当前会话尚未执行。
        // 这时，可执行后续策略，同时将后续策略返回的 promise 存入 localCache，阻止会话被多次执行。
        localCache.current = runner().then(d => {
            if (d.isError) {
                // 如后续策略执行结果发生错误，
                // 则重置阻止状态，
                // 这样会话即可重新执行。
                localCache.current = undefined;
            }
        return d;
        });
        return localCache.current;
    };
}
```

## useResponse

useResponse 系列（包括 useResponse.useSuccess/useResponse.useFailure）默认关注会话响应的结果。当会话响应后，useResponse 系列对会话结果作出反应，这意味着一个早已完成的会话结果会在 useResponse 加载时被处理。

例子：

```ts
const Component = ()=>{
    const [sessionState] = useLoadedSession(sessionKey,...);

    useResponse.useSuccess(()=>{
        // 会话结果早已产生，所以在组件加载后也会响应
    },sessionState);
}

const App = ()=>{
    const [sessionState] = useQuery(sessionKey,...);

    useResponse.useSuccess(()=>{
        // 当会话结果产生后响应
    },sessionState);

    return sessionState.loaded?<Component/>:null
}
```

若想要 useResponse 系列只监听会话响应，避免在 useResponse 加载时被处理，需要使用 watchOnly 设置，强制其只做监听工作。

例子：

```ts
const Component = ()=>{
    const [sessionState] = useLoadedSession(sessionKey,...);

    useResponse.useSuccess(()=>{
        // 使用 watchOnly 设置项，强制 useResponse 只做监听工作
    },[sessionState, {watchOnly:true}]);
}

const App = ()=>{
    const [sessionState] = useQuery(sessionKey,...);

    useResponse.useSuccess(()=>{
        // 当会话结果产生后响应
    },sessionState);

    return sessionState.loaded?<Component/>:null
}
```

## ConfigProvider

ConfigProvider 组件用于全局配置 ：

* batchUpdate - 批量更新方法。当环境中 react 版本 < 18.0.0 时，需要使用 react-dom 的批量更新状态方法  unstable_batchedUpdates 优化状态更新过程。
* useGlobalFetching - 支持通过 [useIsFetching](/zh/react-effect/api?id=useisfetching) 监听所有会话的 fetching 状态。**（自v18.3.2开始，该字段被废弃）**
* strategy - 公共策略链定义函数。用于定义运行时的动态公共策略链。

```ts
import {unstable_batchedUpdates} from 'react-dom';
import {
    ConfigProvider, 
    Strategy,
    useIsFetching
} from '@airma/react-effect';
import type {GlobalConfig} from '@airma/react-effect';

const globalConfig: GlobalConfig = {
    // 使用 unstable_batchedUpdates 优化渲染性能
    batchUpdate: unstable_batchedUpdates,
    // 设置公共策略链动态组合函数
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
    // 所有会话的 isFetching 状态。
    const isFetching = useIsFetching();
    return isFetching? <Fetching/> : <Content/>
}

<ConfigProvider value={globalConfig}>
    <App />
</ConfigProvider>
```

下一节[特性](/zh/react-effect/feature)