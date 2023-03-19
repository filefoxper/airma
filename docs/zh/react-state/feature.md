# 特性

## 恒定行为方法

一个模型`实例`上的`行为方法`是始终恒定不变的。使用者可以自由将这些`行为方法`用于 memo 组件的 callback 接口，这些恒定的`行为方法`对提升组件渲染效率非常有利。

虽然`实例`中的行为方法是始终恒定不变的，但在被调用时，行为方法会运行最新的`实例原型`方法以确保数据的正确性。所以，恒定的行为方法依然是数据安全的，甚至比普通的 `useState` 更加安全。

让我们继续之前的话题，看看使用`useState`的其他问题。除了容易分散逻辑，与`模型`或 `useReducer` 比，`useState` 还非常容易引入老数据问题（闭包产生的问题）。

```ts
import React,{memo, useState} from 'react';

const App = memo(()=>{

    const [count, setCount] = useState(0);

    // 先点击“延时 + 1”按钮
    const lazyIncrease = ()=>{
        setTimeout(()=>{
            // 这里的 count 来源于 useState，
            // 并在第一次渲染中，形成了闭包常量。
            // 这时闭包常量 count 为 0，
            // 所以 3 秒后运行 的是 0 + 1，
            // 无论 useState 更新与否，
            // 闭包一旦形成，就不能再做常量更新了，
            // 因为更新值只会影响到下次渲染的 lazyIncrease
            setCount(count + 1);
        }, 3000);
    };

    // 然后快速点击“ + 1”按钮
    const increase = ()=>{
        setCount(count + 1);
    };

    return (
        <div>
            <span>{count}</span>
            <button onClick={increase}> + 1</button>
            <button onClick={lazyIncrease}>延时 + 1</button>
        </div>
    );
})
```

上例中，我们先点击`延时 + 1`按钮，然后立即点击` + 1`按钮。3秒后得到的`count`值依然是 1。这是因为 `setTimeout` 中饮用的 `count` 变量是个闭包值，所以即便我们通过 +1 操作，延时更新逻辑中的 `count` 依然是 0，这相当于运行了 `setCount(0 + 1)`。如果我们希望延时操作是在最新的 `count` 上进行的，那么最好的选择是 `setCount(c =>c + 1)`，通过回调的形式进行 `setState` 更新。

让我们再来看看`模型实例`行为方法的表现：

```ts
import React,{memo, useState} from 'react';
import {useModel} from '@airma/react-state';

const App = memo(()=>{

    const {count, increase} = useModel((c = 0)=>{
        count:c,
        increase:()=>c + 1
    });

    // 进行相同操作
    const lazyIncrease = ()=>{
        setTimeout(()=>{
            increase();
        }, 3000);
    };

    return (
        <div>
            <span>{count}</span>
            <button onClick={increase}> + 1</button>
            <button onClick={lazyIncrease}>延时 + 1</button>
        </div>
    );
})
```

我们使用实例方法进行相同操作，因为行为方法调用的是最新原型实例方法，所以3秒后，值为2，符合我们的预期。

## 上下文查找库方式

通过`键`查找库的过程总是沿着 `StoreProvider` 树自近及远的，若最近一层父级 `StoreProvider 库` 没有与之匹配的`链接`，则继续往更高层查找，直到最顶层的 `StoreProvider` 为止。若始终没有匹配，`useSelector` 或 `useModel` 会抛出查找异常错误。

```ts
import React from 'react';
import {
    StoreProvider,
    useSelector
} from '@airma/react-state';
import {globalKeys} from '@/global/models';
import {pageKeys} from './models';

// const globalKeys = {loginUser: Key, config: Key}
// const pageKeys = {condition: Key, todoList: Key}

const Condition = ()=>{
    // useSelector 先到最近的 <StoreProvider keys={pageKeys}> 查找，
    // 查找无果后向更高层 <StoreProvider keys={globalKeys}> 发起查找，
    // 最后使用匹配 <StoreProvider keys={globalKeys}> store
    const userId = useSelector(
        globalKeys.loginUser, 
        instance => instance.id
    );
    // useModel 在最近的 <StoreProvider keys={pageKeys}> store 中匹配成功
    const {
        displayQuery, 
        changeDisplayQuery,
        submit
    } = useModel(pageKeys.condition);
    return ......;
};

const List = ()=>{
    const list = useSelector(
        pageKeys.todoList,
        instance => instance.list
    );
    return ......;
};

const Page = ()=>{
    // 使用 pageKeys 创建当前页面的上下文作用域
    return (
        <StoreProvider keys={pageKeys}>
          <Condition/>
          <List/>
        </StoreProvider>
    );
}

const App = ()=>{
    // 使用 globalKeys 创建应用全局的上下文作用域
    return (
        <StoreProvider keys={globalKeys}>
          <Page/>
        </StoreProvider>
    );
}
```

上例展示了一个简单的`键库`匹配规则，即：由近及远，直到匹配成功或全部匹配失败为止。这条规则非常重要，它保证了我们的多节点上下文系统能够正常工作，同时避免大一统的应用级全局上下文的尴尬局面。

## 高级用法

`@airma/react-state` 中有些冷门，却非常使用的 API，在这里做一些简单介绍。

### 神奇的管道

我们常用于上下文状态管理中的`键`模型函数自带有一个 pipe 管道方法。我们可以使用管道方法将`链接`中的状态同步到一个仅参数状态类型一致的新模型中，从而得到一个状态与`链接`同步的新`实例`。

```ts
import React from 'react';
import { 
    createKey,
    StoreProvider,
    useModel,
    useSelector, 
} from '@airma/react-state';

const counterModel = (count: number = 0)=>({
    count,
    isNegative: count < 0,
    increase: ()=>count + 1,
    decrease: ()=>count - 1
});

// 创 `键`
const counterKey = createKey(counterModel);

const Decrease = ()=>{
    const decrease = useSelector(
        counterKey, 
        i => i.decrease
    );
    return (
        <button onClick={decrease}>-</button>
    );
}

const Increase = ()=>{
    const increase = useSelector(
        counterKey, 
        i => i.increase
    );
    return (
        <button onClick={increase}>+</button>
    )
}

const Reset = ()=>{
    const {
        reset
    } = useModel(
        // 使用管道将链接的状态同步到指定模型
        counterKey.pipe((c: number)=>({
            reset(){
                return 0;
            }
        }))
    )
    return (
        <button onClick={reset}>reset</button>
    );
}

const Counter = ()=>{
    const count = useSelector(
        counterKey, 
        i=>i.count
    );
    return (
        <div>
          <Decrease />
          <span>{count}</span>
          <Increase />
          <Reset />
        </div>
    );
}

const App = ()=>{
    return (
        <StoreProvider keys={counterKey}>
          <Counter />
        </StoreProvider>
    )
}
```

### 链接独立

试想，我们在一个公共组件中使用了 `useModel(modelKey)` 的方式去匹配`库链接`，这导致了我们的公共组件很难在`库`外使用，那有没有方法可以让我们的`useModel`在找不到匹配库的情况下创建一个本地`链接`使用呢？

有，那就是`链接独立`配置项：`autoLink`。使用该配置项可以让`useModel(modelKey)` 在无法查找到匹配`库`时，利用`键`模型本身就是模型函数的原理，创建一个本地`链接`。

`autoLink` 配置项只对使用`键`模型的`useModel`起作用，另外为了方便建立本地链接，使用 `autoLink` 的 `useModel` 必须提供默认状态值：`useModel(modelKey, defaultState, { autoLink: true })`，该默认状态只在无法匹配`库`，必须使用`本地链接`时有效，它无法参与上下文状态库`链接`的运行时初始化功能。 

## Typescript 支持

`@airma/react-state` 拥有一套完整的 `typescript` 类型检查声明。使用 `typescript` 可以最大限度发挥该工具的优势。如：

```ts
import { useModel } from '@airma/react-state';

const counter = (count: number)=>{
    return {
        count,
        increase: ()=>count + 1,
        decrease: ()=>count - 1,
        reset: ()=>'0'
    }
}

useModel(counter, 0);
// TS Error. 
// reset 方法返回类型不符合 counter 入参类型
```

`@airma/react-state` 规定行为方法返回类型必须与模型参数类型保持一致。

接下来，我们可以进入最终环节 [API](/zh/react-state/api?id=api) 部分了。