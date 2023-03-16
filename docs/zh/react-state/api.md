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
  R extends Key<AirReducer<any, any>>,
  C extends (instance: ReturnType<R>) => any
>(
  key: R,
  selector: C,
  equalFn?: (c: ReturnType<C>, n: ReturnType<C>) => boolean
): ReturnType<C>;
```

参数：

* key - [键](/zh/react-state/guides?id=键)模型。
* selector - 选取匹配[库](/zh/react-state/guides?id=库)链接的实例字段。
* equalFn - 可选对比函数，用于对比`库链接`实例刷新时，上次选取数据与本次选取值是否相等。默认以 `===` 作为对比方案。

解释：

`useSelector` 用于选取`库链接`实例中的部分数据，当实例刷新时，若判断上次选取数据与本次选取值相等，则不触发渲染，继续沿用上次选中值。否则相应实例刷新，触发使用组件渲染。对比标准 `equalFn`。

该 API 大最大作用就是降低渲染频率，提高渲染性能。

返回：

selector 回调函数返回值。

例子：

```ts
import React from 'react';
import {
  Provider, 
  createKey, 
  useSelector
} from '@airma/react-state';

const counter = createKey((state:number)=>({
    count: state,
    isNegative: state<0,
    increase:()=> state + 1,
    decrease:()=> state - 1,
}));

const Increase = ()=>{
    // 选取行为方法
    const increase = useSelector(counter, instance=>instance.increase);

    return ......
}

const Decrease = ()=>{
    // 选取行为方法
    const decrease = useSelector(counter, instance=>instance.decrease);

    return ......
}

const Counter = ()=>{
    // 选取渲染数据
    const count = useSelector(counter, instance=>instance.count);
    return ......
}

export default ()=>{
    return (
        <Provider keys={counter}>
            <Decrease/>
            <Counter/>
            <Increase/>
        </Provider>
    );
}
```

## useRealtimeInstance

React hook

```ts
export declare function useRealtimeInstance<T>(instance: T): T;
```

参数：

* instance - 模型[实例](/zh/react-state/concepts?id=实例)

返回：

非稳定[实例](/zh/react-state/concepts?id=非稳定实例)

## useIsModelMatchedInStore

React hook

```ts
export declare function useIsModelMatchedInStore(
  key: Key<any>
): boolean;
```
参数：

* key - [键](/zh/react-state/guides?id=键)模型

返回

判断[键](/zh/react-state/guides?id=键)模型是否可以匹配上层 Provider 中的 store。

## Provider

React 组件

```ts
type Key=((state:any)=>Record<number|string, any>)&{
    pipe<S,T extends (Record<number|string, any>)>(
        model:(s:S)=>T
    ): typeof model
}

const Provider: FC<{
  keys:  Array<Key> | Key | Record<string, Key>;
  children: ReactNode;
}>;
```

Props

* keys - [键](/zh/react-state/guides?id=键)集合，可以是单个`键`模型，也可以是`键`模型数组或对象。
* children - react elements

Returns

* react elements

## withProvider

React 高阶组件

```ts
type Key=((state:any)=>Record<number|string, any>)&{
    pipe<S,T extends (Record<number|string, any>)>(
        model:(s:S)=>T
    ): typeof model
}

function withProvider<P extends object>(
  keys: Array<Key> | Key | Record<string, Key>,
  component: ComponentType<P>
): typeof component;
```

参数：

* keys - [键](/zh/react-state/guides?id=键)集合，可以是单个`键`模型，也可以是`键`模型数组或对象。
* component - React 组件

返回

* 与传入 component 拥有相同 props 接口的组件。相当于对该组件包装了一层 `Provider` 父节点。


例子：

```ts
import React from 'react';
import { 
    withProvider, 
    createKey, 
    useModel, 
    useSelector 
} from '@airma/react-state';
import model from './model';

const models = createKey(model);

const App = withProvider(
  models,
  ()=>{
    const {...} = useModel(models);
    const data = useSelector(models, s=>s.data);
    return <div>......</div>
});
```

## createKey

函数 API

```ts
type Key=((state:any)=>Record<number|string, any>)&{
    pipe<S,T extends (Record<number|string, any>)>(
        model:(s:S)=>T
    ): typeof model
}

function createKey<S,T extends Record<string|number,any>>(
    model: (state:S)=>T,
    defaultState?: S
):Key;
```

参数：

* model - [模型](/zh/react-state/concepts?id=模型)函数

解释：

`createKey`通过包装模型函数，生成的`键`模型，可用于 `Provider` 生成 [链接](/zh/react-state/concepts?id=链接) 库。`useModel` 或 `useSelector` 可以通过`键`访问 `Provider` 中的 [链接](/zh/react-state/concepts?id=链接) 库，从而达到上下文状态同步的效果。

如果希望了解[键](/zh/react-state/guides?id=键)模型的 pipe 方法的用途，请参考[神奇的管道](/zh/react-state/feature?id=神奇的管道)。

返回：

[键](/zh/react-state/guides?id=键)模型

## shallowEqual

函数 API

```ts
function shallowEqual<R>(prev: R, current: R): boolean;
```

参数：

* prev - 更新前数据
* current - 当前数据

解释：

通常用于 [useSelector](/zh/react-state/api?id=useselector) 的 `equalFn` 参数，以优化渲染性能。

返回：

通过浅对比，观察更新前后数据是否有变化。

例子：

```ts
import React from 'react';
import {
    ModelProvider, 
    factory, 
    useSelector,
    shallowEqual
} from '@airma/react-state';

const Counter = ()=>{
    // select 结果是一个复杂对象，
    // 这会导致 useSelector 每次更新时的默认对比失败，
    // 使用浅对比，可以解决该问题，并提神渲染效率
    const {count, isNegative} = useSelector(counter, instance=>({
        count:instance.count,
        isNegative: instance.isNegative
    }), shallowEqual);
    return ......
}
```