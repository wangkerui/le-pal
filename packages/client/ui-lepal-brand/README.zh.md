---
description: "在 Web 与桌面客户端的侧边栏和首页展示 LePal 名称与标识。"
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-lepal-brand

[English](README.md) | 中文

## 概述

用 LePal 的名称与标识替换侧边栏和首页上的上游品牌。Web 组合包默认挂载本包，因此 Web profile 与桌面应用无需插件开关即可展示。它以更低的优先级占用与官方品牌相同的插槽，部署方仍可覆盖任一表面。本包不提供设置，也不产生模型可见内容。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [延伸阅读](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与待办](#known-limitations-and-deferred-work)
- [开发者说明](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

与 Web 组合包已有的官方品牌行一起挂载即可。

### 何时选择

当部署需要展示 LePal 产品标识而非上游标识时选择本包。请保留 `ui-brand-official`：本包只是以更低优先级覆盖其占位，移除官方品牌行会让相关表面变空。

### 最小配置

本包没有配置字段。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现细节——点击展开</summary>

`apply` 以优先级 `-1` 注册 `sidebar.brand.mark`、`sidebar.brand.name` 和 `conversation.hero.brand.mark` 三个占位。使用默认优先级的后续注册会胜出，因此部署方自己的品牌覆盖仍然有效。标识是一个内联 SVG 组件，被两个表面共用；语言包位于客户端内置字典中。

</details>

-----

<a id="further-exploration"></a>
## 延伸阅读

- [Web Client](../../../docs/subsystems/web-client.zh.md) —— 插件组合与品牌插槽。
- [Brand](../../../docs/subsystems/web-client.zh.md) —— 官方品牌如何占用相同插槽。
- [Client UI kit](../ui-primitives/README.zh.md) —— 标识渲染所用的基础组件。

-----

<a id="model-experience"></a>
## 模型体验

无，因为本浏览器插件不产生模型可见内容。

#### KV Cache effect

无；品牌仅渲染在客户端界面中。

## Known Limitations and Deferred Work

- 标识是固定的内联 SVG，需要其他图形的部署应提供自己的占位组件。

<a id="dev-note"></a>
### 开发备注

无。
