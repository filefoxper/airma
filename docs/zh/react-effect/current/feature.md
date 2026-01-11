# 特性

## 无 zombie child 问题

异步响应可能发生在使用组件卸载之后，如果这时进行状态更新，很容易带来 setState 内存泄漏问题，俗称 [僵尸娃问题 (zombie-children)](https://react-redux.js.org/api/hooks#stale-props-and-zombie-children) 。**@airma/react-effect** 检查了这种情况，并避免了 zombie-children 问题的发生。

## 同键（库）会话无法同时运行

当多个使用相同会话键（库）的会话（useQuery/useMutation）同时被触发时，只有一个会话被允许执行。其他会话只能订阅状态更新。这一特性在开发无参（或定参）查询公共组件时非常有用。

```ts
import {session} from '@airma/react-effect';

const fetchUserRelationShips = async (): Promise<RelationShip[]> =>{
    return ......
};

const queryStore = session(fetchUserRelationShips, 'query').createStore();

// 公共组件
export const RelationShipSelector = (props: Props)=>{
    const [
        {
            data,
            isFetching
        }
        // 公共键库
    ] = queryStore.useQuery({
        variables: [],
        defaultData: []
    });
    return (
        <Selector {...props} disabled={isFetching}>
            {
                data.map((r)=>
                    <Option value={r.id} key={r.id}>
                        {r.name}
                    </Option>
                )
            }
        </Selector>
    )
};

const App = ()=>{
    // 多个 RelationShipSelector 组件同时通过加载触发会话执行。
    // 只有一个 queryStore.useQuery 会被允许执行。
    return (
        <Page>
            <RelationShipSelector {...props}/>
            ......
            <div>
                <RelationShipSelector {...props}/>
            </div>
            ......
        </Page>
    );
}
```

## Provider 系统与 @airma/react-state 互通

**@airma/react-effect** 完全使用了 **@airma/react-state** 的 [Provider 系统](/zh/react-state/guides?id=createkey-与-provide)，所以 provide，Provider API 所是完全通用的。而 API createSessionKey 创建的会话[键](concepts?id=键)实际上就是一种特殊的模型[键](/zh/react-state/concepts?id=键)，API createSessionStore 创建的会话[库](concepts?id=库)也时一种特殊的模型[库](/zh/react-state/concepts?id=库)。

```ts
import {provide, createKey} from '@airma/react-state';
import {createSessionKey} from '@airma/react-effect';

// 模型键
const countKey = createKey((count: number)=>{
    return {
        count,
        increase:()=>count+1,
        decrease:()=>count-1
    }
}, 0);

// 会话键
const querySessionKey = createSessionKey(fetchUsers, 'query');

// 模型键和会话键可整合在一起使用
// provide API 互通，可从两个工具库中任选
const Component = provide(countKey, querySessionKey).to(()=>{
    return ......;
});
```

如果同时使用两个工具包，部分通用API容易引起引用不适，可使用 [@airma/react-hooks](/zh/react-hooks/index) 包进行整合引用。

下一节[API](api)