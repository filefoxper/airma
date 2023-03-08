# @airma

`@airma` 是一个基于 react hook 系统的工具库，在使用 `@airma` 工具库前，请确保您的 `react` 及 `react-dom` 版本 `>=16.8.0`。

* [@airma/react-state](/zh/react-state/index.md)
* [@airma/react-effect](/zh/react-effect/index.md)

<h2> @airma/react-state </h2>

`@airma/react-state` 是一个基于 function 模型的 react 状态管理工具。一个 function 模型需要提供一个 state 入参，并返回一个包含修改 state 状态方法和渲染数据的任意对象。 

```ts
import React from 'react';
import {render} from 'react-dom';
import {useModel} from '@airma/react-state';

const App = ()=>{

    // 使用 useModel 创建模型实例
    // 这里的模型参数 count 就是 state 状态
    const instance = useModel((count:number)=>({
        count,
        // 所有返回字段可自定义，并都参与渲染
        isNegative: count<0,
        // 所有方法根据当前 state 和入参生成下一个 state
        increase:()=> count + 1,
        decrease:()=> count - 1
    }),0); //  设置默认 state 为 0

    const {
        // 渲染数据
        count, 
        isNegative,
        // 调用实例方法后， 
        // useModel 会使用方法返回值重新调用模型 function，
        // 并刷新当前的模型实例，从而达成重新渲染的效果
        decrease, 
        increase
    } = instance;

    return (
        <div>
            <div>计数器</div>
            <button onClick={decrease}>-</button>
            <span style={isNegative?{color:'red'}:undefined}>
                {count}
            </span>
            <button onClick={increase}>+</button>
        </div>
    );
}

render(<App/>, document.getElementById('root'));
```

以上代码显示了如何使用 `@airma/react-state` 来维护本地私有数据，如果想要了解更多用法如：数据共享、受控模型、模型组合等内容，请移步至[详细文档](/zh/react-state/index.md)部分。

<h2>@airma/react-effect</h2>

 `@airma/react-effect` 是一款基于 `useEffect` 和 `@airma/react-state` 的异步副作用状态管理工具，可用于弥补 `@airma/react-state` 关于异步处理能力不足的弊端。

使用 useQuery 进行查询操作，我们需要为其提供一个返回 promise 对象的查询 function，以及 function 参数。通过监听参数变化，useQuery 可以查询并维护结果数据状态。注：`useQuery 在 mount 加载状态下也会进行请求`。

```ts
import React from 'react';
import {useModel} from '@airma/react-state';
import {useQuery} from '@airma/react-effect';
import {counter} from './model';

// 提供一个返回 promise 对象的 function
const query = (data:number):Promise<number>=> {
    if ( data < 0 ) {
        return Promise.reject('error');
    }
    return Promise.resolve(data);
};

const App = ()=>{
    const { 
        count, 
        increase, 
        decrease 
    } = useModel(counter, 0);
    const [ 
        // data 为 query 返回 promise 的 resolve 值，
        // 默认为 undefined。
        // isError 为 boolean 值，反应当前查询是否有错。
        // error 为 query 返回 promise 的 reject 错误信息。
        // isFetching 为当前是否正在获取数据的状态。
        { data = count, isError, error, isFetching }, 

        // trigger 为手动触发方法，
        // trigger 的参数来源于 [count]，所以是个无参函数。
        // trigger 返回一个 Promise<{ data, error, isFetching, ... }>
        // 对象 
        trigger 

        // count 为 query 参数，
        // useQuery 通过监听 count 的改变触发 query。
        // 相当于 useEffect(()=>{query(count)}, [count])
    ] = useQuery(query, [count]); 

    return (
        <div>
            <div>计数器</div>
            <div>{error}</div>
            <button onClick={decrease}>-</button>
            <span style={isError? {color:'red'}: undefined}>
                {isFetching? '正在查询...': data}
            </span>
            <button onClick={increase}>+</button>
        </div>
    );
}

render(<App/>, document.getElementById('root'));
```

使用 useMutation 进行数据修改（保存、删除）。我们需要为其提供一个返回 promise 对象的查询 function，以及 function 参数。通过调用 trigger 的方式手动触发操作。

```ts
import React from 'react';
import {useModel} from '@airma/react-state';
import {useMutation} from '@airma/react-effect';
import {counter} from './model';

// 提供一个返回 promise 对象的 function
const save = (data:number):Promise<number>=> {
    if ( data < 0 ) {
        return Promise.reject('error');
    }
    return Promise.resolve(data);
};

const App = ()=>{
    const { 
        count, 
        increase, 
        decrease 
    } = useModel(counter, 0);
    const [
        { data = count, isError, error, isFetching }, 

        // trigger 为手动触发方法，
        // trigger 的参数来源于 [count]，所以是个无参函数。
        // trigger 返回一个 Promise<{ data, error, isFetching, ... }>
        // 对象 
        trigger 

        // useMutation 需要通过调用 trigger 触发修改操作
    ] = useMutation(save, [count]); 

    return (
        <div>
            <div>计数器</div>
            <div>{error}</div>
            <button onClick={decrease}>-</button>
            <span style={isError? {color:'red'}: undefined}>
                {count} 至 {data}
            </span>
            <button onClick={increase}>+</button>
            <button onClick={trigger}>提交</button>
        </div>
    );
}

render(<App/>, document.getElementById('root'));
```

以上两段代码显示了如何使用 useQuery 和 useMutation 配合 useModel 进行异步操作，`@airma/react-effect` 还具备更多的能力，请移步至[详细文档](/zh/react-effect/index.md)深入了解。
