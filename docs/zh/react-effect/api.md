# API

## useQuery

用于创建查询操作[会话](/zh/react-effect/concepts?id=会话)的 React Hook API。只采纳最新执行返回的会话结果，默认情况下，通过加载、依赖更新、人工调用均可触发。

自 18.5.0 版本开始，无 config 入参的 useQuery 将肩负 useSession 的功能，当该 useQuery 被人工触发时，它会先查找是否有 session key 相同，且具备 config 参数的其他 useQuery 存在，若存在，则驱动其工作，若不存在或无法驱动其他同键 useQuery 工作，则自己工作。

```ts
function useQuery(
  promiseCallbackOrSessionKey, 
  variablesOrConfig
):[
  sessionState, 
  trigger, 
  execute
]
```

### 参数

* **promiseCallbackOrSessionKey** - 异步函数，或承载异步函数的[会话键](/zh/react-effect/concepts?id=键)。
* **variablesOrConfig** - 异步函数的参数列表或[会话配置](/zh/react-effect/concepts?id=会话配置)。

### 返回

元组 `[sessionState, trigger, execute]`

* **sessionState** - [会话状态](/zh/react-effect/concepts?id=会话状态)
* **trigger** - [会话触发器](/zh/react-effect/concepts?id=触发和执行)
* **execute** - [会话执行器](/zh/react-effect/concepts?id=触发和执行)

## useMutation

用于创建修改操作[会话](/zh/react-effect/concepts?id=会话)的 React Hook API。在手工触发情况下阻塞运行，默认情况下，只能通过人工调用触发。

自 18.5.0 版本开始，无 config 入参的 useMutation 将肩负 useSession 的功能，当该 useMutation 被人工触发时，它会先查找是否有 session key 相同，且具备 config 参数的其他 useMutation 存在，若存在，则驱动其工作，若不存在或无法驱动其他同键 useMutation 工作，则自己工作。

```ts
function useMutation(
  promiseCallbackOrSessionKey, 
  variablesOrConfig
):[
  sessionState, 
  trigger, 
  execute
]
```

### 参数

* **promiseCallbackOrSessionKey** - 异步函数，或承载异步函数的[会话键](/zh/react-effect/concepts?id=键)。
* **variablesOrConfig** - 异步函数的参数列表或[会话配置](/zh/react-effect/concepts?id=会话配置)。

### 返回

元组 `[sessionState, trigger, execute]`

* **sessionState** - [会话状态](/zh/react-effect/concepts?id=会话状态)
* **trigger** - [会话触发器](/zh/react-effect/concepts?id=触发和执行)
* **execute** - [会话执行器](/zh/react-effect/concepts?id=触发和执行)

## createSessionKey

可将异步函数包装成[会话键](/zh/react-effect/concepts?id=键)的函数方法。

```ts
function createSessionKey(
  promiseCallback,
  sessionType?: 'query' | 'mutation'
): SessionKey
```

### 参数

* promiseCallback - 异步函数。
* sessionType - 可选，会话类型，`'query' | 'mutation'`。

### 返回

[会话键](/zh/react-effect/concepts?id=键)

## Provider

React Context Provider 类型组件，可根据会话键创建内部本地库，并为使用会话键订阅库存会话状态提供上下文环境。

```ts
Provider props:{
    value: <session keys> or <model keys>,
    children?: ReactNode
}
```

### 参数

* value - 会话键或会话键集合
* children - React Node

### 返回

React Node

## provide

Provider 的高阶组件模式

```ts
function provide(keys){
    return function connect(Component){
        return function HocComponent(componentProps){
            return (
                <Provider keys={keys}>
                  <Component {...componentProps}/>
                </Provider>
            );
        }
    }
}
```

## useSession

用于订阅库会话状态变更的 React hook API，也可用于人工触发同键会话执行。

```ts
function useSession(sessionKey):[sessionState, trigger]
```

自 **@airma/react-effect v18.3.2** 开始，useSession 支持使用 execute 传参执行方法。

```ts
// v18.3.2
function useSession(sessionKey):[sessionState, trigger, execute]
```

### 参数

* sessionKey - 会话键，可通过 [createSessionKey](/zh/react-effect/api?id=createsessionkey) API 创建。

### 返回

元组 `[sessionState, trigger, execute@18.3.2]`

* **sessionState** - [会话状态](/zh/react-effect/concepts?id=会话状态)
* **trigger** - [会话触发器](/zh/react-effect/concepts?id=触发和执行)，不能传参，只能触发。
* **execute** - [会话执行器](/zh/react-effect/concepts?id=触发和执行)，允许传参触发。**至  v18.3.2 开始支持**。

## useLoadedSession

确认会话已加载（至少成功运行过一次）时，可用该 API 代替 useSession。功能与 useSession 一致，但返回的会话状态数据与异步函数返回数据类型完全一致，且会话状态的 loaded 字段恒为 true。

```ts
function useLoadedSession(sessionKey):[sessionState, trigger]
```

自 **@airma/react-effect v18.3.2** 开始，useLoadedSession 支持使用 execute 传参执行方法。

```ts
// v18.3.2
function useLoadedSession(sessionKey):[sessionState, trigger, execute]
```

### 参数

* sessionKey - 会话键，可通过 [createSessionKey](/zh/react-effect/api?id=createsessionkey) API 创建。

### 返回

元组 `[sessionState, trigger, execute@18.3.2]`

* **sessionState** - [会话状态](/zh/react-effect/concepts?id=会话状态)，sessionState.data 类型与异步函数返回数据类型相同，且 sessionState.loaded 为 true。
* **trigger** - [会话触发器](/zh/react-effect/concepts?id=触发和执行)
* **execute** - [会话执行器](/zh/react-effect/concepts?id=触发和执行)，允许传参触发。**至  v18.3.2 开始支持**。

## Strategy

`@airma/react-effect` 提供的常用[策略](/zh/react-effect/concepts?id=策略)集合。

```ts
const Strategy: {
  cache:(op?: {
    key?: (variables: any[]) => string;
    staleTime?: number;
    capacity?: number;
  }) => StrategyType;
  debounce: (op: { duration: number; lead?: boolean } | number) => StrategyType;
  once: () => StrategyType;
  failure: (
    process: (e: unknown) => any,
    option?: { withAbandoned?: boolean }
  ) => StrategyType;
  success: <T>(
    process: (data: T) => any,
    option?: { withAbandoned?: boolean }
  ) => StrategyType<T>;
  memo: <T>(
    equalFn?: (oldData: T | undefined, newData: T) => boolean
  ) => StrategyType<T>;
  validate: (process: (variables:any[],currentSessionState:SessionState<T>) => boolean|Promise<boolean>) => StrategyType;
  reduce: <T>(
    call: (previousData: T | undefined, currentData: T, states: [SessionState<T|undefined>, SessionState<T>]) => T | undefined
  ) => StrategyType<T>;
  response: {
    <T>(process: (state: SessionState<T>) => void|(()=>void)): StrategyType<T>;
    success: <T>(
      process: (data: T, sessionData: SessionState<T>) => void|(()=>void)
    ) => StrategyType<T>;
    error: (
      process: (e: unknown, sessionData: SessionState) => void|(()=>void)
    ) => StrategyType;
  };
};
```

### Strategy.cache

SWR 缓存策略。该策略可以为每次异步操作生成缓存键，并通过缓存键快速获取缓存记录中的值作为新的会话状态数据，如缓存键对应的记录不存在，则等待异步操作结果做键对应的缓存记录值。

如未设置 **staleTime** 缓存有效期，且当前键对应的缓存记录存在，则在每次异步操开始时获取缓存记录值做临时会话状态数据，同时等待异步操作结果做最终会话状态数据，并缓存最终会话状态数据。

如设置 **staleTime** 缓存有效期，且当前键对应的缓存记录有效，则不再执行异步函数，直接返回有效记录值做最终会话状态数据；如缓存记录不存在或已过期，则等待异步操作结果做最终会话状态数据，并缓存最终会话状态数据。

该策略会修改会话状态的 `visited` 字段。当缓存记录存在且有效时，`visited` 字段为 true；当缓存记录不存在或已过期时，`visited` 字段为 false。

#### 参数

* **op.key** - 可选回调函数。用于生成当前异步操作的键，可接受当前运行的 variables 做参数。如不设置，默认以每次运行时的 variables 异步函数参数的 *JSON.Stringify* 值做键。
* **op.staleTime** - 可选时间，单位毫秒。用于设置单条记录缓存有效期。每次异步操作，策略会删除过期缓存记录。
* **op.capacity** - 可选数字，缓存记录容量。当缓存记录数大于等于设定容量时，策略会清除早期记录以满足容量限定，默认值为 1。
* **op.static** - 可选，boolean 类型。用于设置是否为静态缓存。静态缓存不会被清除，且缓存记录值不会被更新。

### Strategy.debounce

防抖策略。

#### 参数

* **op.duration** - 可选时间，单位毫秒。用于设置防抖有效期。
* **op.lead** - 可选，boolean 类型。用于设置防抖函数的运行时机，当该值为 true 时，表示先执行后防抖；否则防抖后再执行。

### Strategy.once

一次性执行策略。使用该策略的会话只能被成功执行一次，如执行失败可再次重复执行。

### Strategy.failure

会话执行失败时的回调策略。当异步函数执行失败时，调用预设的回调函数。

**注意**，该策略在异步函数返回的 promise 对象 reject 时执行。

**如果在策略链中存在多个 Strategy.failure 或 Strategy.response.failure 策略，只有第一个失败回调策略的回调函数会被执行。**

```
注意：在 18.6.0 版本开始后，Strategy.failure 策略将不再无条件阻止后续其他错误处理策略执行。Strategy.failure 策略回调函数会在未抛出异常的情况下阻止前置 Strategy.failure 策略运行。可通过添加 GlobalConfig.experience 字段获取体验特性。
```

体验特性：

```ts
const globalConfig = {  
  experience: 'next',
  strategy: (workingStrategies: StrategyType[])=>{
    return [
      // 兜底异常处理策略，需要排在最前
      Strategy.failure((e) => {
        console.log('failure', e);
      }),
      ...workingStrategies
    ];
  }
}
<ConfigProvider value={globalConfig}>{...}</ConfigProvider>
```

#### 参数

* **process** - 回调函数，可接收异步函数执行失败时的错误信息为参数。
* **op.withAbandoned** - 可选，boolean 类型。用于标记是否一并处理被弃用的异步操作失败结果。默认为 false，即不处理。

### Strategy.success

会话执行成功时的回调策略。当异步函数执行成功时，调用预设的回调函数。

**注意**，该策略在异步函数返回的 promise 对象 resolve 时执行。

#### 参数

* **process** - 回调函数，可接收异步函数执行成功时的结果数据为参数。
* **op.withAbandoned** - 可选，boolean 类型。用于标记是否一并处理被弃用的异步操作成功结果。默认为 false，即不处理。

### Strategy.memo

会话状态数据缓存策略。该策略通过对比当前会话状态数据与执行结果优化渲染性能。如当前会话状态数据与执行结果等价，则使用继续使用当前会话状态数据作为本次执行更新的会话状态数据。

#### 参数

* **equalFn** - 可选的结果对比函数。接收当前会话状态数据和本次执行返回结果做参数，如该函数返回 true，证明等价，这时继续使用当前会话状态数据作为最终会话状态数据。默认使用 JSON.stringify 序列化当前会话状态数据和本次执行结果进行 `===` 对比。

### Strategy.validate

校验策略。该策略可以在会话执行前进行校验，如校验失败则不执行会话。

#### 参数

* **process** - 可接收运行时参数和当前会话状态，并返回 boolean 或 Promise<boolean> 类型值的回调函数，如果返回 true，或异步返回 true，则校验通过，会话继续执行，否则阻止会话执行。 **自18.5.0开始**，支持返回 Promise<boolean> 校验结果，若异步返回 true，则校验通过，否则阻止会话执行。

#### 例子

可校验当前会话是否已处于销毁状态。

```ts
const [sessionState,,execute] = useQuery(sessionCallback, {
  variables: [],
  strategy: Strategy.validate((variables, sessionState) => {
    // 通过校验当前会话状态的 online 属性是否为 true
    return sessionState.online;
  })
});
```

在全局策略配置中使用该技巧，可以跳过所有被销毁会话触发的脏请求。

```ts
const globalConfig = {
  strategy: (workingStrategies: StrategyType[])=>{
    return [
       Strategy.validate((variables, sessionState) => {
         return sessionState.online;
       }),
       ...workingStrategies
    ];
  }   
} 

<ConfigProvider value={globalConfig}>{...}</ConfigProvider>
```

### Strategy.reduce

会话状态数据累积策略。用于累积存储会话状态数据处理，如滚动翻页查询。

#### 参数

* **process** - 累积回调函数。接收一个当前会话状态数据，一个当前执行结果以及一个 `[当前会话状态，当前执行结果得会话形态对象]` 元组做参数，并返回累积后得结果作为最终会话状态数据。

### Strategy.response

会话执行响应策略。用于监听会话执行，并在会话执行完毕后调用回调函数。

**当前策略在会话状态更新完毕的副作用（useEffect）中运行回调函数。**

#### 参数

* **process** - 会话执行完毕后的回调函数。可接收执行完毕后的会话状态做参数，并可选性的返回一个副作用清理函数。

### Strategy.response.success

会话执行成功响应策略。用于监听会话执行，并在会话执行成功后调用回调函数。

**当前策略在会话状态更新完毕的副作用（useEffect）中运行回调函数。**

#### 参数

* **process** - 会话执行成功后的回调函数。可接收执行成功后的会话状态数据和会话状态做参数，并可选性的返回一个副作用清理函数。

### Strategy.response.failure

会话执行失败响应策略。用于监听会话执行，并在会话执行失败后调用回调函数。

**当前策略在会话状态更新完毕的副作用（useEffect）中运行回调函数。**

**如果在策略链中存在多个 Strategy.failure 或 Strategy.response.failure 策略，只有第一个失败回调策略的回调函数会被执行。**

```
注意：在 18.6.0 版本开始后，Strategy.response.failure 策略将不会使其他错误处理策略实效，同时也不再受其他错误处理策略的影响。可在全局配置 GlobalConfig 中设置 `experience` 字段获取体验特性。
```

#### 参数

* **process** - 会话执行失败后的回调函数。可接收执行失败后的会话状态错误和会话状态做参数，并可选性的返回一个副作用清理函数。

## useIsFetching

可用于检测是否有 useQuery 或 useMutation 处于正在执行异步函数的过程状态。

```ts
function useIsFetching(
  ...sessionStates: SessionState[]
): boolean;
```

### 参数

* sessionStates - 可选，被检测的会话状态。如不提供，则检测全局所有会话状态。

### 返回

是否有 useQuery 或 useMutation 处于正在执行异步函数的过程状态，boolean 值。

## ConfigProvider

用于配置优化全局会话的 React Context Provider 组件。

```ts
type GlobalConfig = {
  batchUpdate?: (callback: () => void) => void;
  /**
   * @deprecated 已废弃 
   **/
  useGlobalFetching?: boolean;
  strategy?:(
    strategies:(StrategyType | undefined | null)[], 
    type: 'query' | 'mutation'
  )=>(StrategyType | undefined | null)[];
};

interface ConfigProviderProps:{
    value: GlobalConfig;
    children?: ReactNode;
}
```

### 属性

* value - 配置对象
* children - React 节点

用法可参考引导章节中关于[全局策略配置](/zh/react-effect/guides?id=strategy)和[ConfigProvider](/zh/react-effect/guides?id=configprovider)中的内容。

## useLazyComponent

监听多个会话是否已执行过或已加载，异步加载组件，返回一个 React.lazy 包装组件。如被监听会话均已加载，则 React.lazy 正常渲染；如被监听会话均已执行且部分会话出错，则 React.lazy 组件接收到一个名为 'error'，值类型为[会话状态](/zh/react-effect/concepts?id=会话状态)类型的 Props 属性。 

```ts
function useLazyComponent(
  componentLoader, 
  ...sessionStates
): LazyComponent
```

### 参数

* componentLoader - 加载组件的回调函数。该函数应该返回一个以组件或 `{default: 组件}` 为 resolve 值的 promise 对象。（组件的 props 需要满足 `{ error?: ErrorSessionState }` 属性）
* sessionStates - 会话状态

### 返回

React.lazy 组件。

### 例子

```ts
import React, {Suspense} from 'react';
import {
  useQuery,
  useLazyComponent
} from '@airma/react-effect';
import type {ErrorSessionState} from '@airma/react-effect';
import {currentUserKey, fetchUsersKey, fetchGroupsKey} from './globalSessions'; 

const UnexpectedComp = (props:{error?:ErrorSessionState})=>{
  const {error: errorSessionState} = props;
  const {
    error
  } = errorSessionState;
  return (
    <div>some thing is wrong</div>
  )
}

const App = ()=>{
  const [userSessionState] = useQuery(currentUserKey, []);
  const {data} = userSessionState;
  const [usersSessionState] = useQuery(fetchUsersKey, {
    variables:[data],
    triggerOn: [ 'update' ],
  });
  const [groupSessionState] = useQuery(fetchGroupsKey, {
    variables:[data],
    triggerOn: [ 'update' ],
  });

  // 监听会话状态，并加载异步组件
  const Container = useLazyComponent(()=>import('./container'), 
    userSessionState,
    usersSessionState,
    groupSessionState
  )

  ......
  // 使用 Suspense 组件协助加载
  return (
    <div>
      ......
      <Suspense fallback={...}>
        <Container/>
      </Suspense>
    </div>
  )
}
```

## useResponse

React hook，用于监听会话执行，并在执行完毕后调用回调函数。回调函数的确切执行时机发生在会话执行完毕后会话响应结果的副作用中。

```ts
function useResponse(
  process: (sessionState:SessionState)=>void|(()=>void),
  sessionState: SessionState | [SessionState, {watchOnly?: boolean}]
): void
```

### 参数

* **process** - 会话执行完毕后的回调函数。可接收执行完毕后的会话状态做参数，并可选性的返回一个副作用清理函数。
* **sessionState** - 被监听的会话状态，或由被监听的会话状态和设置组成的元组。当 watchOnly 被开启时，只做会话响应的监听工作。

### 例子:

```ts
const [sessionState] = useQuery(sessionCallback, []);

useResponse((s)=>{
  if(s.isError){
    processError(s.error)
  }else{
    processSuccess(s.data);
  }
}, sessionState);
```

useResponse 的子 API:

### useResponse.useSuccess

React hook，用于监听会话执行，并在执行成功后调用回调函数。回调函数的确切执行时机发生在会话执行成功后会话响应结果的副作用中。

```ts
useResponse.useSuccess(
  process: (sessionState:SessionState)=>void|(()=>void),
  sessionState: SessionState | [SessionState, {watchOnly?: boolean}]
): void;
```

#### 参数

* **process** - 会话执行成功后的回调函数。接收执行成功后的会话状态数据和会话状态做参数，并可选性的返回一个副作用清理函数。
* **sessionState** - 被监听的会话状态，或由被监听的会话状态和设置组成的元组。当 watchOnly 被开启时，只做会话响应的监听工作。

#### 例子

```ts
const [sessionState] = useQuery(sessionCallback, []);

useResponse.useSuccess((data, state)=>{
  processSuccess(data, state.variables);
}, sessionState);

useResponse.useSuccess((data, state)=>{
  const intervalId = setInterval(()=>{
    processSuccess(data, state.variables);
  }, 1000);
  // 清理副作用
  return ()=>clearInterval(intervalId);
}, sessionState);
```

### useResponse.useFailure

React hook，用于监听会话执行，并在执行失败后调用回调函数。回调函数的确切执行时机发生在会话执行失败后会话响应结果的副作用中。

```ts
useResponse.useFailure(
  process: (sessionState:SessionState)=>void|(()=>void),
  sessionState: SessionState | [SessionState, {watchOnly?: boolean}]
): void;
```

#### 参数

* **process** - 会话执行失败后的回调函数。接收执行失败后的会话状态错误和会话状态做参数，并可选性的返回一个副作用清理函数。
* **sessionState** - 被监听的会话状态，或由被监听的会话状态和设置组成的元组。当 watchOnly 被开启时，只做会话响应的监听工作。

#### 例子

```ts
const [sessionState] = useQuery(sessionCallback, []);

useResponse.useFailure((err)=>{
  processError(err);
}, sessionState);
```

## session

用于包装声明会话的函数 API。该API可封装一个异步函数，并返回一个针对会话的常用API集合。

```ts
type StaticStoreApi = {
  useQuery(
    variablesOrConfig
  ):[sessionState, trigger, execute];
  useMutation(
    variablesOrConfig
  ):[sessionState, trigger, execute];
  useSession():[sessionState, trigger];
  useLoadedSession():[sessionState, trigger];
};

type StoreApi = {
  asGlobal(): StaticStoreApi;
  static(): StaticStoreApi; // 与 asGlobal 相同
  provideTo<P extends object>(
    component: ComponentType<P>
  ):ComponentType<P>;
  Provider:FunctionComponent<{
    value: ModelKeys, 
    children?: ReactNode
  }>;
  with(...stores:(StoreApi|ModelKey)[]);
  useQuery(
    variablesOrConfig
  ):[sessionState, trigger, execute];
  useMutation(
    variablesOrConfig
  ):[sessionState, trigger, execute];
  useSession():[sessionState, trigger];
  useLoadedSession():[sessionState, trigger];
};

type Api = {
  createStore():StoreApi;
  useQuery(
    variablesOrConfig
  ):[sessionState, trigger, execute];
  useMutation(
    variablesOrConfig
  ):[sessionState, trigger, execute];
};

function session(
  promiseCallback, 
  sessionType: 'query' | 'mutation'
): Api
```

### Parameters

* **promiseCallback** - 会话需要执行的异步函数。
* **sessionType** - 声明当前会话类型，`query` 表示查询类，`mutation` 表示修改类。

### Returns

一个可流式调用的常用会话 API 集合。

[例子](/zh/react-effect/guides?id=session)