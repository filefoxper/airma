# 概念

`@airma/react-state` 的核心功能涉及了两个重要概念`模型`和`键`。

1. [模型](/zh/react-state/concepts?id=模型)
2. [键](/zh/react-state/concepts?id=键)

## 模型

模型是 `@airma/react-state` 进行状态更新的核心。与 reducer 函数不同的是，模型函数的入参只有 state 一项，返回的是一个带有`行为方法`和渲染状态的`实例`对象。

```ts
// 模型函数
// count 为状态变量 state
const counting = (count: number)=>{
    return {
        count,
        // 由状态变量加工得到的渲染状态
        isNegative: count < 0,
        // 行为方法，返回下一个状态
        increase:()=>count+1,
        decrease:()=>count-1,
        // 行为方法，可传入任意参数
        add(...additions: number[]){
            return additions.reduce((result, current)=>{
                return result + current;
            }, count);
        }
    }
}
```

`useModel` API 通过调用模型可得到其返回的实例对象，通过调用该对象上的方法可更新模型状态，并刷新实例。

```ts
import {useModel} from '@airma/react-state';

const counting = (count: number)=>{
    return {
        count,
        isNegative: count < 0,
        increase:()=>count+1,
        decrease:()=>count-1
    }
}

const {
    count,
    isNegative,
    increase,
    decrease
} = useModel(counting, 0);

// 调用 increase , count 值加 1
```

更新过程：

```
[渲染] count: 0         // 初始化渲染值 0
[调用] -> increase()    // 产生下一个值 1，重新调用
[自动] -> counting(1)   // 刷新实例，并触发渲染
[渲染] count: 1         // 更新后渲染值 1
```

因为模型实例上的方法均用于产生下一个状态，所以在类型系统中通常应限定行为方法的返回值类型与模型入参状态类型保持一致。

## 键

键作为系统的另一个核心主要用于生成本地库，并为访问本地库提供链接通道。所谓的[动态库](/zh/react-state/index?id=为什么要支持-reactcontext-库管理模式？)只是键的库形态。

通过使用 API createKey 可创建一个模型键：

```ts
// model.ts
import {createKey} from '@airma/react-state';

const counting = (count: number)=>{
    return {
        count,
        isNegative: count < 0,
        increase:()=>count+1,
        decrease:()=>count-1
    }
}

// 创建一个键 countingKey，并预设默认值 0
export const countingKey = createKey(counting, 0);
```

[provide](/zh/react-state/api?id=provide) 高阶组件 或 [Provider](/zh/react-state/api?id=provider) 组件使用键创建一个维护在 Provider 组件中的本地库。

```ts
// component.tsx
import {provide, Provider} from '@airma/react-state';
import {countingKey} from './model';

function Component(){
    return (
        <>
            <Increase />
            <Count />
            <Decrease />
        </>
    );
}

// provide 高阶组件使用键 countingKey 创建本地库
const WrappedComponent = provide(countingKey)(Component);
......
// 或者
function WrappedComponent(){
    // Provider 组件使用键 countingKey 创建本地库
    return (
        <Provider value={countingKey}>
            <Component />
        </Provider>
    );
}
```

[useModel](/zh/react-state/api?id=usemodel) 或 [useSelector](/zh/react-state/api?id=useselector) API 通过使用键连接访问已创建的本地库。

```ts
// component.tsx
import {
    provide, 
    useModel, 
    useSelector,
    shallowEqual
} from '@airma/react-state';
import {countingKey} from './model';

function Increase(){
    // useModel 通过键 countingKey 访问本地库
    const { increase } = useModel(countingKey);
    return <button onClick={increase} >+</button>
}

function Count(){
    // useSelector 通过键 countingKey 访问本地库，
    // 并选取 count 与 isNegative 渲染状态,
    // 通过 shallowEqual 进行变更判断，
    // 若判断无变更，则不进行无用的渲染。 
    const {
        count, 
        isNegative
    } = useSelector(countingKey, i=>({
        count: i.count, 
        isNegative: i.isNegative
    }),shallowEqual);
    return <span>{isNegative?'-':''} {count}</span>
}

function Decrease(){
    // useSelector 通过键 countingKey 访问本地库，
    // 并选取 decrease 行为方法
    const decrease = useSelector(countingKey, i=>i.decrease);
    return <button onClick={decrease} >+</button>
}

......

function Component(){
    return (
        <>
            <Increase />
            <Count />
            <Decrease />
        </>
    );
}

// provide 高阶组件使用键 countingKey 创建本地库
const WrappedComponent = provide(countingKey)(Component);
```

在难以提供静态默认状态的情况下，可暂不预设键的默认状态，等渲染时通过 useModel 进行初始化。

```ts
// model.ts
import {createKey} from '@airma/react-state';

const counting = (count: number)=>{
    return {
        count,
        isNegative: count < 0,
        increase:()=>count+1,
        decrease:()=>count-1
    }
}

// 创建一个键 countingKey，不预设默认值
export const countingKey = createKey(counting);
```

使用

```ts
// component.tsx
import {
    provide, 
    useModel, 
    useSelector
} from '@airma/react-state';
import {countingKey} from './model';

function Increase(){
    const { increase } = useModel(countingKey);
    return <button onClick={increase} >+</button>
}

function Count(){
    const count = useSelector(countingKey, i=>i.count);
    return <span>{count}</span>
}

function Decrease(){
    const decrease = useSelector(countingKey, i=>i.decrease);
    return <button onClick={decrease} >+</button>
}

......

function Component(props:{defaultCount: number}){
    // 通过 useModel 在渲染中进行初始化默认值
    useModel(countingKey, props.defaultCount);
    return (
        <>
            <Increase />
            <Count />
            <Decrease />
        </>
    );
}

const WrappedComponent = provide(countingKey)(Component);
```

下一节[引导](/zh/react-state/guides)
