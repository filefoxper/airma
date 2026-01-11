# 概念

`@airma/react-state` 的功能核心为**模型**，通过模型可生成**实例**，而实例上的行为方法可用于生成新状态，进而再次通过模型刷新实例。模型也可用于生成**键**，键可用于创建**库**，并作为连接库的钥匙订阅库状态和实例。通过模型直接创建静态库的过程，实际上只是隐藏了创建键的步骤，但在库中依然存在一个隐形键。

1. [模型](concepts?id=模型)
2. [实例](concepts?id=实例)
3. [库](concepts?id=库)
4. [键](concepts?id=键)

## 模型

模型函数的主要功能是为状态提供一个可持续迭代更新的行为准则。函数入参**状态**用于生成**实例**， 而**实例**负责对外提供行为方法和渲染数据，当外部调用行为方法时，会产生一个新状态，新状态作为新入参被模型函数再次调用，进而刷新实例，并触发渲染。

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

[useModel](api?id=usemodel) API 将**模型**映射为实例，调用实例对象上的行为方法可更新状态，刷新实例。

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

## 实例

模型函数返回的对象即实例，但一个具备分发行为能力的实例需要订阅者通过库获取。实例对象可以是普通对象也可以是数组，它所包含的属性只能是渲染数据或行为方法。当这个属性值为函数时该属性被视作行为方法，否则被视为渲染数据。行为方法可产生新状态，并提交给库，库会使用新状态刷新实例，并通知订阅者渲染组件。

通过 model(xxx).produce 加工产生的模拟实例对象，会取代 useModel/useSignal/useSelector 这些 API 返回或依赖的实例对象。这些模拟实例对象与真正的库存实例对象有本质上的区别。首先，模拟实例中定义的方法并非行为方法，它们不具备直接修改状态的能力，只能通过调用库存实例上的行为方法去改变状态；其次，在诸如订阅副作用变更的 API （如： signal.useEffect/signal.useWatch） 中，模拟实例的属性和方法并不能作为订阅依赖，副作用订阅依然只能使用实例属性和行为方法。

## 库

所有的模型在使用过程中都会建立库用于存储状态和实例，并管理状态变更的行为过程，即便本地状态管理也会建立一个本地库。所有库均包含一个键作为外部订阅链接的钥匙，即便静态库和本地库亦是如此。

通过使用 API createStore 可为模型创建一个**库（静态）**：

```ts
// model.ts
import {createStore} from '@airma/react-state';

const counting = (count: number)=>{
    return {
        count,
        isNegative: count < 0,
        increase:()=>count+1,
        decrease:()=>count-1
    }
}

// 创建一个静态库 countingStore，并预设默认值 0
export const countingStore = createStore(counting, 0);
```

静态库通常是直接创建的静态常量，可通过 js 模块系统直接使用，不需要 provide 包装：

```ts
// component.tsx
import {
    provide, 
    useModel, 
    useSelector,
    shallowEqual
} from '@airma/react-state';
import {countingStore} from './model';

function Increase(){
    // useModel 通过键 countingStore 访问静态库
    const { increase } = useModel(countingStore);
    return <button onClick={increase} >+</button>
}

function Count(){
    // useSelector 通过键 countingStore 访问静态库，
    // 并选取 count 与 isNegative 渲染状态,
    // 通过 shallowEqual 对状态更新前后选取值进行等值判断，
    // 若判断为等值，则不进行无用的渲染。 
    const {
        count, 
        isNegative
    } = useSelector(countingStore, i=>({
        count: i.count, 
        isNegative: i.isNegative
    }),shallowEqual);
    return <span>{isNegative?'-':''} {count}</span>
}

function Decrease(){
    // useSelector 通过键 countingStore 访问静态库，
    // 并选取 decrease 行为方法
    const decrease = useSelector(countingStore, i=>i.decrease);
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
```

在难以提供静态默认状态的情况下，可在渲染阶段使用 useModel 或 [useSignal](api?id=usesignal) 进行初始化。

```ts
// model.ts
import {createStore} from '@airma/react-state';

const counting = (count: number)=>{
    return {
        count,
        isNegative: count < 0,
        increase:()=>count+1,
        decrease:()=>count-1
    }
}

// 创建一个静态库 countingStore，不预设默认值
export const countingStore = createStore(counting);
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
import {countingStore} from './model';

function Increase(){
    const { increase } = useModel(countingStore);
    return <button onClick={increase} >+</button>
}

function Count(){
    const count = useSelector(countingStore, i=>i.count);
    return <span>{count}</span>
}

function Decrease(){
    const decrease = useSelector(countingStore, i=>i.decrease);
    return <button onClick={decrease} >+</button>
}

......

function Component(props:{defaultCount: number}){
    // 通过 useModel 或 useSignal 均可在渲染开始时初始化默认状态。
    // useSignal 渲染效率更高。
    // 也可以使用 useModel(countingKey, props.defaultCount);
    useSignal(countingStore, props.defaultCount);
    return (
        <>
            <Increase />
            <Count />
            <Decrease />
        </>
    );
}
```

## 键

键是生成库的模板，也是访问库的钥匙。所谓的[动态库](index?id=id=为什么要支持动态库管理模式？)就是在组件元素中建立的库，因为这些库难需要通过键来访问。

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

[provide](api?id=provide) 高阶组件 或 [Provider](api?id=provider) 组件需要使用键来创建动态库。

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

// provide 高阶组件在元素化时使用键 countingKey 创建动态库
const WrappedComponent = provide(countingKey).to(Component);
......
// 或者
function WrappedComponent(){
    // WrappedComponent 组件元素化时 Provider 组件元素使用键 countingKey 创建动态库
    return (
        <Provider value={countingKey}>
            <Component />
        </Provider>
    );
}
```

[useModel](api?id=usemodel) 或 [useSelector](api?id=useselector) 通过键订阅已创建的动态库。

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
    // useModel 通过键 countingKey 访问动态库
    const { increase } = useModel(countingKey);
    return <button onClick={increase} >+</button>
}

function Count(){
    // useSelector 通过键 countingKey 访问动态库，
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
    // useSelector 通过键 countingKey 访问动态库，
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

// provide 高阶组件元素化时使用键 countingKey 创建动态库
const WrappedComponent = provide(countingKey).to(Component);
```

在难以提供静态默认状态的情况下，可在渲染阶段使用 useModel 或 [useSignal](api?id=usesignal) 进行初始化。

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
    // 若并不关注初始化得到的实例对象，推荐使用 useSignal，useSignal 渲染效率更高。
    // 也可以使用 useModel(countingKey, props.defaultCount);
    useSignal(countingKey, props.defaultCount);
    return (
        <>
            <Increase />
            <Count />
            <Decrease />
        </>
    );
}

// provide 高阶组件支持不使用 to 方法: provide(countingKey).to(Component)
const WrappedComponent = provide(countingKey)(Component);
```

在静态库和本地库中也存在一个**键**，但因为并非动态，可以直接订阅，所以不需要使用与**键**有关的API。

下一节[引导](guides)
