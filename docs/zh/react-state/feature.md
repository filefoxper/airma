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