# API

## useModel

```ts
function useModel(modelLike, defaultState?): instance;
```

参数：

* modelLike - [模型](/zh/react-state/concepts?id=模型)函数或[键](/zh/react-state/concepts?id=键)或库(通过model().createStore()建立的静态库) 。
* defaultState - 默认状态值，当 modelLike 为键或库时为可选项。

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
* onChange - 对外反馈变化状态的回调函数，参数为行为发生后产生的新状态值。

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
): ReturnType<selector>;
```

参数：

* key - [键](/zh/react-state/concepts?id=键)或库。
* selector - 回调函数，用于重组或选取匹配[库](/zh/react-state/guides?id=库)链接的实例字段。
* equalFn - 可选对比函数，用于自定义如何判断库状态更新前后，重组或选取值是否相等。默认以 `===` 作为对比方案。

解释：

若 `useSelector` 选取值在状态更新前后相等，则不触发组件再渲染，否则更新选取值并触发组件渲染。对比标准 `equalFn`。

该 API 的最大作用就是降低渲染频率，提升渲染性能。

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

## useSignal

```ts
interface EffectOn {
  onActions: (
    filter: (ins: Instance) => ActionMethod[]
  ) => EffectOn;
  onChanges:(
    filter: (ins: Instance) => any[]
  ) => EffectOn;
}

interface Signal {
  useEffect:(call:()=>void|(()=>void))=>EffectOn;
  useWatch:(call:()=>void)=>EffectOn
}

function useSignal(modelLike, defaultState?): (()=>instance)&;Signal
```

参数：

* modelLike - [模型](/zh/react-state/concepts?id=模型)函数或[键](/zh/react-state/concepts?id=键)或库(通过model().createStore()建立的静态库) 。
* defaultState - 默认状态值，当 modelLike 为键或库时为可选项。

返回

* 实例获取函数，该函数始终返回当前最新的实例对象。在组件render阶段获取的实例属性会默认记入渲染属性集合，当且仅当该集合中的属性发生改变时，再次渲染组件。

例子

```ts
import React from 'react';
import {
  Provider, 
  createKey, 
  useSignal
} from '@airma/react-state';

const counter = createKey((state:number)=>({
    count: state,
    isNegative: state<0,
    increase:()=> state + 1,
    decrease:()=> state - 1,
}));

const Increase = ()=>{
    const signal = useSignal(counter);
    // 若选取数据未发生变化，不渲染组件
    const increase = signal().increase;
    return ......
}

const Decrease = ()=>{
    // 若选取数据未发生变化，不渲染组件
    const {decrease} = useSignal(counter)();

    return ......
}

const Sym = ()=>{
    // 若选取数据未发生变化，不渲染组件
    const {isNegative} = useSignal(counter)();;
    return ......
}

const Counter = ()=>{
    // 若选取数据未发生变化，不渲染组件
    const {count} = useSignal(counter)();;
    return ......
}

export default ()=>{
    return (
        <Provider value={counter}>
            <Decrease/>
            <Sym/>
            <Counter/>
            <Increase/>
        </Provider>
    );
}
```

通过 signal 的 useEffect, useWatch 方法可以像模型实例添加更新副作用，或直接监听更新。

```ts
import React, { useState } from 'react';
import { model } from '@airma/react-state';

const counter = model((state:number)=>({
    count: state,
    isNegative: state<0,
    increase:()=> state + 1,
    decrease:()=> state - 1,
}));

const Counter = ()=>{
    const signal = counter.useSignal(0);

    // 添加副作用
    signal.useEffect((instance)=>{
        // 副作用只服务于 render 执行之后，而根据 signal 的渲染规则，
        // 因为当前组件在 render 阶段只使用了 `isNegative` 字段，
        // 故当前副作用中只会响应 `isNegative` 字段的渲染变化。
        console.log('count effect change', instance.count);
    });

    // 添加监听
    signal.useWatch((instance)=>{
        // 与副作用 signal.useEffect 不同，监听器直接响应实例产生的行为变化。
        // 故监听器不受当前组件是否 render 的影响。
        console.log('count watch change', instance.count);
    });

    const {increase, decrease, isNegative} = signal();

    return (
        <div>
            <button onClick={increase}>+</button>
            <span>{isNegative? 'negative' : 'positive'}</span>
            <button onClick={decrease}>-</button>
        </div>
    );
}
```

通过添加 `onChanges` 和 `onActions` 过滤方法，可控制副作用和监听的响应范围。

```ts
import React, { useState } from 'react';
import { model } from '@airma/react-state';

const counter = model((state:number)=>({
    count: state,
    isNegative: state<0,
    increase:()=> state + 1,
    decrease:()=> state - 1,
}));

const Counter = ()=>{
    const signal = counter.useSignal(0);

    signal.useEffect((instance)=>{
        // 虽然 signal 在当前组件只使用了 `isNegative` 字段，但 `onChanges` 过滤器会将 `count` 字段也纳入渲染和监听范围，
        // 故通过 `onChanges` 过滤器可以迫使 signal 响应 `count` 字段的渲染变化，并只触发 `count` 渲染变化产生的副作用。
        console.log('count effect change', instance.count);
    }).onChanges((ins) => [ins.count]);

    signal.useWatch((instance)=>{
        // 通过使用 `onActions` 过滤器，signal.useWatch 只会响应 `increase` 行为方法。
        console.log('count watch change', instance.count);
    }).onActions((ins) => [ins.increase]);

    const {increase, decrease, isNegative} = signal();

    return (
        <div>
            <button onClick={increase}>+</button>
            <span>{isNegative? 'negative' : 'positive'}</span>
            <button onClick={decrease}>-</button>
        </div>
    );
}
```

注意：

* 尽量不要在子组件的 `useLayoutEffect` 中使用父组件 useSignal 返回的 signal 回调函数。因为 useSignal 渲染相关字段的统计算法就是在当前 useSignal 使用组件的 `useLayoutEffect` 阶段终止的，而子组件的 `useLayoutEffect` 通常先于当前组件的 `useLayoutEffect` 执行。这可能导致统计所得的渲染相关字段中混入部分并不希望关联渲染的脏字段。

关于如何使用 useSignal，及 signal 函数的 effect 和 watch 方法，请参考引导中的[高性能渲染](/zh/react-state/guides?id=高性能渲染)章节。


## Provider

React.Context.Provider 组件

```ts
const Provider: FC<{
  value?:  Array<ModelKey> | ModelKey | Record<string, ModelKey>;
  storeCreators?:  Array<ModelKey> | ModelKey | Record<string, ModelKey>;
  children?: ReactNode;
}>;
```

Props

* value - [键](/zh/react-state/concepts?id=键)集合，可以是单个键，也可以是键的数组或对象集合形式。
* children - React 节点（React Nodes）

作用

根据键创建本地库，提供通过键访问本地库的 React.Context 环境。

返回

* React 节点（React Nodes）

## provide

Provider 的高阶组件形态。

```ts
function provide(
  storeCreators
): ((
  component: ComponentType
) => typeof component)&{
  to:(
    component: ComponentType
  ) => typeof component
};
```

参数：

* storeCreators - [键](/zh/react-state/concepts?id=键)集合，可以是单个键，也可以是键的数组或对象集合形态。
* component - React 组件

返回

* 拥有建库能力的高阶组件，高阶组件调用后，产生一个与传入 component 拥有相同 props 接口的组件。相当于对传入组件包装了一层 Provider 父节点。（自 18.5.10 起可使用 to 方法来完成）


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

或

```ts
import React from 'react';
import { 
    provide, 
    createKey, 
    useModel, 
    useSelector 
} from '@airma/react-state';
import model from './model';

const modelKey = model(model).createKey();

const App = provide(modelKey).to(
  ()=>{
    const {...} = modelKey.useModel();
    const data = useSelector(modelKey, s=>s.data);
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
    // 这会导致 useSelector 在状态更新前后的默认对比值始终不等，
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
interface KeyApi {
  useModel:(state?)=>Instance,
  useSignal:(state?)=>()=>Instance,
  useSelector:(callback:(instance)=>Result,equality:(s,t)=>boolean)=>Result,
}

interface StoreApi {
  with:(
    ...stores: (StoreApi | ModelKey)[]
  ) => StoreApi,
  /** @deprecated **/
  static: () => StoreApi,
  provide,
  provideTo: (
    component: ComponentType
  ) => typeof component,
  Provider: FC<{ children?: ReactNode }>,
  useModel:(state?)=>Instance,
  useSignal:(state?)=>()=>Instance,
  useSelector:(callback:(instance)=>Result,equality:(s,t)=>boolean)=>Result,
  instance:(defaultState?)=>Instance
}

interface Api {
  useModel:(state?)=>Instance,
  useSignal:(state?)=>()=>Instance,
  useControlledModel,
  createStore: (defaultState?) => StoreApi;
  createKey: (defaultState?) => KeyApi;
}

function model(modelFn): (typeof modelFn) & Api;

model.createField = function(callback:()=>any, deps?:any[]);

model.createMethod = function(callback:(...args:any[])=>any);
```

参数

* modelFn - 模型函数

返回

带有常用API方法的模型函数，这些API方法可具体参考相关同名独立API。

用法[参考](/zh/react-state/guides?id=model)

静态方法

* createField - 创建实例字段，用法[参考](/zh/react-state/guides?id=实例字段)
* createMethod - 创建实例方法，注意该API创建的实例方法不同于行为方法，仅供调用，不会修改模型状态。

### model.createField

用于创建实例字段。

```ts
function createField(callback:()=>any, deps?:any[]): {
  get:()=>ReturnType<typeof callback>,
};
```

参数

* callback - 产生字段值的函数
* deps - 缓存字段值依赖的外部变量

返回

字段对象，包含 get 方法，用于获取字段值。当依赖 `deps` 存在，且未发生变化时，get 方法返回缓存的字段值，否则重新计算字段值并缓存；当依赖 `deps` 不存在时，get 方法直接返回最新的字段值。

用法[参考](/zh/react-state/guides?id=实例字段)

### model.createMethod

用于创建实例方法，注意该API创建的实例方法不同于行为方法，仅供调用，不会修改模型状态。

```ts
function createMethod<R extends (...args:any[])=>any>(callback:R): R;
```

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

* value - 全局 API 配置，可通过对 `batchUpdate` 使用 `ReactDOM.unstable_batchedUpdates` 来提升公共模型的 state 更新渲染性能。（注意：若使用 react 版本已经超过 18.0.0 可忽略该配置）
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