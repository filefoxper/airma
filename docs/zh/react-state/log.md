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