# MCP Registry 套件展示设计文档

## 1. 概述

### 1.1 背景

MCP 市场的既有模型是一张市场卡片对应一条已安装 server。企查查授权后会创建多条共享同一 `registryId` 的 server，因此需要在管理界面作为一个套件展示。原实现直接判断 `registryId=qichacha`，卡片协议和地址也写死为企查查数据，无法供其他多 server 产品复用。

此外，企查查是本地管理的特殊市场条目，普通 MCP 来自在线配置。企查查需要稳定出现在市场第 4 位，并兼容在线条目数量变化。

### 1.2 目标

- 使用通用 registry 元数据声明套件展示，不在聚合层判断企查查 ID。
- 保持现有 `mcp_servers` 记录和 OpenClaw MCP 配置格式不变。
- 继续使用 `registryId` 作为套件成员的关联键。
- 企查查固定使用 1 基坐标 `marketplacePosition: 4`。
- 保留企查查现有 API key 授权流程，不修改授权窗口。

## 2. 用户场景

### 场景 1：在线市场条目充足

**Given** 在线市场至少返回 3 个普通 MCP  
**When** 本地企查查条目与在线列表合并  
**Then** 企查查显示在全量市场第 4 位。

### 场景 2：在线市场条目不足

**Given** 在线市场返回少于 3 个普通 MCP  
**When** 本地企查查条目与在线列表合并  
**Then** 企查查追加到已有条目末尾，不产生空位或数组越界。

### 场景 3：管理 registry 套件

**Given** 多条已安装 server 共享一个声明为 `bundle` 的 registry  
**When** 用户进入已安装页  
**Then** 这些 server 显示为一张套件卡片，并可统一启停和卸载。

### 场景 4：查看已授权的企查查

**Given** 用户已授权并安装企查查 MCP  
**When** 用户查看 MCP 市场  
**Then** 企查查卡片与其他已安装条目一样仅显示状态，其中状态文案为“已授权”，不在市场提供卸载按钮。

### 场景 5：兼容历史数据

**Given** 历史数据中多条 server 共享 `registryId`，但当前 registry 元数据缺失  
**When** 用户进入已安装页  
**Then** 客户端根据相同 `registryId` 的多条记录推断为套件，保持聚合展示。

## 3. 功能需求

### FR-1：市场位置

`marketplacePosition` 使用 1 基坐标。插入索引限制在 `0..list.length`：目标位置存在时插入该位置，目标位置超过列表长度时追加到末尾。远端若包含同 ID 条目，使用本地管理版本并去重。

### FR-2：套件声明

`McpRegistryEntry.kind` 支持 `server` 和 `bundle`。字段缺失时按既有单 server 条目处理，保证在线历史格式兼容。

### FR-3：通用聚合

已安装项满足以下任一条件时聚合：

- registry 元数据声明 `kind=bundle`；
- 同一 `registryId` 实际存在多条 server，用于远端不可用和历史数据回退。

套件卡片的名称、描述和摘要优先读取 registry 元数据；协议和数量根据实际成员计算，不写死供应商信息。

### FR-4：批量管理

套件继续调用通用 `mcp:deleteByRegistryId` 和 `mcp:setEnabledByRegistryId` IPC。运行层保留独立 server，不新增套件表，也不改变 OpenClaw 同步格式。

企查查卸载入口仅保留在已安装页。用户点击套件卡片的删除按钮后进入统一确认流程，并执行与原市场卸载按钮相同的 `deleteByRegistryId` 链路。当前 API key 授权方案没有保存 OAuth token，也没有实现 revoke 请求，因此本次不新增无凭据的 revoke 调用。

## 4. 实现方案

- `mcpRegistry.ts`：企查查声明 `kind=bundle`、`marketplacePosition=4`。
- `mcpRegistryPresentation.ts`：提供市场列表合并和已安装项聚合纯函数。
- `McpManager.tsx`：消费通用聚合结果，仅在授权入口保留 `oauthProvider=qichacha` 特殊处理。
- `mcp.ts`：保留远端可选的 `kind` 元数据，为后续在线套件展示扩展预留格式。`marketplacePosition` 仅用于本地托管条目的合并策略，不改变普通在线条目的顺序。

本次不实现通用多 server 安装协议。未来市场需要下发新套件时，可在当前 `bundle` 展示模型上增加 server 模板数组和事务化批量安装 IPC，不需要重新修改已安装页聚合与批量管理逻辑。

## 5. 边界情况

| 场景 | 处理方式 |
|------|---------|
| 在线列表为空 | 企查查成为第 1 项 |
| 在线列表只有 1 至 2 项 | 企查查追加到末尾 |
| 在线列表包含企查查 | 删除远端同 ID 条目，使用本地管理定义 |
| 套件只剩一条 server | registry 仍声明为 bundle 时继续聚合 |
| registry 元数据不可用 | 同 registryId 多记录时推断为套件 |
| 套件包含多种协议 | 不显示单一协议标签，仍显示成员数量 |
| 套件成员摘要不一致 | 不显示误导性的单一地址摘要 |

## 6. 涉及文件

- `src/renderer/types/mcp.ts`
- `src/renderer/data/mcpRegistry.ts`
- `src/renderer/services/mcp.ts`
- `src/renderer/services/mcpRegistryPresentation.ts`
- `src/renderer/services/mcpRegistryPresentation.test.ts`
- `src/renderer/components/mcp/McpManager.tsx`

## 7. 验收标准

- 全量市场中企查查在普通条目不少于 3 个时位于第 4。
- 在线条目少于 3 个时企查查安全追加到末尾。
- 已安装页不包含企查查专属聚合判断和硬编码 URL。
- 市场中的已授权企查查仅显示“已授权”，不显示卸载按钮。
- 企查查仍显示一张卡片、实际服务数量、统一启停和卸载入口。
- 其他相同 registryId 的多 server 数据可复用同一聚合路径。
- 单 server 历史市场条目展示和安装流程不变。
- 卡片分隔符显示为 `·`，不再显示误写的“路”。
