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

## v18.4.3

* 修复 signal.effect 和 signal.watch 无法在初始化阶段运行回调函数的问题。

## v18.4.4

 * **注意**：因接口设计合理性问题，去除 signal.effect 和 signal.watch 功能。
 * 新增 signal.useEffect 功能，以方便监听模型实例变化。

## v18.5.0

* 添加 `model.createCacheField` API，用于缓存模型实例中的数据字段。
* 删除部分废弃的 API。

## v18.5.0

* 重命名 `model.createCacheField` API 为 `model.createField` API。
* 添加 `model.createMethod` API。

## v18.5.2

* 重新定义了 `signal.useEffect` 的行为特性。
* 添加了 `signal.useWatch` API。
* 修复了副作用引起的 React 18.+ 严格模式下的渲染问题。

## v18.5.4

* 强化了 `model.createField` API，支持无缓存依赖时，返回最新值。

## v18.5.5

* 优化 `model.createField` API，使无依赖字段是否变化依赖于get方法返回值是否变化。

## v18.5.6

* 修复无法连接父级 Provider store 的问题。

## v18.5.7

* 开始支持对 connection 对象的访问。

## v18.5.8

* 重命名 `model().createStore` 为 `model().createKey`。
* 重命名 `model().createStore().static()` 为 `model().createKey().createStore()`
* 向静态库添加了 `getInstance` 和 `initialize` 方法

## v18.5.9

* 更新npm文档