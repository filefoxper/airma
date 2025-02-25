# 引导

本节主要介绍 `@airma/react-state` 中各种常用 API 的功能、用法。

## useModel

API useModel 可用于管理本地或库模型的状态。

### 本地状态管理

本地状态管理需要为 useModel 提供一个[模型](/zh/react-state/concepts?id=模型)函数及模型对应的默认状态。

```ts
const instance = useModel(model, defaultState);
```

例子:

```ts
import {useModel} from '@airma/react-state';

const {
    // 渲染状态
    count,
    // 行为方法
    increase,
    ......
} = useModel(
    // 模型函数
    (state:number)=>({
        count: state,
        isNegative: state<0,
        increase(){
            return state+1;
        },
        decrease(){
            return state-1;
        }
    }), 
    // 默认状态
    props.defaultCount??0
);
```

可以把它当作简化版的 React.useReducer。

### 动态库状态管理

用于管理动态库状态的 useModel 与管理本地状态的 useModel 所需参数略有不同。

1. 其中本地管理使用的模型函数，需要换成[键](/zh/react-state/concepts?id=键)。
2. 如果使用的键有预设默认状态，或其他同键 useModel 已做初始化处理，则可不提供默认状态。

```ts
// 已预设过默认状态的键，不需要再次初始化
const storeInstance = useModel(modelKey);
// 没有预设过默认状态的键，可在 render 运行时初始化
const storeInstance = useModel(modelKey, defaultState);
```

[更多例子](/zh/react-state/concepts?id=键)

## useSelector

useSelector API 可用于重组库模型实例的字段，并通过对比状态变更前后 useSelector 的重组结果是否相等，来决定是否需要重新渲染。可用于提升渲染性能。

```ts
const xxx = useSelector(modelKey, (instance)=>instance.xxx);
```

可通过第三个参数 equalFn 可自定义如何判断重组值是否相等。推荐使用 [shallowEqual](/zh/react-state/api?id=shallowequal) API。

```ts
import {pick} from 'lodash';
import {useSelector, shallowEqual} from '@airma/react-state';

const {xxx} = useSelector(modelKey, (instance)=>pick(instance,['xxx']), shallowEqual);
// shallowEqual 以浅对比的方式进行等值判断
```

[更多例子](/zh/react-state/concepts?id=键)

## createKey 与 provide

API [provide](/zh/react-state/api?id=provide) 用于提供创建和使用动态库所需的 [Provider](/zh/react-state/api?id=provider) 外包装组件环境。

```ts
/**
 * @params modelKeys 键或键的集合（对象、数组均可）
 * @params Component 需要使用 Provider 库的自定义组件
 * 
 * @returns WrappedComponent 被 Provider 组件包囊后的组件
 **/
const WrappedComponent = provide(modelKeys)(Component)
const WrappedComponent = provide(modelKeys).to(Component)
```

API [createKey](/zh/react-state/api?id=createkey) 可以为**模型**生成[键](/zh/react-state/concepts?id=键)，键可用于生成本地库，同时作为连接本地库的通道。

```ts
/**
 * @params modelFn 模型函数
 * @params 预设默认值，可选
 * 
 * @returns 模型键
 * 
 **/
const key = createKey(modelFn, defaultState);
```

使用方式

```ts
import {myModel} from './model';
import {createKey, provide} from '@airma/react-state';

const modelKey = createKey(myModel)

const Component = provide(modelKey)(function Component(){
    return ......;
})
```

想要同时创建和使用多个不同的库？

```ts
import {myModel, myModel2} from './model';
import {createKey, provide} from '@airma/react-state';

const key = createKey(myModel, defaultState);

const key2 = createKey(myModel2);

const keys = {key, key2};

const Child = ()=>{
    // 链接 key 创建的本地库
    useModel(keys.key);
    return ......;
}

// 对象风格的键集合
const Component = provide(keys)(function Component(){
    // 链接 key2 创建的本地库
    useModel(key2, defaultState);
    return <Child/>
});

// 数组风格的键集合
const Component1 = provide([key, key2])(function Component1(){
    // 链接 key2 创建的本地库
    useModel(key2, defaultState);
    return <Child/>;
});

// 参数风格的键集合 >= 18.5.10
const Component1 = provide(key, key2)(function Component1(){
    // 链接 key2 创建的本地库
    useModel(key2, defaultState);
    return <Child/>;
})
```

想要使用 Provider 组件风格？

```ts
import {myModel} from './model';
import {createKey, Provider} from '@airma/react-state';

const modelKey = createKey(myModel)

const Component = function Component(){
    return (
        <Provider storeCreators={modelKey}>
            ......
        </Provider>
    );
})
```

Provider 系统采用了分布式树形库存结构，键通过对每个 Provider 节点至近及远，至下及上的匹配方式查找库。

```ts
import {myModel, myModel2} from './model';
import {createKey, provide} from '@airma/react-state';

const key = createKey(myModel, defaultState);

const key2 = createKey(myModel2);

const Child = provide(key2)(()=>{
    // 在当前的 provide 中无法找到 key,
    // 向上查找，
    // 在 const Component = provide(key) 中找到 key 对应的库
    useModel(key);
    useModel(key2, defaultState);
    return ......;
});

const Component = provide(key)(function Component(){
    useModel(key);
    return <Child/>;
});
```

想要创建模型相同的不同库？

```ts
import {myModel} from './model';
import {createKey, provide} from '@airma/react-state';

const key = createKey(myModel);

const key2 = createKey(myModel);

// key 和 key2 拥有有相同的模型，但却是两个不同的键，
// 因此它们会生成两个不同的库
const keys = [key, key2];

const Component = provide(keys)(function Component(){
    return ......;
});
```

## useControlledModel

关键渲染数据完全依赖 props 提供和回传的 React 组件被称为受控组件。受控组件具有非常良好的复用性，状态控制权交由使用者掌控。在受控组件中可使用 [useControlledModel](/zh/react-state/api?id=usecontrolledmodel) 可适配通用模型来完成较复杂的受控交互任务。

useControlledModel 用于管理模型的受控状态。

```ts
/**
 * @params modelFn 模型函数
 * @params value 受控状态
 * @params onChange 受控状态变更后的回传函数
 * 
 * @returns 模型实例
 **/
const instance = useControlledModel(modelFn, value, onChange)
```

例子：

公共模型

```ts
export const toggleModel = (selected:boolean)=>([
    selected,
    ()=>!selected
] as const);
```

在非受控组件中使用模型

```ts
import {toggleModel} from '../common/model';
import {useModel} from '@airma/react-state';

const UnControlledCheckbox = ()=>{
    // 拥有本地状态，完全不依赖外界
    const [
        selected,
        toggle
    ] = useModel(
        toggleModel, 
        false
    );

    return ......;
}
```

在受控组件中使用模型

```ts
import {toggleModel} from '../common/model';
import {useControlledModel} from '@airma/react-state';

const ControlledCheckbox = (props:{
    checked:boolean,
    onChange:(checked:boolean)=>void
})=>{
    const {checked, onChange} = props;
    const [
        selected,
        toggle
    ] = useControlledModel(
        toggleModel,
        // 完全依赖外界提供当前状态 
        checked, 
        // 通过外界提供的回调函数回传变更后的状态
        onChange
    );

    return ......;
}
```

受控、非受控兼容组件使用模型

```ts
import {toggleModel} from '../common/model';
import {useControlledModel} from '@airma/react-state';

const Checkbox = (props:{
    checked?:boolean,
    onChange?:(checked:boolean)=>void
})=>{
    const {checked, onChange} = props;

    const handleChange = (c: boolean)=>{
        onChange?.(c);
    }
    // 非受控模型实例
    const instance = useModel(
        toggleModel, 
        checked ?? false
    );
    // 受控模型实例
    const cInstance = useControlledModel(
        toggleModel,
        checked ?? false, 
        handleChange
    );

    const isUnControlled = 'checked' in props;

    const [
        selected,
        toggle
    ] = isUnControlled? instance : cInstance;

    return ......;
}
```

## model

模型声明 API [model](/zh/react-state/api?id=model) 整合了常用的模型 API，提供了一套流调用的使用方式。

```ts
import {model} from '@airma/react-state';

/**
 * @params 模型函数
 * 
 * @returns 带有各种常用API的模型函数
 **/
const toggleModel = model((selected:boolean)=>([
    selected,
    ()=>!selected
] as const));
```

使用方式

```ts
import {model, provide} from '@airma/react-state';

const toggleModel = model((selected:boolean)=>([
    selected,
    ()=>!selected
] as const));

// 创建动态库的生成访问键
const toggleKey = toggleModel.createKey(false);

// 创建静态库
const toggleGlobalStore = toggleModel.createStore();
......
function ChildComponent(props){
    // 本地状态管理
    const [selected, toggle] = toggleModel.useModel(false);
    // 受控状态管理
    const [selected, toggle] = toggleModel.useControlledModel(props.checked, props.onChange);
    // 本地状态管理 signal 模式
    const signal = toggleModel.useSignal(false);
    const [selected, toggle] = signal();

    return ......;
}

......
// 不推荐使用 provide 静态库来生成动态库
// toggleGlobalStore.provideTo(function Component(){
provide(toggleKey).to(function Component(){
    const [, toggle] = toggleKey.useModel();
    const selected = toggleKey.useSelector(([s])=>s);
    const [, toggleFromSignal] = toggleKey.useSignal()();
    const selectedInGlobal = toggleGlobalStore.useSelector(([s])=>s);
    return ......;
});
......
function Comp(){
    const instance = toggleGlobalStore.useModel();
    const signal = toggleGlobalStore.useSignal();
    return ......;
}
```

在 18.5.10 版本之前，model().createStore 方法生成的是键的包装，但至此版本开始，model().createStore 方法生成的是静态库。因为静态库本身含有键，故可以被 provide 作为键来产生动态库。但并不推荐这种动态库创建方式。

想要整合多个动态库？

```ts
import {model, provide} from '@airma/react-state';

const toggleKey = model((selected:boolean)=>([
    selected,
    ()=>!selected
] as const)).createKey(false);

const countKey = model((count:number)=>([
    count,
    ()=>count+1,
    ()=>count-1
] as const)).createKey(0);

......
// provide 多个键的方式整合
provide(toggleKey,countKey,...).to(
    function Component(){
        const [, toggle] = toggleKey.useModel();
        const selected = toggleKey.useSelector(([s])=>s);
        const [count, increase, decrease] = countKey.useModel();
        return ......;
    }
);
......
```

关于如何通过 model 使用 useSignal 来优化渲染性能，请参考 [高性能渲染](/zh/react-state/guides?id=高性能渲染) 中的内容。

### 静态库的外部调用模式

静态库只能通过 model().createStore 方法创建，作为一个组件外部常量，静态库也提供了组件外部的使用方案。

通过静态库的 instance 方法在组件外部初始化库的默认状态。

```ts
import {model} from '@airma/react-state';

const countStore = model((count:number)=>([
    count,
    ()=>count+1,
    ()=>count-1
] as const)).createStore(0);

countStore.instance(1);

function Comp(){
    const [count, increase, decrease] = countStore.useModel();
    // 首次加载的 count 受外部初始化影响，值为 1
    return ......;
}
```

通过调用静态库的 instance 方法生成的实例对象提供的行为方法，可修改状态，并触发使用该库的组件重新渲染。

```ts
import {model} from '@airma/react-state';

const countStore = model((count:number)=>([
    count,
    ()=>count+1,
    ()=>count-1
] as const)).createStore(0);

function Comp(){
    const [count, increase, decrease] = countStore.useModel();
    return ......;
}

function Comp2(){
    const handleClick=()=>{
        // 通过instance方法获取静态库实例对象
        // 并通过调用 increase 行为方法触发渲染
        countStore.instance().increase();
    }
    return ......;
}
```

## 实例字段

自 `v18.5.1` 开始 `@airma/react-state` 新增了实例字段 API `model.createField`。

通过对 model.createField 方法添加依赖项，可创建一个缓存字段。该字段只能通过外部实例获取才能生成缓存，并通过 get 方法获取字段值。

**注意**：字段对象在模型函数中不具备缓存效果，但依然可以通过调用其 get 方法获取值。

```ts
import {model} from '@airma/react-state';

type QueryCondition = {
    name: string;
    page:number;
    pageSize:number;
    fetchVersion:number;
}

const queryModel = model((condition:QueryCondition)=>{
    return {
        ...condition,
        // 创建一个依赖 condition.fetchVersion 变化做缓存的字段，
        // 注意，缓存字段在 model 模型方法中并无缓存作用。
        // 只有通过实例获取并调用该字段值的 get 方法时，才能享受缓存效果。
        query:model.createField(()=>{
            const {name, page, pageSize} = condition;
            return {name, page, pageSize}
        },[condition.fetchVersion]),
        setName(name:string){
            return {
               ...condition,
                name
            }
        },
        setPageInfo(page:number, pageSize:number){
            return {
               ...condition,
                page,
                pageSize
            }
        },
        startFetch(){
            return {
               ...condition,
                fetchVersion:condition.fetchVersion+1
            }
        }
    }
});

const App = ()=>{
    const instance = queryModel.useModel(
        {
            name:'', 
            page:1, 
            pageSize:10, 
            fetchVersion:0
        }
    );
    const { query } = instance;
    const {setName, setPageInfo, startFetch} = instance;

    useEffect(()=>{
        // 通过 get 方法获取实例缓存字段值 {name, page, pageSize}
        fetch(query.get());
    },[query.get()]) // 通过 get 方法获取实例缓存字段值

    // 当 setName 修改 condition.name 时， query.get() 缓存值不会更新
    const handleNameChange = (e)=>setName(e.target.value);

    // 当 startFetch 修改了缓存字段依赖值 fetchVersion 时，缓存值 query.get() 发生更新
    const handleFetch = ()=>startFetch();
    ......
}
```

缓存字段的互相依赖。

```ts
import {model} from '@airma/react-state';

type QueryCondition = {
    name: string;
    page:number;
    pageSize:number;
    fetchVersion:number;
}

const queryModel = model((condition:QueryCondition)=>{

    const pageInfo = model.createField(()=>{
        const {page, pageSize} = condition;
        return {page, pageSize}
    },[condition.page, condition.pageSize]);
    
    return {
        ...condition,
        // 当依赖其他缓存字段时，需要将其直接添加到依赖列表中，不能使用 get 方法产生值。
        // 当前缓存依赖了 fetchVersion 和 pageInfo 两个缓存字段，
        // 而 pageInfo 依赖了 page 和 pageSize 两个缓存字段。
        // 因此，该缓存相当于依赖了 fetchVersion、page 以及 pageSize 三个变量。
        // 当 fetchVersion、page、 pageSize 中的任一变量发生变化时，该缓存字段都会重新计算。
        query:model.createField(()=>{
            const {page, pageSize} = pageInfo.get();
            const {name} = condition;
            return {name, page, pageSize}
        },[condition.fetchVersion, pageInfo]),
        setName(name:string){
            return {
               ...condition,
                name
            }
        },
        setPageInfo(page:number, pageSize:number){
            return {
               ...condition,
                page,
                pageSize
            }
        },
        startFetch(){
            return {
               ...condition,
                fetchVersion:condition.fetchVersion+1
            }
        }
    }
});
```

当不为字段提供缓存依赖时，字段的 get 方法将会返回不受闭包影响的最新值。

```ts
import {model} from '@airma/react-state';

const countModel = model((count:number)=>([
    model.createField(()=>count),
    ()=>count+1,
    ()=>count-1
] as const));

const App = ()=>{
    const [countField,increase,decrease] = countModel.useModel(0);
    const count = countField.get();

    useEffect(()=>{
        setTimeout(()=>{
            // 当 count 字段发生变化时，该字段受闭包作用影响，在当前作用域中被固定，
            // 但 countField.get() 返回值不受闭包影响，始终返回最新值。
            console.log('differ', count, countField.get());
        },1000);
    });

    return (
        <div>
            <button onClick={increase}>+</button>
            {count}
            <button onClick={decrease}>-</button>
        </div>
    );
}
```

**注意**：在当前版本中，通过 model.createField 创建的字段对象会根据依赖项和字段返回值是否变化为标准，判断字段对象是否需要重新生成，但在未来版本，字段对象将成为与行为方法类似的不变存在，变化的只有字段 get 方法的返回值。

## ConfigProvider

由于 `@airma/react-state` 采用的是订阅更新模式，库存状态数据的变更会通知每个使用点，使用点在收到变更通知后独立进行 React 状态更新（setState）。在 react<18.0.0 版本中需要 unstable_batchedUpdates 进行更新效率优化，而 `@airma/react-state` 并没有依赖 `react-dom` 包，因此需要通过配置的方式引入 unstable_batchedUpdates。

```ts
import { unstable_batchedUpdates } from 'react-dom';
import { ConfigProvider } from '@airma/react-state';

const config = {batchUpdate: unstable_batchedUpdates};

<ConfigProvider value={config}>
......
</ConfigProvider>
```

## 高性能渲染

自 `v18.4.0` 开始 `@airma/react-state` 新增了 [useSignal](/zh/react-state/api?id=usesignal) API，用于提升渲染性能，并监听模型实例变更。

useSignal API 返回一个实例生成函数，调用该函数可获取当前最新的实例对象。在组件渲染阶段使用的实例对象字段会被记入渲染相关字段，当且仅当这些字段发生变更时，useSignal 才会触发组件重新渲染。

```ts
const signal = useSignal(modelFn, defaultState?);
// const signal = useSignal(modelKey);
const instance = signal();
```

例子：

```ts
import {useSignal} from '@airma/react-state';

const counting = (state:number)=>({
    count: state,
    isNegative: state<0,
    increase(){
        return state+1;
    },
    decrease(){
        return state-1;
    }
});

const countingSignal = useSignal(counting, props.defaultCount??0);

// isNegative 被标记为渲染相关字段，当 `isNegative` 变更时，组件会重新渲染。
const {
    // isNegative 被标记为渲染相关字段
    isNegative
} = countingSignal();

if(!isNegative){
    // 当 `isNegative` 为 false 时，`count` 字段被使用，并标记为渲染相关字段。
    // 当 `isNegative` 为 false，且 `count` 字段变更时, 组件重新渲染。
    const {
        // count 被标记为渲染相关字段
        count
    } = countingSignal();
    return ......;
}
```

### signal.useEffect

通过 `signal.useEffect` API 可对模型添加行为副作用，当模型实例中的行为方法被调用并造成组件渲染后，会触发副作用回调。

```ts
import {useSignal} from '@airma/react-state';

const counting = (state:number)=>({
    count: state,
    isNegative: state<0,
    increase(){
        return state+1;
    },
    decrease(){
        return state-1;
    }
});

const countingSignal = useSignal(counting, props.defaultCount??0);

const {
    isNegative,
    increase,
    decrease
} = countingSignal();

countingSignal.useEffect(()=>{
    // 当前渲染过程中并未使用 count 字段，因此 count 的变化不会触发组件重新渲染，也不会触发该副作用。
    console.log('countingSignal 所有行为方法的副作用');
});
```

通过使用 `signal.useEffect` 返回的 onChanges 过滤方法可强制加入需要渲染字段，并使副作用只针对这些字段。

```ts
import {useSignal} from '@airma/react-state';

const counting = (state:number)=>({
    count: state,
    isNegative: state<0,
    increase(){
        return state+1;
    },
    decrease(){
        return state-1;
    }
});

const countingSignal = useSignal(counting, props.defaultCount??0);

const {
    isNegative,
    increase,
    decrease
} = countingSignal();

countingSignal.useEffect((instance)=>{
    console.log(`count: ${instance.count}`);
}).onChanges((instance)=>{
    // 强制加入 count 字段到渲染相关字段中，并使副作用只针对 count 字段。
    return [instance.count];
});
```

通过使用 `signal.useEffect` 返回的 onActions 过滤方法可强制 signal 响应被加入的行为方法，并加以渲染，同时只响应这些行为方法引发的渲染。

```ts
import {useSignal} from '@airma/react-state';

const counting = (state:number)=>({
    count: state,
    isNegative: state<0,
    increase(){
        return state+1;
    },
    decrease(){
        return state-1;
    }
});

const countingSignal = useSignal(counting, props.defaultCount??0);

const {
    isNegative,
    increase,
    decrease
} = countingSignal();

countingSignal.useEffect((instance)=>{
    console.log(`count: ${instance.count}`);
}).onActions((instance)=>{
    // 强制 increase 行为方法被调用时渲染组件，并使副作用只响应 increase 行为方法。
    return [instance.increase];
});
```

### signal.useWatch

通过 `signal.useWatch` API 可对模型实例变更进行监听，当模型实例发生任何行为变化时，都会被监听器响应，监听器回调与渲染无关。`signal.useWatch` 的用法与 `signal.useEffect` 相同，如果使用者不希望因渲染漏掉任何行为变化，建议使用该方法。


```ts
import {useSignal} from '@airma/react-state';

const counting = (state:number)=>({
    count: state,
    isNegative: state<0,
    increase(){
        return state+1;
    },
    decrease(){
        return state-1;
    }
});

const countingSignal = useSignal(counting, props.defaultCount??0);

const {
    isNegative,
    increase,
    decrease
} = countingSignal();

countingSignal.useWatch((instance)=>{
    console.log(`count: ${instance.count}`);
}).onActions((instance)=>{
    // 只监听 increase 行为方法引起的变化。
    return [instance.increase];
}).onChanges((instance)=>{
    // 在只监听 increase 行为方法的基础上，继续限定只监听 isNegative 字段的变化。
    // 这是只有在 increase 过程中， isNegative 发生变化时才会触发当前的监听回调。
    return [instance.isNegative];
});
```

### 通过 model 声明函数使用 useSignal

通过 model 声明函数，可以使用 useSignal API 的寄生形态。

```ts
import {model} from '@airma/react-state';

const counting = model((state:number)=>({
    count: state,
    isNegative: state<0,
    increase(){       
        return state+1;
    },
    decrease(){
        return state-1;       
    }
})).createStore();
// 创建一个未初始化的静态全局模型实例库

const Increase = ()=>{
    // increase 行为方法为渲染相关字段，因此会被添加到渲染相关字段中。但根据行为方法恒定不变的特性，该组件不会因 useSignal 发生重新渲染。
    // 注意：useSignal 返回的是一个实例生成函数，因此需要再调用该函数获取实例对象。
    const {increase} = counting.useSignal()();
    return <button onClick={increase}>+</button>;
};

const Decrease = ()=>{
    // decrease 行为方法为渲染相关字段，因此会被添加到渲染相关字段中。但根据行为方法恒定不变的特性，该组件不会因 useSignal 发生重新渲染。
    const {decrease} = counting.useSignal()();
    return <button onClick={decrease}>-</button>;
}

const Count = ()=>{
    const {count} = counting.useSignal()();
    return <span>{count}</span>;
}

const App = ()=>{
    // 使用 useSignal 初始化模型实例库，
    // 在不使用回调函数的情况下，useSignal 永远不会触发当前组件重新渲染。
    counting.useSignal(0);
    return (
        <div>
            <Count/>
            <Increase/>
            <Decrease/>
        </div>
    );
}
```

### useSignal 注意点

* 尽量不要在子组件的 `useLayoutEffect` 中使用父组件 useSignal 返回的 signal 回调函数。因为 useSignal 渲染相关字段的统计算法就是在当前 useSignal 使用组件的 `useLayoutEffect` 阶段终止的，而子组件的 `useLayoutEffect` 通常先于当前组件的 `useLayoutEffect` 执行。这可能导致统计所得的渲染相关字段中混入部分并不希望关联渲染的脏字段。
* 不要在**副作用**或**监听器**的回调函数中添加副作用与监听器。这会导致被入侵副作用或监听器异常。
* 不要在**非 render 阶段**添加副作用与监听器。

下一节[特性](/zh/react-state/feature)