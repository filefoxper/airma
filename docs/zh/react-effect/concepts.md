# 概念

本章节提及的是 `useQuery` 与 `useMutation` 的通用概念，可以帮助使用者快速理解 `@airma/react-effect`。

1. [依赖](/zh/react-effect/concepts?id=依赖)
2. [触发模式](/zh/react-effect/concepts?id=触发模式)
3. [会话](/zh/react-effect/concepts?id=会话)
4. [策略](/zh/react-effect/concepts?id=策略)

## 依赖

依赖是驱动 `useQuery` 和 `useMutation` 运行的数据元，它是一个`数组`。当数组中的某个元素在组件更迭过程中产生了变化，`useQuery` 和 `useMutation` 就有可能被触发运行查询或修改。

是的，你没有看错， `useMutation` 也可能受依赖驱动的影响，在之后的[触发](/zh/react-effect/concepts?id=触发)小节，我们将进行详细说明。

依赖数据元可以被分为`变量依赖`和`自定义依赖`两种类型。

### 变量依赖

一个`查询`操作的最佳状态就是请求参数（变量）驱动，即变量就是`依赖`，我们称之为`变量依赖`。大部分情况下，我们只需要提供变量数组就可以实现`查询`功能。如：

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

有时，`变量依赖`并不足以满足我们的需求，如：在依赖变量没有变化的时候，我们依然需要强制驱动`查询`，这时我们有两种可选驱动方式：`手动触发`或`自定义依赖`，这里我们仅介绍`自定义依赖`驱动方式。

### 自定义依赖

在使用`自定义依赖`进行驱动时，`变量依赖`将处于失效状态，也就是说这时的`变量依赖`仅仅只剩下充当查询条件的作用。

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

## 触发模式

现在我们知道了 `useQuery` 和 `useMutation` 可以通过`会话加载`、`依赖驱动`和`手工启动`三种方式`触发`查询或修改数据。

这不得不归功于我们的`触发模式`。触发器共有三种工作模式 `mount`、 `update`、 `manual`，分别对应 `会话加载时`、`依赖更新时`、`手动触发时` 三种状态。触发模式限定了 `useQuery` 和 `useMutation` 拥有的启动方式，只有经过触发模式的允许才能在相应的时机进行相应的工作。`useQuery` 和 `useMutation` 拥有各自默认的触发模式。

`useQuery` 的默认触发模式为 `['mount', 'update', 'manual']`，所以在上述三种情况下，它都能进行相应工作；而 `useMutation` 的默认触发模式仅为 `['manual']`，所以它只能通过手动触发的方式进行工作。

我们可以通过配置触发模式，改变会话的默认触发行为：

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

    const [state] = useMutation(
        // 设置保存请求函数
        saveUser,
        {
          // 设置保存参数
          variables: [ user ],
          // 将触发模式设置为 update 模式。
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
        // 通过改变变量 user 触发保存操作
        setUser(submitingUser);
    }

    ......
}
```

上例通过配置触发模式 `triggerOn`，改变了 `useMutation` 的默认触发模式。接下来让我们来看看会话的概念。

## 会话

会话是指通过 `useQuery` 或 `useMutation` 建立的异步副作用单元，这个单元由一个会话状态值和一个会话触发器函数组成：`[state, trigger]`。

### 会话状态

`会话状态` (`state`) 自 `useQuery` 或 `useMutation` 调用开始就存在了。当请求发生后，请求结果会被转换成与`会话状态`一致的数据结构，我们称这个转换后的结果为`会话结果`。最终系统会根据会话使用的[策略](/zh/react-effect/concepts?id=策略)决定是否要把`会话结果`渲染成`会话状态`。`state` 结构如下：

```ts
type SessionState<T> = {
  data: T | undefined,
  error?: any;
  isError: boolean;
  isFetching: boolean;
  abandon: boolean;
  triggerType: undefined | TriggerType;
  loaded: boolean;
  sessionLoaded: boolean;
  variables: any[] | undefined;
}
```

字段含义：

* data - 最近一次请求成功返回的数据，在下次请求成功前会一直存在，默认为 undefined。
* error - 最近一次请求失败的错误信息，会被成功的请求清理为 undefined，默认为 undefined。
* isError - 最近一次请求是否失败，若失败为 true，否则为 false。会被成功的请求重置为 false，默认值为 false。
* isFetching - 请求是否正在进行中，在请求开始时会被设置为 true，结束时无论失败与否都会被重置为 false，默认为 false。
* abandon - 标识请求产生的`会话结果`是否被废弃，被废弃的会话结果不能被渲染为`会话状态`，所以在`会话状态`（`state`）中，该值永远为 `false`，只有在策略环境中，该值才可能为 `true`。
* triggerType - 触发类型，`'mount' | 'update' | 'manual'` 分别对应触发模式的三种类型。每种触发模式都会让`会话结果`带上相应的触发类型。
* loaded - 表示是曾今成功请求过，且未被 `abandon` 废弃的会话状态，其含义为会话是否已经加载过。 (注意，当设置 defaultData 属性后，该值默认为 true)
* sessionLoaded - 表示是曾今成功请求过，且未被 `abandon` 废弃的会话状态，其含义为会话是否已经加载过。 (该参数不受任何配置信息影响)
* variables - 产生当前会话结果的变量数组，在第一次运行前，该值为 undefined。

### 会话触发器

一个会话由一个 `state` 和一个 `trigger` 构成，而这个 `trigger` 函数就是所谓的 `会话触发器`。它的作用就是手动触发会话再次运行。作为触发器，`trigger` 不需要任何额外的参数，因为参数始终存放在会话创建 API `useQuery` 和 `useMutation` 中，所以它是个无参函数，虽然 `useQuery` 与 `useMutation` 的触发器 `trigger` 会返回了一个 promise 结果，但我们不推荐使用，该 promise 结果仅供`观察分析`。

`trigger` 触发器触发的是手动运行，所以产生结果中的 `triggerType` 为 `manual`。如果人为配置的 `triggerOn` 触发模式中，没有 `manual` 选项，`trigger` 将不再发起请求，而直接采用当前`会话状态`。

## 策略

策略是 `@airma/react-effect` 为满足使用者获取更多请求控制权做出的努力。它是一个用于控制请求运行过程，过滤请求结果的包装函数。通过组合使用各种策略可以满足使用者日常开发中所需的各类优化，特殊业务需求等。

### 自定义策略

一个策略函数类型：

```ts
type StrategyType<T = any> = (runtime: {
  current: () => SessionState<T>;
  variables: any[];
  runner: () => Promise<SessionState<T>>;
  store: { current?: any };
  runtimeCache: {
    cache: (key: any, value: any) => void;
    fetch: (key: any) => any;
  };
}) => Promise<SessionState<T>>;
```

runtime 是策略系统提供的运行时参数：

* current - 函数，通过在需要的地方调用 current 函数，可以获取当前最新生效的`会话状态`。
* variables - 本次请求使用的变量参数
* runner - 请求函数的无参形态，变量参数在 runner 内部以闭包的形式存在。该函数返回的 promise 结果为`会话结果`。当同时使用多`策略`串联时，runner 代表下一个策略函数。
* store - 每个策略在使用时可以得到一个数据存储单元，用于长期存取策略状态。
* runtimeCache - 运行时缓存，与 store 不同的是，该缓存只能存放请求过程中的临时状态，每次请求都会开辟一个新的运行时缓存空间。
  
策略函数必须返回一个以`会话结果`类型结构为 resolve 值的 promise 对象 `Promise<SessionState<T>>`。

我们以 `@airma/react-effect` 官方策略 `Strategy.once()` 为例来说明怎么自定义一个策略。

```ts
// once 是一个策略工厂，它返回的函数 oc 才是真正的策略。
// once 的具体能力是限制请求只能成功运行一次。
function once(): StrategyType {
  return function oc(runtime: {
    current: () => SessionState;
    runner: () => Promise<SessionState>;
    store: { current?: Promise<SessionState> };
  }) {
    // 获取长期存储单元 store
    const { runner, store } = runtime;
    // store.current 初始值是 undefined，
    // 我们可以向它存储任意值，
    // 根据声明此策略存放的是一个结果为`会话结果`类型的 promise
    if (store.current) {
      // 如果存储单元中存放的 promise 存在，
      // 证明会话已经发起，不应发起多余请求，
      // 因此直接返回存储单元中的 promise,
      // 并使用 `abandon` 字段把它标记为被废弃的会话结果。
      // 被废弃的会话结果不会触发组件再渲染。
      return store.current.then(d => ({ ...d, abandon: true }));
    }
    // 如果存储单元为空，证明请求没有发起，故直接发起请求，
    // 并返回请求结果。
    store.current = runner().then(d => {
      // d 的类型为 SessionState，会话结果类型
      if (d.isError) {
        // 如果请求出错，需要清理存储单元，以便再次请求
        store.current = undefined;
      }
      return d;
    });
    return store.current;
  };
}
```

`Strategy.once()` 策略非常适合：弹窗保存成功后立即关闭，失败时，可再次发起请求这样的需求。它可以用来确保请求在组件销毁前只能成功运行一次。

```ts
import React from 'react';
import {useMutation, Strategy} from '@airma/react-effect';
import {User} from './type';

const saveUser = (user: User): Promise<User> => 
    Promise.resolve(user);

const Dialog = ()=>{
    const [user, setUser] = useState<User>({...});

    const [state, trigger] = useMutation(
        saveUser,
        {
          variables: [ user ],
          // 设置一次性请求策略
          strategy: Strategy.once()
        }
    );
    const {
        data,
        isFetching,
        error,
        isError
    } = result;

    const handleSubmit = ()=>{
        trigger();
    }

    ......
}
```

### 常用策略

`Strategy` API 是 `@airma/react-effect` 提供的常用策略集合对象。

#### Strategy.once

```ts
Strategy.once()
```

确保请求在组件销毁前只能成功运行一次。

配置参数：无

#### Strategy.debounce

```ts
Strategy.debounce( op: { duration: number } | number )
```

以防抖形式运行请求。

配置参数：

* op - `op` 为数字，表示防抖间隔时间，也可使用 `op.duration` 的形式进行等价配置。

#### Strategy.throttle

```ts
Strategy.throttle( op: { duration: number } | number )
```

以节流的形式运行请求。在设定间隔时间内，如请求参数的序列化字符串（`JSON.stringify`）与上次相比没有变化，则直接使用当前`会话状态`，不发起请求。

配置参数：

* op - `op` 为数字，表示节流间隔时间，可使用 `op.duration` 的形式进行等价配置。

#### Strategy.memo

```ts
Strategy.memo( equalFn?: (source: T | undefined, target: T) => boolean )
```

会话数据记忆策略。当请求返回会话结果中的数据 `data` 与当前会话状态数据的序列化字符串（`JSON.stringify`）保持值相等，则直接使用会话状态中的数据 `data`。保持数据的不变性，这对优化 React 渲染有非常大的帮助。

配置参数：

* equalFn - `equalFn` 是一个可选的数据对比函数，用于对比当前`会话状态`和请求返回的`会话结果`中的 `data` 字段，当函数对比返回值为 true，代表这两份数据等价，这时策略将使用当前`会话状态`中的 `data` 以优化渲染。

#### Strategy.error

```ts
Strategy.error( 
  process: (e: unknown) => any, 
  option?: { withAbandoned?: boolean } 
)
```

错误处理介入策略。允许使用者通过传入回调函数处理错误信息。该策略使用兜底设置，在一次策略处理过程中，如果同时出现多个 `Strategy.error(...)` ，只有一个能生效。

配置参数：

* process - 错误处理回调函数，可接收一个异常数据。
* option - 处理配置，`withAbandoned` 选项为 `true`，表示同时处理被`废弃`的会话结果中的异常信息。

#### Strategy.success

```ts
Strategy.success: <T>(
  process: (data: T) => any,
  option?: { withAbandoned?: boolean }
)
```

请求成功介入策略。允许使用者通过传入回调函数处理请求返回的正常数据。

配置参数：

* process - 处理正常请求结果的回调函数，可接收一个正常返回的请求数据。
* option - 处理配置，`withAbandoned` 选项为 `true`，表示同时处理被`废弃`会话结果中的正常请求数据。

#### Strategy.validate

```ts
Strategy.validate: (process: () => boolean)
```

请求校验策略。可以使用此策略进行请求前校验工作。请求被运行前会调用 `process` 回调函数，如果函数返回值为 `true` 校验通过，则顺利进行请求；反之，当回调函数返回值为 `false` 时，表示校验不通过，即不进行请求操作。

配置参数：

* process - 校验处理函数，通过返回 boolean 值来继续或阻止请求发生。

#### Strategy.reduce

```ts
reduce: <T>(
    call: (previous: T | undefined, currentData: T, states: [SessionState<T|undefined>, SessionState<T>]) => T | undefined
);
```

请求结果累积策略。允许使用者对正常返回数据进行累积处理，该策略不负责处理错误数据。

配置参数：

* call - 累积函数，参数 `previous` 代表当前会话最新状态， `currentData` 代表请求返回的会话结果。可返回一个累积数据作为下更新后会话状态的数据字段。

#### Strategy.effect

```ts
effect: {
    <T>(process: (state: SessionState<T>) => void): StrategyType<T>;
    success: <T>(
      process: (data: T, sessionData: SessionState<T>) => any
    ) => StrategyType<T>;
    error: (
      process: (e: unknown, sessionData: SessionState) => any
    ) => StrategyType;
  };
```

会话状态副作用处理策略。用来处理会话状态产生及变化的副作用。可看作：

```ts
const [sessionState] = useQuery(promiseCall, []);

useEffect(()=>{
  processEffectOfSessionState(sessionState);
}, [sessionState]);
```

配置参数：

* process - 副作用处理函数，可接受一个 session state 作为入参。

#### Strategy.effect.success

会话状态副作用处理策略。用来处理会话请求正常返回，并改变会话状态时的副作用。与 `Strategy.success` 不同的是，这个策略相应的是会话状态，而非请求。（推荐）

#### Strategy.effect.error

会话状态副作用处理策略。用来处理会话请求异常返回，并改变会话状态时的副作用。与 `Strategy.error` 不同的是，这个策略相应的是会话状态，而非请求。（推荐）

### 多策略联合

当我们需要同时使用多种策略时，可以把多个策略串连成一个数组提供给会话配置的 `strategy` 字段。策略系统会按照`套娃`的形式从左往右，从外及里嵌套数组中的策略，最终形成一个新策略。

```ts
import React from 'react';
import {useMutation, Strategy} from '@airma/react-effect';
import {User} from './type';

const saveUser = (user: User): Promise<User> => 
    Promise.resolve(user);

const Dialog = (props: {closeDialog: (data?: User)=>void })=>{
    const [user, setUser] = useState<User>({...});

    const [state, trigger] = useMutation(
        saveUser,
        {
          variables: [ user ],
          // 设置多策略联合
          strategy: [
            // 确保弹窗中保存请求只能正确运行一次
            Strategy.once(),
            // 保存成功时将请求返回的最新 user 传出弹窗，同时关闭弹窗
            Strategy.success(props.closeDialog)
          ]
        }
    );
    const {
        data,
        isFetching,
        error,
        isError
    } = result;

    const handleSubmit = ()=>{
        trigger();
    }

    ......
}
```

了解了上述概念，我们就可以进入[引导](/zh/react-effect/guides.md)环节，看看更多用法了。
