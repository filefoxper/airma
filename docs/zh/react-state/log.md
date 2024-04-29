# 更新日志

## v 17.3.0

* 提供了 provide 接口
* 提供了 StoreProvider props 的 keys 来代替 value 

## v17.3.2

* 修复多点使用时，useModel或useSelector 无法链接的问题。

## v17.3.3

* 标记 factory 为废弃 API（在 v18.0.0 之前可继续使用）。

## v17.3.4

* 修复 行为方法 在子组件的 useEffect 中调用无效的问题。
* 修复 useRefreshModel 无法初始化 connection 链接的问题。
* 修复 React.Strict 模式下注册监听管道内存泄漏的问题。

## v17.3.6

* 修复 useModel useRefreshModel 关于 Modelkey 使用的 类型问题。

## v18.0.0

* 重构了 dispatch 逻辑

## v18.0.2

* 提供了相对更简单有效的 typescript 系统
* 合并了 @airma/core 代码，并不再依赖这个主包。

## v18.1.0

* 对 dispatch 队列逻辑进行单例化处理。
* 优化了不必要的 `useState` hook 应用。

## v18.2.0

* 增加了 ConfigProvider 配置组件
* 弃用 `useRefreshModel` API
* 弃用 `useRefresh` API

## v18.3.0

* 移除废弃 API
* 简化当前 API
* 新增流式调用 API model

## v18.3.1

* 新增了API useStaticModel

## v18.3.2

* 优化了全局 store 的订阅过程。

## v18.4.0

* 提升渲染性能
* 支持在 render 运行时使用行为方法。
* 新增了 `useSginal` API

## v18.4.1

* 限定 signal.effect 和 signal.watch 只能在 render 阶段调用。

## v18.4.2

* 修复了自 v18.4.0 版本开始 model 无法订阅异步阶段发生的 action 问题。