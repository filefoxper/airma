# API

## useQuery

React hook

```ts
function useQuery(callback, variables){
    return [state, trigger, execute];
}
```

### 作用

用于维护查询功能的[会话状态](/zh/react-effect/concepts?id=会话状态)。

### 参数

* callback - 返回一个 promise 对象的函数，或以该函数为主体的[会话键](/zh/react-effect/guides?id=基本用法)。
* variables - callback 函数的参数列表，或[会话配置](/zh/react-effect/feature?id=会话配置)。

### 返回

元组: `[state, trigger, execute]`，state 与 trigger 可参考[会话](/zh/react-effect/concepts?id=会话)概念。

* state - [会话状态](/zh/react-effect/concepts?id=会话状态)
* trigger - [会话触发器](/zh/react-effect/concepts?id=会话触发器)
* execute - [可入参手动触发函数](/zh/react-effect/guides?id=传参触发函数)

## useMutation

React hook

```ts
function useMutation(callback, variables){
    return [state, trigger, execute];
}
```

### 作用

用于维护修改功能的[会话状态](/zh/react-effect/concepts?id=会话状态)。

### 参数

* callback - 返回一个 promise 对象的函数，或以该函数为主体的[会话键](/zh/react-effect/guides?id=基本用法)。
* variables - callback 函数的参数列表，或[会话配置](/zh/react-effect/feature?id=会话配置)。

### 返回

元组: `[state, trigger, execute]`，state 与 trigger 可参考[会话](/zh/react-effect/concepts?id=会话)概念。

* state - [会话状态](/zh/react-effect/concepts?id=会话状态)
* trigger - [会话触发器](/zh/react-effect/concepts?id=会话触发器)
* execute - [可入参手动触发函数](/zh/react-effect/guides?id=传参触发函数)

## createSessionKey

函数方法

```ts
function createSessionKey(promiseCallback, sessionType?){
    return SessionKey;
}
```

### 作用

为一个返回 promise 的函数创造一个会话键。

### 参数

* promiseCallback - 返回一个 promise 对象的函数。
* sessionType - 可选，会话类型，`'query' | 'mutation'`。通过固定会话类型，可防止我们对`工作者`使用了错误的会话键。

### 返回

会话键。可提供给 `SessionProvider` 用于生成会话库，同时由[工作者和调度者](/zh/react-effect/guides?id=调度者与工作者)通过键来匹配库，同步会话状态。

## SessionProvider

provider 组件

```ts
SessionProvider props:{
    keys: <session keys>,
    children?: ReactNode
}
```

### 作用

通过会话键生成会话库。并提供会话库的上下文状态管理环境。

### 参数

* keys - [会话键集合](/zh/react-effect/guides?id=基本用法)，可以是单个会话键，也可以是由会话键组成的 object 或数组。
* children - React Node

### Returns

It returns a React element.

## provide

SessionProvider 的高阶组件模式

```ts
function provide(sessionKeys){
    return function connect(Component){
        return function HocComponent(componentProps){
            return (
                <SessionProvider keys={sessionKeys}>
                  <Component {...componentProps}/>
                </SessionProvider>
            );
        }
    }
}
```

### 例子

```ts
import React from 'react';
import {
    provide, 
    useQuery, 
    useSession
    createSessionKey
} from '@airma/react-effect';

const clientKey = createSessionKey(...);

const Child = ()=>{
    const [ {data} ] = useSession(clientKey, 'query');
    return ......;
}

const App = provide(clientKey)(()=>{

    useQuery(clientKey, []);

    return (
        <div>
            <Child/>
        </div>
    );
})
```

## useSession

React hook

```ts
type Config = {
    loaded?: boolean,
    sessionType?: 'query' | 'mutation'
}

function useSession(sessionKey, config?: Config){
    return [state, trigger];
}
```

### 作用

用于同步会话状态，调度会话[工作者](/zh/react-effect/guides?id=调度者与工作者)运行，即[调度者](/zh/react-effect/guides?id=调度者与工作者)。

### 参数

* sessionKey - 由 [createSessionKey](/zh/react-effect/api?id=createsessionkey) API 创建的会话键。
* config - 可选配置。
  
### 解释：

* loaded - 可选，当值为 `true`，表示预判会话状态中的会话数据是已加载的，这时，typescript 类型限制会放宽类型检查，使 `data` 类型与请求 promise 返回类型保持一致；否则认为 `data` 可能为 `undefined` 类型。
* sessionType - 可选，值范围：`'query' | 'mutation'`，配置该项会对会话`键`启用会话类型检查，若不匹配，则报错。

### 返回

元组 `[state, trigger]`，即[会话](/zh/react-effect/concepts?id=会话)。

## useLoadedSession

React hook

```ts
type Config = {
    sessionType?: 'query' | 'mutation'
}

function useLoadedSession(sessionKey, config?: Config){
    return [state, trigger];
}
```

### 解释：

该 hook 相当于设置了 loaded 为 true 的 useSession。typescript 会认为其会话状态已经为加载状态。


### 返回

元组 `[state, trigger]`，即[会话](/zh/react-effect/concepts?id=会话)。

## Strategy

`@airma/react-effect` 提供的[常用策略集合](/zh/react-effect/concepts?id=常用策略)。

## ConfigProvider

provider 组件

```ts
type GlobalConfig = {
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

### 作用

用于配置范围内 API 特性。

### 属性

* value - 配置对象，`useGlobalFetching` 属性用于为无参 `useIsFetching` 提供全局监听支持；`strategy` 回调函数可以影响`useQuery`和`useMutation`的策略列表。
* children - React 节点

### 例子

```ts
import React from 'react';
import {
  ConfigProvider,
  Strategy,
  useQuery,
  useIsFetching
} from '@airma/react-effect';
import type {GlobalConfig} from '@airma/react-effect';
import {fetchUsers, fetchGroups} from './globalSessions'; 

const config: GlobalConfig = {
  // 通过全局策略回调为每个 `useQuery` 和 `useMutation`
  // 的 strategy 属性列表追加 Strategy.error 报错兜底处理
  strategy:(
    s:(StrategyType | undefined| null)[], type: 'query' | 'mutation'
  )=>[...s, Strategy.error((e)=>console.log(e))],
  // 启用全局 isFetching 监听
  useGlobalFetching: true
}

const App = ()=>{
  // 如果 `fetchUsers` 调用失败,
  // 全局配置 strategy 中的 `Strategy.error` 会被兜底运行
  useQuery(fetchUsers, []);
  useQuery(fetchGroups, {
    variables: [...ids],
    strategy: [
      Strategy.debounce(300), 
      // Strategy.error 可以阻止后续追加的 Strategy.error 运行 
      Strategy.error(...)
    ]
  });
  const userOrGroupsIsFetching = useIsFetching();
  ......
}

......
{/* Set a GlobalConfig */}
<ConfigProvider 
  value={config}
>
  <App/>
</ConfigProvider>
```

## ~~GlobalSessionProvider~~

 provider 组件

```ts
GlobalProvider props:{
    config?: GlobalConfig,
    keys?: SessonKeys,
    children?: ReactNode
}
```

### 作用

通过会话键生成一个全局会话库，并提供会话库的上下文状态管理环境。同时还具备全局会话配置功能。详情可参考[全局会话](/zh/react-effect/guides?id=全局会话)。

### Parameters

* config - 可选的全局会话配置。
* keys - 可选的全局会话键。
* children - React Nodes

## useIsFetching

React hook

```ts
export declare function useIsFetching(
  ...sessionStates: SessionState[]
): boolean;
```
### 作用

用于统计是否还有正在工作的会话。

### 参数

* sessionStates - 可选参数，会话状态集合。如集合为空，即没有参数，则统计 GlobalSessionProvider 中的所有会话状态；否则，只统计指定的状态集合。

### 返回

boolean 值，如有正在工作的会话返回 `true`，否则返回`false`。如果没有指定任何参数，同时也不在 `GlobalSessionProvider` 范围内，则报出异常。

## useLazyComponent

```ts
declare type LazyComponentSupportType<P> =
  | ComponentType<P>
  | ExoticComponent<P>;

declare type CheckLazyComponentSupportType<
  T extends LazyComponentSupportType<any>
> = T extends LazyComponentSupportType<infer P>
  ? P extends { error?: ErrorSessionState }
    ? LazyExoticComponent<T>
    : never
  : never;

export declare function useLazyComponent<
  T extends LazyComponentSupportType<any>
>(
  componentLoader: () => Promise<T | { default: T }>,
  ...deps: (AbstractSessionState | AbstractSessionResult)[]
): CheckLazyComponentSupportType<T>;
```

### 参数

* componentLoader - 加载组件的回调函数。该函数应该返回一个以组件或 `{default: 组件}` 为 resolve 值的 promise 对象。（组件的 props 需要满足 `{ error?: ErrorSessionState }` 项）
* deps - `useQuery` 或 `useMutation` 返回的会话状态集合.

### 返回

一个 React.lazy 组件。

### 作用

使用 `useQuery`、 `useMutation` 或 `useSession` 的加载结果来初始化组件。

### 例子

```ts
import React, {Suspense} from 'react';
import {
  GlobalSessionProvider,
  Strategy,
  useQuery,
  useLazyComponent
} from '@airma/react-effect';
import type {GlobalConfig, ErrorSessionState} from '@airma/react-effect';
import {currentUserKey, fetchUsersKey, fetchGroupsKey} from './globalSessions'; 

const config: GlobalConfig = {
  strategy:(
    s:(StrategyType | undefined| null)[], type: 'query' | 'mutation'
  )=>[...s, Strategy.error((e)=>console.log(e))]
}

const UnexpectedComp = (props:{error?:ErrorSessionState})=>{
  return (
    <div>some thing is wrong</div>
  )
}

const App = ()=>{
  const userSession = useQuery(currentUserKey, []);
  const [{data}] = userSession;
  const usersSession = useQuery(fetchUsersKey, {
    variables:[data],
    triggerOn: [ 'update' ],
  });
  const groupSession = useQuery(fetchGroupsKey, {
    variables:[data],
    triggerOn: [ 'update' ],
  });

  // 在制定会话及组件都加载后返回一个 React.lazy 组件，
  // 失败时返回一个 ()=>null 默认组件
  const Container = useLazyComponent(()=>import('./container'), 
    userSession,
    usersSession,
    groupSession
  )

  ......
  // 最好使用 Suspense 组件协助加载
  return (
    <div>
      ......
      <Suspense fallback={...}>
        <Container/>
      </Suspense>
    </div>
  )
}

......
{/* Set a ClientConfig */}
<GlobalSessionProvider 
  config={Strategy.error(e => console.log(e))}
  keys = {{fetchUsersKey, fetchGroupsKey}}
>
  <App/>
</GlobalSessionProvider>
```

## useResponse

```ts
export declare interface useResponse<T> {
  (
    process: (state: SessionState<T>) => any,
    sessionState: SessionState<T>
  ): void;
  success: (
    process: (data: T, sessionState: SessionState<T>) => any,
    sessionState: SessionState<T>
  ) => void;
  error: (
    process: (error: unknown, sessionState: SessionState) => any,
    sessionState: SessionState
  ) => void;
}
```

### 作用

用于处理会话状态发生响应变化时产生的副作用。

### 返回

无

### 例子

```ts
const [users, setUsers] = useState([]);
const [sessionState] = useQuery(promiseCall, []);
useResponse((s)=>{
  if (s.isError) {
    processError(s.error);
  }else{
    processSuccess(s.data);
  }
}, sessionState);
```
### useResponse.success

#### 作用

用于处理会话状态发生正常响应变化时产生的副作用。

#### 返回

无

#### 例子

```ts
const [users, setUsers] = useState([]);
const [sessionState] = useQuery(promiseCall, []);
useResponse.success((data)=>{
  processSuccess(data);
}, sessionState);
```

### useResponse.error

#### 作用

用于处理会话状态发生错误响应变化时产生的副作用。

#### 返回

无

#### 例子

```ts
const [users, setUsers] = useState([]);
const [sessionState] = useQuery(promiseCall, []);
useResponse.error((err)=>{
  processError(err);
}, sessionState);
```

### 与 Strategy.success \ Strategy.error 的不同

`Strategy.success` 以及 ` Strategy.error` 策略是直接响应 useQuery 请求函数的，即 promise.resolve。而 useResponse 是响应于会话状态副作用的。所以在使用多个 session key 相同的 `useQuery` 时，通常只有一个 `Strategy.success \ Strategy.error` 被触发。而 `useResponse` 不论 `useQuery` 工作与否，只要会话状态发生了响应式改变就会以副作用的形式触发。另外新加入的 `Strategy.effect` 策略系列也又同样的功效，在 render 处理模式中，我们更推荐使用 `useReponse` 及 `Strategy.effect` 系列进行副作用处理。