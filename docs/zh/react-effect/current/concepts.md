# 概念

**@airma/react-effect** 涉及四个核心概念：会话、库、键、策略。

1. [会话](concepts?id=会话)
2. [库](concepts?id=键)
3. [键](concepts?id=键)
4. [策略](concepts?id=策略)

## 会话

会话是指一个可持续更新的异步状态管理单元。API [useQuery](api?id=usequery) 可创建一个查询会话； [useMutation](api?id=usemutation) 建立的则是一个修改会话；[useSession](api?id=usesession) 可同步会话状态，也能触发会话运行；API [session](api?id=session) 预设会话。会话的核心为**异步函数**，所有会话的目标就是将异步函数的执行过程以状态变更的形式描述出来。

```ts
// 创建查询会话
const session = useQuery(promiseCallback, variablesOrConfig);
// 创建修改会话
const session = useMutation(promiseCallback, variablesOrConfig);

const [
    // 会话状态
    sessionState, 
    // 人工触发会话，
    // 触发会话并不需要提供任何参数，
    // 会话会使用创建时传入的 variables 作参数
    trigger, 
    // 人工执行会话，
    // 执行会话需要传入异步函数的所有参数
    execute
] = session;
```

### 会话状态

会话状态是指会话执行异步函数过程中产生的信息状态，从会话创建（还未执行）开始一直存在，并随异步函数执行过程不断更新。

```ts
const session = useQuery(promiseCallback, variablesOrConfig);

const [
    // 会话状态 
    sessionState, 
    trigger,
    execute
] = session;

const {
    // 会话数据
    data,
    // 会话参数
    variables,
    // 会话是否正在执行
    // true/false
    isFetching,
    // 会话最新执行是否出错
    // true/false
    isError,
    // 会话错误
    error,
    ......
} = sessionState;
```

全量会话状态字段：

* **data** - 会话数据，类型：`T（异步函数执行结果类型）`，即最后一次成功执行异步函数得到的结果。默认初始值为 undefined，如在会话配置中设置了 defaultData，则以 defaultData 为初始值。该字段保留的最后一次成功执行结果，不受最新执行是否失败的影响。
* **error** - 会话错误信息，类型：`unknown`，即最新一次执行异步函数所得的出错信息。初始值 undefined，最新一次执行失败时才可能有值。如最新一次执行成功，该值将变成 undefined.
* **variables** - 会话回执参数，类型：`Parameter（异步函数传参元组类型或 undefined 类型）`，即最新一次执行完异步函数使用的回执参数记录。初始值为 undefined。
* **payload** - 会话执行附加数据，任意类型，默认为 undefined，可用于标记每次会话执行的目的。
* **isFetching** - 会话是否正在执行，类型：`boolean`。
* **isError** - 会话最新执行结果是否出错，类型：`boolean`，当该值为 true 时，会话执行失败，error 字段可能有值，否则 error 为 undefined。
* **sessionLoaded** - 会话是否成功执行过，类型：`boolean`。
* **loaded** - 会话是否已加载，类型：`boolean`，即会话是否成功执行过或有默认会话数据。如设置了会话配置项 defaultData，该值恒为 true。
* **triggerType** - 用于描述会话最新执行使用的触发方式，类型：`'mount' | 'update' | 'manual'`。该值在会话被触发时被设定。
* **round** - 会话回合数，类型：`number`，会话每执行完一次异步函数，并接纳了函数返回值，被记为一个回合，每回合该值自动加 1，初始值为 0。
* **abandon** - 本次会话执行结果是否被放弃，类型：`boolean`，该值在会话状态中始终为 false。 [策略](concepts?id=策略) 系统会根据策略需求对执行结果进行废弃与否的标记，如执行结果被标记 abandon: true，则该结果被废弃，回合中断，round 字段保持不变。
* **visited** - 会话是否被访问过，类型：`boolean`，初始值为 false。该字段与 `loaded` 字段同义，不同的是，该字段可以被[策略](concepts?id=策略)修改，如：[Strategry.cache](api?id=strategy-cache)。
* **lastSuccessfulRound** - 最近一次成功执行的回合数，类型：`number`，初始值为 0。
* **lastFailedRound** - 最近一次出错的回合数，类型：`number`，初始值为 0。
* **lastSuccessfulRoundVariables** - 最近一次成功执行的回执参数，类型：`Parameter（异步函数传参元组类型或 undefined 类型）`，初始值为 undefined。
* **lastFailedRoundVariables** - 最近一次失败的回执参数，类型：`Parameter（异步函数传参元组类型或 undefined 类型）`，初始值为 undefined。
* **online** - 会话是否在线（可用）。类型：`boolean`，初始值为 true。该字段可用于描述当前会话是否可用。当会话 store 所在组件或本地会话所在组件被卸载时，该字段变为 false。通过 [Strategy.validate 策略](api?id=例子)，可对当前会话的可用性进行校验。

关于 **triggerType** 触发类型

* **mount** - 加载时触发会话。
* **update** - 配置项依赖 config.deps 或 config.variables 更新时触发会话。
* **manual** - 通过调用 trigger 触发器或 execute 执行器触发会话。

### 会话配置

会话配置可用于设定会话数据的默认值，会话参数，会话触发方式，会话使用策略等特性。

最简单的会话配置为会话参数的元组形态：

```ts
const [
    sessionState,
    trigger,
    execute
] = useQuery(
  promiseCallback, 
  // 会话参数
  [param1, param2, ...]
);

const [
    sessionState,
    trigger,
    execute
] = useMutation(
  promiseCallback,
  // 会话参数 
  [param1, param2, ...]
);
```

如需使用其他设置项，则需要选用 object 配置对象的形态：

```ts
useQuery(promiseCallback, {
    // 会话参数
    variables: [param1, param2, ...],
    // 默认会话数据
    defaultData: defaultData,
    // 支持的触发方式
    triggerOn: ['update', 'manual'],
    // 会话策略
    strategy: [
        Strategy.debounce(300),
        Strategy.response.success((data)=>{
            console.log(data);
        })
    ]
});

useMutation(promiseCallback, {
    variables: [param1, param2, ...],
    // useMutation 默认支持的触发方式只有 'manual'，
    // 通过 triggerOn 可扩充当前 useMutation 的触发方式。
    triggerOn: ['update', 'manual'],
    strategy: [
        Strategy.response.success((data)=>{
            console.log(data);
        })
    ]
});
```

全量会话配置字段：

* **triggerOn** - 会话触发方式，类型：*('mount'|'update'|'manual')[]*，可选。useQuery 默认支持全量触发方式，useMutation 默认只支持 *manual* 人工触发模式。
* **deps** - 会话更新触发模式依赖项，类型：*any[]*，可选。在开启 *update* 触发方式的情况下，当依赖项发生更新时，触发会话以 variables 为参数执行异步函数。相当于通过 useEffect 调用异步函数。
* **variables** - 推荐会话执行参数，类型：*Parameter（异步函数传参元组类型）*，可选。在开启 *update* 触发方式的情况下，如未设置 *deps* 配置项，则默认以 variables 作更新触发依赖项。
* **defaultData** - 会话默认数据，类型：*T（异步函数执行结果类型）*，可选。如设置此项，当会话处于尚未执行的初始状态时，会话数据 *data* 为当前默认值，且会话状态中的 **loaded** 字段恒为 true。
* **strategy** - 会话[策略](concepts?id=策略)，类型：`Array<StrategyType>|StrategyType|StrategyConfig`，用于干预会话执行过程和结果的函数、函数数组或策略配置。
* **payload** - 会话附加数据，任意类型，可用于标识当前会话的目的。会话执行完毕后会出现在会话状态字段中。
* **ignoreStrategyWrapper** - 用于忽略来自 ConfigProvider 的公共策略。类型：*boolean*，可选。
* **manual** - 会话人工执行限制，boolean 类型。当 manual 为 true 时，强制只支持人工触发执行方式，相当于 *triggerOn: ['manual']* 设置。

当所有配置项均未设置时，会话只支持人工执行。

#### 策略配置

会话运行的策略通常有**公共策略（ConfigProvider props.strategy）** 、 **自定义策略** 以及 **默认策略** 三部分组成。

公共策略是通过 [ConfigProvider](api?id=configprovider) 组件的 props.strategy 属性配置的，该策略会作用于所有会话。

自定义策略是通过会话配置项的 strategy 属性配置的，该策略只作用于当前会话。

默认策略是 `@airma/react-effect` 内置的策略：

* useQuery - latest 最新取值策略，即只保留最新一次请求数据的结果。
* useMutation - blocking 阻塞策略，即在人工触发时使用阻塞运行方式，更新触发时直接运行。

通过策略配置对象，可以详细制定是否采用默认策略或公共策略。

```ts
useQuery(promiseCallback, {
    variables: [param1, param2],
    strategy: {
        list: [
            Strategy.debounce(300),
            Strategy.validate(([v1])=>!!v1),
            Strategy.response.success((data)=>{
                console.log(data);
            })
        ],
        // 忽略默认策略
        withoutDefault: true,
        // 忽略公共策略
        withoutWrapper: true
    }
});
```

### 触发和执行

如果一个会话支持 **manual** 人工触发模式，可通过调用 trigger 或 execute 方法人工触发会话执行。

* **trigger** - 触发方法，无入参。调用该回调方法可触发会话以配置项中的推荐会话执行参数 *variables* 做入参执行异步函数。
* **execute** - 执行方法，需要提供异步执行函数所需的参数。

当会话配置中不存在 *variables*，则进入**强制人工执行模式**。强制人工执行模式只有通过调用 **execute** 执行方法人工触发才是安全的，其他触发方式均会以无参形式执行异步函数。

```ts
const [
    querySessionState,
    // 查询触发方法
    triggerQuery,
    // 查询执行方法
    executeQuery
] = useQuery(promiseCallback, [param1, param2]);
const [
    mutationSessionState,
    // 修改触发方法，因无 variables 设置，无法使用
    triggerMutation,
    // 修改执行方法
    executeMutation
] = useMutation(promiseCallback);

const callTriggerQuery = ()=>{
    // 触发执行查询
    triggerQuery();
};

const callExecuteQuery = ()=>{
    // 执行查询方法
    executeQuery(param1, param2);
};

const callTriggerMutation = ()=>{
    // 无 variables 参数，处于强制人工执行模式，采取无入参形式运行不安全。
    triggerMutation();
};

const callExecuteMutation = ()=>{
    // 强制人工执行模式，推荐使用执行方法执行会话
    executeMutation(param1, param2);
};
```

触发附加数据

* **trigger.payload** - 使用 trigger.payload 方法可以生成一个添加会话附加数据的触发器，执行后附加数据将出现在会话状态的同名字段中。
* **execute.payload** - 使用 execute.payload 方法可以生成一个添加会话附加数据的执行器，执行后附加数据将出现在会话状态的同名字段中。

提示：若不使用 payload 方法直接触发或执行，将使用当前执行器 useQuery 默认配置中的 payload 字段。

```ts
import {useQuery, useResponse} from '@airma/react-effect';

const [
    querySessionState,
    // 查询触发方法
    triggerQuery,
    // 查询执行方法
    executeQuery
] = useQuery(promiseCallback, [param1, param2]);

const callTriggerQuery = ()=>{
    // 添加会话附加值触发执行查询
    triggerQuery.payload('trigger')();
};

const callExecuteQuery = ()=>{
    // 添加会话附加值执行查询方法
    executeQuery.payload('execute')(param1, param2);
};

useResponse((sessionState)=>{
    const {payload} = sessionState;
    if(!payload){
        console.log('effect execute', payload);
        return;
    }
    if(payload === 'trigger'){
        console.log('manual trigger', payload);
        return;
    }
    console.log('manual execute', payload);
}, querySessionState);
```

## 库

**库** 是用于存储会话执行函数和状态的对象，所有的会话都有对应的库，直接通过 useQuery/useMutation 创建的会话存储于一个本地库中。库的形式有三种：本地库（相当于 useState）、动态库、静态库。

关于本地库可直接参考 useState，这里重点介绍静态库和动态库。通过 createSessionStore API 或 session(xxx,'query'|'mutation').createStore() API 可创建一个全局静态会话库，通过 useQuery/useMutation/useSession/useLoadedSession API可直接订阅静态库的会话状态，或执行会话执行函数。

```ts
import React from 'react';
import {
    createSesssionStore, 
    provide,
    useQuery, 
    useSession
} from '@airma/react-effect';
import {User} from './type';

type UserQuery = {
    name: string;
    username: string;
}

// 创建会话库（静态库）
const userQueryStore = createSesssionStore(
    (query: UserQuery):Promise<User[]> =>
        Promise.resolve([]),
    'query'
);

const SearchButton = ()=>{
    // useSession 通过键获取静态库状态，触发同键会话 useQuery 工作。
    const [
        // 库中的会话状态
        {isFetching},
        // 触发同键会话 useQuery 工作
        triggerQuery
    ] = useSession(userQueryStore);
    return (
        <button 
            disabled={isFetching} 
            onClick={triggerQuery}
        >
        query
        </button>
    );
}

// 静态库可直接订阅使用，无需 provide 包装
const App = ()=>{
    const [query, setQuery] = useState({name:'', username:''});
    const [
        state, 
        // useQuery 通过键获取静态库状态，并持续更新库中的会话状态
    ] = useQuery(userQueryStore, [query]);

    ......

    return (
        <>
            <SearchButton />
            ......
        </>
    );
}
```

创建动态库需要**键**的配合。

## 键

**键**是用于创建和订阅库的函数。[Provider](api?id=provider) 组件使用**键**生成元素的内部库；useQuery/useMutation 通过**键**订阅库中的会话状态，执行库的异步函数；useSession 也可通过**键**订阅库中的会话状态，人工触发会话。

```ts
import React from 'react';
import {
    createSessionKey, 
    provide,
    useQuery, 
    useSession
} from '@airma/react-effect';
import {User} from './type';

type UserQuery = {
    name: string;
    username: string;
}

// 创建会话键
const userQueryKey = createSessionKey(
    (query: UserQuery):Promise<User[]> =>
        Promise.resolve([]),
    'query'
);

const SearchButton = ()=>{
    // useSession 通过键获取动态库状态，触发同键会话 useQuery 工作。
    const [
        // 库中的会话状态
        {isFetching},
        // 触发同键会话 useQuery 工作
        triggerQuery
    ] = useSession(userQueryKey);
    return (
        <button 
            disabled={isFetching} 
            onClick={triggerQuery}
        >
        query
        </button>
    );
}

// 使用会话键在 Provider 组件元素化过程中创建动态库，
const App = provide(userQueryKey)(()=>{
    const [query, setQuery] = useState({name:'', username:''});
    const [
        state, 
        // useQuery 通过键获取动态库状态，并持续更新库中的会话状态
    ] = useQuery(userQueryKey, [query]);

    ......

    return (
        <>
            <SearchButton />
            ......
        </>
    );
})
```

[session](api?id=session) API 通过 **session(promiseCallback, 'query').createKey()** 也可以产生键。

因为会话的**键**库系统完全利用了 **@airma/react-state** 的[键](/zh/react-state/concepts?id=键)库系统，会话**键**就是一种特殊的模型**键**，因此，两者的键库是可以通用的。关于[库](/zh/react-state/guides?id=createkey-与-provide)的理解也可以参考 **@airma/react-state** 中的介绍。

## 策略

策略是一种用于干预会话执行过程和结果的插件性函数。**@airma/react-effect** 没有采用大量规范配置来支持各种执行修饰性功能，而选择了更灵活的插件设计方案。

```ts
interface SessionToken {
    abandon: (tokens?:SessionToken[]) => void;
    silence: () => void;
}

type Runtime = {
    getSessionState: () => SessionState;
    getSessionToken: () => SessionToken;
    variables: any[];
    triggerType: 'mount' | 'update' | 'manual';
    runner: (
        setFetchingSessionState?: (s: SessionState) => SessionState
    ) => Promise<SessionState>;
    localCache: { current: any };
    executeContext: {
      set: (key: any, value: any) => void;
      get: (key: any) => any;
    };
    abandon: (data?:SessionState) => SessionState;
  };

function stratey(
    runtime: Runtime
): Promise<SessionState>;
```

策略函数可使用 **runtime** 参数对象来控制会话的执行过程，并通过返回一个 resolve 值类型为会话状态类型（SessionState）的 Promise 来更新会话状态值。

执行控制对象 **runtime** 的字段如下：

* **getSessionState** - 获取当前会话状态的方法。
* **getSessionToken** - 获取会话当前执行时的 token 版本对象。
* **varaibles** - 当前执行使用的参数。
* **triggerType** - 当前执行的触发类型，`'mount' | 'update' | 'manual'`。
* **runner** - 当前策略函数的*后续策略函数*。最终执行的会话异步函数被包装成了一个终端策略函数，所以策略的尽头依然是策略。
* **localCache** - 用于缓存策略状态的本地缓存对象，该对象只能在本地策略中使用。
* **executeContext** - 用于暂存策略链处理过程中状态的执行上下文对象，该对象支持跨策略函数调用。
* **abandon** - 用于生成一个被废弃的会话状态

会话的执行过程中，所有策略函数总是会通过至前往后的调用顺序形成一个策略链函数。会话所执行的最终异步函数即该策略链函数。即便没有通过会话配置提供任何策略，每个会话依然有自己的默认策略。

* [useQuery](api?id=usequery) - 查询会话的基本策略为，始终选取最新一次请求数据的 latest 策略。 
* [useMutation](api?id=usemutation) - 修改会话的基本策略为，在人工触发时使用阻塞运行方式，更新触发时直接运行的策略。

策略执行顺序如下:

```ts
useQuery(
    promiseCallback,
    {
        variables: [query],
        // 策略链
        strategy: [
            // 进入 1, 返回 3
            Strategy.validate(([q])=>!!q.name),
            // 进入 2, 返回 2
            Strategy.debounce(300),
            // 进入 3, 返回 1 
            Strategy.memo()
        ]
    }
);
```

下一节[引导](guides)
