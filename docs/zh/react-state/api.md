# API

## useModel

```ts
function useModel(modelFnOrKey, defaultState?): instance;
```

参数：

* modelFnOrKey - [模型](/zh/react-state/concepts?id=模型)函数或[键](/zh/react-state/concepts?id=键) 。
* defaultState - 默认状态值，当 modelFnOrKey 为键(/zh/react-state/guides?id=键) 时为可选项。

返回：

模型实例对象

## ~~useStaticModel~~

与 useModel 不同的是，useStaticModel 不会订阅库存状态变更，不会主动导致组件重渲染。因此，更适用于 render 中初始化库状态，或纯粹触发行为方法。当前 hook 可用于优化渲染性能。 

```ts
function useStaticModel(
  modelKey, 
  defaultState?
): instance;
```

**支持版本>=18.3.1**

参数：

* modelKey - [键](/zh/react-state/concepts?id=键) 。
* state - 默认状态值，当 modelFnOrKey 为键(/zh/react-state/guides?id=键) 时为可选项。

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
* onChange - 对外反馈变化状态的回调函数。

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

## useRealtimeInstance

 useModel 返回的静态实例对象字段值在一次组件 render 上下文中是固定不变的，就像 useState 值一样。useRealtimeInstance 可从该值中提取一个动态实例对象，它的字段值随字段的获取，始终保持当前最新值。

```ts
function useRealtimeInstance<T>(instance: T): T;
```

参数

* **instance** - useModel API 返回的实例对象

返回

实时动态实例对象

例子

```ts
import {
  useModel,
  useRealtimeInstance
} from '@airma/react-state';

type User = {
  name: string;
  username: string;
  age: number;
}

const defaultUser = {name:'', username:'', age:0};

const instance = useModel((user: User)=>{
  return {
    user,
    setName: (name:string)=>({...user, name}),
    setUsername: (username:string)=>({...user, username}),
    setAge: (age: number)=>({...user, age})
  }
}, defaultUser);

// 提出动态实例对象
const realtimeInstance = useRealtimeInstance(instance);

const callSetAge = (age: number)=>{
  instance.setAge(age);
};

const saveUser =()=>{
  // 在 setTimeout 开始时立即运行 callSetAge 修改 instance.user.age，
  // 按期望，在 setTimeout 时间到期时 instance.user.age 应该发生了改变，
  // 但 instance 在本次 render 上下文中是固定不变的，因此时间到期后， age 值依然没有发生变更。
  // 而动态实例对象中的 age 值，在获取时始终保持最新。
  setTimeout(()=>{
    // instance.user.age 是旧值
    instance.user.age;
    // realtimeInstance.user.age 是新值
    realtimeInstance.user.age.
  }, 1000);
};
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
* children - React 节点（React Nodes）

作用

根据键创建本地库，提供通过键访问本地库的 React.Context 环境。

返回

* React 节点（React Nodes）

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
interface GlobalStoreApi {
  useModel:(state?)=>Instance,
  useSignal:(state?)=>()=>Instance,
  useSelector:(callback:(instance)=>Result,equality:(s,t)=>boolean)=>Result,
  getInstance:()=>Instance,
  initialize:(defaultState)=>void
}

interface StoreApi {
  key,
  with:(
    ...stores: (StoreApi | ModelKey)[]
  ) => StoreApi,
  /** @deprecated **/
  static: () => GlobalStoreApi,
  createStore:()=>GlobalStoreApi,
  provide,
  provideTo: (
    component: ComponentType
  ) => typeof component,
  Provider: FC<{ children?: ReactNode }>,
  useModel,
  useSignal,
  useSelector
}

interface Api {
  useModel:(state?)=>Instance,
  useSignal:(state?)=>()=>Instance,
  useControlledModel,
  /** @deprecated **/
  createStore: (defaultState?) => StoreApi;
  createKey: (defaultState?) => StoreApi;
}

function model(modelFn): (typeof modelFn) & Api;

model.createField = function(callback:()=>any, deps?:any[]);

model.createMethod = function(callback:(...args:any[])=>any);
```

参数

* modelFn - 模型函数

返回

带有常用API的模型函数

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

## useSignal

hook API，用于创建模型实例的生成函数。该函数可返回当前最新的模型实例对象值。

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

function useSignal(modelFnOrKey, defaultState?): (()=>instance)&;Signal
```

参数：

* modelFnOrKey - [模型](/zh/react-state/concepts?id=模型)函数或[键](/zh/react-state/concepts?id=键) 。
* defaultState - 默认状态值，当 modelFnOrKey 为键(/zh/react-state/guides?id=键) 时为可选项。

返回：

模型实例对象生成函数 signal。可用于生成最新的模型实例对象，也可通过调用该函数的 useEffect、useWatch 方法，添加模型更新的副作用或监听。

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