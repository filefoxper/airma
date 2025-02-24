# 概念

`@airma/react-state` 的功能核心为**模型**，通过模型可生成实例，而实例上的行为方法可用于生成新状态，进而再次通过模型刷新实例。模型也可用于生成**键**，键可用于创建库，并作为连接库钥匙同步库中的状态。通过模型直接创建静态库的过程，实际上只是隐藏了创建键的步骤，但在库中依然存在一个隐形键。

1. [模型](/zh/react-state/concepts?id=模型)
2. [键](/zh/react-state/concepts?id=键)

## 模型

模型函数的主要功能是为状态提供一个可持续迭代更新的行为准则。函数入参**状态**用于生成**模型实例**， 而**模型实例**负责对外提供行为方法和渲染数据，当外部调用行为方法时，会产生一个新状态，新状态作为新入参被模型函数再次调用，进而刷新实例，并触发渲染。

```ts
// 模型函数
// 状态 count 为入参
const counting = (count: number)=>{
    return {
        count,
        // 由状态变量加工得到的渲染数据
        isNegative: count < 0,
        // 行为方法，返回行为发生后的新状态
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

[useModel](/zh/react-state/api?id=usemodel) API 将**模型**映射为实例，调用实例对象上的行为方法可更新状态，刷新实例。

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
[调用] -> increase()    // 产生新状态 1，并触发刷新事件
[刷新] -> counting(1)   // 刷新实例，并触发渲染
[渲染] count: 1         // 更新后渲染值 1
```

因为**行为方法**的作用是产生新状态，所以在构建模型函数的过程中，通常应限定行为方法的返回值类型与模型入参状态类型保持一致。

## 键

键是生成库的模板，也是访问库的钥匙。所谓的[动态库](/zh/react-state/index?id=为什么要支持-reactcontext-库管理模式？)就是在组件中建立的库，因为这些库难以通过模块获取，所以需要通过键来访问。

通过使用 API createKey 可为模型函数创建一个**键**：

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

[provide](/zh/react-state/api?id=provide) 高阶组件 或 [Provider](/zh/react-state/api?id=provider) 组件需要使用键来创建本地库。

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
const WrappedComponent = provide(countingKey).to(Component);
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

[useModel](/zh/react-state/api?id=usemodel) 或 [useSelector](/zh/react-state/api?id=useselector) 通过键连接已创建的本地库。

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
    // 通过 shallowEqual 对状态更新前后选取值进行等值判断，
    // 若判断为等值，则不进行无用的渲染。 
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
const WrappedComponent = provide(countingKey).to(Component);
```

在难以提供静态默认状态的情况下，可在渲染阶段使用 useModel 或 [useSignal](/zh/react-state/api?id=usesignal) 进行初始化。

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
    useSignal,
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
    // 通过 useModel 或 useSignal 均可在渲染开始时初始化默认状态。
    // 若并不关注初始化得到的实例对象，推荐使用 useSignal。
    // useSignal 只订阅库被获取属性的状态变更，若无属性值被获取则不会发生订阅，是 render 阶段初始化库的利器
    // useModel(countingKey, props.defaultCount);
    useSignal(countingKey, props.defaultCount);
    return (
        <>
            <Increase />
            <Count />
            <Decrease />
        </>
    );
}

// provide 高阶组件支持不使用 to 方法，直接二次调用的方式传入自定义组件
const WrappedComponent = provide(countingKey)(Component);
```

下一节[引导](/zh/react-state/guides)
