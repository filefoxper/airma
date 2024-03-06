# 特性

## 恒定的行为方法

useModel 返回的**模型实例**是对模型返回值的**代理对象**，在代理过程中，可通过对象直接获取的方法会被替换成另一个**恒定**且与原方法接口相同的新方法（与原方法入参一致，返回值相同的方法）。这个代理对象上的新方法被称为**代理行为方法**，代理行为方法运行时会调用最新模型返回值中对应的原方法，以保证参与行为的数据状态是最新的。

```ts
import React,{memo, useState} from 'react';
import {useModel} from '@airma/react-state';

const App = memo(()=>{

    const {count, increase} = useModel((c = 0)=>{
        count:c,
        increase:()=>c + 1
    });

    const lazyIncrease = ()=>{
        setTimeout(()=>{
            // 在 3 秒延时调用过程中，
            // increase 可能已被调用多次，
            // 由于 increase 每次调用使用的都是最新内部状态，
            // 因此不会出现由于闭包导致的旧状态参与操作问题
            increase();
        }, 3000);
    };

    return (
        <div>
            <span>{count}</span>
            <button onClick={increase}>increase</button>
            <button onClick={lazyIncrease}>lazy increase</button>
        </div>
    );
})
```

## 无卸载后状态变更泄漏风险

当 useModel 或 useSelector 所在的组件被卸载时，订阅接口会被取消，因此不会出现类似 useState 或 useReducer 继续更新本地状态的现象，也就不存在状态变更泄漏风险了。

下一节[API](/zh/react-state/api)