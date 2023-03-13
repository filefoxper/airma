# @airma

`@airma` 是一款用于辅助 react `>=16.8.0` 版本的 hooks 工具库，它包含了多样化的简易状态管理功能、请求收发工具。

* [@airma/react-state](/zh/react-state/index.md)
* [@airma/restful](/zh/restful/index.md)
* [@airma/react-effect](/zh/react-effect/index.md)

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

如果你对这个工具感兴趣，并期望评估是否可以在项目中使用它，可以进入[相关文档](/zh/react-state/index.md)参考关于局部状态共享、受控模型实例等知识，进行更全面的了解。

<h2>@airma/restful</h2>

`@airma/restful` 是一款简单的 rest 风格的请求收发工具，与 react 系统关系不大。

例子：

```ts
// utils/client.ts
import {client} from '@airma/restful';

const {rest, setConfig} = client((config)=>{
    const {headers} = config;
    const newHeaders = {
        ...headers,
        'TOKEN':'xxx'
    };
    return {
        ...config, 
        headers: newHeaders
    };
});

export {
    rest,
    setConfig
}
```

创建一个 client 公共根文件作为系统基本请求配置，并导出 rest 和 setConfig 方法。

```ts
// requests/user.ts
import {rest} from '@/utils/client';
import type {User} from './type';

const http = rest('/api/user');

export default {
    getCurrentUser(): Promise<User>{
        // GET /api/user/current
        return http.path('/current').get<User>();
    }
    getUserById(id: number): Promise<User>{
        // GET /api/user?id=${id}
        return http.setParams({id}).get<User>();
    }
    saveUser(user: Omit<User,'id'>): Promise<void>{
        // POST /api/user (payload: user)
        return http.setBody(user).post<void>();
    },
    removeUser(id: number): Promise<void>{
        // DELETE /api/user?id=${id}
        return http.setParams({id}).delete<number>();
    },
    updateUser(user: Omit<User,'id'>, id: number): Promise<void>{
        // PUT /api/user?id=${id} (payload: user)
        return http.setBody(user).setParams({id}).put<void>();
    },
};
```

相信上述例子非常容易理解，如果希望了解更多关于 `@airma/restful`，请移步至[相关文档](/zh/restful/index.md)。


<h2>@airma/react-effect</h2>
