# 引导

`@airma/react-state` 的基础 API [useModel](/zh/react-state/api?id=usemodel)、[useSelector](/zh/react-state/api?id=useselector)、[provide](/zh/react-state/api?id=provide)、[model](/zh/react-state/api?id=model) 提供了一整套完善的状态管理方案。

## useModel

API useModel 可用于管理本地模型状态，也可用于连接管理 React.Context 动态库中的模型状态。

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

可以把它当作简化版的 useReducer 来使用。

### React.Context 动态库管理

useModel 在动态库状态管理中的使用参数与本地状态管理有所不同。

1. 本地管理中的模型函数，需要换成[键](/zh/react-state/concepts?id=键)。
2. 如果使用的键有预设默认状态，或者已经有使用了相同键的 useModel 初始化了默认状态，则可以不提供默认状态。

```ts
// 已预设过默认状态
const storeInstance = useModel(modelKey);
// 在 render 运行时初始化默认状态
const storeInstance = useModel(modelKey, defaultState);
```

[更多例子](/zh/react-state/concepts?id=键)

## useSelector

useSelector API 可用于筛选来自库中模型实例的字段，以减少不必要的渲染。

```ts
const xxx = useSelector(modelKey, (instance)=>instance.xxx);
```

当选取的字段为复杂对象时，可为 useSelector 提供第三个参数 equalFn 判断当前选取值是否与变更前的选取值相等，若返回 true，即相等，则忽略本次渲染。

```ts
import {pick} from 'lodash';
import {useSelector, shallowEqual} from '@airma/react-state';

const xxx = useSelector(modelKey, (instance)=>pick(instance,['xxx']), shallowEqual);
```

[更多例子](/zh/react-state/concepts?id=键)

## createKey 与 provide

API [provide](/zh/react-state/api?id=provide) 是一个用于提供 [Provider](/zh/react-state/api?id=provider) 组件包装的高阶组件。

```ts
/**
 * @params modelKeys 键或键的集合对象（对象、数组均可
 * @params Component 需要使用 store 的组件
 * 
 * @returns WrappedComponent 被 Provider 组件包囊后的组件
 **/
const WrappedComponent = provide(modelKeys)(Component)
```

API [createKey](/zh/react-state/api?id=createkey) 用于为模型生成[键](/zh/react-state/concepts?id=键)，键可用于生成库，同时作为连接库的通道用于 useModel、useSelector。

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

想要同时使用多个不同的库？

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
})
```

想要使用 Provider 组件风格？

```ts
import {myModel} from './model';
import {createKey, Provider} from '@airma/react-state';

const modelKey = createKey(myModel)

const Component = function Component(){
    return (
        <Provider keys={modelKey}>
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
    // 在 const Component = provide(key) 中找到 key 的库
    useModel(key);
    useModel(key2, defaultState);
    return ......;
});

const Component = provide(key)(function Component(){
    useModel(key);
    return <Child/>;
});
```

想要同模型，不同库？

```ts
import {myModel} from './model';
import {createKey, provide} from '@airma/react-state';

const key = createKey(myModel);

const key2 = createKey(myModel);

// key 和 key2 有相同的模型，却是两个不同的键，
// 因此它们会生成两个不同的库
const keys = {key, key2};

const Component = provide(keys)(function Component(){
    return ......;
});
```

## useControlledModel

关键数据状态完全通过 props 进行传递和回传的 React 组件被称为受控组件。受控组件具有非常良好的复用性，状态控制权交由使用者掌控。在受控组件中可使用 [useControlledModel](/zh/react-state/api?id=usecontrolledmodel) 适配通用模型来完成复杂的受控交互任务。

useControlledModel 用于管理模型的受控状态。

```ts
/**
 * @params modelFn 模型函数
 * @params value 受控状态
 * @params onChange 受控状态变更回调
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
        // set the controlled state from props 
        checked, 
        // set the controlled onChange from props
        onChange
    );

    return ......;
}
```

受控、非受控自支持组件中使用模型

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
    const instance = useModel(
        toggleModel, 
        checked ?? false
    );
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

API [model](/zh/react-state/api?id=model) 整合了常用模型 API，提供了一套流调用的使用方式。

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
import {model} from '@airma/react-state';

const toggleModel = model((selected:boolean)=>([
    selected,
    ()=>!selected
] as const));

// 创建 React.Context 动态库
const toggleStore = toggleModel.createStore(false);

// 复制出全局静态库，
// 全局静态库不需要 Provider
const toggleGlobalStore = toggleStore.asGlobal();
......
toggleModel.useModel(false);
toggleModel.useControlledModel(props.checked, props.onChange);
......
toggleStore.provideTo(function Component(){
    const [, toggle] = toggleStore.useModel();
    const selected = toggleStore.useSelector(([s])=>s);
    const selectedInGlobal = toggleGlobalStore.useSelector(([s])=>s);
    return ......;
});
......
function Comp(){
    toggleGlobalStore.useModel();
    return ......;
}
```

想要整合多个库？

```ts
import {model} from '@airma/react-state';

const toggleStore = model((selected:boolean)=>([
    selected,
    ()=>!selected
] as const)).createStore(false);

const countStore = model((count:number)=>([
    count,
    ()=>count+1,
    ()=>count-1
] as const)).createStore(0);

......
// 通过 store.with 可整合多个库
toggleStore.with(countStore,...).provideTo(
    function Component(){
        const [, toggle] = toggleStore.useModel();
        const selected = toggleStore.useSelector(([s])=>s);
        const [count, increase, decrease] = countStore.useModel();
        return ......;
    }
);
......
```

## ConfigProvider

由于 `@airma/react-state` 采用的是订阅更新模式，库状态变更会通知每个使用点进行状态更新（setState），在 react<18.0.0 版本中需要 unstable_batchedUpdates 进行更新效率优化，而 `@airma/react-state` 并没有依赖 `react-dom` 包，因此需要通过配置的方式引入 unstable_batchedUpdates。

```ts
import { unstable_batchedUpdates } from 'react-dom';
import { ConfigProvider } from '@airma/react-state';

const config = {batchUpdate: unstable_batchedUpdates};

<ConfigProvider value={config}>
......
</ConfigProvider>
```

下一节[特性](/zh/react-state/feature)