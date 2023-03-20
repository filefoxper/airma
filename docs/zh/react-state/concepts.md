# 概念

为了更加轻松愉快地使用 `@airma/react-state` ，我们将在本章介绍一些必要的概念。

1. [模型](/zh/react-state/concepts?id=模型)
2. [实例](/zh/react-state/concepts?id=实例)
3. [刷新](/zh/react-state/concepts?id=刷新)
4. [链接](/zh/react-state/concepts?id=链接)

## 模型

对 `@airma/react-state` 来说模型即为函数。该函数可接收一个状态参数，并返回一个由渲染数据和`行为方法`组成的对象。我们称函数的入参为`状态`，其返回对象为`原型`。

在`原型`对象上可挂载渲染数据和`行为方法`。当 `原型` 被转化为 [实例](/zh/react-state/concepts?id=实例) 后，渲染数据可直接参与组件的渲染或副作用工作，`行为方法` 则可用于更新状态和渲染数据。

这是一个简单的模型结构：

```ts
// 模型函数 model
// state 入参状态
const model = <T>(state: T) =>({
    // 渲染数据
    data1: any,
    data2: any,
    ......,
    // 行为方法
    method1():T{
        return nextParam1;
    },
    method2():T{
        return nextParam2;
    },
    ......
});
```

`@airma/react-state` 对模型的 `行为方法` 进行了 `typescript` 类型约制，规定了 `原型` 对象中的所有方法都是 `行为方法`，这些方法的返回值类型必须与入参状态类型保持一致。这样，通过 `实例` 对象调用 `行为方法` 才能生成符合当前模型的新 `状态`。

例子:

1. 计数器模型：

```ts
const counter = (count:number)=>{
    return {
        // 当前的计数值
        count,
        // 判断当前计数值是否为负数
        isNegative: count<0,
        // 为当前计数值加 1 的行为方法
        increase(){
            return count+1;
        },
        // 为当前计数值减 1 的行为方法
        decrease(){
            return count-1;
        }
    }; // 返回普通对象作为 `原型`
}
```

2. boolean 状态的 toggle 操作模型:

```ts
type ToggleInstance = [boolean, ()=>boolean];

// 可以定义一个元组作为 `原型`。
const toggler = (visible:boolean):ToggleInstance =>[
    // 是否可见
    visible, 
    // 每次调用行为方法都切换为当前的反状态
    ()=>!visible
]; // 返回元组类型的 `原型`
```


## 实例

通过 `useModel` API 可以将模型函数返回的 `原型` 对象转换为一个 `实例` 对象，从技术的角度上来说 `实例` 就是一个 `Proxy 代理` 对象，只有通过调用该 `代理` 上相印的 `行为方法` 才能更新 `state` 状态，[刷新](/zh/react-state/concepts?id=刷新) `实例` 对象。

### 稳定实例

为了符合 `react` 函数式编程的稳定闭包理念，通过 `useModel` API 返回的 `实例` 对象是一个稳定的 `实例` 对象，即在一次渲染的闭包作用域的任意内部函数调用中， `实例` 对象的属性值都是恒定不变的。

例子:

```ts
import {useModel} from '@airma/react-state';

// 计数器模型
const counter = (count:number)=>{
    return {
        count,
        isNegative: count<0,
        increase(){
            return count+1;
        },
        decrease(){
            return count-1;
        }
    }
}

// instance 是一个稳定实例
const instance = useModel(counter, 0);

useEffect(()=>{
    // 我们在组件加载时调用 increase 行为方法，
    // 让 `instance.count` 的原型值加 1。
    // 这引发了组件渲染，也引发了实例刷新。
    instance.increase();
    // 在 1 秒后我们通过 instance 获取 count 值
    setTimeout(()=>{
        // 也许你会认为这时 instance.count 值为 1，
        // 但这种判断忽略了渲染的闭包特性，
        // instance 受本次渲染闭包影响依然是一个老值，
        // 所以 instance.count 的值依然是 0
        console.log(instance.count);
    },1000);
},[]);
```

稳定闭包理念有利于状态值的推断，让你的渲染过程更加稳固，让状态更新更加迭代化，也更符合 `React.Strict` 严格模式的要求。

但如果没有很好掌握这种模式，在使用 React hook 系统的过程中，往往可能给我们的代码埋下一些重大隐患，如上例中，我们在副作用回调中得到了一个与预期不同的值，为了解决这个问题，`@airma/react-state` 推出了非稳定实例这一特殊对象。

### 非稳定实例

不同于 `稳定实例` 对象，`非稳定实例` 的属性值在外部使用的过程中是随行为方法调用即时生效的。它并不受稳定闭包理念的制约，在我们需要的时候，我们随时可以直接从 `实例` 对象中获取最新的属性值。

通过开启 `useModel` API 的配置属性 `realtimeInstance`，或对一个 `稳定实例` 使用 `useRealtimeInstance` API，均可得到一个 `非稳定实例`。

例子:

```ts
import {useModel, useRealtimeInstance} from '@airma/react-state';

const counter = (count:number)=>{
    return {
        count,
        isNegative: count<0,
        increase(){
            return count+1;
        },
        decrease(){
            return count-1;
        }
    }
}

// 稳定实例 instance
const instance = useModel(counter, 0);

// 对 instance 使用 useRealtimeInstance 获取非稳定实例
const realtimeInstanceFromStable = useRealtimeInstance(instance);

// 开启 realtimeInstance 获取非稳定实例
const realtimeInstance = useModel(counter, 0, {realtimeInstance:true});

useEffect(()=>{
    // 分别调用稳定实例和非稳定实例的行为方法，
    // 使 instance.count 原型值变成 1.
    instance.increase();
    realtimeInstance.increase();
    // 1 秒后我们分别从多个实例中获取 count 值。
    setTimeout(()=>{
        // 稳定实例因为闭包影响还是老样子，
        // 值为 0
        console.log(instance.count);
        // 从稳定实例中获取的非稳定实例的 count 值为 1，
        // 即最新值。
        console.log(realtimeInstanceFromStable.count);
        // 通过配置获取的非稳定实例 count 也为 1，
        // 最新值。
        console.log(realtimeInstance.count);
    },1000);
},[]);
```

非稳定实例的缺陷在于它不符合稳定闭包理念，可能导致在 `React.Strict` 严格模式的模型状态下（如 useEffect 依赖中）具有不稳定，但它实时获取属性值的能力非常有用。所以，这里推荐在与渲染及副作用依赖无关的回调函数中使用它，这可以为你省去大量闭包的麻烦。

无论渲染实例是否稳定，在[刷新](/zh/react-state/concepts?id=刷新)过程中，模型函数内的状态值永远是可靠的，最新的。

## 刷新

`刷新`是指`行为方法`调用后，其返回值被 `useModel` API 作为新状态参数用于再次调用模型函数，并更新 `实例` 的自动化过程。

例子：

```ts
const counter = (count:number)=>{
    // 使用 console.log 作为特性探针的经历，
    // 大部分人都有过吧。
    console.log('refresh state...', count);
    return {
        count,
        isNegative: count<0,
        increase(){
            return count+1;
        },
        decrease(){
            return count-1;
        }
    }
}

const {count, increase} = useModel(counter, 0);
......
const clickEventHandler = ()=>{
    increase(); // 点击调用 increase 行为方法
};
```

在 `useModel` 加载，以及点击调用 increase 的过程中，我们的探针 `console.log` 均为我们发来了关键数据。

```
// mount
refresh state... 0

// increase
refresh state... 1
```

通过调用来自 `实例` 的 `行为方法` 可触发实例的 `刷新` 过程。这里记录了 `counter` 模型通过 `increase` 触发刷新的全过程。

```
[人工] increase 返回 count + 1，记为 next；
[自动] 调用 counter(next) 生成新原型：{count: 1, isNegative: false ...}；
[自动] 使用 useState 将新原型更新为新实例 {count: 1, isNegative: false ...}；
```
通过以上类命令式的打印过程，我们可以更清楚的了解一次刷新过程，到底发生了什么。

## 链接

链接是 `@airma/react-state` 的基本工作单元对象，`useModel` API 就是通过链接对象来存储`模型`、`实例`、`状态`等信息，并协调`实例`的刷新，渲染等自动化过程。

在了解了 `@airma/react-state` 的概念和工作原理后，让我们进入最让人振奋的 [引导](/zh/react-state/guides.md) 章节，看看关于该工具的更高级功能（跨组件状态同步），以及如何在实际工作中用好它。
