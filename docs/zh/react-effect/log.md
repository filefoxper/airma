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
