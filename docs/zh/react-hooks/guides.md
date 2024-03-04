# 引导

此文用于说明 [@airma/react-effect](/zh/react-effect/index) 与 [@airma/react-state](/zh/react-state/index) 的推荐使用方式，尽可能的消除使用难点。作为 @airma 系列两个基础库，可分开使用，也可以通过 @airma/react-hooks 集成使用。

## airma/react-state

用于管理模型状态。所谓的模型，可以理解为动态交互的描述规范，它包含了**状态**和**行为**两个重要概念。模型的主要作用是将交互从渲染中剥离出来，这意味着模型可以复用加工，并在雷同的业务中表现出相同的规范交互操作准则。所以模型可以是简单的 setState，但绝不是简单的 setState。

### 如何建立模型

如果觉得直接理解模型很难，可以想象一下在一个组件中需要做哪些操作？这些操作之间有哪些互相制约，就可以一步步理清楚了。

模型的推荐写法：

1. 了解组件的交互需求。
2. 抽象组件需要的交互方法，即行为方法，要求行为方法尽可能统一，即一次调用一个行为方法。抽象过程中并不需要详细实现。
3. 在抽象行为方法后，即可设计当前交互涉及的渲染状态（注意渲染状态可以是变量状态，也可以是变量状态的加工值），供组件渲染使用。
4. 根据渲染状态和交互方法基本上可以倒推出模型所需的变量状态，即 state。
5. 预测性推导当前行为方法调用后的状态，即每个行为会导致什么样的后果。只要描述出需变更的状态字段即可。
6. 通过行为方法的入参和预测结果，实现行为方法的状态变更处理。

需求案例：建立一个可搜索，可勾选的用户列表。即使用输入框输入用户信息过滤用户列表，同时可勾选用户，并使用选中的用户 id 集合作后续操作。

```ts
// type.ts
export type User = {
    id: string;
    name: string;
}
```

使用上述推荐步骤设计模型：

**1. 了解交互需求**
   
```
需要一个输入行为，该行为可过滤出符合条件的用户；需要一个勾选行为，该行为可勾选出用户 id；为了方便勾选操作，还需要一个全选全不选的操作行为；原始用户数据来源未知，因此还需要一个加载原始用户数据的行为。
```

**2. 抽象行为方法**

```ts
// model.ts
import type {User} from './type';

// 变量状态类型
type UserSelectState = {
    // 涉及字段后续设计
}

export function userSelect(state: UserSelectState){
    return {
        // 输入关键词，用于过滤用户
        inputKeyword(keyword: string){
            return state;
        },
        // 勾选用户操作，如已选中则去除，如为选中则选上。
        // 即反选操作
        toggleSelect(id: string){
            return state;
        },
        // 全选/全不选操作
        toggleSelectAll(){
            return state;
        },
        // 加载未知来源的原始用户列表数据
        loadUsers(users: User[]){
            return state;
        }
    }
}
```

**3. 设计渲染状态**

```ts
// model.ts
import type {User} from './type';

// 变量状态类型
type UserSelectState = {
    // 涉及字段后续设计
}

export function userSelect(state: UserSelectState){
    return {
        // 输入框渲染使用
        keyword: '',
        // 列表显示的过滤后用户数据
        displayUsers: [],
        // 当前选中的用户 id 集合，为了方便外部使用，设计成 set。
        // 外部渲染使用如： selectedUserIdSet.has(id) 即可。
        selectedUserIdSet: new Set<string>(),
        // 全选勾选框状态：'none' | 'some' | 'all'
        allSelectedStatus: 'none',
        inputKeyword(keyword: string){
            return state;
        },
        toggleSelect(id: string){
            return state;
        },
        toggleSelectAll(){
            return state;
        },
        loadUsers(users: User[]){
            return state;
        }
    }
}
```

**4. 倒推变量状态**

```ts
// model.ts
import type {User} from './type';

// 变量状态类型
// 变量状态为外部提供数据的累积值
type UserSelectState = {
    // 输入的关键词，用于过滤出 displayUsers 渲染状态。
    keyword: string;
    // 原始用户列表数据，作为过滤出 displayUsers 渲染状态的基础数据。
    users: User[];
    // 用户 id 的累计状态值，用于生成 selectedUserIdSet 渲染状态。
    // 注意：单个 id 难以累积，所以选择数组的形式作累积存储
    selectedUserIds: string[];
    // allSelectedStatus 为什么不作为变量状态字段？
    // 与 displayUsers 一样，该字段可以通过 selectedUserIds 和 displayUsers 推测出来，
    // 故不需要设计该变量状态字段。
    // allSelectedStatus ？
}

export function userSelect(state: UserSelectState){
    return {
        keyword: '',
        displayUsers: [],
        selectedUserIdSet: new Set<string>(),
        allSelectedStatus: 'none',
        inputKeyword(keyword: string){
            return state;
        },
        toggleSelect(id: string){
            return state;
        },
        toggleSelectAll(){
            return state;
        },
        loadUsers(users: User[]){
            return state;
        }
    }
}
```

**5. 预测性推导当前行为方法调用后的状态**

```ts
// model.ts
import type {User} from './type';

// 变量状态类型
type UserSelectState = {
    keyword: string;
    users: User[];
    selectedUserIds: string[];
}

export function userSelect(state: UserSelectState){
    const {
        // 需要在行为方法 toggleSelectAll/toggleSelect 中使用，抽取变量
        selectedUserIds,
        keyword,
    } = state;
    // 需要在行为方法 toggleSelectAll 中使用，抽取变量
    const selectedUserIdSet = new Set<string>(selectedUserIds);
    // 需要在行为方法 toggleSelectAll 中使用，抽取变量
    const displayUsers: User[] = [];
    // 需要在行为方法 toggleSelectAll 中使用，抽取变量
    const allSelectedStatus: 'none' | 'some' | 'all' = 'none';
    return {
        keyword,
        displayUsers,
        selectedUserIdSet,
        allSelectedStatus,
        inputKeyword(keyword: string){
            // 改变关键词，过滤 displayUsers
            return {...state, keyword};
        },
        toggleSelect(id: string){
            // 影响 selectedUserIds 选中 id，简单标成空数组以示改变。
            // 可通过 selectedUserIdSet 和 selectedUserIds 推测
            selectedUserIds;
            selectedUserIdSet;
            return {...state, selectedUserIds:[]};
        },
        toggleSelectAll(){
            // 全部反选，影响 selectedUserIdSet。
            // 可通过 allSelectedStatus 和 displayUser 结合 selectedUserIds 推测。
            // 简单标成空数组以示改变
            displayUser;
            allSelectedStatus;
            selectedUserIds;
            return {...state, selectedUserIds:[]};
        },
        loadUsers(users: User[]){
            // 加载原始用户列表，同样会影响 displayUsers
            return {...state, users};
        }
    }
}
```

**6. 实现行为方法**

```ts
// model.ts
import type {User} from './type';

// 变量状态类型
type UserSelectState = {
    keyword: string;
    users: User[];
    selectedUserIds: string[];
}

export function userSelect(state: UserSelectState){
    const {
        selectedUserIds,
        keyword,
        users
    } = state;
    const selectedUserIdSet = new Set<string>(selectedUserIds);
    // 过滤可视用户列表
    const displayUsers: User[] = users.filter((user)=>{
        return user.name.includes(keyword.trim());
    });
    const allSelectedStatus: 'none' | 'some' | 'all' = (
        // 采用函数表达式计算较复杂的状态值
        function computeAllSelectedStatus(): 'none' | 'some' | 'all' {
            const [
                selected,
                unselected
            ] = displayUsers.reduce((result, user)=>{
                const [selectedUsers, unselectedUsers] = result;
                if(selectedUserIdSet.has(user.id)){
                    return [
                        selectedUsers.concat(user), 
                        unselectedUsers
                    ];
                }
                return [selectedUsers, unselectedUsers.concat(user)];
            }, [[], []]);
            if(!displayUsers.length || !selected.length){
                return 'none';
            }
            if(displayUsers.length === selected.length){
                return 'all';
            }
            return 'some';
        }
    )();
    return {
        keyword,
        displayUsers,
        selectedUserIdSet,
        allSelectedStatus,
        inputKeyword(keyword: string){
            return {...state, keyword};
        },
        toggleSelect(id: string){
            // 反选
            if(selectedUserIdSet.has(id)){
                return {
                    ...state,
                    selectedUserIds: selectedUserIds.filter((user)=>{
                        return user.id!==id;
                    })
                };
            }
            return {
                ...state,
                selectedUserIds: selectedUserIds.concat(id)
            }
        },
        toggleSelectAll(){
            // 全部反选
            // 如过滤出的可视化用户为 0 条记录时，不必作出改变
            if(!displayUsers.length){
                return state;
            }
            const toggleIds = displayUsers.map((user)=>user.id);
            // 没有任何选中项或部分选中时，全选
            if(allSelectedStatus!=='all'){
                const uniqueIdSet = new Set(selectedUserIds.concat(toggleIds));
                return {
                    ...state,
                    selectedUserIds: [...uniqueIdSet]
                }
            }
            const toggleIdSet = new Set<string>(toggleIds);
            // 全选时，去除所有显示用户的选中状态
            return {
                ...state, 
                selectedUserIds: selectedUserIds.filter((id)=>{
                    return !toggleIdSet.has(id);
                })
            };
        },
        loadUsers(users: User[]){
            return {...state, users};
        }
    }
}
```

### render 过程中对库进行初始化

如只希望作初始化处理，并不关心数据变更，推荐使用 [useStaticModel](/zh/react-state/api?id=usestaticmodel) API。该 API 返回的静态实例对象不会订阅状态变更。

```ts
import {model} from '@airma/react-hooks';

const userSelectStore = model(userSelect).createStore().asGlobal();

const Child = ()=>{
    const {keyword, inputKeyword} = userSelectStore.useModel();
    return ......;
}

const Component = (props: Props)=>{
    // 使用静态模型初始化库默认状态
    userSelectStore.useStaticModel(props.defaultState);

    return (
        <div>
            <Child />
        </div>
    );
}
```

### 其他用法

其他用法可参考 @airma/react-state [引导](/zh/react-state/guides)部分。

## @airma/react-effect

### 如何使用库

对一个会话而言， @airma/react-effect 库系统的最佳使用方案是只设置一个工作者 useQuery/useMutation ，以及多个触发者 useSession/useLoadedSession 。通过触发者触发工作者运行的方式可以减少不必要的编码困惑。尽量减少一个**会话库**对应多个 useQuery/useMutation 的情况。

**不太推荐**

```ts
const Child1 = ()=>{
    const [
        sessionState,
        trigger,
        execute
    ] = fetchUserStore.useSession();
    return ......;
}

const Child2 = ()=>{
    // 通过调用 useSession 的 trigger 和 execute 都会被触发，
    // 虽然同库/键的会话被同时触发时，只有一个能运行异步函数，但容易造成编码上的困惑
    const [
        sessionState,
        trigger,
        execute
    ] = fetchUserStore.useQuery([]);
    return ......;
}

const Component = ()=>{
    // 通过调用 useSession 的 trigger 和 execute 都会被触发，
    // 虽然同库/键的会话被同时触发时，只有一个能运行异步函数，但容易造成编码上的困惑
    const [
        sessionState,
        trigger,
        execute
    ] = fetchUserStore.useQuery([]);

    return (
        <div>
            <Child1 />
            <Child2 />
        </div>
    );
}
```

**推荐**

```ts
const Child1 = ()=>{
    const [
        sessionState,
        trigger,
        execute
    ] = fetchUserStore.useSession();
    return ......;
}

const Child2 = ()=>{
    const [
        sessionState,
        trigger,
        execute
    ] = fetchUserStore.useSession();
    return ......;
}

const Component = ()=>{
    const [
        sessionState,
        trigger,
        execute
    ] = fetchUserStore.useQuery([]);

    return (
        <div>
            <Child1 />
            <Child2 />
        </div>
    );
}
```

### 避免对会话返回结果进行不必要的 setState 和操作

会话状态 sessionState 就是一种 state，如果不需要对数据进行动态操作，直接使用 sessionState.data 更好。

**不推荐**

```ts
const Component = ()=>{
    const [users, setUsers] = useState([]);
    const [
        sessionState,
        trigger,
        execute
    ] = fetchUserStore.useQuery([]);

    useResponse.useSuccess((data)=>{
        // 如无需对返回数据进行动态操作，
        // 则不需要对返回数据进行 setState，
        // 直接用 sessionState.data 更好
        setUsers(data);
    },sessionState);

    return (
        <div>
            <Child users={users} />
        </div>
    );
}
```

**推荐**

```ts
const Component = ()=>{
    const [
        sessionState,
        trigger,
        execute
    ] = fetchUserStore.useQuery({
        variables: [],
        // 可以使用 defaultData 代替 users 的初始状态
        defaultData: []
    });

    const users = sessionState.data;

    return (
        <div>
            <Child users={users} />
        </div>
    );
}
```

### 尽量避免对没有设置 variables 的会话使用加载更新触发或触发器触发的方式

加载更新触发，或使用触发器触发会话工作都需要以来 variables 预设参数。如果会话没有提供 variables ，则默认以 variables 为 []，即无参形式运行，这可能导致会话异步函数执行异常。


**不推荐**

```ts
const Component = (props:Props)=>{
    const [
        sessionState,
        trigger,
        execute
    ] = fetchUserStore.useQuery({
        defaultData: [],
        // 无 variables 尽管可以运行，但十分危险
        deps: [props.version]
    });

    const users = sessionState.data;

    return (
        <div>
            <Child users={users} />
        </div>
    );
}
```

**不推荐**

```ts
const Component = (props:Props)=>{
    const [
        sessionState,
        trigger,
        execute
    ] = fetchUserStore.useQuery({
        defaultData: [],
    });

    const callTrigger = ()=>{
        // 无 variables 尽管可以运行，但十分危险
        trigger();
    }

    const users = sessionState.data;

    return (
        <div>
            <Child users={users} />
        </div>
    );
}
```

**推荐**

```ts
const Component = ()=>{
    const [
        sessionState,
        trigger,
        execute
    ] = fetchUserStore.useQuery({
        defaultData: []
    });

    const callExecute = ()=>{
        // execute 所需的参数类型与异步函数完全一致，安全度会高一些。
        // typescript 会帮助检查
        execute();
    }

    const users = sessionState.data;

    return (
        <div>
            <Child users={users} />
        </div>
    );
}
```

### 其他用法

其他用法可参考 @airma/react-effect [引导](/zh/react-effect/guides)部分。

下一节[API](/zh/react-hooks/api)