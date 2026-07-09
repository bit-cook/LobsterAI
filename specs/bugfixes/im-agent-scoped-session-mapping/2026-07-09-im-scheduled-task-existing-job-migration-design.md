# 定时任务 IM 群聊旧 Job 迁移补充设计

## 1. 概述

此前修复了定时任务表单中，选择某个 IM Bot 后群聊候选重复的问题，并在创建/编辑任务时把群聊 delivery 绑定到选中 Bot 对应的 agent。

后续验证发现，已经保存在 OpenClaw cron state 中的旧任务不会自动经过创建/编辑归一化。用户直接点击“立即运行”，或者旧任务自然到点执行，仍会使用旧 job 配置。结果可能是 IM 移动端收到消息，但 LobsterAI 本地会话没有展示在期望的群聊会话中。

## 2. 根因

OpenClaw cron job 是持久化配置。创建/编辑任务会经过 LobsterAI IPC handler，但手动运行只调用 `cron.run(id)`，自然到点执行则完全由 OpenClaw cron 调度。两条路径都不会重新执行创建/编辑时的 IM announce 归一化。

对于飞书群聊，OpenClaw 文档和插件测试都把群聊写成：

```text
agent:<agentId>:feishu:group:<chatId>
```

不带 `accountId`。因此旧 job 如果没有保存正确 `agentId`，仅靠 `delivery.accountId` 无法在运行后定位到正确的 agent-scoped 群聊会话。

## 3. 方案

将定时任务 IM announce 归一化拆成两层：

1. 本地轻量归一化：只读取本地 `im_session_mappings` 和 `platformAgentBindings`，负责设置 `sessionTarget = isolated`、转换 `systemEvent` payload、剥离 `delivery.to` 中的 conversation 前缀，并按选中 Bot 的绑定 agent 修正 `agentId`。
2. 网关历史恢复：调用 gateway `sessions.list` 恢复大小写敏感 IM target 的原始 casing/account。该步骤较重，仅保留在创建/编辑路径。

旧任务迁移只使用本地轻量归一化，保持幂等：

1. 只处理 `delivery.mode = announce` 且能解析到 LobsterAI IM 平台的任务。
2. 只比较并 patch 稳定字段：`sessionTarget`、`payload`、`delivery`、`agentId`、`sessionKey`。
3. 仅当归一化后字段发生变化时调用 `cron.update`。
4. 手动立即执行前先迁移该 job，再调用 `cron.run`。
5. OpenClaw gateway 启动成功后后台扫描现有 cron jobs 并执行同一套迁移，不阻塞任务列表加载。

## 4. 风险控制

- 不在列表加载同步迁移，避免 UI 等待 cron list/update。
- 迁移不调用 `sessions.list`，避免引入 10 秒级 gateway 查询。
- 不覆盖已经绑定到其它非 main agent 的任务，只修正缺失 agent 或显式 main agent 的 IM 群聊任务。
- 迁移是幂等的；第一次修正旧 job，后续扫描不会重复 patch。

## 5. 验收标准

1. 旧飞书群聊定时任务不经过重新编辑，点击“立即运行”后，消息能同步到 LobsterAI 对应 agent 的群聊会话。
2. OpenClaw 启动后的后台迁移完成后，旧任务自然到点执行也使用修正后的 agent 归属。
3. 手动运行迁移路径不调用 gateway `sessions.list`。
4. 新建/编辑任务仍保留原有 gateway casing/account 恢复能力。
