# @airma

`@airma` 是一款用于辅助 react `>=16.8.0` 版本的 hooks 工具库，它包含了多样化的简易状态管理功能、请求收发工具。

* [@airma/react-state](/zh/react-state/index.md)
* [@airma/react-effect](/zh/react-effect/index.md)
* [@airma/react-hooks](/zh/react-hooks/index.md)

<h2> @airma/react-state </h2>

`@airma/react-state` 是一款基于 object 模型的类 redux 状态管理工具，它抛弃了传统 reducer 系统的 dispatch 事件分发机制，采取了类似面向对象的方法调用机制来维护模型状态值。

关于模型的使用示例：

```tsx
import React from 'react';
import {render} from 'react-dom';
import {useModel} from '@airma/react-state';

const App = ()=>{

    // 使用 useModel 创建一个模型实例对象。
    // 函数模型入参 count 为模型状态。
    const instance = useModel((count:number)=>({
        count,
        isNegative: count<0,
        // 用于修改状态的模型实例方法原型。
        // 方法调用返回值即为状态更迭值。
        increase:()=> count + 1,
        decrease:()=> count - 1
    }),0); // 默认状态 0

    const {
        count, 
        isNegative,
        // 通过调用来自实例的方法来实现状态更迭和实例刷新
        decrease, 
        increase
    } = instance;

    return (
        <div>
            <div>计数器模型</div>
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

上例演示了如何通过调用来自模型实例的方法来实现状态更迭与实例刷新。这是一种函数式编程与面向对象编程的结合模式，在继承了 reducer 系统中返回值即新状态的安全机制的同时，实现了更简单更模型化的方法调用系统。

如果你对这个工具感兴趣，并期望评估是否可以在项目中使用它，可以进入[相关文档](/zh/react-state/index.md)参考关于跨组建状态同步、受控模型实例等知识，进行更全面的了解。


<h2>@airma/react-effect</h2>

`@airma/react-effect` 是一款用于管理 react 副作用状态的工具。通常我们所讨论的 react 副作用包括异步请求、时序工作 (setTimeout、setInterval) 等与 react 数据更新无直接关联的操作。目前该工具主要涉及了副作用中的异步请求功能。

例子：

```ts
import React from 'react';
import {useQuery} from '@airma/react-effect';
import {queryUsers} from './service';
import type {User} from './type';

// function queryUsers(query: {name: string}):Promise<User[]>

const App = ()=>{

    // 实时输入的查询条件
    const [name, setName] = useState('');

    // 有效提交的查询条件，只有该条件改变，才开始查询
    const [query, setQuery] = useState({name});

    const [
        {
            // 查询返回数据 User[]，默认为 undefined
            data, 
            // 是否正在查询 boolean
            isFetching, 
            // 是否有过至少一次成功的查询 boolean
            loaded,
            // 错误信息
            error,
            // 是否有错误
            isError
        }
    ] = useQuery(
        // 查询函数，需要返回一个 Promise 对象
        queryUsers, 
        // 查询函数的参数，
        // 当 useQuery 首次被加载或查询参数发生变更时，开始查询
        [query]
    );

    const handleNameChange = (e:React.ChangeEvent<HTMLInputElement>)=>{
        setName(e.target.value);
    };

    const handleSubmit = ()=>{
        // 通过提交按钮改变 query 查询条件，引起查询
        setQuery({name});
    }

    return (
        <div>
          <div>
            <input 
              type="text" 
              value={name} 
              onChange={handleNameChange}
            />
            <button onClick={handleSubmit}>提交</button>
          </div>
          <div>
            {
                loaded?
                  data.map((user)=>
                    <div key={user.id}>
                      <span>{user.name}</span>
                      <span>{user.username}</span>
                      <span>{user.age}</span>
                    </div>
                  ):null
            }
          </div>
        </div>
    );
};
```

如上所示一个本地查询的状态管理非常容易，如果希望了解更多用法和跨组建状态同步功能可参阅[相关文档](/zh/react-effect/index)。

<h2>@airma/react-hooks</h2>

`@airma/react-hooks` 是 `@airma/react-state` 与 `@airma/react-effect` 的合集，它能让使用者更方便的操作两个库的API。[相关文档](/zh/react-hooks/index)
