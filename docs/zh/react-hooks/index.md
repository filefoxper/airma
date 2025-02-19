[![npm][npm-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/%40airma/react-hooks.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/%40airma/react-hooks
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
[npm-downloads-image]: https://img.shields.io/npm/dm/%40airma/react-hooks.svg?style=flat-square

# @airma/react-hooks

`@airma/react-hooks` 是一个合成包，它包含了以下包的常用 API：

* [@airma/react-state](/zh/react-state/index)：基于模型的 React 同步状态管理工具。
* [@airma/react-effect](/zh/react-effect/index)：基于副作用的 React 异步状态管理工具。

## 模型状态管理

```ts
import {useModel} from '@airma/react-state';

const instance = useModel((count:number)=>({
    // 渲染数据
    count,
    isNegative: count<0,
    // 行为方法，用于生成行为后的状态
    increase:()=> count + 1,
    decrease:()=> count - 1
}),0); // 默认状态 0

const {
    count, 
    isNegative,
    // 调用行为方法触发状态变更与重渲染
    decrease, 
    increase
} = instance;
```

上例通过使用类 `reducer` 的 `function` 创建了一个计数状态管理器。在 `@airma/react-state` 中，这个类 `reducer function` 被称为[模型](/zh/react-state/concepts?id=模型)（model）。

使用 [model](/zh/react-state/api?id=model) API，可以简化使用步骤，让相关的 hooks 使用更加清晰明了。

### 本地状态管理

```ts
import {model} from '@airma/react-state';

// model API 通过包装模型函数，返回一个与源模型接口相同的新模型，
// 并在新模型上挂载了一套常用模型操作 API 集合。
const counting = model(function counting(state:number){
    return {
        count: `mount: ${state}`,
        increase:()=>state + 1,
        decrease:()=>state - 1,
        add(...additions: number[]){
            return additions.reduce((result, current)=>{
                return result + current;
            }, state);
        }
    };
});
......
// 直接通过 counting.useModel 的形式使用 useModel
const {count, increase, decrease, add} = counting.useModel(0);
......
```

model API 优化了 `React.useReducer` 的使用方式，更便于管理复杂行为状态。除了与 `React.useReducer` 一样出色的本地状态管理功能，model API 还支持 React.Context 动态管理模式和全局静态库管理模式。

### React.Context 动态库管理

```ts
import {memo} from 'react';
import {model} from '@airma/react-state';

const countingStore = model(function counting(state:number){
    return {
        count: `mount: ${state}`,
        increase:()=>state + 1,
        decrease:()=>state - 1,
        add(...additions: number[]){
            return additions.reduce((result, current)=>{
                return result + current;
            }, state);
        }
    };
}).createStore(0);
// model(modelFn).createStore(defaultState) 可创建一个动态库，
// 并预设库存模型实例的默认状态 defaultState。
......
const Increase = memo(()=>{
    // useSelector 可用于重组库存模型实例的有用字段,
    // 当库存状态变更前后，重组结果发生改变，即可触发组件再渲染。
    // 当前组件选出一个模型实例方法为结果，
    // 模型实例方法是稳定不变的，所以该组件不会发生再渲染。
    const increase = countingStore.useSelector(i => i.increase);
    return <button onClick={increase}>+</button>;
});
const Count = memo(()=>{
    // useModel 可直接共享来自本地库的状态变更。
    const {count} = countingStore.useModel();
    return <span>{count}</span>;
});
const Decrease = memo(()=>{
    const decrease = countingStore.useSelector(i => i.decrease);
    return <button onClick={decrease}>-</button>;
});
// 通过 provideTo 高阶组件方式，可为子组件提供一个 React.Context 本地库环境，即 Provider 外包装组件。
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

注意，动态库并不负责维护模型实例状态，它并不是传统意义上的静态库。模型实例状态是维护在由 `provideTo` 生成的 [Provider](/zh/react-state/api?id=provider) 组件元素（React Element）中的。每个由 `Provider` 组件生成的 React 元素内存放着各自**不同**的本地库存模型实例，每个 `Provider` 组件元素的库存实例随当前元素的销毁而销毁。关于库存实例的跨域查找，及支持 React.Context 动态库的原由可参考 [为什么要支持 React.Context 共享状态模式](/zh/react-state/index?id=为什么要支持-reactcontext-库管理模式？) 中的内容。

### 全局静态库管理

```ts
import {model} from '@airma/react-state';

const countingStore = model(function counting(state:number){
    return {
        count: `mount: ${state}`,
        increase:()=>state + 1,
        decrease:()=>state - 1,
        add(...additions: number[]){
            return additions.reduce((result, current)=>{
                return result + current;
            }, state);
        }
    };
}).createStore(0).asGlobal();
// 通过简单调用 asGlobal 方法，可创建一个全局静态库。
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
// 全局静态库不需要 provideTo 即可全局使用
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

相比 React.Context 动态库，全局静态库在使用上会更加简单，但也会遇到各种其他全局静态库共同的问题，可参考 [为什么要支持 React.Context 共享状态模式](/zh/react-state/index?id=为什么要支持-reactcontext-库管理模式？) 中的内容。

### render 运行时设置默认状态

```ts
import {model} from '@airma/react-state';

const countingStore = model(function counting(state:number){
    return {
        count: `mount: ${state}`,
        increase:()=>state + 1,
        decrease:()=>state - 1,
        add(...additions: number[]){
            return additions.reduce((result, current)=>{
                return result + current;
            }, state);
        }
    };
}).createStore();
// 可创建一个无默认状态库
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

const Component = countingStore.provideTo(function Comp({defaultCount}:{defaultCount:number}) {
    // 在 render 运行时初始化库存模型实例的默认状态。
    countingStore.useModel(defaultCount);
    return (
        <div>
            <Increase/>
            <Count/>
            <Decrease/>
        </div>
    );
});
```

相较其他工具库的静态初始化默认状态的方式，`@airma/react-state` 可在 render 运行时初始化库存实例默认状态的能力显得特别实用。

## 异步状态管理

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

## 安装与支持

当前工具的可运行包维护在[npm](https://www.npmjs.com/get-npm)官方服务器。可运行如下命令获取最新的稳定版本。

### 安装命令

```
npm i @airma/react-hooks
```

### 浏览器支持

```
chrome: '>=91',
edge: '>=91',
firefox: '=>90',
safari: '>=15'
```

下一节[引导](/zh/react-hooks/guides)