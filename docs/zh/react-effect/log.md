# 变更日志

## v 17.1.0

* 增加 provide API，未来将彻底代替 withSessionProvider
* SessionProvider props 增加 keys 字段，在未来将彻底取代 value 的作用
* GlobalProvider 被替代称 GlobalSessionProvider。

## v 17.1.5

* 增加 Strategy.validate 策略。

## v 17.1.7

* 跟随 @airma/react-state 问题修复升级。

## v 17.1.8

* 跟随 @airma/react-state 问题修复升级。

## v 18.0.0

* 为 session state 添加了 `sessionLoaded` 和 `variables` 字段
* 添加 `useLazyComponent` API

## v 18.1.0

* 添加了 `useResponse` hook 接口，用于副作用处理会话状态变化
* 添加了 `Strategy.effect` 策略，用于副作用处理会话状态变化

## v 18.2.0

* 弃用 GlobalSessionProvider
* 弃用 useLazyComponent
* 添加了 ConfigProvider 代替 GlobalSessionProvider

## v 18.2.1

* 添加了 `loaded` 会话配置项目
* 恢复了 `useLazyComponent` API

## v 18.2.3

* 修复了 `Strategy.debounce`  影响 会话状态 的问题
* 修复了 `Strategy.reduce` 处理了舍弃值的问题
* 修复了 `useResponse` typescript 无法引用问题

## v 18.2.4

* 升级 `Strategy.reduce` ，新增参数 states : `Strategy.reduce(prev, current, states:[prevState, currentState])`。

## v 18.2.9

* 新增 `Strategy.response` 策略代替 `Strategy.effect`

## v18.2.10

* 解决 `Strategy.response` 和 `useResponse` 关于响应 fetching 预设 session 状态的问题。

## v18.2.11

* 在 sessionState 中增加 `fetchVersion` 字段，该字段初始值为 undefined，查询结果返回后，以number形式增加。

## v18.2.12

* 解决 `useResponse` typescript问题

## v18.3.0

* 移除废弃 API
* 简化当前 API
* 新增流式调用 API session

## v18.3.1

* 无强制手工触发异常更改为警告。

## v18.3.2

* 优化触发会话的渲染过程
* useSession 支持 execute 传参执行方法。

## v18.3.3

* 修改了没有 variables 设置时，trigger的警告信息。

## v18.4.0

* 提升渲染性能。

## v18.4.2

* 修复了由 @airma/react-state 升级导致的 useQuery/useSession 手动 trigger 失效问题。

## v18.4.3

* 为 Strategy.cache 策略增加了 static 字段，用于表示静态数据。
* 为 store 增加了 `static` 方法，用于定义静态库。

## v18.4.4

* 修复了 Strategy.cache 缓存查询失败时未回滚数据的问题。

## v18.4.5

* 修复了 Strategy.cache 缓存查询失败时,回滚数据不一定正确的问题。

## v18.4.7

* 修复 useResponse 和 useResponse.* 响应加载时的旧响应问题。

## v18.4.11

* 修复 useMutation 共享模式下异常问题

## v18.5.0

* 升级 useQuery/useMutation 在无参情况下可代替 useSession 工作。
* 升级 Strategy.validate 策略，支持异步校验函数。

## v18.5.1

* 继续升级 Strategy.validate 策略，支持接受运行时参数。

## v18.5.2

* 修复 React@18.+ 严格模式下的问题。


## v18.5.3

* 向会话状态中添加了 `visited`, `lastSuccessfulRound`, `lastFailedRound`, `lastSuccessfulVariables` , `lastFailedVariables` 字段。

## v18.5.4

* 修改 `sessionState.lastSuccessfulVariables` 为 `sessionState.lastSuccessfulRoundVariables`。  
* 修改 `sessionState.lastFailedVariables` 为 `sessionState.lastFailedRoundVariables`。

## v18.5.5

* useResponse 和 Strategy.response 系列接口支持 cleanup 副作用清理函数。
* 会话状态添加 online 属性，用于判断当前会话是否在线。
* Strategy.validate 添加最新会话状态为第二参数。

## v18.5.6

* 修复 Strategy.response 系列 cleanup 副作用清理函数不起作用问题

## v18.5.7

* 修复关于 useSession 与无配置 useQuery/useMutation 同时存在时触发器可能会触发多次会话工作的问题
* 修复 trigger/execute 人工调用函数返回 void 值的问题。

## v18.5.8

* 修复 SessionState online 字段未暴露的问题。
* 修复 Strategy.response 系列接口 cleanup 副作用清理函数运行时机问题。

## v18.5.9

* 修复 useLazyComponent 解析 memo 组件时报错的问题。

## v18.5.10

* 为 GlobalConfig 增加了 `experience` 字段，用于体验下一个中间版本变化的特性。

## v18.5.12

* 变更 `session().createStore` 为 `session().createKey`
* 变更 `session().createStore().static()` 为 `session().createKey().createStore()`

## v18.5.13

* 新增 payload 方法至 trigger 和 execute 方法: trigger.payload(x)(); 当一个会话完成时，sessionState 中会带有该 payload 信息。
* 新增 session().createKey() 接口用于创建带有常用API的会话键
* 至当前版本开始，原 session().createStore() 创建的库为静态库，但因为库中含有键，所以 provide 后，依然可以产生相应的动态库，因此是向下兼容的

## v18.5.14

* 在 useQuery/useMutation 的 config 中新增 `ignoreStrategyWrapper` 选项用于忽略 ConfigProvider 提供的公共策略。