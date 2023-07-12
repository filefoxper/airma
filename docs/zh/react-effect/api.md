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

## Strategy

`@airma/react-effect` 提供的[常用策略集合](/zh/react-effect/concepts?id=常用策略)。

## GlobalSessionProvider

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
export function useLazyComponent<
  T extends ComponentType<any> | ExoticComponent<any>
>(
  componentLoader:
    | (() => Promise<T | { default: T }>)
    | {
        expected: () => Promise<T | { default: T }>;
        unexpected: () => Promise<T | { default: T }>;
      },
  ...deps: (AbstractSessionState | AbstractSessionResult)[]
): LazyExoticComponent<T>;
```

### 参数

* componentLoader - 加载组件的回调函数或配置。当它为函数时，应该返回一个以组件或 `{default: 组件}` 为 resolve 值的 promise 对象。当它为配置对象时，它支持通过设置 `expected` 和 `unexpected` 组件加载函数来区分正常加载，与异常加载时分别使用的组件。
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
import type {GlobalConfig} from '@airma/react-effect';
import {currentUserKey, fetchUsersKey, fetchGroupsKey} from './globalSessions'; 

const config: GlobalConfig = {
  strategy:(
    s:(StrategyType | undefined| null)[], type: 'query' | 'mutation'
  )=>[...s, Strategy.error((e)=>console.log(e))]
}

const UnexpectedComp = ()=>{
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

  // useLazyComponent 可以通过使用 expected 和 unexpected 加载器
  // 分别设置加载正常时的期望组件和错误时的异常处理组件
  const Container = useLazyComponent({
    expected: ()=>import('./container'),
    unexpected: ()=>Promise.resolve(UnexpectedComp)
  }, 
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