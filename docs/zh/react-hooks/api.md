# API

## React-state API

### createKey

[method API] 用于创建模型[键](/zh/react-state/guides?id=键)，可将键提供给 Provider 创建 store；使用者可通过使用键访问 store 中的模型[实例](/zh/react-state/concepts?id=实例)，并同步[模型](/zh/react-state/concepts?id=模型)状态更新。 [引用](/zh/react-state/api?id=createkey)

```ts
declare type AirReducer<S>=(state:S)=>any;

export declare function createKey<
  S, 
  R extends AirReducer<S>
>(
  model: R,
  defaultState: S
): R;
```

### useModel

[hook API] 用于创建或连接（如果使用的是模型键）一个模型实例，并维持模型与实例对象之间的状态同步。[引用](/zh/react-state/api?id=usemodel)

```ts
declare type AirReducer<S>=(state:S)=>any;

export declare function useModel<
  S,
  R extends AirReducer<S>
>(
  model: R,
  state?: S
): ReturnType<R>;
```

### useSignal

[hook API] 用于创建获取最新模型实例的函数，并维持模型与实例对象之间的状态同步。[引用](/zh/react-state/api?id=usesignal)

```ts
declare type AirReducer<S>=(state:S)=>any;

export declare function useSignal<
  S,
  R extends AirReducer<S>
>(
  model: R,
  state?: S
): ()=>ReturnType<R>;
```

### ~~useStaticModel~~

与 useModel 唯一的不同的是，useStaticModel 不会订阅库状态变更，不会主动导致组件重渲染。因此，更适合用于 render 中初始化库状态，或纯粹触发行为方法节省渲染性能的场景。[引用](/zh/react-state/api?id=usestaticmodel) 

```ts
function useStaticModel(
  modelKey, 
  defaultState?
): instance;
```

参数：

* modelKey - [键](/zh/react-state/concepts?id=键) 。
* state - 默认状态值，当 modelFnOrKey 为键(/zh/react-state/guides?id=键) 时为可选项。

返回：

模型实例对象

### useControlledModel

[hook API] 用于将模型实例状态链接至外部状态，并完全受控于该外部状态， 如: `useState`, [引用](/zh/react-state/api?id=usecontrolledmodel)

```ts
declare type AirReducer<S>=(state:S)=>any;

export declare function useControlledModel<
  S,
  R extends AirReducer<S>
>(
  model: R,
  state: S,
  onChange: (s: S) => any
): ReturnType<R>;
```

### useSelector

[hook API] 用于选取或重组来自全局 store 的实例对象。当实例对象更新时，若选取或重组的数据与更新前一致，则不会引起数据更新，从而达到优化性能的目的，[引用](/zh/react-state/api?id=useselector)

```ts
declare type AirReducer<S>=(state:S)=>any;

export declare function useSelector<
  S,
  R extends AirReducer<S>,
  C extends (instance: ReturnType<R>) => any
>(
  factoryModel: R,
  selector: C,
  equalFn?: (c: ReturnType<C>, n: ReturnType<C>) => boolean
): ReturnType<C>;
```

### ~~useRealtimeInstance~~

 [hook API] useModel 返回的静态实例对象字段值是相对固定的，只随组件的 render 发生改变，就像 useState 值一样。useRealtimeInstance 可从该值中提取一个动态实例对象，它的字段值随字段的获取，始终保持当前最新。[引用](/zh/react-state/api?id=userealtimeinstance)

 ```ts
function useRealtimeInstance<T>(instance: T): T;
```

### model

[函数 API] model 作为 `@airma/react-state` 的简化入口，提供了集成流式的 API 调用风格。[引用](/zh/react-state/api?id=model)

```ts
interface GlobalStoreApi {
  useModel,
  useSelector
}

interface StoreApi {
  key,
  with:(
    ...stores: (StoreApi | ModelKey)[]
  ) => StoreApi,
  asGlobal: () => GlobalStoreApi,
  provide,
  provideTo: (
    component: ComponentType
  ) => typeof component,
  Provider: FC<{ children?: ReactNode }>,
  useModel,
  useSelector
}

interface Api {
  useModel,
  useControlledModel,
  createStore: (defaultState?) => StoreApi;
}

function model(modelFn): (typeof modelFn) & Api;
```

参数

* modelFn - 模型函数

返回

带有常用API的模型函数

用法[参考](/zh/react-state/guides?id=model)

### shallowEqual

[method API] 用于浅对比两个对象是否等价。

```ts
export declare function shallowEqual<R>(prev: R, current: R): boolean;
```

参数：

* prev - 对比值之一
* current - 对比值之一

返回：

等价为 true，否则为 false。

## React-effect API

### createSessionKey

[method API] 用于创建一个会话键（会话键也是一种模型键），可将键提供给 Provider 创建 store；使用者可通过使用键访问 store 中的[会话](/zh/react-effect/concepts?id=会话)实例，并同步[会话状态](/zh/react-effect/concepts?id=会话状态)，[引用](/zh/react-effect/api?id=createsessionkey)

```ts
export declare function createSessionKey<
  E extends (...params: any[]) => Promise<any>
>(
  effectCallback: E,
  queryType:'query'|'mutation'
): SessionKey<E>;
```

### Strategy

[collection API] 这是一个常用会话[策略](/zh/react-effect/concepts?id=策略)集合，[引用](/zh/react-effect/concepts?id=常用策略)

### useQuery

[hook API] 用于维护查询功能的会话状态。 [引用](/zh/react-effect/api?id=usequery)

```ts
export declare function useQuery<
  D extends PromiseCallback<any> | SessionKey<any>
>(
  callback: D,
  config: QueryConfig
): SessionResult<D>;
```

### useMutation

[hook API] 用于维护修改功能的会话状态。[引用](/zh/react-effect/api?id=usemutation)

```ts
export declare function useMutation<
  D extends PromiseCallback<any> | SessionKey<any>
>(
  callback: D,
  config: MutationConfig
): SessionResult<D>;
```

### useSession

[hook API] 用于同步会话状态，调度会话[工作者](/zh/react-effect/guides?id=调度者与工作者)运行，即[调度者](/zh/react-effect/guides?id=调度者与工作者)。[引用](/zh/react-effect/api?id=usesession)

```ts
export declare function useSession<D extends SessionKey>(
  sessionKey: D,
  config?: { loaded?: boolean; sessionType?: SessionType } | SessionType
): [SessionState, () => void];
```

### useLoadedSession

[hook API] 该 hook 相当于设置了 loaded 为 true 的 useSession。typescript 会认为其会话状态已经为加载状态。[引用](/zh/react-effect/api?id=useloadedsession)

```ts
export declare function useLoadedSession<D extends SessionKey>(
  sessionKey: D,
  config?: UseSessionConfig | SessionType
): [LoadedSessionState, () => void];
```

### useResponse

[hook API] 用于处理会话状态发生响应变化时产生的副作用。[引用](/zh/react-effect/api?id=useresponse)

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

### useIsFetching

[hook API] 用于统计是否还有正在工作的会话。[引用](/zh/react-effect/api?id=useisfetching)

```ts
export declare function useIsFetching(
  ...sessionStates: (AbstractSessionState | AbstractSessionResult)[]
): boolean;
```

### session

用于包装声明会话的函数形 API。该API可封装一个异步函数，并返回一个针对会话的常用API集合。

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

## 公共 API

### provide

[common HOC API] 用于使用键生成带有库的 Provider 组件，由于 `@airma/react-effect` 的状态共享使用的就是 `@airma/react-state` 提供的模型共享机制, 所以我们将两者的 provide API 合成一个。 [state 引用](/zh/react-state/api?id=provide)、[effect 引用](/zh/react-effect/api?id=provide)

```ts
export declare function provide(
  keys: ModelKeys
): <P extends Record<string, any>>(
  component: FunctionComponent<P> | NamedExoticComponent<P>
) => typeof component;
```

### Provider

[common Component API] 因为 `@airma/react-effect` 的状态共享机制与 `@airma/react-state` 相同，所以，可以将两者的 Provider ：[state StoreProvider](/zh/react-state/api?id=storeprovider)、[effect SessionProvider](/zh/react-effect/api?id=sessionprovider) 合成一个。

```ts
export declare const Provider: FC<{
  value: ModelKeys;
  children?: ReactNode;
}>;
```

### ConfigProvider

[common Component API] 虽然 `@airma/react-state` 与 `@airma/react-effect`有细微不同，但却是可以互相兼容的，所以 [state ConfigProvider](/zh/react-state/api?id=configprovider) 与 [effect ConfigProvider](/zh/react-effect/api?id=configprovider) 合成一个公共的 ConfigProvider。

```ts
export declare type GlobalConfig = {
  batchUpdate?: (callback: () => void) => void;
  useGlobalFetching?: boolean;
  strategy?: (
    strategy: (StrategyType | null | undefined)[],
    type: SessionType
  ) => (StrategyType | null | undefined)[];
};

export declare const ConfigProvider: FC<{
  value: GlobalConfig;
  children?: ReactNode;
}>;
```

## React-hooks-core API

### usePersistFn

```ts
export declare function usePersistFn<T extends (...args: any[]) => any>(
  callback: T
): T;
```

用于代替 `useCallback`, 可持久化 function，使其内容更新，但引用不变。

参数：

* callback - 任意函数

返回：

与入参函数类型相同，内容相同，但引用不随渲染变化的函数。

例子：

```ts
import {memo} from 'react';
import {usePersistFn} from '@airma/react-hooks-core';

const App = memo((props: {onChange: (value:string)=>void})=>{
    return ...;
});

const Layout = ()=>{
    // 因为 call 引用始终不变，所以不会额外引起 memo 组件的渲染。
    const call = usePersistFn((v: string)=>{});

    return <App onChange={call}/>
}
```

### useMount

```ts
export declare function useMount(callback: () => (() => void) | void): void;
```

该 hook 相当于 `React.useEffect(callback, [])`。

### useUpdate

```ts
export declare function useUpdate<T extends any[]>(
  callback: (prevDeps: typeof deps) => (() => void) | void,
  deps?: T
): void;
```

该 hook 在副作用时间监听依赖项是否发生变化，若有变化，则调用入参函数，并为入参函数提供变化前的依赖值列表。

参数：

* callback - 回调函数，可接受一个与依赖数组同类型的数组作参数（即更新前的依赖数组）。
* deps - 依赖数组

返回：

void

例子：

```ts
import {memo, useState} from 'react';
import {useUpdate} from '@airma/react-hooks-core';

const App = memo((props: {value:number})=>{

    const [count, setCount] = useState(props.value);

    useUpdate((prev)=>{
        if(!prev){
            return;
        }
        const [prevValue] = prev;
        console.log(prevValue)
    }, [props.value]);

    return ...;
});
```

### useRefresh

```ts
export declare function useRefresh<T extends (...args: any[]) => any>(
  method: T,
  variables:
    | Parameters<T>
    | {
        refreshDeps?: any[];
        variables: Parameters<T>;
      }
): void;
```

该 hook 通过依赖 variables 产生的副作用调用 method 回调函数。variables 为 method 的参数。如果希望改变监听依赖，可设置 refreshDeps 作副作用依赖，设置 refreshDeps 后，useRefresh 不再依赖 variables 产生的副作用。

参数：

* method - 任意带参数的回调函数
* variables - 回调函数依赖参数，或配置。

返回：

void

例子：

```ts
import {useEffect, useState} from 'react';
import {useRefresh} from '@airma/react-hooks-core';

function useIntervalCountDown() {
    const [count, setCount] = useState(60);
    const [s, setS] = useState(count);
    useEffect(()=>{
        const id = window.setInterval(()=>{
            setCount(c=>c-1);
        },1000);
        return ()=> {
            window.clearInterval(id);
        }
    },[]);
    
    useRefresh((seconds)=>setS(seconds<0?0:seconds), [count]);
    
    return s+'s';
}
```

### useUnmount

```ts
export declare function useUnmount(destroy: () => void): void;
```

该 hook 相当于 `useEffect(()=>destrory, [])`

### useDebounceFn

用于将一个回调函数包装成一个防抖的异步函数。

```ts
declare type Promisify<F extends (...args: any[]) => any> = F extends (
  ...args: infer A
) => infer R
  ? (...args: A) => Promise<R>
  : never;

export declare function useDebounceFn<F extends (...args: any[]) => any>(
  fn: F,
  option: number | { lead?: boolean; ms: number }
): Promisify<F>;
```

#### 参数

* **fn** - 被包装函数
* **option** - 防抖时间或配置，如果 option.lead 为 true，函数调用时机为先调用后防抖，否则先防抖后调用。