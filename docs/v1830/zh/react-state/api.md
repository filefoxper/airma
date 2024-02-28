# API

## useModel

```ts
function useModel(modelFn, defaultState?): instance;
```

参数：

* modelFn - [模型](/zh/react-state/concepts?id=模型)函数或[键](/zh/react-state/concepts?id=键) 。
* state - 默认状态值，当 modelFn 为键(/zh/react-state/guides?id=键) 时为可选项。

返回：

模型实例对象

## useControlledModel

```ts
function useControlledModel(
    modelFn, 
    state, 
    onChange
): instance
```

参数：

* modelFn - 模型函数。
* state - 外部状态值。
* onChange - 对外反馈变化状态的 callback 接口。

解释：

该 API 有助于将模型复用至受控模式，`useControlledModel` 不维护内部状态，完全受控于传入的外部状态值 state，可参考引导中关于[useControlledModel](zh/react-state/guides?id=usecontrolledmodel)这部分。

返回：

完全受控的模型实例对象

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

## useSelector

```ts
function useSelector(
  modelKey,
  selector,
  equalFn?
): ReturnType<C>;
```

参数：

* key - [键](/zh/react-state/concepts?id=键)。
* selector - 回调函数，可选取匹配[库](/zh/react-state/guides?id=库)链接的实例字段。
* equalFn - 可选对比函数，用于对比库状态更新前后，实例选取字段值是否相等。默认以 `===` 作为对比方案。

解释：

`useSelector` 用于选取`库`实例中的部分数据，当实例更新前后选取值相等，则不触发渲染，否则刷新选取值，触发使用组件渲染。对比标准 `equalFn`。

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
        <Provider value={counter}>
            <Decrease/>
            <Counter/>
            <Increase/>
        </Provider>
    );
}
```

## Provider

React.Context.Provider 组件

```ts
const Provider: FC<{
  value:  Array<ModelKey> | ModelKey | Record<string, ModelKey>;
  children?: ReactNode;
}>;
```

Props

* value - [键](/zh/react-state/concepts?id=键)集合，可以是单个键，也可以是键的数组或对象集合形式。
* children - react elements

作用

根据键创建本地库，提供通过键访问本地库的上下文环境。

返回

* react elements

## provide

Provider 的高阶组件形态。

```ts
function provide(
  keys
): (
  component: ComponentType
) => typeof component;
```

参数：

* keys - [键](/zh/react-state/concepts?id=键)集合，可以是单个键，也可以是键的数组或对象集合形态。
* component - React 组件

返回

* 与传入 component 拥有相同 props 接口的组件。相当于对传入组件包装了一层 Provider 父节点。


例子：

```ts
import React from 'react';
import { 
    provide, 
    createKey, 
    useModel, 
    useSelector 
} from '@airma/react-state';
import model from './model';

const models = createKey(model);

const App = provide(models)(
  ()=>{
    const {...} = useModel(models);
    const data = useSelector(models, s=>s.data);
    return <div>......</div>
  }
);
```

## createKey

函数 API

```ts
function createKey(
    modelFn,
    defaultState?
): ModelKey;
```

参数：

* modelFn - [模型](/zh/react-state/concepts?id=模型)函数

返回：

[键](/zh/react-state/concepts?id=键)

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

## model

model 作为 `@airma/react-state` 的简化入口，提供了集成流式的 API 调用风格。

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

## ConfigProvider

React 组件

```ts
export declare type GlobalConfig = {
  batchUpdate?: (callback: () => void) => void;
};

export declare const ConfigProvider: FC<{
  value: GlobalConfig;
  children?: ReactNode;
}>;
```

属性 

* value - 全局 API 配置，可通过对 `batchUpdate` 使用 `ReactDOM.unstable_batchedUpdates` 来提供公共模型的 state 更新效率。（注意：若使用 react 版本已经超过 18.0.0 可忽略该配置）
* children - React 节点

例子

```ts
import React from 'react';
import { render, unstable_batchedUpdates } from 'react-dom';
import App from './app';
import { ConfigProvider, GlobalConfig } from '@airma/react-state';

const root = document.getElementById('root');

// react 低于 18.0.0 可配置 batchUpdate
const config: GlobalConfig = {
  batchUpdate: unstable_batchedUpdates
};

render(
  <ConfigProvider value={config}>
    <App />
  </ConfigProvider>,
  root
);
```

