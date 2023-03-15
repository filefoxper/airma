# API

## useModel

```ts
function useModel<
  S, 
  T extends Record<string, any>| Record<number, any>,
  D extends S
>(
  model: (state:S)=>T,
  state?: D,
  option?: { 
    refresh?: boolean; 
    autoLink?: boolean; 
    realtimeInstance?: boolean 
  }
): T;
```

参数：

* model - 模型函数，详情可见[概念部分](/zh/react-state/concepts?id=模型)。
* state - 默认状态值，当 model 为 [键](/zh/react-state/guides?id=键) 模型时为可选项。
* option - 可选配置，可配置 `refresh`，`autoLink`，`realtimeInstance` 项，开启不同的功能。

解释：

1. `option.refresh`：当该配置项为 `true` 时，`useModel` 会跟随默认状态值的变化刷新实例。
2. `option.autoLink`：当该配置项为 `true` 时，如果 `useModel` 使用的 `键` 无法访问到匹配的 `库`，则将 `键` 模型当作本地模型使用，实例维护在 `useModel` 中。成功匹配上下文实例库的 `useModel`，在开启 `autoLink` 的情况下，不具备[运行时初始化](/zh/react-state/guides?id=初始化)的能力。
3. `option.realtimeInstance`：当该配置项为 `true` 时，返回的实例对象为[非稳定实例](/zh/react-state/concepts?id=非稳定实例)。

返回：

模型[实例](/zh/react-state/concepts?id=实例)

例子：

```ts
// 本地状态
import {useModel} from '@airma/react-state';

const counter = (state:number)=>({
    count: state,
    increase:()=> state + 1,
    decrease:()=> state - 1
});

// 自定义 hook
const useCounter = ()=>{
    const {
        count,
        increase,
        decrease,
    } = useModel(counter);

    ......
};
```

or 

```ts
// 上下文状态
import React from 'react';
import {
    useModel, 
    createKey,
    Provider
} from '@airma/react-state';

// 建立 `键` 模型
const counter = createKey((state:number)=>({
    count: state,
    increase:()=> state + 1,
    decrease:()=> state - 1
}));

const Counter = ({name}:{name:string})=>{
    // 使用 `键` 模型链接上下文状态库中的实例
    const {
        count,
        increase,
        decrease,
    } = useModel(counter);

    ......
};

export const App = ()=>{
    // Provider 通过 `键` 创建并维护实例库
    return (
        <Provider keys={counter}>
            <Counter name="count_1">
            <Counter name="count_2">
        </Provider>
    );
}
```

## useControlledModel

```ts
function useControlledModel<
  S,
  T extends Record<string|number, any>,
  D extends S
>(
    model: (state:S)=>T, 
    state: D, 
    onChange: (s: S) => any
): T;
```

参数：

* model - 模型函数，不能为 `键` 模型，详情可见[概念部分](/zh/react-state/concepts?id=模型)。
* state - 外部状态值。
* onChange - 对外反馈变化状态的 callback 接口。

解释：

该 API 有助于将模型复用至受控模式，`useControlledModel` 不维护内部状态，完全传入 state 外部状态值的变化，这与 `useModel` 的 `refresh` 模式以及 `useRefreshModel` 不同。可参考引导的[受控模型](zh/react-state/guides?id=受控模型)部分。

返回：

完全受控的模型[实例](/zh/react-state/concepts?id=实例)

例子：

```ts
import React from 'react';
import {counter} from './model';
import {useControlledModel} from '@airma/react-state';

interface CounterProps {
    value:number;
    onChange(v:number):void
}

const ControlledCounter = ({value, onChange}: CounterProps)=>{
    const {
        count,
        increase,
        decrease,
    } = useControlledModel(counter, value, onChange);

    return ......
}

const App = ()=>{
    const [state, setState] = useState(0);
    return (
        <ControlledCounter value={state} onChange={setState}/>
    );
}
```

## useRefreshModel

```ts
function useRefreshModel<
  S,
  T extends Record<string|number, any>,
  D extends S
>(
  model: (state:S)=>T,
  state: D,
  option?: { autoLink?: boolean; realtimeInstance?:boolean }
): T;
```

参数：

* model - 模型函数，详情可见[概念部分](/zh/react-state/concepts?id=模型)。
* state - 状态值，`useRefreshModel` 监听该值的变化刷新实例。
* option - 可选配置，可配置 `autoLink`，`realtimeInstance` 项，开启不同的功能。

解释：

API `useRefreshModel` 相当于 [useModel(model, state, {refresh: true})](/zh/react-state/api?id=usemodel) 的快捷使用方式，内部有自己的 state 或有链接的实例库 state。当传参 state 发生变化时，`useRefreshModel` 会刷新实例，当实例行为方法被调用时，也会刷新实例。

返回：

模型[实例](/zh/react-state/concepts?id=实例)

例子：

```ts
import React from 'react';
import {useRefreshModel} from '@airma/react-state';
import {counter} from './model';

const App = ()=>{
    const [state, setState] = useState(0);

    // 跟随 state 变化渲染，当并不完全受控于 state
    const {
        count,
        increase,
        decrease,
    } = useRefreshModel(counter, state); 

    const resetCountTo = (c)=>{
        setState(c);
    };

    return ......;
}
```

## useRefresh

```ts
function useRefresh<T extends (...args: any[]) => any>(
  method: T,
  variables:
    | Parameters<T>
    | {
        refreshDeps?: any[];
        variables: Parameters<T>;
      }
): void;
```

参数：

* method - 任意带参数的回调函数
* variables - 回调函数依赖参数，或配置。

解释：

`useRefresh` API 通过监听 variables 变化调用 method 回调函数。variables 为 method 的参数。如果希望改变监听依赖，可设置 refreshDeps 作监听依赖，设置 refreshDeps 后，`useRefresh` 不再监听 variables 变化。

返回

void

## useSelector

```ts
export declare function useSelector<
  R extends StoreKey<AirReducer<any, any>>,
  C extends (instance: ReturnType<R>) => any
>(
  storeKey: R,
  selector: C,
  equalFn?: (c: ReturnType<C>, n: ReturnType<C>) => boolean
): ReturnType<C>;
```

参数：



Parameters

* storeKey - A store key, it should be a result of calling [createStoreKey](/react-state/api?id=createstorekey).
* selector - A callback to select properties from instance which is refreshed by the matched store state.
* equalFn - Optional callback, it is used to provide a comparator for comparing if the result of `selector` has been changed. Only when the result of `selector` has been changed, it drive the component which uses it to render. In default, it compares the result change by using `===` expression.

Explain

This API only can be used to link a matched store with store key. It can select data from instance which is refreshed by the matched store state. If there is no matched store, it throws an error. When a state change happens, `useSelector` refresh and select data from the instance, only if the selected result is changed, it drives component to render. So, it is often used for reducing the frequency of component render.

Returns

* A result selected from instance refreshd by the matched store state.

Example

```ts
import React from 'react';
import {
  StoreProvider, 
  createStoreKey, 
  useSelector
} from '@airma/react-state';

// use createStoreKey API to make a key to store
const counter = createStoreKey((state:number)=>({
    count: state,
    isNegative: state<0,
    increase:()=> state + 1,
    decrease:()=> state - 1,
}));

const Increase = ()=>{
    // select action method from instance,
    // the action method from instance is persistent,
    // so, useSelector will never drive `Increase` rerender again.
    const increase = useSelector(counter, instance=>instance.increase);

    return ......
}

const Decrease = ()=>{
    // same as `Increase`
    const decrease = useSelector(counter, instance=>instance.decrease);

    return ......
}

const Counter = ()=>{
    const count = useSelector(counter, instance=>instance.count);
    return ......
}

export default ()=>{
    return (
        <StoreProvider value={counter}>
            <Decrease/>
            <Counter/>
            <Increase/>
        </StoreProvider>
    );
}
```

## useRealtimeInstance

```ts
export declare function useRealtimeInstance<T>(instance: T): T;
```

Parameter

* instance - A instance, it can be a [stable instance](/react-state/concepts?id=stable-instance) or a [realtime instance](/react-state/concepts?id=realtime-instance).

Returns

A [realtime instance](/react-state/concepts?id=realtime-instance).

## useIsModelMatchedInStore

```ts
export declare function useIsModelMatchedInStore(
  model: AirReducer<any, any> | StoreKey<any>
): boolean;
```

Parameters

* model - A model or a store key

Returns

If the model is a store key, and if the store key is matched with a store.

## Provider

It has another name [ModelProvider](/react-state/api?id=modelprovider).

```ts
type StoreKey=((state:any)=>Record<number|string, any>)&{
    pipe<S,T extends (Record<number|string, any>)>(
        model:(s:S)=>T
    ): typeof model
}

const StoreProvider: FC<{
  value:  Array<StoreKey> | StoreKey | Record<string, StoreKey>;
  children: ReactNode;
}>;
```

Props

* value - Store keys.
* children - react nodes

Returns

* react nodes

## ModelProvider

It has another name [StoreProvider](/react-state/api?id=storeprovider).

## withStoreProvider

```ts
type StoreKey=((state:any)=>Record<number|string, any>)&{
    pipe<S,T extends (Record<number|string, any>)>(
        model:(s:S)=>T
    ): typeof model
}

function withStoreProvider(
  keys: Array<StoreKey> | StoreKey | Record<string, StoreKey>
): <P extends object>(component: ComponentType<P>) => typeof component;
```

Parameters

* keys - Store keys.

Returns

* A callback which accepts a React Component, and returns a `HOC` of the parameter Component with a out `StoreProvider` wrap.


Explain

It is a `HOC` usage for `StoreProvider`.

Example

```ts
import React from 'react';
import { 
    withStoreProvider, 
    createStoreKey, 
    useModel, 
    useSelector 
} from '@airma/react-state';
import model from './model';

const models = createStoreKey(model);

const App = withStoreProvider(models)(()=>{
    const {...} = useModel(models);
    const data = useSelector(models, s=>s.data);
});
```

## withModelProvider

It is another name of [withStoreProvider](/react-state/api?id=withstoreprovider).

## createKey

```ts
type StoreKey=((state:any)=>Record<number|string, any>)&{
    pipe<S,T extends (Record<number|string, any>)>(
        model:(s:S)=>T
    ): typeof model
}

function createStoreKey<S,T extends Record<string|number,any>>(
    model: (state:S)=>T,
    defaultState?: S
):StoreKey;
```

Parameters

* model - A function accepts a state parameter, and returns an object to provide display data and action methods.
* defaultState - Optional, provide a default state for store initial.

Explain

If you want to learn how to use `pipe`, please review the [guide detail](/react-state/guides?id=pipe).

Returns

* A store key model, which can be provided to `StoreProvider` for generating a store, and be provided as key to link the store state for `useModel` or `useSelector`.

## factory

It is another name of [createStoreKey](/react-state/api?id=createstorekey).

## shallowEqual

```ts
function shallowEqual<R>(prev: R, current: R): boolean;
```

Explain

This API is for `useSelector` equalFn to compare the selected result changes.

Example

```ts
import React from 'react';
import {
    ModelProvider, 
    factory, 
    useSelector,
    shallowEqual
} from '@airma/react-state';

const Counter = ()=>{
    // compare the shallow properties one by one.
    const {count, isNegative} = useSelector(counter, instance=>({
        count:instance.count,
        isNegative: instance.isNegative
    }), shallowEqual);
    return ......
}
```